from pathlib import Path

from refund_demo.config import AppConfig
from refund_demo.providers import HeuristicProvider
from refund_demo.workflow import load_case, run_refund_workflow

ROOT = Path(__file__).resolve().parents[1]
INPUTS = ROOT / "samples" / "inputs"


def main() -> None:
    config = AppConfig(output_dir=str(ROOT / "runs"), consistency_on_violation="raise")
    provider = HeuristicProvider()
    for path in sorted(INPUTS.glob("*.json")):
        case = load_case(str(path))
        result = run_refund_workflow(case, config=config, provider=provider)
        print(f"{path.name}: {result.status} -> {result.report_path}")


if __name__ == "__main__":
    main()
