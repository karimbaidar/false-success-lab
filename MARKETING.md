# Marketing Playbook

## Positioning

Primary hook:

> Scan your agent repo, find false-success risks, then watch the gate block them.

False Success Lab is the public interactive demo for `agent-consistency`. It
starts with the flagship refund bug, then expands the same pattern across
support, destructive account actions, infrastructure, CRM updates, access
control, and trading.

Target users:

- AI engineers evaluating agent reliability patterns
- support automation teams
- payment operations teams
- infrastructure and internal-tools teams
- developer advocates recording a short product demo
- founders explaining why agent workflows need proof before progression

## Launch Hooks

- Your agent said done. The confirmed result was still missing.
- Tool success is not business success.
- Find where your agent says done too early.
- Scan a repo, get a false-success report card, then watch a gate block it.
- Receipts explain why an agent workflow continued or stopped.

## Screenshot Checklist

- Start on the first-screen entry options.
- Select `Refund customer`.
- Show naive behavior first: refund completion claim after provider pending.
- Switch to protected behavior and show `BLOCK`.
- Capture report-card metrics and the proof trail.
- Capture the Copy report and copyable fix buttons.

## Demo Recording Checklist

1. Start the app with the `heuristic` provider.
2. Open `http://localhost:8000`.
3. Select `Try a built-in false-success scenario`.
4. Run `Refund customer` in naive mode.
5. Switch to protected mode and show the gate blocking.
6. Open `Scan a public GitHub repo` and explain the backend scanner path.
7. Open `Scan your own repo` and show the paste/upload flow.

## X/Twitter

```text
Your agent said "done."
The confirmed result was still missing.

False Success Lab scans agent repos for risky completion claims, then shows how
agent-consistency blocks them with evidence gates and receipts.
```

## LinkedIn

```text
Agent reliability is not just about better prompts. It is about proving that
each step had the right facts and that the real-world outcome actually happened.

False Success Lab lets teams scan for false-success risks, inspect report cards,
and watch naive workflows get blocked by outcome gates.
```

## Reddit

```text
I built False Success Lab: an interactive developer lab for finding where agents
say "done" before the outcome is verified.

It includes built-in scenarios, public GitHub repo scanning, local report paste
flow, proof trails, receipt JSON, and copyable fixes.
```

## Hacker News

Title:

```text
Show HN: False Success Lab - find where agents say done too early
```

Comment:

```text
Most agent demos stop at tool calls. False Success Lab checks whether the
business outcome actually happened. The flagship scenario is a refund workflow
where the payment provider has not confirmed settlement, so the customer-facing
success message is blocked.
```
