import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import CommitteeDetail from './components/CommitteeDetail';
import { useCommitteeData } from './hooks/useCommitteeData';
import { useTranslation } from './contexts/LanguageContext';

const App: React.FC = () => {
  const committeeData = useCommitteeData();
  const [selectedCommitteeId, setSelectedCommitteeId] = useState<string | null>(null);
  const { t, language, setLanguage, direction } = useTranslation();
  
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [language, direction]);

  const handleSelectCommittee = (id: string) => {
    setSelectedCommitteeId(id);
  };
  
  const handleBackToDashboard = () => {
    setSelectedCommitteeId(null);
  };

  const toggleLanguage = () => {
    setLanguage(lang => lang === 'en' ? 'ur' : 'en');
  };
  
  const selectedCommittee = committeeData.committees.find(c => c.id === selectedCommitteeId);

  // When a committee is deleted, go back to the dashboard
  if (selectedCommitteeId && !selectedCommittee) {
    handleBackToDashboard();
    return null; // Or a loading state
  }

  return (
    <div className="min-h-screen bg-base-100 text-gray-200 font-sans flex flex-col">
      <header className="bg-base-200 shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">
            {t('kameetiManager')}
          </h1>
           <div className="flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              className="font-semibold text-gray-300 hover:text-primary transition-colors"
            >
              {language === 'en' ? 'اردو' : 'English'}
            </button>
            {selectedCommittee && (
             <>
                <div className="w-px h-6 bg-base-300"></div>
                <div className="flex items-center gap-4">
                  <button
                      onClick={committeeData.undo}
                      className="text-gray-400 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={t('undo')}
                      disabled={!committeeData.canUndo}
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                      </svg>
                  </button>
                  <button
                      onClick={handleBackToDashboard}
                      className="text-gray-400 hover:text-primary transition-colors"
                      aria-label={t('home')}
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                  </button>
              </div>
             </>
           )}
           </div>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8 flex-grow">
        {!selectedCommittee ? (
          <Dashboard
            committees={committeeData.committees}
            onSelectCommittee={handleSelectCommittee}
            addCommittee={committeeData.addCommittee}
            updateCommittee={committeeData.updateCommittee}
            deleteCommittee={committeeData.deleteCommittee}
          />
        ) : (
          <CommitteeDetail
            committee={selectedCommittee}
            {...committeeData}
          />
        )}
      </main>
      <footer className="text-center p-4 mt-8 text-gray-500 text-sm">
        Jaleeliyat
      </footer>
    </div>
  );
};

export default App;