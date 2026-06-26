import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

STATIC_MODE_MESSAGE = (
    "Static demo mode: public GitHub scanning requires the FastAPI backend. "
    "You can still import a local scan report or try built-in scenarios."
)

REQUIRED_COPY = [
    "False Success Lab",
    "Scan your AI workflow repo for unverified completion risks",
    "Scan a public GitHub repo",
    "Import local scan report",
    "Try built-in scenarios",
    STATIC_MODE_MESSAGE,
    "false-success report card",
    "https://false-success-lab-api.onrender.com",
]

FORBIDDEN_COPY = [
    "Agent Reliability Control Center",
    "world says done",
    "real world agrees",
    "refund demo",
    "Stop agents from saying",
    "Claims done too early",
    "done too early",
]


def test_static_demo_copy_is_scanner_first():
    subprocess.run(["make", "static-demo"], cwd=ROOT, check=True)

    generated = "\n".join(
        [
            (ROOT / "dist" / "index.html").read_text(encoding="utf-8"),
            (ROOT / "dist" / "static" / "app.js").read_text(encoding="utf-8"),
            (ROOT / "dist" / "static" / "styles.css").read_text(encoding="utf-8"),
        ]
    )

    for phrase in REQUIRED_COPY:
        assert phrase in generated

    for phrase in FORBIDDEN_COPY:
        assert phrase not in generated
