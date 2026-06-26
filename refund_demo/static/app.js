const STATIC_MODE_MESSAGE =
  "Static demo mode: public GitHub scanning requires the FastAPI backend. You can still import a local scan report or try built-in scenarios.";
const DEFAULT_HOSTED_API_BASE_URL = "https://false-success-lab-api.vercel.app";
const PRIORITY_LIMIT = 5;

const shell = String.raw`
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

  <main class="simple-page">
    <section class="hero" id="scanner">
      <p class="eyebrow">False Success Lab</p>
      <h1>Scan your AI workflow repo for unverified completion risks.</h1>
      <p class="hero-subtitle">
        One scanner. One repo URL. A clear false-success report card showing where actions need source system confirmation before customer-facing claims continue.
      </p>

      <section class="scanner-card" aria-label="Scan a public GitHub repo">
        <div class="scanner-head">
          <div>
            <p class="panel-label">Scan a public GitHub repo</p>
            <h2>Paste a repo. Get a report.</h2>
          </div>
          <span class="status-pill checking" id="backend-status"><span class="status-dot"></span><span id="backend-copy">Checking backend</span></span>
        </div>

        <form class="scan-form" id="scan-form">
          <input class="repo-input" id="github-url" autocomplete="off" spellcheck="false" value="https://github.com/karimbaidar/false-success-lab" aria-label="Public GitHub repository URL">
          <button class="primary-action" id="scan-button" type="submit">Scan repo</button>
        </form>

        <p class="helper-copy" id="scan-helper">The hosted scanner checks public GitHub repos. Private code can use local report import.</p>
        <div class="static-mode-banner hidden" id="static-mode-banner"><strong>Static mode</strong><span>${STATIC_MODE_MESSAGE}</span></div>

        <div class="agent-animation hidden" id="agent-animation" aria-live="polite">
          <p class="panel-label">Scanning with verification agents</p>
          <div class="agent-line">
            <div class="agent-node active" data-agent="repo"><span class="agent-dot">1</span><span class="agent-caption">Read repo</span></div>
            <div class="agent-node" data-agent="action"><span class="agent-dot">2</span><span class="agent-caption">Find actions</span></div>
            <div class="agent-node" data-agent="evidence"><span class="agent-dot">3</span><span class="agent-caption">Check evidence</span></div>
            <div class="agent-node" data-agent="report"><span class="agent-dot">4</span><span class="agent-caption">Build report</span></div>
          </div>
        </div>
      </section>

      <p class="helper-copy">Import local scan report · Try built-in scenarios · false-success report card · ${DEFAULT_HOSTED_API_BASE_URL}</p>

      <section class="report-section hidden" id="report-section">
        <article class="report-card">
          <div class="report-card-head">
            <div>
              <p class="panel-label">false-success report card</p>
              <h2 id="report-repo">Report</h2>
            </div>
            <span class="status-pill ready" id="report-confidence"><span class="status-dot"></span>Confidence</span>
          </div>
          <div class="metric-grid" id="metric-grid"></div>
          <div class="report-actions">
            <button class="secondary-action" id="copy-report" type="button">Copy report</button>
            <button class="secondary-action" id="export-json" type="button">Export JSON</button>
          </div>
        </article>
        <section class="findings-panel">
          <p class="panel-label">Priority findings</p>
          <div class="findings-list" id="findings-list"></div>
        </section>
      </section>
    </section>

    <section class="secondary-zone" id="local-import">
      <div class="secondary-grid">
        <article class="import-panel">
          <p class="panel-label">Import local scan report</p>
          <h3>Private code stays local.</h3>
          <pre class="command-block">agent-consistency scan . --format json &gt; false-success-report.json
agent-consistency scan . --format markdown</pre>
          <textarea id="local-report-input" placeholder="Paste JSON or Markdown report here"></textarea>
          <div class="import-actions">
            <label class="upload-button">Upload report<input id="local-report-file" type="file" accept=".json,.md,.markdown,text/markdown,application/json,text/plain"></label>
            <button class="secondary-action" id="parse-local-report" type="button">Render report</button>
          </div>
        </article>
        <article class="scenario-panel" id="scenarios">
          <p class="panel-label">Try built-in scenarios</p>
          <h3>See the risk without scanning your code.</h3>
          <div class="scenario-list" id="scenario-list"></div>
        </article>
      </div>
    </section>
  </main>

  <aside class="finding-drawer" id="finding-drawer" aria-hidden="true">
    <button class="drawer-close" id="drawer-close" type="button">Close</button>
    <div id="drawer-content"></div>
  </aside>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
`;

document.body.innerHTML = shell;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const nodes = {
  backendStatus: $("#backend-status"),
  backendCopy: $("#backend-copy"),
  staticBanner: $("#static-mode-banner"),
  scanForm: $("#scan-form"),
  scanButton: $("#scan-button"),
  githubUrl: $("#github-url"),
  scanHelper: $("#scan-helper"),
  animation: $("#agent-animation"),
  reportSection: $("#report-section"),
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
  drawer: $("#finding-drawer"),
  drawerContent: $("#drawer-content"),
  drawerClose: $("#drawer-close"),
  toast: $("#toast"),
};

let backendAvailable = false;
let currentReport = null;
let currentMarkdown = "";
let currentFindingMode = "priority";
let animationTimer = null;

const scenarios = [
  scenario("Refund customer", "send_refund_confirmation", "high", "high", "Message may claim refund completion before settlement is confirmed.", "refund_settled"),
  scenario("Close support ticket", "close_ticket", "high", "medium", "Ticket may close before resolution evidence exists.", "resolution_confirmed"),
  scenario("Delete account", "delete_user", "high", "high", "Destructive action needs idempotency and deletion confirmation.", "deletion_confirmed"),
  scenario("Provision server", "provision_server", "medium", "medium", "Infrastructure may be reported ready before health checks pass.", "server_ready"),
  scenario("Update CRM", "update_record", "medium", "low", "Record update may need read-after-write confirmation.", "crm_record_updated"),
  scenario("Grant access", "grant_access", "high", "high", "Access grant needs principal, role, and scope confirmation.", "access_grant_verified"),
  scenario("Place trade", "place_trade", "high", "high", "Order submission should not be treated as fill confirmation.", "order_filled"),
];

function scenario(name, action, severity, confidence, why, outcome) {
  return { name, action, severity, confidence, why, outcome };
}

function configuredApiBaseUrl() {
  const params = new URLSearchParams(window.location.search);
  const supplied = params.get("api");
  if (supplied) {
    const clean = supplied.replace(/\/$/, "");
    window.localStorage.setItem("false-success-lab-api", clean);
    return clean;
  }
  const stored = window.localStorage.getItem("false-success-lab-api");
  if (stored) return stored.replace(/\/$/, "");
  if (window.location.hostname.includes("github.io")) return DEFAULT_HOSTED_API_BASE_URL;
  return "";
}

const apiBaseUrl = configuredApiBaseUrl();
const apiPath = (path) => `${apiBaseUrl}${path}`;

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
    nodes.scanHelper.textContent = "Backend unavailable. Import a local report or run a built-in scenario.";
  }
}

function setBackendStatus(kind, copy) {
  nodes.backendStatus.className = `status-pill ${kind}`;
  nodes.backendCopy.textContent = copy;
}

async function handleScan(event) {
  event.preventDefault();
  const repoUrl = nodes.githubUrl.value.trim();
  if (!isGithubUrl(repoUrl)) {
    showToast("Use a public GitHub repo URL.");
    return;
  }
  if (!backendAvailable) {
    showToast("Backend unavailable. Import a local report instead.");
    nodes.localInput.focus();
    return;
  }

  startScanAnimation();
  try {
    const response = await fetch(apiPath("/api/scans/github"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: repoUrl }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.detail || payload.error || "Scan failed");
    const report = normalizeReport(payload.report || payload.card || payload, repoUrl, payload.markdown);
    finishScanAnimation(() => renderReport(report, payload.markdown || markdownForReport(report)));
  } catch (error) {
    finishScanAnimation(() => renderReport(errorReport(repoUrl, error.message || "Scan failed")));
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

function startScanAnimation() {
  nodes.scanButton.disabled = true;
  nodes.scanButton.textContent = "Scanning";
  nodes.reportSection.classList.add("hidden");
  nodes.animation.classList.remove("hidden");
  let index = 0;
  activateAgent(index);
  clearInterval(animationTimer);
  animationTimer = setInterval(() => {
    index = (index + 1) % 4;
    activateAgent(index);
  }, 650);
}

function finishScanAnimation(callback) {
  setTimeout(() => {
    clearInterval(animationTimer);
    $$(".agent-node").forEach((node) => node.classList.add("complete"));
    nodes.scanButton.disabled = false;
    nodes.scanButton.textContent = "Scan repo";
    callback();
  }, 700);
}

function activateAgent(index) {
  $$(".agent-node").forEach((node, nodeIndex) => {
    node.classList.toggle("active", nodeIndex === index);
    node.classList.toggle("complete", nodeIndex < index);
  });
}

function normalizeReport(input, fallbackRepo, markdown = "") {
  const source = input || {};
  const findings = Array.isArray(source.findings) ? source.findings : Array.isArray(source.top_findings) ? source.top_findings : [];
  const normalized = findings.map(normalizeFinding);
  const high = numberOr(source.high_severity, normalized.filter((finding) => finding.severity === "high").length);
  const medium = numberOr(source.medium_severity, normalized.filter((finding) => finding.severity === "medium").length);
  const low = numberOr(source.low_severity, normalized.filter((finding) => finding.severity === "low").length);
  const risky = numberOr(source.risky_actions_found, normalized.length || high + medium + low);
  return {
    repository: source.repository || source.repo || source.target || fallbackRepo || "imported report",
    risky_actions_found: risky,
    false_success_exposure: numberOr(source.false_success_exposure, risky),
    high_severity: high,
    medium_severity: medium,
    low_severity: low,
    confidence: source.confidence || confidenceFromFindings(normalized),
    findings: normalized,
    markdown,
  };
}

function normalizeFinding(finding) {
  return {
    action: finding.action || finding.name || finding.title || "risky_action",
    severity: normalizeSeverity(finding.severity),
    confidence: finding.confidence || "medium",
    path: finding.path || finding.file || finding.filename || "unknown",
    line: finding.line || finding.line_number || "-",
    why: finding.why || finding.reason || finding.message || finding.description || "Possible risk, needs review. This action may need outcome verification before confirmation.",
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
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function asArray(value) {
  if (Array.isArray(value)) return value.length ? value : ["Not detected in report"];
  return value ? [String(value)] : ["Not detected in report"];
}

function confidenceFromFindings(findings) {
  if (findings.some((finding) => finding.confidence === "high")) return "high";
  if (findings.some((finding) => finding.confidence === "medium")) return "medium";
  return findings.length ? "low" : "none";
}

function renderReport(report, markdown = "") {
  currentReport = report;
  currentMarkdown = markdown || markdownForReport(report);
  currentFindingMode = "priority";
  nodes.reportSection.classList.remove("hidden");
  nodes.reportRepo.textContent = shortRepo(report.repository);
  nodes.reportConfidence.innerHTML = `<span class="status-dot"></span>Confidence: ${escapeHtml(report.confidence)}`;
  const grouped = groupFindings(report.findings);
  const priority = priorityFindings(grouped);
  nodes.metricGrid.innerHTML = [
    metric("Possible risks", report.risky_actions_found),
    metric("Priority groups", priority.length),
    metric("High", report.high_severity),
    metric("Medium", report.medium_severity),
    metric("Low", report.low_severity),
  ].join("");
  renderFindings();
  nodes.reportSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderFindings() {
  if (!currentReport) return;
  const grouped = groupFindings(currentReport.findings);
  const priority = priorityFindings(grouped);
  const visible = currentFindingMode === "all" ? grouped : priority.slice(0, PRIORITY_LIMIT);
  const hiddenRaw = Math.max(0, currentReport.findings.length - visible.reduce((total, item) => total + item.count, 0));
  const summary = summaryNote(currentReport, grouped, priority, hiddenRaw);
  const cards = visible.length ? visible.map(findingCard).join("") : noFindings();
  nodes.findingsList.innerHTML = `${summary}${cards}`;
  $$(".finding-card[data-index]").forEach((card) => {
    card.addEventListener("click", () => openFinding(visible[Number(card.dataset.index)]));
  });
  const showAll = $("#show-all-findings");
  const showPriority = $("#show-priority-findings");
  if (showAll) showAll.addEventListener("click", () => { currentFindingMode = "all"; renderFindings(); });
  if (showPriority) showPriority.addEventListener("click", () => { currentFindingMode = "priority"; renderFindings(); });
}

function groupFindings(findings) {
  const groups = new Map();
  findings.forEach((finding) => {
    const path = String(finding.path || "unknown");
    const key = [finding.action, path, finding.severity, finding.why, finding.evidence_missing.join("|")].join("::");
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
      existing.lines.push(finding.line);
    } else {
      groups.set(key, {
        ...finding,
        path,
        count: 1,
        lines: [finding.line],
        category: findingCategory(path),
      });
    }
  });
  return Array.from(groups.values()).sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || b.count - a.count);
}

function priorityFindings(grouped) {
  const production = grouped.filter((finding) => finding.category === "production");
  return production.length ? production : grouped.filter((finding) => finding.category !== "test");
}

function findingCategory(path) {
  const clean = String(path).toLowerCase();
  if (/(__tests__|\/tests?\/|\.test\.|\.spec\.|test_|_test\.|mock|fixture)/.test(clean)) return "test";
  if (clean.startsWith("frontend/") || clean.includes("/components/") || clean.endsWith(".tsx") || clean.endsWith(".jsx")) return "frontend";
  return "production";
}

function severityRank(severity) {
  return { low: 1, medium: 2, high: 3 }[severity] || 0;
}

function summaryNote(report, grouped, priority, hiddenRaw) {
  const tests = grouped.filter((finding) => finding.category === "test").reduce((total, item) => total + item.count, 0);
  const frontend = grouped.filter((finding) => finding.category === "frontend").reduce((total, item) => total + item.count, 0);
  const production = grouped.filter((finding) => finding.category === "production").reduce((total, item) => total + item.count, 0);
  const modeCopy = currentFindingMode === "all" ? "Showing all grouped findings." : `Showing ${Math.min(PRIORITY_LIMIT, priority.length)} priority production groups first.`;
  const actionButton = currentFindingMode === "all"
    ? `<button class="secondary-action" id="show-priority-findings" type="button">Show priority only</button>`
    : `<button class="secondary-action" id="show-all-findings" type="button">Show all ${report.findings.length}</button>`;
  return `<article class="summary-note"><strong>${escapeHtml(report.risky_actions_found)} possible risks found. ${escapeHtml(modeCopy)}</strong><span>Confidence is ${escapeHtml(report.confidence)}; review before acting. Repeated lines, tests, and UI-only matches are grouped so the first result stays readable.</span><div class="summary-chips"><span class="summary-chip">${production} production</span><span class="summary-chip">${frontend} frontend/UI</span><span class="summary-chip">${tests} tests/examples</span><span class="summary-chip">${hiddenRaw} hidden in this view</span></div><div class="filter-row">${actionButton}</div></article>`;
}

function shortRepo(value) {
  return String(value || "Report").replace("https://github.com/", "");
}

function metric(label, value) {
  return `<article class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></article>`;
}

function findingCard(finding, index) {
  const location = finding.count > 1 ? `${finding.path}:${lineSummary(finding.lines)} · ${finding.count} matches` : `${finding.path}:${finding.line}`;
  return `<button class="finding-card" data-index="${index}" type="button"><div class="finding-head"><div><strong>${escapeHtml(finding.action)}</strong><p>${escapeHtml(location)}</p></div><span class="severity-pill ${escapeHtml(finding.severity)}">${escapeHtml(finding.severity)}</span></div><p>${escapeHtml(finding.why)}</p><p><strong>Missing evidence:</strong> ${escapeHtml(finding.evidence_missing.join(", "))}</p></button>`;
}

function lineSummary(lines) {
  const clean = lines.filter((line) => line !== "-" && line !== undefined && line !== null).map(String);
  if (!clean.length) return "multiple lines";
  return clean.length > 2 ? `${clean.slice(0, 2).join(", ")}, +${clean.length - 2}` : clean.join(", ");
}

function noFindings() {
  return `<article class="finding-card"><strong>No risky actions found</strong><p>The scanner did not surface false-success exposure. Keep outcome gates around customer-visible and irreversible actions.</p></article>`;
}

function errorReport(repoUrl, message) {
  return normalizeReport({
    repository: repoUrl,
    confidence: "low",
    findings: [{
      action: "scan_error",
      severity: "low",
      confidence: "low",
      path: "hosted scanner",
      line: "-",
      why: message,
      evidence_found: ["request attempted"],
      evidence_missing: ["backend scan result"],
      suggested_fix: "Run `agent-consistency scan . --format markdown` locally and import the report.",
    }],
  }, repoUrl);
}

function handleLocalReport() {
  const value = nodes.localInput.value.trim();
  if (!value) {
    showToast("Paste JSON or Markdown report output first.");
    return;
  }
  try {
    renderReport(normalizeReport(JSON.parse(value), "local import", value), value);
  } catch (error) {
    renderReport(normalizeReport({
      repository: "local import",
      risky_actions_found: 1,
      confidence: "medium",
      findings: [{
        action: "imported_markdown_report",
        severity: "medium",
        confidence: "medium",
        path: "pasted report",
        line: "-",
        why: "Imported Markdown report rendered into a report card.",
        evidence_found: ["scanner report pasted"],
        evidence_missing: ["open source report for exact location"],
        suggested_fix: "Use the original report to copy the exact verified-action fix.",
      }],
    }, "local import", value));
  }
  showToast("Report rendered");
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

function renderScenarios() {
  nodes.scenarioList.innerHTML = scenarios.map((item, index) => `<button class="scenario-button" data-index="${index}" type="button"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.why)}</span></button>`).join("");
  $$(".scenario-button").forEach((button) => button.addEventListener("click", () => {
    const item = scenarios[Number(button.dataset.index)];
    renderReport(scenarioReport(item), "");
  }));
}

function scenarioReport(item) {
  return normalizeReport({
    repository: "built-in scenarios",
    risky_actions_found: 1,
    false_success_exposure: 1,
    high_severity: item.severity === "high" ? 1 : 0,
    medium_severity: item.severity === "medium" ? 1 : 0,
    low_severity: item.severity === "low" ? 1 : 0,
    confidence: item.confidence,
    findings: [{
      action: item.action,
      severity: item.severity,
      confidence: item.confidence,
      path: `scenarios/${item.action}.py`,
      line: 1,
      why: item.why,
      evidence_found: ["workflow action detected"],
      evidence_missing: [item.outcome, "source system confirmation"],
      suggested_fix: pythonFix(item.action, item.outcome),
    }],
  }, "built-in scenarios");
}

function openFinding(finding) {
  if (!finding) return;
  const location = finding.count > 1 ? `${finding.path}:${lineSummary(finding.lines)} (${finding.count} matches)` : `${finding.path}:${finding.line}`;
  nodes.drawerContent.innerHTML = `<p class="panel-label">Finding detail</p><h2>${escapeHtml(finding.action)}</h2><div class="drawer-section"><span class="severity-pill ${escapeHtml(finding.severity)}">${escapeHtml(finding.severity)}</span><span>Confidence: ${escapeHtml(finding.confidence)}</span></div><div class="drawer-section"><h3>Why it matters</h3><p>${escapeHtml(finding.why)}</p></div><div class="drawer-section"><h3>Location</h3><p>${escapeHtml(location)}</p></div><div class="drawer-section"><h3>Evidence found</h3><div class="drawer-list">${finding.evidence_found.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div></div><div class="drawer-section"><h3>Evidence missing</h3><div class="drawer-list">${finding.evidence_missing.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div></div><div class="drawer-section"><h3>Copyable fix</h3><div class="copy-row"><button class="secondary-action" data-fix="python">Python</button><button class="secondary-action" data-fix="wrapper">Tool wrapper</button></div><pre class="code-block" id="drawer-code">${escapeHtml(finding.suggested_fix)}</pre></div>`;
  nodes.drawer.classList.add("open");
  nodes.drawer.setAttribute("aria-hidden", "false");
  $$("[data-fix]").forEach((button) => button.addEventListener("click", () => {
    const fix = button.dataset.fix === "wrapper" ? toolWrapperFix(finding.action) : finding.suggested_fix;
    $("#drawer-code").textContent = fix;
    copyText(fix, "Fix copied");
  }));
}

function closeDrawer() {
  nodes.drawer.classList.remove("open");
  nodes.drawer.setAttribute("aria-hidden", "true");
}

function pythonFix(action, outcome) {
  return `from agent_consistency import WorkflowRun\n\nrun = WorkflowRun("workflow")\n\nwith run.step("agent", "${action}") as step:\n    result = ${action}()\n    step.verify_outcome(\n        "${outcome}",\n        lambda: source_system_confirms(result),\n        failure_reason="source system did not confirm the result",\n        details=result,\n    )`;
}

function toolWrapperFix(action) {
  return `async def verified_${action}(*args, **kwargs):\n    result = await ${action}(*args, **kwargs)\n    if not await source_system_confirms(result):\n        raise RuntimeError("Source system did not confirm the result")\n    return result`;
}

function markdownForReport(report) {
  if (!report) return "";
  const findings = report.findings.map((finding) => `- [${finding.severity}] ${finding.action}: ${finding.why}`).join("\n");
  return `# False-success report card\n\nRepository: ${report.repository}\nRisky actions found: ${report.risky_actions_found}\nFalse-success exposure: ${report.false_success_exposure}\nHigh severity: ${report.high_severity}\nMedium severity: ${report.medium_severity}\nLow severity: ${report.low_severity}\nConfidence: ${report.confidence}\n\n## Findings\n${findings || "No risky actions found."}\n`;
}

function exportJson() {
  if (!currentReport) return showToast("Run or import a scan first.");
  const blob = new Blob([JSON.stringify(currentReport, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "false-success-report.json";
  link.click();
  URL.revokeObjectURL(url);
}

async function copyText(text, message) {
  if (!text) return showToast("Nothing to copy yet.");
  try {
    await navigator.clipboard.writeText(text);
    showToast(message || "Copied");
  } catch (error) {
    showToast("Copy failed");
  }
}

function showToast(message) {
  nodes.toast.textContent = message;
  nodes.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => nodes.toast.classList.remove("show"), 2200);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
}

nodes.scanForm.addEventListener("submit", handleScan);
nodes.parseLocal.addEventListener("click", handleLocalReport);
nodes.localFile.addEventListener("change", handleLocalFile);
nodes.copyReport.addEventListener("click", () => copyText(currentMarkdown || markdownForReport(currentReport), "Report copied"));
nodes.exportJson.addEventListener("click", exportJson);
nodes.drawerClose.addEventListener("click", closeDrawer);
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeDrawer(); });

renderScenarios();
checkBackend();
