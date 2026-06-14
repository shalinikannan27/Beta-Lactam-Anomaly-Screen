from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from schemas import PredictRequest, PredictResponse
from ranking import rank_antibiotics

app = FastAPI(title="AMR Atlas API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    gene_input = {
        'gene_mef(a)': req.genes.gene_mef_a,
        'gene_msr(d)': req.genes.gene_msr_d,
        'gene_erm(b)': req.genes.gene_erm_b,
        'gene_tet(m)': req.genes.gene_tet_m,
        'gene_pbp2b':  req.genes.gene_pbp2b,
        'gene_pbp2x':  req.genes.gene_pbp2x,
        'gene_pbp1a':  req.genes.gene_pbp1a,
    }

    results = rank_antibiotics(
        gene_input=gene_input,
        species=req.species,
        iso_type=req.iso_type,
        country=req.country,
        year=req.year,
        allergies=req.allergies,
        infection_site=req.infection_site,
        pregnant=req.pregnant,
        age_group=req.age_group,
    )

    return {"results": results}