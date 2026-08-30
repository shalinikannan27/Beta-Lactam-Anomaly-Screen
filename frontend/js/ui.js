// frontend/js/ui.js
// Handles all DOM mutations: show/hide panels, render results, loading & error states.
// Updated to consume the v2 response shape:
//   { isolate_id, status, mutations, reasons, rejection_reason }

/* ── helpers ── */
function show(id) { document.getElementById(id).classList.remove("hidden"); }
function hide(id) { document.getElementById(id).classList.add("hidden"); }
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

/* ── Tab switching ── */
function switchTab(type) {
  const isS = type === "single";
  document.getElementById("tab-single").classList.toggle("tab-active", isS);
  document.getElementById("tab-single").classList.toggle("text-on-surface-variant", !isS);
  document.getElementById("tab-batch").classList.toggle("tab-active", !isS);
  document.getElementById("tab-batch").classList.toggle("text-on-surface-variant", isS);
  document.getElementById("view-single").classList.toggle("hidden", !isS);
  document.getElementById("view-batch").classList.toggle("hidden", isS);
  hide("results-placeholder"); hide("results-single"); hide("results-batch");
  hide("results-loading"); hide("results-error"); hide("results-low-confidence");
  show("results-placeholder");
}

/* ── Loading state ── */
function showLoading() {
  hide("results-placeholder"); hide("results-single"); hide("results-batch");
  hide("results-error"); hide("results-low-confidence");
  show("results-loading");
}

/* ── Error state ── */
function showError(message) {
  hide("results-loading"); hide("results-single"); hide("results-batch");
  hide("results-placeholder"); hide("results-low-confidence");
  setText("error-message", message);
  show("results-error");
}

/* ── Low-confidence / rejected state ── */
function showLowConfidence(reason) {
  hide("results-loading"); hide("results-single"); hide("results-batch");
  hide("results-placeholder"); hide("results-error");
  setText("low-confidence-reason", reason);
  show("results-low-confidence");
}

/* ── Single result ── */
let _lastResult = null;
let _lastIsolateId = "";

/* ── Batch result ── */
let _lastBatchData = null;

function showSingleResult(isolateId, result) {
  _lastResult = result;
  _lastIsolateId = isolateId;

  hide("results-loading"); hide("results-placeholder"); hide("results-batch");
  hide("results-error"); hide("results-low-confidence");

  const isFlagged = result.status === "flagged";
  const headerEl = document.getElementById("result-header");
  const iconEl   = document.getElementById("result-icon");
  const titleEl  = document.getElementById("result-title");
  const labelEl  = document.getElementById("result-label");

  // Header colour
  headerEl.className = isFlagged
    ? "p-stack-md bg-error-container/30 flex justify-between items-center border-b border-outline-variant"
    : "p-stack-md bg-primary-container/10 flex justify-between items-center border-b border-outline-variant";

  labelEl.className = isFlagged
    ? "font-label-sm text-label-sm text-error uppercase tracking-wider font-bold"
    : "font-label-sm text-label-sm text-primary uppercase tracking-wider font-bold";

  labelEl.textContent = "Classification Status";
  iconEl.textContent  = isFlagged ? "flag" : "check_circle";
  iconEl.className    = isFlagged
    ? "material-symbols-outlined text-error text-3xl"
    : "material-symbols-outlined text-primary text-3xl";
  iconEl.style.fontVariationSettings = "'FILL' 1";

  titleEl.textContent = isFlagged ? "Flagged: Potential Resistance" : "Strain Cleared — Safe";
  titleEl.className   = isFlagged
    ? "font-headline-md text-headline-md text-error"
    : "font-headline-md text-headline-md text-primary";

  // Always hide the probability row (Isolation Forest — no probability exposed)
  hide("result-prob-row");

  // Reasoning — join all reason strings
  const reasonText = (result.reasons || []).join(" ");
  setText("result-reason", reasonText);
  // note is embedded in reasons; keep element clean

  // Mutations section
  const container = document.getElementById("result-mutations");
  container.innerHTML = "";
  const mutations = result.mutations || [];

  if (mutations.length) {
    mutations.forEach(mut => {
      const typeLabel = (mut.type || "point_mutation").replace(/_/g, " ");
      const typeBadgeColor = {
        "point_mutation":      "bg-amber-100 text-amber-800 border-amber-300",
        "deletion":            "bg-red-100 text-red-800 border-red-300",
        "insertion":           "bg-purple-100 text-purple-800 border-purple-300",
        "frameshift_indicator":"bg-orange-100 text-orange-900 border-orange-400",
      }[mut.type] || "bg-surface-container border-outline-variant text-on-surface";

      container.innerHTML += `
        <div class="bg-white p-4 rounded-xl border border-outline-variant shadow-sm space-y-2">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <span class="font-mono font-bold text-lg text-primary">${mut.substitution}</span>
            <span class="text-[10px] px-2 py-0.5 rounded-full border font-label-sm uppercase tracking-wide ${typeBadgeColor}">${typeLabel}</span>
          </div>
          <div class="text-sm text-on-surface-variant">Position <strong>${mut.position}</strong></div>
          ${mut.explanation ? `<p class="text-sm text-on-surface leading-relaxed mt-1">${mut.explanation}</p>` : ""}
        </div>`;
    });
    show("result-mutations-section");
  } else {
    container.innerHTML = `<p class="text-sm text-on-surface-variant">No mutations at monitored hotspot positions.</p>`;
    show("result-mutations-section");
  }

  show("results-single");
}

/* ── Batch result table ── */
function showBatchResult(data) {
  hide("results-loading"); hide("results-placeholder"); hide("results-single");
  hide("results-error"); hide("results-low-confidence");

  const results = data.results || [];
  const flagged  = results.filter(r => r.status === "flagged").length;
  const safe     = results.filter(r => r.status === "safe").length;
  const rejected = results.filter(r => r.status === "rejected").length;

  setText("batch-flagged-count", `${flagged} Flagged`);
  setText("batch-safe-count", `${safe} Safe`);

  // Update (or set) a rejected count badge if the element exists
  const rejectedEl = document.getElementById("batch-rejected-count");
  if (rejectedEl) {
    rejectedEl.textContent = `${rejected} Rejected`;
    rejectedEl.classList.toggle("hidden", rejected === 0);
  }

  const tbody = document.getElementById("batch-tbody");
  tbody.innerHTML = "";
  results.forEach(r => {
    const isFlagged  = r.status === "flagged";
    const isRejected = r.status === "rejected";
    const borderColor = isFlagged ? "border-error" : isRejected ? "border-secondary" : "border-primary";

    const statusHTML = isFlagged
      ? `<span class="flex items-center gap-1 text-error font-bold"><span class="material-symbols-outlined text-sm" style="font-variation-settings:'FILL' 1">flag</span> Flagged</span>`
      : isRejected
      ? `<span class="flex items-center gap-1 text-secondary font-bold"><span class="material-symbols-outlined text-sm">block</span> Rejected</span>`
      : `<span class="flex items-center gap-1 text-primary font-bold"><span class="material-symbols-outlined text-sm" style="font-variation-settings:'FILL' 1">check_circle</span> Safe</span>`;

    // Show substitution notations (e.g. "T553K, T600I") or reason for rejection
    let mutationsText = "None";
    if (isRejected) {
      mutationsText = `<span class="text-secondary italic">${r.rejection_reason || "Rejected"}</span>`;
    } else if (r.mutations && r.mutations.length) {
      mutationsText = r.mutations.map(m =>
        `<span class="font-mono bg-amber-50 border border-amber-200 px-1 rounded text-xs">${m.substitution}</span>`
      ).join(" ");
    }

    tbody.innerHTML += `
      <tr class="hover:bg-primary/5 transition-colors">
        <td class="px-6 py-4 font-mono text-sm border-l-4 ${borderColor}">${r.isolate_id || r.id || ""}</td>
        <td class="px-6 py-4">${statusHTML}</td>
        <td class="px-6 py-4 text-xs text-on-surface-variant">${mutationsText}</td>
      </tr>`;
  });

  show("results-batch");
}

/* ── Parse batch textarea ── */
function parseBatchText(raw) {
  // Accepts lines of: ID,SEQUENCE  or  >ID\nSEQUENCE (FASTA)
  const lines = raw.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const isolates = [];
  let currentId = null;
  let currentSeq = [];

  const flush = () => {
    if (currentId && currentSeq.length) {
      isolates.push({ id: currentId, sequence: currentSeq.join("") });
    }
    currentId = null; currentSeq = [];
  };

  lines.forEach(line => {
    if (line.startsWith(">")) {
      flush();
      currentId = line.slice(1).trim().split(/\s/)[0] || `seq${isolates.length + 1}`;
    } else if (line.includes(",")) {
      flush();
      const [id, ...rest] = line.split(",");
      isolates.push({ id: id.trim(), sequence: rest.join(",").trim() });
    } else if (currentId) {
      currentSeq.push(line.replace(/\s/g, "").toUpperCase());
    }
  });
  flush();
  return isolates;
}

/* ── Export batch results as CSV ── */
function exportBatchCSV(data) {
  const results = data.results || [];
  const rows = [["Isolate ID", "Status", "Substitutions", "Rejection Reason"]];
  results.forEach(r => {
    const subs = (r.mutations || []).map(m => m.substitution).join("; ") || "None";
    const rejection = r.rejection_reason || "";
    rows.push([r.isolate_id || "", r.status || "", subs, rejection]);
  });
  const csv = rows.map(row =>
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")
  ).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `spyogenes_batch_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
