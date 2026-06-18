import React from 'react';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F0F4F7]">
      <div className="container mx-auto px-6 py-10">
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-[#E1E8ED]">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1.5 bg-[#0F4C75]/10 text-[#0F4C75] text-xs font-bold uppercase tracking-widest rounded-full mb-6">
              Project
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-[#0F4C75] mb-4">About AMR Atlas</h1>
            <p className="text-lg text-[#547D9A] leading-relaxed">
              AMR Atlas is a research tool for predicting antimicrobial resistance in Streptococcus infections using machine learning. Built as part of an undergraduate research project.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
