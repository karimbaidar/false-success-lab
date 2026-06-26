const entryButtons = document.querySelectorAll(".entry-card");
const scenarioView = document.querySelector("#scenario-view");
const localView = document.querySelector("#local-view");
const githubView = document.querySelector("#github-view");
const runButton = document.querySelector("#run-button");
const copyReportButton = document.querySelector("#copy-report");
const statusBanner = document.querySelector("#status-banner");
const statusKicker = document.querySelector("#status-kicker");
const statusTitle = document.querySelector("#status-title");
const statusCopy = document.querySelector("#status-copy");
const statusChip = document.querySelector("#status-chip");
const scenarioList = document.querySelector("#scenario-list");
const scenarioTitle = document.querySelector("#scenario-title");
const workflowLane = document.querySelector("#workflow-lane");
const naiveCopy = document.querySelector("#naive-copy");
const protectedCopy = document.querySelector("#protected-copy");
const metrics = document.querySelector("#metrics");
const topFindings = document.querySelector("#top-findings");
const proofTrail = document.querySelector("#proof-trail");
const receiptJson = document.querySelector("#receipt-json");
const proofTitle = document.querySelector("#proof-title");
const gateChip = document.querySelector("#gate-chip");
const fixCode = document.querySelector("#fix-code");
const localReportInput = document.querySelector("#local-report-input");
const localReportFile = document.querySelector("#local-report-file");
const localMetrics = document.querySelector("#local-metrics");
const localFindings = document.querySelector("#local-findings");
const parseLocalReport = document.querySelector("#parse-local-report");
const githubUrl = document.querySelector("#github-url");
const scanGithub = document.querySelector("#scan-github");
const githubHelper = document.querySelector("#github-helper");
const githubMetrics = document.querySelector("#github-metrics");
const githubFindings = document.querySelector("#github-findings");

const workflowSteps = [
  ["state_read", "Read state"],
  ["handoff_checked", "Check handoff"],
  ["tool_call", "Call tool/API"],
  ["outcome_verify", "Verify outcome"],
  ["decision_blocked", "Gate decision"],
];

const scenarios = [
  scenario({
    id: "refund_customer",
    name: "Refund customer",
    action: "send_refund_confirmation",
    severity: "high",
    confidence: "high",
    category: "financial",
    naive:
      "Emails the customer that the refund is complete after the refund API returns 200 OK.",
    protected:
      "Blocks the message until the payment provider confirms refund_settled.",
    topFinding:
      "send_refund_confirmation may claim completion before refund settlement is confirmed.",
    missing: ["confirmed outcome check", "idempotency key", "refund_settled evidence"],
    evidence: ["refund API accepted request", "provider status pending"],
    outcome: "refund_settled",
    receiptEvent: "decision_blocked",
    fixRequirement: "refund_settled",
    backendScenario: "pending_refund",
  }),
  scenario({
    id: "close_support_ticket",
    name: "Close support ticket",
    action: "close_ticket",
    severity: "high",
    confidence: "medium",
    category: "support",
    naive:
      "Marks the ticket resolved after a tool says the workflow ran.",
    protected:
      "Blocks closure until resolution evidence and customer-visible facts are present.",
    topFinding:
      "close_ticket may mark work resolved before resolution evidence is confirmed.",
    missing: ["resolution evidence", "handoff facts"],
    evidence: ["ticket update tool returned success"],
    outcome: "resolution_confirmed",
    receiptEvent: "decision_blocked",
    fixRequirement: "resolution_confirmed",
  }),
  scenario({
    id: "delete_account",
    name: "Delete account",
    action: "delete_user",
    severity: "high",
    confidence: "high",
    category: "destructive",
    naive:
      "Deletes an account and announces completion without idempotency or deletion confirmation.",
    protected:
      "Requires an idempotency key plus a deletion confirmation read before continuing.",
    topFinding:
      "delete_user is destructive and needs idempotency plus deletion confirmation.",
    missing: ["idempotency key", "deletion confirmation"],
    evidence: ["delete API returned accepted"],
    outcome: "deletion_confirmed",
    receiptEvent: "decision_blocked",
    fixRequirement: "deletion_confirmed",
  }),
  scenario({
    id: "provision_server",
    name: "Provision server",
    action: "provision",
    severity: "medium",
    confidence: "medium",
    category: "production_state",
    naive:
      "Reports infrastructure ready after the provisioning request is accepted.",
    protected:
      "Waits for health checks and desired-state confirmation before announcing readiness.",
    topFinding:
      "provision changes production state without a nearby readiness check.",
    missing: ["readiness check", "read-after-write confirmation"],
    evidence: ["cloud API accepted request"],
    outcome: "server_ready",
    receiptEvent: "decision_blocked",
    fixRequirement: "server_ready",
  }),
  scenario({
    id: "update_crm",
    name: "Update CRM",
    action: "update_record",
    severity: "medium",
    confidence: "low",
    category: "production_state",
    naive:
      "Says the account was updated after sending a write request to the CRM.",
    protected:
      "Reads the CRM record back and blocks unsupported claims if the write is not visible.",
    topFinding:
      "update_record may change production state without read-after-write verification.",
    missing: ["read-after-write confirmation"],
    evidence: ["CRM update call returned success"],
    outcome: "crm_record_updated",
    receiptEvent: "decision_blocked",
    fixRequirement: "read_after_write_confirmed",
  }),
  scenario({
    id: "grant_access",
    name: "Grant access",
    action: "grant_access",
    severity: "high",
    confidence: "high",
    category: "access_control",
    naive:
      "Tells the user access was granted without checking the final user and role.",
    protected:
      "Confirms the correct principal, role, and scope before reporting access granted.",
    topFinding:
      "grant_access changes access without a nearby correctness confirmation.",
    missing: ["correct user confirmation", "role and scope confirmation"],
    evidence: ["IAM API accepted request"],
    outcome: "access_grant_verified",
    receiptEvent: "decision_blocked",
    fixRequirement: "access_grant_verified",
  }),
  scenario({
    id: "place_trade",
    name: "Place trade",
    action: "place_trade",
    severity: "high",
    confidence: "high",
    category: "trading",
    naive:
      "Claims an order filled after broker submission succeeds.",
    protected:
      "Blocks completion until the broker confirms fill status and quantity.",
    topFinding:
      "place_trade may report an order as complete before broker fill confirmation.",
    missing: ["broker fill confirmation", "idempotency key"],
    evidence: ["broker order accepted"],
    outcome: "order_filled",
    receiptEvent: "decision_blocked",
    fixRequirement: "order_filled",
  }),
];

let activeEntry = "scenario";
let activeScenarioId = "refund_customer";
let activeMode = "protected";
let currentMarkdown = "";
let currentFixes = {};
let staticBackend = false;

function scenario(input) {
  return {
    ...input,
    path: `agents/${input.id}.py`,
    line: input.id === "refund_customer" ? 142 : 87,
  };
}

function render() {
  renderEntry();
  if (activeEntry === "scenario") {
    renderScenarioList();
    renderScenarioLab(buildScenarioReport(selectedScenario(), activeMode));
  }
}

function renderEntry() {
  entryButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.entry === activeEntry);
  });
  scenarioView.classList.toggle("hidden", activeEntry !== "scenario");
  localView.classList.toggle("hidden", activeEntry !== "local");
  githubView.classList.toggle("hidden", activeEntry !== "github");
  runButton.classList.toggle("hidden", activeEntry !== "scenario");
}

function renderScenarioList() {
  scenarioList.innerHTML = scenarios
    .map(
      (item) => `
        <button class="scenario-button ${item.id === activeScenarioId ? "selected" : ""}" data-scenario="${escapeAttr(item.id)}" type="button">
          <strong>${escapeHtml(item.name)}</strong>
          <span>${escapeHtml(item.topFinding)}</span>
        </button>
      `,
    )
    .join("");
  document.querySelectorAll(".scenario-button").forEach((button) => {
    button.addEventListener("click", () => {
      activeScenarioId = button.dataset.scenario;
      render();
    });
  });
}

function renderScenarioLab(report) {
  const item = selectedScenario();
  scenarioTitle.textContent = item.name;
  naiveCopy.textContent = item.naive;
  protectedCopy.textContent = item.protected;
  runButton.textContent = activeMode === "naive" ? "Run naive" : "Run protected";
  document.querySelectorAll(".mode-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === activeMode);
  });
  setStatus(
    activeMode === "naive" ? "risk" : report.card.gate_label.toLowerCase(),
    activeMode === "naive" ? "Naive behavior" : "Protected behavior",
    activeMode === "naive" ? "The agent trusts done too early." : report.card.gate_detail,
    activeMode === "naive" ? item.naive : item.protected,
    activeMode === "naive" ? "Risk" : report.card.gate_label,
  );
  workflowLane.innerHTML = workflowSteps
    .map(([key, label], index) => {
      const state = activeMode === "naive" ? "passed" : index < 3 ? "passed" : "blocked";
      return `
        <article class="flow-node ${state}">
          <span>${index + 1}</span>
          <strong>${escapeHtml(label)}</strong>
          <small>${escapeHtml(key)}</small>
        </article>
      `;
    })
    .join("");
  renderReportCard(report.card, metrics, topFindings);
  renderProof(report);
  currentMarkdown = report.markdown;
  currentFixes = report.fixes;
  fixCode.textContent = currentFixes.python;
}

function buildScenarioReport(item, mode) {
  const card = buildCard(item, mode);
  const receipts = buildReceipts(item, mode);
  return {
    card,
    receipts,
    proofTrail: receipts.map((receipt) => ({
      event: receipt.event,
      time: receipt.time,
      detail: receipt.summary,
      status: receipt.status,
    })),
    fixes: buildFixes(item),
    markdown: markdownForCard(card),
  };
}

function buildCard(item, mode) {
  const finding = {
    action: item.action,
    severity: item.severity,
    confidence: mode === "naive" ? "high" : item.confidence,
    path: item.path,
    line: item.line,
    why: item.confidence === "low" ? `Possible risk, needs review. ${item.topFinding}` : item.topFinding,
    evidence_found: item.evidence,
    evidence_missing: item.missing,
    suggested_fix: pythonFix(item),
  };
  const high = item.severity === "high" ? 1 : 0;
  const medium = item.severity === "medium" ? 1 : 0;
  const low = item.severity === "low" ? 1 : 0;
  return {
    repository: "built-in/false-success-lab",
    risky_actions_found: 1,
    high_severity: high,
    medium_severity: medium,
    low_severity: low,
    false_success_exposure: 1,
    confidence: item.confidence,
    top_finding: finding,
    findings: [finding],
    gate_label: mode === "naive" ? "RISK" : high ? "BLOCK" : "REVIEW",
    gate_detail:
      mode === "naive"
        ? "Naive flow allows the unsupported completion claim."
        : high
          ? "High-risk false-success exposure found. Do not continue until evidence checks are added."
          : "Possible risk found. Review and add evidence before claiming completion.",
  };
}

function buildReceipts(item, mode) {
  const blocked = mode !== "naive";
  return [
    receipt("state_read", "10:24:42", "passed", `Read current state for ${item.name}.`),
    receipt("handoff_sent", "10:24:49", "passed", "Sent required facts to the next agent."),
    receipt("handoff_checked", "10:24:55", "passed", "Checked required facts and evidence."),
    receipt("tool_call", "10:25:01", "passed", `Called ${item.action} with idempotency_key=demo-123.`),
    receipt("tool_response", "10:25:02", "passed", "Tool response was accepted."),
    receipt(
      "outcome_verify",
      "10:25:08",
      blocked ? "failed" : "missing",
      blocked
        ? `Checked ${item.outcome}: false.`
        : "No independent outcome verification was performed.",
    ),
    receipt(
      blocked ? "decision_blocked" : "decision_allowed",
      "10:25:09",
      blocked ? "blocked" : "risk",
      blocked
        ? "Workflow stopped before the unsupported claim."
        : "Workflow continued even though evidence was missing.",
    ),
  ];
}

function receipt(event, time, status, summary) {
  return { event, time, status, summary };
}

function renderReportCard(card, metricTarget, findingsTarget) {
  metricTarget.innerHTML = [
    ["Risky actions found", card.risky_actions_found],
    ["High severity", card.high_severity],
    ["Medium severity", card.medium_severity],
    ["Low severity", card.low_severity],
    ["False-success exposure", card.false_success_exposure],
    ["Confidence", card.confidence],
  ]
    .map(
      ([label, value]) => `
        <div class="metric">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(String(value))}</strong>
        </div>
      `,
    )
    .join("");

  findingsTarget.innerHTML = (card.findings || [])
    .slice(0, 5)
    .map(
      (finding) => `
        <article class="finding-card ${escapeHtml(finding.severity)}">
          <div class="finding-head">
            <strong>${escapeHtml(finding.action)}</strong>
            <span>${escapeHtml(finding.severity)} / ${escapeHtml(finding.confidence)}</span>
          </div>
          <p>${escapeHtml(finding.why)}</p>
          <dl>
            <div><dt>File</dt><dd>${escapeHtml(finding.path || "unknown")}:${escapeHtml(String(finding.line || "?"))}</dd></div>
            <div><dt>Missing evidence</dt><dd>${escapeHtml((finding.evidence_missing || []).join(", "))}</dd></div>
            <div><dt>Suggested fix</dt><dd>${escapeHtml(firstLine(finding.suggested_fix || "Add outcome verification."))}</dd></div>
          </dl>
        </article>
      `,
    )
    .join("");
}

function renderProof(report) {
  const card = report.card;
  proofTitle.textContent = card.gate_detail;
  gateChip.textContent = card.gate_label;
  gateChip.className = `status-chip ${card.gate_label.toLowerCase()}`;
  proofTrail.innerHTML = report.proofTrail
    .map(
      (item) => `
        <article class="proof-step ${escapeHtml(item.status)}">
          <span>${escapeHtml(item.event)}</span>
          <strong>${escapeHtml(item.time)}</strong>
          <p>${escapeHtml(item.detail)}</p>
        </article>
      `,
    )
    .join("");
  receiptJson.textContent = JSON.stringify(report.receipts, null, 2);
}

async function runScenario() {
  const item = selectedScenario();
  if (item.backendScenario && activeMode === "protected" && !staticBackend) {
    runButton.disabled = true;
    try {
      const payload = await fetchJson("api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: item.backendScenario, provider: "heuristic" }),
      });
      const report = buildScenarioReport(item, "protected");
      report.receipts = payload.receipts || report.receipts;
      report.proofTrail = (payload.timeline_entries || []).map((step) => ({
        event: step.step_id,
        time: step.status,
        status: step.status,
        detail: step.decision_summary,
      }));
      renderScenarioLab(report);
    } catch {
      staticBackend = true;
      renderScenarioLab(buildScenarioReport(item, activeMode));
    } finally {
      runButton.disabled = false;
    }
    return;
  }
  renderScenarioLab(buildScenarioReport(item, activeMode));
}

async function scanPublicGithub() {
  scanGithub.disabled = true;
  githubHelper.textContent = "Scanning public repo...";
  try {
    const payload = await fetchJson("api/scans/github", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: githubUrl.value.trim() }),
    });
    const card = cardFromScannerPayload(payload);
    renderReportCard(card, githubMetrics, githubFindings);
    currentMarkdown = payload.markdown || markdownForCard(card);
    githubHelper.textContent = "Scan complete. Copy report is ready.";
  } catch (error) {
    githubHelper.textContent = `${error.message} Run the CLI locally and paste the report instead.`;
  } finally {
    scanGithub.disabled = false;
  }
}

function renderLocalReport() {
  const text = localReportInput.value.trim();
  if (!text) {
    localMetrics.innerHTML = "";
    localFindings.innerHTML = "<p class=\"helper-copy\">Paste JSON or Markdown output first.</p>";
    return;
  }
  const card = cardFromPastedReport(text);
  renderReportCard(card, localMetrics, localFindings);
  currentMarkdown = text.startsWith("{") ? markdownForCard(card) : text;
}

function cardFromScannerPayload(payload) {
  const report = payload.report || payload;
  return {
    repository: report.repository || "scanned repo",
    risky_actions_found: report.risky_actions_found || 0,
    high_severity: report.high_severity || 0,
    medium_severity: report.medium_severity || 0,
    low_severity: report.low_severity || 0,
    false_success_exposure: report.false_success_exposure || 0,
    confidence: report.confidence || "low",
    findings: report.findings || [],
    gate_label: report.high_severity ? "BLOCK" : report.risky_actions_found ? "REVIEW" : "ALLOW",
    gate_detail: "Scanner report imported.",
  };
}

function cardFromPastedReport(text) {
  if (text.startsWith("{")) {
    return cardFromScannerPayload(JSON.parse(text));
  }
  const risky = numberAfter(text, /Risky actions found:\s*(\d+)/i);
  const high = numberAfter(text, /High severity:\s*(\d+)/i);
  const medium = numberAfter(text, /Medium severity:\s*(\d+)/i);
  const low = numberAfter(text, /Low severity:\s*(\d+)/i);
  const exposure = numberAfter(text, /False-success exposure:\s*(\d+)/i) || risky;
  const confidence = (text.match(/Confidence:\s*`?([a-z]+)/i) || [null, "low"])[1];
  const top = text.match(/###\s*(HIGH|MEDIUM|LOW).*?`([^`]+)`/i);
  return {
    repository: "pasted report",
    risky_actions_found: risky,
    high_severity: high,
    medium_severity: medium,
    low_severity: low,
    false_success_exposure: exposure,
    confidence,
    gate_label: high ? "BLOCK" : risky ? "REVIEW" : "ALLOW",
    gate_detail: "Pasted scanner report.",
    findings: top
      ? [
          {
            severity: top[1].toLowerCase(),
            confidence,
            action: top[2],
            why: confidence === "low" ? "Possible risk, needs review." : "Imported Markdown finding.",
            evidence_missing: ["review pasted report"],
            suggested_fix: "Add verified_action or reliability_gate checks.",
          },
        ]
      : [],
  };
}

function markdownForCard(card) {
  const lines = [
    "# False-success report card",
    "",
    `Repository: \`${card.repository || "False Success Lab"}\``,
    `False-success exposure: ${card.false_success_exposure} unguarded actions`,
    `Confidence: ${card.confidence}`,
    "",
    "## Summary",
    "",
    `* Risky actions found: ${card.risky_actions_found}`,
    `* High severity: ${card.high_severity}`,
    `* Medium severity: ${card.medium_severity}`,
    `* Low severity: ${card.low_severity}`,
  ];
  if (card.findings && card.findings.length) {
    lines.push("", "## Top findings", "");
    card.findings.forEach((finding) => {
      lines.push(`### ${finding.severity.toUpperCase()} - \`${finding.action}\``);
      lines.push(finding.why);
      lines.push(`Missing evidence: ${(finding.evidence_missing || []).join(", ")}`);
      lines.push("");
    });
  }
  return `${lines.join("\n")}\n`;
}

function buildFixes(item) {
  return {
    python: pythonFix(item),
    langgraph: langGraphFix(item),
    tool: toolFix(item),
  };
}

function pythonFix(item) {
  return `with reliability_gate(
    run,
    "scanner",
    "${item.action}",
    criticality="${item.category}",
    idempotency_key=request_id,
) as gate:
    gate.step.verify_outcome("${item.fixRequirement}", lambda: status_is_confirmed())
    # continue only when the outcome check passes`;
}

function langGraphFix(item) {
  return `@verified_node(
    action="${item.action}",
    criticality="${item.category}",
    requires=["${item.fixRequirement}"],
)
def ${item.id}_node(state):
    return perform_action(state)`;
}

function toolFix(item) {
  return `${item.action}_tool = verified_tool(
    ${item.action}_tool,
    outcome=${pascal(item.fixRequirement)}Verifier(...),
    criticality="${item.category}",
)`;
}

function selectedScenario() {
  return scenarios.find((item) => item.id === activeScenarioId) || scenarios[0];
}

function setStatus(state, kicker, title, copy, chip) {
  statusBanner.className = `status-banner ${state}`;
  statusKicker.textContent = kicker;
  statusTitle.textContent = title;
  statusCopy.textContent = copy;
  statusChip.textContent = chip;
}

function firstLine(value) {
  return String(value).split("\n")[0];
}

function numberAfter(text, pattern) {
  const match = text.match(pattern);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function pascal(value) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json();
  if (!response.ok) {
    const detail = payload.detail || payload.error || "Request failed.";
    throw new Error(detail);
  }
  return payload;
}

function copyText(value) {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(value);
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
  return Promise.resolve();
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
  return escapeHtml(value);
}

entryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeEntry = button.dataset.entry;
    renderEntry();
  });
});

document.querySelectorAll(".mode-button").forEach((button) => {
  button.addEventListener("click", () => {
    activeMode = button.dataset.mode;
    renderScenarioLab(buildScenarioReport(selectedScenario(), activeMode));
  });
});

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const key = button.dataset.copy;
    const value = key === "receipt" ? receiptJson.textContent : currentFixes[key] || "";
    await copyText(value);
    button.textContent = "Copied";
    setTimeout(() => {
      button.textContent = key === "receipt" ? "Copy JSON" : key === "tool" ? "Tool wrapper" : key;
    }, 1200);
  });
});

runButton.addEventListener("click", runScenario);
scanGithub.addEventListener("click", scanPublicGithub);
parseLocalReport.addEventListener("click", renderLocalReport);
copyReportButton.addEventListener("click", async () => {
  await copyText(currentMarkdown || markdownForCard(buildScenarioReport(selectedScenario(), activeMode).card));
  copyReportButton.textContent = "Copied";
  setTimeout(() => {
    copyReportButton.textContent = "Copy report";
  }, 1200);
});

localReportFile.addEventListener("change", async () => {
  const file = localReportFile.files && localReportFile.files[0];
  if (!file) {
    return;
  }
  localReportInput.value = await file.text();
  renderLocalReport();
});

render();
