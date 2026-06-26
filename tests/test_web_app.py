from pathlib import Path

from fastapi.testclient import TestClient

from refund_demo import web
from refund_demo.config import AppConfig
from refund_demo.web import ORCHESTRATION_PATTERN, create_app


def _client(tmp_path):
    config = AppConfig(output_dir=str(tmp_path), consistency_on_violation="raise")
    return TestClient(create_app(config))


def test_web_app_serves_frontend(tmp_path):
    client = _client(tmp_path)

    response = client.get("/")

    assert response.status_code == 200
    assert "False Success Lab" in response.text
    assert "Scan your agent repo" in response.text


def test_web_api_lists_scenarios_and_pattern(tmp_path):
    client = _client(tmp_path)

    config = client.get("/api/config").json()
    scenarios = client.get("/api/scenarios").json()

    assert config["orchestration_pattern"] == ORCHESTRATION_PATTERN
    assert {scenario["id"] for scenario in scenarios} == {
        "happy_path",
        "stale_policy",
        "missing_handoff",
        "pending_refund",
    }
    pending = next(scenario for scenario in scenarios if scenario["id"] == "pending_refund")
    assert pending["business_risk_prevented"]
    assert pending["support_case_preview"]["provider_status"]["refund_status"] == "pending"


def test_web_api_runs_happy_path_with_heuristic_provider(tmp_path):
    client = _client(tmp_path)

    response = client.post(
        "/api/runs",
        json={"scenario": "happy_path", "provider": "heuristic"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "passed"
    assert payload["receipt_count"] == 5
    assert payload["orchestration_pattern"] == ORCHESTRATION_PATTERN
    assert payload["customer_response_allowed"] is True
    assert payload["false_success_prevented"] is False
    assert payload["timeline_entries"][0]["decision_summary"]
    assert payload["timeline_entries"][0]["contract_checks"]
    assert payload["orchestrator"]["gate_result"] == "passed"
    assert payload["links"]["html_report"] == "/runs/demo-happy-refund/report.html"
    assert (Path(tmp_path) / "demo-happy-refund" / "report.html").exists()


def test_web_api_pending_refund_exposes_false_success_payload(tmp_path):
    client = _client(tmp_path)

    response = client.post(
        "/api/runs",
        json={"scenario": "pending_refund", "provider": "heuristic"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "failed"
    assert payload["false_success_prevented"] is True
    assert payload["customer_response_allowed"] is False
    assert "False success prevented" in payload["failure_message"]
    assert payload["timeline_entries"][3]["status"] == "failed"
    assert payload["timeline_entries"][4]["status"] == "skipped"
    assert payload["orchestrator"]["blocked_steps"] == ["05-comms"]


def test_web_api_applies_break_it_yourself_overrides(tmp_path):
    client = _client(tmp_path)

    response = client.post(
        "/api/runs",
        json={
            "scenario": "happy_path",
            "provider": "heuristic",
            "overrides": {"provider_status": "pending"},
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "failed"
    assert payload["support_case"]["provider_status"]["refund_status"] == "pending"
    assert payload["timeline_entries"][3]["status"] == "failed"
    assert payload["demo_overrides"]["provider_status"] == "pending"


def test_web_api_rejects_unknown_scenario(tmp_path):
    client = _client(tmp_path)

    response = client.post("/api/runs", json={"scenario": "unknown"})

    assert response.status_code == 404


def test_web_api_scans_public_github_repo_with_agent_consistency(monkeypatch, tmp_path):
    def fake_scan(target):
        assert target == "https://github.com/example/support-agent"
        return {
            "report": {
                "repository": "example/support-agent",
                "risky_actions_found": 1,
                "high_severity": 1,
                "medium_severity": 0,
                "low_severity": 0,
                "false_success_exposure": 1,
                "confidence": "medium",
                "findings": [
                    {
                        "action": "send_refund_confirmation",
                        "severity": "high",
                        "confidence": "medium",
                        "path": "agents/refunds.py",
                        "line": 142,
                        "why": "May claim completion before settlement.",
                        "evidence_missing": ["refund_settled"],
                        "suggested_fix": "with reliability_gate(...): ...",
                    }
                ],
            },
            "markdown": "# False-success report card\n",
        }

    monkeypatch.setattr(web, "_scan_with_agent_consistency", fake_scan)
    client = _client(tmp_path)

    response = client.post(
        "/api/scans/github",
        json={"url": "https://github.com/example/support-agent"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["report"]["repository"] == "example/support-agent"
    assert payload["report"]["high_severity"] == 1


def test_web_api_rejects_non_github_scan_url(tmp_path):
    client = _client(tmp_path)

    response = client.post("/api/scans/github", json={"url": "https://example.com/repo"})

    assert response.status_code == 400
