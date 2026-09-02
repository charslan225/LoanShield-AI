import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { AnalyzePage } from './components/AnalyzePage';
import { AnalysisProgress } from './components/AnalysisProgress';
import { ResultsPage } from './components/ResultsPage';
import { DashboardPage } from './components/DashboardPage';
import { DemoModal } from './components/DemoModal';
import { AuthModal } from './components/AuthModal';
import { DEMO_SCENARIOS } from './data/demoScenarios';
import { AnalysisResult, DemoScenario, UserProfile } from './types';
import { useLanguage } from './utils/LanguageContext';

export function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'analyze' | 'results' | 'dashboard'>('landing');
  const { language, setLanguage } = useLanguage();
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('loanshield_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [demoModalOpen, setDemoModalOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  // Save user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('loanshield_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('loanshield_user');
    }
  }, [user]);

  const handleStartAnalysisProcess = async (formData: any) => {
    setIsAnalyzing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const endpoint = formData.method === 'MANUAL_ENTRY' ? '/api/analyze/manual' : '/api/analyze/upload';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success && data.analysis) {
        // Wait a small bit so progress animations finish gracefully
        setTimeout(() => {
          setCurrentAnalysis(data.analysis);
          setIsAnalyzing(false);
          setCurrentView('results');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1500);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setIsAnalyzing(false);
      alert(err.message || 'An error occurred during loan analysis. Please try again.');
    }
  };

  const handleSelectDemoScenario = (scenario: DemoScenario) => {
    setCurrentAnalysis(scenario.resultData);
    setCurrentView('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectHistoryAnalysis = async (analysisId: string) => {
    try {
      const res = await fetch(`/api/analysis/${analysisId}`);
      const data = await res.json();
      if (data.success && data.analysis) {
        setCurrentAnalysis(data.analysis);
        setCurrentView('results');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Failed to load analysis:', err);
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] font-sans text-[#E0E0E0] antialiased selection:bg-[#FF6321] selection:text-black">
      
      {/* Top Navigation Bar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        language={language}
        setLanguage={setLanguage}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenDemo={() => setDemoModalOpen(true)}
      />

      {/* Main Viewport Container */}
      <main className="flex-1">
        {isAnalyzing ? (
          <AnalysisProgress />
        ) : (
          <>
            {currentView === 'landing' && (
              <LandingPage
                onStartAnalysis={() => {
                  setCurrentView('analyze');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onSelectDemoScenario={handleSelectDemoScenario}
                onOpenDemoModal={() => setDemoModalOpen(true)}
              />
            )}

            {currentView === 'analyze' && (
              <AnalyzePage
                onStartAnalysisProcess={handleStartAnalysisProcess}
                onSelectDemo={() => setDemoModalOpen(true)}
              />
            )}

            {currentView === 'results' && currentAnalysis && (
              <ResultsPage
                analysis={currentAnalysis}
                language={language}
                setLanguage={setLanguage}
                onNewAnalysis={() => {
                  setCurrentView('analyze');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {currentView === 'dashboard' && (
              <DashboardPage
                onSelectAnalysis={handleSelectHistoryAnalysis}
                onStartNewAnalysis={() => {
                  setCurrentView('analyze');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Footer with Mandatory SECP & Consumer Disclaimers */}
      <Footer />

      {/* Modals */}
      <DemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        onSelectScenario={handleSelectDemoScenario}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(loggedUser) => setUser(loggedUser)}
      />

    </div>
  );
}

export default App;
