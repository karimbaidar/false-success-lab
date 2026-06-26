# Build State

## Current State

False Success Lab is the public interactive developer lab for `agent-consistency`.
Refund remains the flagship scenario, but the UI now covers multiple
false-success workflow classes.

## Completed

- Public identity renamed to False Success Lab.
- First screen now offers:
  1. Scan a public GitHub repo
  2. Import local scan report
  3. Try built-in scenarios
- Built-in scenarios now cover refund, support ticket closure, account
  deletion, server provisioning, CRM update, access grant, and trade placement.
- Each scenario shows naive vs protected behavior.
- Refund protected behavior still calls the real `agent-consistency` workflow
  path where the FastAPI backend is available.
- Public GitHub scan endpoint added at `/api/scans/github`; it calls the
  scanner from the installed `agent-consistency` package.
- Local repo scan path is honest: the browser shows CLI commands and accepts
  pasted or uploaded JSON/Markdown reports.
- UI now renders report-card metrics, confidence, top findings, missing
  evidence, suggested fixes, proof trail, receipt JSON, and copyable Python,
  LangGraph, and tool-wrapper fixes.
- README, contribution, security, governance, trademarks, DCO, issue templates,
  and scenario contribution docs were added or updated.
- README now embeds the repo-local architecture image at
  `docs/images/false-success-lab-architecture.png`.
- Repo rename is documented in `RENAME_REPO.md`; public metadata is aligned
  with the renamed `karimbaidar/false-success-lab` repository.
- False Success Lab is not a Python package. This repo is a FastAPI/static lab
  app that depends on the `agent-consistency` Python package.
- Static Pages URL to verify:
  `https://karimbaidar.github.io/false-success-lab/`.

## Decisions

- Keep the existing FastAPI plus static vanilla JS stack. `AGENTS.md` explicitly
  asks for this lightweight structure, and it keeps GitHub Pages simple.
- Public GitHub scanning requires a backend. The static Pages demo can still
  show built-in scenarios and accept pasted reports.
- The lab depends on the `agent-consistency` package when scanner-backed
  behavior is available. The public scan endpoint lazily imports the
  `agent-consistency` scanner and
  returns a clear `503` if the backend does not have a scanner-enabled package
  installed yet.

## Gotchas

- A browser cannot scan arbitrary local filesystem paths. Local repo scanning
  must run through the CLI and paste/upload flow.
- Do not claim static scans prove safety. They find configured patterns and
  should feed review or runtime gate work.
- Keep refund as the flagship scenario, not the whole product identity.
- The GitHub repository has moved from `agent-consistency-refund-demo` to
  `false-success-lab`. Keep old-name references only when describing migration
  history.

## Next

- Verify GitHub Pages at `https://karimbaidar.github.io/false-success-lab/`
  after each static UI push.
