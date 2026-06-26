const STATIC_MODE_MESSAGE =
  "Static demo mode: the hero replays a committed agent-consistency run and public GitHub scanning is disabled. Run the FastAPI backend for live runs and scans, or import a local scan report.";
const DEFAULT_HOSTED_API_BASE_URL = "https://false-success-lab-api.vercel.app";
const HERO_SCENARIO = "pending_refund";

const shell = String.raw`
  <header class="top-nav">
    <a class="brand-mark" href="#gate" aria-label="False Success Lab home">
      <span class="brand-glyph">FS</span>
      <span><strong>False Success Lab</strong><small>Powered by agent-consistency</small></span>
    </a>
    <nav class="nav-links" aria-label="primary navigation">
      <a href="#gate">Gate</a>
      <a href="#scan">Scan your repo</a>
      <a href="#scenarios">More scenarios</a>
      <a href="https://github.com/karimbaidar/agent-consistency">Core</a>
      <a href="https://github.com/karimbaidar/false-success-lab">GitHub</a>
    </nav>
  </header>

  <main class="simple-page">
    <section class="hero" id="gate">
      <div class="hero-copy">
        <p class="eyebrow">A deterministic gate for agent workflows</p>
        <h1>Agents claim "done." The gate makes them prove it.</h1>
        <p class="hero-subtitle">Watch a refund agent report success &mdash; then watch the gate block it until the payment provider confirms the refund actually settled.</p>
      </div>

      <section class="hero-stage" aria-label="Live gate-blocking demo">
        <div class="hero-stage-head">
          <div>
            <p class="panel-label">Live refund run &middot; <code>scenario: ${HERO_SCENARIO}</code></p>
            <span class="run-pill checking" id="run-source"><span class="status-dot"></span><span id="run-source-copy">Loading run&hellip;</span></span>
          </div>
          <button class="replay-button" id="replay" type="button">&#8635; Replay</button>
        </div>
        <ol class="gate-steps" id="gate-steps" aria-live="polite"></ol>
        <p class="hero-foot" id="hero-foot"></p>
      </section>
    </section>

    <section class="secondary-zone" id="scan">
      <div class="zone-heading">
        <p class="panel-label">Secondary</p>
        <h2>Now run it on your own repo.</h2>
        <p class="zone-sub">The scanner is a deterministic lead magnet, not the product: it finds places where success can be claimed before a source system confirms it. The gate above is what proves the outcome.</p>
      </div>

      <article class="scanner-card" aria-label="Scan a public GitHub repo">
        <div class="scanner-head">
          <div>
            <p class="panel-label">Scan a public GitHub repo</p>
            <h3>Paste a repo. Get a four-section report card.</h3>
          </div>
          <span class="status-pill checking" id="backend-status"><span class="status-dot"></span><span id="backend-copy">Checking backend</span></span>
        </div>
        <form class="scan-form" id="scan-form">
          <input class="repo-input" id="github-url" autocomplete="off" spellcheck="false" value="https://github.com/karimbaidar/false-success-lab" aria-label="Public GitHub repository URL">
          <button class="primary-action" id="scan-button" type="submit">Scan repo</button>
        </form>
        <p class="helper-copy" id="scan-helper">The hosted scanner checks public GitHub repos. Private code can use local report import below.</p>
        <div class="static-mode-banner hidden" id="static-mode-banner"><strong>Static mode</strong><span>${STATIC_MODE_MESSAGE}</span></div>
        <div class="agent-animation hidden" id="agent-animation" aria-live="polite">
          <p class="panel-label">Scanning</p>
          <div class="agent-line">
            <div class="agent-node active" data-agent="repo"><span class="agent-dot">1</span><span class="agent-caption">Read repo</span></div>
            <div class="agent-node" data-agent="action"><span class="agent-dot">2</span><span class="agent-caption">Map actions</span></div>
            <div class="agent-node" data-agent="evidence"><span class="agent-dot">3</span><span class="agent-caption">Check evidence</span></div>
            <div class="agent-node" data-agent="report"><span class="agent-dot">4</span><span class="agent-caption">Build report</span></div>
          </div>
        </div>
      </article>

      <section class="report-section hidden" id="report-section">
        <article class="report-card">
          <div class="report-card-head">
            <div>
              <p class="panel-label">false-success report card</p>
              <h3 id="report-repo">Report</h3>
            </div>
            <span class="status-pill ready" id="report-confidence"><span class="status-dot"></span>Confidence</span>
          </div>
          <div class="report-sections" id="report-sections"></div>
          <div class="report-actions">
            <button class="secondary-action" id="copy-report" type="button">Copy report</button>
            <button class="secondary-action" id="export-json" type="button">Export JSON</button>
          </div>
        </article>
      </section>

      <details class="import-panel" id="local-import">
        <summary>Import a local scan report (private code stays local)</summary>
        <pre class="command-block">agent-consistency scan . --format json &gt; false-success-report.json
agent-consistency scan . --format markdown</pre>
        <textarea id="local-report-input" placeholder="Paste JSON or Markdown report here"></textarea>
        <div class="import-actions">
          <label class="upload-button">Upload report<input id="local-report-file" type="file" accept=".json,.md,.markdown,text/markdown,application/json,text/plain"></label>
          <button class="secondary-action" id="parse-local-report" type="button">Render report</button>
        </div>
      </details>
    </section>

    <details class="more-scenarios" id="scenarios">
      <summary><strong>More scenarios</strong><span>Other false-success patterns the scanner flags &mdash; click to preview a report card.</span></summary>
      <div class="scenario-list" id="scenario-list"></div>
    </details>
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
  runSource: $("#run-source"),
  runSourceCopy: $("#run-source-copy"),
  gateSteps: $("#gate-steps"),
  heroFoot: $("#hero-foot"),
  replay: $("#replay"),
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
  reportSections: $("#report-sections"),
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
let animationTimer = null;
let heroTimers = [];

/* ---------------------------------------------------------------- API base */

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
    nodes.scanHelper.textContent =
      "Backend ready. Public scans use a temporary checkout, build a report card, then clean up.";
  } catch (error) {
    backendAvailable = false;
    nodes.staticBanner.classList.remove("hidden");
    setBackendStatus("static", "Static mirror");
    nodes.scanHelper.textContent =
      "Backend unavailable. Import a local report below or browse the more-scenarios previews.";
  }
}

function setBackendStatus(kind, copy) {
  nodes.backendStatus.className = `status-pill ${kind}`;
  nodes.backendCopy.textContent = copy;
}

/* ------------------------------------------------------------------- Hero */

const HERO_NAIVE_CODE = `# Naive agent: tool returned, so it claims success
refund = provider.issue_refund(order_id, amount)
send_email(customer, "Your refund is complete ✅")
return "Refund complete ✅"`;

const HERO_WRAP_CODE = `# Protected: the gate proves the outcome before "done"
from agent_consistency import reliability_gate
from agent_consistency.outcome import RefundSettlementVerifier

with reliability_gate(run, "refund-agent", "issue_refund",
                      outcome_verifier=RefundSettlementVerifier()) as gate:
    refund = provider.issue_refund(order_id, amount)
    gate.verify_result(refund, RefundSettlementVerifier())
# refund_settled not confirmed -> gate raises, customer is never emailed`;

async function loadHeroRun() {
  setRunSource("checking", "Loading run…");
  if (backendAvailable) {
    try {
      const response = await fetch(apiPath("/api/runs"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: HERO_SCENARIO, provider: "heuristic" }),
      });
      if (!response.ok) throw new Error("run failed");
      const report = await response.json();
      setRunSource("ready", "Live engine run");
      return report;
    } catch (error) {
      /* fall through to the committed fixture */
    }
  }
  const fixture = await fetch("static/hero_run.json", { cache: "no-store" }).then((r) => r.json());
  setRunSource("static", "Committed engine receipt");
  return fixture;
}

function setRunSource(kind, copy) {
  nodes.runSource.className = `run-pill ${kind}`;
  nodes.runSourceCopy.textContent = copy;
}

function heroStepsFromRun(report) {
  const receipts = Array.isArray(report.receipts) ? report.receipts : [];
  const blocking =
    receipts.find((receipt) => receipt.status === "failed") ||
    receipts.find((receipt) => (receipt.outcomes || []).some((o) => o.passed === false)) ||
    receipts[receipts.length - 1] ||
    {};
  const failedOutcome = (blocking.outcomes || []).find((o) => o.passed === false) || {};
  const gateReason = (report.failure && report.failure.message) || failedOutcome.reason || "outcome not confirmed";
  const outcomeName = failedOutcome.name || "refund_settled";
  const providerStatus =
    (failedOutcome.details && failedOutcome.details.status) ||
    ((report.support_case || {}).provider_status || {}).refund_status ||
    "pending";
  const digest = blocking.receipt_digest ? `${String(blocking.receipt_digest).slice(0, 16)}…` : "n/a";

  return [
    {
      tag: "1 · Naive agent",
      tone: "naive",
      title: "The tool returned, so the agent declares success.",
      body: "A naive workflow treats a tool call that didn't throw as a confirmed business outcome.",
      code: HERO_NAIVE_CODE,
      claim: "Refund complete ✅",
    },
    {
      tag: "2 · Gate intercepts",
      tone: "gate",
      title: "agent-consistency intercepts the completion claim.",
      body: `Before the customer is told anything, the gate runs the <code>${escapeHtml(outcomeName)}</code> outcome verifier against the payment provider — deterministically, with no model in the loop.`,
    },
    {
      tag: "3 · Blocked",
      tone: "blocked",
      title: "BLOCKED — missing source-system confirmation.",
      body: `Outcome <code>${escapeHtml(outcomeName)}</code> is not confirmed: provider status is <strong>${escapeHtml(providerStatus)}</strong>, not settled. Fail-closed policy stops the run.`,
      reason: gateReason,
      customerTold: report.customer_response_allowed === true,
    },
    {
      tag: "4 · Receipt",
      tone: "receipt",
      title: "A tamper-evident receipt records exactly why.",
      body: `Hash-chained receipt for the blocked step <code>${escapeHtml(blocking.step_id || "")}</code> · digest <code>${escapeHtml(digest)}</code>. This is produced by the engine, not hand-authored.`,
      receipt: blocking,
    },
    {
      tag: "5 · The wrap",
      tone: "wrap",
      title: "The fix is a handful of lines.",
      body: "Wrap the risky action in a reliability gate with an outcome verifier. The claim only ships once the provider confirms settlement.",
      code: HERO_WRAP_CODE,
    },
  ];
}

function renderHero(steps) {
  clearHeroTimers();
  nodes.gateSteps.innerHTML = steps.map(heroStepMarkup).join("");
  const items = $$("#gate-steps .gate-step");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    items.forEach((item) => item.classList.add("is-visible"));
    nodes.heroFoot.textContent = "The customer was never told the refund completed. Replay to watch again.";
    return;
  }

  nodes.heroFoot.textContent = "";
  items.forEach((item, index) => {
    const timer = window.setTimeout(() => {
      item.classList.add("is-visible");
      item.classList.add("is-active");
      items.forEach((other, otherIndex) => {
        if (otherIndex !== index) other.classList.remove("is-active");
      });
      if (index === items.length - 1) {
        nodes.heroFoot.textContent =
          "The customer was never told the refund completed. Replay to watch again.";
      }
      item.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 1600 * index + 250);
    heroTimers.push(timer);
  });
}

function heroStepMarkup(step) {
  const parts = [
    `<li class="gate-step tone-${step.tone}">`,
    `<div class="gate-step-rail"><span class="gate-step-dot"></span></div>`,
    `<div class="gate-step-body">`,
    `<p class="gate-step-tag">${escapeHtml(step.tag)}</p>`,
    `<h4>${escapeHtml(step.title)}</h4>`,
    `<p class="gate-step-copy">${step.body}</p>`,
  ];
  if (step.claim) parts.push(`<p class="naive-claim">${escapeHtml(step.claim)}</p>`);
  if (step.code) parts.push(`<pre class="code-block">${escapeHtml(step.code)}</pre>`);
  if (step.reason) {
    parts.push(
      `<div class="block-banner"><span class="block-pill">BLOCKED</span><code>${escapeHtml(step.reason)}</code></div>`
    );
    parts.push(
      `<p class="block-note">customer_response_allowed: <strong>${step.customerTold ? "true" : "false"}</strong></p>`
    );
  }
  if (step.receipt) {
    parts.push(
      `<pre class="code-block receipt-json">${escapeHtml(JSON.stringify(step.receipt, null, 2))}</pre>`
    );
  }
  parts.push(`</div></li>`);
  return parts.join("");
}

function clearHeroTimers() {
  heroTimers.forEach((timer) => window.clearTimeout(timer));
  heroTimers = [];
}

let heroSteps = [];

async function startHero() {
  try {
    const report = await loadHeroRun();
    heroSteps = heroStepsFromRun(report);
    renderHero(heroSteps);
  } catch (error) {
    nodes.gateSteps.innerHTML = `<li class="gate-step tone-blocked is-visible"><div class="gate-step-body"><h4>Could not load the demo run.</h4><p class="gate-step-copy">${escapeHtml(
      error.message || "unknown error"
    )}</p></div></li>`;
    setRunSource("static", "Run unavailable");
  }
}

/* ------------------------------------------------------------------- Scan */

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
    const report = normalizeReport(payload.report || payload, repoUrl, payload.markdown);
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
  }, 600);
}

function finishScanAnimation(callback) {
  setTimeout(() => {
    clearInterval(animationTimer);
    $$(".agent-node").forEach((node) => node.classList.add("complete"));
    nodes.scanButton.disabled = false;
    nodes.scanButton.textContent = "Scan repo";
    callback();
  }, 650);
}

function activateAgent(index) {
  $$(".agent-node").forEach((node, nodeIndex) => {
    node.classList.toggle("active", nodeIndex === index);
    node.classList.toggle("complete", nodeIndex < index);
  });
}

/* -------------------------------------------------------- Report normalize */

function normalizeReport(input, fallbackRepo, markdown = "") {
  const source = input || {};
  const findings = Array.isArray(source.findings)
    ? source.findings
    : Array.isArray(source.top_findings)
    ? source.top_findings
    : [];
  const normalized = findings.map(normalizeFinding);
  const groups = Array.isArray(source.finding_groups)
    ? source.finding_groups.map(normalizeFindingGroup)
    : normalized;
  const high = numberOr(source.high_severity, groups.filter((f) => f.severity === "high").length);
  const medium = numberOr(source.medium_severity, groups.filter((f) => f.severity === "medium").length);
  const low = numberOr(source.low_severity, groups.filter((f) => f.severity === "low").length);
  const risky = numberOr(source.risky_actions_found, groups.length || high + medium + low);
  const systemMap = source.system_map || {};
  return {
    repository: source.repository || source.repo || source.target || fallbackRepo || "imported report",
    applicability: source.applicability || "unknown",
    applicability_confidence: source.applicability_confidence || "low",
    applicability_summary: source.applicability_summary || "",
    files_scanned: numberOr(source.files_scanned, 0),
    agentic_files: numberOr(source.agentic_files, 0),
    framework_signals: arrayOrEmpty(source.framework_signals),
    system_map: {
      entry_points: arrayOrEmpty(systemMap.entry_points),
      action_surfaces: arrayOrEmpty(systemMap.action_surfaces),
      source_systems: arrayOrEmpty(systemMap.source_systems),
    },
    risky_actions_found: risky,
    false_success_exposure: numberOr(source.false_success_exposure, risky),
    high_severity: high,
    medium_severity: medium,
    low_severity: low,
    verified_actions_found: numberOr(source.verified_actions_found, 0),
    confidence: source.confidence || confidenceFromFindings(groups),
    findings: groups,
    raw_findings: normalized,
    markdown,
  };
}

function normalizeFindingGroup(group) {
  const representative = group.representative || {};
  const normalized = normalizeFinding({
    ...representative,
    action: group.action || representative.action,
    severity: group.severity || representative.severity,
    confidence: group.confidence || representative.confidence,
    why: group.why || representative.why,
    evidence_found: group.evidence_found || representative.evidence_found,
    evidence_missing: group.evidence_missing || representative.evidence_missing,
    missing_confirmation: representative.missing_confirmation || group.missing_confirmation,
    suggested_fix: representative.suggested_fix || group.suggested_fix,
  });
  normalized.category = group.category || representative.category || "general";
  normalized.count = numberOr(group.count, 1);
  normalized.locations = asArray(group.locations || [`${normalized.path}:${normalized.line}`]);
  return normalized;
}

function normalizeFinding(finding) {
  const missing = asArray(finding.evidence_missing || finding.missing_evidence || finding.missing);
  return {
    action: finding.action || finding.name || finding.title || "risky_action",
    severity: normalizeSeverity(finding.severity),
    confidence: finding.confidence || "medium",
    path: finding.path || finding.file || finding.filename || "unknown",
    line: finding.line || finding.line_number || "-",
    category: finding.category || "general",
    count: numberOr(finding.count, 1),
    locations: arrayOrEmpty(finding.locations),
    why: finding.why || finding.reason || finding.message || finding.description ||
      "This action may need outcome verification before confirmation.",
    evidence_found: asArray(finding.evidence_found || finding.evidence || finding.signals),
    evidence_missing: missing,
    missing_confirmation: finding.missing_confirmation || missing[0] || "source-system outcome confirmation",
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

function arrayOrEmpty(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return value ? [String(value)] : [];
}

function confidenceFromFindings(findings) {
  if (findings.some((f) => f.confidence === "high")) return "high";
  if (findings.some((f) => f.confidence === "medium")) return "medium";
  return findings.length ? "low" : "none";
}

/* ----------------------------------------------------- Four-section report */

function renderReport(report, markdown = "") {
  currentReport = report;
  currentMarkdown = markdown || markdownForReport(report);
  nodes.reportSection.classList.remove("hidden");
  nodes.reportRepo.textContent = shortRepo(report.repository);
  nodes.reportConfidence.innerHTML = `<span class="status-dot"></span>Confidence: ${escapeHtml(report.confidence)}`;
  nodes.reportSections.innerHTML = [
    diagnosisSection(report),
    systemMapSection(report),
    criticalGapsSection(report),
    fixPlanSection(report),
  ].join("");
  $$(".gap-card[data-index]").forEach((card) =>
    card.addEventListener("click", () => openFinding(report.findings[Number(card.dataset.index)]))
  );
  nodes.reportSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function reportBlock(number, title, bodyHtml) {
  return `<section class="report-block"><p class="block-index">${number}</p><div class="report-block-body"><h4>${escapeHtml(
    title
  )}</h4>${bodyHtml}</div></section>`;
}

function diagnosisSection(report) {
  const fit = fitLabel(report.applicability);
  const reason = report.applicability_summary || "No clear agent-workflow surface was detected.";
  const chips = [
    `${fit} repo`,
    `${report.applicability_confidence} confidence`,
    `${report.agentic_files} agentic files`,
    `${report.files_scanned} files scanned`,
  ];
  if (report.framework_signals.length) chips.push(report.framework_signals.slice(0, 3).join(", "));
  return reportBlock(
    "1",
    "Repo diagnosis",
    `<div class="chip-row">${chips.map((c) => `<span>${escapeHtml(c)}</span>`).join("")}</div><p class="block-reason">${escapeHtml(
      reason
    )}</p>`
  );
}

function systemMapSection(report) {
  const map = report.system_map;
  const row = (label, items) =>
    `<div class="map-row"><span class="map-label">${escapeHtml(label)}</span><div class="map-values">${
      items.length ? items.map((i) => `<code>${escapeHtml(i)}</code>`).join("") : `<span class="map-empty">none detected</span>`
    }</div></div>`;
  return reportBlock(
    "2",
    "System map",
    row("Entry points", map.entry_points) +
      row("Side-effect actions", map.action_surfaces) +
      row("Source systems to confirm", map.source_systems)
  );
}

function criticalGapsSection(report) {
  if (!report.findings.length) {
    return reportBlock(
      "3",
      "Critical gaps",
      `<p class="block-reason">No place where success is claimed without source-system confirmation was found. For non-agentic repos, treat this as low applicability rather than proof of safety.</p>`
    );
  }
  const cards = report.findings
    .map((finding, index) => {
      const count = finding.count > 1 ? `<span class="count-pill">${finding.count} places</span>` : "";
      return `<button class="gap-card" data-index="${index}" type="button"><div class="gap-head"><div><strong>${escapeHtml(
        finding.action
      )}</strong><p>${escapeHtml(finding.category)} &middot; ${escapeHtml(finding.path)}:${escapeHtml(
        String(finding.line)
      )}</p></div><span class="severity-pill ${escapeHtml(finding.severity)}">${escapeHtml(
        finding.severity
      )}</span></div><p>${escapeHtml(finding.why)}</p><p class="gap-missing">Missing check: <code>${escapeHtml(
        finding.missing_confirmation
      )}</code></p>${count}</button>`;
    })
    .join("");
  return reportBlock("3", "Critical gaps", `<div class="gap-list">${cards}</div>`);
}

function fixPlanSection(report) {
  const top = report.findings[0];
  const steps = [
    "Identify the source-system check that proves each action (settlement, deletion, fill, resolution).",
    "Wrap the action in a reliability gate with an outcome verifier.",
    "Block the customer-facing claim until the verifier passes; emit the receipt.",
  ];
  const fix = top ? top.suggested_fix : pythonFix("verified_action", "confirmed_result");
  return reportBlock(
    "4",
    "Fix plan",
    `<ol class="fix-steps">${steps.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ol><pre class="code-block">${escapeHtml(
      fix
    )}</pre>`
  );
}

function shortRepo(value) {
  return String(value || "Report").replace("https://github.com/", "");
}

function fitLabel(applicability) {
  if (applicability === "agentic-workflow") return "Agentic";
  if (applicability === "workflow-adjacent") return "Workflow-adjacent";
  if (applicability === "general-code") return "General";
  return "Unknown";
}

function errorReport(repoUrl, message) {
  return normalizeReport(
    {
      repository: repoUrl,
      confidence: "low",
      findings: [
        {
          action: "scan_error",
          severity: "low",
          confidence: "low",
          path: "hosted scanner",
          line: "-",
          why: message,
          evidence_found: ["request attempted"],
          evidence_missing: ["backend scan result"],
          suggested_fix: "Run `agent-consistency scan . --format markdown` locally and import the report.",
        },
      ],
    },
    repoUrl
  );
}

/* ------------------------------------------------------------ Local import */

function handleLocalReport() {
  const value = nodes.localInput.value.trim();
  if (!value) {
    showToast("Paste JSON or Markdown report output first.");
    return;
  }
  try {
    renderReport(normalizeReport(JSON.parse(value), "local import", value), value);
  } catch (error) {
    renderReport(
      normalizeReport(
        {
          repository: "local import",
          risky_actions_found: 1,
          confidence: "medium",
          findings: [
            {
              action: "imported_markdown_report",
              severity: "medium",
              confidence: "medium",
              path: "pasted report",
              line: "-",
              why: "Imported Markdown report rendered into a report card.",
              evidence_found: ["scanner report pasted"],
              evidence_missing: ["machine-readable JSON for exact locations"],
              suggested_fix: "Export with `--format json` to keep the exact verified-action fix.",
            },
          ],
        },
        "local import",
        value
      )
    );
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

/* --------------------------------------------------------- More scenarios */

const scenarios = [
  scenario("Refund customer", "send_refund_confirmation", "high", "Message may claim refund completion before settlement is confirmed.", "refund_settled"),
  scenario("Close support ticket", "close_ticket", "high", "Ticket may close before resolution evidence exists.", "resolution_confirmed"),
  scenario("Delete account", "delete_user", "high", "Destructive action needs idempotency and deletion confirmation.", "deletion_confirmed"),
  scenario("Provision server", "provision_server", "medium", "Infrastructure may be reported ready before health checks pass.", "server_ready"),
  scenario("Update CRM", "update_record", "medium", "Record update may need read-after-write confirmation.", "crm_record_updated"),
  scenario("Grant access", "grant_access", "high", "Access grant needs principal, role, and scope confirmation.", "access_grant_verified"),
  scenario("Place trade", "place_trade", "high", "Order submission should not be treated as fill confirmation.", "order_filled"),
];

function scenario(name, action, severity, why, outcome) {
  return { name, action, severity, why, outcome };
}

function renderScenarios() {
  nodes.scenarioList.innerHTML = scenarios
    .map(
      (item, index) =>
        `<button class="scenario-button" data-index="${index}" type="button"><strong>${escapeHtml(
          item.name
        )}</strong><span>${escapeHtml(item.why)}</span></button>`
    )
    .join("");
  $$(".scenario-button").forEach((button) =>
    button.addEventListener("click", () => {
      const item = scenarios[Number(button.dataset.index)];
      renderReport(scenarioReport(item), "");
    })
  );
}

function scenarioReport(item) {
  return normalizeReport(
    {
      repository: "more-scenarios preview",
      applicability: "agentic-workflow",
      applicability_confidence: "medium",
      applicability_summary: "Illustrative pattern preview, not a scan of real code.",
      risky_actions_found: 1,
      false_success_exposure: 1,
      high_severity: item.severity === "high" ? 1 : 0,
      medium_severity: item.severity === "medium" ? 1 : 0,
      low_severity: 0,
      confidence: item.severity === "high" ? "high" : "medium",
      system_map: {
        entry_points: [`scenarios/${item.action}.py`],
        action_surfaces: [item.action],
        source_systems: ["source system for this action"],
      },
      findings: [
        {
          action: item.action,
          severity: item.severity,
          confidence: item.severity === "high" ? "high" : "medium",
          path: `scenarios/${item.action}.py`,
          line: 1,
          why: item.why,
          evidence_found: ["workflow action detected"],
          evidence_missing: [item.outcome, "source system confirmation"],
          missing_confirmation: item.outcome,
          suggested_fix: pythonFix(item.action, item.outcome),
        },
      ],
    },
    "more-scenarios preview"
  );
}

/* -------------------------------------------------------------- Drawer/fix */

function openFinding(finding) {
  if (!finding) return;
  const locations = finding.locations.length ? finding.locations : [`${finding.path}:${finding.line}`];
  nodes.drawerContent.innerHTML = `<p class="panel-label">Critical gap detail</p><h2>${escapeHtml(
    finding.action
  )}</h2><div class="drawer-section"><span class="severity-pill ${escapeHtml(finding.severity)}">${escapeHtml(
    finding.severity
  )}</span><span>Confidence: ${escapeHtml(finding.confidence)}</span><span>${escapeHtml(
    finding.category
  )}</span></div><div class="drawer-section"><h3>Why it matters</h3><p>${escapeHtml(
    finding.why
  )}</p></div><div class="drawer-section"><h3>Missing check</h3><p><code>${escapeHtml(
    finding.missing_confirmation
  )}</code></p></div><div class="drawer-section"><h3>Locations</h3><div class="drawer-list">${locations
    .slice(0, 8)
    .map((item) => `<span>${escapeHtml(item)}</span>`)
    .join("")}</div></div><div class="drawer-section"><h3>Verified-action wrap</h3><div class="copy-row"><button class="secondary-action" data-fix="python">Python</button><button class="secondary-action" data-fix="wrapper">Tool wrapper</button></div><pre class="code-block" id="drawer-code">${escapeHtml(
    finding.suggested_fix
  )}</pre></div>`;
  nodes.drawer.classList.add("open");
  nodes.drawer.setAttribute("aria-hidden", "false");
  $$("[data-fix]").forEach((button) =>
    button.addEventListener("click", () => {
      const fix = button.dataset.fix === "wrapper" ? toolWrapperFix(finding.action) : finding.suggested_fix;
      $("#drawer-code").textContent = fix;
      copyText(fix, "Fix copied");
    })
  );
}

function closeDrawer() {
  nodes.drawer.classList.remove("open");
  nodes.drawer.setAttribute("aria-hidden", "true");
}

function pythonFix(action, outcome) {
  return `from agent_consistency import reliability_gate\n\nwith reliability_gate(run, "agent", "${action}") as gate:\n    result = ${action}()\n    gate.verify_result(\n        result,\n        lambda r: source_system_confirms("${outcome}", r),\n    )`;
}

function toolWrapperFix(action) {
  return `async def verified_${action}(*args, **kwargs):\n    result = await ${action}(*args, **kwargs)\n    if not await source_system_confirms(result):\n        raise RuntimeError("Source system did not confirm the result")\n    return result`;
}

/* ---------------------------------------------------------------- Export */

function markdownForReport(report) {
  if (!report) return "";
  const findings = report.findings
    .map((f) => `- [${f.severity}] ${f.action} (${f.confidence}) - missing: ${f.missing_confirmation}`)
    .join("\n");
  const map = report.system_map;
  return `# False-success report card\n\nRepository: ${report.repository}\n\n## 1. Repo diagnosis\nFit: ${report.applicability} (${report.applicability_confidence})\n${report.applicability_summary}\n\n## 2. System map\nEntry points: ${map.entry_points.join(", ") || "none"}\nSide-effect actions: ${map.action_surfaces.join(", ") || "none"}\nSource systems: ${map.source_systems.join(", ") || "none"}\n\n## 3. Critical gaps\n${findings || "None found."}\n\n## 4. Fix plan\nWrap each risky action in a reliability gate with an outcome verifier.\n`;
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

/* ----------------------------------------------------------------- Wire up */

nodes.replay.addEventListener("click", () => {
  if (heroSteps.length) renderHero(heroSteps);
  else startHero();
});
nodes.scanForm.addEventListener("submit", handleScan);
nodes.parseLocal.addEventListener("click", handleLocalReport);
nodes.localFile.addEventListener("change", handleLocalFile);
nodes.copyReport.addEventListener("click", () => copyText(currentMarkdown || markdownForReport(currentReport), "Report copied"));
nodes.exportJson.addEventListener("click", exportJson);
nodes.drawerClose.addEventListener("click", closeDrawer);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeDrawer();
});

renderScenarios();
checkBackend().then(startHero);
