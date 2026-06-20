import copy
import json
from dataclasses import replace
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
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


def create_app(config: Optional[AppConfig] = None) -> FastAPI:
    load_dotenv()
    base_config = config or AppConfig.from_env()
    runs_dir = Path(base_config.output_dir)
    runs_dir.mkdir(parents=True, exist_ok=True)

    app = FastAPI(
        title="Agent Consistency Refund Demo",
        version=__version__,
        description="Visual refund workflow demo for agent-consistency receipts.",
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

    return app


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
