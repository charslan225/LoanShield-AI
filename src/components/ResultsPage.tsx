import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Shield, 
  Scale, 
  Calculator, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Globe, 
  FileText, 
  Download, 
  Share2, 
  Printer, 
  HelpCircle, 
  Sparkles, 
  Send, 
  Smartphone, 
  ArrowLeft, 
  Info,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Check,
  Percent,
  TrendingUp,
  Lock
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';
import { AnalysisResult, LanguageCode } from '../types';
import { useLanguage } from '../utils/LanguageContext';

interface ResultsPageProps {
  analysis: AnalysisResult;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  onNewAnalysis: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  analysis,
  language,
  setLanguage,
  onNewAnalysis
}) => {
  const { t, isUrdu, isRtl } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'promise_vs_reality' | 'financials' | 'clauses' | 'privacy' | 'checklist'>('overview');
  
  // Clause category filter
  const [clauseCategoryFilter, setClauseCategoryFilter] = useState<string>('ALL');
  
  // Late payment simulator days
  const [simulateLateDays, setSimulateLateDays] = useState<number>(7);

  // AI Advisor Chat Drawer State
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [advisorQuestion, setAdvisorQuestion] = useState('');
  const [advisorMessages, setAdvisorMessages] = useState<Array<{ sender: 'user' | 'advisor'; text: string }>>([
    {
      sender: 'advisor',
      text: `Hello! I am your LoanShield Consumer Protection Advisor for this ${analysis.lenderName} loan. You can ask me any question about these terms, fees, SECP regulations, or potential risks.`
    }
  ]);
  const [isAskingAdvisor, setIsAskingAdvisor] = useState(false);

  // Checklist checked items state
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleChecklist = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAskAdvisor = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!advisorQuestion.trim() || isAskingAdvisor) return;

    const userQ = advisorQuestion.trim();
    setAdvisorQuestion('');
    setAdvisorMessages(prev => [...prev, { sender: 'user', text: userQ }]);
    setIsAskingAdvisor(true);

    try {
      const res = await fetch('/api/ask-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId: analysis.id,
          question: userQ
        })
      });
      const data = await res.json();
      if (data.success && data.answer) {
        setAdvisorMessages(prev => [...prev, { sender: 'advisor', text: data.answer }]);
      } else {
        setAdvisorMessages(prev => [...prev, { 
          sender: 'advisor', 
          text: `Based on the contract for ${analysis.lenderName}, the documented net cash is PKR ${analysis.financialBreakdown.actualDisbursedAmount.toLocaleString()} and total repayment is PKR ${analysis.financialBreakdown.totalRepaymentAmount.toLocaleString()}. Please review the upfront fee deductions and late penalty clauses carefully before proceeding.` 
        }]);
      }
    } catch (err) {
      setAdvisorMessages(prev => [...prev, { 
        sender: 'advisor', 
        text: 'Sorry, I could not process your question right now. Please verify terms directly with SECP or your loan documentation.' 
      }]);
    } finally {
      setIsAskingAdvisor(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const risk = analysis.riskAssessment || {} as any;
  const fin = analysis.financialBreakdown || {} as any;

  // Visual Chart Data
  const financialBarData = [
    { name: 'Net Disbursed Cash', amount: fin.actualDisbursedAmount || 0, fill: '#10b981' },
    { name: 'Upfront Deductions', amount: fin.totalDeductions || 0, fill: '#f43f5e' },
    { name: 'Interest / Markup', amount: (fin.totalRepaymentAmount && fin.actualDisbursedAmount) ? Math.max(0, fin.totalRepaymentAmount - fin.actualDisbursedAmount - (fin.totalDeductions || 0)) : (fin.totalCostOfBorrowing || 0), fill: '#f59e0b' },
  ];

  const clausesList = analysis.clauses || [];
  const filteredClauses = clauseCategoryFilter === 'ALL' 
    ? clausesList 
    : clausesList.filter(c => c.category === clauseCategoryFilter);

  const getRiskColorClasses = (level: string) => {
    switch (level) {
      case 'LOW':
        return {
          bg: 'bg-emerald-500',
          badgeBg: 'bg-emerald-950/80 text-emerald-400 border-emerald-800',
          border: 'border-emerald-600/60',
          lightBg: 'bg-emerald-950/20',
          text: 'text-emerald-400'
        };
      case 'MODERATE':
        return {
          bg: 'bg-amber-500',
          badgeBg: 'bg-amber-950/80 text-amber-400 border-amber-800',
          border: 'border-amber-600/60',
          lightBg: 'bg-amber-950/20',
          text: 'text-amber-400'
        };
      case 'HIGH':
        return {
          bg: 'bg-[#FF6321]',
          badgeBg: 'bg-[#FF6321]/20 text-[#FF6321] border-[#FF6321]/60',
          border: 'border-[#FF6321]/60',
          lightBg: 'bg-[#FF6321]/10',
          text: 'text-[#FF6321]'
        };
      case 'VERY_HIGH':
      default:
        return {
          bg: 'bg-rose-600',
          badgeBg: 'bg-rose-950/80 text-rose-400 border-rose-800',
          border: 'border-rose-600/60',
          lightBg: 'bg-rose-950/20',
          text: 'text-rose-400'
        };
    }
  };

  const riskColors = getRiskColorClasses(risk.riskLevel || 'HIGH');

  // Late fee simulator calculation
  const dailyPenaltyRate = analysis.contractReality?.latePenaltyRatePerDay || 1.0;
  const principalAmt = fin.principalAmount || analysis.contractReality?.documentedPrincipal || 0;
  const totalRepayAmt = fin.totalRepaymentAmount || analysis.contractReality?.documentedRepaymentAmount || 0;
  const simulatedLateFee = Math.round(principalAmt * (dailyPenaltyRate / 100) * simulateLateDays);
  const simulatedTotalAfterLate = totalRepayAmt + simulatedLateFee;

  // Defensive arrays
  const factorsList = risk.factors || (risk as any).breakdown || [];
  const primaryReasons = risk.reasons || (risk as any).primaryRiskFactors || [];
  const positiveReasons = risk.positiveFactors || [];
  const chargesList = fin.chargesList || (fin as any).charges || [];
  const discrepanciesList = analysis.discrepancies || [];
  const permissionsList = analysis.permissions || [];
  const checklistList = analysis.verificationChecklist || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-[#E0E0E0]">
      
      {/* 1. TOP AUDIT REPORT HEADER */}
      <div className="bg-[#111111] rounded-2xl border border-[#222222] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <button
              onClick={onNewAnalysis}
              className="text-xs font-semibold text-[#888888] hover:text-white flex items-center space-x-1 mr-2 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>New Analysis</span>
            </button>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#1c1c1c] text-[#CCCCCC] border border-[#2b2b2b]">
              {analysis.analysisMethod.replace('_', ' ')}
            </span>
            {analysis.isDemo && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-950/50 text-amber-300 border border-amber-800/60">
                Fictional Demo Scenario
              </span>
            )}
            <span className="text-xs text-[#666666]">
              Audit ID: {analysis.id}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {analysis.lenderName}
          </h1>
          <p className="text-xs text-[#888888] mt-0.5">
            Document: {analysis.fileName || 'Digital Loan Application'} • Audited on {new Date(analysis.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            id="btn-ask-advisor-drawer"
            onClick={() => setAdvisorOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#FF6321] hover:bg-[#ff773d] text-black text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{t.results.askAdvisor}</span>
          </button>

          <button
            id="btn-print-report"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl border border-[#2b2b2b] bg-[#161616] hover:bg-[#202020] text-[#E0E0E0] text-xs font-semibold shadow-2xs transition-colors flex items-center space-x-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-[#888888]" />
            <span>{t.results.printPdf}</span>
          </button>
        </div>

      </div>

      {/* 2. OVERALL RISK ASSESSMENT HERO CARD (0-100 EXPLAINABLE GAUGE) */}
      <div className={`rounded-2xl border-2 ${riskColors.border} bg-[#111111] shadow-md overflow-hidden`}>
        <div className="p-6 sm:p-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Score Gauge Block */}
            <div className="lg:col-span-4 text-center lg:text-left space-y-4">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#888888]">
                {t.results.riskScoreTitle}
              </span>

              <div className="flex items-baseline justify-center lg:justify-start space-x-3">
                <span className="text-5xl sm:text-6xl font-black tracking-tight text-white">
                  {risk.overallScore}
                </span>
                <span className="text-xl font-bold text-[#666666]">/ 100</span>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${riskColors.badgeBg}`}>
                  {risk.riskLevel.replace('_', ' ')} RISK
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">{risk.riskTitle || 'RISK ASSESSMENT'}</h3>
                <p className="text-xs text-[#A0A0A0] leading-relaxed mt-1">{risk.riskDescription || risk.summaryReason || 'Analysis of financial terms and disclosure transparency.'}</p>
              </div>

              <div className="w-full bg-[#1e1e1e] rounded-full h-3 overflow-hidden border border-[#2e2e2e]">
                <div 
                  className={`h-3 rounded-full ${riskColors.bg} transition-all duration-1000`}
                  style={{ width: `${risk.overallScore || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Right: 7-Factor Weighted Breakdown Bars */}
            <div className="lg:col-span-8 bg-[#161616] rounded-xl p-5 border border-[#242424] space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-[#282828]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#C5C5C5]">
                  Explainable 7-Factor Breakdown
                </h4>
                <div className="flex items-center space-x-2 text-[11px]">
                  <span className="flex items-center space-x-1 text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>Known Risk</span>
                  </span>
                  <span className="flex items-center space-x-1 text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>Information Gap</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 pt-1">
                {factorsList.map((factor: any, idx: number) => {
                  const maxWeight = factor.maxWeight || factor.maxScore || 20;
                  const score = typeof factor.score === 'number' ? factor.score : 0;
                  const factorPct = Math.round((score / maxWeight) * 100);
                  const isHighRisk = factor.riskImpact === 'HIGH' || factor.riskImpact === 'CRITICAL' || factorPct >= 60;
                  const isModerate = factor.riskImpact === 'MEDIUM' || (factorPct >= 30 && factorPct < 60);
                  const isInfoGap = factor.nature === 'INFORMATION_GAP';

                  return (
                    <div key={factor.name || factor.category || idx} className="space-y-1.5 p-2.5 rounded-lg bg-[#121212] border border-[#202020]">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center space-x-1.5 truncate pr-2">
                          <span className="text-[#E0E0E0] truncate">{factor.name || factor.category}</span>
                          <span className={`px-1.5 py-0.2 rounded-xs text-[9px] font-black uppercase tracking-wider ${
                            isInfoGap ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60' : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                          }`}>
                            {isInfoGap ? 'INFO GAP' : 'KNOWN RISK'}
                          </span>
                        </div>
                        <span className={`font-mono text-[11px] shrink-0 ${
                          isHighRisk ? 'text-rose-400 font-bold' : isModerate ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {score}/{maxWeight} pts
                        </span>
                      </div>
                      <div className="w-full bg-[#242424] rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-1.5 rounded-full ${
                            isHighRisk ? 'bg-rose-500' : isModerate ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, factorPct)}%` }}
                        ></div>
                      </div>
                      <p className="text-[11px] text-[#A0A0A0] leading-snug">{factor.finding || factor.explanation || 'Evaluated against consumer protection guidelines'}</p>
                      
                      {factor.evidence && (
                        <div className="text-[10px] text-[#888888] bg-[#0c0c0c] p-1.5 rounded border border-[#1e1e1e] space-y-0.5">
                          <p><strong className="text-[#AAAAAA]">Evidence:</strong> <span className="font-mono text-[#CCCCCC]">{factor.evidence}</span></p>
                          {factor.interpretation && (
                            <p><strong className="text-[#AAAAAA]">Interpretation:</strong> <span className="text-[#999999]">{factor.interpretation}</span></p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Key Reasons & Positives */}
          <div className="mt-6 pt-6 border-t border-[#222222] grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-900/50">
              <h5 className="text-xs font-bold text-rose-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Primary Risk Factors Identified</span>
              </h5>
              <ul className="space-y-1 text-xs text-rose-200">
                {primaryReasons.length > 0 ? (
                  primaryReasons.map((rf: string, i: number) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{rf}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-[#888888] italic">No critical risk warnings flagged.</li>
                )}
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-900/50">
              <h5 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Positive Transparency Indicators</span>
              </h5>
              <ul className="space-y-1 text-xs text-emerald-200">
                {positiveReasons.length > 0 ? (
                  positiveReasons.map((pf: string, i: number) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{pf}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-[#666666] italic">No significant positive indicators documented.</li>
                )}
              </ul>
            </div>
          </div>

        </div>
      </div>

      {/* 3. NAVIGATION TABS */}
      <div className="border-b border-[#222222]">
        <nav className="flex space-x-2 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: t.results.tabOverview, icon: Sparkles },
            { id: 'promise_vs_reality', label: t.results.tabPromiseVsReality, icon: Scale },
            { id: 'financials', label: t.results.tabFinancials, icon: Calculator },
            { id: 'clauses', label: t.results.tabClauses, icon: Globe },
            { id: 'privacy', label: t.results.tabPrivacy, icon: Smartphone },
            { id: 'checklist', label: t.results.tabChecklist, icon: CheckCircle2 }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center space-x-2 ${
                  isActive
                    ? 'bg-[#FF6321] text-black shadow-xs font-extrabold'
                    : 'text-[#888888] hover:text-white hover:bg-[#181818]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 4. TAB CONTENT PANELS */}

      {/* TAB 1: AI EXECUTIVE SUMMARY (8 CORE QUESTIONS) */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          
          <div className="bg-[#111111] rounded-2xl border border-[#222222] p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-[#FF6321]" />
                  <span>Borrower Executive Brief (8 Core Questions)</span>
                </h3>
                <p className="text-xs text-[#888888] mt-0.5">
                  Plain-language answers generated by LoanShield AI to prevent information asymmetry.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="p-4 rounded-xl bg-[#161616] border border-[#242424] space-y-1.5">
                <span className="text-[11px] font-bold text-[#888888] uppercase tracking-wider">
                  1. How Much Will I Actually Receive?
                </span>
                <p className="text-xs font-semibold text-white">
                  {analysis.executiveSummary?.actualAmountReceivedText || `Net cash received: PKR ${(fin.actualDisbursedAmount || 0).toLocaleString()} after PKR ${(fin.totalDeductions || 0).toLocaleString()} in upfront deductions.`}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#161616] border border-[#242424] space-y-1.5">
                <span className="text-[11px] font-bold text-[#888888] uppercase tracking-wider">
                  2. How Much Must I Repay in Total?
                </span>
                <p className="text-xs font-semibold text-white">
                  {analysis.executiveSummary?.totalRepaymentText || `Total repayment of PKR ${(fin.totalRepaymentAmount || 0).toLocaleString()} over ${fin.durationDays || 30} days.`}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#161616] border border-[#242424] space-y-1.5">
                <span className="text-[11px] font-bold text-[#888888] uppercase tracking-wider">
                  3. What Fee Components Were Identified?
                </span>
                <p className="text-xs font-semibold text-white">
                  {analysis.executiveSummary?.chargesIdentifiedSummary || (fin.deductionStatus === 'POTENTIAL_DEDUCTIONS_UNCLEAR' ? 'Potential deductions are mentioned, but the exact amounts are not clearly specified.' : `${chargesList.length} fee component(s) identified in document analysis.`)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#161616] border border-[#242424] space-y-1.5">
                <span className="text-[11px] font-bold text-[#888888] uppercase tracking-wider">
                  4. What Happens If Payment Is Delayed?
                </span>
                <p className="text-xs font-semibold text-white">
                  {analysis.executiveSummary?.latePaymentImpactSummary || `Late payments may incur daily penalty fees according to the agreement terms.`}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#161616] border border-[#242424] space-y-1.5">
                <span className="text-[11px] font-bold text-[#888888] uppercase tracking-wider">
                  5. What Are The Most Critical Clauses?
                </span>
                <p className="text-xs font-semibold text-white">
                  {analysis.executiveSummary?.criticalClausesSummary || `Please review default, penalty, and emergency contact clauses carefully before agreeing.`}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#161616] border border-[#242424] space-y-1.5">
                <span className="text-[11px] font-bold text-[#888888] uppercase tracking-wider">
                  6. Any Marketing Discrepancies?
                </span>
                <p className="text-xs font-semibold text-white">
                  {analysis.executiveSummary?.promiseDiscrepancySummary || (discrepanciesList.length > 0 ? `${discrepanciesList.length} potential difference(s) detected.` : 'Document figures align with initial claims.')}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#161616] border border-[#242424] space-y-1.5">
                <span className="text-[11px] font-bold text-[#888888] uppercase tracking-wider">
                  7. Privacy & Permission Risks?
                </span>
                <p className="text-xs font-semibold text-white">
                  {analysis.executiveSummary?.privacyConcernsSummary || (permissionsList.some((p: any) => p.requested && p.concernLevel === 'HIGH') ? 'Sensitive device permissions requested.' : 'Device permissions appear within standard limits.')}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FF6321]/10 border border-[#FF6321]/30 space-y-1.5">
                <span className="text-[11px] font-bold text-[#FF6321] uppercase tracking-wider">
                  8. What Should I Do Before Accepting?
                </span>
                <p className="text-xs font-bold text-white">
                  Verify the lender on the SECP official licensed NBFC digital lending directory and never grant contact permissions.
                </p>
              </div>

            </div>

            {/* Essential Financial Terms Completeness Audit */}
            {fin.essentialTerms && fin.essentialTerms.length > 0 && (
              <div className="mt-6 pt-6 border-t border-[#222222]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#C5C5C5] flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#FF6321]" />
                      <span>5 Essential Financial Terms Completeness Audit</span>
                    </h4>
                    <p className="text-[11px] text-[#888888] mt-0.5">
                      SECP Transparency Standard: Checks whether all mandatory borrowing terms are explicitly defined prior to agreement.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {fin.essentialTerms.map((term: any) => {
                    const isSpecified = term.status === 'CLEARLY_SPECIFIED';
                    const isPartial = term.status === 'PARTIALLY_SPECIFIED';
                    const isMissing = term.status === 'NOT_SPECIFIED';

                    return (
                      <div
                        key={term.termName}
                        className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 ${
                          isSpecified ? 'bg-emerald-950/20 border-emerald-900/40' :
                          isPartial ? 'bg-amber-950/20 border-amber-900/40' :
                          'bg-[#161616] border-[#292929]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-white truncate">{term.termName}</span>
                            {isSpecified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                            {isPartial && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                            {isMissing && <AlertCircle className="w-3.5 h-3.5 text-[#777777] shrink-0" />}
                          </div>
                          <span className={`inline-block px-1.5 py-0.2 mt-1 rounded-xs text-[9px] font-black uppercase tracking-wider ${
                            isSpecified ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                            isPartial ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                            'bg-[#222222] text-[#888888] border border-[#333333]'
                          }`}>
                            {term.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#A0A0A0] leading-snug">{term.details}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Pre-Borrowing Advice */}
          <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#FF6321]">
                Want to double check anything before accepting?
              </h4>
              <p className="text-xs text-[#A0A0A0]">
                Our interactive AI advisor can answer specific questions regarding your contract terms.
              </p>
            </div>
            <button
              onClick={() => setAdvisorOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#FF6321] hover:bg-[#ff773d] text-black font-bold text-xs shadow-xs"
            >
              Open AI Loan Advisor
            </button>
          </div>

        </div>
      )}

      {/* TAB 2: PROMISE VS REALITY */}
      {activeTab === 'promise_vs_reality' && (
        <div className="space-y-6 animate-in fade-in">
          
          <div className="bg-[#111111] rounded-2xl border border-[#222222] p-6 shadow-xs">
            <div className="mb-6">
              <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                <Scale className="w-5 h-5 text-[#FF6321]" />
                <span>Promise vs Reality Comparison</span>
              </h3>
              <p className="text-xs text-[#888888] mt-1">
                Comparing what was advertised or claimed against what the binding agreement actually enforces.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left: What Was Promised */}
              <div className="p-5 rounded-2xl bg-[#161616] border border-blue-900/40 space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    What Was Promised / Advertised
                  </h4>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-[#242424]">
                    <span className="text-[#888888]">Advertised Loan Amount:</span>
                    <span className="font-extrabold text-white">
                      {analysis.advertisedPromise.advertisedAmount 
                        ? `PKR ${analysis.advertisedPromise.advertisedAmount.toLocaleString()}` 
                        : 'Not specified'}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-[#242424]">
                    <span className="text-[#888888]">Promised Duration:</span>
                    <span className="font-semibold text-[#D0D0D0]">
                      {analysis.advertisedPromise.advertisedDuration || 'Standard tenure'}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-[#242424]">
                    <span className="text-[#888888]">Advertised Markup / Rate:</span>
                    <span className="font-semibold text-[#D0D0D0]">
                      {analysis.advertisedPromise.advertisedMarkupRate || 'Low / Minimal markup'}
                    </span>
                  </div>

                  <div className="pt-2">
                    <span className="text-[#888888] block mb-1">Marketing Claims:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(analysis.advertisedPromise.marketingClaims || []).map((claim, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-md bg-[#1f1f1f] border border-[#333333] text-blue-300 text-[11px] font-medium">
                          ✓ "{claim}"
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: What The Document Actually Shows */}
              <div className="p-5 rounded-2xl bg-[#161616] border border-amber-900/40 space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    What The Document Actually Shows (Reality)
                  </h4>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-[#242424]">
                    <span className="text-[#888888]">Documented Principal:</span>
                    <span className="font-extrabold text-white">
                      PKR {(analysis.contractReality?.documentedPrincipal || fin.principalAmount || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-[#242424]">
                    <span className="text-[#888888]">Actual Cash Disbursed:</span>
                    <span className={`font-extrabold ${fin.actualDisbursedAmount !== null ? 'text-rose-400' : 'text-amber-400'}`}>
                      {fin.actualDisbursedAmount !== null 
                        ? `PKR ${fin.actualDisbursedAmount.toLocaleString()}` 
                        : 'To be determined after approval'}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-[#242424]">
                    <span className="text-[#888888]">Total Upfront Deductions:</span>
                    <span className="font-bold text-amber-400">
                      {fin.deductionStatus === 'POTENTIAL_DEDUCTIONS_UNCLEAR'
                        ? 'Potential deductions mentioned (Unclear amounts)'
                        : (fin.totalDeductions !== null ? `PKR ${fin.totalDeductions.toLocaleString()}` : 'Not confirmed')}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-[#242424]">
                    <span className="text-[#888888]">Documented Duration:</span>
                    <span className="font-semibold text-[#D0D0D0]">
                      {analysis.contractReality?.documentedDurationDays || fin.durationDays || 30} Days
                    </span>
                  </div>

                  <div className="flex justify-between py-2">
                    <span className="text-[#888888]">Total Obligated Repayment:</span>
                    <span className="font-black text-white">
                      {fin.totalRepaymentAmount !== null 
                        ? `PKR ${fin.totalRepaymentAmount.toLocaleString()}`
                        : 'To be determined'}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Identified Discrepancies & Information Gaps */}
            <div className="mt-8 pt-6 border-t border-[#222222] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#C5C5C5]">
                    Identified Findings ({discrepanciesList.length})
                  </h4>
                  <p className="text-[11px] text-[#888888] mt-0.5">
                    Distinguishing between confirmed numerical variances and document information gaps.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {discrepanciesList.map((disc: any) => {
                  const isInfoGap = disc.riskType === 'INFORMATION_GAP' || !disc.isNumericalVariance;

                  return (
                    <div 
                      key={disc.id}
                      className={`p-4 rounded-xl border flex flex-col space-y-2.5 ${
                        disc.severity === 'CRITICAL' ? 'bg-rose-950/20 border-rose-900/60' :
                        disc.severity === 'WARNING' ? 'bg-amber-950/20 border-amber-900/60' :
                        'bg-[#161616] border-[#262626]'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded-sm text-[10px] font-black uppercase ${
                            isInfoGap ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}>
                            {isInfoGap ? 'INFORMATION GAP' : 'CONFIRMED VARIANCE'}
                          </span>
                          <span className="text-xs font-bold text-white">{disc.category.replace('_', ' ')}</span>
                          {disc.confidenceLevel && (
                            <span className="px-1.5 py-0.2 rounded-xs bg-[#1f1f1f] text-[#888888] border border-[#2d2d2d] text-[9px] font-bold">
                              Confidence: {disc.confidenceLevel}
                            </span>
                          )}
                        </div>

                        {disc.isNumericalVariance && disc.varianceAmount && (
                          <span className="text-xs font-bold font-mono text-rose-400">
                            Variance: PKR {disc.varianceAmount.toLocaleString()} ({disc.variancePercentage}%)
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#D0D0D0] font-medium leading-relaxed">{disc.explanation}</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        <div className="p-2 rounded bg-[#101010] border border-[#202020]">
                          <span className="text-[10px] uppercase font-bold text-[#888888] block">Promised / Advertised:</span>
                          <span className="text-white font-semibold text-[11px]">{disc.promised}</span>
                        </div>
                        <div className="p-2 rounded bg-[#101010] border border-[#202020]">
                          <span className="text-[10px] uppercase font-bold text-[#888888] block">Document Term:</span>
                          <span className="text-white font-semibold text-[11px]">{disc.actual}</span>
                        </div>
                      </div>

                      {disc.evidence && (
                        <div className="p-2 rounded bg-[#0d0d0d] border border-[#1e1e1e] text-[11px] text-[#A0A0A0] space-y-0.5">
                          <p><strong className="text-[#CCCCCC]">Evidence:</strong> <span className="font-mono text-[#D0D0D0]">{disc.evidence}</span></p>
                          {disc.interpretation && (
                            <p><strong className="text-[#CCCCCC]">Interpretation:</strong> <span className="text-[#B0B0B0]">{disc.interpretation}</span></p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 3: FINANCIALS & CHARGES IDENTIFIED */}
      {activeTab === 'financials' && (
        <div className="space-y-6 animate-in fade-in">

          {/* Category C Notice Banner if Applicable */}
          {fin.deductionStatus === 'POTENTIAL_DEDUCTIONS_UNCLEAR' && (
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/60 flex items-start space-x-3.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Potential Deductions Mentioned (Unclear Exact Amounts)
                </h4>
                <p className="text-xs text-white font-semibold">
                  Potential deductions are mentioned, but the exact amounts are not clearly specified.
                </p>
                <p className="text-[11px] text-[#A0A0A0] leading-relaxed">
                  The document contains language indicating applicable charges, service costs, and administrative expenses may be deducted where necessary, but does not provide an explicit numerical breakdown prior to loan approval. In accordance with consumer protection standards, no arbitrary deduction sum is calculated.
                </p>
              </div>
            </div>
          )}
          
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-5 rounded-2xl bg-[#111111] border border-[#222222] shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#888888]">Documented Principal</span>
              <div className="text-xl sm:text-2xl font-black text-white mt-1">
                PKR {fin.principalAmount.toLocaleString()}
              </div>
              <p className="text-[10px] text-[#777777] mt-1">Face value of loan facility</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#111111] border border-[#222222] shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Upfront Deductions</span>
              <div className="text-base sm:text-lg font-black text-amber-400 mt-1">
                {fin.deductionStatus === 'POTENTIAL_DEDUCTIONS_UNCLEAR'
                  ? 'Unspecified / Unclear'
                  : (fin.totalDeductions !== null ? `-PKR ${fin.totalDeductions.toLocaleString()}` : '0 Deductions')}
              </div>
              <p className="text-[10px] text-[#888888] font-semibold mt-1">
                {fin.deductionStatus === 'POTENTIAL_DEDUCTIONS_UNCLEAR'
                  ? 'Mentioned without exact PKR'
                  : (fin.totalDeductions ? `${((fin.totalDeductions / fin.principalAmount) * 100).toFixed(1)}% cut before cashout` : 'No upfront fees declared')}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#111111] border border-[#222222] shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Actual Cash Received</span>
              <div className="text-base sm:text-lg font-black text-emerald-400 mt-1">
                {fin.actualDisbursedAmount !== null 
                  ? `PKR ${fin.actualDisbursedAmount.toLocaleString()}`
                  : 'To be determined after approval'}
              </div>
              <p className="text-[10px] text-[#888888] font-semibold mt-1">
                {fin.isDisbursementConfirmed ? 'Net amount in your bank/wallet' : 'Disbursement amount unconfirmed'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#161616] border border-[#262626] text-white shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#888888]">Total Repayment Amount</span>
              <div className="text-xl sm:text-2xl font-black text-white mt-1">
                {fin.totalRepaymentAmount !== null 
                  ? `PKR ${fin.totalRepaymentAmount.toLocaleString()}`
                  : 'To be determined'}
              </div>
              <p className="text-[10px] text-[#888888] mt-1">Over {fin.durationDays} days</p>
            </div>

          </div>

          {/* Visual Bar Breakdown */}
          <div className="bg-[#111111] rounded-2xl border border-[#222222] p-6 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#C5C5C5] mb-1">
              Visual Disbursement & Cost Breakdown
            </h4>
            <p className="text-xs text-[#888888] mb-6">
              Comparing the cash you receive against deductions and total borrowing costs.
            </p>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialBarData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                  <XAxis type="number" tickFormatter={(v) => `PKR ${v.toLocaleString()}`} stroke="#666666" tick={{ fill: '#888888', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" stroke="#666666" tick={{ fill: '#C5C5C5', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#181818', borderColor: '#2b2b2b', color: '#fff', borderRadius: '8px' }}
                    formatter={(value: number) => [`PKR ${value.toLocaleString()}`, 'Amount']} 
                  />
                  <Bar dataKey="amount" radius={[0, 8, 8, 0]}>
                    {financialBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-4 border-t border-[#222222] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-[#161616] border border-[#242424]">
                <span className="text-[#888888] block">Total Cost of Borrowing:</span>
                <span className="text-base font-extrabold text-white">
                  PKR {(fin.totalCostOfBorrowing || 0).toLocaleString()}
                </span>
                <span className="text-[11px] text-[#777777] block mt-0.5">
                  (Deductions + Markup + Fees)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#161616] border border-[#242424]">
                <span className="text-[#888888] block">Estimated Annualized APR:</span>
                <span className="text-base font-extrabold text-amber-400">
                  {fin.effectiveAnnualPercentageRate ? `${fin.effectiveAnnualPercentageRate.toFixed(1)}%` : (fin.estimatedAprPercent ? `${fin.estimatedAprPercent.toFixed(1)}%` : 'Undisclosed / High')}
                </span>
                <span className="text-[11px] text-[#777777] block mt-0.5">
                  Based on {fin.durationDays || 30} day repayment cycle
                </span>
              </div>
            </div>
          </div>

          {/* Itemized Charges Identified Table */}
          <div className="bg-[#111111] rounded-2xl border border-[#222222] p-6 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#C5C5C5] mb-4">
              Itemized Charges & Deductions Table ({chargesList.length})
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#242424] text-[#888888] uppercase text-[10px]">
                    <th className="py-2.5 font-bold">Charge Name</th>
                    <th className="py-2.5 font-bold">Type</th>
                    <th className="py-2.5 font-bold">Amount (PKR)</th>
                    <th className="py-2.5 font-bold">Deduction Timing</th>
                    <th className="py-2.5 font-bold">Disclosure Clarity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e1e1e]">
                  {chargesList.map((charge: any) => (
                    <tr key={charge.id} className="hover:bg-[#161616] transition-colors">
                      <td className="py-3 font-semibold text-white">
                        {charge.name}
                        {charge.description && (
                          <span className="block text-[10px] text-[#777777] font-normal">{charge.description}</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-md bg-[#1f1f1f] text-[#C5C5C5] border border-[#2c2c2c] text-[10px] font-bold">
                          {(charge.type || 'FEE').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 font-mono font-bold text-white">
                        {charge.amount ? `PKR ${charge.amount.toLocaleString()}` : (charge.percentage ? `${charge.percentage}%` : 'Variable')}
                      </td>
                      <td className="py-3">
                        {charge.isDeductedFromDisbursement ? (
                          <span className="text-rose-400 font-semibold">Deducted Upfront</span>
                        ) : (
                          <span className="text-[#A0A0A0]">Added to Repayment</span>
                        )}
                      </td>
                      <td className="py-3">
                        {charge.isClearlyDisclosed ? (
                          <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                            <Check className="w-3 h-3" />
                            <span>Disclosed</span>
                          </span>
                        ) : (
                          <span className="text-amber-400 font-semibold flex items-center space-x-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Vague / Hidden</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: URDU & ROMAN URDU CLAUSE EXPLAINER */}
      {activeTab === 'clauses' && (
        <div className="space-y-6 animate-in fade-in">
          
          <div className="bg-[#111111] rounded-2xl border border-[#222222] p-6 shadow-xs space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-[#FF6321]" />
                  <span>AI Multilingual Clause Explainer</span>
                </h3>
                <p className="text-xs text-[#888888] mt-0.5">
                  Complex legal clauses translated into simple everyday language.
                </p>
              </div>

              {/* Language Selector in Clauses */}
              <div className="flex items-center space-x-1 p-1 rounded-xl bg-[#181818] border border-[#282828]">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    language === 'en' ? 'bg-[#FF6321] text-black shadow-xs font-extrabold' : 'text-[#888888] hover:text-white'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage('ur')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    language === 'ur' ? 'bg-[#FF6321] text-black shadow-xs font-extrabold' : 'text-[#888888] hover:text-white'
                  }`}
                >
                  اردو (Urdu)
                </button>
                <button
                  onClick={() => setLanguage('roman_ur')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    language === 'roman_ur' ? 'bg-[#FF6321] text-black shadow-xs font-extrabold' : 'text-[#888888] hover:text-white'
                  }`}
                >
                  Roman Urdu
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#222222]">
              {['ALL', 'RECOVERY', 'INTEREST_AND_FEES', 'PENALTIES', 'DATA_PRIVACY', 'DEFAULT_AND_LEGAL'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setClauseCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    clauseCategoryFilter === cat
                      ? 'bg-[#FF6321] text-black font-bold'
                      : 'bg-[#181818] text-[#888888] hover:bg-[#222222] hover:text-white border border-[#282828]'
                  }`}
                >
                  {cat.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Clauses List */}
            <div className="space-y-4">
              {filteredClauses.map((clause) => {
                const isRed = clause.riskFlag === 'RED';
                const isYellow = clause.riskFlag === 'YELLOW';

                return (
                  <div
                    key={clause.id}
                    className={`rounded-2xl border p-5 transition-all ${
                      isRed ? 'border-rose-900/60 bg-rose-950/20' :
                      isYellow ? 'border-amber-900/60 bg-amber-950/20' :
                      'border-[#242424] bg-[#161616]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white">{clause.clauseTitle}</span>
                        <span className="px-2 py-0.5 rounded-md bg-[#222222] text-[#CCCCCC] text-[10px] font-bold uppercase border border-[#333333]">
                          {clause.category.replace('_', ' ')}
                        </span>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        isRed ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                        isYellow ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {clause.riskFlag} FLAG
                      </span>
                    </div>

                    {/* Original text snippet */}
                    <div className="p-2.5 rounded-lg bg-[#111111] text-[11px] font-mono text-[#A0A0A0] mb-3 border border-[#242424]">
                      "{clause.originalText}"
                    </div>

                    {/* Multilingual Plain Explanations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      
                      <div className="p-3 rounded-xl bg-[#111111] border border-[#242424]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#888888] block mb-1">
                          Simple Plain Explanation:
                        </span>
                        <p className={`text-[#D0D0D0] font-medium ${language === 'ur' ? 'font-urdu text-sm leading-relaxed text-right' : ''}`}>
                          {clause.simpleExplanation[language] || clause.simpleExplanation.en}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-[#111111] border border-[#242424]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block mb-1">
                          Why This Matters To You:
                        </span>
                        <p className={`text-[#D0D0D0] font-medium ${language === 'ur' ? 'font-urdu text-sm leading-relaxed text-right' : ''}`}>
                          {clause.whyItMatters[language] || clause.whyItMatters.en}
                        </p>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Interactive Late Payment Simulator */}
          <div className="bg-[#111111] rounded-2xl border border-[#222222] p-6 shadow-xs space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#C5C5C5] flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Interactive Late Payment Penalty Calculator</span>
            </h4>
            <p className="text-xs text-[#888888]">
              Simulate how late fees compound daily based on this agreement's {dailyPenaltyRate}%/day default clause.
            </p>

            <div className="flex items-center space-x-4 pt-2">
              <span className="text-xs font-semibold text-[#888888]">Days Delayed:</span>
              {[3, 7, 14, 30].map((days) => (
                <button
                  key={days}
                  onClick={() => setSimulateLateDays(days)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    simulateLateDays === days 
                      ? 'bg-[#FF6321] text-black font-extrabold' 
                      : 'bg-[#181818] text-[#A0A0A0] hover:bg-[#222222] hover:text-white border border-[#282828]'
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/50 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[#888888] block">Original Due Amount:</span>
                <span className="font-bold text-white">PKR {fin.totalRepaymentAmount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[#888888] block">Additional {simulateLateDays}-Day Penalty:</span>
                <span className="font-bold text-rose-400">+PKR {simulatedLateFee.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[#888888] block">Total New Amount Owed:</span>
                <span className="font-black text-rose-400 text-sm">PKR {simulatedTotalAfterLate.toLocaleString()}</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 5: PERMISSIONS & PRIVACY AUDIT */}
      {activeTab === 'privacy' && (
        <div className="space-y-6 animate-in fade-in">
          
          <div className="bg-[#111111] rounded-2xl border border-[#222222] p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                  <Smartphone className="w-5 h-5 text-purple-400" />
                  <span>Mobile App Privacy & Social Recovery Audit</span>
                </h3>
                <p className="text-xs text-[#888888] mt-0.5">
                  Evaluation of Android and iOS device permissions against SECP Circular No. 15 consumer privacy regulations.
                </p>
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                {permissionsList.some((p: any) => p.requested && p.concernLevel === 'HIGH') ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-950/60 border border-rose-800 text-rose-300">
                    High Privacy Exposure
                  </span>
                ) : permissionsList.some((p: any) => p.requested) ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/60 border border-emerald-800 text-emerald-300">
                    Standard KYC Permissions Only
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#1a1a1a] border border-[#333333] text-[#A0A0A0]">
                    No Device Permissions Requested
                  </span>
                )}
              </div>
            </div>

            {/* Privacy Rule Notice Banner */}
            {(!permissionsList.some((p: any) => p.requested) || analysis.devicePermissionsSpecified === false) ? (
              <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/40 flex items-start space-x-3">
                <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white">
                    Device permissions are not clearly specified in the submitted document.
                  </p>
                  <p className="text-[11px] text-[#A0A0A0] leading-relaxed">
                    LoanShield adheres to strict privacy risk scoring: generic statements like &ldquo;information required for verification&rdquo; are NOT inferred as sensitive device permissions. 0 privacy risk points are assigned unless an invasive permission (Contacts, Storage, Call Logs, etc.) is explicitly requested.
                  </p>
                </div>
              </div>
            ) : analysis.clauses?.some(c => c.originalText.toLowerCase().includes('no access to the borrower') || c.originalText.toLowerCase().includes('no phonebook')) ? (
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white">
                    Explicit Consumer Protection Clause Detected
                  </p>
                  <p className="text-[11px] text-[#A0A0A0] leading-relaxed">
                    The document explicitly guarantees: &ldquo;No access to the borrower&apos;s personal contacts is required.&rdquo; Only standard KYC verification is conducted.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {permissionsList.map((perm: any, idx: number) => {
                const isHigh = perm.concernLevel === 'HIGH';
                const isRequested = !!perm.requested;
                const displayName = perm.displayName || perm.label || perm.permission || `Permission #${idx + 1}`;
                const description = perm.whyItMatters || perm.description || 'App permission evaluated for privacy.';
                const abuseContext = perm.potentialAbuseContext || perm.potentialMisuse || 'Potential privacy exposure.';
                const recommendation = perm.recommendation || perm.regulatoryRecommendation || 'Grant only if strictly necessary for KYC.';

                return (
                  <div
                    key={perm.permission || perm.type || idx}
                    className={`p-4 rounded-2xl border ${
                      isRequested && isHigh ? 'border-rose-900/60 bg-rose-950/20' :
                      isRequested ? 'border-amber-900/60 bg-amber-950/20' :
                      'border-[#222222] bg-[#161616] opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white">{displayName}</span>
                      <div className="flex items-center space-x-1.5">
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-black uppercase ${
                          isHigh ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-[#222222] text-[#A0A0A0]'
                        }`}>
                          {perm.concernLevel || 'LOW'} CONCERN
                        </span>
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                          isRequested ? 'bg-rose-600 text-white' : 'bg-[#222222] text-[#777777]'
                        }`}>
                          {isRequested ? 'REQUESTED' : 'NOT REQUESTED'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#A0A0A0] mb-2">{description}</p>
                    
                    <div className="p-2.5 rounded-lg bg-[#111111] border border-[#242424] text-[11px] text-[#C0C0C0] space-y-1">
                      <div><strong className="text-white">Misuse Risk:</strong> {abuseContext}</div>
                      <div className="text-emerald-400"><strong className="text-white">SECP Advice:</strong> {recommendation}</div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>
      )}

      {/* TAB 6: PRE-BORROWING SECP CHECKLIST */}
      {activeTab === 'checklist' && (
        <div className="space-y-6 animate-in fade-in">
          
          <div className="bg-[#111111] rounded-2xl border border-[#222222] p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Pre-Borrowing Verification Checklist</span>
              </h3>
              <p className="text-xs text-[#888888] mt-0.5">
                Complete these crucial safety steps before signing any digital loan agreement in Pakistan.
              </p>
            </div>

            <div className="space-y-3">
              {checklistList.map((item: any, idx: number) => {
                const itemId = item.id || `check-${idx}`;
                const isChecked = checkedItems[itemId] || false;

                return (
                  <div
                    key={itemId}
                    onClick={() => toggleChecklist(itemId)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start space-x-3.5 ${
                      isChecked ? 'border-emerald-800 bg-emerald-950/20' : 'border-[#222222] bg-[#161616] hover:border-[#333333]'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isChecked ? 'bg-emerald-500 border-emerald-500 text-black font-bold' : 'border-[#444444] bg-[#111111]'
                    }`}>
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-bold text-white">{item.title}</h4>
                        {item.isCritical && (
                          <span className="px-1.5 py-0.5 rounded-sm bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-black uppercase">
                            CRITICAL
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#A0A0A0] mt-0.5">{item.description}</p>
                      {item.verificationTip && (
                        <p className="text-[11px] font-semibold text-emerald-400 mt-1">
                          💡 Tip: {item.verificationTip}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-xl bg-[#161616] border border-[#282828] text-white text-xs space-y-1">
              <h5 className="font-bold text-[#FF6321]">Official Regulatory Complaint Channels</h5>
              <p className="text-[#A0A0A0] text-[11px]">
                If you encounter illegal harassment or unauthorized contact extraction, report to SECP at <strong className="text-white">queries@secp.gov.pk</strong> and FIA Cyber Crime Wing at <strong className="text-white">1991</strong>.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* 5. INTERACTIVE AI LOAN ADVISOR CHAT DRAWER / MODAL */}
      {advisorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl bg-[#111111] rounded-2xl shadow-2xl border border-[#282828] overflow-hidden flex flex-col h-[560px] animate-in fade-in zoom-in-95">
            
            {/* Advisor Header */}
            <div className="bg-[#181818] border-b border-[#282828] text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FF6321] flex items-center justify-center text-black font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">LoanShield AI Advisor</h3>
                  <p className="text-[10px] text-[#888888]">{analysis.lenderName} Analysis Session</p>
                </div>
              </div>

              <button
                onClick={() => setAdvisorOpen(false)}
                className="p-1.5 rounded-lg text-[#888888] hover:text-white hover:bg-[#222222] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0a0a0a]">
              {advisorMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#FF6321] text-black font-semibold rounded-br-xs'
                        : 'bg-[#161616] border border-[#282828] text-[#E0E0E0] rounded-bl-xs shadow-2xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isAskingAdvisor && (
                <div className="flex justify-start">
                  <div className="bg-[#161616] border border-[#282828] text-[#888888] rounded-2xl p-3 text-xs flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-[#FF6321] animate-bounce"></span>
                    <span>Consulting loan agreement clauses...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Suggested Prompts */}
            <div className="p-2.5 bg-[#141414] border-t border-[#222222] flex gap-1.5 overflow-x-auto text-[11px]">
              <button
                onClick={() => setAdvisorQuestion("What happens if I delay payment for 1 week?")}
                className="px-2.5 py-1 rounded-md bg-[#1f1f1f] hover:bg-[#2a2a2a] text-[#C5C5C5] hover:text-white border border-[#2d2d2d] shrink-0"
              >
                Late 1 week impact?
              </button>
              <button
                onClick={() => setAdvisorQuestion("Can this lender call my family or employers?")}
                className="px-2.5 py-1 rounded-md bg-[#1f1f1f] hover:bg-[#2a2a2a] text-[#C5C5C5] hover:text-white border border-[#2d2d2d] shrink-0"
              >
                Can they call my contacts?
              </button>
              <button
                onClick={() => setAdvisorQuestion("Is the upfront deduction normal in Pakistan?")}
                className="px-2.5 py-1 rounded-md bg-[#1f1f1f] hover:bg-[#2a2a2a] text-[#C5C5C5] hover:text-white border border-[#2d2d2d] shrink-0"
              >
                Upfront cuts standard?
              </button>
            </div>

            {/* Input form */}
            <form onSubmit={handleAskAdvisor} className="p-3 bg-[#141414] border-t border-[#222222] flex items-center space-x-2">
              <input
                type="text"
                value={advisorQuestion}
                onChange={(e) => setAdvisorQuestion(e.target.value)}
                placeholder="Ask any question about this loan agreement..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0d0d0d] border border-[#262626] text-xs text-white placeholder-[#666666] focus:border-[#FF6321] focus:ring-1 focus:ring-[#FF6321] outline-none"
              />
              <button
                type="submit"
                disabled={isAskingAdvisor || !advisorQuestion.trim()}
                className="p-2.5 rounded-xl bg-[#FF6321] hover:bg-[#ff763b] text-black font-bold disabled:opacity-40 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
