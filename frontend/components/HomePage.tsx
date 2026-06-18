import React from 'react';
import BackgroundMicrobes from './BackgroundMicrobes';

type Page = 'home' | 'ranker' | 'methods' | 'about' | 'disclaimer';

interface HomePageProps {
  onNavigate: (page: Page) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* HERO SECTION */}
      <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden bg-white">
        <BackgroundMicrobes />

        {/* Soft glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-[#0FA3B1]/5 blur-[120px] rounded-full -z-10 animate-pulse"></div>

        <div className="container mx-auto px-6 relative z-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F0F7F9] rounded-full border border-[#E1E8ED] mb-8 animate-[fadeIn_0.6s_ease-out]">
              <div className="w-2 h-2 rounded-full bg-[#0FA3B1] animate-pulse"></div>
              <span className="text-xs font-bold text-[#547D9A] uppercase tracking-widest">Research Tool</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-[#0F4C75] leading-tight mb-6 tracking-tight animate-[fadeIn_0.8s_ease-out]">
              Genomic AMR Prediction for{' '}
              <span className="bg-gradient-to-r from-[#0FA3B1] to-[#0F4C75] bg-clip-text text-transparent">
                Streptococcus Infections
              </span>
            </h1>

            <p className="text-lg md:text-xl text-[#547D9A] font-light leading-relaxed mb-10 max-w-2xl mx-auto animate-[fadeIn_1s_ease-out]">
              Machine learning-powered antibiotic resistance prediction and personalised antibiotic ranking across{' '}
              <em>S.&nbsp;pyogenes</em>, <em>S.&nbsp;pneumoniae</em>, and <em>S.&nbsp;agalactiae</em>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-[fadeIn_1.2s_ease-out]">
              <button
                onClick={() => onNavigate('ranker')}
                id="hero-cta-ranker"
                className="group relative inline-flex items-center justify-center px-10 py-4 bg-[#0FA3B1] text-white font-bold text-lg rounded-full overflow-hidden shadow-xl transition-all duration-300 hover:bg-[#12B4C3] hover:shadow-[0_20px_40px_rgba(15,163,177,0.3)] hover:-translate-y-1 active:translate-y-0"
              >
                <span className="relative z-10 flex items-center gap-3">
                  Try the Antibiotic Ranker
                  <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>

              <button
                onClick={() => onNavigate('methods')}
                id="hero-cta-methods"
                className="inline-flex items-center justify-center px-10 py-4 bg-white text-[#0F4C75] font-bold text-lg rounded-full border-2 border-[#E1E8ED] shadow-sm transition-all duration-300 hover:border-[#0FA3B1] hover:text-[#0FA3B1] hover:shadow-md hover:-translate-y-1 active:translate-y-0"
              >
                Read the Methods
              </button>
            </div>
          </div>
        </div>

        {/* Dot pattern */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] opacity-[0.04] pointer-events-none -z-20">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dotPatternHero" width="50" height="50" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="#0FA3B1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dotPatternHero)" />
          </svg>
        </div>
      </section>

      {/* SECTION 1 — How It Works */}
      <section className="py-20 bg-[#F0F4F7]" id="how-it-works">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 bg-[#0FA3B1]/10 text-[#0FA3B1] text-xs font-bold uppercase tracking-widest rounded-full mb-4">
              Process
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F4C75] mb-4">How It Works</h2>
            <p className="text-lg text-[#547D9A] max-w-xl mx-auto">Three simple steps from gene profile to personalised antibiotic recommendation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                num: '01',
                title: 'Input Gene Profile',
                desc: 'Select detected resistance genes and patient clinical details.',
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
              },
              {
                num: '02',
                title: 'ML Predicts Resistance',
                desc: 'Eight trained classifiers predict resistance probability for each antibiotic.',
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ),
              },
              {
                num: '03',
                title: 'Get Ranked Recommendations',
                desc: 'Antibiotics ranked from most to least effective, adjusted for your patient.',
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                ),
              },
            ].map((step) => (
              <div
                key={step.num}
                className="bg-white p-8 rounded-2xl border border-[#E1E8ED] hover:shadow-md transition-shadow relative group"
              >
                <div className="absolute -top-4 left-8">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#0FA3B1] to-[#0F4C75] text-white text-xs font-black rounded-lg shadow-md">
                    {step.num}
                  </span>
                </div>
                <div className="w-12 h-12 bg-[#F0F7F9] rounded-xl flex items-center justify-center text-[#0FA3B1] mb-5 mt-2 group-hover:bg-[#0FA3B1] group-hover:text-white transition-all duration-300">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-[#0F4C75] mb-3">{step.title}</h3>
                <p className="text-[#547D9A] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2 — Species Covered */}
      <section className="py-20 bg-white" id="species-covered">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 bg-[#0F4C75]/10 text-[#0F4C75] text-xs font-bold uppercase tracking-widest rounded-full mb-4">
              Organisms
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F4C75] mb-4">Species Covered</h2>
            <p className="text-lg text-[#547D9A] max-w-xl mx-auto">Genomic resistance models for three clinically important Streptococcus species.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'S. pyogenes',
                group: 'Group A Streptococcus',
                desc: 'Primary cause of strep throat, skin infections, and invasive disease.',
                color: '#0FA3B1',
              },
              {
                name: 'S. pneumoniae',
                group: '',
                desc: 'Leading cause of pneumonia, meningitis, and bacteremia worldwide.',
                color: '#0F4C75',
              },
              {
                name: 'S. agalactiae',
                group: 'Group B Streptococcus',
                desc: 'Major cause of neonatal sepsis and adult invasive infections.',
                color: '#1B9AAA',
              },
            ].map((species) => (
              <div
                key={species.name}
                className="bg-[#F8FBFD] p-8 rounded-2xl border border-[#E1E8ED] hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md"
                    style={{ backgroundColor: species.color }}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#0F4C75] italic">{species.name}</h3>
                    {species.group && (
                      <span className="text-xs font-semibold text-[#547D9A]">{species.group}</span>
                    )}
                  </div>
                </div>
                <p className="text-[#547D9A] leading-relaxed">{species.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — Antibiotics Covered */}
      <section className="py-20 bg-[#F0F4F7]" id="antibiotics-covered">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 bg-[#0FA3B1]/10 text-[#0FA3B1] text-xs font-bold uppercase tracking-widest rounded-full mb-4">
              Drug Panel
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F4C75] mb-4">Antibiotics Covered</h2>
            <p className="text-lg text-[#547D9A] max-w-xl mx-auto">Eight antibiotics across multiple drug classes evaluated by our ML models.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { name: 'Penicillin', cls: 'Beta-lactam' },
              { name: 'Amoxicillin', cls: 'Beta-lactam' },
              { name: 'Erythromycin', cls: 'Macrolide' },
              { name: 'Clindamycin', cls: 'Lincosamide' },
              { name: 'Tetracycline', cls: 'Tetracycline' },
              { name: 'Ceftriaxone', cls: 'Cephalosporin' },
              { name: 'Meropenem', cls: 'Carbapenem' },
              { name: 'TMP-SMX', cls: 'Sulfonamide' },
            ].map((abx) => (
              <div
                key={abx.name}
                className="bg-white p-5 rounded-2xl border border-[#E1E8ED] hover:shadow-md transition-all hover:border-[#0FA3B1]/30 group text-center"
              >
                <div className="w-10 h-10 mx-auto bg-[#F0F7F9] rounded-xl flex items-center justify-center text-[#0FA3B1] mb-3 group-hover:bg-[#0FA3B1] group-hover:text-white transition-all duration-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-[#0F4C75] mb-1">{abx.name}</h4>
                <p className="text-xs text-[#547D9A]">{abx.cls}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — Disclaimer Banner */}
      <section className="py-12 bg-gradient-to-r from-[#0F4C75] to-[#0FA3B1]" id="disclaimer-banner">
        <div className="container mx-auto px-6">
          <div className="flex items-start gap-4 max-w-4xl mx-auto">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0 mt-1">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-white text-base md:text-lg leading-relaxed font-medium">
              This tool is intended for research and educational purposes only. It is not a substitute for clinical diagnosis or professional medical advice. Always consult a qualified healthcare professional.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-white border-t border-[#E1E8ED]">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-[#547D9A]">© 2025 AMR Atlas — Research Tool for Antimicrobial Resistance Prediction</p>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
