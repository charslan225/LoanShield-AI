import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  PenTool, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Shield, 
  Smartphone, 
  X, 
  FileCheck,
  Info,
  DollarSign,
  Clock,
  ArrowRight,
  ArrowLeft,
  FileCode
} from 'lucide-react';
import { PermissionType } from '../types';
import { useLanguage } from '../utils/LanguageContext';

interface AnalyzePageProps {
  onStartAnalysisProcess: (formData: any) => void;
  onSelectDemo: () => void;
}

export const AnalyzePage: React.FC<AnalyzePageProps> = ({
  onStartAnalysisProcess,
  onSelectDemo
}) => {
  const { t, isUrdu } = useLanguage();
  const [currentStep, setCurrentStep] = useState<number>(1);
  
  // Method
  const [method, setMethod] = useState<'AGREEMENT_UPLOAD' | 'ADVERTISEMENT_UPLOAD' | 'MANUAL_ENTRY'>('AGREEMENT_UPLOAD');
  
  // Promise & Lender Info
  const [lenderName, setLenderName] = useState('');
  const [appName, setAppName] = useState('');
  const [advertisedAmount, setAdvertisedAmount] = useState<string>('50000');
  const [advertisedDuration, setAdvertisedDuration] = useState('30 Days');
  const [advertisedMarkupRate, setAdvertisedMarkupRate] = useState('Low Markup / 0.1% daily');
  const [expectedRepayment, setExpectedRepayment] = useState<string>('');

  // File Upload
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [fileMimeType, setFileMimeType] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Details (if manual method)
  const [manualPrincipal, setManualPrincipal] = useState<string>('50000');
  const [manualDurationDays, setManualDurationDays] = useState<string>('30');
  const [manualMarkupRateAnnual, setManualMarkupRateAnnual] = useState<string>('24');
  const [manualUpfrontDeductions, setManualUpfrontDeductions] = useState<string>('6000');
  const [manualChargesDescription, setManualChargesDescription] = useState<string>('');

  // Permissions
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionType[]>([]);

  const togglePermission = (perm: PermissionType) => {
    if (selectedPermissions.includes(perm)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== perm));
    } else {
      setSelectedPermissions([...selectedPermissions, perm]);
    }
  };

  const handleFileChange = (file: File) => {
    if (!file) return;
    setUploadedFile(file);
    // Reset any manually selected permissions so permissions are extracted cleanly from document
    setSelectedPermissions([]);
    let mime = file.type;
    if (!mime) {
      if (file.name.endsWith('.pdf')) mime = 'application/pdf';
      else if (file.name.endsWith('.png')) mime = 'image/png';
      else if (file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')) mime = 'image/jpeg';
      else if (file.name.endsWith('.webp')) mime = 'image/webp';
      else if (file.name.endsWith('.txt')) mime = 'text/plain';
    }
    setFileMimeType(mime);

    // If it's a text file, read the text content directly too
    if (file.type.includes('text') || file.name.endsWith('.txt')) {
      const textReader = new FileReader();
      textReader.onload = () => {
        if (typeof textReader.result === 'string') {
          setRawText(textReader.result);
        }
      };
      textReader.readAsText(file);
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Content = result.split(',')[1] || result;
      setFileBase64(base64Content);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const loadSampleContractPreset = (presetType: 'nano_7day' | 'digital_30day' | 'secp_compliant') => {
    if (presetType === 'nano_7day') {
      setLenderName('EasyCash Nano Credits (Fictional)');
      setAppName('Instant Paisa App');
      setAdvertisedAmount('25000');
      setAdvertisedDuration('7 Days');
      setAdvertisedMarkupRate('0% Interest Promotion');
      setExpectedRepayment('25000');
      setSelectedPermissions(['CONTACTS', 'STORAGE_GALLERY', 'CALL_LOGS', 'LOCATION', 'SMS']);
      setRawText(`DIGITAL FACILITY SANCTION LETTER & DISBURSEMENT AGREEMENT
Lender: EasyCash Nano Credit Technologies (Private) Limited
Borrower Sanction Limit: PKR 25,000
Disbursed Net to Bank Account: PKR 18,250
Upfront Charges Deducted:
  - Account Verification Fee: PKR 2,500
  - Technical Processing Charge: PKR 2,750
  - Risk Assessment Surcharge: PKR 1,500
Tenure: 7 Calendar Days from disbursement date.
Total Repayment Required at Maturity: PKR 26,250
Late Default Rate: 2.5% per calendar day calculated on gross PKR 25,000 facility.
Collection & Recovery: Borrower explicitly permits lender and field collection agencies to access contacts, employer, and social references to secure repayment.`);
    } else if (presetType === 'digital_30day') {
      setLenderName('QuickLoan Digital NBFC (Fictional)');
      setAppName('QuickCash Mobile');
      setAdvertisedAmount('50000');
      setAdvertisedDuration('30 Days');
      setAdvertisedMarkupRate('Low Markup / 0.1% daily');
      setExpectedRepayment('51500');
      setSelectedPermissions(['CONTACTS', 'STORAGE_GALLERY', 'CAMERA', 'LOCATION']);
      setRawText(`DIGITAL MICRO-CREDIT CONTRACT & DISBURSEMENT MEMORANDUM
Lender: QuickLoan Digital NBFC Pvt Ltd.
Borrower Credit Facility: PKR 50,000
Net Disbursement: PKR 39,000 (after PKR 6,500 Risk Assessment Fee, PKR 3,000 Platform Fee, PKR 1,500 Processing Fee).
Term: 30 Calendar Days.
Total Repayment: PKR 52,500 due on Day 30.
Late Payment Penalty: Daily default charge of 1.5% per day accrued on original facility for each day of default.
Recovery Clause: Borrower authorizes lender to contact employer, family references, and phonebook contacts to facilitate repayment.`);
    } else {
      setLenderName('TrustMicro Finance Bank (SECP Licensed)');
      setAppName('Trust Bank Digital');
      setAdvertisedAmount('100000');
      setAdvertisedDuration('90 Days');
      setAdvertisedMarkupRate('24% Annualized APR');
      setExpectedRepayment('106000');
      setSelectedPermissions(['CAMERA', 'LOCATION']);
      setRawText(`REGULATED DIGITAL PERSONAL FINANCING AGREEMENT
Lender: TrustMicro Finance Bank Limited (SECP NBFC License #0982-REG)
Approved Facility: PKR 100,000
Net Disbursed: PKR 98,500 (PKR 1,500 standard FED & documentation stamp fee).
Term: 90 Days (3 Monthly Installments of PKR 35,333).
Annual Percentage Rate (APR): 24.0% per annum flat.
Late Penalty: Fixed PKR 500 late fee per installment if overdue by > 7 days.
Data Privacy: In accordance with SECP Circular No. 15, no phonebook or photo storage access is requested or stored.`);
    }
  };

  const handleSubmit = () => {
    onStartAnalysisProcess({
      method,
      lenderName: lenderName || (method === 'MANUAL_ENTRY' ? 'Fast Loan Provider' : 'Digital Lender'),
      appName: appName || 'Digital Credit App',
      advertisedAmount: advertisedAmount ? parseFloat(advertisedAmount) : null,
      advertisedDuration,
      advertisedMarkupRate,
      expectedRepayment: expectedRepayment ? parseFloat(expectedRepayment) : null,
      fileBase64: fileBase64 || undefined,
      fileMimeType: fileMimeType || undefined,
      fileName: uploadedFile?.name || undefined,
      rawText: rawText || undefined,
      manualPrincipal: manualPrincipal ? parseFloat(manualPrincipal) : undefined,
      manualDurationDays: manualDurationDays ? parseInt(manualDurationDays) : undefined,
      manualMarkupRateAnnual: manualMarkupRateAnnual ? parseFloat(manualMarkupRateAnnual) : undefined,
      manualUpfrontDeductions: manualUpfrontDeductions ? parseFloat(manualUpfrontDeductions) : undefined,
      manualChargesDescription,
      requestedPermissions: selectedPermissions
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-[#E0E0E0]">
      
      {/* Wizard Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FF6321]/15 border border-[#FF6321]/30 text-[#FF6321] text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 text-[#FF6321]" />
          <span>AI Intelligence Engine</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Analyze a Digital Loan
        </h1>
        <p className="text-sm text-[#888888] mt-1 max-w-lg mx-auto">
          Compare advertised promises with the contract reality before you sign or disburse.
        </p>
      </div>

      {/* Step Indicators */}
      <div className="mb-10">
        <div className="grid grid-cols-3 gap-2 max-w-lg mx-auto">
          {[
            { step: 1, title: 'Method & Promises' },
            { step: 2, title: 'Document & Details' },
            { step: 3, title: 'App Permissions' },
          ].map((item) => {
            const isActive = currentStep === item.step;
            const isCompleted = currentStep > item.step;

            return (
              <div 
                key={item.step}
                onClick={() => isCompleted && setCurrentStep(item.step)}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  isActive 
                    ? 'border-[#FF6321] bg-[#FF6321]/10 text-white font-bold shadow-xs' 
                    : isCompleted
                    ? 'border-[#333333] bg-[#141414] text-[#E0E0E0] font-semibold'
                    : 'border-[#222222] bg-[#0c0c0c] text-[#666666] opacity-75'
                }`}
              >
                <div className="text-xs uppercase tracking-wider text-[#888888] mb-0.5">
                  Step {item.step}
                </div>
                <div className="text-xs truncate">
                  {item.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1: METHOD & ADVERTISED PROMISES */}
      {currentStep === 1 && (
        <div className="space-y-8 animate-in fade-in">
          
          {/* Method Selection */}
          <div className="bg-[#111111] rounded-2xl border border-[#222222] p-6 shadow-xs">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-[#FF6321] text-black font-bold flex items-center justify-center text-xs">1</span>
              <span>Select How You Want to Analyze the Loan</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <button
                id="btn-method-agreement"
                type="button"
                onClick={() => setMethod('AGREEMENT_UPLOAD')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  method === 'AGREEMENT_UPLOAD'
                    ? 'border-[#FF6321] bg-[#FF6321]/10 shadow-xs'
                    : 'border-[#222222] hover:border-[#333333] bg-[#161616]'
                }`}
              >
                <FileText className={`w-6 h-6 mb-2 ${method === 'AGREEMENT_UPLOAD' ? 'text-[#FF6321]' : 'text-[#888888]'}`} />
                <div className="font-bold text-xs text-white">Upload Loan Agreement</div>
                <p className="text-[11px] text-[#888888] mt-1">PDF contract, sanction letter, or screenshot of terms.</p>
              </button>

              <button
                id="btn-method-ad"
                type="button"
                onClick={() => setMethod('ADVERTISEMENT_UPLOAD')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  method === 'ADVERTISEMENT_UPLOAD'
                    ? 'border-[#FF6321] bg-[#FF6321]/10 shadow-xs'
                    : 'border-[#222222] hover:border-[#333333] bg-[#161616]'
                }`}
              >
                <ImageIcon className={`w-6 h-6 mb-2 ${method === 'ADVERTISEMENT_UPLOAD' ? 'text-[#FF6321]' : 'text-[#888888]'}`} />
                <div className="font-bold text-xs text-white">Upload Loan Ad / Offer</div>
                <p className="text-[11px] text-[#888888] mt-1">Facebook/Instagram ad or app store screenshot.</p>
              </button>

              <button
                id="btn-method-manual"
                type="button"
                onClick={() => setMethod('MANUAL_ENTRY')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  method === 'MANUAL_ENTRY'
                    ? 'border-[#FF6321] bg-[#FF6321]/10 shadow-xs'
                    : 'border-[#222222] hover:border-[#333333] bg-[#161616]'
                }`}
              >
                <PenTool className={`w-6 h-6 mb-2 ${method === 'MANUAL_ENTRY' ? 'text-[#FF6321]' : 'text-[#888888]'}`} />
                <div className="font-bold text-xs text-white">Enter Details Manually</div>
                <p className="text-[11px] text-[#888888] mt-1">Type loan figures, advertised fees, and tenure.</p>
              </button>

            </div>
          </div>

          {/* Advertised / Promised Info Form */}
          <div className="bg-[#111111] rounded-2xl border border-[#222222] p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-[#FF6321] text-black font-bold flex items-center justify-center text-xs">2</span>
                <span>What Were You Promised? (Optional Context)</span>
              </h3>
              <p className="text-xs text-[#888888] mt-1">
                LoanShield compares these initial claims against the actual document clauses to detect discrepancies.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#A0A0A0] mb-1">
                  Loan Provider / Company Name
                </label>
                <input
                  id="input-lender-name"
                  type="text"
                  placeholder="e.g., QuickCash, FastLoan, ABC FinCorp"
                  value={lenderName}
                  onChange={(e) => setLenderName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#2a2a2a] bg-[#181818] focus:border-[#FF6321] focus:ring-1 focus:ring-[#FF6321] text-xs text-white placeholder-[#555555]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A0A0A0] mb-1">
                  Mobile App Name (if applicable)
                </label>
                <input
                  id="input-app-name"
                  type="text"
                  placeholder="e.g., EasyRupee App"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#2a2a2a] bg-[#181818] focus:border-[#FF6321] focus:ring-1 focus:ring-[#FF6321] text-xs text-white placeholder-[#555555]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A0A0A0] mb-1">
                  Advertised Loan Amount (PKR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-[#666666] font-bold">PKR</span>
                  <input
                    id="input-advertised-amount"
                    type="number"
                    placeholder="50000"
                    value={advertisedAmount}
                    onChange={(e) => setAdvertisedAmount(e.target.value)}
                    className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-[#2a2a2a] bg-[#181818] focus:border-[#FF6321] focus:ring-1 focus:ring-[#FF6321] text-xs text-white placeholder-[#555555]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A0A0A0] mb-1">
                  Promised Tenure / Duration
                </label>
                <input
                  id="input-advertised-duration"
                  type="text"
                  placeholder="e.g., 90 Days, 3 Months, 30 Days"
                  value={advertisedDuration}
                  onChange={(e) => setAdvertisedDuration(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#2a2a2a] bg-[#181818] focus:border-[#FF6321] focus:ring-1 focus:ring-[#FF6321] text-xs text-white placeholder-[#555555]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A0A0A0] mb-1">
                  Markup / Interest Mentioned
                </label>
                <input
                  id="input-advertised-markup"
                  type="text"
                  placeholder="e.g., 0.1% daily, Low Markup, 0% Interest"
                  value={advertisedMarkupRate}
                  onChange={(e) => setAdvertisedMarkupRate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#2a2a2a] bg-[#181818] focus:border-[#FF6321] focus:ring-1 focus:ring-[#FF6321] text-xs text-white placeholder-[#555555]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A0A0A0] mb-1">
                  Expected Total Repayment (if told)
                </label>
                <input
                  id="input-expected-repayment"
                  type="number"
                  placeholder="e.g., 53000"
                  value={expectedRepayment}
                  onChange={(e) => setExpectedRepayment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#2a2a2a] bg-[#181818] focus:border-[#FF6321] focus:ring-1 focus:ring-[#FF6321] text-xs text-white placeholder-[#555555]"
                />
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={onSelectDemo}
              className="text-xs font-semibold text-[#888888] hover:text-[#FF6321] transition-colors"
            >
              Or choose a preloaded demo scenario
            </button>
            <button
              id="btn-step1-next"
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-6 py-3 rounded-xl bg-[#FF6321] hover:bg-[#ff7538] text-black font-extrabold text-xs shadow-md transition-colors flex items-center space-x-2"
            >
              <span>Next: Document & Details</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

        </div>
      )}

      {/* STEP 2: DOCUMENT UPLOAD OR MANUAL INPUT */}
      {currentStep === 2 && (
        <div className="space-y-8 animate-in fade-in">
          
          {method !== 'MANUAL_ENTRY' ? (
            <div className="bg-[#111111] rounded-2xl border border-[#222222] p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Upload Loan Document or Image
                  </h3>
                  <p className="text-xs text-[#888888] mt-0.5">
                    Supports PDF, PNG, JPG, JPEG, WEBP documents or agreement text files.
                  </p>
                </div>

                {/* Preset Loaders */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] uppercase font-bold text-[#666666]">Load Real Sample:</span>
                  <button
                    type="button"
                    onClick={() => loadSampleContractPreset('nano_7day')}
                    className="text-[11px] font-bold text-rose-400 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/40 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    7-Day Nano
                  </button>
                  <button
                    type="button"
                    onClick={() => loadSampleContractPreset('digital_30day')}
                    className="text-[11px] font-bold text-[#FF6321] bg-[#FF6321]/15 hover:bg-[#FF6321]/25 border border-[#FF6321]/30 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    30-Day Credit
                  </button>
                  <button
                    type="button"
                    onClick={() => loadSampleContractPreset('secp_compliant')}
                    className="text-[11px] font-bold text-emerald-400 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-800/40 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    SECP Regulated
                  </button>
                </div>
              </div>

              {/* Drag & Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#FF6321] bg-[#FF6321]/10 scale-[0.99]'
                    : uploadedFile
                    ? 'border-[#FF6321]/50 bg-[#FF6321]/5'
                    : 'border-[#2a2a2a] hover:border-[#3a3a3a] bg-[#161616]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp,text/plain,.pdf,.png,.jpg,.jpeg,.webp,.txt"
                  onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
                  className="hidden"
                />

                {uploadedFile ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-[#FF6321]/20 text-[#FF6321] mx-auto flex items-center justify-center">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-white">{uploadedFile.name}</p>
                    <p className="text-[11px] text-[#888888]">{(uploadedFile.size / 1024).toFixed(1)} KB • Ready for AI extraction</p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setUploadedFile(null); setFileBase64(''); }}
                      className="text-[11px] font-semibold text-rose-400 hover:underline"
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-[#222222] text-[#888888] mx-auto flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-[#E0E0E0]">
                      Drag & drop your document here, or <span className="text-[#FF6321] underline">browse files</span>
                    </p>
                    <p className="text-[11px] text-[#666666]">PDF, PNG, JPG up to 20MB</p>
                  </div>
                )}
              </div>

              {/* Raw Text Paste fallback */}
              <div>
                <label className="block text-xs font-semibold text-[#A0A0A0] mb-1">
                  Or Paste Document / Agreement Text Directly:
                </label>
                <textarea
                  id="input-raw-text"
                  rows={4}
                  placeholder="Paste contract clauses, sanction letter text, or terms here..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#2a2a2a] bg-[#181818] focus:border-[#FF6321] focus:ring-1 focus:ring-[#FF6321] text-xs font-mono text-[#E0E0E0] placeholder-[#555555]"
                />
              </div>

            </div>
          ) : (
            /* Manual Input Mode */
            <div className="bg-[#111111] rounded-2xl border border-[#222222] p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-white">
                Loan Contract Parameters
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A0A0A0] mb-1">
                    Documented Principal Amount (PKR)
                  </label>
                  <input
                    id="input-manual-principal"
                    type="number"
                    value={manualPrincipal}
                    onChange={(e) => setManualPrincipal(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2a2a2a] bg-[#181818] text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A0A0A0] mb-1">
                    Loan Duration (in Days)
                  </label>
                  <input
                    id="input-manual-duration"
                    type="number"
                    value={manualDurationDays}
                    onChange={(e) => setManualDurationDays(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2a2a2a] bg-[#181818] text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A0A0A0] mb-1">
                    Known Upfront Deductions / Fees (PKR)
                  </label>
                  <input
                    id="input-manual-deductions"
                    type="number"
                    placeholder="e.g., 6000"
                    value={manualUpfrontDeductions}
                    onChange={(e) => setManualUpfrontDeductions(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2a2a2a] bg-[#181818] text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A0A0A0] mb-1">
                    Documented Annual Markup Rate (%)
                  </label>
                  <input
                    id="input-manual-markup"
                    type="number"
                    placeholder="e.g., 24"
                    value={manualMarkupRateAnnual}
                    onChange={(e) => setManualMarkupRateAnnual(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2a2a2a] bg-[#181818] text-xs text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#A0A0A0] mb-1">
                    Describe any known penalties or unusual clauses
                  </label>
                  <input
                    id="input-manual-charges-desc"
                    type="text"
                    placeholder="e.g., 1.5% daily late penalty, contact permission clause"
                    value={manualChargesDescription}
                    onChange={(e) => setManualChargesDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2a2a2a] bg-[#181818] text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2.5 rounded-xl border border-[#2a2a2a] bg-[#161616] text-xs font-semibold text-[#E0E0E0] hover:bg-[#222222] flex items-center space-x-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              id="btn-step2-next"
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-6 py-3 rounded-xl bg-[#FF6321] hover:bg-[#ff7538] text-black font-extrabold text-xs shadow-md transition-colors flex items-center space-x-2"
            >
              <span>Next: App Permissions</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

        </div>
      )}

      {/* STEP 3: APP PERMISSIONS AUDIT & SUBMIT */}
      {currentStep === 3 && (
        <div className="space-y-8 animate-in fade-in">
          
          <div className="bg-[#111111] rounded-2xl border border-[#222222] p-6 shadow-xs space-y-4">
            <div>
              <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-purple-950/60 border border-purple-800/40 text-purple-300 text-[11px] font-bold uppercase tracking-wider mb-2">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Privacy & Recovery Risk Audit</span>
              </div>
              <h3 className="text-sm font-bold text-white">
                Which Mobile Permissions Did the Loan App Request?
              </h3>
              <p className="text-xs text-[#888888] mt-1">
                Select the permissions requested by the mobile application on your Android or iOS device.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                { 
                  type: 'CONTACTS' as PermissionType, 
                  label: 'Contacts (Read Phonebook)', 
                  risk: 'HIGH', 
                  desc: 'Used by aggressive lenders to call friends and family.' 
                },
                { 
                  type: 'STORAGE_GALLERY' as PermissionType, 
                  label: 'Photos / Gallery Storage', 
                  risk: 'HIGH', 
                  desc: 'Access to private family pictures and documents.' 
                },
                { 
                  type: 'CALL_LOGS' as PermissionType, 
                  label: 'Call Logs & History', 
                  risk: 'HIGH', 
                  desc: 'Monitors who you speak with and call frequency.' 
                },
                { 
                  type: 'SMS' as PermissionType, 
                  label: 'SMS Messages', 
                  risk: 'MODERATE', 
                  desc: 'Can read OTPs and banking transaction alerts.' 
                },
                { 
                  type: 'LOCATION' as PermissionType, 
                  label: 'Precise GPS Location', 
                  risk: 'MODERATE', 
                  desc: 'Tracks physical whereabouts and residence.' 
                },
                { 
                  type: 'MICROPHONE' as PermissionType, 
                  label: 'Microphone (Audio Recording)', 
                  risk: 'MODERATE', 
                  desc: 'Audio recording capability.' 
                },
                { 
                  type: 'CAMERA' as PermissionType, 
                  label: 'Camera Access', 
                  risk: 'LOW', 
                  desc: 'Standard for CNIC photo and selfie KYC verification.' 
                },
                { 
                  type: 'PHONE_STATE' as PermissionType, 
                  label: 'Phone State & Device ID', 
                  risk: 'LOW', 
                  desc: 'Device binding to prevent account cloning.' 
                },
              ].map((perm) => {
                const isSelected = selectedPermissions.includes(perm.type);
                const isHigh = perm.risk === 'HIGH';

                return (
                  <div
                    key={perm.type}
                    onClick={() => togglePermission(perm.type)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                      isSelected
                        ? isHigh 
                          ? 'border-rose-500/60 bg-rose-950/30' 
                          : 'border-[#FF6321]/60 bg-[#FF6321]/10'
                        : 'border-[#222222] bg-[#161616] hover:bg-[#1a1a1a]'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isSelected 
                        ? isHigh ? 'bg-rose-600 border-rose-600 text-white' : 'bg-[#FF6321] border-[#FF6321] text-black'
                        : 'border-[#333333] bg-[#222222]'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{perm.label}</span>
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-sm ${
                          isHigh ? 'bg-rose-950/70 border border-rose-800/40 text-rose-300' :
                          perm.risk === 'MODERATE' ? 'bg-amber-950/70 border border-amber-800/40 text-amber-300' :
                          'bg-[#222222] text-[#A0A0A0]'
                        }`}>
                          {perm.risk} RISK
                        </span>
                      </div>
                      <p className="text-[11px] text-[#888888] mt-0.5">{perm.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submission Banner */}
          <div className="p-4 rounded-xl bg-[#141414] border border-[#262626] text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-[#FF6321]/20 border border-[#FF6321]/40 text-[#FF6321] flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <p className="text-xs text-[#A0A0A0]">
                AI extraction and deterministic financial calculations are ready to run.
              </p>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2.5 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] text-xs font-semibold text-[#E0E0E0] hover:bg-[#252525]"
              >
                Back
              </button>
              <button
                id="btn-submit-ai-analysis"
                type="button"
                onClick={handleSubmit}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#FF6321] hover:bg-[#ff7538] text-black font-extrabold text-xs shadow-md transition-colors flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
                <span>Analyze with AI</span>
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
