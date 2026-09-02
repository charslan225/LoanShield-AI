import React from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  FileSearch, 
  Calculator, 
  Eye, 
  Scale, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Smartphone,
  BookOpen,
  TrendingDown,
  Layers,
  ChevronRight
} from 'lucide-react';
import { DEMO_SCENARIOS } from '../data/demoScenarios';
import { AnalysisResult, DemoScenario } from '../types';

interface LandingPageProps {
  onStartAnalysis: () => void;
  onSelectDemoScenario: (scenario: DemoScenario) => void;
  onOpenDemoModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartAnalysis,
  onSelectDemoScenario,
  onOpenDemoModal
}) => {
  return (
    <div className="space-y-20 pb-16 bg-[#050505] text-[#E0E0E0]">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0c0c0c] via-[#080808] to-[#050505] pt-12 sm:pt-20 pb-16 border-b border-[#222222]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            {/* Tagline Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#FF6321]/15 border border-[#FF6321]/30 text-[#FF6321] text-xs font-bold tracking-wide uppercase">
              <ShieldCheck className="w-4 h-4 text-[#FF6321]" />
              <span>Consumer Protection Platform for Pakistan</span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
              Know the Truth <br className="hidden sm:inline" />
              <span className="text-[#FF6321]">
                Before You Borrow.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-[#A0A0A0] font-normal leading-relaxed max-w-2xl mx-auto">
              Upload a loan offer or agreement and let AI help you understand hidden deductions, real interest rates, and privacy risks before you sign.
            </p>

            {/* Call to Actions */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                id="hero-cta-analyze"
                onClick={onStartAnalysis}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#FF6321] hover:bg-[#ff7538] text-black font-extrabold text-sm sm:text-base shadow-lg shadow-[#FF6321]/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-2.5"
              >
                <Sparkles className="w-5 h-5 stroke-[2.5]" />
                <span>Analyze Your Loan</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              <button
                id="hero-cta-demo"
                onClick={onOpenDemoModal}
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-[#141414] hover:bg-[#1f1f1f] text-[#E0E0E0] border border-[#2a2a2a] font-semibold text-sm sm:text-base shadow-xs transition-all flex items-center justify-center space-x-2"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF6321] animate-ping"></span>
                <span>Explore Fictional Demo Scenarios</span>
              </button>
            </div>

            {/* Trust highlights */}
            <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-semibold text-[#888888] max-w-xl mx-auto border-t border-[#222222] mt-8">
              <div className="flex items-center justify-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#FF6321]" />
                <span>Deterministic Math</span>
              </div>
              <div className="flex items-center justify-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#FF6321]" />
                <span>Urdu & Roman Urdu</span>
              </div>
              <div className="flex items-center justify-center space-x-1.5 col-span-2 sm:col-span-1">
                <CheckCircle2 className="w-4 h-4 text-[#FF6321]" />
                <span>100% Private & Free</span>
              </div>
            </div>

          </div>

          {/* 2. INTERACTIVE PROMISE VS REALITY HERO TEASER */}
          <div className="mt-14 max-w-4xl mx-auto rounded-2xl bg-[#111111] border border-[#222222] shadow-2xl overflow-hidden">
            <div className="bg-[#181818] border-b border-[#222222] text-white px-5 py-3 flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center space-x-2">
                <Scale className="w-4 h-4 text-[#FF6321]" />
                <span>Core Philosophy: Promise vs Reality</span>
              </div>
              <span className="text-[11px] text-[#888888]">Live Analytical Preview</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#222222]">
              
              {/* Left Column: What Was Promised */}
              <div className="p-6 bg-[#0a101d] space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    What Was Promised (Marketing)
                  </h4>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-blue-900/40">
                    <span className="text-[#888888]">Advertised Loan:</span>
                    <span className="font-extrabold text-white">PKR 100,000</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-blue-900/40">
                    <span className="text-[#888888]">Marketing Claim:</span>
                    <span className="font-semibold text-blue-400">"Low Markup & 0% Fee"</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-[#888888]">Advertised Payback:</span>
                    <span className="font-semibold text-[#A0A0A0]">90 Days Flexible</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-800/40 text-xs text-blue-300">
                  User expectation: Rs. 100,000 cash in hand with simple low monthly interest.
                </div>
              </div>

              {/* Right Column: What Document Actually Shows */}
              <div className="p-6 bg-[#160e08] space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-[#FF6321]"></span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF6321]">
                    What The Document Shows (Reality)
                  </h4>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-[#381f11]">
                    <span className="text-[#888888]">Actual Disbursed:</span>
                    <span className="font-extrabold text-rose-400">PKR 85,000 <span className="text-xs font-normal text-[#888888]">(-15% upfront cut)</span></span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#381f11]">
                    <span className="text-[#888888]">Processing & Admin Fees:</span>
                    <span className="font-semibold text-[#E0E0E0]">PKR 15,000 deducted</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-[#888888]">Late Penalty Clause:</span>
                    <span className="font-semibold text-amber-400">Daily Compounding (1.5%/day)</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#2b170c] border border-[#522912] text-xs text-[#FF854D] font-medium">
                  <strong>Discrepancy Detected:</strong> You receive Rs. 15,000 less cash in hand while still obligated to repay on Rs. 100,000.
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 3. THE PROBLEM IN PAKISTAN: WHY LOANSHIELD */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#FF6321] mb-2">
            The Digital Lending Crisis
          </h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
            Information Asymmetry in Digital Loans
          </h3>
          <p className="text-sm text-[#A0A0A0] mt-2">
            Millions of citizens are lured by instant smartphone loan apps without understanding the fine print.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-2xl bg-[#111111] border border-[#222222] shadow-xs hover:border-[#333333] transition-all">
            <div className="w-10 h-10 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-400 flex items-center justify-center font-bold mb-4">
              <TrendingDown className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">
              Massive Upfront Deductions
            </h4>
            <p className="text-xs text-[#888888] leading-relaxed">
              Borrowers expect Rs. 50,000 but receive only Rs. 38,000 due to undisclosed processing, platform, and risk assessment charges deducted before disbursement.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#111111] border border-[#222222] shadow-xs hover:border-[#333333] transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-400 flex items-center justify-center font-bold mb-4">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">
              7-Day Debt Rollover Traps
            </h4>
            <p className="text-xs text-[#888888] leading-relaxed">
              Tenures advertised as 90 days suddenly turn into strict 7-day deadlines with expensive weekly rollover extension fees that never reduce the principal debt.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#111111] border border-[#222222] shadow-xs hover:border-[#333333] transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-950/40 border border-purple-800/40 text-purple-400 flex items-center justify-center font-bold mb-4">
              <Smartphone className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">
              Invasive Phonebook Permissions
            </h4>
            <p className="text-xs text-[#888888] leading-relaxed">
              Unregulated apps request full access to your contacts, SMS, and photo gallery to threaten calling your friends, family, and employers if payment is delayed.
            </p>
          </div>

        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="bg-[#0b0b0b] border-y border-[#222222] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#FF6321] mb-2">
              Simple 4-Step Process
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              How LoanShield AI Protects You
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-5 rounded-xl bg-[#141414] border border-[#262626] space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#FF6321]/20 border border-[#FF6321]/40 text-[#FF6321] font-bold flex items-center justify-center text-sm">
                1
              </div>
              <h4 className="text-sm font-bold text-white">Upload or Enter</h4>
              <p className="text-xs text-[#888888] leading-relaxed">
                Upload a loan contract (PDF/Image), an advertisement screenshot, or manually type in the figures you were promised.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#141414] border border-[#262626] space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#FF6321]/20 border border-[#FF6321]/40 text-[#FF6321] font-bold flex items-center justify-center text-sm">
                2
              </div>
              <h4 className="text-sm font-bold text-white">AI Intelligence Engine</h4>
              <p className="text-xs text-[#888888] leading-relaxed">
                Google Gemini scans the document, extracts fee schedules, recognizes restrictive clauses, and audits permissions.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#141414] border border-[#262626] space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#FF6321]/20 border border-[#FF6321]/40 text-[#FF6321] font-bold flex items-center justify-center text-sm">
                3
              </div>
              <h4 className="text-sm font-bold text-white">Deterministic Math</h4>
              <p className="text-xs text-[#888888] leading-relaxed">
                Exact backend formulas calculate total deductions, net cash received in hand, total repayment, and true cost of borrowing.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#141414] border border-[#262626] space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#FF6321]/20 border border-[#FF6321]/40 text-[#FF6321] font-bold flex items-center justify-center text-sm">
                4
              </div>
              <h4 className="text-sm font-bold text-white">Explainable Risk Audit</h4>
              <p className="text-xs text-[#888888] leading-relaxed">
                Receive an explainable 0–100 risk assessment, Promise vs Reality table, and clause explanations in English, Urdu, and Roman Urdu.
              </p>
            </div>

          </div>

          <div className="mt-10 text-center">
            <button
              onClick={onStartAnalysis}
              className="px-6 py-3 rounded-xl bg-[#FF6321] hover:bg-[#ff7538] text-black font-bold text-sm shadow-md transition-colors inline-flex items-center space-x-2"
            >
              <span>Try Live Analysis Now</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

        </div>
      </section>

      {/* 5. FICTIONAL DEMO SCENARIOS SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#FF6321]/15 border border-[#FF6321]/30 text-[#FF6321] text-xs font-bold uppercase tracking-wider mb-2">
              <span>Fictional Demonstration Data</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Explore 3 Real-World Loan Scenarios
            </h3>
            <p className="text-sm text-[#888888] mt-1">
              One-click access to test how LoanShield AI audits transparent, hidden-charge, and predatory loan offers.
            </p>
          </div>

          <button
            onClick={onOpenDemoModal}
            className="mt-4 md:mt-0 text-xs font-bold text-[#FF6321] hover:text-[#ff7538] flex items-center space-x-1"
          >
            <span>View All Scenarios</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DEMO_SCENARIOS.map((scenario) => {
            const isLow = scenario.riskBadge === 'LOW';
            const isHigh = scenario.riskBadge === 'HIGH';
            const isVeryHigh = scenario.riskBadge === 'VERY_HIGH';

            return (
              <div 
                key={scenario.id}
                id={`card-demo-${scenario.id}`}
                className="rounded-2xl bg-[#111111] border border-[#222222] p-6 flex flex-col justify-between hover:border-[#3a3a3a] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold text-[#666666] uppercase tracking-wider">
                      {scenario.id.split('-')[0]}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold flex items-center space-x-1 ${
                      isLow ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50' :
                      isHigh ? 'bg-orange-950/60 text-[#FF854D] border border-orange-800/50' :
                      'bg-rose-950/60 text-rose-400 border border-rose-800/50'
                    }`}>
                      <span>Score: {scenario.resultData.riskAssessment.overallScore}/100</span>
                      <span>• {scenario.riskBadge.replace('_', ' ')}</span>
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white mb-1">
                    {scenario.title}
                  </h4>
                  <p className="text-xs font-medium text-[#FF6321] mb-3">
                    {scenario.lenderName}
                  </p>
                  <p className="text-xs text-[#888888] leading-relaxed mb-4">
                    {scenario.description}
                  </p>

                  <div className="p-3 rounded-xl bg-[#181818] border border-[#262626] text-xs space-y-1.5 mb-4">
                    <div className="flex justify-between">
                      <span className="text-[#888888]">Advertised:</span>
                      <span className="font-semibold text-white">PKR {scenario.resultData.financialBreakdown.advertisedAmount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#888888]">Actual Disbursed:</span>
                      <span className="font-bold text-emerald-400">PKR {scenario.resultData.financialBreakdown.actualDisbursedAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#888888]">Total Deductions:</span>
                      <span className="font-semibold text-rose-400">PKR {scenario.resultData.financialBreakdown.totalDeductions.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <button
                  id={`btn-load-demo-${scenario.id}`}
                  onClick={() => onSelectDemoScenario(scenario)}
                  className="w-full py-2.5 rounded-xl bg-[#1e1e1e] hover:bg-[#FF6321] hover:text-black text-white font-semibold text-xs border border-[#333333] transition-all flex items-center justify-center space-x-1.5"
                >
                  <span>Open Full AI Audit Report</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

      </section>

      {/* 6. KEY FEATURES & CAPABILITIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#FF6321] mb-2">
            Fintech Intelligence
          </h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
            Comprehensive Consumer Audit Features
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-2xl bg-[#111111] border border-[#222222]">
            <div className="w-9 h-9 rounded-lg bg-[#FF6321]/15 border border-[#FF6321]/30 text-[#FF6321] flex items-center justify-center font-bold mb-3">
              <Scale className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              Promise vs Reality Comparator
            </h4>
            <p className="text-xs text-[#888888] leading-relaxed">
              Juxtaposes marketing claims against binding contractual clauses to spot hidden cuts, tenure variances, and markup misrepresentations.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#111111] border border-[#222222]">
            <div className="w-9 h-9 rounded-lg bg-[#FF6321]/15 border border-[#FF6321]/30 text-[#FF6321] flex items-center justify-center font-bold mb-3">
              <Calculator className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              Deterministic Financial Calculations
            </h4>
            <p className="text-xs text-[#888888] leading-relaxed">
              Zero LLM mathematical hallucinations. Deterministic formulas calculate total deductions, net cash, cost of borrowing, and true APR.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#111111] border border-[#222222]">
            <div className="w-9 h-9 rounded-lg bg-[#FF6321]/15 border border-[#FF6321]/30 text-[#FF6321] flex items-center justify-center font-bold mb-3">
              <BookOpen className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              Urdu & Roman Urdu Clause Explainer
            </h4>
            <p className="text-xs text-[#888888] leading-relaxed">
              Translates complex legal boilerplate into plain, everyday English, Nastaliq Urdu (اردو), and easy Roman Urdu for every citizen.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#111111] border border-[#222222]">
            <div className="w-9 h-9 rounded-lg bg-[#FF6321]/15 border border-[#FF6321]/30 text-[#FF6321] flex items-center justify-center font-bold mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              App Privacy & Permission Audit
            </h4>
            <p className="text-xs text-[#888888] leading-relaxed">
              Evaluates smartphone permissions (Contacts, Photos, SMS, Location) and highlights potential social recovery and harassment risks.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#111111] border border-[#222222]">
            <div className="w-9 h-9 rounded-lg bg-[#FF6321]/15 border border-[#FF6321]/30 text-[#FF6321] flex items-center justify-center font-bold mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              Explainable 7-Factor Risk Score
            </h4>
            <p className="text-xs text-[#888888] leading-relaxed">
              No black-box scoring. Transparent weights evaluate transparency, upfront deductions, late fees, ambiguous clauses, and privacy.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#111111] border border-[#222222]">
            <div className="w-9 h-9 rounded-lg bg-[#FF6321]/15 border border-[#FF6321]/30 text-[#FF6321] flex items-center justify-center font-bold mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              Pre-Borrowing Verification Checklist
            </h4>
            <p className="text-xs text-[#888888] leading-relaxed">
              Generates tailored action items to verify SECP licenses, bank account transfers, and safe device permission management.
            </p>
          </div>

        </div>

      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-10">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#FF6321] mb-2">
            Borrower Help Center
          </h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
            Frequently Asked Questions
          </h3>
        </div>

        <div className="space-y-4">
          
          <div className="p-5 rounded-xl bg-[#111111] border border-[#222222]">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-[#FF6321] shrink-0" />
              <span>Does LoanShield AI declare an app illegal or fraudulent?</span>
            </h4>
            <p className="text-xs text-[#888888] leading-relaxed mt-2 pl-6">
              No. LoanShield AI strictly adheres to consumer protection principles. It analyzes mathematical discrepancies, fee structures, and privacy risks to provide an informational risk assessment. Official determination of legality rests solely with the Securities and Exchange Commission of Pakistan (SECP) and law enforcement.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#111111] border border-[#222222]">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-[#FF6321] shrink-0" />
              <span>How is the LoanShield Risk Score calculated?</span>
            </h4>
            <p className="text-xs text-[#888888] leading-relaxed mt-2 pl-6">
              The score ranges from 0 to 100 based on 7 transparent factors: Financial Transparency (20 pts), Upfront Deductions (15 pts), Late Payment Penalties (15 pts), Contract Clarity (15 pts), Promise vs Reality Discrepancies (15 pts), Data Privacy (10 pts), and Recovery Terms (10 pts).
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#111111] border border-[#222222]">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-[#FF6321] shrink-0" />
              <span>Are my uploaded documents and personal data saved or sold?</span>
            </h4>
            <p className="text-xs text-[#888888] leading-relaxed mt-2 pl-6">
              No. Uploaded documents are processed strictly for real-time AI risk analysis. We do not monetize or share user data with lenders, credit bureaus, or advertising networks.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#111111] border border-[#222222]">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-[#FF6321] shrink-0" />
              <span>What should I do if a digital loan app is calling my contacts?</span>
            </h4>
            <p className="text-xs text-[#888888] leading-relaxed mt-2 pl-6">
              In Pakistan, unauthorized harassment and third-party contact scraping violate SECP Circular No. 15 and PECA cybercrime laws. Revoke contact permissions in your phone settings immediately and file a complaint with the FIA Cyber Crime Wing helpline at 1991 and SECP at queries@secp.gov.pk.
            </p>
          </div>

        </div>

      </section>

    </div>
  );
};
