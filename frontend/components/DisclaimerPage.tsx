import React from 'react';

const sections = [
  {
    title: 'Research Use Only',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    text: 'This platform is intended solely for research and educational purposes.',
  },
  {
    title: 'Not Clinical Advice',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    text: 'Predictions made by this tool do not constitute medical advice and should not be used to guide clinical treatment decisions.',
  },
  {
    title: 'Consult a Professional',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    text: 'Always consult a qualified clinician or microbiologist before making treatment decisions.',
  },
  {
    title: 'Accuracy Limitations',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    text: 'Model predictions are based on genomic features from a research dataset and may not reflect real-world susceptibility.',
  },
  {
    title: 'Data Privacy',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    text: 'No patient data is stored or transmitted. All inputs are processed in real time and discarded.',
  },
];

const DisclaimerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F0F4F7]">
      <div className="container mx-auto px-6 py-10">
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-[#E1E8ED]">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1.5 bg-red-50 text-red-500 text-xs font-bold uppercase tracking-widest rounded-full border border-red-100 mb-6">
              Important
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-[#0F4C75] mb-4">Disclaimer</h1>
            <p className="text-lg text-[#547D9A] leading-relaxed mb-10">
              Please read the following information carefully before using AMR Atlas.
            </p>

            <div className="space-y-6">
              {sections.map((section, idx) => (
                <div
                  key={idx}
                  className="bg-[#F8FBFD] p-6 rounded-2xl border border-[#E1E8ED] hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#0F4C75] rounded-lg flex items-center justify-center text-white shrink-0 mt-0.5">
                      {section.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#0F4C75] mb-2">{section.title}</h3>
                      <p className="text-base text-[#547D9A] leading-relaxed">{section.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerPage;
