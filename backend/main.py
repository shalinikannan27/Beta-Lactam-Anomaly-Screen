from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from schemas import PredictRequest, PredictResponse, ReportRequest
from ranking import rank_antibiotics
from report import generate_report_pdf
from explain import generate_explanations
import io

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

@app.post("/report")
def report(req: ReportRequest):
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

    explanations = generate_explanations(
        gene_input=gene_input,
        ranking_results=results,
        allergies=req.allergies,
        pregnant=req.pregnant,
        age_group=req.age_group,
        infection_site=req.infection_site,
    )

    patient_info = {
        'patient_id': req.patient_id,
        'age': req.patient_age,
        'sex': req.sex,
        'weight_kg': req.weight_kg,
        'pregnant': req.pregnant,
        'age_group': req.age_group,
        'comorbidities': req.comorbidities,
        'allergies': req.allergies,
        'infection_site': req.infection_site,
    }
    isolate_info = {
        'species': req.species,
        'iso_type': req.iso_type,
        'country': req.country,
        'year': req.year,
    }

    pdf_bytes = generate_report_pdf(patient_info, isolate_info, gene_input, results, explanations)

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=amr_report.pdf"}
    )