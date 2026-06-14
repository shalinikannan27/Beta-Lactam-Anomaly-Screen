"""
ranking.py — AMR Ranking Engine
================================
Loads per-antibiotic ML models and ranks antibiotics by predicted
susceptibility for a given set of genomic resistance features.
"""

import os
import pickle
from pathlib import Path
from typing import Dict, List

from schemas import PredictionRequest, PredictionResponse, AntibioticResult

# ── Configuration ─────────────────────────────────────────────────────
MODELS_DIR = Path(__file__).resolve().parent.parent / "models"

ANTIBIOTIC_NAMES: Dict[str, str] = {
    "amoxicillin": "Amoxicillin",
    "ceftriaxone": "Ceftriaxone",
    "clindamycin": "Clindamycin",
    "erythromycin": "Erythromycin",
    "meropenem": "Meropenem",
    "penicillin": "Penicillin",
    "tetracycline": "Tetracycline",
    "tmp_smx": "Trimethoprim-Sulfamethoxazole",
}


class AMRRanker:
    """Loads pickled models and provides a `.rank()` method."""

    def __init__(self, models_dir: Path = MODELS_DIR):
        self.models: Dict[str, object] = {}
        self.loaded_models: List[str] = []
        self._load_models(models_dir)

    # ── Model loading ─────────────────────────────────────────────────
    def _load_models(self, models_dir: Path) -> None:
        """Discover and load all model_*.pkl files."""
        if not models_dir.exists():
            print(f"⚠  Models directory not found: {models_dir}")
            return

        for pkl_file in sorted(models_dir.glob("model_*.pkl")):
            drug_key = pkl_file.stem.replace("model_", "")
            try:
                with open(pkl_file, "rb") as fh:
                    self.models[drug_key] = pickle.load(fh)
                self.loaded_models.append(drug_key)
                print(f"✓  Loaded model: {drug_key}")
            except Exception as exc:
                print(f"✗  Failed to load {pkl_file.name}: {exc}")

        print(f"   Total models loaded: {len(self.models)}/{len(ANTIBIOTIC_NAMES)}")

    # ── Prediction & ranking ──────────────────────────────────────────
    def rank(self, request: PredictionRequest) -> PredictionResponse:
        """
        Run each loaded model against the input features and return
        antibiotics ranked from most to least effective.
        """
        if not self.models:
            raise ValueError("No models are loaded. Check the models/ directory.")

        features = request.to_feature_vector()
        results: List[AntibioticResult] = []

        for drug_key, model in self.models.items():
            try:
                # Most sklearn models expose predict_proba
                if hasattr(model, "predict_proba"):
                    proba = model.predict_proba([features])[0]
                    # Susceptible class probability (index 0 = susceptible)
                    susceptibility_score = float(proba[0])
                    resistant = bool(proba[0] < 0.5)
                else:
                    pred = model.predict([features])[0]
                    susceptibility_score = 1.0 - float(pred)
                    resistant = bool(pred >= 0.5)

                results.append(
                    AntibioticResult(
                        antibiotic=ANTIBIOTIC_NAMES.get(drug_key, drug_key),
                        drug_key=drug_key,
                        susceptibility_score=round(susceptibility_score, 4),
                        resistant=resistant,
                    )
                )
            except Exception as exc:
                print(f"⚠  Prediction failed for {drug_key}: {exc}")
                results.append(
                    AntibioticResult(
                        antibiotic=ANTIBIOTIC_NAMES.get(drug_key, drug_key),
                        drug_key=drug_key,
                        susceptibility_score=0.0,
                        resistant=True,
                        error=str(exc),
                    )
                )

        # Sort by susceptibility score descending (most effective first)
        results.sort(key=lambda r: r.susceptibility_score, reverse=True)

        return PredictionResponse(
            species=request.species,
            ranked_antibiotics=results,
            total_evaluated=len(results),
        )
