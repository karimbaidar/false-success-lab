# Scenario Contributions

A False Success Lab scenario must make the missing proof obvious.

## Scenario Template

- **Name:** short action-oriented label.
- **Naive behavior:** what the agent claims or does too early.
- **Protected behavior:** what evidence gate blocks or reviews the workflow.
- **Risk category:** financial, destructive, access control, support,
  production state, trading, or customer-visible.
- **Missing evidence:** the exact fact or outcome that is absent.
- **Suggested fix:** Python gate, LangGraph node, or tool-wrapper snippet.

## Acceptance Bar

- The naive path must be plausible.
- The protected path must identify a concrete check.
- Low-confidence findings must say `Possible risk, needs review.`
- Do not present a heuristic finding as a certain production bug.
- Do not include secrets, private customer records, or proprietary repo code.

## Built-In Baseline

Current built-in scenarios:

- Refund customer
- Close support ticket
- Delete account
- Provision server
- Update CRM
- Grant access
- Place trade
