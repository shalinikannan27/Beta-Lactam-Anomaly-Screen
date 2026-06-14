import pandas as pd
import joblib
import os

FEATURE_COLS = [
    'gene_mef(a)', 'gene_msr(d)', 'gene_erm(b)', 'gene_tet(m)',
    'gene_pbp2b', 'gene_pbp2x', 'gene_pbp1a',
    'species_agalactiae', 'species_pneumoniae', 'species_pyogenes',
    'iso_type_clinical', 'iso_type_unknown',
    'country_Brazil', 'country_Canada', 'country_USA',
    'country_other', 'country_unknown',
    'collection_year'
]

ANTIBIOTICS = ['amoxicillin', 'ceftriaxone', 'clindamycin', 'erythromycin',
               'meropenem', 'penicillin', 'tetracycline', 'tmp_smx']

MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')

MODELS = {}
for ab in ANTIBIOTICS:
    MODELS[ab] = joblib.load(os.path.join(MODELS_DIR, f'model_{ab}.pkl'))

ALLERGY_GROUPS = {
    'penicillin'    : ['penicillin', 'amoxicillin'],
    'macrolide'     : ['erythromycin'],
    'clindamycin'   : ['clindamycin'],
    'cephalosporin' : ['ceftriaxone'],
    'carbapenem'    : ['meropenem'],
    'sulfa'         : ['tmp_smx'],
}

SITE_PREFERENCE = {
    'throat': {
        'preferred'    : ['penicillin', 'amoxicillin'],
        'non_preferred': ['meropenem', 'ceftriaxone'],
    },
    'blood': {
        'preferred'    : ['clindamycin', 'penicillin', 'meropenem'],
        'non_preferred': ['tmp_smx', 'tetracycline'],
    },
    'skin': {
        'preferred'    : ['clindamycin', 'penicillin', 'amoxicillin'],
        'non_preferred': ['tmp_smx', 'tetracycline'],
    },
    'neonatal': {
        'preferred'    : ['penicillin', 'amoxicillin', 'clindamycin'],
        'non_preferred': ['tetracycline', 'tmp_smx'],
    },
    'other': {
        'preferred'    : [],
        'non_preferred': [],
    }
}

PREGNANCY_EXCLUSIONS = ['tetracycline', 'tmp_smx']
PEDIATRIC_EXCLUSIONS = ['tetracycline']


def rank_antibiotics(gene_input, species, iso_type, country, year,
                     allergies, infection_site, pregnant=False, age_group='adult'):

    row = {}
    for gene in ['gene_mef(a)', 'gene_msr(d)', 'gene_erm(b)', 'gene_tet(m)',
                 'gene_pbp2b', 'gene_pbp2x', 'gene_pbp1a']:
        row[gene] = gene_input.get(gene, 0)

    row['species_agalactiae'] = 1 if species == 'agalactiae' else 0
    row['species_pneumoniae'] = 1 if species == 'pneumoniae' else 0
    row['species_pyogenes']   = 1 if species == 'pyogenes'   else 0

    row['iso_type_clinical'] = 1 if iso_type == 'clinical' else 0
    row['iso_type_unknown']  = 1 if iso_type == 'unknown'  else 0

    for c in ['Brazil', 'Canada', 'USA', 'other', 'unknown']:
        row[f'country_{c}'] = 1 if country == c else 0

    row['collection_year'] = int((year - 2000) / (2025 - 2000) * 25)

    X_new = pd.DataFrame([row])[FEATURE_COLS].values.astype(float)

    results = []
    for ab, model in MODELS.items():
        p_resistant = float(model.predict_proba(X_new)[0][1])
        effectiveness = round(1 - p_resistant, 4)
        results.append({'antibiotic': ab,
                        'p_resistant': round(p_resistant, 4),
                        'effectiveness': effectiveness})

    df_rank = pd.DataFrame(results)

    excluded = set()
    for allergy in allergies:
        excluded.update(ALLERGY_GROUPS.get(allergy, []))

    if pregnant:
        excluded.update(PREGNANCY_EXCLUSIONS)

    if age_group == 'pediatric':
        excluded.update(PEDIATRIC_EXCLUSIONS)

    site_prefs = SITE_PREFERENCE.get(infection_site, SITE_PREFERENCE['other'])

    def compute_final_score(row):
        ab = row['antibiotic']
        if ab in excluded:
            return 0.0
        score = row['effectiveness']
        if ab in site_prefs['preferred']:
            score *= 1.15
        elif ab in site_prefs['non_preferred']:
            score *= 0.85
        if age_group == 'neonatal' and ab in ['penicillin', 'amoxicillin']:
            score *= 1.1
        return round(min(score, 1.0), 4)

    df_rank['final_score'] = df_rank.apply(compute_final_score, axis=1)
    df_rank = df_rank.sort_values('final_score', ascending=False).reset_index(drop=True)
    df_rank['rank'] = df_rank.index + 1

    def get_label(row):
        ab = row['antibiotic']
        if ab in excluded:
            if ab in PREGNANCY_EXCLUSIONS and pregnant:
                return 'Contraindicated (Pregnancy)'
            if ab in PEDIATRIC_EXCLUSIONS and age_group == 'pediatric':
                return 'Contraindicated (Pediatric)'
            return 'Contraindicated (Allergy)'
        if row['final_score'] >= 0.70:
            return 'Recommended'
        if row['final_score'] >= 0.40:
            return 'Use with Caution'
        return 'Not Recommended'

    df_rank['recommendation'] = df_rank.apply(get_label, axis=1)
    df_rank['resistance_pct']    = (df_rank['p_resistant']  * 100).round(1)
    df_rank['effectiveness_pct'] = (df_rank['effectiveness'] * 100).round(1)

    return df_rank[['rank', 'antibiotic', 'resistance_pct',
                    'effectiveness_pct', 'final_score', 'recommendation']].to_dict('records')