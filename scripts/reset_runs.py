from pathlib import Path
from shutil import rmtree

ROOT = Path(__file__).resolve().parents[1]
RUNS_DIR = ROOT / "runs"


def main() -> None:
    RUNS_DIR.mkdir(exist_ok=True)
    for path in RUNS_DIR.iterdir():
        if path.name == ".gitkeep":
            continue
        if path.is_dir():
            rmtree(path)
        else:
            path.unlink()
    (RUNS_DIR / ".gitkeep").touch()
    print(f"Reset generated run artifacts in {RUNS_DIR}")


if __name__ == "__main__":
    main()
