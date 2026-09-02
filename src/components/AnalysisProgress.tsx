import React, { useEffect, useState } from 'react';
import { ShieldCheck, Check, Sparkles, AlertCircle, FileSearch, Calculator, Eye, Scale } from 'lucide-react';

interface AnalysisProgressProps {
  onComplete?: () => void;
}

const MILESTONES = [
  { id: 1, title: 'Parsing document layout and contract clauses', icon: FileSearch },
  { id: 2, title: 'Extracting principal, markup, and advertised terms', icon: Calculator },
  { id: 3, title: 'Auditing upfront deductions and service surcharges', icon: Eye },
  { id: 4, title: 'Comparing advertised promises with documented reality', icon: Scale },
  { id: 5, title: 'Evaluating recovery clauses and mobile permissions', icon: ShieldCheck },
  { id: 6, title: 'Running deterministic calculations & APR simulation', icon: Calculator },
  { id: 7, title: 'Generating explainable LoanShield Risk Assessment', icon: Sparkles }
];

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < MILESTONES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 600);

    return () => clearInterval(interval);
  }, []);

  const progressPercent = Math.min(100, Math.round(((currentStepIndex + 1) / MILESTONES.length) * 100));

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-in fade-in text-[#E0E0E0]">
      
      {/* Central Spinner Shield */}
      <div className="relative w-24 h-24 mx-auto mb-8">
        <div className="absolute inset-0 rounded-3xl bg-[#FF6321]/20 animate-ping"></div>
        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-[#FF6321] to-[#b33d0b] text-black flex items-center justify-center shadow-xl shadow-[#FF6321]/25">
          <Sparkles className="w-12 h-12 animate-pulse stroke-[2.5]" />
        </div>
      </div>

      <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">
        Auditing Loan Terms & Promises...
      </h2>
      <p className="text-xs text-[#888888] max-w-md mx-auto mb-8">
        Google Gemini is scanning contractual fine print, extracting fees, and evaluating financial and privacy risk factors.
      </p>

      {/* Progress Bar */}
      <div className="w-full bg-[#181818] rounded-full h-2.5 mb-8 overflow-hidden border border-[#262626]">
        <div 
          className="bg-[#FF6321] h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      {/* Milestones Checklist */}
      <div className="bg-[#111111] rounded-2xl border border-[#222222] p-6 shadow-xs text-left space-y-3">
        {MILESTONES.map((m, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          const Icon = m.icon;

          return (
            <div 
              key={m.id}
              className={`flex items-center space-x-3 p-2.5 rounded-xl transition-all ${
                isCurrent 
                  ? 'bg-[#FF6321]/10 border border-[#FF6321]/40 text-white font-bold' 
                  : isDone
                  ? 'text-[#E0E0E0] font-medium'
                  : 'text-[#555555] opacity-50'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 font-bold ${
                isDone 
                  ? 'bg-[#FF6321] text-black' 
                  : isCurrent
                  ? 'bg-[#FF6321]/30 text-[#FF6321] animate-pulse border border-[#FF6321]'
                  : 'bg-[#222222] text-[#666666]'
              }`}>
                {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : (idx + 1)}
              </div>

              <div className="flex-1 text-xs">
                {m.title}
              </div>

              {isCurrent && (
                <div className="w-2 h-2 rounded-full bg-[#FF6321] animate-ping"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pakistan Consumer Tip */}
      <div className="mt-8 p-4 rounded-xl bg-[#141414] border border-[#262626] text-white text-xs flex items-center justify-center space-x-2">
        <ShieldCheck className="w-4 h-4 text-[#FF6321] shrink-0" />
        <span className="text-[#A0A0A0]">
          Tip: Regulated SECP digital lenders in Pakistan are strictly forbidden from contacting your phonebook.
        </span>
      </div>

    </div>
  );
};
