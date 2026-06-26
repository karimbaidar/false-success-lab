import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Hero leads; scanner is demoted to a clearly secondary call to action.
REQUIRED_COPY = [
    "False Success Lab",
    'Agents claim "done." The gate makes them prove it.',
    "Now run it on your own repo.",
    "Scan a public GitHub repo",
    "Import a local scan report",
    "More scenarios",
    "false-success report card",
    "https://false-success-lab-api.vercel.app",
]

# The old scanner-first framing must be gone.
FORBIDDEN_COPY = [
    'Stop false "done" before it ships.',
    "Scan your AI workflow repo for unverified completion risks",
    "Scanner first",
    "Agent Reliability Control Center",
    "Try built-in scenarios",
    "done too early",
]


def test_static_demo_copy_is_gate_first():
    subprocess.run(["make", "static-demo"], cwd=ROOT, check=True)

    generated = "\n".join(
        [
            (ROOT / "dist" / "index.html").read_text(encoding="utf-8"),
            (ROOT / "dist" / "static" / "app.js").read_text(encoding="utf-8"),
            (ROOT / "dist" / "static" / "styles.css").read_text(encoding="utf-8"),
        ]
    )

    for phrase in REQUIRED_COPY:
        assert phrase in generated, f"missing required copy: {phrase!r}"

    for phrase in FORBIDDEN_COPY:
        assert phrase not in generated, f"forbidden copy still present: {phrase!r}"

    # The static build must ship the engine-produced hero fixture.
    assert (ROOT / "dist" / "static" / "hero_run.json").exists()
