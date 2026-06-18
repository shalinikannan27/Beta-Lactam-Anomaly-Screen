import React, { useState } from 'react';

/* ---------- TYPES ---------- */
interface FormData {
  species: string;
  isolationType: string;
  country: string;
  collectionYear: string;
  genes: Record<string, boolean>;
  infectionSite: string;
  allergies: Record<string, boolean>;
  treatmentFailures: Record<string, boolean>;
}

interface RankedRow {
  rank: number;
  antibiotic: string;
  drugClass: string;
  resistancePct: number;
  effectivenessPct: number;
  finalScore: number;
  recommendation: 'Recommended' | 'Use with Caution' | 'Not Recommended' | 'Contraindicated';
}

/* ---------- CONSTANTS ---------- */
const GENES: { id: string; label: string; tooltip: string }[] = [
  { id: 'mef_a', label: 'mef(a)', tooltip: 'Macrolide efflux pump gene. Associated with low-level macrolide resistance.' },
  { id: 'msr_d', label: 'msr(d)', tooltip: 'ATP-binding efflux pump. Works with mef(a) for macrolide resistance.' },
  { id: 'erm_b', label: 'erm(b)', tooltip: 'Ribosomal methylase. Causes high-level resistance to macrolides and clindamycin.' },
  { id: 'tet_m', label: 'tet(m)', tooltip: 'Ribosomal protection protein. Confers tetracycline resistance.' },
  { id: 'pbp2b', label: 'pbp2b', tooltip: 'Altered penicillin-binding protein. Reduces beta-lactam susceptibility.' },
  { id: 'pbp2x', label: 'pbp2x', tooltip: 'Altered penicillin-binding protein. Associated with cephalosporin resistance.' },
  { id: 'pbp1a', label: 'pbp1a', tooltip: 'Altered penicillin-binding protein. Contributes to penicillin resistance.' },
];

const ALLERGIES = ['Penicillin', 'Macrolide', 'Clindamycin', 'Cephalosporin', 'Carbapenem', 'Sulfa'];
const TREATMENT_FAILURES = ['Penicillin', 'Amoxicillin', 'Erythromycin', 'Clindamycin', 'Tetracycline', 'Ceftriaxone', 'Meropenem', 'TMP-SMX'];

const MOCK_RESULTS: RankedRow[] = [
  { rank: 1, antibiotic: 'Meropenem', drugClass: 'Carbapenem', resistancePct: 2, effectivenessPct: 97, finalScore: 0.96, recommendation: 'Recommended' },
  { rank: 2, antibiotic: 'Ceftriaxone', drugClass: 'Cephalosporin', resistancePct: 5, effectivenessPct: 94, finalScore: 0.92, recommendation: 'Recommended' },
  { rank: 3, antibiotic: 'Amoxicillin', drugClass: 'Beta-lactam', resistancePct: 12, effectivenessPct: 87, finalScore: 0.85, recommendation: 'Recommended' },
  { rank: 4, antibiotic: 'Penicillin', drugClass: 'Beta-lactam', resistancePct: 15, effectivenessPct: 84, finalScore: 0.82, recommendation: 'Use with Caution' },
  { rank: 5, antibiotic: 'TMP-SMX', drugClass: 'Sulfonamide', resistancePct: 28, effectivenessPct: 71, finalScore: 0.68, recommendation: 'Use with Caution' },
  { rank: 6, antibiotic: 'Tetracycline', drugClass: 'Tetracycline', resistancePct: 45, effectivenessPct: 53, finalScore: 0.48, recommendation: 'Not Recommended' },
  { rank: 7, antibiotic: 'Clindamycin', drugClass: 'Lincosamide', resistancePct: 62, effectivenessPct: 36, finalScore: 0.31, recommendation: 'Not Recommended' },
  { rank: 8, antibiotic: 'Erythromycin', drugClass: 'Macrolide', resistancePct: 78, effectivenessPct: 20, finalScore: 0.15, recommendation: 'Contraindicated' },
];

const recColors: Record<string, { bg: string; text: string; border: string }> = {
  'Recommended': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'Use with Caution': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Not Recommended': { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  'Contraindicated': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
};

/* ---------- TOOLTIP COMPONENT ---------- */
const Tooltip: React.FC<{ text: string }> = ({ text }) => (
  <span className="relative group/tip inline-flex ml-1.5 cursor-help">
    <svg className="w-4 h-4 text-[#547D9A] group-hover/tip:text-[#0FA3B1] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 p-2.5 bg-[#0F4C75] text-white text-xs rounded-lg opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-30 shadow-lg text-center leading-relaxed">
      {text}
    </span>
  </span>
);

/* ---------- MAIN COMPONENT ---------- */
const RankerPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [whyExpanded, setWhyExpanded] = useState(false);

  const [form, setForm] = useState<FormData>({
    species: '',
    isolationType: '',
    country: '',
    collectionYear: '2024',
    genes: {},
    infectionSite: '',
    allergies: {},
    treatmentFailures: {},
  });

  const handleSubmit = () => {
    setSubmitted(true);
    setWhyExpanded(false);
  };

  const toggleGene = (id: string) => {
    setForm((prev) => ({ ...prev, genes: { ...prev.genes, [id]: !prev.genes[id] } }));
  };

  const toggleAllergy = (a: string) => {
    setForm((prev) => ({ ...prev, allergies: { ...prev.allergies, [a]: !prev.allergies[a] } }));
  };

  const toggleFailure = (f: string) => {
    setForm((prev) => ({ ...prev, treatmentFailures: { ...prev.treatmentFailures, [f]: !prev.treatmentFailures[f] } }));
  };

  return (
    <div className="min-h-screen bg-[#F0F4F7]">
      <div className="container mx-auto px-6 py-10">
        {/* Page header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-[#0F4C75] mb-3">Antibiotic Ranker</h1>
          <p className="text-lg text-[#547D9A] max-w-2xl leading-relaxed">
            Enter isolate gene profile and patient details to receive a personalised antibiotic ranking.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ======== LEFT: INPUT FORM ======== */}
          <div className="lg:col-span-5 space-y-6">
            {/* Section A — Isolate Information */}
            <div className="bg-white p-8 rounded-2xl border border-[#E1E8ED] shadow-sm">
              <h3 className="text-sm font-bold text-[#0F4C75] uppercase tracking-wider mb-6 flex items-center gap-2">
                <div className="w-6 h-6 bg-[#0FA3B1] rounded-lg flex items-center justify-center text-white text-xs font-black">A</div>
                Isolate Information
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#547D9A] uppercase mb-2">Species</label>
                  <select
                    value={form.species}
                    onChange={(e) => setForm({ ...form, species: e.target.value })}
                    id="input-species"
                    className="w-full px-4 py-3 bg-white border border-[#E1E8ED] rounded-xl text-[#0F3C5C] focus:ring-2 focus:ring-[#0FA3B1] outline-none transition-all"
                  >
                    <option value="">Select species</option>
                    <option value="S. pyogenes">S. pyogenes</option>
                    <option value="S. pneumoniae">S. pneumoniae</option>
                    <option value="S. agalactiae">S. agalactiae</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#547D9A] uppercase mb-2">Isolation Type</label>
                  <select
                    value={form.isolationType}
                    onChange={(e) => setForm({ ...form, isolationType: e.target.value })}
                    id="input-isolation-type"
                    className="w-full px-4 py-3 bg-white border border-[#E1E8ED] rounded-xl text-[#0F3C5C] focus:ring-2 focus:ring-[#0FA3B1] outline-none transition-all"
                  >
                    <option value="">Select type</option>
                    <option value="Clinical">Clinical</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#547D9A] uppercase mb-2">Country</label>
                  <select
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    id="input-country"
                    className="w-full px-4 py-3 bg-white border border-[#E1E8ED] rounded-xl text-[#0F3C5C] focus:ring-2 focus:ring-[#0FA3B1] outline-none transition-all"
                  >
                    <option value="">Select country</option>
                    <option value="USA">USA</option>
                    <option value="Brazil">Brazil</option>
                    <option value="Canada">Canada</option>
                    <option value="Other">Other</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#547D9A] uppercase mb-2">Collection Year</label>
                  <input
                    type="number"
                    min={2000}
                    max={2025}
                    value={form.collectionYear}
                    onChange={(e) => setForm({ ...form, collectionYear: e.target.value })}
                    id="input-collection-year"
                    className="w-full px-4 py-3 bg-white border border-[#E1E8ED] rounded-xl text-[#0F3C5C] focus:ring-2 focus:ring-[#0FA3B1] outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Section B — Resistance Genes */}
            <div className="bg-white p-8 rounded-2xl border border-[#E1E8ED] shadow-sm">
              <h3 className="text-sm font-bold text-[#0F4C75] uppercase tracking-wider mb-2 flex items-center gap-2">
                <div className="w-6 h-6 bg-[#0F4C75] rounded-lg flex items-center justify-center text-white text-xs font-black">B</div>
                Resistance Genes Detected
              </h3>
              <p className="text-xs text-[#547D9A] mb-5">Select all genes detected in this isolate</p>

              <div className="grid grid-cols-2 gap-3">
                {GENES.map((gene) => (
                  <label
                    key={gene.id}
                    className={`flex items-center gap-2.5 cursor-pointer px-4 py-3 rounded-xl border transition-all ${form.genes[gene.id]
                      ? 'bg-[#0FA3B1]/10 border-[#0FA3B1] text-[#0F4C75]'
                      : 'bg-white border-[#E1E8ED] hover:border-[#0FA3B1]/40 text-[#547D9A]'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!form.genes[gene.id]}
                      onChange={() => toggleGene(gene.id)}
                      className="w-4 h-4 text-[#0FA3B1] rounded border-gray-300 focus:ring-[#0FA3B1]"
                    />
                    <span className="text-sm font-bold">{gene.label}</span>
                    <Tooltip text={gene.tooltip} />
                  </label>
                ))}
              </div>
            </div>

            {/* Section C — Patient Information */}
            <div className="bg-white p-8 rounded-2xl border border-[#E1E8ED] shadow-sm">
              <h3 className="text-sm font-bold text-[#0F4C75] uppercase tracking-wider mb-6 flex items-center gap-2">
                <div className="w-6 h-6 bg-[#1B9AAA] rounded-lg flex items-center justify-center text-white text-xs font-black">C</div>
                Patient Information
              </h3>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-[#547D9A] uppercase mb-2">Infection Site</label>
                  <select
                    value={form.infectionSite}
                    onChange={(e) => setForm({ ...form, infectionSite: e.target.value })}
                    id="input-infection-site"
                    className="w-full px-4 py-3 bg-white border border-[#E1E8ED] rounded-xl text-[#0F3C5C] focus:ring-2 focus:ring-[#0FA3B1] outline-none transition-all"
                  >
                    <option value="">Select site</option>
                    <option value="Throat">Throat</option>
                    <option value="Blood">Blood</option>
                    <option value="Skin">Skin</option>
                    <option value="Neonatal">Neonatal</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#547D9A] uppercase mb-2">Known Allergies</label>
                  <div className="flex flex-wrap gap-2">
                    {ALLERGIES.map((a) => (
                      <button
                        key={a}
                        onClick={() => toggleAllergy(a)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${form.allergies[a]
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : 'bg-white text-[#547D9A] border-[#E1E8ED] hover:border-[#0FA3B1]'
                          }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#547D9A] uppercase mb-2">Previous Treatment Failures</label>
                  <div className="flex flex-wrap gap-2">
                    {TREATMENT_FAILURES.map((f) => (
                      <button
                        key={f}
                        onClick={() => toggleFailure(f)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${form.treatmentFailures[f]
                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                          : 'bg-white text-[#547D9A] border-[#E1E8ED] hover:border-[#0FA3B1]'
                          }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              id="btn-get-ranking"
              className="w-full py-4 bg-[#0FA3B1] text-white font-bold text-lg rounded-xl shadow-xl shadow-[#0FA3B1]/20 hover:bg-[#12B4C3] transition-all active:scale-[0.98]"
            >
              Get Antibiotic Ranking
            </button>
          </div>

          {/* ======== RIGHT: OUTPUT PANEL ======== */}
          <div className="lg:col-span-7">
            {submitted ? (
              <div className="bg-white rounded-[2.5rem] border border-[#E1E8ED] shadow-sm p-8 md:p-10 animate-[fadeIn_0.6s_ease-out]">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                  <h3 className="text-2xl font-bold text-[#0F4C75]">Ranked Antibiotic Recommendations</h3>
                  <div className="flex gap-2 flex-wrap">
                    {form.species && (
                      <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border bg-[#F0F7F9] text-[#0FA3B1] border-[#E1E8ED]">
                        {form.species}
                      </span>
                    )}
                    {form.infectionSite && (
                      <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border bg-blue-50 text-blue-600 border-blue-100">
                        {form.infectionSite}
                      </span>
                    )}
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto mb-8">
                  <table className="w-full text-left" id="results-table">
                    <thead>
                      <tr className="border-b border-[#E1E8ED]">
                        {['Rank', 'Antibiotic', 'Drug Class', 'Resistance %', 'Effectiveness %', 'Final Score', 'Recommendation'].map((h) => (
                          <th key={h} className="px-3 py-3 text-[10px] font-bold text-[#547D9A] uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_RESULTS.map((row) => {
                        const rec = recColors[row.recommendation];
                        return (
                          <tr key={row.rank} className="border-b border-[#E1E8ED]/50 hover:bg-[#F8FBFD] transition-colors">
                            <td className="px-3 py-3.5">
                              <span className="inline-flex items-center justify-center w-7 h-7 bg-gradient-to-br from-[#0FA3B1] to-[#0F4C75] text-white text-xs font-black rounded-lg">
                                {row.rank}
                              </span>
                            </td>
                            <td className="px-3 py-3.5 text-sm font-bold text-[#0F4C75]">{row.antibiotic}</td>
                            <td className="px-3 py-3.5 text-xs text-[#547D9A]">{row.drugClass}</td>
                            <td className="px-3 py-3.5 text-sm font-semibold text-[#0F4C75]">{row.resistancePct}%</td>
                            <td className="px-3 py-3.5 text-sm font-semibold text-[#0FA3B1]">{row.effectivenessPct}%</td>
                            <td className="px-3 py-3.5 text-sm font-bold text-[#0F4C75]">{row.finalScore.toFixed(2)}</td>
                            <td className="px-3 py-3.5">
                              <span className={`inline-block px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${rec.bg} ${rec.text} ${rec.border}`}>
                                {row.recommendation}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Why this ranking */}
                <div className="mb-6">
                  <button
                    onClick={() => setWhyExpanded(!whyExpanded)}
                    className="text-sm font-bold text-[#0F4C75] flex items-center gap-2 hover:opacity-80 transition-opacity"
                    id="btn-why-ranking"
                  >
                    <svg className={`w-4 h-4 transition-transform ${whyExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                    Why this ranking?
                  </button>

                  {whyExpanded && (
                    <div className="mt-4 p-5 bg-[#F8FBFD] rounded-2xl border border-[#E1E8ED] animate-[fadeIn_0.3s_ease-out]">
                      <p className="text-sm text-[#547D9A] leading-relaxed">
                        This ranking is generated by combining ML-predicted resistance probabilities with patient-specific factors.
                        The model evaluates each antibiotic against the detected resistance gene profile for <strong>{form.species || 'the selected species'}</strong>.
                        Patient allergies and previous treatment failures are used to adjust the final score and may elevate or demote specific antibiotics.
                        Infection site context (<strong>{form.infectionSite || 'unspecified'}</strong>) is factored into the clinical recommendation tier.
                      </p>
                    </div>
                  )}
                </div>

                {/* Model Information */}
                <div className="p-6 bg-[#F8FBFD] rounded-2xl border border-[#E1E8ED] mb-6">
                  <h4 className="text-sm font-bold text-[#0F4C75] uppercase tracking-wider mb-4">Model Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-[#547D9A] uppercase mb-1">Model Used</p>
                      <p className="text-sm font-bold text-[#0F4C75]">Ensemble (8 classifiers)</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#547D9A] uppercase mb-1">Validation Method</p>
                      <p className="text-sm font-bold text-[#0F4C75]">5-Fold CV</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#547D9A] uppercase mb-1">Note</p>
                      <p className="text-xs text-[#547D9A] leading-relaxed">Scores are research predictions only — not clinical diagnoses.</p>
                    </div>
                  </div>
                </div>

                {/* Bottom disclaimer */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-[#547D9A] italic text-center">For research use only. Not for clinical decision-making.</p>
                </div>
              </div>
            ) : (
              /* Placeholder state */
              <div className="h-full min-h-[600px] border-2 border-dashed border-[#E1E8ED] rounded-[2.5rem] flex flex-col items-center justify-center text-center p-12">
                <div className="w-20 h-20 bg-[#F0F7F9] rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-[#0FA3B1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-[#0F4C75] mb-3">No Results Yet</h4>
                <p className="text-[#547D9A] max-w-sm leading-relaxed">
                  Fill in the isolate and patient details on the left, then click <strong>Get Antibiotic Ranking</strong> to see results.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default RankerPage;
