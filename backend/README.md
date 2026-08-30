# S. pyogenes Ranker — Backend

FastAPI service that predicts **reduced β-lactam susceptibility risk** in
*Streptococcus pyogenes* isolates by detecting key mutations in the pbp2x
transpeptidase domain using a pre-trained Random Forest model.

---

## Project layout

```
backend/
├── app.py                  ← FastAPI application (this is what you run)
├── requirements.txt        ← Python dependencies
├── README.md               ← You are here
└── model/
    └── pbp2x_flag_model.pkl  ← Pre-trained model bundle (not committed to git)
```

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Python 3.10 + | 3.11 / 3.12 recommended |
| `model/pbp2x_flag_model.pkl` | Place the pickle in `backend/model/` before starting |

---

## Setup & run

```bash
# 1. Create and activate a virtual environment (recommended)
python -m venv .venv
.\.venv\Scripts\Activate.ps1          # PowerShell (Windows)
# source .venv/bin/activate           # bash / zsh (macOS / Linux)

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the development server
uvicorn app:app --reload
```

The API will be available at **http://127.0.0.1:8000**.  
Interactive docs (Swagger UI) at **http://127.0.0.1:8000/docs**.

---

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness check |
| `POST` | `/predict` | Single-sequence prediction |
| `POST` | `/predict-batch` | Batch prediction, ranked by risk |

---

## Usage examples

### GET /health

```bash
curl http://127.0.0.1:8000/health
```

**Response:**
```json
{ "status": "ok" }
```

---

### POST /predict — single sequence

```bash
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"sequence": "MSTKE...VKALA"}'
```

**Expected response (flagged isolate):**
```json
{
  "flag_probability": 0.87,
  "prediction": "flag",
  "mutated_positions": [553, 600],
  "reason": "Hotspot mutation(s) detected at position(s): 553, 600. These substitutions relative to the wild-type consensus are associated with reduced β-lactam susceptibility.",
  "note": "This tool is intended as a genomic screening aid only. Results must be confirmed by phenotypic antimicrobial susceptibility testing (AST) before any clinical or public-health decision is made."
}
```

**Expected response (safe isolate):**
```json
{
  "flag_probability": 0.04,
  "prediction": "safe",
  "mutated_positions": [],
  "reason": "No mutations detected at any of the 7 monitored hotspot positions (245, 553, 562, 593, 600, 601, 676). Sequence is consistent with the wild-type pbp2x profile.",
  "note": "..."
}
```

**Low-confidence response** (sequence too short or misaligned):
```json
{
  "flag_probability": null,
  "prediction": "low_confidence",
  "mutated_positions": [],
  "reason": "Sequence coverage too low (61.3% vs required 95% of reference length). The sequence may be truncated, misaligned, or from a different gene.",
  "note": "..."
}
```

---

### POST /predict-batch — multiple isolates

```bash
curl -X POST http://127.0.0.1:8000/predict-batch \
  -H "Content-Type: application/json" \
  -d '{
    "isolates": [
      {"id": "isolate_A", "sequence": "MSTKE...VKALA"},
      {"id": "isolate_B", "sequence": "MSTKE...VKALA"},
      {"id": "isolate_C", "sequence": "MSTKE...VKALA"}
    ]
  }'
```

**Expected response** (sorted highest risk → lowest):
```json
{
  "total": 3,
  "results": [
    {
      "id": "isolate_A",
      "flag_probability": 0.91,
      "prediction": "flag",
      "mutated_positions": [553, 562, 600],
      "reason": "...",
      "note": "..."
    },
    {
      "id": "isolate_C",
      "flag_probability": 0.54,
      "prediction": "flag",
      "mutated_positions": [676],
      "reason": "...",
      "note": "..."
    },
    {
      "id": "isolate_B",
      "flag_probability": 0.12,
      "prediction": "safe",
      "mutated_positions": [],
      "reason": "...",
      "note": "..."
    }
  ]
}
```

---

## Model bundle schema

The pickle at `model/pbp2x_flag_model.pkl` must deserialise to a `dict` with:

| Key | Type | Description |
|---|---|---|
| `model` | `sklearn.ensemble.RandomForestClassifier` | Trained classifier |
| `consensus_wt` | `dict[int, str]` | Position → wild-type amino acid |
| `hotspots` | `list[int]` | 7 positions: `[245, 553, 562, 593, 600, 601, 676]` |
| `feature_cols` | `list[str]` | Feature names e.g. `["pos_245_mut", ...]` |
| `ref_seq` | `str` | Reference pbp2x protein sequence |

---

## Alignment strategy

1. **Fast path** — if `len(query) == len(ref_seq)`, positions are indexed directly (no alignment overhead).  
2. **Slow path** — if lengths differ, a global pairwise alignment is performed using `Bio.Align.PairwiseAligner` with BLOSUM62, gap-open = −10, gap-extend = −0.5.  
3. **Coverage check** — if fewer than 95% of reference positions are covered by non-gap query residues, the result is returned as `"low_confidence"` with no probability score.

---

## Disclaimer

> **This tool is a genomic screening aid only.**  
> All predictions must be confirmed by phenotypic antimicrobial susceptibility
> testing (AST) before any clinical or public-health decision is made.
