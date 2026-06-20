const providerSelect = document.querySelector("#provider");
const runButton = document.querySelector("#run-button");
const resetButton = document.querySelector("#reset-button");
const statusBanner = document.querySelector("#status-banner");
const statusKicker = document.querySelector("#status-kicker");
const statusTitle = document.querySelector("#status-title");
const statusCopy = document.querySelector("#status-copy");
const statusChip = document.querySelector("#status-chip");
const scenarioList = document.querySelector("#scenario-list");
const flowCanvas = document.querySelector("#flow-canvas");
const receiptTimeline = document.querySelector("#receipt-timeline");
const rawJson = document.querySelector("#raw-json");
const rawTitle = document.querySelector("#raw-title");
const copyButton = document.querySelector("#copy-button");
const canvasTitle = document.querySelector("#canvas-title");
const canvasPill = document.querySelector("#canvas-pill");
const customerMessageCard = document.querySelector("#customer-message-card");
const customerMessagePreview = document.querySelector("#customer-message-preview");
const toggleProvider = document.querySelector("#toggle-provider");
const toggleHandoff = document.querySelector("#toggle-handoff");
const togglePolicy = document.querySelector("#toggle-policy");

const scenarioOrder = ["happy_path", "stale_policy", "missing_handoff", "pending_refund"];
const nodeSpecs = [
  ["01-intake", "Intake", "Ticket and order"],
  ["02-policy", "Policy", "Fresh policy"],
  ["03-risk", "Risk", "Risk approval"],
  ["04-refund", "Refund", "Provider status"],
  ["05-comms", "Comms", "Customer claim"],
];

const staticCases = {
  happy_path: {
    ticket: "ticket-1001",
    message: "The item arrived damaged. Please refund my order.",
    order: "ord-1001",
    amount: "42.5 USD",
    previousRefunds: 0,
    policyRead: "policy-v12",
    policyLatest: "policy-v12",
    providerStatus: "settled",
  },
  stale_policy: {
    ticket: "ticket-1002",
    message: "The item arrived damaged. Please refund my order.",
    order: "ord-1002",
    amount: "42.5 USD",
    previousRefunds: 0,
    policyRead: "policy-v12",
    policyLatest: "policy-v14",
    providerStatus: "settled",
  },
  missing_handoff: {
    ticket: "ticket-1003",
    message: "The item arrived damaged. Please refund my order.",
    order: "ord-1003",
    amount: "42.5 USD",
    previousRefunds: "missing",
    policyRead: "policy-v12",
    policyLatest: "policy-v12",
    providerStatus: "settled",
  },
  pending_refund: {
    ticket: "ticket-1004",
    message: "The item arrived damaged. Please refund my order.",
    order: "ord-1004",
    amount: "42.5 USD",
    previousRefunds: 0,
    policyRead: "policy-v12",
    policyLatest: "policy-v12",
    providerStatus: "pending",
  },
};

const staticScenarios = [
  {
    id: "happy_path",
    name: "Happy path",
    title: "Verified refund completed",
    expected: "passed",
    description: "Every gate passes and the customer response is allowed.",
    what_breaks: "Nothing breaks.",
    what_gets_blocked: "Nothing.",
    business_risk_prevented: "Customer-visible claims are backed by settled provider evidence.",
    support_case_preview: supportCaseFromStatic("happy_path"),
  },
  {
    id: "stale_policy",
    name: "Stale policy",
    title: "Stale policy blocked",
    expected: "failed",
    description: "Policy v12 is read while v14 is current.",
    what_breaks: "The policy agent acts on an outdated policy snapshot.",
    what_gets_blocked: "Refund execution is blocked before money can move.",
    business_risk_prevented: "A refund is not issued under an obsolete policy.",
    support_case_preview: supportCaseFromStatic("stale_policy"),
  },
  {
    id: "missing_handoff",
    name: "Missing handoff",
    title: "Incomplete handoff blocked",
    expected: "failed",
    description: "The intake handoff omits previous refund count.",
    what_breaks: "A required handoff fact is missing from downstream context.",
    what_gets_blocked: "The policy agent is not allowed to decide eligibility.",
    business_risk_prevented: "Repeat-refund abuse is not hidden by a thin handoff.",
    support_case_preview: supportCaseFromStatic("missing_handoff"),
  },
  {
    id: "pending_refund",
    name: "Pending refund",
    title: "Pending provider result blocked",
    expected: "failed",
    description: "The refund provider returns pending, so the success message is suppressed.",
    what_breaks: "The tool call returns, but the business outcome is not settled.",
    what_gets_blocked: "The customer-facing completed-refund message is blocked.",
    business_risk_prevented: "The customer is not told money was returned too early.",
    support_case_preview: supportCaseFromStatic("pending_refund"),
  },
];

let scenarios = staticScenarios;
let currentScenarioId = "pending_refund";
let currentReport = null;
let currentMode = "protected";
let selectedStepId = "04-refund";
let staticMode = false;

async function loadInitialState() {
  try {
    const [scenarioPayload, config] = await Promise.all([
      fetchJson("api/scenarios"),
      fetchJson("api/config"),
    ]);
    scenarios = orderScenarios(scenarioPayload);
    providerSelect.value = config.default_provider;
  } catch (error) {
    staticMode = true;
    scenarios = orderScenarios(staticScenarios);
    providerSelect.value = "heuristic";
  }

  currentScenarioId = "pending_refund";
  syncTogglesToScenario();
  renderPreview();
}

function renderPreview() {
  currentReport = null;
  renderScenarioList();
  const scenario = selectedScenario();
  const preview = buildPreviewSupportCase();
  renderCase(preview);
  setStatus(
    "idle",
    staticMode ? "Static demo" : "Ready",
    scenario.title,
    "Traces show the call. This gate checks whether the workflow may continue.",
    scenario.expected === "passed" ? "Will pass" : "Will block",
  );
  const report = currentMode === "naive" ? buildNaiveReport() : buildPlannedReport();
  renderReportSurface(report);
}

async function runWorkflow() {
  runButton.disabled = true;
  resetButton.disabled = true;
  currentReport = null;
  selectedStepId = effectiveScenarioId() === "missing_handoff" ? "01-intake" : "04-refund";

  const planned = currentMode === "naive" ? buildNaiveReport() : buildPlannedReport();
  setStatus(
    "running",
    currentMode === "naive" ? "Naive run" : "Running gates",
    selectedScenario().title,
    currentMode === "naive"
      ? "The agent trusts the tool response and keeps moving."
      : "Reading state, validating handoffs, and verifying outcomes.",
    "Active",
  );
  renderReportSurface(planned, "01-intake");

  try {
    const report = currentMode === "naive" ? buildNaiveReport() : await getProtectedReport();
    currentReport = report;
    renderCase(report.support_case);
    await animateReport(report);
    renderFinalStatus(report);
    renderReportSurface(report);
  } catch (error) {
    setStatus("failed", "Request failed", "Workflow request failed.", error.message, "Error");
  } finally {
    runButton.disabled = false;
    resetButton.disabled = false;
  }
}

async function getProtectedReport() {
  if (staticMode) {
    return buildStaticProtectedReport();
  }
  try {
    return await fetchJson("api/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenario: currentScenarioId,
        provider: providerSelect.value,
        overrides: currentOverrides(),
      }),
    });
  } catch (error) {
    staticMode = true;
    return buildStaticProtectedReport();
  }
}

async function animateReport(report) {
  const finalSteps = report.timeline_entries || [];
  const displayed = finalSteps.map((step) => ({ ...step, status: "pending" }));
  renderReportSurface({ ...report, timeline_entries: displayed }, null);

  for (let index = 0; index < finalSteps.length; index += 1) {
    const finalStep = finalSteps[index];

    if (finalStep.status === "skipped") {
      displayed[index] = finalStep;
      renderReportSurface({ ...report, timeline_entries: displayed }, finalStep.step_id);
      await delay(180);
      continue;
    }

    selectedStepId = finalStep.step_id;
    displayed[index] = { ...finalStep, status: "running", gate_result: "checking" };
    renderReportSurface({ ...report, timeline_entries: displayed }, finalStep.step_id);
    await delay(520);

    displayed[index] = finalStep;
    renderReportSurface({ ...report, timeline_entries: displayed }, finalStep.step_id);
    await delay(finalStep.status === "failed" ? 620 : 250);
  }
}

function renderFinalStatus(report) {
  if (report.mode === "naive") {
    setStatus(
      "failed",
      "False success shipped",
      "The customer was told the refund completed while the provider was still pending.",
      "That is the bug agent-consistency is built to stop.",
      "Risk",
    );
    return;
  }

  if (report.status === "passed") {
    setStatus(
      "passed",
      "Verified",
      "Refund verified. Customer response allowed.",
      "The business outcome matched the customer-visible claim.",
      "Passed",
    );
    return;
  }

  setStatus(
    "failed",
    "False success blocked",
    "The tool call succeeded, but the business outcome was not verified.",
    report.recommended_next_action || "Wait for settlement confirmation before messaging.",
    "Blocked",
  );
}

function renderReportSurface(report, activeStepId = null) {
  currentReport = report.mode === "preview" ? currentReport : report;
  const steps = report.timeline_entries || [];
  const active = activeStepId || selectedStepId;
  renderCanvas(report, steps, activeStepId);
  renderReceiptTimeline(report, steps, active);
  renderRawReceipt(report, active);
}

function renderCanvas(report, steps, activeStepId) {
  const statusById = Object.fromEntries(steps.map((step) => [step.step_id, step.status]));
  const blocked = report.status === "failed" && currentMode === "protected";
  const risky = report.mode === "naive" && report.support_case.provider_status.refund_status === "pending";
  canvasTitle.textContent = currentMode === "naive" ? "Naive flow" : "Receipt-gated flow";
  canvasPill.textContent = report.status === "passed" ? "allowed" : blocked ? "blocked" : risky ? "risky" : "waiting";
  canvasPill.className = `canvas-pill ${report.status || "idle"}`;

  const nodes = nodeSpecs
    .map(([stepId, label, detail], index) => {
      const status = stepId === activeStepId ? "running" : statusById[stepId] || "pending";
      const connector = index < nodeSpecs.length - 1 ? renderConnector(index, steps, report) : "";
      return `
        <article class="flow-node ${escapeHtml(status)}">
          <span class="node-status">${escapeHtml(statusLabel(status))}</span>
          <strong>${escapeHtml(label)}</strong>
          <small>${escapeHtml(detail)}</small>
        </article>
        ${connector}
      `;
    })
    .join("");

  flowCanvas.innerHTML = `<div class="node-lane">${nodes}</div>`;
  renderCustomerMessage(report);
}

function renderConnector(index, steps, report) {
  const left = steps[index];
  const right = steps[index + 1];
  let state = "waiting";
  if (report.mode === "naive") {
    state = "passed";
  } else if (left && left.status === "failed") {
    state = "severed";
  } else if (left && left.status === "passed" && right && right.status !== "pending") {
    state = "passed";
  } else if (left && left.status === "running") {
    state = "active";
  }
  const shield = state === "severed" ? '<span class="gate-shield"></span>' : "";
  return `
    <div class="flow-connector ${escapeHtml(state)}">
      <span class="edge-line"></span>
      <span class="edge-pulse"></span>
      ${shield}
    </div>
  `;
}

function renderCustomerMessage(report) {
  const providerStatus = report.support_case.provider_status.refund_status;
  const isNaiveRisk = report.mode === "naive" && providerStatus === "pending";
  const isBlocked = currentMode === "protected" && report.status === "failed";
  customerMessageCard.className = `customer-message ${isBlocked ? "blocked" : isNaiveRisk ? "risky" : "allowed"}`;
  if (isNaiveRisk) {
    customerMessagePreview.innerHTML =
      'Hi, your refund has been approved and settled. <strong>Provider status: pending.</strong>';
  } else if (isBlocked) {
    customerMessagePreview.innerHTML =
      '<span class="suppressed">Hi, your refund is complete.</span> <strong>Suppressed until refund_settled passes.</strong>';
  } else {
    customerMessagePreview.textContent = report.support_case.final_customer_response_preview;
  }
}

function renderReceiptTimeline(report, steps, activeStepId) {
  receiptTimeline.innerHTML = steps
    .map((step) => {
      const selected = step.step_id === activeStepId ? " selected" : "";
      return `
        <button class="receipt-step ${escapeHtml(step.status)}${selected}" data-step-id="${escapeAttr(step.step_id)}" type="button">
          <span>${escapeHtml(step.step_id)}</span>
          <strong>${escapeHtml(step.agent_name)}</strong>
          <small>${escapeHtml(step.decision_summary || step.gate_result || "")}</small>
          ${renderTinyChecks(step)}
        </button>
      `;
    })
    .join("");

  document.querySelectorAll(".receipt-step").forEach((button) => {
    button.addEventListener("click", () => {
      selectedStepId = button.dataset.stepId;
      renderReportSurface(currentReport || report, selectedStepId);
    });
  });
}

function renderTinyChecks(step) {
  const rows = [
    ...(step.contract_checks || []).slice(0, 2).map((item) => [item.label, item.state]),
    ...(step.outcome_verification || []).slice(0, 1).map((item) => [item.name, item.passed ? "passed" : "failed"]),
    ...(step.issues || []).slice(0, 1).map((item) => [item.code, "failed"]),
  ];
  if (!rows.length) {
    return "";
  }
  return `
    <span class="check-stack">
      ${rows
        .map(([label, state]) => `<span class="mini-pill ${stateClass(state)}">${escapeHtml(label)}</span>`)
        .join("")}
    </span>
  `;
}

function renderRawReceipt(report, activeStepId) {
  const receipt = (report.receipts || []).find((item) => item.step_id === activeStepId);
  const payload = receipt
    ? { ...receipt, receipt_digest: "coming in Phase 2" }
    : {
        mode: report.mode || currentMode,
        step_id: activeStepId || "not-selected",
        note: report.mode === "naive"
          ? "Naive mode records no agent-consistency receipt."
          : "Run the protected flow to inspect the receipt JSON.",
        receipt_digest: "coming in Phase 2",
      };
  rawTitle.textContent = receipt ? `${receipt.step_id} receipt` : "Selected receipt";
  rawJson.textContent = JSON.stringify(payload, null, 2);
}

function renderScenarioList() {
  scenarioList.innerHTML = scenarios
    .map((scenario) => {
      const selected = scenario.id === currentScenarioId ? " selected" : "";
      return `
        <button class="scenario-button${selected}" data-scenario="${escapeAttr(scenario.id)}" type="button">
          <strong>${escapeHtml(scenario.name)}</strong>
          <span>${escapeHtml(scenario.description)}</span>
        </button>
      `;
    })
    .join("");

  document.querySelectorAll(".scenario-button").forEach((button) => {
    button.addEventListener("click", () => {
      currentScenarioId = button.dataset.scenario;
      syncTogglesToScenario();
      selectedStepId = currentScenarioId === "missing_handoff" ? "01-intake" : "04-refund";
      renderPreview();
    });
  });
}

function renderCase(supportCase) {
  document.querySelector("#ticket-id").textContent = supportCase.ticket.ticket_id;
  document.querySelector("#customer-message").textContent = supportCase.ticket.customer_message;
  const details = {
    order: supportCase.order.order_id,
    amount: `${supportCase.refund_request.amount} ${supportCase.refund_request.currency}`,
    "previous refunds": supportCase.customer.previous_refund_count,
    "policy read": supportCase.policy_snapshot.read_version,
    "policy latest": supportCase.policy_snapshot.latest_version,
    "provider status": supportCase.provider_status.refund_status,
  };
  document.querySelector("#case-details").innerHTML = Object.entries(details)
    .map(
      ([key, value]) => `
        <div class="kv-row">
          <dt>${escapeHtml(key)}</dt>
          <dd>${escapeHtml(formatValue(value))}</dd>
        </div>
      `,
    )
    .join("");
}

function buildPlannedReport() {
  const steps = nodeSpecs.map(([stepId, label]) => ({
    step_id: stepId,
    agent_name: `${label} agent`,
    status: "pending",
    decision_summary: "Waiting for this gate.",
    gate_result: "waiting",
    contract_checks: [],
    evidence: [],
    outcome_verification: [],
    issues: [],
  }));
  return {
    mode: "preview",
    status: "pending",
    support_case: buildPreviewSupportCase(),
    timeline_entries: steps,
    receipts: [],
  };
}

function buildNaiveReport() {
  const supportCase = buildPreviewSupportCase();
  const risky = supportCase.provider_status.refund_status === "pending";
  const steps = nodeSpecs.map(([stepId, label]) => ({
    step_id: stepId,
    agent_name: `${label} agent`,
    status: "passed",
    decision_summary:
      stepId === "05-comms" && risky
        ? "Customer was told the refund completed without settlement evidence."
        : "Step continued after the tool response.",
    gate_result: "not gated",
    contract_checks: [],
    evidence: [],
    outcome_verification: [],
    issues: risky && stepId === "05-comms"
      ? [{ code: "false_success_bug", message: "Completed-refund claim after provider pending." }]
      : [],
  }));
  return {
    mode: "naive",
    status: risky ? "failed" : "passed",
    support_case: {
      ...supportCase,
      final_customer_response_preview:
        "Hi, your refund has been approved and settled. We appreciate your patience.",
    },
    timeline_entries: steps,
    receipts: [],
  };
}

function buildStaticProtectedReport() {
  const effective = effectiveScenarioId();
  const supportCase = buildPreviewSupportCase();
  const failedStep = {
    missing_handoff: "01-intake",
    stale_policy: "02-policy",
    pending_refund: "04-refund",
  }[effective];
  const failedIndex = failedStep ? nodeSpecs.findIndex(([stepId]) => stepId === failedStep) : -1;
  const steps = nodeSpecs.map(([stepId, label], index) => {
    let status = "passed";
    if (failedIndex >= 0 && index === failedIndex) {
      status = "failed";
    } else if (failedIndex >= 0 && index > failedIndex) {
      status = "skipped";
    }
    return staticStep(stepId, label, status, effective, supportCase);
  });
  const receipts = steps
    .filter((step) => step.status !== "skipped")
    .map((step) => staticReceipt(step, supportCase, effective));
  const failed = Boolean(failedStep);
  return {
    mode: "protected",
    status: failed ? "failed" : "passed",
    scenario: effective,
    scenario_metadata: selectedScenario(),
    support_case: supportCase,
    timeline_entries: steps,
    receipts,
    receipt_count: receipts.length,
    failure_message: failed ? "False success blocked." : null,
    recommended_next_action: failed
      ? "Repair the missing fact, refresh stale state, or wait for settlement before continuing."
      : "Send the verified customer response and archive the run artifacts.",
    customer_response_allowed: !failed,
  };
}

function staticStep(stepId, label, status, effective, supportCase) {
  const summaries = {
    "01-intake": status === "failed"
      ? "The intake handoff dropped previous refund count."
      : "Ticket and order were paired with required facts.",
    "02-policy": status === "failed"
      ? `Policy ${supportCase.policy_snapshot.read_version} was stale against ${supportCase.policy_snapshot.latest_version}.`
      : "Policy checks passed against a current policy snapshot.",
    "03-risk": "Risk checks passed and produced a refund gate.",
    "04-refund": status === "failed"
      ? "Refund provider returned pending; completed-refund messaging was blocked."
      : "Provider settlement was verified before comms.",
    "05-comms": status === "skipped"
      ? "Skipped because an upstream consistency gate blocked continuation."
      : "Customer response was allowed after settlement evidence.",
  };
  const issues = [];
  const outcomes = [];
  const checks = [];
  if (status === "failed" && stepId === "01-intake") {
    issues.push({ code: "invalid_handoff", message: "required fact order.previous_refund_count is missing" });
  }
  if (status === "failed" && stepId === "02-policy") {
    issues.push({ code: "stale_state", message: "refund_policy read version policy-v12; current version policy-v14" });
  }
  if (stepId === "04-refund") {
    outcomes.push({
      name: "refund_settled",
      passed: effective !== "pending_refund",
      reason: effective === "pending_refund" ? "refund status is pending, not settled" : "postcondition passed",
      details: { status: supportCase.provider_status.refund_status },
    });
    if (effective === "pending_refund") {
      issues.push({ code: "outcome_failed", message: "outcome refund_settled failed: refund status is pending" });
    }
  }
  if (status === "skipped") {
    issues.push({ code: "upstream_gate_blocked", message: "Not run after upstream failure." });
  }
  checks.push({
    label: stepId === "04-refund" ? "outcome: refund_settled" : "contract gate",
    state: status === "failed" ? "failed" : status === "skipped" ? "blocked" : "passed",
    detail: summaries[stepId],
  });
  return {
    step_id: stepId,
    agent_name: `${label} agent`,
    status,
    decision_summary: summaries[stepId],
    gate_result: status === "passed" ? "allowed next step" : status === "failed" ? "blocked continuation" : "not invoked",
    contract_checks: checks,
    evidence: status === "skipped" ? [] : [{ label: "evidence receipt", value: `${stepId} evidence recorded` }],
    outcome_verification: outcomes,
    issues,
  };
}

function staticReceipt(step, supportCase, effective) {
  return {
    run_id: `static-${effective}`,
    step_id: step.step_id,
    agent: step.agent_name.toLowerCase().replaceAll(" ", "-"),
    action: step.step_id === "04-refund" ? "issue_refund" : "validate_gate",
    status: step.status,
    state_reads: step.step_id === "02-policy"
      ? [{ name: "refund_policy", version: supportCase.policy_snapshot.read_version, digest: "static-preview" }]
      : [],
    handoffs: [],
    proof_artifacts: step.evidence.map((item) => ({
      name: item.label,
      kind: "static_preview",
      digest: "static-preview",
      verified: step.status === "passed",
    })),
    outcomes: step.outcome_verification,
    issues: step.issues,
    metadata: { static_preview: true },
  };
}

function supportCaseFromStatic(id) {
  const item = staticCases[id];
  return {
    ticket: {
      ticket_id: item.ticket,
      customer_message: item.message,
      submitted_at: "2026-04-19T10:45:00Z",
    },
    customer: {
      customer_id: "cus-400",
      account_age_days: 620,
      previous_refund_count: item.previousRefunds,
    },
    order: {
      order_id: item.order,
      version: "order-v1",
      status: "delivered",
      total: 42.5,
      currency: "USD",
    },
    refund_request: {
      order_id: item.order,
      amount: 42.5,
      currency: "USD",
      reason: "damaged item",
    },
    policy_snapshot: {
      read_version: item.policyRead,
      latest_version: item.policyLatest,
      max_refund_amount: 100,
      max_previous_refunds: 0,
      allowed_reasons: ["damaged item", "wrong item", "not received"],
    },
    risk_signals: {
      version: "risk-v3",
      latest_version: "risk-v3",
      chargebacks_12m: 0,
      manual_review: false,
    },
    provider_status: {
      refund_status: item.providerStatus,
      verification_target: "refund.status == settled",
    },
    final_customer_response_preview: "Suppressed until state, handoff, and outcome verification pass.",
  };
}

function buildPreviewSupportCase() {
  const base = supportCaseFromStatic(currentScenarioId);
  const overrides = currentOverrides();
  base.provider_status.refund_status = overrides.provider_status;
  base.customer.previous_refund_count = overrides.omit_previous_refund_count
    ? "missing"
    : staticCases[currentScenarioId].previousRefunds === "missing"
      ? 0
      : staticCases[currentScenarioId].previousRefunds;
  base.policy_snapshot.latest_version = overrides.stale_policy
    ? "policy-v14"
    : base.policy_snapshot.read_version;
  return base;
}

function currentOverrides() {
  return {
    provider_status: toggleProvider.checked ? "pending" : "settled",
    omit_previous_refund_count: toggleHandoff.checked,
    stale_policy: togglePolicy.checked,
  };
}

function effectiveScenarioId() {
  if (toggleHandoff.checked) {
    return "missing_handoff";
  }
  if (togglePolicy.checked) {
    return "stale_policy";
  }
  if (toggleProvider.checked) {
    return "pending_refund";
  }
  return "happy_path";
}

function syncTogglesToScenario() {
  toggleProvider.checked = currentScenarioId === "pending_refund";
  toggleHandoff.checked = currentScenarioId === "missing_handoff";
  togglePolicy.checked = currentScenarioId === "stale_policy";
}

function selectedScenario() {
  return scenarios.find((scenario) => scenario.id === currentScenarioId) || scenarios[0];
}

function orderScenarios(payload) {
  return [...payload].sort(
    (left, right) => scenarioOrder.indexOf(left.id) - scenarioOrder.indexOf(right.id),
  );
}

function setStatus(state, kicker, title, copy, chip) {
  statusBanner.className = `hero-banner ${state}`;
  statusKicker.textContent = kicker;
  statusTitle.textContent = title;
  statusCopy.textContent = copy;
  statusChip.textContent = chip;
}

function statusLabel(status) {
  return {
    idle: "Waiting",
    pending: "Waiting",
    running: "Running",
    passed: "Passed",
    failed: "Blocked",
    skipped: "Skipped",
  }[status] || status;
}

function stateClass(value) {
  if (value === true || value === "passed") {
    return "passed";
  }
  if (value === false || value === "failed") {
    return "failed";
  }
  if (value === "blocked" || value === "skipped") {
    return "skipped";
  }
  return "pending";
}

function formatValue(value) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }
  if (typeof value === "boolean") {
    return value ? "yes" : "no";
  }
  return String(value);
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail || `${response.status} ${response.statusText}`);
  }
  return response.json();
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

document.querySelectorAll(".mode-button").forEach((button) => {
  button.addEventListener("click", () => {
    currentMode = button.dataset.mode;
    document.querySelectorAll(".mode-button").forEach((item) => {
      item.classList.toggle("active", item === button);
    });
    renderPreview();
  });
});

[toggleProvider, toggleHandoff, togglePolicy].forEach((toggle) => {
  toggle.addEventListener("change", () => {
    currentReport = null;
    selectedStepId = effectiveScenarioId() === "missing_handoff" ? "01-intake" : "04-refund";
    renderPreview();
  });
});

copyButton.addEventListener("click", async () => {
  await navigator.clipboard?.writeText(rawJson.textContent);
  copyButton.textContent = "Copied";
  window.setTimeout(() => {
    copyButton.textContent = "Copy JSON";
  }, 900);
});

runButton.addEventListener("click", runWorkflow);
resetButton.addEventListener("click", () => {
  syncTogglesToScenario();
  renderPreview();
});

loadInitialState().catch((error) => {
  staticMode = true;
  setStatus("failed", "Startup failed", "Could not load demo configuration.", error.message, "Error");
  renderPreview();
});
