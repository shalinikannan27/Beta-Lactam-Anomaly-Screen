"""
S. pyogenes Ranker — FastAPI Backend
Predicts reduced β-lactam susceptibility risk from a pbp2x protein sequence
using a pre-trained Isolation Forest model.
"""

import pickle
import logging
from pathlib import Path
from typing import List, Optional

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, field_validator

from Bio import Align
from Bio.Align import substitution_matrices

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Load model bundle at startup
# ---------------------------------------------------------------------------
MODEL_PATH = Path(__file__).parent / "model" / "pbp2x_flag_model.pkl"

_bundle: dict = {}


def _load_model() -> None:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model file not found at {MODEL_PATH.resolve()}")

    with open(MODEL_PATH, "rb") as fh:
        bundle = pickle.load(fh)

    required_keys = {"model", "model_type", "consensus_wt", "hotspots", "feature_cols", "ref_seq"}
    missing = required_keys - bundle.keys()
    if missing:
        raise ValueError(f"Pickle is missing required keys: {missing}")

    if bundle.get("model_type") != "isolation_forest":
        logger.warning(
            "model_type is '%s', expected 'isolation_forest'. Proceeding anyway.",
            bundle.get("model_type"),
        )

    _bundle.update(bundle)
    logger.info(
        "Model loaded OK. Type: %s | Hotspot positions: %s",
        _bundle.get("model_type"),
        _bundle["hotspots"],
    )


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(
    title="S. pyogenes Ranker API",
    description=(
        "Predicts reduced β-lactam susceptibility risk in Streptococcus pyogenes "
        "isolates by analysing hotspot mutations in the pbp2x protein sequence."
    ),
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event() -> None:
    _load_model()


# ---------------------------------------------------------------------------
# Serve frontend static files
# ---------------------------------------------------------------------------
_FRONTEND_DIR = Path(__file__).parent.parent / "frontend"

if _FRONTEND_DIR.is_dir():
    # Serve the frontend at /app so API routes aren't shadowed
    app.mount("/app", StaticFiles(directory=str(_FRONTEND_DIR), html=True), name="frontend")
    logger.info("Frontend served at /app  (dir: %s)", _FRONTEND_DIR)
else:
    logger.warning("Frontend directory not found at %s — static serving disabled.", _FRONTEND_DIR)


@app.get("/", include_in_schema=False)
def root_redirect():
    """Redirect root to the frontend app."""
    return RedirectResponse(url="/app/index.html")


# ---------------------------------------------------------------------------
# Pairwise alignment helpers
# ---------------------------------------------------------------------------
IDENTITY_THRESHOLD = 0.90   # reject if < 90% sequence identity to ref
COVERAGE_THRESHOLD = 0.95   # reject if < 95% of ref_seq positions are covered


def _build_aligner() -> Align.PairwiseAligner:
    aligner = Align.PairwiseAligner()
    aligner.substitution_matrix = substitution_matrices.load("BLOSUM62")
    aligner.open_gap_score = -10
    aligner.extend_gap_score = -0.5
    aligner.mode = "global"
    return aligner


_aligner = _build_aligner()


def _parse_alignment_strings(alignment) -> tuple:
    """
    Extract the gapped target (ref) and query strings from a PairwiseAlignment.
    Supports both modern Biopython (1.80+) and older versions.
    """
    try:
        ref_aligned = str(alignment[0])
        qry_aligned = str(alignment[1])
        if ref_aligned and qry_aligned:
            return ref_aligned, qry_aligned
    except Exception:
        pass

    fasta_text = alignment.format("fasta")
    seqs: List[str] = []
    current: List[str] = []
    for line in fasta_text.splitlines():
        if line.startswith(">"):
            if current:
                seqs.append("".join(current))
                current = []
        else:
            current.append(line.strip())
    if current:
        seqs.append("".join(current))

    if len(seqs) < 2:
        raise ValueError("Could not parse alignment strings from PairwiseAligner output.")
    return seqs[0], seqs[1]


def _compute_percent_identity(ref_aligned: str, qry_aligned: str) -> float:
    """
    Compute percent identity over aligned columns where neither position is a gap.
    Returns a fraction in [0, 1].
    """
    matches = 0
    comparable = 0
    for r, q in zip(ref_aligned, qry_aligned):
        if r != "-" and q != "-":
            comparable += 1
            if r == q:
                matches += 1
    if comparable == 0:
        return 0.0
    return matches / comparable


def _classify_mutation_type(ref_char: str, qry_char: str, ref_aligned: str, qry_aligned: str, ref_pos: int) -> str:
    """
    Classify a hotspot deviation as one of:
      'point_mutation'      — simple residue substitution, no gap at this position
      'deletion'            — query has a gap '-' at a ref position
      'insertion'           — ref has a gap immediately adjacent downstream
      'frameshift_indicator'— gap pattern disrupts reading frame downstream

    This is a heuristic based on the alignment columns around the position.
    """
    # If the query residue itself is a gap → deletion in query
    if qry_char == "-":
        # Check if there are consecutive gaps nearby (frameshift heuristic)
        # Find this position in the full alignment and scan ±3 columns
        aln_positions = []
        r_count = 0
        for i, (r, q) in enumerate(zip(ref_aligned, qry_aligned)):
            if r != "-":
                r_count += 1
            if r_count == ref_pos:
                center = i
                break
        else:
            return "deletion"

        window = qry_aligned[max(0, center - 3): center + 4]
        gap_run = sum(1 for c in window if c == "-")
        if gap_run >= 3:
            return "frameshift_indicator"
        return "deletion"

    # Check if the ref has a gap right after this position (insertion in query)
    # Walk through the alignment to find where this ref_pos lands
    r_count = 0
    for i, (r, q) in enumerate(zip(ref_aligned, qry_aligned)):
        if r != "-":
            r_count += 1
        if r_count == ref_pos:
            # Look at the very next column
            if i + 1 < len(ref_aligned) and ref_aligned[i + 1] == "-":
                return "insertion"
            break

    # Default: simple point mutation (residue substitution, no gap)
    return "point_mutation"


def _extract_hotspot_residues_full(query_seq: str) -> tuple:
    """
    Return (residues_at_hotspots: dict[int, str], coverage_fraction: float,
            percent_identity: float, ref_aligned: str, qry_aligned: str).

    Fast path — direct indexing when len(query) == len(ref).
    Slow path — global pairwise alignment with BLOSUM62.
    """
    ref_seq: str = _bundle["ref_seq"]
    hotspots: List[int] = _bundle["hotspots"]  # 1-based positions

    if len(query_seq) == len(ref_seq):
        # Fast path: same length, index directly
        residues = {pos: query_seq[pos - 1] for pos in hotspots}
        # Compute identity over entire sequence (same length → no gaps)
        matches = sum(1 for r, q in zip(ref_seq, query_seq) if r == q)
        identity = matches / len(ref_seq)
        # Build trivial aligned strings (no gaps) for type classification
        return residues, 1.0, identity, ref_seq, query_seq

    # Slow path: alignment
    alignments = _aligner.align(ref_seq, query_seq)
    best = next(iter(alignments))

    ref_aligned, qry_aligned = _parse_alignment_strings(best)

    # Coverage: ref positions that align to a non-gap query residue
    non_gap = sum(
        1 for r, q in zip(ref_aligned, qry_aligned) if r != "-" and q != "-"
    )
    coverage = non_gap / len(ref_seq)
    identity = _compute_percent_identity(ref_aligned, qry_aligned)

    # Map 1-based reference position → query character (possibly a gap "-")
    residues: dict = {}
    ref_pos = 0
    for r_char, q_char in zip(ref_aligned, qry_aligned):
        if r_char != "-":
            ref_pos += 1  # now 1-based
            if ref_pos in hotspots:
                residues[ref_pos] = q_char

    return residues, coverage, identity, ref_aligned, qry_aligned


# ---------------------------------------------------------------------------
# Mutation description helpers
# ---------------------------------------------------------------------------
_AA_NAMES = {
    "A": "Alanine", "R": "Arginine", "N": "Asparagine", "D": "Aspartate",
    "C": "Cysteine", "Q": "Glutamine", "E": "Glutamate", "G": "Glycine",
    "H": "Histidine", "I": "Isoleucine", "L": "Leucine", "K": "Lysine",
    "M": "Methionine", "F": "Phenylalanine", "P": "Proline", "S": "Serine",
    "T": "Threonine", "W": "Tryptophan", "Y": "Tyrosine", "V": "Valine",
    "-": "deletion/gap", "X": "unknown",
}

_AA_PROPERTIES = {
    "A": "small nonpolar", "R": "positively charged (basic)", "N": "polar uncharged",
    "D": "negatively charged (acidic)", "C": "polar (thiol)", "Q": "polar uncharged",
    "E": "negatively charged (acidic)", "G": "smallest, flexible", "H": "positively charged at low pH",
    "I": "hydrophobic", "L": "hydrophobic", "K": "positively charged (basic)",
    "M": "hydrophobic (sulfur-containing)", "F": "aromatic hydrophobic", "P": "rigid cyclic",
    "S": "small polar (hydroxyl)", "T": "polar (hydroxyl)", "W": "aromatic polar",
    "Y": "aromatic polar (hydroxyl)", "V": "hydrophobic branched", "-": "gap", "X": "unknown",
}


def _build_mutation_explanation(wt: str, obs: str, pos: int, mut_type: str) -> str:
    """
    Generate a 4–5 line detailed explanation of a hotspot mutation.
    """
    wt_name  = _AA_NAMES.get(wt, wt)
    obs_name = _AA_NAMES.get(obs, obs)
    wt_prop  = _AA_PROPERTIES.get(wt, "")
    obs_prop = _AA_PROPERTIES.get(obs, "")
    notation = f"{wt}{pos}{obs}"

    if mut_type == "deletion":
        return (
            f"Position {pos} ({notation}): The wild-type residue {wt_name} ({wt}) has been deleted in this isolate. "
            f"Deletions at PBP2x hotspot positions disrupt the local backbone geometry of the penicillin-binding domain, "
            f"which can significantly reduce β-lactam antibiotic binding affinity. "
            f"Loss of {wt_name} at this site may alter the shape of the active site pocket, "
            f"compromising the structural constraints required for antibiotic recognition and covalent acylation."
        )
    if mut_type in ("insertion", "frameshift_indicator"):
        return (
            f"Position {pos} ({notation}): An insertion or frameshift-type gap pattern is detected near this hotspot. "
            f"The wild-type {wt_name} ({wt}) appears displaced or replaced by {obs_name} ({obs}). "
            f"Insertions near the transpeptidase active site of PBP2x can shift the reading frame of downstream residues, "
            f"altering the geometry of the β-lactam binding cleft and potentially conferring high-level resistance. "
            f"This type of structural perturbation is particularly concerning in a surveillance context."
        )
    # point_mutation (default)
    return (
        f"Position {pos} ({notation}): The wild-type {wt_name} ({wt}, {wt_prop}) is substituted by "
        f"{obs_name} ({obs}, {obs_prop}). "
        f"This position is a confirmed hotspot in the transpeptidase domain of PBP2x in S. pyogenes. "
        f"The change from {wt_name} to {obs_name} alters the local physicochemical environment of the active site: "
        f"the difference in size, charge, and hydrogen-bonding capacity between {wt} and {obs} perturbs the "
        f"precise binding geometry required for β-lactam acylation. "
        f"Surveillance data links mutations at this position with reduced penicillin/amoxicillin susceptibility "
        f"and warrants confirmatory phenotypic AST."
    )


# ---------------------------------------------------------------------------
# Core prediction logic
# ---------------------------------------------------------------------------
DISCLAIMER = (
    "This tool is intended as a genomic screening aid only. "
    "Results must be confirmed by phenotypic antimicrobial susceptibility testing (AST) "
    "before any clinical or public-health decision is made."
)


def _predict_single(sequence: str, isolate_id: str = "input") -> dict:
    """Run the full prediction pipeline for one protein sequence.

    Returns a dict with keys:
      isolate_id, status, mutations, reasons, rejection_reason
    """
    sequence = sequence.strip().upper()
    if not sequence:
        raise ValueError("Sequence must not be empty.")

    ref_seq: str = _bundle["ref_seq"]

    # ------------------------------------------------------------------
    # Step 1 — Align and check percent identity (species safeguard)
    # ------------------------------------------------------------------
    try:
        residues, coverage, identity, ref_aligned, qry_aligned = _extract_hotspot_residues_full(sequence)
    except StopIteration:
        raise ValueError(
            "Pairwise alignment produced no results. "
            "Verify the sequence is a valid pbp2x protein sequence."
        )

    if identity < IDENTITY_THRESHOLD:
        return {
            "isolate_id": isolate_id,
            "status": "rejected",
            "mutations": [],
            "reasons": [],
            "rejection_reason": (
                f"Input sequence does not match the expected S. pyogenes pbp2x gene "
                f"({identity * 100:.1f}% identity to reference, minimum "
                f"{IDENTITY_THRESHOLD * 100:.0f}% required). "
                "Please verify the species and gene target before re-submitting."
            ),
        }

    # ------------------------------------------------------------------
    # Step 2 — Coverage check (secondary filter, after identity)
    # ------------------------------------------------------------------
    if coverage < COVERAGE_THRESHOLD:
        return {
            "isolate_id": isolate_id,
            "status": "rejected",
            "mutations": [],
            "reasons": [],
            "rejection_reason": (
                f"Sequence coverage too low ({coverage * 100:.1f}% vs required "
                f"{COVERAGE_THRESHOLD * 100:.0f}% of reference length). "
                "The sequence may be truncated, misaligned, or from a different gene."
            ),
        }

    # ------------------------------------------------------------------
    # Step 3 — Build feature vector and detect hotspot deviations
    # ------------------------------------------------------------------
    consensus_wt: dict = _bundle["consensus_wt"]
    hotspots: List[int] = _bundle["hotspots"]
    feature_cols: List[str] = _bundle["feature_cols"]
    model = _bundle["model"]

    feature_vector: List[int] = []
    mutations: List[dict] = []

    for pos in hotspots:
        query_aa = residues.get(pos, "-")
        wt_aa = consensus_wt.get(pos, "?")
        is_deviated = 1 if (query_aa != wt_aa and query_aa not in ("X",)) else 0
        feature_vector.append(is_deviated)

    # Append the 'any_hotspot_mut' feature if the model was trained with it
    any_mut = 1 if any(feature_vector) else 0
    if len(feature_cols) == len(feature_vector) + 1 and feature_cols[-1] == "any_hotspot_mut":
        feature_vector.append(any_mut)

    # Rebuild mutations list separately (after full feature vector is assembled)
    for i, pos in enumerate(hotspots):
        query_aa = residues.get(pos, "-")
        wt_aa = consensus_wt.get(pos, "?")
        is_deviated = 1 if (query_aa != wt_aa and query_aa not in ("X",)) else 0

        if is_deviated:
            # Substitution notation
            substitution = f"{wt_aa}{pos}{query_aa}"

            # Mutation type classification
            mut_type = _classify_mutation_type(
                ref_char=wt_aa,
                qry_char=query_aa,
                ref_aligned=ref_aligned,
                qry_aligned=qry_aligned,
                ref_pos=pos,
            )

            # Detailed explanation
            explanation = _build_mutation_explanation(wt_aa, query_aa, pos, mut_type)

            mutations.append({
                "position": pos,
                "substitution": substitution,
                "type": mut_type,
                "explanation": explanation,
            })

    # ------------------------------------------------------------------
    # Step 4 — Isolation Forest inference
    # ------------------------------------------------------------------
    X = np.array([feature_vector])
    raw_prediction = int(model.predict(X)[0])   # -1 = anomaly, 1 = normal
    # score_samples() is used only internally for ordering; never exposed
    anomaly_score = float(model.score_samples(X)[0])

    status = "flagged" if raw_prediction == -1 else "safe"

    # ------------------------------------------------------------------
    # Step 5 — Human-readable reasons
    # ------------------------------------------------------------------
    reasons: List[str] = []
    if status == "flagged":
        if mutations:
            subs = ", ".join(m["substitution"] for m in mutations)
            reasons.append(
                f"Hotspot mutation(s) detected: {subs}. "
                "These substitutions at monitored pbp2x positions are associated with "
                "reduced β-lactam susceptibility in S. pyogenes surveillance isolates."
            )
        else:
            # Isolation Forest flagged but no single-position deviation — unusual pattern
            reasons.append(
                "The overall mutation profile at the 7 monitored hotspot positions is "
                "unusual compared to known wild-type and susceptible reference sequences, "
                "triggering an anomaly flag. No single canonical substitution was detected, "
                "but the combined pattern warrants confirmatory phenotypic testing."
            )
        reasons.append(DISCLAIMER)
    else:
        reasons.append(
            f"No deviations detected at any of the {len(hotspots)} monitored hotspot positions "
            f"({', '.join(str(p) for p in hotspots)}). "
            "Sequence is consistent with the wild-type pbp2x consensus profile for S. pyogenes."
        )
        reasons.append(DISCLAIMER)

    return {
        "isolate_id": isolate_id,
        "status": status,
        "mutations": mutations,
        "reasons": reasons,
        "rejection_reason": None,
    }


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------
class PredictRequest(BaseModel):
    sequence: str

    @field_validator("sequence")
    @classmethod
    def must_not_be_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("sequence must not be empty")
        return v


class BatchIsolate(BaseModel):
    id: str
    sequence: str


class BatchRequest(BaseModel):
    isolates: List[BatchIsolate]

    @field_validator("isolates")
    @classmethod
    def must_have_items(cls, v: list) -> list:
        if not v:
            raise ValueError("isolates list must not be empty")
        return v


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health", tags=["Utility"], summary="Liveness check")
def health_check():
    """Returns 200 OK when the service is running."""
    return {"status": "ok"}


@app.post("/predict", tags=["Prediction"], summary="Single-sequence prediction")
def predict(request: PredictRequest):
    """
    Predict β-lactam susceptibility risk for a **single** pbp2x protein sequence.

    | Field | Description |
    |---|---|
    | `isolate_id` | Echo of the sequence identifier |
    | `status` | `"flagged"` · `"safe"` · `"rejected"` |
    | `mutations` | List of `{position, substitution, type, explanation}` dicts |
    | `reasons` | List of plain-English explanation strings |
    | `rejection_reason` | Non-null only when `status == "rejected"` |
    """
    if not _bundle:
        raise HTTPException(status_code=503, detail="Model not loaded yet.")
    try:
        return _predict_single(request.sequence, isolate_id="input")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@app.post("/predict-batch", tags=["Prediction"], summary="Batch prediction (ranked)")
def predict_batch(request: BatchRequest):
    """
    Predict β-lactam susceptibility risk for a **batch** of isolates.

    Accepts `{"isolates": [{"id": "...", "sequence": "..."}]}` and returns results
    sorted so that **flagged** isolates appear first, then safe, then rejected.
    """
    if not _bundle:
        raise HTTPException(status_code=503, detail="Model not loaded yet.")

    results = []
    for isolate in request.isolates:
        try:
            res = _predict_single(isolate.sequence, isolate_id=isolate.id)
        except ValueError as exc:
            res = {
                "isolate_id": isolate.id,
                "status": "rejected",
                "mutations": [],
                "reasons": [],
                "rejection_reason": str(exc),
            }
        results.append(res)

    # Sort: flagged first, then safe, then rejected/error
    _order = {"flagged": 0, "safe": 1, "rejected": 2}
    results.sort(key=lambda r: _order.get(r.get("status", "rejected"), 2))

    return {"results": results, "total": len(results)}
