# Marketing Playbook

## Positioning

Primary hook:

> Your agent said "refund completed." The payment provider still said "pending."
> agent-consistency catches that before the customer gets lied to.

This repo is the visual proof. It turns a refund workflow into an Agent
Reliability Control Center with state, handoff, and outcome verification.

Target users:

- AI engineers evaluating agent reliability patterns
- support automation teams
- payment operations teams
- developer advocates recording a short product demo
- founders explaining why agent workflows need proof before progression

## Launch Hooks

- Green traces do not mean the business outcome happened.
- Tool success is not business success.
- Stop AI agents from saying done too early.
- Validate state, handoffs, and outcomes before agents continue.
- Watch a refund workflow block a false customer success message.

## Screenshot Checklist

- Select the `Pending refund` scenario.
- Keep the support case and right-side timeline visible.
- Capture the refund execution agent in blocked state.
- Capture the provider status as `pending`.
- Capture the suppressed customer response preview.
- Include the orchestrator gate result.

## Demo Recording Checklist

1. Start the app with the `heuristic` provider.
2. Open `http://localhost:8000`.
3. Select `Pending refund`.
4. Click `Run workflow`.
5. Stop after "False success prevented" appears.

## X/Twitter

```text
Your agent said "refund completed."
The payment provider still said "pending."

This visual demo catches that before the customer gets lied to.

State, handoff, and outcome verification for agent workflows.
```

## LinkedIn

```text
Agent reliability is not just about better prompts. It is about proving that
each step had the right facts and that the real-world outcome actually happened.

This demo shows a refund workflow where a pending provider result blocks the
customer-facing success message.
```

## Reddit

```text
I built a visual refund workflow that blocks AI agents from claiming success too early

It shows a five-agent refund workflow with contract checks, evidence, outcome
verification, and a clear false-success prevention moment.
```

## Hacker News

Title:

```text
Show HN: A visual demo that catches false-success bugs in AI agent workflows
```

Comment:

```text
Most agent demos stop at tool calls. This one checks whether the business
outcome actually happened. In the pending refund scenario, the payment provider
has not confirmed settlement, so the customer-facing success message is blocked.
```
