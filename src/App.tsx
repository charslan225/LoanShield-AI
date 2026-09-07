import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { AnalyzePage } from './components/AnalyzePage';
import { AnalysisProgress } from './components/AnalysisProgress';
import { ResultsPage } from './components/ResultsPage';
import { DashboardPage } from './components/DashboardPage';
import { DemoModal } from './components/DemoModal';
import { AuthModal } from './components/AuthModal';
import { AnalysisResult, DemoScenario, UserProfile } from './types';
import { useLanguage } from './utils/LanguageContext';
import { analyzeLoanDocumentSync } from './utils/clientAnalyzer';

function saveLocalAnalysis(analysis: AnalysisResult) {
  try {
    const raw = localStorage.getItem('loanshield_local_analyses');
    const list: AnalysisResult[] = raw ? JSON.parse(raw) : [];
    // Keep last 30 analyses, replace if existing
    const filtered = list.filter((a) => a.id !== analysis.id);
    filtered.unshift(analysis);
    localStorage.setItem('loanshield_local_analyses', JSON.stringify(filtered.slice(0, 30)));
  } catch (err) {
    console.warn('Could not save analysis locally:', err);
  }
}

function getLocalAnalysis(id: string): AnalysisResult | null {
  try {
    const raw = localStorage.getItem('loanshield_local_analyses');
    const list: AnalysisResult[] = raw ? JSON.parse(raw) : [];
    return list.find((a) => a.id === id) || null;
  } catch {
    return null;
  }
}

export function App() {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('loanshield_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [demoModalOpen, setDemoModalOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

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

    let finalAnalysis: AnalysisResult | null = null;
    const endpoint = formData.method === 'MANUAL_ENTRY' ? '/api/analyze/manual' : '/api/analyze/upload';

    // Attempt 1: Server-side analysis
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.analysis) {
          finalAnalysis = data.analysis;
        }
      }
    } catch (networkErr) {
      console.warn('First fetch attempt encountered error, attempting quick retry:', networkErr);
    }

    // Attempt 2: Quick retry if first network fetch failed
    if (!finalAnalysis) {
      try {
        await new Promise((r) => setTimeout(r, 400));
        const retryRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (retryRes.ok) {
          const data = await retryRes.json();
          if (data.success && data.analysis) {
            finalAnalysis = data.analysis;
          }
        }
      } catch (retryErr) {
        console.warn('Retry fetch also failed, falling back to local analysis engine:', retryErr);
      }
    }

    // Fallback: If network or server unavailable, run resilient sync client engine
    if (!finalAnalysis) {
      try {
        finalAnalysis = analyzeLoanDocumentSync(formData);
      } catch (fallbackErr) {
        console.error('Local fallback engine error:', fallbackErr);
      }
    }

    if (finalAnalysis) {
      saveLocalAnalysis(finalAnalysis);
      setTimeout(() => {
        setCurrentAnalysis(finalAnalysis);
        setIsAnalyzing(false);
        navigate('/results');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 1200);
    } else {
      setIsAnalyzing(false);
      console.error('All analysis options exhausted.');
    }
  };

  const handleSelectDemoScenario = (scenario: DemoScenario) => {
    setCurrentAnalysis(scenario.resultData);
    setDemoModalOpen(false);
    navigate('/results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectHistoryAnalysis = async (analysisId: string) => {
    try {
      const res = await fetch(`/api/analysis/${analysisId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.analysis) {
          setCurrentAnalysis(data.analysis);
          navigate('/results');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to load analysis from server, checking local storage:', err);
    }

    // Fallback to local storage
    const local = getLocalAnalysis(analysisId);
    if (local) {
      setCurrentAnalysis(local);
      navigate('/results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  const navigateAndScroll = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] font-sans text-[#E0E0E0] antialiased selection:bg-[#FF6321] selection:text-black">

      <Navbar
        language={language}
        setLanguage={setLanguage}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenDemo={() => setDemoModalOpen(true)}
      />

      <main className="flex-1">
        {isAnalyzing ? (
          <AnalysisProgress />
        ) : (
          <Routes>
            <Route path="/" element={
              <LandingPage
                onStartAnalysis={() => navigateAndScroll('/analyze')}
                onSelectDemoScenario={handleSelectDemoScenario}
                onOpenDemoModal={() => setDemoModalOpen(true)}
              />
            } />
            <Route path="/analyze" element={
              <AnalyzePage
                onStartAnalysisProcess={handleStartAnalysisProcess}
                onSelectDemo={() => setDemoModalOpen(true)}
              />
            } />
            <Route path="/results" element={
              currentAnalysis ? (
                <ResultsPage
                  analysis={currentAnalysis}
                  language={language}
                  setLanguage={setLanguage}
                  onNewAnalysis={() => navigateAndScroll('/analyze')}
                />
              ) : (
                <Navigate to="/analyze" replace />
              )
            } />
            <Route path="/dashboard" element={
              <DashboardPage
                onSelectAnalysis={handleSelectHistoryAnalysis}
                onStartNewAnalysis={() => navigateAndScroll('/analyze')}
              />
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>

      <Footer />

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
