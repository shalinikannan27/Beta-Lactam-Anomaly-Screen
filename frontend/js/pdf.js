// frontend/js/pdf.js
// Generates a downloadable PDF report from a single prediction result.
// Requires jsPDF to be loaded via CDN before this script.
// Updated for v2 response shape: status / mutations / reasons / rejection_reason
// No raw model score or probability is included per finalized UI spec.

function downloadPDF(isolateId, result) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = 22;

  // ── Header bar ──
  doc.setFillColor(0, 107, 95);
  doc.rect(0, 0, W, 14, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("S. pyogenes Ranker — Clinical Surveillance Report", margin, 9.5);

  // ── Title ──
  y = 28;
  doc.setTextColor(11, 28, 48);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("pbp2x Susceptibility Risk Report", margin, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 73, 71);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);

  y += 12;
  doc.setDrawColor(187, 202, 198);
  doc.line(margin, y, W - margin, y);

  // ── Isolate info ──
  y += 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(11, 28, 48);
  doc.text("Isolate Information", margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 73, 71);
  doc.text(`Isolate ID:  ${isolateId || result.isolate_id || "N/A"}`, margin, y);

  // ── Classification ──
  y += 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(11, 28, 48);
  doc.text("Classification", margin, y);
  y += 7;

  const status = result.status || "unknown";
  let fillColor, label;
  if (status === "flagged")  { fillColor = [186, 26, 26];  label = "FLAGGED — Elevated Risk"; }
  else if (status === "safe") { fillColor = [0, 107, 95];   label = "SAFE — No High-Risk Markers"; }
  else                        { fillColor = [85, 97, 95];   label = "REJECTED — Sequence Quality Safeguard"; }

  doc.setFillColor(...fillColor);
  doc.roundedRect(margin, y, W - margin * 2, 10, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(label, margin + 4, y + 6.5);

  // ── Rejection reason (if applicable) ──
  if (status === "rejected" && result.rejection_reason) {
    y += 16;
    doc.setTextColor(11, 28, 48);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Rejection Reason", margin, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 73, 71);
    const rejLines = doc.splitTextToSize(result.rejection_reason, W - margin * 2);
    doc.text(rejLines, margin, y);
    y += rejLines.length * 5 + 8;
  }

  // ── Mutations (substitution notation + type) ──
  const mutations = result.mutations || [];
  y += 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(11, 28, 48);
  doc.text("Detected Mutations", margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 73, 71);

  if (mutations.length === 0) {
    doc.text("None detected at monitored hotspot positions.", margin, y);
    y += 7;
  } else {
    mutations.forEach(mut => {
      const typeLabel = (mut.type || "point_mutation").replace(/_/g, " ");
      const line = `${mut.substitution}  (position ${mut.position}, ${typeLabel})`;
      doc.text(line, margin, y);
      y += 6;

      if (mut.explanation) {
        const expLines = doc.splitTextToSize(`  ${mut.explanation}`, W - margin * 2 - 4);
        doc.setFontSize(9);
        doc.setTextColor(80, 93, 91);
        doc.text(expLines, margin + 4, y);
        y += expLines.length * 4.5 + 4;
        doc.setFontSize(10);
        doc.setTextColor(60, 73, 71);
      }
    });
  }

  // ── Reasoning ──
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(11, 28, 48);
  doc.text("Determinative Reasoning", margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 73, 71);

  const reasons = result.reasons || [];
  // Print all reasons except the last one (which is the disclaimer, handled below)
  const mainReasons = reasons.slice(0, -1);
  const disclaimer  = reasons[reasons.length - 1] || "";

  mainReasons.forEach(r => {
    const rLines = doc.splitTextToSize(r, W - margin * 2);
    doc.text(rLines, margin, y);
    y += rLines.length * 5 + 4;
  });

  // ── Disclaimer ──
  y += 4;
  doc.setDrawColor(187, 202, 198);
  doc.line(margin, y, W - margin, y);
  y += 8;
  doc.setFontSize(8.5);
  doc.setTextColor(108, 122, 119);
  doc.setFont("helvetica", "italic");
  const disclaimerLines = doc.splitTextToSize(disclaimer, W - margin * 2);
  doc.text(disclaimerLines, margin, y);

  doc.save(`${isolateId || "report"}_pbp2x_risk.pdf`);
}
