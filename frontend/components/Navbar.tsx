import React, { useState } from 'react';

type Page = 'home' | 'ranker' | 'methods' | 'about' | 'disclaimer';

interface NavbarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems: { label: string; page: Page }[] = [
  { label: 'Home', page: 'home' },
  { label: 'Antibiotic Ranker', page: 'ranker' },
  { label: 'Methods', page: 'methods' },
  { label: 'About', page: 'about' },
  { label: 'Disclaimer', page: 'disclaimer' },
];

const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-[#E1E8ED] sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto flex items-center justify-between py-4 px-6">
        {/* Brand */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 group"
          id="nav-brand"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-[#0FA3B1] to-[#0F4C75] rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-[#0F4C75] tracking-tight">AMR Atlas</span>
        </button>

        {/* Desktop Nav */}
        <div className="hidden md:flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {navItems.map((item) => (
            <button
              key={item.page}
              id={`nav-${item.page}`}
              onClick={() => onNavigate(item.page)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${currentPage === item.page
                ? 'bg-[#0FA3B1] text-white shadow-lg shadow-[#0FA3B1]/20'
                : 'text-[#547D9A] hover:bg-[#F0F7F9] hover:text-[#0FA3B1]'
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2 rounded-xl hover:bg-[#F0F7F9] transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          id="nav-mobile-toggle"
        >
          <svg className="w-6 h-6 text-[#0F4C75]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-[#E1E8ED] px-6 py-4 space-y-2 animate-[fadeIn_0.2s_ease-out]">
          {navItems.map((item) => (
            <button
              key={item.page}
              onClick={() => { onNavigate(item.page); setMobileOpen(false); }}
              className={`block w-full text-left px-5 py-3 rounded-xl text-sm font-bold transition-all ${currentPage === item.page
                ? 'bg-[#0FA3B1] text-white shadow-lg shadow-[#0FA3B1]/20'
                : 'text-[#547D9A] hover:bg-[#F0F7F9] hover:text-[#0FA3B1]'
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
