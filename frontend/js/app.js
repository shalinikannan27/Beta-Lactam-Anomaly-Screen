// frontend/js/app.js
// Main controller: wires DOM events to api.js + ui.js functions.
// Updated for v2 response shape: status = "flagged" | "safe" | "rejected"

document.addEventListener("DOMContentLoaded", async () => {

  /* ── Tab buttons ── */
  document.getElementById("tab-single").addEventListener("click", () => switchTab("single"));
  document.getElementById("tab-batch").addEventListener("click",  () => switchTab("batch"));

  /* ── Backend health check banner ── */
  const healthy = await apiHealth().catch(() => false);
  if (!healthy) {
    const banner = document.getElementById("health-banner");
    if (banner) banner.classList.remove("hidden");
    const urlSpan = document.getElementById("health-banner-url");
    if (urlSpan) urlSpan.textContent = CONFIG.API_BASE_URL;
  }

  /* ── Single mode: Run Analysis ── */
  document.getElementById("btn-run-single").addEventListener("click", async () => {
    const sequence  = document.getElementById("input-sequence").value.trim();
    const isolateId = document.getElementById("input-isolate-id").value.trim() || "Unknown";

    if (!sequence) {
      showError("Please paste a pbp2x protein sequence before running the analysis.");
      return;
    }

    showLoading();
    try {
      const result = await apiPredict(sequence);

      if (result.status === "rejected") {
        // Species/coverage safeguard triggered — show as low-confidence view
        showLowConfidence(result.rejection_reason || "Sequence was rejected by the quality safeguard.");
      } else {
        // flagged or safe — show the full result card
        showSingleResult(isolateId, result);
      }
    } catch (err) {
      showError(
        err.message.includes("fetch")
          ? "Cannot reach the backend. Make sure the FastAPI server is running on port 8000."
          : err.message
      );
    }
  });

  /* ── Single mode: Download PDF ── */
  document.getElementById("btn-download-pdf").addEventListener("click", () => {
    if (_lastResult) downloadPDF(_lastIsolateId, _lastResult);
  });

  /* ── Batch CSV export ── */
  document.getElementById("btn-download-csv").addEventListener("click", () => {
    if (_lastBatchData) exportBatchCSV(_lastBatchData);
  });

  /* ── Batch mode: file upload ── */
  const fileInput = document.getElementById("batch-upload");
  const dropZone  = document.getElementById("batch-dropzone");

  dropZone.addEventListener("click", () => fileInput.click());
  dropZone.addEventListener("dragover",  e => { e.preventDefault(); dropZone.classList.add("bg-primary/10"); });
  dropZone.addEventListener("dragleave", () => dropZone.classList.remove("bg-primary/10"));
  dropZone.addEventListener("drop", e => {
    e.preventDefault();
    dropZone.classList.remove("bg-primary/10");
    const file = e.dataTransfer.files[0];
    if (file) handleBatchFile(file);
  });
  fileInput.addEventListener("change", () => {
    if (fileInput.files[0]) handleBatchFile(fileInput.files[0]);
  });

  function handleBatchFile(file) {
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById("batch-textarea").value = e.target.result;
      document.getElementById("batch-textarea-section").classList.remove("hidden");
    };
    reader.readAsText(file);
  }

  /* ── Batch mode: Run batch ── */
  document.getElementById("btn-run-batch").addEventListener("click", async () => {
    const raw = document.getElementById("batch-textarea").value.trim();
    if (!raw) {
      showError("Please upload a file or paste sequences in the batch text area.");
      return;
    }

    let isolates;
    try {
      isolates = parseBatchText(raw);
    } catch (e) {
      showError("Could not parse input. Use FASTA format or ID,SEQUENCE lines.");
      return;
    }

    if (!isolates.length) {
      showError("No valid isolates found. Check your input format.");
      return;
    }
    if (isolates.length > 500) {
      showError("Maximum 500 isolates per batch.");
      return;
    }

    showLoading();
    try {
      const data = await apiPredictBatch(isolates);
      _lastBatchData = data;
      showBatchResult(data);
    } catch (err) {
      showError(
        err.message.includes("fetch")
          ? "Cannot reach the backend. Make sure the FastAPI server is running on port 8000."
          : err.message
      );
    }
  });
});
