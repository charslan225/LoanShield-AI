import React from 'react';
import { ShieldCheck, AlertTriangle, PhoneCall, ExternalLink, Mail, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#080808] text-[#888888] border-t border-[#1f1f1f] pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Prominent Mandatory Legal & Consumer Protection Disclaimer */}
        <div id="footer-disclaimer-box" className="p-4 sm:p-5 rounded-2xl bg-[#111111] border border-[#262626] mb-10">
          <div className="flex items-start space-x-3.5">
            <div className="p-2 rounded-xl bg-amber-950/40 text-amber-400 shrink-0 mt-0.5 border border-amber-800/40">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-1">
                Official Consumer Protection Disclaimer
              </h4>
              <p className="text-xs leading-relaxed text-[#A0A0A0] font-normal">
                LoanShield AI provides AI-assisted information and risk analysis based on the information and documents submitted by the user. It does not provide legal, financial, or regulatory advice and does not determine whether a lender has violated the law. Always verify lending entities on the official Securities and Exchange Commission of Pakistan (SECP) and State Bank of Pakistan (SBP) registries before borrowing.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#1c1c1c]">
          
          {/* Col 1: About */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-[#FF6321] flex items-center justify-center text-black font-bold">
                <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                LOAN<span className="text-[#FF6321]">SHIELD</span> AI
              </span>
            </div>
            <p className="text-xs text-[#888888] leading-relaxed">
              Pakistan's AI-powered digital loan transparency and consumer protection engine. Bridging information asymmetry to protect borrowers.
            </p>
            <div className="pt-2 flex items-center space-x-2 text-[11px] text-[#888888]">
              <Lock className="w-3.5 h-3.5 text-[#FF6321]" />
              <span>Zero data monetization • Privacy First</span>
            </div>
          </div>

          {/* Col 2: Regulatory & Protection Resources */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Official Pakistani Helplines
            </h5>
            <ul className="space-y-2 text-xs text-[#888888]">
              <li className="flex items-center space-x-2">
                <PhoneCall className="w-3.5 h-3.5 text-[#FF6321] shrink-0" />
                <span>FIA Cyber Crime Wing: <strong className="text-[#E0E0E0]">1991</strong></span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-[#FF6321] shrink-0" />
                <span>SECP Consumer Desk: queries@secp.gov.pk</span>
              </li>
              <li className="flex items-center space-x-2">
                <ExternalLink className="w-3.5 h-3.5 text-[#FF6321] shrink-0" />
                <a 
                  href="https://www.secp.gov.pk" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="hover:text-[#FF6321] transition-colors underline"
                >
                  SECP Licensed NBFC Registry
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <ExternalLink className="w-3.5 h-3.5 text-[#FF6321] shrink-0" />
                <a 
                  href="https://sunwai.sbp.org.pk" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="hover:text-[#FF6321] transition-colors underline"
                >
                  SBP Sunwai Portal
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Key Features */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Core Capabilities
            </h5>
            <ul className="space-y-1.5 text-xs text-[#888888]">
              <li>• Promise vs Reality Comparator</li>
              <li>• Deterministic Net Disbursal Math</li>
              <li>• Explainable 7-Factor Risk Score</li>
              <li>• Urdu & Roman Urdu Clause Explainer</li>
              <li>• Device Privacy & Permission Audit</li>
              <li>• SECP Pre-Borrowing Checklist</li>
            </ul>
          </div>

          {/* Col 4: AI & Security Pillars */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Audit Transparency
            </h5>
            <p className="text-xs text-[#888888] leading-relaxed mb-3">
              Powered by Google Gemini 3.7 Flash for multimodal document extraction, coupled with mathematical deterministic financial calculations.
            </p>
            <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#161616] text-[#FF6321] border border-[#FF6321]/30 text-[11px] font-semibold">
              SECP Circular No. 15 Compliant
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#666666]">
          <p>© {new Date().getFullYear()} LoanShield AI. Know the Truth Before You Borrow.</p>
          <p className="mt-2 sm:mt-0">Crafted for Pakistani Financial Consumer Transparency</p>
        </div>

      </div>
    </footer>
  );
};
