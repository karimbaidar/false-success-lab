# Contributing to False Success Lab

Thanks for helping improve False Success Lab, the interactive developer lab for
testing and explaining false-success risks in AI workflows.

Refund remains the flagship scenario, but the lab covers support, access, CRM,
infrastructure, trading, and other workflow classes where an agent might claim
completion before the result is verified.

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

## Scenario Contributions

Every scenario contribution should include:

- scenario name
- description
- user goal
- workflow steps
- failure toggles
- source system state
- naive result
- protected result
- expected receipt fields
- copyable fix code
- tests

Use [docs/scenario-contributions.md](docs/scenario-contributions.md) as the
scenario checklist.

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
