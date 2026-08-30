// frontend/js/api.js
// All network calls to the FastAPI backend.
// Import CONFIG from config.js (loaded before this script in the HTML).

async function apiPredict(sequence) {
  const res = await fetch(`${CONFIG.API_BASE_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sequence }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Server error ${res.status}`);
  }
  return res.json();
}

async function apiPredictBatch(isolates) {
  // isolates: [{id, sequence}, ...]
  const res = await fetch(`${CONFIG.API_BASE_URL}/predict-batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isolates }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Server error ${res.status}`);
  }
  return res.json();
}

async function apiHealth() {
  const res = await fetch(`${CONFIG.API_BASE_URL}/health`);
  return res.ok;
}
