# Scenario Contributions

A False Success Lab scenario must make the missing proof obvious.

## Scenario Template

- **Name:** short action-oriented label.
- **Description:** one short paragraph explaining the risk.
- **User goal:** what the user wanted the agent workflow to accomplish.
- **Workflow steps:** the important read, plan, tool/API, handoff, and action
  steps.
- **Failure toggles:** the switches that make the naive path fail, such as
  pending settlement, missing deletion confirmation, stale state, or wrong role.
- **Source system state:** the starting facts the workflow reads.
- **Naive behavior:** what the agent claims or does too early.
- **Protected behavior:** what evidence gate blocks or reviews the workflow.
- **Naive result:** the visible false-success outcome.
- **Protected result:** the blocked or reviewed completion.
- **Risk category:** financial, destructive, access control, support,
  production state, trading, or customer-visible.
- **Missing evidence:** the exact fact or outcome that is absent.
- **Expected receipt fields:** the state read, handoff, tool response, outcome
  verification, idempotency key, and decision fields the proof trail should
  expose.
- **Copyable fix code:** Python gate, LangGraph node, or tool-wrapper snippet.
- **Tests:** UI fixture, backend behavior, and report-card assertions as
  appropriate.

## Acceptance Bar

- The naive path must be plausible.
- The protected path must identify a concrete check.
- Low-confidence findings must say `Possible risk, needs review.`
- Do not present a heuristic finding as a certain production bug.
- Do not include secrets, private customer records, or proprietary repo code.
- Keep the scenario deterministic enough that reviewers can reproduce naive vs
  protected behavior locally.

## Built-In Baseline

Current built-in scenarios:

- Refund customer
- Close support ticket
- Delete account
- Provision server
- Update CRM
- Grant access
- Place trade
