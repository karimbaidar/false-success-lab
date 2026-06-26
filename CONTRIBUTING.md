# Contributing

Thanks for helping improve False Success Lab.

## Local Setup

```bash
python -m pip install -r requirements-dev.txt
make test
make lint
```

## Contribution Scope

Good contributions include:

- new false-success scenarios
- clearer report-card language
- scanner UX improvements
- deterministic tests and fixtures
- docs that keep claims honest

Keep scenarios concrete. A scenario should name the naive completion claim, the
missing evidence, and the protected gate that blocks or reviews the workflow.

## Pull Requests

- Keep changes focused.
- Include tests for backend behavior.
- Update README or docs when public behavior changes.
- Do not add service credentials, real customer data, or private repo examples.
- Sign off commits with the Developer Certificate of Origin:

```bash
git commit -s
```

See [DCO.md](DCO.md).
