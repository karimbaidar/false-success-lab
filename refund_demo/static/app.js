const STATIC_MODE_MESSAGE =
  "Static demo mode: public GitHub scanning requires the FastAPI backend. You can still import a local scan report or try built-in scenarios.";
const DEFAULT_HOSTED_API_BASE_URL = "https://false-success-lab-api.vercel.app";

const shell = String.raw`
  <div class="ambient-grid" aria-hidden="true"></div>
  <div class="orb orb-one" aria-hidden="true"></div>
  <div class="orb orb-two" aria-hidden="true"></div>
  <header class="top-nav">
    <a class="brand-mark" href="#scanner" aria-label="False Success Lab home">
      <span class="brand-glyph">FS</span>
      <span><strong>False Success Lab</strong><small>Powered by agent-consistency</small></span>
    </a>
    <nav class="nav-links" aria-label="primary navigation">
      <a href="#scanner">Scanner</a>
      <a href="#local-import">Import report</a>
      <a href="#scenarios">Scenarios</a>
      <a href="https://github.com/karimbaidar/agent-consistency">Core package</a>
      <a href="https://github.com/karimbaidar/false-success-lab">GitHub</a>
    </nav>
  </header>
  <main>
    <section class="hero-shell" id="scanner">
      <div class="hero-copy">
        <p class="eyebrow">Scanner-first developer lab</p>
        <h1>Scan your AI workflow repo for unverified completion risks.</h1>
        <p class="hero-subtitle">Find actions that confirm refunds, close tickets, update records, grant access, or send messages before the source system confirms the result.</p>
        <div class="hero-actions"><a class="ghost-link" href="#local-import">Import local report</a><a class="ghost-link" href="#scenarios">Try built-in scenarios</a></div>
      </div>
      <section class="scanner-console" id="scanner-console" aria-label="Public GitHub repo scanner">
        <div class="console-topline">
          <div><p class="panel-label">Live scanner</p><h2>Repo URL to false-success report card</h2></div>
          <span class="status-pill checking" id="backend-status"><span class="status-dot"></span><span id="backend-status-copy">Checking backend</span></span>
        </div>
        <form class="scan-form" id="scan-form">
          <label class="repo-field"><span>Public GitHub repository</span><input id="github-url" autocomplete="off" spellcheck="false" value="https://github.com/karimbaidar/false-success-lab"></label>
          <button class="primary-action" id="scan-button" type="submit"><span>Scan repo</span><span class="button-glow" aria-hidden="true"></span></button>
        </form>
        <p class="helper-copy" id="scan-helper">Paste a public GitHub repo URL to see where AI workflow actions may need outcome verification.</p>
        <div class="scanner-stage" aria-label="animated scanner pipeline">
          <div class="scan-beam" id="scan-beam" aria-hidden="true"></div>
          <article class="pipeline-node active" data-step="repo"><span class="node-icon">01</span><strong>GitHub repo</strong><small>Public source</small></article>
          <article class="pipeline-node" data-step="actions"><span class="node-icon">02</span><strong>Action detector</strong><small>Find side effects</small></article>
          <article class="pipeline-node" data-step="evidence"><span class="node-icon">03</span><strong>Evidence check</strong><small>Missing outcomes</small></article>
          <article class="pipeline-node" data-step="report"><span class="node-icon">04</span><strong>false-success report card</strong><small>Severity + fixes</small></article>
        </div>
        <section class="static-mode-banner" id="static-mode-banner">${STATIC_MODE_MESSAGE}</section>
      </section>
      <aside class="hero-report" aria-label="live report preview">
        <p class="panel-label">Report preview</p>
        <div class="score-orbit"><span id="preview-score">0</span><small>risky actions</small></div>
        <div class="mini-metrics" id="preview-metrics"><span><strong>0</strong> high</span><span><strong>0</strong> medium</span><span><strong>0</strong> low</span></div>
        <p class="preview-copy" id="preview-copy">Your first scan will summarize false-success exposure, confidence, missing evidence, and copyable fixes.</p>
      </aside>
    </section>
    <section class="results-shell hidden" id="results">
      <div class="section-heading"><p class="eyebrow">Inspect findings</p><h2>Report card</h2><p>Review the highest-risk action first, then open a finding to inspect evidence and copy a fix.</p></div>
      <div class="report-layout">
        <article class="report-card"><div class="report-card-header"><div><p class="panel-label">Repository</p><h3 id="report-repo">No scan yet</h3></div><span class="confidence-pill" id="report-confidence">Confidence: -</span></div><div class="metric-grid" id="metric-grid"></div><div class="report-actions"><button class="secondary-action" id="copy-report" type="button">Copy report</button><button class="secondary-action" id="export-json" type="button">Export JSON</button></div></article>
        <section class="findings-panel"><div class="panel-heading"><p class="panel-label">Top findings</p><h3>Missing evidence before confirmation</h3></div><div class="findings-list" id="findings-list"></div></section>
      </div>
    </section>
    <section class="secondary-shell" id="local-import"><div class="section-heading"><p class="eyebrow">Local report import</p><h2>Import local scan report</h2><p>Browsers cannot inspect local folders. Run the CLI locally, then paste or upload the report here.</p></div><div class="import-layout"><article class="import-panel"><pre class="command-block">agent-consistency scan . --format json &gt; false-success-report.json
agent-consistency scan . --format markdown</pre><textarea id="local-report-input" placeholder="Paste JSON or Markdown report here"></textarea><div class="import-actions"><label class="upload-button">Upload report<input id="local-report-file" type="file" accept=".json,.md,.markdown,text/markdown,application/json,text/plain"></label><button class="primary-action compact" id="parse-local-report" type="button">Render report card</button></div></article><article class="import-preview"><p class="panel-label">Why this path exists</p><h3>Private code stays local.</h3><p>Use this path when the repo is private, too large for the hosted demo, or needs internal credentials.</p></article></div></section>
    <section class="secondary-shell" id="scenarios"><div class="section-heading"><p class="eyebrow">Guided demos</p><h2>Try built-in scenarios</h2><p>Replay common false-success risks, then inspect how a verified action blocks the unsupported claim.</p></div><div class="scenario-layout"><div class="scenario-rail" id="scenario-list"></div><article class="scenario-stage"><div class="scenario-header"><div><p class="panel-label">Scenario runner</p><h3 id="scenario-title">Refund customer</h3></div><div class="mode-toggle"><button class="mode-button" data-mode="naive" type="button">Naive</button><button class="mode-button active" data-mode="protected" type="button">Protected</button></div></div><div class="scenario-flow" id="scenario-flow"></div><div class="scenario-copy-grid"><article><p class="panel-label">Naive workflow</p><h4>Confirms the outcome without enough evidence.</h4><p id="naive-copy"></p></article><article><p class="panel-label">Protected workflow</p><h4>Blocks customer-facing confirmation until the source system confirms the result.</h4><p id="protected-copy"></p></article></div></article></div></section>
  </main>
  <aside class="finding-drawer" id="finding-drawer" aria-hidden="true"><button class="drawer-close" id="drawer-close" type="button">Close</button><div id="drawer-content"></div></aside>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
`;

document.body.innerHTML = shell;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const nodes = {
  backendStatus: $("#backend-status"),
  backendStatusCopy: $("#backend-status-copy"),
  staticBanner: $("#static-mode-banner"),
  scanForm: $("#scan-form"),
  scanButton: $("#scan-button"),
  githubUrl: $("#github-url"),
  scanHelper: $("#scan-helper"),
  scannerConsole: $("#scanner-console"),
  previewScore: $("#preview-score"),
  previewMetrics: $("#preview-metrics"),
  previewCopy: $("#preview-copy"),
  results: $("#results"),
  reportRepo: $("#report-repo"),
  reportConfidence: $("#report-confidence"),
  metricGrid: $("#metric-grid"),
  findingsList: $("#findings-list"),
  copyReport: $("#copy-report"),
  exportJson: $("#export-json"),
  localInput: $("#local-report-input"),
  localFile: $("#local-report-file"),
  parseLocal: $("#parse-local-report"),
  scenarioList: $("#scenario-list"),
  scenarioTitle: $("#scenario-title"),
  scenarioFlow: $("#scenario-flow"),
  naiveCopy: $("#naive-copy"),
  protectedCopy: $("#protected-copy"),
  drawer: $("#finding-drawer"),
  drawerContent: $("#drawer-content"),
  drawerClose: $("#drawer-close"),
  toast: $("#toast"),
};

const pipelineSteps = ["repo", "actions", "evidence", "report"];
const flowSteps = ["Read state", "Call tool/API", "Verify outcome", "Gate decision", "Copy fix"];
const apiBaseUrl = configuredApiBaseUrl();
let backendAvailable = false;
let currentReport = null;
let currentMarkdown = "";
let activeScenarioId = "refund_customer";
let activeMode = "protected";
let scanAnimation = null;

const scenarios = [
  scenario("refund_customer", "Refund customer", "send_refund_confirmation", "high", "high", "Emails the customer that the refund is complete after the refund API returns 200 OK.", "Blocks the message until the payment provider confirms refund_settled.", "send_refund_confirmation may claim completion before refund settlement is confirmed.", ["confirmed outcome check", "idempotency key", "refund_settled evidence"], ["refund API accepted request", "provider status pending"], "refund_settled"),
  scenario("close_support_ticket", "Close support ticket", "close_ticket", "high", "medium", "Marks the ticket resolved after a tool says the workflow ran.", "Blocks closure until resolution evidence and customer-visible facts are present.", "close_ticket may mark work resolved before resolution evidence is confirmed.", ["resolution evidence", "handoff facts"], ["ticket update tool returned success"], "resolution_confirmed"),
  scenario("delete_account", "Delete account", "delete_user", "high", "high", "Announces account deletion without idempotency or deletion confirmation.", "Requires an idempotency key plus a deletion confirmation read before continuing.", "delete_user is destructive and needs idempotency plus deletion confirmation.", ["idempotency key", "deletion confirmation"], ["delete API returned accepted"], "deletion_confirmed"),
  scenario("provision_server", "Provision server", "provision_server", "medium", "medium", "Reports infrastructure ready after the provisioning request is accepted.", "Waits for health checks and desired-state confirmation before announcing readiness.", "provision_server changes production state without a nearby readiness check.", ["readiness check", "desired-state confirmation"], ["cloud API accepted request"], "server_ready"),
  scenario("update_crm", "Update CRM", "update_record", "medium", "low", "Says the account was updated after sending a write request to the CRM.", "Reads the CRM record back and blocks unsupported claims if the write is not visible.", "update_record may change production state without read-after-write verification.", ["read-after-write confirmation"], ["CRM update call returned success"], "crm_record_updated"),
  scenario("grant_access", "Grant access", "grant_access", "high", "high", "Tells the user access was granted without checking the final user and role.", "Confirms the correct principal, role, and scope before reporting access granted.", "grant_access changes access without a nearby correctness confirmation.", ["correct user confirmation", "role and scope confirmation"], ["IAM API accepted request"], "access_grant_verified"),
  scenario("place_trade", "Place trade", "place_trade", "high", "high", "Claims an order filled after broker submission succeeds.", "Blocks completion until the broker confirms fill status and quantity.", "place_trade may report an order as complete before broker fill confirmation.", ["broker fill confirmation", "idempotency key"], ["broker order accepted"], "order_filled"),
];

function scenario(id, name, action, severity, confidence, naive, protectedCopy, topFinding, missing, evidence, outcome) {
  return { id, name, action, severity, confidence, naive, protected: protectedCopy, topFinding, missing, evidence, outcome, path: `agents/${id}.py`, line: id === "refund_customer" ? 142 : 87 };
}

function configuredApiBaseUrl() {
  const params = new URLSearchParams(window.location.search);
  const supplied = params.get("api");
  if (supplied) {
    window.localStorage.setItem("false-success-lab-api", supplied.replace(/\/$/, ""));
    return supplied.replace(/\/$/, "");
  }
  const stored = window.localStorage.getItem("false-success-lab-api");
  if (stored) return stored.replace(/\/$/, "");
  if (window.location.hostname.includes("github.io")) return DEFAULT_HOSTED_API_BASE_URL;
  return "";
}

function apiPath(path) {
  return `${apiBaseUrl}${path}`;
}

async function checkBackend() {
  setBackendStatus("checking", "Checking backend");
  try {
    const response = await fetch(apiPath("/api/health"), { cache: "no-store" });
    if (!response.ok) throw new Error("health check failed");
    backendAvailable = true;
    nodes.staticBanner.classList.add("hidden");
    setBackendStatus("ready", "Backend ready");
    nodes.scanHelper.textContent = "Backend ready. Public scans use a temporary checkout, generate a report card, then clean up.";
  } catch (error) {
    backendAvailable = false;
    nodes.staticBanner.classList.remove("hidden");
    setBackendStatus("static", "Static mirror");
    nodes.scanHelper.textContent = "Backend unavailable. You can still import a local scanner report or try built-in scenarios.";
  }
}

function setBackendStatus(kind, label) {
  nodes.backendStatus.className = `status-pill ${kind}`;
  nodes.backendStatusCopy.textContent = label;
}

function bindEvents() {
  nodes.scanForm.addEventListener("submit", handleScan);
  nodes.parseLocal.addEventListener("click", handleLocalReport);
  nodes.localFile.addEventListener("change", handleLocalFile);
  nodes.copyReport.addEventListener("click", () => copyText(currentMarkdown || markdownForReport(currentReport), "Report copied"));
  nodes.exportJson.addEventListener("click", exportJson);
  nodes.drawerClose.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeDrawer(); });
  $$(".mode-button").forEach((button) => button.addEventListener("click", () => {
    activeMode = button.dataset.mode;
    renderScenario();
  }));
}

async function handleScan(event) {
  event.preventDefault();
  const repoUrl = nodes.githubUrl.value.trim();
  if (!isGithubUrl(repoUrl)) {
    showToast("Only public GitHub repo URLs are supported in hosted demo mode.");
    return;
  }
  if (!backendAvailable) {
    showToast("Backend unavailable. Import a local scanner report instead.");
    nodes.localInput.focus();
    return;
  }
  startScanning();
  try {
    const response = await fetch(apiPath("/api/scans/github"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: repoUrl }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.detail || payload.error || "Scan failed");
    const report = normalizeReport(payload.report || payload.card || payload, repoUrl, payload.markdown);
    renderReport(report, payload.markdown || markdownForReport(report));
    completeScanning();
    showToast("Scan complete");
  } catch (error) {
    stopScanning();
    showToast(error.message || "Scan failed");
    renderErrorReport(repoUrl, error.message || "Scan failed");
  }
}

function isGithubUrl(value) {
  try {
    const url = new URL(value);
    return url.hostname === "github.com" && url.pathname.split("/").filter(Boolean).length >= 2;
  } catch (error) {
    return false;
  }
}

function startScanning() {
  nodes.scanButton.disabled = true;
  nodes.scanButton.querySelector("span").textContent = "Scanning";
  nodes.scannerConsole.classList.add("scanning");
  let index = 0;
  activatePipeline(index);
  clearInterval(scanAnimation);
  scanAnimation = setInterval(() => {
    index = (index + 1) % pipelineSteps.length;
    activatePipeline(index);
  }, 680);
}

function stopScanning() {
  clearInterval(scanAnimation);
  nodes.scanButton.disabled = false;
  nodes.scanButton.querySelector("span").textContent = "Scan repo";
  nodes.scannerConsole.classList.remove("scanning");
}

function completeScanning() {
  stopScanning();
  $$(".pipeline-node").forEach((node) => {
    node.classList.add("complete");
    node.classList.remove("active");
  });
}

function activatePipeline(index) {
  $$(".pipeline-node").forEach((node, nodeIndex) => {
    node.classList.toggle("active", nodeIndex === index);
    node.classList.toggle("complete", nodeIndex < index);
  });
}

function normalizeReport(input, fallbackRepo, markdown = "") {
  const source = input || {};
  const findings = Array.isArray(source.findings) ? source.findings : Array.isArray(source.top_findings) ? source.top_findings : [];
  const normalizedFindings = findings.map((finding, index) => normalizeFinding(finding, index));
  const high = numberOr(source.high_severity, normalizedFindings.filter((f) => f.severity === "high").length);
  const medium = numberOr(source.medium_severity, normalizedFindings.filter((f) => f.severity === "medium").length);
  const low = numberOr(source.low_severity, normalizedFindings.filter((f) => f.severity === "low").length);
  const risky = numberOr(source.risky_actions_found, normalizedFindings.length || high + medium + low);
  return {
    repository: source.repository || source.repo || source.target || fallbackRepo || "imported report",
    risky_actions_found: risky,
    false_success_exposure: numberOr(source.false_success_exposure, risky),
    high_severity: high,
    medium_severity: medium,
    low_severity: low,
    confidence: source.confidence || confidenceFromFindings(normalizedFindings),
    findings: normalizedFindings,
    markdown,
  };
}

function normalizeFinding(finding, index) {
  return {
    action: finding.action || finding.name || finding.title || `risky_action_${index + 1}`,
    severity: normalizeSeverity(finding.severity),
    confidence: finding.confidence || "medium",
    path: finding.path || finding.file || finding.filename || "unknown",
    line: finding.line || finding.line_number || "-",
    why: finding.why || finding.reason || finding.message || finding.description || "Possible risk, needs review. This action may need outcome verification before a customer-visible confirmation.",
    evidence_found: asArray(finding.evidence_found || finding.evidence || finding.signals),
    evidence_missing: asArray(finding.evidence_missing || finding.missing_evidence || finding.missing),
    suggested_fix: finding.suggested_fix || finding.fix || pythonFix(finding.action || "verified_action", "confirmed_result"),
  };
}

function normalizeSeverity(value) {
  const severity = String(value || "medium").toLowerCase();
  return ["high", "medium", "low"].includes(severity) ? severity : "medium";
}

function numberOr(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function asArray(value) {
  if (Array.isArray(value)) return value.length ? value : ["Evidence not detected in report"];
  if (!value) return ["Evidence not detected in report"];
  return [String(value)];
}

function confidenceFromFindings(findings) {
  if (findings.some((finding) => finding.confidence === "high")) return "high";
  if (findings.some((finding) => finding.confidence === "medium")) return "medium";
  return findings.length ? "low" : "none";
}

function renderReport(report, markdown = "") {
  currentReport = report;
  currentMarkdown = markdown || markdownForReport(report);
  nodes.results.classList.remove("hidden");
  nodes.reportRepo.textContent = report.repository;
  nodes.reportConfidence.textContent = `Confidence: ${report.confidence}`;
  animateNumber(nodes.previewScore, report.risky_actions_found);
  nodes.previewMetrics.innerHTML = metricMini(report.high_severity, "high") + metricMini(report.medium_severity, "medium") + metricMini(report.low_severity, "low");
  nodes.previewCopy.textContent = report.findings.length ? report.findings[0].why : "No risky actions detected in this scan. Review the report before treating this as complete coverage.";
  nodes.metricGrid.innerHTML = [
    metric("Risky actions found", report.risky_actions_found),
    metric("False-success exposure", report.false_success_exposure),
    metric("High severity", report.high_severity),
    metric("Medium severity", report.medium_severity),
    metric("Low severity", report.low_severity),
    metric("Confidence", report.confidence),
  ].join("");
  nodes.findingsList.innerHTML = report.findings.length ? report.findings.map((finding, index) => findingCard(finding, index)).join("") : emptyFindingCard();
  $$(".finding-card[data-index]").forEach((card) => card.addEventListener("click", () => openFinding(report.findings[Number(card.dataset.index)])));
  nodes.results.scrollIntoView({ behavior: "smooth", block: "start" });
}

function metric(label, value) {
  return `<article class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></article>`;
}

function metricMini(value, label) {
  return `<span><strong>${escapeHtml(String(value))}</strong> ${escapeHtml(label)}</span>`;
}

function findingCard(finding, index) {
  return `<button class="finding-card" data-index="${index}" type="button"><div class="finding-head"><div><strong>${escapeHtml(finding.action)}</strong><p>${escapeHtml(finding.path)}:${escapeHtml(String(finding.line))}</p></div><span class="severity-pill ${escapeHtml(finding.severity)}">${escapeHtml(finding.severity)}</span></div><p>${escapeHtml(finding.why)}</p><p><strong>Missing evidence:</strong> ${escapeHtml(finding.evidence_missing.join(", "))}</p></button>`;
}

function emptyFindingCard() {
  return `<article class="finding-card"><strong>No risky actions found</strong><p>The scanner did not surface false-success exposure. Keep outcome gates around customer-visible and irreversible actions.</p></article>`;
}

function renderErrorReport(repoUrl, message) {
  const report = normalizeReport({
    repository: repoUrl,
    confidence: "none",
    findings: [{ action: "scan_error", severity: "low", confidence: "low", path: "hosted demo", line: "-", why: message, evidence_missing: ["backend scan result"], evidence_found: ["request attempted"], suggested_fix: "Run `agent-consistency scan . --format markdown` locally and import the report." }],
  }, repoUrl);
  renderReport(report, markdownForReport(report));
}

function handleLocalReport() {
  const value = nodes.localInput.value.trim();
  if (!value) {
    showToast("Paste JSON or Markdown report output first.");
    return;
  }
  const report = parseImportedReport(value);
  renderReport(report, markdownForReport(report));
  showToast("Imported report rendered");
}

function handleLocalFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    nodes.localInput.value = String(reader.result || "");
    handleLocalReport();
  };
  reader.readAsText(file);
}

function parseImportedReport(value) {
  try {
    return normalizeReport(JSON.parse(value), "local import", value);
  } catch (error) {
    const high = countWord(value, "high");
    const medium = countWord(value, "medium");
    const low = countWord(value, "low");
    const risky = Math.max(1, high + medium + low);
    return normalizeReport({
      repository: "local import",
      risky_actions_found: risky,
      high_severity: high,
      medium_severity: medium,
      low_severity: low,
      confidence: "medium",
      findings: [{ action: "imported_markdown_report", severity: high ? "high" : medium ? "medium" : "low", confidence: "medium", path: "pasted report", line: "-", why: "Imported Markdown report rendered into a report card.", evidence_found: ["scanner report pasted"], evidence_missing: ["open finding details in source report"], suggested_fix: "Use the source report to copy the exact verified-action fix." }],
    }, "local import", value);
  }
}

function countWord(text, word) {
  return (text.toLowerCase().match(new RegExp(`\\b${word}\\b`, "g")) || []).length;
}

function renderScenarioList() {
  nodes.scenarioList.innerHTML = scenarios.map((item) => `<button class="scenario-button ${item.id === activeScenarioId ? "active" : ""}" data-scenario="${item.id}" type="button"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.topFinding)}</span></button>`).join("");
  $$(".scenario-button").forEach((button) => button.addEventListener("click", () => {
    activeScenarioId = button.dataset.scenario;
    renderScenario();
  }));
}

function renderScenario() {
  const item = scenarios.find((scenarioItem) => scenarioItem.id === activeScenarioId) || scenarios[0];
  nodes.scenarioTitle.textContent = item.name;
  nodes.naiveCopy.textContent = item.naive;
  nodes.protectedCopy.textContent = item.protected;
  $$(".mode-button").forEach((button) => button.classList.toggle("active", button.dataset.mode === activeMode));
  renderScenarioList();
  nodes.scenarioFlow.innerHTML = flowSteps.map((step, index) => {
    const blocked = activeMode === "protected" && index >= 2;
    const complete = activeMode === "naive" || index < 2;
    return `<article class="flow-node ${blocked ? "blocked" : complete ? "complete" : ""}"><span class="node-icon">${index + 1}</span><strong>${escapeHtml(step)}</strong><small>${blocked ? "blocked until verified" : "executed"}</small></article>`;
  }).join("");
  renderReport(scenarioReport(item, activeMode), "");
}

function scenarioReport(item, mode) {
  const severity = mode === "naive" ? item.severity : item.severity;
  return normalizeReport({
    repository: "built-in/false-success-lab",
    risky_actions_found: 1,
    false_success_exposure: mode === "naive" ? 1 : 0,
    high_severity: severity === "high" ? 1 : 0,
    medium_severity: severity === "medium" ? 1 : 0,
    low_severity: severity === "low" ? 1 : 0,
    confidence: item.confidence,
    findings: [{ action: item.action, severity, confidence: item.confidence, path: item.path, line: item.line, why: mode === "naive" ? item.topFinding : `Protected flow requires ${item.outcome} before customer-visible confirmation.`, evidence_found: item.evidence, evidence_missing: item.missing, suggested_fix: pythonFix(item.action, item.outcome) }],
  }, "built-in/false-success-lab");
}

function openFinding(finding) {
  if (!finding) return;
  nodes.drawerContent.innerHTML = `<p class="panel-label">Finding detail</p><h2>${escapeHtml(finding.action)}</h2><div class="drawer-section"><span class="severity-pill ${escapeHtml(finding.severity)}">${escapeHtml(finding.severity)}</span><span class="confidence-pill">Confidence: ${escapeHtml(finding.confidence)}</span></div><div class="drawer-section"><h3>Why it matters</h3><p>${escapeHtml(finding.why)}</p></div><div class="drawer-section"><h3>Location</h3><p>${escapeHtml(finding.path)}:${escapeHtml(String(finding.line))}</p></div><div class="drawer-section"><h3>Evidence found</h3><div class="drawer-list">${finding.evidence_found.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div></div><div class="drawer-section"><h3>Evidence missing</h3><div class="drawer-list">${finding.evidence_missing.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div></div><div class="drawer-section"><h3>Copyable fixes</h3><div class="copy-row"><button class="secondary-action" data-fix="python">Python</button><button class="secondary-action" data-fix="langgraph">LangGraph</button><button class="secondary-action" data-fix="tool">Tool wrapper</button></div><pre class="code-block" id="drawer-code">${escapeHtml(finding.suggested_fix)}</pre></div><div class="drawer-section"><h3>Proof trail</h3><div class="drawer-list"><span>scan.started</span><span>risky_action.detected</span><span>outcome.evidence_missing</span><span>fix.suggested</span></div></div>`;
  nodes.drawer.classList.add("open");
  nodes.drawer.setAttribute("aria-hidden", "false");
  $$("[data-fix]").forEach((button) => button.addEventListener("click", () => {
    const fix = button.dataset.fix === "langgraph" ? langGraphFix(finding.action) : button.dataset.fix === "tool" ? toolWrapperFix(finding.action) : finding.suggested_fix;
    $("#drawer-code").textContent = fix;
    copyText(fix, `${button.textContent} fix copied`);
  }));
}

function closeDrawer() {
  nodes.drawer.classList.remove("open");
  nodes.drawer.setAttribute("aria-hidden", "true");
}

function pythonFix(action, outcome = "confirmed_result") {
  return `from agent_consistency import WorkflowRun\n\nrun = WorkflowRun("production-workflow")\n\nwith run.step("agent", "${action}") as step:\n    result = ${action}()\n    step.write_state("tool_result", result, include_value=True)\n    step.verify_outcome(\n        "${outcome}",\n        lambda: source_system_confirms(result),\n        failure_reason="source system did not confirm the result",\n        details=result,\n    )`;
}

function langGraphFix(action) {
  return `def ${action}_node(state):\n    result = tool_call(state)\n    if not source_system_confirms(result):\n        return {"status": "blocked", "reason": "result not confirmed"}\n    return {"status": "verified", "result": result}`;
}

function toolWrapperFix(action) {
  return `async def verified_${action}(*args, **kwargs):\n    result = await ${action}(*args, **kwargs)\n    if not await source_system_confirms(result):\n        raise RuntimeError("Result was not confirmed")\n    return result`;
}

function markdownForReport(report) {
  if (!report) return "";
  const findingLines = report.findings.map((finding) => `- [${finding.severity}] ${finding.action}: ${finding.why}`).join("\n");
  return `# False-success report card\n\nRepository: ${report.repository}\nRisky actions found: ${report.risky_actions_found}\nFalse-success exposure: ${report.false_success_exposure}\nHigh severity: ${report.high_severity}\nMedium severity: ${report.medium_severity}\nLow severity: ${report.low_severity}\nConfidence: ${report.confidence}\n\n## Findings\n${findingLines || "No risky actions found."}\n`;
}

function exportJson() {
  if (!currentReport) {
    showToast("Run or import a scan first.");
    return;
  }
  const blob = new Blob([JSON.stringify(currentReport, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "false-success-report.json";
  link.click();
  URL.revokeObjectURL(url);
}

async function copyText(text, message) {
  if (!text) {
    showToast("Nothing to copy yet.");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast(message || "Copied");
  } catch (error) {
    showToast("Copy failed");
  }
}

function animateNumber(element, target) {
  const finalValue = Number(target) || 0;
  const start = Number(element.textContent) || 0;
  const startTime = performance.now();
  const duration = 520;
  function tick(now) {
    const progress = Math.min(1, (now - startTime) / duration);
    element.textContent = String(Math.round(start + (finalValue - start) * progress));
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function showToast(message) {
  nodes.toast.textContent = message;
  nodes.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => nodes.toast.classList.remove("show"), 2400);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
}

bindEvents();
renderScenarioList();
renderScenario();
checkBackend();
