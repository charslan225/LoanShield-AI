/**
 * LoanShield AI - Core Type Definitions
 * Consumer Protection & Financial Transparency Engine (Pakistan)
 */

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';

export type LanguageCode = 'en' | 'ur' | 'roman_ur';

export type RiskNature = 'KNOWN_RISK' | 'INFORMATION_GAP';

export type DeductionStatus = 
  | 'NO_DEDUCTIONS_MENTIONED' 
  | 'DEDUCTIONS_CONFIRMED' 
  | 'POTENTIAL_DEDUCTIONS_UNCLEAR';

export type SpecificationStatus = 
  | 'CLEARLY_SPECIFIED' 
  | 'PARTIALLY_SPECIFIED' 
  | 'NOT_SPECIFIED';

export interface EssentialFinancialTerm {
  id: string;
  termName: string; // e.g. "Actual amount received", "Exact charges", "Exact repayment schedule", "Total repayment amount", "Late payment calculation method"
  status: SpecificationStatus;
  documentedValue?: string | null;
  explanation: string;
  evidence?: string;
}

export interface FactorScore {
  name: string;
  category: string;
  riskType?: RiskNature; // KNOWN_RISK vs INFORMATION_GAP
  score: number; // 0 to maxWeight
  maxWeight: number;
  riskImpact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  finding: string;
  evidence?: string; // Document quote or specific source reference
  interpretation?: string; // Plain-language explanation of why it matters
  confidenceLevel?: 'HIGH' | 'MEDIUM' | 'ESTIMATED';
}

export interface RiskAssessment {
  overallScore: number; // 0 to 100
  riskLevel: RiskLevel;
  riskTitle: string;
  summaryReason: string;
  reasons: string[];
  positiveFactors: string[];
  factors: FactorScore[];
  confidenceScore: number; // e.g., 92%
  disclaimer: string;
}

export interface LoanCharge {
  id: string;
  name: string;
  type: 'UPFRONT_DEDUCTION' | 'RECURRING_FEE' | 'PENALTY' | 'TAX_GOVERNMENT' | 'OPTIONAL_SERVICE';
  amount: number | null;
  percentage?: number | null;
  isDeductedFromDisbursement: boolean;
  frequency?: 'ONCE' | 'MONTHLY' | 'WEEKLY' | 'DAILY' | 'ON_DEFAULT';
  description: string;
  isClearlyDisclosed: boolean;
  sourceEvidence?: string;
  confidenceLevel?: 'HIGH' | 'MEDIUM' | 'ESTIMATED';
}

export interface AdvertisedPromise {
  advertisedAmount: number | null;
  advertisedMarkupRate?: string | null; // e.g. "0.5% per month" or "Low Markup"
  advertisedDuration?: string | null; // e.g. "90 days"
  advertisedDisbursedAmount?: number | null;
  marketingClaims: string[]; // e.g. ["0% Processing Fee", "Instant Approval in 5 mins", "No Hidden Charges"]
  advertisedRepaymentAmount?: number | null;
}

export interface ContractReality {
  documentedPrincipal: number | null;
  documentedDisbursement: number | null;
  isDisbursementConfirmed?: boolean;
  documentedDurationDays: number | null;
  documentedMarkupRateAnnual: number | null;
  totalUpfrontDeductions: number | null;
  deductionStatus?: DeductionStatus;
  totalRecurringFees: number;
  documentedRepaymentAmount: number | null;
  isRepaymentConfirmed?: boolean;
  latePenaltyRatePerDay?: number | null;
  isSecpRegisteredClaimed?: boolean;
}

export interface DiscrepancyItem {
  id: string;
  category: 'LOAN_AMOUNT' | 'MARKUP_RATE' | 'FEES_AND_CHARGES' | 'REPAYMENT_TIMELINE' | 'OTHER';
  riskType?: RiskNature; // KNOWN_RISK vs INFORMATION_GAP
  promised: string;
  actual: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  isNumericalVariance?: boolean; // True ONLY when both values are known numbers and comparison is performed
  varianceAmount?: number | null;
  variancePercentage?: number | null;
  explanation: string;
  evidence?: string;
  interpretation?: string;
  confidenceLevel?: 'HIGH' | 'MEDIUM' | 'ESTIMATED';
}

export interface ContractClause {
  id: string;
  clauseTitle: string;
  originalText: string;
  category: 'RECOVERY' | 'INTEREST_AND_FEES' | 'PENALTIES' | 'DATA_PRIVACY' | 'DEFAULT_AND_LEGAL' | 'UNILATERAL_CHANGE';
  simpleExplanation: {
    en: string;
    ur: string;
    roman_ur: string;
  };
  whyItMatters: {
    en: string;
    ur: string;
    roman_ur: string;
  };
  riskFlag: 'GREEN' | 'YELLOW' | 'RED';
}

export type PermissionType = 
  | 'CONTACTS'
  | 'SMS'
  | 'CAMERA'
  | 'MICROPHONE'
  | 'LOCATION'
  | 'STORAGE_GALLERY'
  | 'PHONE_STATE'
  | 'CALL_LOGS';

export interface PermissionRisk {
  permission: PermissionType;
  displayName: string;
  requested: boolean;
  concernLevel: 'LOW' | 'MODERATE' | 'HIGH';
  whyItMatters: string;
  potentialAbuseContext: string;
  recommendation: string;
}

export interface FinancialBreakdown {
  advertisedAmount: number | null;
  principalAmount: number;
  totalDeductions: number | null; // null if unconfirmed or unclear
  deductionStatus?: DeductionStatus;
  deductionStatusText?: string;
  actualDisbursedAmount: number | null; // null if deferred / "To be determined after approval"
  isDisbursementConfirmed?: boolean;
  totalRepaymentAmount: number | null;
  isRepaymentConfirmed?: boolean;
  totalCostOfBorrowing: number | null; // Total Outflow - Actual Disbursed
  effectiveAnnualPercentageRate: number | null; // Estimated APR
  effectiveMonthlyRate: number | null;
  durationDays: number;
  numberOfInstallments: number;
  installmentAmount: number | null;
  chargesList: LoanCharge[];
  essentialTerms?: EssentialFinancialTerm[];
  assumptions: string[];
}

export interface ExecutiveSummary {
  actualAmountReceivedText: string;
  totalRepaymentText: string;
  chargesIdentifiedSummary: string;
  latePaymentImpactSummary: string;
  criticalClausesSummary: string;
  promiseDiscrepancySummary: string;
  privacyConcernsSummary: string;
  verificationAdvice: string[];
}

export interface AnalysisResult {
  id: string;
  createdAt: string;
  lenderName: string;
  appName?: string;
  analysisMethod: 'AGREEMENT_UPLOAD' | 'ADVERTISEMENT_UPLOAD' | 'MANUAL_ENTRY';
  fileName?: string;
  fileType?: string;
  isDemo?: boolean;
  demoScenarioId?: string;
  devicePermissionsSpecified?: boolean;
  
  // Core Modules
  riskAssessment: RiskAssessment;
  financialBreakdown: FinancialBreakdown;
  advertisedPromise: AdvertisedPromise;
  contractReality: ContractReality;
  discrepancies: DiscrepancyItem[];
  clauses: ContractClause[];
  permissions: PermissionRisk[];
  executiveSummary: ExecutiveSummary;
  verificationChecklist: {
    id: string;
    title: string;
    description: string;
    isCritical: boolean;
    verificationTip: string;
  }[];
  extractedRawTextSample?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  isGuest?: boolean;
}

export interface DemoScenario {
  id: string;
  title: string;
  tagline: string;
  description: string;
  riskBadge: RiskLevel;
  lenderName: string;
  advertisedText: string;
  contractSnippet: string;
  samplePermissions: PermissionType[];
  resultData: AnalysisResult;
}
