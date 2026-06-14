"""
schemas.py — Pydantic models for request / response validation
===============================================================
"""

from typing import List, Optional
from pydantic import BaseModel, Field


# ── Request schemas ───────────────────────────────────────────────────
class PredictionRequest(BaseModel):
    """Input payload for the /predict endpoint."""

    species: str = Field(
        ...,
        description="Streptococcus species (e.g. 'pyogenes', 'pneumoniae', 'agalactiae')",
        examples=["pneumoniae"],
    )

    # Resistance gene indicators (0 or 1)
    ermB: int = Field(0, ge=0, le=1, description="ermB gene presence")
    ermA: int = Field(0, ge=0, le=1, description="ermA gene presence")
    mefA: int = Field(0, ge=0, le=1, description="mefA gene presence")
    tetM: int = Field(0, ge=0, le=1, description="tetM gene presence")
    tetO: int = Field(0, ge=0, le=1, description="tetO gene presence")
    pbp2x: int = Field(0, ge=0, le=1, description="pbp2x mutation")
    pbp1a: int = Field(0, ge=0, le=1, description="pbp1a mutation")
    pbp2b: int = Field(0, ge=0, le=1, description="pbp2b mutation")
    cat: int = Field(0, ge=0, le=1, description="cat gene presence")
    folA: int = Field(0, ge=0, le=1, description="folA mutation")
    folP: int = Field(0, ge=0, le=1, description="folP mutation")
    lnuA: int = Field(0, ge=0, le=1, description="lnuA gene presence")

    # Optional patient metadata
    patient_age: Optional[int] = Field(None, ge=0, le=120, description="Patient age")
    infection_site: Optional[str] = Field(None, description="Site of infection")

    def to_feature_vector(self) -> list:
        """Convert gene indicators to a flat feature list for model input."""
        return [
            self.ermB,
            self.ermA,
            self.mefA,
            self.tetM,
            self.tetO,
            self.pbp2x,
            self.pbp1a,
            self.pbp2b,
            self.cat,
            self.folA,
            self.folP,
            self.lnuA,
        ]


# ── Response schemas ──────────────────────────────────────────────────
class AntibioticResult(BaseModel):
    """Single antibiotic prediction result."""

    antibiotic: str = Field(..., description="Display name of the antibiotic")
    drug_key: str = Field(..., description="Internal model key")
    susceptibility_score: float = Field(
        ..., ge=0.0, le=1.0, description="Predicted susceptibility (1 = fully susceptible)"
    )
    resistant: bool = Field(..., description="True if predicted resistant")
    error: Optional[str] = Field(None, description="Error message if prediction failed")


class PredictionResponse(BaseModel):
    """Full ranked prediction response."""

    species: str
    ranked_antibiotics: List[AntibioticResult]
    total_evaluated: int


class HealthResponse(BaseModel):
    """Health-check response."""

    status: str
    models_loaded: List[str]
    version: str
