
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import RankerPage from './components/RankerPage';
import MethodsPage from './components/MethodsPage';
import AboutPage from './components/AboutPage';
import DisclaimerPage from './components/DisclaimerPage';

type Page = 'home' | 'ranker' | 'methods' | 'about' | 'disclaimer';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <Navbar currentPage={currentPage} onNavigate={navigateTo} />
      
      {currentPage === 'home' && <HomePage onNavigate={navigateTo} />}
      {currentPage === 'ranker' && <RankerPage />}
      {currentPage === 'methods' && <MethodsPage />}
      {currentPage === 'about' && <AboutPage />}
      {currentPage === 'disclaimer' && <DisclaimerPage />}
    </main>
  );
};

export default App;
