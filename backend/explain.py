from ranking import ALLERGY_GROUPS, PREGNANCY_EXCLUSIONS, PEDIATRIC_EXCLUSIONS, SITE_PREFERENCE

GENE_EFFECTS = {
    'gene_mef(a)': {
        'antibiotics': ['erythromycin'],
        'description': "mef(a) (macrolide efflux pump) is present, which actively exports macrolide antibiotics out of the bacterial cell and reduces erythromycin effectiveness."
    },
    'gene_msr(d)': {
        'antibiotics': ['erythromycin'],
        'description': "msr(d) (ABC-transporter efflux protein) is present, which works alongside mef(a) to export macrolides and contributes to reduced erythromycin susceptibility."
    },
    'gene_erm(b)': {
        'antibiotics': ['erythromycin', 'clindamycin'],
        'description': "erm(b) (ribosomal methylase) is present, which modifies the bacterial ribosome to block macrolide and lincosamide binding, conferring high-level resistance to both erythromycin and clindamycin (MLSb phenotype)."
    },
    'gene_tet(m)': {
        'antibiotics': ['tetracycline'],
        'description': "tet(m) (ribosomal protection protein) is present, which protects the ribosome from tetracycline binding and confers tetracycline resistance."
    },
    'gene_pbp2b': {
        'antibiotics': ['penicillin', 'amoxicillin'],
        'description': "An altered pbp2b (penicillin-binding protein 2b) is present, reducing the binding affinity of beta-lactam antibiotics such as penicillin and amoxicillin."
    },
    'gene_pbp2x': {
        'antibiotics': ['penicillin', 'amoxicillin', 'ceftriaxone'],
        'description': "An altered pbp2x (penicillin-binding protein 2x) is present, strongly associated with reduced susceptibility to penicillins and cephalosporins such as ceftriaxone."
    },
    'gene_pbp1a': {
        'antibiotics': ['penicillin', 'amoxicillin'],
        'description': "An altered pbp1a (penicillin-binding protein 1a) is present, contributing to reduced penicillin and amoxicillin susceptibility, particularly alongside other pbp mutations."
    },
}


def compute_context(allergies, pregnant, age_group, infection_site):
    excluded_reasons = {}

    for allergy in allergies:
        for ab in ALLERGY_GROUPS.get(allergy, []):
            excluded_reasons[ab] = f"a documented {allergy} allergy"

    if pregnant:
        for ab in PREGNANCY_EXCLUSIONS:
            excluded_reasons[ab] = "contraindication in pregnancy"

    if age_group == 'pediatric':
        for ab in PEDIATRIC_EXCLUSIONS:
            excluded_reasons[ab] = "contraindication in pediatric patients (risk of tooth discoloration)"

    site_prefs = SITE_PREFERENCE.get(infection_site, SITE_PREFERENCE['other'])
    return excluded_reasons, site_prefs


def generate_explanations(gene_input, ranking_results, allergies, pregnant, age_group, infection_site):
    excluded_reasons, site_prefs = compute_context(allergies, pregnant, age_group, infection_site)
    explanations = {}

    for row in ranking_results:
        ab = row['antibiotic']
        parts = []

        if ab in excluded_reasons:
            parts.append(
                f"This antibiotic is contraindicated due to {excluded_reasons[ab]}, "
                f"and is therefore not recommended regardless of its predicted resistance profile."
            )
        else:
            parts.append(
                f"The model predicts a {row['resistance_pct']}% probability of resistance for this isolate, "
                f"corresponding to a base effectiveness score of {row['effectiveness_pct']}%."
            )

            relevant = [GENE_EFFECTS[g]['description']
                        for g, info in GENE_EFFECTS.items()
                        if gene_input.get(g, 0) == 1 and ab in info['antibiotics']]

            if relevant:
                parts.append(" ".join(relevant))
            else:
                parts.append(
                    f"No resistance genes specifically associated with {ab} were detected in this isolate; "
                    f"the prediction reflects broader genomic and population-level resistance patterns "
                    f"learned from the training data."
                )

            if ab in site_prefs['preferred']:
                parts.append(
                    f"Given the {infection_site} infection site, {ab} is a clinically preferred first-line "
                    f"option, so its score was adjusted upward."
                )
            elif ab in site_prefs['non_preferred']:
                parts.append(
                    f"Given the {infection_site} infection site, {ab} is not typically preferred, "
                    f"so its score was adjusted downward."
                )

            if age_group == 'neonatal' and ab in ['penicillin', 'amoxicillin']:
                parts.append(
                    f"As this is a neonatal patient, {ab} received an additional preference boost "
                    f"as a first-line agent for neonatal Streptococcal infections."
                )

        explanations[ab] = " ".join(parts)

    return explanations
