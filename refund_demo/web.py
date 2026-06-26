import copy
import io
import json
import os
import tempfile
import urllib.error
import urllib.request
import zipfile
from dataclasses import replace
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from . import __version__
from .config import AppConfig, load_dotenv
from .providers import build_provider
from .view_model import ORCHESTRATION_PATTERN, SCENARIOS, build_case_preview, public_scenarios
from .workflow import load_case, run_refund_workflow

ROOT = Path(__file__).resolve().parents[1]
SAMPLES_DIR = ROOT / "samples" / "inputs"
STATIC_DIR = Path(__file__).resolve().parent / "static"


class RunRequest(BaseModel):
    scenario: str = "pending_refund"
    provider: Optional[str] = None
    overrides: Dict[str, Any] = Field(default_factory=dict)


class ScanRequest(BaseModel):
    url: str


def create_app(config: Optional[AppConfig] = None) -> FastAPI:
    load_dotenv()
    base_config = config or AppConfig.from_env()
    runs_dir = Path(base_config.output_dir)
    runs_dir.mkdir(parents=True, exist_ok=True)

    app = FastAPI(
        title="False Success Lab",
        version=__version__,
        description="Interactive lab for false-success scenarios and scanner report cards.",
    )
    if base_config.allowed_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=base_config.allowed_origins,
            allow_methods=["GET", "POST", "OPTIONS"],
            allow_headers=["*"],
        )
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
    app.mount("/runs", StaticFiles(directory=str(runs_dir)), name="runs")

    @app.get("/", include_in_schema=False)
    def index() -> FileResponse:
        return FileResponse(STATIC_DIR / "index.html")

    @app.get("/api/health")
    def health() -> Dict[str, str]:
        return {"status": "ok", "provider": base_config.model_provider}

    @app.get("/api/config")
    def current_config() -> Dict[str, str]:
        return {
            "default_provider": base_config.model_provider,
            "ollama_model": base_config.ollama_model,
            "ollama_base_url": base_config.ollama_base_url,
            "orchestration_pattern": ORCHESTRATION_PATTERN,
        }

    @app.get("/api/scenarios")
    def scenarios() -> List[Dict[str, Any]]:
        payload = public_scenarios()
        for scenario in payload:
            case = load_case(str(SAMPLES_DIR / scenario["file"]))
            scenario["support_case_preview"] = build_case_preview(case)
        return payload

    @app.post("/api/runs")
    def run_scenario(request: RunRequest) -> Dict[str, Any]:
        scenario = SCENARIOS.get(request.scenario)
        if scenario is None:
            raise HTTPException(status_code=404, detail=f"unknown scenario '{request.scenario}'")

        provider_name = request.provider or base_config.model_provider
        run_config = replace(base_config, model_provider=provider_name)
        try:
            provider = build_provider(run_config)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        case = _apply_demo_overrides(
            load_case(str(SAMPLES_DIR / scenario["file"])),
            request.overrides,
        )
        result = run_refund_workflow(case, config=run_config, provider=provider)
        report = json.loads(result.report_path.read_text(encoding="utf-8"))
        report["demo_overrides"] = request.overrides
        report["links"] = {
            "summary": f"/runs/{result.run_id}/summary.json",
            "html_report": f"/runs/{result.run_id}/report.html",
            "receipts": f"/runs/{result.run_id}/receipts.jsonl",
        }
        return report

    @app.post("/api/scans/github")
    def scan_public_github_repo(request: ScanRequest) -> Dict[str, Any]:
        url = request.url.strip()
        if not url.startswith("https://github.com/"):
            raise HTTPException(
                status_code=400,
                detail="Public scans currently support https://github.com/org/repo URLs.",
            )
        try:
            return _scan_with_agent_consistency(url)
        except ImportError as exc:
            raise HTTPException(
                status_code=503,
                detail=(
                    "The installed agent-consistency package does not expose the scanner yet. "
                    "Install the current package repo or run `agent-consistency scan` locally."
                ),
            ) from exc
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    return app


def _scan_with_agent_consistency(target: str) -> Dict[str, Any]:
    from agent_consistency.scanner import render_scan_markdown, scan_path, scan_target

    if _is_github_repo_url(target):
        report = _scan_github_zipball(target, scan_path)
    else:
        report = scan_target(target)
    return {
        "report": report.to_dict(),
        "markdown": render_scan_markdown(report),
    }


def _scan_github_zipball(target: str, scan_path):
    owner, repo = _parse_github_repo_url(target)
    archive_bytes = _download_github_archive(owner, repo)
    with tempfile.TemporaryDirectory(prefix="false-success-scan-") as tmp:
        checkout = _extract_zipball(archive_bytes, Path(tmp))
        return scan_path(checkout, repository=f"{owner}/{repo}", source=target)


def _is_github_repo_url(target: str) -> bool:
    try:
        _parse_github_repo_url(target)
    except ValueError:
        return False
    return True


def _parse_github_repo_url(target: str) -> tuple[str, str]:
    parsed = urlparse(target)
    parts = [part for part in parsed.path.strip("/").split("/") if part]
    if parsed.scheme != "https" or parsed.netloc.lower() != "github.com" or len(parts) < 2:
        raise ValueError("Public scans currently support https://github.com/org/repo URLs.")
    return parts[0], parts[1].removesuffix(".git")


def _github_json(url: str) -> Dict[str, Any]:
    payload = _download_bytes(url, max_bytes=2_000_000)
    return json.loads(payload.decode("utf-8"))


def _download_github_archive(owner: str, repo: str) -> bytes:
    max_bytes = int(os.environ.get("FALSE_SUCCESS_MAX_ARCHIVE_BYTES", "25000000"))
    for branch in ("main", "master"):
        archive_url = f"https://github.com/{owner}/{repo}/archive/refs/heads/{branch}.zip"
        try:
            return _download_bytes(archive_url, max_bytes=max_bytes)
        except ValueError as exc:
            if "not found" not in str(exc).lower():
                raise

    metadata = _github_json(f"https://api.github.com/repos/{owner}/{repo}")
    branch = str(metadata.get("default_branch") or "main")
    archive_url = f"https://github.com/{owner}/{repo}/archive/refs/heads/{branch}.zip"
    return _download_bytes(archive_url, max_bytes=max_bytes)


def _download_bytes(url: str, *, max_bytes: int) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "false-success-lab"})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            content_length = response.headers.get("content-length")
            if content_length and int(content_length) > max_bytes:
                raise ValueError("Repository archive is too large for the hosted demo.")
            payload = response.read(max_bytes + 1)
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            raise ValueError("GitHub repository was not found or is not public.") from exc
        raise
    if len(payload) > max_bytes:
        raise ValueError("Repository archive is too large for the hosted demo.")
    return payload


def _extract_zipball(archive_bytes: bytes, destination: Path) -> Path:
    with zipfile.ZipFile(io.BytesIO(archive_bytes)) as archive:
        destination_root = destination.resolve()
        for member in archive.infolist():
            member_target = (destination / member.filename).resolve()
            try:
                member_target.relative_to(destination_root)
            except ValueError as exc:
                raise ValueError("Repository archive contains an unsafe path.") from exc
        archive.extractall(destination)

    directories = [path for path in destination.iterdir() if path.is_dir()]
    return directories[0] if len(directories) == 1 else destination


def _apply_demo_overrides(case: Dict[str, Any], overrides: Dict[str, Any]) -> Dict[str, Any]:
    updated = copy.deepcopy(case)
    provider_status = overrides.get("provider_status")
    if provider_status in {"settled", "pending"}:
        updated.setdefault("provider", {})["refund_status"] = provider_status

    if "omit_previous_refund_count" in overrides:
        updated.setdefault("demo", {})["omit_previous_refund_count"] = bool(
            overrides["omit_previous_refund_count"]
        )

    if "stale_policy" in overrides:
        stale_policy = bool(overrides["stale_policy"])
        policy_version = str(updated["policy"]["version"])
        updated["latest_policy_version"] = "policy-v14" if stale_policy else policy_version

    return updated


app = create_app()
