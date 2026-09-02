import React, { useEffect, useState } from 'react';
import { 
  History, 
  Trash2, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  FileText, 
  Search, 
  Filter 
} from 'lucide-react';
import { AnalysisResult } from '../types';

interface DashboardPageProps {
  onSelectAnalysis: (analysisId: string) => void;
  onStartNewAnalysis: () => void;
}

interface HistoryItem {
  id: string;
  createdAt: string;
  lenderName: string;
  analysisMethod: string;
  isDemo?: boolean;
  principalAmount: number;
  actualDisbursed: number;
  totalRepayment: number;
  riskScore: number;
  riskLevel: string;
  riskTitle: string;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onSelectAnalysis,
  onStartNewAnalysis
}) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analysis-history');
      const data = await res.json();
      if (data.success && data.history) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/analysis/${id}`, { method: 'DELETE' });
      setHistory(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.lenderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.riskTitle && item.riskTitle.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filterLevel === 'ALL' || item.riskLevel === filterLevel;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-[#E0E0E0]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FF6321]/15 border border-[#FF6321]/30 text-[#FF6321] text-xs font-bold uppercase tracking-wider mb-2">
            <History className="w-3.5 h-3.5" />
            <span>Audit History & Archives</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Loan Audits Dashboard
          </h1>
          <p className="text-xs text-[#888888] mt-0.5">
            Review past document analyses, risk scores, and financial deductions.
          </p>
        </div>

        <button
          id="btn-dashboard-new-analysis"
          onClick={onStartNewAnalysis}
          className="px-5 py-2.5 rounded-xl bg-[#FF6321] hover:bg-[#ff7538] text-black text-xs font-bold shadow-md shadow-[#FF6321]/20 transition-all flex items-center space-x-2 shrink-0 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 stroke-[2.5]" />
          <span>Start New Analysis</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[#111111] rounded-2xl border border-[#222222] p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#666666] absolute left-3.5 top-3" />
          <input
            id="input-dashboard-search"
            type="text"
            placeholder="Search by lender name or risk keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#2a2a2a] bg-[#181818] text-xs text-white placeholder-[#555555] focus:border-[#FF6321] focus:ring-1 focus:ring-[#FF6321]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-[#666666]" />
          <select
            id="select-dashboard-risk-filter"
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#2a2a2a] text-xs text-[#E0E0E0] bg-[#181818] font-semibold focus:border-[#FF6321]"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MODERATE">Moderate Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="VERY_HIGH">Very High Risk</option>
          </select>
        </div>
      </div>

      {/* History Grid */}
      {loading ? (
        <div className="text-center py-16 text-[#666666] text-xs">
          Loading past audits...
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="bg-[#111111] rounded-2xl border border-[#222222] p-12 text-center space-y-3">
          <FileText className="w-10 h-10 text-[#444444] mx-auto" />
          <h3 className="text-sm font-bold text-white">No Audits Found</h3>
          <p className="text-xs text-[#888888] max-w-sm mx-auto">
            You haven't run any loan audits matching these filters yet. Upload a loan document or load a demo scenario to see full reports.
          </p>
          <button
            onClick={onStartNewAnalysis}
            className="px-5 py-2.5 rounded-xl bg-[#FF6321] text-black text-xs font-bold mt-2 hover:bg-[#ff7538] transition-colors"
          >
            Analyze a Loan Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHistory.map((item) => {
            const isLow = item.riskLevel === 'LOW';
            const isHigh = item.riskLevel === 'HIGH';
            const isVeryHigh = item.riskLevel === 'VERY_HIGH';

            return (
              <div
                key={item.id}
                onClick={() => onSelectAnalysis(item.id)}
                className="bg-[#111111] rounded-2xl border border-[#222222] p-5 shadow-xs hover:shadow-lg hover:border-[#333333] transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-bold text-[#777777] uppercase tracking-wider">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      {item.isDemo && (
                        <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase bg-amber-950/60 text-amber-300 border border-amber-800/40">
                          Demo
                        </span>
                      )}
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      isLow ? 'bg-emerald-950/70 border border-emerald-800/50 text-emerald-300' :
                      isHigh ? 'bg-[#FF6321]/20 border border-[#FF6321]/40 text-[#FF6321]' :
                      'bg-rose-950/70 border border-rose-800/50 text-rose-300'
                    }`}>
                      {item.riskScore}/100 • {item.riskLevel.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-white mb-1 group-hover:text-[#FF6321] transition-colors">
                    {item.lenderName}
                  </h3>
                  <p className="text-xs text-[#888888] line-clamp-1 mb-4">
                    {item.riskTitle}
                  </p>

                  <div className="p-3 rounded-xl bg-[#161616] border border-[#242424] text-xs space-y-1.5 mb-4">
                    <div className="flex justify-between">
                      <span className="text-[#888888]">Principal:</span>
                      <span className="font-semibold text-white">PKR {item.principalAmount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#888888]">Net Disbursed:</span>
                      <span className="font-bold text-emerald-400">PKR {item.actualDisbursed?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#888888]">Total Repayment:</span>
                      <span className="font-bold text-[#FF6321]">PKR {item.totalRepayment?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#222222]">
                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-1.5 rounded-lg text-[#666666] hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <span className="text-xs font-bold text-[#FF6321] flex items-center space-x-1 group-hover:translate-x-0.5 transition-transform">
                    <span>View Audit</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
