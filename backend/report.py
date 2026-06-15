from fpdf import FPDF
from datetime import datetime

DRUG_CLASSES = {
    'amoxicillin': 'Beta-lactam (Penicillin)',
    'penicillin': 'Beta-lactam (Penicillin)',
    'ceftriaxone': 'Cephalosporin',
    'meropenem': 'Carbapenem',
    'clindamycin': 'Lincosamide',
    'erythromycin': 'Macrolide',
    'tetracycline': 'Tetracycline',
    'tmp_smx': 'Sulfonamide',
}

REC_COLORS = {
    'Recommended': (198, 239, 206),
    'Use with Caution': (255, 235, 156),
    'Not Recommended': (255, 199, 206),
    'Contraindicated (Allergy)': (255, 199, 206),
    'Contraindicated (Pregnancy)': (255, 199, 206),
    'Contraindicated (Pediatric)': (255, 199, 206),
}


class ReportPDF(FPDF):
    def header(self):
        self.set_font('Helvetica', 'B', 14)
        self.cell(0, 10, 'AMR Ranker - Antibiotic Resistance Report', align='C', new_x="LMARGIN", new_y="NEXT")
        self.set_font('Helvetica', '', 9)
        self.set_text_color(120, 120, 120)
        self.cell(0, 6, 'Research and Educational Use Only - Not for Clinical Decision-Making', align='C', new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(0, 0, 0)
        self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f'Page {self.page_no()}', align='C')


def section_title(pdf, text):
    pdf.set_font('Helvetica', 'B', 12)
    pdf.set_fill_color(230, 230, 230)
    pdf.cell(0, 8, text, fill=True, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)


def kv_row(pdf, key, value):
    pdf.set_font('Helvetica', 'B', 10)
    pdf.cell(50, 7, key)
    pdf.set_font('Helvetica', '', 10)
    pdf.cell(0, 7, str(value), new_x="LMARGIN", new_y="NEXT")


def generate_report_pdf(patient_info, isolate_info, gene_input, ranking_results, explanations):
    pdf = ReportPDF()
    pdf.add_page()

    pdf.set_font('Helvetica', '', 9)
    pdf.cell(0, 6, f"Report generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    section_title(pdf, "Patient Information")
    kv_row(pdf, "Patient ID", patient_info.get('patient_id', 'Anonymous'))
    kv_row(pdf, "Age", patient_info.get('age', 'N/A'))
    kv_row(pdf, "Sex", patient_info.get('sex', 'N/A'))
    kv_row(pdf, "Weight (kg)", patient_info.get('weight_kg', 'N/A'))
    kv_row(pdf, "Pregnant", "Yes" if patient_info.get('pregnant') else "No")
    kv_row(pdf, "Age Group", str(patient_info.get('age_group', 'adult')).capitalize())
    comorb = patient_info.get('comorbidities', [])
    kv_row(pdf, "Comorbidities", ", ".join(comorb) if comorb else "None reported")
    allergies = patient_info.get('allergies', [])
    kv_row(pdf, "Known Allergies", ", ".join(allergies) if allergies else "None reported")
    kv_row(pdf, "Infection Site", str(patient_info.get('infection_site', 'N/A')).capitalize())
    pdf.ln(4)

    section_title(pdf, "Isolate Information")
    kv_row(pdf, "Species", f"Streptococcus {isolate_info.get('species','')}")
    kv_row(pdf, "Isolation Type", str(isolate_info.get('iso_type','')).capitalize())
    kv_row(pdf, "Country", isolate_info.get('country',''))
    kv_row(pdf, "Collection Year", isolate_info.get('year',''))
    pdf.ln(2)

    pdf.set_font('Helvetica', 'B', 10)
    pdf.cell(0, 7, "Detected Resistance Genes:", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font('Helvetica', '', 10)
    detected = [g for g, v in gene_input.items() if v == 1]
    pdf.cell(0, 7, ", ".join(detected) if detected else "None detected", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    section_title(pdf, "Ranked Antibiotic Recommendations")

    col_widths = [12, 32, 40, 24, 24, 20, 38]
    headers = ["Rank", "Antibiotic", "Drug Class", "Resist. %", "Effect. %", "Score", "Recommendation"]

    pdf.set_font('Helvetica', 'B', 9)
    pdf.set_fill_color(70, 70, 70)
    pdf.set_text_color(255, 255, 255)
    for w, h in zip(col_widths, headers):
        pdf.cell(w, 8, h, border=1, fill=True, align='C')
    pdf.ln()

    pdf.set_text_color(0, 0, 0)
    pdf.set_font('Helvetica', '', 9)
    for row in ranking_results:
        color = REC_COLORS.get(row['recommendation'], (255, 255, 255))
        pdf.set_fill_color(*color)
        pdf.cell(col_widths[0], 8, str(row['rank']), border=1, align='C', fill=True)
        pdf.cell(col_widths[1], 8, row['antibiotic'].capitalize(), border=1, fill=True)
        pdf.cell(col_widths[2], 8, DRUG_CLASSES.get(row['antibiotic'], ''), border=1, fill=True)
        pdf.cell(col_widths[3], 8, f"{row['resistance_pct']}%", border=1, align='C', fill=True)
        pdf.cell(col_widths[4], 8, f"{row['effectiveness_pct']}%", border=1, align='C', fill=True)
        pdf.cell(col_widths[5], 8, f"{row['final_score']:.2f}", border=1, align='C', fill=True)
        pdf.cell(col_widths[6], 8, row['recommendation'], border=1, fill=True)
        pdf.ln()

    pdf.add_page()
    section_title(pdf, "Patient-Specific Ranking Details")
    for row in ranking_results:
        ab = row['antibiotic']
        color = REC_COLORS.get(row['recommendation'], (255, 255, 255))
        pdf.set_fill_color(*color)
        pdf.set_font('Helvetica', 'B', 9)
        pdf.cell(0, 6, f"#{row['rank']}  {ab.capitalize()} - {row['recommendation']}", fill=True, new_x="LMARGIN", new_y="NEXT")
        pdf.set_font('Helvetica', '', 8)
        pdf.multi_cell(0, 4.5, explanations.get(ab, ''))
        pdf.ln(1)

    pdf.add_page()
    section_title(pdf, "Disclaimer")
    pdf.set_font('Helvetica', '', 10)
    disclaimer_text = (
        "This report is generated for research and educational purposes only. It is not a "
        "substitute for clinical diagnosis, laboratory antimicrobial susceptibility testing, "
        "or professional medical advice. Predictions are based on a research dataset and "
        "machine learning models that have not been validated for clinical use. Always consult "
        "a qualified healthcare professional and confirmed laboratory AST results before making "
        "treatment decisions. No patient data is stored - all inputs are processed in real time "
        "and discarded."
    )
    pdf.multi_cell(0, 6, disclaimer_text)

    return bytes(pdf.output())
