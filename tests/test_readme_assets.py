import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_readme_image_references_exist():
    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    image_paths = re.findall(r"!\[[^\]]*\]\(([^)]+)\)", readme)
    local_image_paths = [
        image_path
        for image_path in image_paths
        if not image_path.startswith(("http://", "https://"))
    ]

    assert local_image_paths
    assert all((ROOT / image_path).exists() for image_path in local_image_paths)
