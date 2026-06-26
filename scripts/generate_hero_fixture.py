"""Regenerate the static-mode hero fixture from a real agent-consistency run.

The landing-page hero replays a live refund run where the gate blocks an
unconfirmed completion. When the FastAPI backend is available the page calls
``/api/runs`` directly; for the static (GitHub Pages) build it falls back to
this committed fixture. The fixture is produced by actually running the
workflow through ``agent-consistency`` -- it is never hand-authored.

Usage:
    python scripts/generate_hero_fixture.py
"""

import json
from pathlib import Path

from refund_demo.config import AppConfig
from refund_demo.providers import HeuristicProvider
from refund_demo.workflow import load_case, run_refund_workflow

ROOT = Path(__file__).resolve().parents[1]
HERO_SCENARIO = "pending_refund"
OUTPUT = ROOT / "refund_demo" / "static" / "hero_run.json"


def main() -> None:
    config = AppConfig(output_dir=str(ROOT / "runs"), consistency_on_violation="raise")
    case = load_case(str(ROOT / "samples" / "inputs" / f"{HERO_SCENARIO}.json"))
    result = run_refund_workflow(case, config=config, provider=HeuristicProvider())
    report = json.loads(result.report_path.read_text(encoding="utf-8"))
    OUTPUT.write_text(json.dumps(report, indent=2, sort_keys=True), encoding="utf-8")
    print(
        f"{OUTPUT.relative_to(ROOT)}: status={report['status']} "
        f"false_success_prevented={report['false_success_prevented']}"
    )


if __name__ == "__main__":
    main()
