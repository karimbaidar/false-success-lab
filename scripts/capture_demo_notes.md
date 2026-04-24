# Demo Capture Notes

Recommended clip:

1. Start the app with `MODEL_PROVIDER=heuristic python -m uvicorn refund_demo.web:app --reload`.
2. Open `http://localhost:8000`.
3. Select `Pending refund`.
4. Begin recording at 1440 x 900 or wider.
5. Click `Run workflow`.
6. End after the red `False success prevented` banner appears.

Shot checklist:

- Support ticket and refund request are visible.
- Right-side execution timeline is visible.
- Refund execution agent becomes active.
- Provider status shows `pending`.
- Customer response preview remains suppressed.
- Orchestrator gate says downstream execution was blocked.

Suggested caption:

```text
Tool success is not business success. The refund provider returned pending, so
agent-consistency blocked the customer-facing success message.
```
