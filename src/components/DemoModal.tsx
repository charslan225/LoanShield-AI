import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { DEMO_SCENARIOS } from '../data/demoScenarios';
import { DemoScenario } from '../types';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenario: DemoScenario) => void;
}

export const DemoModal: React.FC<DemoModalProps> = ({
  isOpen,
  onClose,
  onSelectScenario
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-2xl bg-[#111111] rounded-3xl shadow-2xl border border-[#222222] overflow-hidden flex flex-col max-h-[90vh] text-[#E0E0E0]">
        
        {/* Header */}
        <div className="bg-[#161616] p-5 flex items-center justify-between border-b border-[#222222]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF6321]/20 text-[#FF6321] border border-[#FF6321]/30 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Fictional Demo Scenarios</h3>
              <p className="text-[11px] text-[#888888]">Preloaded real-world test cases for instant evaluation</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#888888] hover:text-white hover:bg-[#222222] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scenarios List */}
        <div className="p-6 overflow-y-auto space-y-4">
          {DEMO_SCENARIOS.map((scenario) => {
            const isLow = scenario.riskBadge === 'LOW';
            const isHigh = scenario.riskBadge === 'HIGH';
            const isVeryHigh = scenario.riskBadge === 'VERY_HIGH';

            return (
              <div
                key={scenario.id}
                onClick={() => {
                  onSelectScenario(scenario);
                  onClose();
                }}
                className="p-4 rounded-2xl border border-[#222222] hover:border-[#333333] bg-[#141414] hover:bg-[#1a1a1a] transition-all cursor-pointer shadow-xs space-y-2.5 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-[#FF6321] transition-colors">{scenario.title}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    isLow ? 'bg-emerald-950/70 border border-emerald-800/50 text-emerald-300' :
                    isHigh ? 'bg-[#FF6321]/20 border border-[#FF6321]/40 text-[#FF6321]' :
                    'bg-rose-950/70 border border-rose-800/50 text-rose-300'
                  }`}>
                    {scenario.resultData.riskAssessment.overallScore}/100 • {scenario.riskBadge.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-[#A0A0A0] leading-relaxed">
                  {scenario.description}
                </p>

                <div className="p-2.5 rounded-xl bg-[#181818] border border-[#262626] text-[11px] flex justify-between text-[#888888]">
                  <span>Advertised: <strong className="text-white">PKR {scenario.resultData.financialBreakdown.advertisedAmount?.toLocaleString()}</strong></span>
                  <span>Net Disbursed: <strong className="text-emerald-400">PKR {scenario.resultData.financialBreakdown.actualDisbursedAmount.toLocaleString()}</strong></span>
                  <span>Deductions: <strong className="text-rose-400">PKR {scenario.resultData.financialBreakdown.totalDeductions.toLocaleString()}</strong></span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#141414] border-t border-[#222222] text-center">
          <p className="text-[11px] text-[#777777]">
            All demo lenders and terms are synthetic simulations modeled after Pakistani digital credit patterns.
          </p>
        </div>

      </div>
    </div>
  );
};
