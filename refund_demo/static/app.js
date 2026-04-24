const scenarioSelect = document.querySelector("#scenario");
const providerSelect = document.querySelector("#provider");
const patternSelect = document.querySelector("#pattern-select");
const runButton = document.querySelector("#run-button");
const resetButton = document.querySelector("#reset-button");
const statusBanner = document.querySelector("#status-banner");
const statusKicker = document.querySelector("#status-kicker");
const statusTitle = document.querySelector("#status-title");
const statusCopy = document.querySelector("#status-copy");
const statusChip = document.querySelector("#status-chip");
const timeline = document.querySelector("#timeline");
const gateGrid = document.querySelector("#gate-grid");
const tabBody = document.querySelector("#tab-body");
const orchestratorPattern = document.querySelector("#orchestrator-pattern");
const orchestratorCopy = document.querySelector("#orchestrator-copy");

const plannedSteps = [
  {
    step_id: "01-intake",
    step_number: 1,
    agent_name: "Intake agent",
    running_label: "Reading customer ticket",
    action_label: "Read support ticket",
    decision_summary: "Waiting for the support ticket and order record.",
    status: "pending",
    gate_result: "waiting",
  },
  {
    step_id: "02-policy",
    step_number: 2,
    agent_name: "Policy agent",
    running_label: "Checking policy snapshot",
    action_label: "Check refund policy",
    decision_summary: "Waiting for the intake handoff.",
    status: "pending",
    gate_result: "waiting",
  },
  {
    step_id: "03-risk",
    step_number: 3,
    agent_name: "Risk agent",
    running_label: "Scoring refund risk",
    action_label: "Score refund risk",
    decision_summary: "Waiting for the policy decision.",
    status: "pending",
    gate_result: "waiting",
  },
  {
    step_id: "04-refund",
    step_number: 4,
    agent_name: "Refund execution agent",
    running_label: "Calling refund provider",
    action_label: "Call refund provider",
    decision_summary: "Waiting for risk approval.",
    status: "pending",
    gate_result: "waiting",
  },
  {
    step_id: "05-comms",
    step_number: 5,
    agent_name: "Comms agent",
    running_label: "Preparing customer response",
    action_label: "Prepare customer reply",
    decision_summary: "Waiting for settled refund evidence.",
    status: "pending",
    gate_result: "waiting",
  },
];

let scenarios = [];
let currentReport = null;
let activeTab = "overview";

async function loadInitialState() {
  const [scenarioPayload, config] = await Promise.all([
    fetchJson("/api/scenarios"),
    fetchJson("/api/config"),
  ]);
  scenarios = scenarioPayload;
  scenarioSelect.innerHTML = scenarios
    .map((scenario) => `<option value="${escapeHtml(scenario.id)}">${escapeHtml(scenario.name)}</option>`)
    .join("");
  providerSelect.value = config.default_provider;
  patternSelect.innerHTML = `<option>${escapeHtml(config.orchestration_pattern)}</option>`;
  renderScenarioPreview();
}

function renderScenarioPreview() {
  const scenario = selectedScenario();
  currentReport = null;
  setStatus(
    "idle",
    "Ready",
    scenario.title,
    scenario.description,
    scenario.expected === "passed" ? "Will pass" : "Will block",
  );
  renderCase(scenario.support_case_preview);
  renderOrchestrator({
    pattern: "Sequential receipt-gated handoff",
    state_transition: scenario.expected_result,
    gate_result: "ready",
    gates: plannedSteps,
  });
  renderTimeline(plannedSteps);
  renderTab();
}

async function runWorkflow() {
  runButton.disabled = true;
  resetButton.disabled = true;
  currentReport = null;
  const scenario = selectedScenario();
  setStatus(
    "running",
    "Running",
    scenario.title,
    "Reading state, validating handoffs, and verifying outcomes.",
    "Active",
  );
  renderTimeline(plannedSteps.map((step) => ({ ...step, status: "pending" })));
  renderOrchestrator({
    pattern: "Sequential receipt-gated handoff",
    state_transition: "Starting intake gate",
    gate_result: "running",
    gates: plannedSteps,
  });

  try {
    const report = await fetchJson("/api/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenario: scenarioSelect.value,
        provider: providerSelect.value,
      }),
    });
    currentReport = report;
    renderCase(report.support_case);
    await animateReport(report);
    renderReport(report);
  } catch (error) {
    setStatus("failed", "Request failed", "Workflow request failed.", error.message, "Error");
  } finally {
    runButton.disabled = false;
    resetButton.disabled = false;
  }
}

async function animateReport(report) {
  const finalSteps = report.timeline_entries || [];
  const displayed = finalSteps.map((step) => ({ ...step, status: "pending" }));
  renderTimeline(displayed);
  renderOrchestrator({ ...report.orchestrator, gates: displayed });

  for (let index = 0; index < finalSteps.length; index += 1) {
    const finalStep = finalSteps[index];
    if (finalStep.status === "skipped") {
      displayed[index] = finalStep;
      renderTimeline(displayed);
      renderOrchestrator({ ...report.orchestrator, gates: displayed });
      continue;
    }

    displayed[index] = { ...finalStep, status: "active", gate_result: "checking" };
    setStatus(
      "running",
      finalStep.agent_name,
      finalStep.running_label,
      "Validating contract checks, evidence, and outcome verification.",
      "Active",
    );
    renderTimeline(displayed, finalStep.step_id);
    renderOrchestrator({ ...report.orchestrator, gates: displayed }, finalStep.step_id);
    renderTab(displayed);
    await delay(650);

    displayed[index] = finalStep;
    renderTimeline(displayed);
    renderOrchestrator({ ...report.orchestrator, gates: displayed });
    renderTab(displayed);

    if (finalStep.status === "failed") {
      setStatus(
        "failed",
        "False success prevented",
        report.failure_message || "Workflow blocked before unsafe continuation.",
        report.recommended_next_action,
        "Blocked",
      );
      await delay(420);
    } else {
      await delay(260);
    }
  }
}

function renderReport(report) {
  const scenario = report.scenario_metadata;
  if (report.status === "passed") {
    setStatus(
      "passed",
      "Verified",
      scenario.banner,
      report.recommended_next_action,
      "Passed",
    );
  } else {
    setStatus(
      "failed",
      "False success prevented",
      report.failure_message || scenario.banner,
      report.recommended_next_action,
      "Blocked",
    );
  }
  renderTimeline(report.timeline_entries || []);
  renderOrchestrator(report.orchestrator);
  renderTab();
}

function renderCase(supportCase) {
  if (!supportCase) {
    return;
  }
  document.querySelector("#ticket-id").textContent = supportCase.ticket.ticket_id;
  document.querySelector("#customer-message").textContent = supportCase.ticket.customer_message;
  renderDl("#customer-details", supportCase.customer);
  renderDl("#order-details", supportCase.order);
  renderDl("#refund-details", supportCase.refund_request);
  renderDl("#policy-details", supportCase.policy_snapshot);
  renderDl("#risk-details", supportCase.risk_signals);
  renderDl("#provider-details", supportCase.provider_status);
  document.querySelector("#response-preview").textContent =
    supportCase.final_customer_response_preview;
}

function renderDl(selector, values) {
  document.querySelector(selector).innerHTML = Object.entries(values)
    .map(
      ([key, value]) => `
        <div class="kv-row">
          <dt>${escapeHtml(labelize(key))}</dt>
          <dd>${escapeHtml(formatValue(value))}</dd>
        </div>
      `,
    )
    .join("");
}

function renderTimeline(steps, activeStepId = null) {
  timeline.innerHTML = steps.map((step) => renderTimelineStep(step, activeStepId)).join("");
}

function renderTimelineStep(step, activeStepId) {
  const status = step.step_id === activeStepId ? "active" : step.status;
  const marker = markerLabel(status, step.step_number);
  const shimmer = status === "active" ? " shimmer" : "";
  return `
    <article class="timeline-step ${escapeHtml(status)}">
      <div class="step-marker">${marker}</div>
      <div class="step-content${shimmer}">
        <div class="trace-head">
          <strong>${escapeHtml(step.agent_name)}</strong>
          <span class="pill ${escapeHtml(status)}">${escapeHtml(statusLabel(status))}</span>
        </div>
        <p>${escapeHtml(status === "active" ? step.running_label : step.decision_summary)}</p>
        <span class="mini-pill ${escapeHtml(status)}">${escapeHtml(step.gate_result || "waiting")}</span>
      </div>
    </article>
  `;
}

function renderOrchestrator(orchestrator, activeStepId = null) {
  if (!orchestrator) {
    return;
  }
  orchestratorPattern.textContent = orchestrator.pattern;
  orchestratorCopy.textContent =
    `${orchestrator.state_transition || "Ready"}; gate result: ${orchestrator.gate_result || "ready"}.`;
  gateGrid.innerHTML = (orchestrator.gates || plannedSteps)
    .map((gate) => {
      const status = gate.step_id === activeStepId ? "active" : gate.status;
      return `
        <article class="gate-card ${escapeHtml(status)}">
          <span class="mini-pill ${escapeHtml(status)}">${escapeHtml(statusLabel(status))}</span>
          <strong>${escapeHtml(gate.step_id)}</strong>
          <span>${escapeHtml(gate.agent || gate.agent_name)}</span>
        </article>
      `;
    })
    .join("");
}

function renderTab(stepsOverride = null) {
  if (!currentReport) {
    renderScenarioTab();
    return;
  }
  const steps = stepsOverride || currentReport.timeline_entries || [];
  if (activeTab === "overview") {
    tabBody.innerHTML = renderOverview(currentReport);
  } else if (activeTab === "trace") {
    tabBody.innerHTML = renderTrace(steps);
  } else if (activeTab === "proof") {
    tabBody.innerHTML = renderProof(steps);
  } else if (activeTab === "json") {
    tabBody.innerHTML = `<pre>${escapeHtml(JSON.stringify(currentReport, null, 2))}</pre>`;
  } else {
    tabBody.innerHTML = renderArtifacts(currentReport);
  }
}

function renderScenarioTab() {
  const scenario = selectedScenario();
  tabBody.innerHTML = `
    <div class="overview-grid">
      <article class="insight-card">
        <strong>What you will see</strong>
        <p>${escapeHtml(scenario.description)}</p>
      </article>
      <article class="insight-card">
        <strong>What gets blocked</strong>
        <p>${escapeHtml(scenario.what_gets_blocked)}</p>
      </article>
      <article class="insight-card">
        <strong>Business risk prevented</strong>
        <p>${escapeHtml(scenario.business_risk_prevented)}</p>
      </article>
    </div>
  `;
}

function renderOverview(report) {
  const scenario = report.scenario_metadata;
  return `
    <div class="overview-grid">
      <article class="insight-card">
        <strong>Run result</strong>
        <p>${escapeHtml(report.status.toUpperCase())}</p>
      </article>
      <article class="insight-card">
        <strong>Why this matters</strong>
        <p>${escapeHtml(scenario.why_it_matters)}</p>
      </article>
      <article class="insight-card">
        <strong>Next action</strong>
        <p>${escapeHtml(report.recommended_next_action)}</p>
      </article>
      <article class="insight-card">
        <strong>Customer response</strong>
        <p>${escapeHtml(report.customer_response_allowed ? "Allowed" : "Suppressed")}</p>
      </article>
      <article class="insight-card">
        <strong>Provider</strong>
        <p>${escapeHtml(report.provider)}</p>
      </article>
      <article class="insight-card">
        <strong>Receipts</strong>
        <p>${escapeHtml(report.receipt_count)}</p>
      </article>
    </div>
  `;
}

function renderTrace(steps) {
  return `
    <div class="trace-list">
      ${steps.map(renderTraceCard).join("")}
    </div>
  `;
}

function renderTraceCard(step) {
  return `
    <article class="trace-card ${escapeHtml(step.status)}">
      <div class="trace-head">
        <div>
          <strong>${escapeHtml(step.step_id)} - ${escapeHtml(step.agent_name)}</strong>
          <p>${escapeHtml(step.decision_summary)}</p>
        </div>
        <span class="pill ${escapeHtml(step.status)}">${escapeHtml(step.result || statusLabel(step.status))}</span>
      </div>
      <div class="trace-sections">
        ${renderDetails("Facts received", step.facts_received)}
        ${renderDetails("Contract checks", step.contract_checks, "state")}
        ${renderDetails("Evidence", step.evidence)}
        ${renderDetails("Handoff facts", step.handoff_facts)}
        ${renderDetails("Outcome verification", step.outcome_verification, "passed")}
        ${renderDetails("Issues", step.issues)}
      </div>
    </article>
  `;
}

function renderDetails(title, rows, stateKey = null) {
  if (!rows || rows.length === 0) {
    return `
      <details>
        <summary>${escapeHtml(title)}</summary>
        <div class="detail-list"><span class="detail-row">None recorded.</span></div>
      </details>
    `;
  }
  return `
    <details open>
      <summary>${escapeHtml(title)}</summary>
      <div class="detail-list">
        ${rows.map((row) => renderDetailRow(row, stateKey)).join("")}
      </div>
    </details>
  `;
}

function renderDetailRow(row, stateKey) {
  const badge = stateKey ? `<span class="mini-pill ${stateClass(row[stateKey])}">${stateText(row[stateKey])}</span>` : "";
  const label = row.label || row.name || row.code || "item";
  const value = row.value || row.detail || row.reason || row.message || formatValue(row.details || "");
  return `
    <div class="detail-row">
      <strong>${escapeHtml(label)}</strong>
      <span>${badge}${badge ? " " : ""}${escapeHtml(formatValue(value))}</span>
    </div>
  `;
}

function renderProof(steps) {
  const rows = steps.flatMap((step) => [
    ...(step.evidence || []).map((item) => ({
      step,
      title: item.label,
      copy: item.value,
      state: step.status,
    })),
    ...(step.outcome_verification || []).map((item) => ({
      step,
      title: `outcome: ${item.name}`,
      copy: item.reason || formatValue(item.details),
      state: item.passed ? "passed" : "failed",
    })),
  ]);
  if (!rows.length) {
    return '<div class="empty-state">No proof artifacts recorded yet.</div>';
  }
  return `
    <div class="proof-grid">
      ${rows
        .map(
          (row) => `
            <article class="proof-card">
              <span class="mini-pill ${escapeHtml(row.state)}">${escapeHtml(row.step.step_id)}</span>
              <strong>${escapeHtml(row.title)}</strong>
              <p>${escapeHtml(formatValue(row.copy))}</p>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderArtifacts(report) {
  const links = report.links || {};
  return `
    <div class="artifact-grid">
      <article class="artifact-card">
        <strong>Summary</strong>
        <div class="link-list"><a href="${escapeAttr(links.summary || "#")}" target="_blank">summary.json</a></div>
      </article>
      <article class="artifact-card">
        <strong>HTML report</strong>
        <div class="link-list"><a href="${escapeAttr(links.html_report || "#")}" target="_blank">report.html</a></div>
      </article>
      <article class="artifact-card">
        <strong>Receipt log</strong>
        <div class="link-list"><a href="${escapeAttr(links.receipts || "#")}" target="_blank">receipts.jsonl</a></div>
      </article>
      <article class="artifact-card">
        <strong>Recommended next action</strong>
        <p>${escapeHtml(report.recommended_next_action)}</p>
      </article>
    </div>
  `;
}

function setStatus(state, kicker, title, copy, chip) {
  statusBanner.className = `status-banner ${state}`;
  statusKicker.textContent = kicker;
  statusTitle.textContent = title;
  statusCopy.textContent = copy;
  statusChip.textContent = chip;
}

function selectedScenario() {
  return scenarios.find((scenario) => scenario.id === scenarioSelect.value) || scenarios[0];
}

function markerLabel(status, number) {
  if (status === "passed") {
    return "OK";
  }
  if (status === "failed") {
    return "!";
  }
  if (status === "skipped") {
    return "--";
  }
  return escapeHtml(number);
}

function statusLabel(status) {
  return {
    active: "Running",
    passed: "Passed",
    failed: "Blocked",
    skipped: "Skipped",
    pending: "Pending",
    idle: "Idle",
  }[status] || status;
}

function stateClass(value) {
  if (value === true || value === "passed") {
    return "passed";
  }
  if (value === false || value === "failed") {
    return "failed";
  }
  if (value === "blocked") {
    return "skipped";
  }
  return "pending";
}

function stateText(value) {
  if (value === true) {
    return "passed";
  }
  if (value === false) {
    return "failed";
  }
  return String(value || "recorded");
}

function labelize(key) {
  return String(key).replaceAll("_", " ");
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

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => {
    activeTab = button.dataset.tab;
    document.querySelectorAll(".tab-button").forEach((tab) => {
      tab.classList.toggle("active", tab === button);
    });
    renderTab();
  });
});

scenarioSelect.addEventListener("change", renderScenarioPreview);
runButton.addEventListener("click", runWorkflow);
resetButton.addEventListener("click", renderScenarioPreview);

loadInitialState().catch((error) => {
  setStatus("failed", "Startup failed", "Could not load demo configuration.", error.message, "Error");
});
