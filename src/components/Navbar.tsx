import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  History, 
  Globe, 
  User, 
  LogOut, 
  ChevronDown
} from 'lucide-react';
import { LanguageCode, UserProfile } from '../types';
import { useLanguage } from '../utils/LanguageContext';

interface NavbarProps {
  currentView: 'landing' | 'analyze' | 'results' | 'dashboard';
  setCurrentView: (view: 'landing' | 'analyze' | 'results' | 'dashboard') => void;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  language,
  setLanguage,
  user,
  onOpenAuth,
  onLogout,
  onOpenDemo
}) => {
  const { t } = useLanguage();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const getLanguageLabel = (lang: LanguageCode) => {
    switch (lang) {
      case 'ur': return 'اردو (Urdu)';
      case 'roman_ur': return 'Roman Urdu';
      case 'en': return 'English';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#050505]/95 backdrop-blur-md border-b border-[#222] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Tagline */}
          <div 
            id="nav-logo"
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setCurrentView('landing')}
          >
            <div className="w-10 h-10 rounded-xl bg-[#FF6321] flex items-center justify-center text-black shadow-lg shadow-[#FF6321]/20 group-hover:scale-105 transition-transform duration-200">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white font-sans">
                  LOAN<span className="text-[#FF6321]">SHIELD</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#FF6321]/15 text-[#FF6321] border border-[#FF6321]/30 rounded-md">
                  AI
                </span>
              </div>
              <p className="text-[11px] font-medium text-[#888888] hidden sm:block">
                {t.nav.tagline}
              </p>
            </div>
          </div>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              id="nav-btn-home"
              onClick={() => setCurrentView('landing')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                currentView === 'landing'
                  ? 'text-white bg-[#1A1A1A] border border-[#2a2a2a]'
                  : 'text-[#888888] hover:text-white hover:bg-[#111111]'
              }`}
            >
              {t.nav.home}
            </button>
            <button
              id="nav-btn-analyze"
              onClick={() => setCurrentView('analyze')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                currentView === 'analyze'
                  ? 'text-[#FF6321] bg-[#FF6321]/10 border border-[#FF6321]/30'
                  : 'text-[#888888] hover:text-white hover:bg-[#111111]'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#FF6321]" />
              <span>{t.nav.analyze}</span>
            </button>
            <button
              id="nav-btn-dashboard"
              onClick={() => setCurrentView('dashboard')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                currentView === 'dashboard'
                  ? 'text-white bg-[#1A1A1A] border border-[#2a2a2a]'
                  : 'text-[#888888] hover:text-white hover:bg-[#111111]'
              }`}
            >
              <History className="w-4 h-4 text-[#888888]" />
              <span>{t.nav.history}</span>
            </button>
            <button
              id="nav-btn-demo"
              onClick={onOpenDemo}
              className="px-3 py-1.5 ml-2 rounded-lg text-xs font-bold uppercase tracking-wide bg-[#1A1A1A] text-[#FF6321] border border-[#FF6321]/30 hover:bg-[#FF6321]/10 transition-colors flex items-center space-x-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-[#FF6321] animate-pulse"></span>
              <span>{t.nav.demoScenarios}</span>
            </button>
          </nav>

          {/* Right Action Menu: Language & Auth */}
          <div className="flex items-center space-x-3">
            
            {/* Multilingual Selector */}
            <div className="relative">
              <button
                id="nav-language-selector"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#2A2A2A] bg-[#111111] hover:bg-[#1A1A1A] text-xs font-semibold text-[#E0E0E0] transition-colors"
                title="Switch Language"
              >
                <Globe className="w-3.5 h-3.5 text-[#888888]" />
                <span>{getLanguageLabel(language)}</span>
                <ChevronDown className="w-3 h-3 text-[#888888]" />
              </button>

              {langMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-44 bg-[#111111] rounded-xl shadow-2xl border border-[#222222] py-1.5 z-50 animate-in fade-in slide-in-from-top-1"
                  onMouseLeave={() => setLangMenuOpen(false)}
                >
                  <button
                    onClick={() => { setLanguage('en'); setLangMenuOpen(false); }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-medium hover:bg-[#1A1A1A] flex items-center justify-between ${
                      language === 'en' ? 'text-[#FF6321] font-bold bg-[#FF6321]/10' : 'text-[#E0E0E0]'
                    }`}
                  >
                    <span>English</span>
                    {language === 'en' && <span className="text-[#FF6321]">✓</span>}
                  </button>
                  <button
                    onClick={() => { setLanguage('ur'); setLangMenuOpen(false); }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-medium hover:bg-[#1A1A1A] flex items-center justify-between ${
                      language === 'ur' ? 'text-[#FF6321] font-bold bg-[#FF6321]/10' : 'text-[#E0E0E0]'
                    }`}
                  >
                    <span className="font-urdu text-sm">اردو (Urdu)</span>
                    {language === 'ur' && <span className="text-[#FF6321]">✓</span>}
                  </button>
                  <button
                    onClick={() => { setLanguage('roman_ur'); setLangMenuOpen(false); }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-medium hover:bg-[#1A1A1A] flex items-center justify-between ${
                      language === 'roman_ur' ? 'text-[#FF6321] font-bold bg-[#FF6321]/10' : 'text-[#E0E0E0]'
                    }`}
                  >
                    <span>Roman Urdu</span>
                    {language === 'roman_ur' && <span className="text-[#FF6321]">✓</span>}
                  </button>
                </div>
              )}
            </div>

            {/* User Account / Auth */}
            {user ? (
              <div className="relative">
                <button
                  id="nav-user-menu-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-[#2A2A2A] bg-[#111111] hover:bg-[#1A1A1A] text-xs font-semibold text-white transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-[#FF6321]/20 text-[#FF6321] flex items-center justify-center font-bold text-[10px]">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline-block truncate max-w-[100px]">{user.name}</span>
                  <ChevronDown className="w-3 h-3 text-[#888888]" />
                </button>

                {userMenuOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-48 bg-[#111111] rounded-xl shadow-2xl border border-[#222222] py-1.5 z-50 animate-in fade-in slide-in-from-top-1"
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    <div className="px-3.5 py-2 border-b border-[#222222]">
                      <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-[#888888] truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => { setCurrentView('dashboard'); setUserMenuOpen(false); }}
                      className="w-full text-left px-3.5 py-2 text-xs text-[#E0E0E0] hover:bg-[#1A1A1A] flex items-center space-x-2"
                    >
                      <History className="w-3.5 h-3.5 text-[#888888]" />
                      <span>{t.nav.history}</span>
                    </button>
                    <button
                      onClick={() => { onLogout(); setUserMenuOpen(false); }}
                      className="w-full text-left px-3.5 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center space-x-2 border-t border-[#222222]"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t.nav.logout}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="nav-login-btn"
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 rounded-lg bg-white text-black text-xs font-bold hover:bg-[#E0E0E0] transition-colors"
              >
                {t.nav.login}
              </button>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};
