# Build State

## Current State

False Success Lab is the public interactive demo repo for `agent-consistency`.
Refund remains the flagship scenario, but the UI is no longer refund-only.

## Completed

- Public identity renamed to False Success Lab.
- First screen now offers:
  1. Try a built-in false-success scenario
  2. Scan your own repo
  3. Scan a public GitHub repo
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

## Decisions

- Keep the existing FastAPI plus static vanilla JS stack. `AGENTS.md` explicitly
  asks for this lightweight structure, and it keeps GitHub Pages simple.
- Public GitHub scanning requires a backend. The static Pages demo can still
  show built-in scenarios and accept pasted reports.
- The demo keeps a normal package dependency for reliable CI installs. The
  public scan endpoint lazily imports the `agent-consistency` scanner and
  returns a clear `503` if the backend does not have a scanner-enabled package
  installed yet.

## Gotchas

- A browser cannot scan arbitrary local filesystem paths. Local repo scanning
  must run through the CLI and paste/upload flow.
- Do not claim static scans prove safety. They find configured patterns and
  should feed review or runtime gate work.
- Keep refund as the flagship scenario, not the whole product identity.

## Next

- Replace placeholder SVG previews with real screenshots after the public lab UI
  settles.
