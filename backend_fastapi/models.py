from __future__ import annotations

from typing import List, Literal, Optional
from pydantic import BaseModel

RiskLevel = Literal['LOW', 'MODERATE', 'HIGH', 'VERY_HIGH', 'CRITICAL']
LanguageCode = Literal['en', 'ur', 'roman_ur']
RiskNature = Literal['KNOWN_RISK', 'INFORMATION_GAP']
DeductionStatus = Literal['NO_DEDUCTIONS_MENTIONED', 'DEDUCTIONS_CONFIRMED', 'POTENTIAL_DEDUCTIONS_UNCLEAR']
SpecificationStatus = Literal['CLEARLY_SPECIFIED', 'PARTIALLY_SPECIFIED', 'NOT_SPECIFIED']
AnalysisMethod = Literal['AGREEMENT_UPLOAD', 'ADVERTISEMENT_UPLOAD', 'MANUAL_ENTRY']
PermissionType = Literal[
    'CONTACTS', 'SMS', 'CAMERA', 'MICROPHONE', 'LOCATION', 'STORAGE_GALLERY', 'PHONE_STATE', 'CALL_LOGS'
]
ClauseCategory = Literal[
    'RECOVERY', 'INTEREST_AND_FEES', 'PENALTIES', 'DATA_PRIVACY', 'DEFAULT_AND_LEGAL', 'UNILATERAL_CHANGE'
]
ChargeType = Literal['UPFRONT_DEDUCTION', 'RECURRING_FEE', 'PENALTY', 'TAX_GOVERNMENT', 'OPTIONAL_SERVICE']
ChargeFrequency = Literal['ONCE', 'MONTHLY', 'WEEKLY', 'DAILY', 'ON_DEFAULT']
DiscrepancyCategory = Literal['LOAN_AMOUNT', 'MARKUP_RATE', 'FEES_AND_CHARGES', 'REPAYMENT_TIMELINE', 'OTHER']
RiskFlag = Literal['GREEN', 'YELLOW', 'RED']
ConcernLevel = Literal['LOW', 'MODERATE', 'HIGH']
RiskImpact = Literal['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
ConfidenceLevel = Literal['HIGH', 'MEDIUM', 'ESTIMATED']


class EssentialFinancialTerm(BaseModel):
    id: str
    termName: str
    status: SpecificationStatus
    documentedValue: Optional[str] = None
    explanation: str
    evidence: Optional[str] = None


class FactorScore(BaseModel):
    name: str
    category: str
    riskType: Optional[RiskNature] = None
    score: float
    maxWeight: float
    riskImpact: RiskImpact
    finding: str
    evidence: Optional[str] = None
    interpretation: Optional[str] = None
    confidenceLevel: Optional[ConfidenceLevel] = None


class RiskAssessment(BaseModel):
    overallScore: float
    riskLevel: RiskLevel
    riskTitle: str
    summaryReason: str
    reasons: List[str] = []
    positiveFactors: List[str] = []
    factors: List[FactorScore] = []
    confidenceScore: float
    disclaimer: str


class LoanCharge(BaseModel):
    id: str
    name: str
    type: ChargeType
    amount: Optional[float] = None
    percentage: Optional[float] = None
    isDeductedFromDisbursement: bool
    frequency: Optional[ChargeFrequency] = None
    description: str
    isClearlyDisclosed: bool
    sourceEvidence: Optional[str] = None
    confidenceLevel: Optional[ConfidenceLevel] = None


class AdvertisedPromise(BaseModel):
    advertisedAmount: Optional[float] = None
    advertisedMarkupRate: Optional[str] = None
    advertisedDuration: Optional[str] = None
    advertisedDisbursedAmount: Optional[float] = None
    marketingClaims: List[str] = []
    advertisedRepaymentAmount: Optional[float] = None


class ContractReality(BaseModel):
    documentedPrincipal: Optional[float] = None
    documentedDisbursement: Optional[float] = None
    isDisbursementConfirmed: Optional[bool] = None
    documentedDurationDays: Optional[int] = None
    documentedMarkupRateAnnual: Optional[float] = None
    totalUpfrontDeductions: Optional[float] = None
    deductionStatus: Optional[DeductionStatus] = None
    totalRecurringFees: float = 0
    documentedRepaymentAmount: Optional[float] = None
    isRepaymentConfirmed: Optional[bool] = None
    latePenaltyRatePerDay: Optional[float] = None
    isSecpRegisteredClaimed: Optional[bool] = None


class DiscrepancyItem(BaseModel):
    id: str
    category: DiscrepancyCategory
    riskType: Optional[RiskNature] = None
    promised: str
    actual: str
    severity: Literal['INFO', 'WARNING', 'CRITICAL']
    isNumericalVariance: Optional[bool] = None
    varianceAmount: Optional[float] = None
    variancePercentage: Optional[float] = None
    explanation: str
    evidence: Optional[str] = None
    interpretation: Optional[str] = None
    confidenceLevel: Optional[ConfidenceLevel] = None


class MultilingualText(BaseModel):
    en: str
    ur: str
    roman_ur: str


class ContractClause(BaseModel):
    id: str
    clauseTitle: str
    originalText: str
    category: ClauseCategory
    simpleExplanation: MultilingualText
    whyItMatters: MultilingualText
    riskFlag: RiskFlag


class PermissionRisk(BaseModel):
    permission: PermissionType
    displayName: str
    requested: bool
    concernLevel: ConcernLevel
    whyItMatters: str
    potentialAbuseContext: str
    recommendation: str


class FinancialBreakdown(BaseModel):
    advertisedAmount: Optional[float] = None
    principalAmount: float
    totalDeductions: Optional[float] = None
    deductionStatus: Optional[DeductionStatus] = None
    deductionStatusText: Optional[str] = None
    actualDisbursedAmount: Optional[float] = None
    isDisbursementConfirmed: Optional[bool] = None
    totalRepaymentAmount: Optional[float] = None
    isRepaymentConfirmed: Optional[bool] = None
    totalCostOfBorrowing: Optional[float] = None
    effectiveAnnualPercentageRate: Optional[float] = None
    effectiveMonthlyRate: Optional[float] = None
    durationDays: int
    numberOfInstallments: int
    installmentAmount: Optional[float] = None
    chargesList: List[LoanCharge] = []
    essentialTerms: Optional[List[EssentialFinancialTerm]] = None
    assumptions: List[str] = []


class ExecutiveSummary(BaseModel):
    actualAmountReceivedText: str
    totalRepaymentText: str
    chargesIdentifiedSummary: str
    latePaymentImpactSummary: str
    criticalClausesSummary: str
    promiseDiscrepancySummary: str
    privacyConcernsSummary: str
    verificationAdvice: List[str] = []


class VerificationItem(BaseModel):
    id: str
    title: str
    description: str
    isCritical: bool
    verificationTip: str


class AnalysisResult(BaseModel):
    id: str
    createdAt: str
    lenderName: str
    appName: Optional[str] = None
    analysisMethod: AnalysisMethod
    fileName: Optional[str] = None
    fileType: Optional[str] = None
    isDemo: Optional[bool] = False
    demoScenarioId: Optional[str] = None
    devicePermissionsSpecified: Optional[bool] = False
    riskAssessment: RiskAssessment
    financialBreakdown: FinancialBreakdown
    advertisedPromise: AdvertisedPromise
    contractReality: ContractReality
    discrepancies: List[DiscrepancyItem] = []
    clauses: List[ContractClause] = []
    permissions: List[PermissionRisk] = []
    executiveSummary: ExecutiveSummary
    verificationChecklist: List[VerificationItem] = []
    extractedRawTextSample: Optional[str] = None


class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    isGuest: Optional[bool] = False


class StoredUser(UserProfile):
    password: Optional[str] = None
    createdAt: str


class DemoScenario(BaseModel):
    id: str
    title: str
    tagline: str
    description: str
    riskBadge: RiskLevel
    lenderName: str
    advertisedText: str
    contractSnippet: str
    samplePermissions: List[PermissionType]
    resultData: AnalysisResult


class SecpViolation(BaseModel):
    code: str
    title: str
    severity: str
    description: str
    actionRequired: str


# Request/response helpers
class SuccessResponse(BaseModel):
    success: bool


class AnalysisResponse(SuccessResponse):
    analysis: Optional[AnalysisResult] = None
    error: Optional[str] = None


class HistoryItem(BaseModel):
    id: str
    createdAt: str
    lenderName: str
    analysisMethod: AnalysisMethod
    isDemo: bool
    principalAmount: float
    actualDisbursed: Optional[float] = None
    totalRepayment: Optional[float] = None
    riskScore: float
    riskLevel: RiskLevel
    riskTitle: str


class HistoryResponse(SuccessResponse):
    history: List[HistoryItem] = []
