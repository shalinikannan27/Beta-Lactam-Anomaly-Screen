"""
Streptococcus AMR Ranker — FastAPI Backend
==========================================
Provides REST API endpoints for antimicrobial resistance prediction
and personalized antibiotic ranking for Streptococcus species.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from schemas import PredictionRequest, PredictionResponse, HealthResponse
from ranking import AMRRanker

# ── Application setup ────────────────────────────────────────────────
app = FastAPI(
    title="Streptococcus AMR Ranker API",
    description=(
        "ML-based antimicrobial resistance prediction and personalized "
        "antibiotic ranking for Streptococcus pyogenes, pneumoniae, and agalactiae."
    ),
    version="1.0.0",
)

# CORS — allow frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Ranker singleton ─────────────────────────────────────────────────
ranker = AMRRanker()


# ── Routes ────────────────────────────────────────────────────────────
@app.get("/", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Return API health status and loaded model info."""
    return HealthResponse(
        status="healthy",
        models_loaded=ranker.loaded_models,
        version="1.0.0",
    )


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict(request: PredictionRequest):
    """
    Accept genomic resistance features and patient metadata,
    return a ranked list of antibiotics with susceptibility scores.
    """
    try:
        results = ranker.rank(request)
        return results
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction error: {exc}")
