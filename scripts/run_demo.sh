#!/usr/bin/env bash
set -euo pipefail

export MODEL_PROVIDER="${MODEL_PROVIDER:-heuristic}"
export OUTPUT_DIR="${OUTPUT_DIR:-runs}"
PYTHON_BIN="${PYTHON:-python3}"

"${PYTHON_BIN}" -m uvicorn refund_demo.web:app --host "${HOST:-127.0.0.1}" --port "${PORT:-8000}" --reload
