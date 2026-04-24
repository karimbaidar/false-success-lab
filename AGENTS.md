# AGENTS.md

## Project Structure

- FastAPI app and workflow code live in `refund_demo/`.
- Static browser UI lives in `refund_demo/static/`.
- Samples live in `samples/inputs/`.
- Tests live in `tests/`.

## Commands

- Install dev deps: `python -m pip install -r requirements-dev.txt`
- Run app: `MODEL_PROVIDER=heuristic python -m uvicorn refund_demo.web:app --reload`
- Test: `python -m pytest`
- Lint: `ruff check refund_demo tests`

## Rules

- Keep the demo lightweight: FastAPI plus static HTML, CSS, and vanilla JS.
- Preserve deterministic scenarios.
- Do not expose or claim to expose non-public model internals.
- Use decision summary, checks performed, evidence used, handoff facts,
  contract checks, and outcome verification.
- Run tests before finalizing.
