# Governance

False Success Lab is maintained by Karim Baidar.

False Success Lab is the interactive developer lab for `agent-consistency`. The
package repo remains the canonical reliability engine; this repo is the public
experience layer for scanner report cards, built-in scenarios, proof trails, and
copyable fixes.

## Decision Principles

- Keep the demo honest about static scans and runtime proof.
- Prefer deterministic scenarios over impressive but unverifiable claims.
- Keep the public UI lightweight and easy to run.
- Preserve refund as the flagship scenario while expanding coverage to other
  false-success classes.
- Keep package logic in `agent-consistency` and avoid duplicating engine
  behavior in the lab.

## Maintainer Responsibilities

- Review scenario contributions for accuracy and false-positive risk.
- Keep demo claims aligned with `agent-consistency` capabilities.
- Require security-sensitive reports to move through private channels.
- Keep generated static artifacts and tests in sync.
- Keep public docs ready for the recommended `false-success-lab` repository
  rename.
