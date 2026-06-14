"""
schemas.py — Pydantic models for request / response validation
===============================================================
"""

from typing import List, Optional
from pydantic import BaseModel, Field


# ── Gene input (nested inside PredictRequest) ────────────────────────
class GeneInput(BaseModel):
    """Binary indicators for resistance gene presence."""

    gene_mef_a: int = Field(0, ge=0, le=1, description="mef(A) gene presence")
    gene_msr_d: int = Field(0, ge=0, le=1, description="msr(D) gene presence")
    gene_erm_b: int = Field(0, ge=0, le=1, description="erm(B) gene presence")
    gene_tet_m: int = Field(0, ge=0, le=1, description="tet(M) gene presence")
    gene_pbp2b: int = Field(0, ge=0, le=1, description="pbp2b mutation")
    gene_pbp2x: int = Field(0, ge=0, le=1, description="pbp2x mutation")
    gene_pbp1a: int = Field(0, ge=0, le=1, description="pbp1a mutation")


# ── Request schema ────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    """Input payload for the /predict endpoint."""

    genes: GeneInput = Field(default_factory=GeneInput, description="Resistance gene indicators")
    species: str = Field(
        ...,
        description="Streptococcus species (pyogenes, pneumoniae, agalactiae)",
        examples=["pneumoniae"],
    )
    iso_type: str = Field("clinical", description="Isolate type (clinical / unknown)")
    country: str = Field("USA", description="Country of origin (Brazil, Canada, USA, other, unknown)")
    year: int = Field(2024, ge=2000, le=2026, description="Collection year")
    allergies: List[str] = Field(
        default_factory=list,
        description="Patient allergy groups (penicillin, macrolide, clindamycin, cephalosporin, carbapenem, sulfa)",
    )
    infection_site: str = Field("other", description="Infection site (throat, blood, skin, neonatal, other)")
    pregnant: bool = Field(False, description="Is the patient pregnant?")
    age_group: str = Field("adult", description="Age group (adult, pediatric, neonatal)")


# ── Response schemas ──────────────────────────────────────────────────
class AntibioticRankResult(BaseModel):
    """Single antibiotic ranking result."""

    rank: int
    antibiotic: str
    resistance_pct: float
    effectiveness_pct: float
    final_score: float
    recommendation: str


class PredictResponse(BaseModel):
    """Full ranked prediction response."""

    results: List[AntibioticRankResult]
