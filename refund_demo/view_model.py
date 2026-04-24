from typing import Any, Dict, List, Optional

ORCHESTRATION_PATTERN = "Sequential receipt-gated handoff"

SCENARIOS: Dict[str, Dict[str, Any]] = {
    "happy_path": {
        "file": "happy_path.json",
        "name": "Happy path",
        "title": "Verified refund completed",
        "expected": "passed",
        "description": "All gates pass. Refund settlement is verified before the customer reply.",
        "what_breaks": "Nothing breaks; every handoff and outcome check passes.",
        "what_gets_blocked": "Nothing. The customer response is allowed.",
        "why_it_matters": "Shows proof before progression for a normal refund workflow.",
        "business_risk_prevented": (
            "Customer-visible claims are backed by settled provider evidence."
        ),
        "banner": "Refund verified. Customer response allowed.",
        "expected_result": "Customer can be told the refund completed.",
    },
    "stale_policy": {
        "file": "stale_policy.json",
        "name": "Stale policy",
        "title": "Stale policy blocked",
        "expected": "failed",
        "description": "Policy v12 is read while v14 is current, so execution stops early.",
        "what_breaks": "The policy agent acts on an outdated policy snapshot.",
        "what_gets_blocked": "Refund execution is blocked before money can move.",
        "why_it_matters": "Approvals should not continue from stale business rules.",
        "business_risk_prevented": "A refund is not issued under an obsolete policy.",
        "banner": "False success prevented. Stale policy snapshot blocked payment execution.",
        "expected_result": "Workflow stops before the refund execution agent.",
    },
    "missing_handoff": {
        "file": "missing_handoff.json",
        "name": "Missing handoff fact",
        "title": "Incomplete handoff blocked",
        "expected": "failed",
        "description": "The intake handoff omits previous refund count, so policy cannot continue.",
        "what_breaks": "A required handoff fact is missing from the downstream context.",
        "what_gets_blocked": "The policy agent is not allowed to decide eligibility.",
        "why_it_matters": "Agents should not make business decisions from partial context.",
        "business_risk_prevented": "Repeat-refund abuse is not hidden by a thin handoff.",
        "banner": "False success prevented. Missing handoff fact blocked continuation.",
        "expected_result": "Workflow stops at the intake contract gate.",
    },
    "pending_refund": {
        "file": "pending_refund.json",
        "name": "Pending refund",
        "title": "Pending provider result blocked",
        "expected": "failed",
        "description": "The refund provider returns pending, so the success message is suppressed.",
        "what_breaks": "The tool call returns, but the business outcome is not settled.",
        "what_gets_blocked": "The customer-facing completed-refund message is blocked.",
        "why_it_matters": "Tool success is not business success.",
        "business_risk_prevented": "The customer is not told money was returned too early.",
        "banner": (
            "False success prevented. The customer was not told the refund completed because "
            "the payment provider has not confirmed settlement."
        ),
        "expected_result": "Workflow stops before the comms agent.",
    },
}

AGENT_STEPS: List[Dict[str, Any]] = [
    {
        "step_id": "01-intake",
        "number": 1,
        "agent": "Intake agent",
        "agent_key": "intake-agent",
        "action_label": "Read support ticket",
        "running_label": "Reading customer ticket",
        "inputs": ["Support ticket", "Order record"],
        "purpose": "Extract refund intent and produce the first handoff contract.",
    },
    {
        "step_id": "02-policy",
        "number": 2,
        "agent": "Policy agent",
        "agent_key": "policy-agent",
        "action_label": "Check refund policy",
        "running_label": "Checking policy snapshot",
        "inputs": ["Intake handoff", "Refund policy snapshot"],
        "purpose": "Verify policy freshness before any payment step can run.",
    },
    {
        "step_id": "03-risk",
        "number": 3,
        "agent": "Risk agent",
        "agent_key": "risk-agent",
        "action_label": "Score refund risk",
        "running_label": "Scoring refund risk",
        "inputs": ["Policy handoff", "Customer risk profile"],
        "purpose": "Check abuse signals and produce a risk-backed refund gate.",
    },
    {
        "step_id": "04-refund",
        "number": 4,
        "agent": "Refund execution agent",
        "agent_key": "refund-agent",
        "action_label": "Call refund provider",
        "running_label": "Calling refund provider",
        "inputs": ["Risk handoff", "Refund intent", "Payment provider status"],
        "purpose": "Issue the refund and verify settlement before downstream messaging.",
    },
    {
        "step_id": "05-comms",
        "number": 5,
        "agent": "Comms agent",
        "agent_key": "comms-agent",
        "action_label": "Prepare customer reply",
        "running_label": "Preparing customer response",
        "inputs": ["Settled refund evidence", "Customer identity"],
        "purpose": "Send only claims supported by verified refund evidence.",
    },
]


def public_scenarios() -> List[Dict[str, Any]]:
    return [{"id": key, **value} for key, value in SCENARIOS.items()]


def build_case_preview(case: Dict[str, Any]) -> Dict[str, Any]:
    return _support_case(case, {"final_message": None})


def build_control_center_report(
    report: Dict[str, Any],
    case: Dict[str, Any],
) -> Dict[str, Any]:
    scenario_id = str(case.get("scenario") or report.get("scenario") or "custom")
    scenario = dict(SCENARIOS.get(scenario_id, _custom_scenario(scenario_id)))
    receipts = list(report.get("receipts") or [])
    receipts_by_step = {receipt["step_id"]: receipt for receipt in receipts}
    incoming_by_agent = _incoming_handoffs(receipts)
    failed_step_id = _failed_step_id(receipts)
    steps = [
        _build_step(
            spec,
            receipts_by_step.get(spec["step_id"]),
            incoming_by_agent,
            case,
            failed_step_id,
        )
        for spec in AGENT_STEPS
    ]
    completed_steps = [step["step_id"] for step in steps if step["status"] == "passed"]
    failed_steps = [step["step_id"] for step in steps if step["status"] == "failed"]
    blocked_steps = [step["step_id"] for step in steps if step["status"] == "skipped"]
    false_success_prevented = report.get("status") == "failed"
    customer_response_allowed = report.get("status") == "passed" and bool(
        report.get("final_message")
    )

    enriched = dict(report)
    enriched.update(
        {
            "scenario": scenario_id,
            "scenario_metadata": scenario,
            "orchestration_pattern": ORCHESTRATION_PATTERN,
            "support_case": _support_case(case, report),
            "timeline_entries": steps,
            "agent_steps": steps,
            "completed_steps": completed_steps,
            "failed_steps": failed_steps,
            "blocked_steps": blocked_steps,
            "active_step": failed_steps[0] if failed_steps else "complete",
            "failure_message": scenario["banner"] if false_success_prevented else None,
            "false_success_prevented": false_success_prevented,
            "customer_response_allowed": customer_response_allowed,
            "recommended_next_action": _recommended_next_action(scenario_id, report),
            "orchestrator": _orchestrator_view(
                report,
                steps,
                failed_steps,
                blocked_steps,
                customer_response_allowed,
            ),
        }
    )
    return enriched


def _custom_scenario(scenario_id: str) -> Dict[str, Any]:
    return {
        "name": scenario_id.replace("_", " ").title(),
        "title": "Custom refund run",
        "expected": "unknown",
        "description": "Custom refund workflow run.",
        "what_breaks": "Depends on the supplied input.",
        "what_gets_blocked": "Depends on the failing gate.",
        "why_it_matters": "Side-effecting workflows need proof before progression.",
        "business_risk_prevented": "Unsupported customer-visible claims are blocked.",
        "banner": "False success prevented. A consistency gate blocked continuation.",
        "expected_result": "Review the failed gate and supplied input.",
    }


def _support_case(case: Dict[str, Any], report: Dict[str, Any]) -> Dict[str, Any]:
    request = case["request"]
    order = case["order"]
    policy = case["policy"]
    risk = case["risk_profile"]
    provider = case.get("provider", {})
    final_message = report.get("final_message") or {}
    response_preview = final_message.get(
        "body",
        "Suppressed until state, handoff, and outcome verification pass.",
    )
    return {
        "ticket": {
            "ticket_id": request["ticket_id"],
            "customer_message": request["customer_message"],
            "submitted_at": request["submitted_at"],
        },
        "customer": {
            "customer_id": order["customer_id"],
            "account_age_days": risk["account_age_days"],
            "previous_refund_count": order.get("previous_refund_count", "missing"),
        },
        "order": {
            "order_id": order["id"],
            "version": order["version"],
            "status": order["status"],
            "total": order["total"],
            "currency": order["currency"],
        },
        "refund_request": {
            "order_id": request["order_id"],
            "amount": request["requested_amount"],
            "currency": order["currency"],
            "reason": _reason_hint(request["customer_message"]),
        },
        "policy_snapshot": {
            "read_version": policy["version"],
            "latest_version": case["latest_policy_version"],
            "max_refund_amount": policy["max_refund_amount"],
            "max_previous_refunds": policy["max_previous_refunds"],
            "allowed_reasons": policy["allowed_reasons"],
        },
        "risk_signals": {
            "version": risk["version"],
            "latest_version": case.get("latest_risk_version", risk["version"]),
            "chargebacks_12m": risk["chargebacks_12m"],
            "manual_review": risk["manual_review"],
        },
        "provider_status": {
            "refund_status": provider.get("refund_status", "settled"),
            "verification_target": "refund.status == settled",
        },
        "final_customer_response_preview": response_preview,
    }


def _build_step(
    spec: Dict[str, Any],
    receipt: Optional[Dict[str, Any]],
    incoming_by_agent: Dict[str, Dict[str, Any]],
    case: Dict[str, Any],
    failed_step_id: Optional[str],
) -> Dict[str, Any]:
    status = _status_for(spec["step_id"], receipt, failed_step_id)
    incoming = incoming_by_agent.get(spec["agent_key"])
    handoff = receipt["handoffs"][0] if receipt and receipt.get("handoffs") else None
    issues = _issues_for(status, receipt, failed_step_id)
    outcomes = _outcomes(receipt)
    step = {
        "step_id": spec["step_id"],
        "step_number": spec["number"],
        "agent_name": spec["agent"],
        "agent_key": spec["agent_key"],
        "action_label": spec["action_label"],
        "running_label": spec["running_label"],
        "status": status,
        "purpose": spec["purpose"],
        "decision_summary": _decision_summary(spec["step_id"], status, receipt, case),
        "inputs_received": _inputs_received(spec, receipt, incoming),
        "facts_received": _facts(incoming),
        "handoff_facts": _facts(handoff),
        "contract_checks": _contract_checks(receipt, incoming, handoff, status),
        "evidence": _evidence(receipt, incoming, handoff),
        "outcome_verification": outcomes,
        "issues": issues,
        "gate_result": _gate_result(status),
        "result": _result_label(status),
        "causal_links": list(receipt.get("parent_receipt_keys", [])) if receipt else [],
    }
    return step


def _status_for(
    step_id: str,
    receipt: Optional[Dict[str, Any]],
    failed_step_id: Optional[str],
) -> str:
    if receipt:
        return str(receipt.get("status") or "passed")
    if failed_step_id and step_id > failed_step_id:
        return "skipped"
    return "pending"


def _failed_step_id(receipts: List[Dict[str, Any]]) -> Optional[str]:
    for receipt in receipts:
        if receipt.get("status") == "failed":
            return str(receipt["step_id"])
    return None


def _incoming_handoffs(receipts: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    handoffs: Dict[str, Dict[str, Any]] = {}
    for receipt in receipts:
        for handoff in receipt.get("handoffs") or []:
            handoffs[str(handoff["to_agent"])] = handoff
    return handoffs


def _decision_summary(
    step_id: str,
    status: str,
    receipt: Optional[Dict[str, Any]],
    case: Dict[str, Any],
) -> str:
    if status == "skipped":
        return "Skipped because an upstream consistency gate blocked continuation."
    if step_id == "01-intake":
        if status == "failed":
            return "The intake handoff did not satisfy its required contract."
        order = case["order"]
        return (
            f"Ticket and order {order['id']} were paired with order version "
            f"{order['version']}."
        )
    if step_id == "02-policy":
        if status == "failed":
            policy = case["policy"]
            return (
                f"Policy snapshot {policy['version']} was rejected because "
                f"{case['latest_policy_version']} is current."
            )
        return "Policy checks passed against a current policy snapshot."
    if step_id == "03-risk":
        if status == "failed":
            return "Risk checks did not produce an execution-safe approval."
        return "Risk profile checks passed and produced a verified refund gate."
    if step_id == "04-refund":
        provider_status = case.get("provider", {}).get("refund_status", "settled")
        if status == "failed":
            return (
                f"Refund provider returned {provider_status}; completed-refund messaging "
                "was blocked."
            )
        return "Refund provider settlement was verified before handoff to comms."
    if step_id == "05-comms":
        if status == "failed":
            return "Customer messaging was blocked because claims lacked verified support."
        return "Customer response was allowed after settlement evidence was verified."
    if receipt:
        return str(receipt.get("action") or "Receipt recorded.")
    return "Waiting for this gate."


def _inputs_received(
    spec: Dict[str, Any],
    receipt: Optional[Dict[str, Any]],
    incoming: Optional[Dict[str, Any]],
) -> List[Dict[str, str]]:
    rows = [{"label": item, "value": "planned"} for item in spec["inputs"]]
    if receipt:
        rows.extend(
            {
                "label": f"state: {state['name']}",
                "value": f"version {state['version']}",
            }
            for state in receipt.get("state_reads") or []
        )
    if incoming:
        rows.append({"label": "incoming handoff", "value": incoming["handoff_id"]})
    return rows


def _facts(handoff: Optional[Dict[str, Any]]) -> List[Dict[str, str]]:
    if not handoff:
        return []
    return _flatten("facts", handoff.get("facts") or {})


def _contract_checks(
    receipt: Optional[Dict[str, Any]],
    incoming: Optional[Dict[str, Any]],
    handoff: Optional[Dict[str, Any]],
    status: str,
) -> List[Dict[str, str]]:
    checks: List[Dict[str, str]] = []
    if incoming and incoming.get("contract"):
        contract = incoming["contract"]
        checks.append(
            {
                "label": f"incoming contract: {contract['name']}",
                "state": "failed" if _has_issue(receipt, "invalid_consumed_handoff") else "passed",
                "detail": _contract_detail(contract),
            }
        )
    if handoff and handoff.get("contract"):
        contract = handoff["contract"]
        checks.append(
            {
                "label": f"outgoing contract: {contract['name']}",
                "state": "failed" if _has_issue(receipt, "invalid_handoff") else "passed",
                "detail": _contract_detail(contract),
            }
        )
    if receipt:
        checks.extend(
            {
                "label": f"state freshness: {state['name']}",
                "state": "failed" if _has_issue(receipt, "stale_state") else "passed",
                "detail": f"read version {state['version']}",
            }
            for state in receipt.get("state_reads") or []
        )
        checks.extend(
            {
                "label": f"outcome: {outcome['name']}",
                "state": "passed" if outcome.get("passed") else "failed",
                "detail": outcome.get("reason") or "postcondition checked",
            }
            for outcome in receipt.get("outcomes") or []
        )
    if status == "skipped":
        checks.append(
            {
                "label": "orchestrator gate",
                "state": "blocked",
                "detail": "not invoked after upstream failure",
            }
        )
    return checks


def _contract_detail(contract: Dict[str, Any]) -> str:
    facts = len(contract.get("required_facts") or [])
    evidence = len(contract.get("required_evidence") or [])
    artifacts = len(contract.get("produced_artifacts") or [])
    return f"{facts} facts, {evidence} evidence keys, {artifacts} artifacts"


def _evidence(
    receipt: Optional[Dict[str, Any]],
    incoming: Optional[Dict[str, Any]],
    handoff: Optional[Dict[str, Any]],
) -> List[Dict[str, str]]:
    rows: List[Dict[str, str]] = []
    if incoming:
        rows.extend(
            {"label": f"incoming evidence: {key}", "value": _short(value)}
            for key, value in (incoming.get("evidence") or {}).items()
        )
    if handoff:
        rows.extend(
            {"label": f"handoff evidence: {key}", "value": _short(value)}
            for key, value in (handoff.get("evidence") or {}).items()
        )
    if receipt:
        rows.extend(
            {
                "label": f"artifact: {artifact['name']}",
                "value": f"{artifact['kind']} verified={artifact['verified']}",
            }
            for artifact in receipt.get("proof_artifacts") or []
        )
    return rows


def _outcomes(receipt: Optional[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not receipt:
        return []
    return [
        {
            "name": outcome["name"],
            "passed": bool(outcome["passed"]),
            "reason": outcome.get("reason") or "",
            "details": outcome.get("details") or {},
        }
        for outcome in receipt.get("outcomes") or []
    ]


def _issues_for(
    status: str,
    receipt: Optional[Dict[str, Any]],
    failed_step_id: Optional[str],
) -> List[Dict[str, str]]:
    if receipt:
        issues = [
            {"code": issue["code"], "message": issue["message"]}
            for issue in receipt.get("issues") or []
        ]
        if receipt.get("error"):
            issues.append(
                {
                    "code": receipt["error"]["type"],
                    "message": receipt["error"]["message"],
                }
            )
        return issues
    if status == "skipped":
        return [
            {
                "code": "upstream_gate_blocked",
                "message": f"Not run because {failed_step_id} failed.",
            }
        ]
    return []


def _gate_result(status: str) -> str:
    return {
        "passed": "allowed next step",
        "failed": "blocked continuation",
        "skipped": "not invoked",
        "pending": "waiting",
    }.get(status, status)


def _result_label(status: str) -> str:
    return {
        "passed": "Pass",
        "failed": "Blocked",
        "skipped": "Skipped",
        "pending": "Pending",
    }.get(status, status.title())


def _has_issue(receipt: Optional[Dict[str, Any]], code: str) -> bool:
    if not receipt:
        return False
    return any(issue.get("code") == code for issue in receipt.get("issues") or [])


def _flatten(prefix: str, value: Any) -> List[Dict[str, str]]:
    rows: List[Dict[str, str]] = []
    if isinstance(value, dict):
        for key, child in value.items():
            rows.extend(_flatten(f"{prefix}.{key}", child))
        return rows
    if isinstance(value, list):
        rows.append({"label": prefix, "value": ", ".join(str(item) for item in value)})
        return rows
    rows.append({"label": prefix, "value": str(value)})
    return rows


def _short(value: Any) -> str:
    text = str(value)
    if len(text) > 96:
        return text[:93] + "..."
    return text


def _reason_hint(message: str) -> str:
    lower = message.lower()
    if "wrong" in lower:
        return "wrong item"
    if "not received" in lower or "missing" in lower:
        return "not received"
    return "damaged item"


def _recommended_next_action(scenario_id: str, report: Dict[str, Any]) -> str:
    if report.get("status") == "passed":
        return "Send the verified customer response and archive the run artifacts."
    return {
        "stale_policy": "Reload the current policy snapshot, then rerun before payment execution.",
        "missing_handoff": "Return to intake and include previous refund count in the handoff.",
        "pending_refund": (
            "Wait for settlement confirmation before sending a completed-refund reply."
        ),
    }.get(scenario_id, "Inspect the failed gate, repair the facts or evidence, and rerun.")


def _orchestrator_view(
    report: Dict[str, Any],
    steps: List[Dict[str, Any]],
    failed_steps: List[str],
    blocked_steps: List[str],
    customer_response_allowed: bool,
) -> Dict[str, Any]:
    failed_step = failed_steps[0] if failed_steps else None
    if failed_step:
        transition = f"{failed_step} blocked downstream execution"
        gate_result = "blocked"
    else:
        transition = "05-comms allowed customer response"
        gate_result = "passed"
    return {
        "pattern": ORCHESTRATION_PATTERN,
        "active_step": failed_step or "complete",
        "state_transition": transition,
        "gate_result": gate_result,
        "customer_response_allowed": customer_response_allowed,
        "blocked_steps": blocked_steps,
        "causal_links": report.get("causality_graph", {}).get("edges", []),
        "gates": [
            {
                "step_id": step["step_id"],
                "agent": step["agent_name"],
                "status": step["status"],
                "gate_result": step["gate_result"],
            }
            for step in steps
        ],
    }
