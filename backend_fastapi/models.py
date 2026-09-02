from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

class LoanAnalysisRequest(BaseModel):
    method: Optional[str] = "AGREEMENT_UPLOAD"
    lenderName: Optional[str] = None
    appName: Optional[str] = None
    advertisedAmount: Optional[float] = None
    advertisedDuration: Optional[str] = None
    advertisedMarkupRate: Optional[str] = None
    expectedRepayment: Optional[float] = None
    requestedPermissions: Optional[List[str]] = []
    fileBase64: Optional[str] = None
    fileMimeType: Optional[str] = None
    fileName: Optional[str] = None
    rawText: Optional[str] = None

class ManualAnalysisRequest(BaseModel):
    lenderName: Optional[str] = None
    appName: Optional[str] = None
    advertisedAmount: Optional[float] = None
    advertisedDuration: Optional[str] = None
    advertisedMarkupRate: Optional[str] = None
    expectedRepayment: Optional[float] = None
    manualPrincipal: Optional[float] = 50000
    manualDurationDays: Optional[int] = 30
    manualMarkupRateAnnual: Optional[float] = None
    manualUpfrontDeductions: Optional[float] = None
    manualChargesDescription: Optional[str] = None
    requestedPermissions: Optional[List[str]] = []

class AdvisorQuestionRequest(BaseModel):
    analysisId: str
    question: str

class AuthSignUpRequest(BaseModel):
    name: Optional[str] = "User"
    email: str
    password: Optional[str] = None

class AuthLoginRequest(BaseModel):
    email: str
    password: Optional[str] = None

class AuthResetRequest(BaseModel):
    email: str

class LoanCharge(BaseModel):
    name: str
    amount: float
    percentageOfPrincipal: float
    isDisclosedUpfront: bool
    isLegitimateUnderSECP: bool
    category: str
    explanation: str

class EssentialFinancialTerm(BaseModel):
    termName: str
    status: str  # CLEARLY_SPECIFIED | PARTIALLY_SPECIFIED | NOT_SPECIFIED
    details: str

class FactorScore(BaseModel):
    name: str
    category: str
    riskType: Optional[str] = "KNOWN_RISK"  # KNOWN_RISK | INFORMATION_GAP
    score: float
    maxWeight: float
    riskImpact: str  # LOW | MEDIUM | HIGH | CRITICAL
    finding: str
    evidence: Optional[str] = None
    interpretation: Optional[str] = None
    confidenceLevel: Optional[str] = "HIGH"

class DiscrepancyItem(BaseModel):
    id: str
    category: str
    riskType: Optional[str] = "KNOWN_RISK"
    promised: str
    actual: str
    severity: str
    explanation: str
    isNumericalVariance: Optional[bool] = False
    varianceAmount: Optional[float] = None
    variancePercentage: Optional[float] = None
    evidence: Optional[str] = None
    interpretation: Optional[str] = None
    confidenceLevel: Optional[str] = "HIGH"

class PermissionAudit(BaseModel):
    permission: str
    status: str
    riskLevel: str
    explanation: str
    secpViolation: bool

class SECPViolation(BaseModel):
    code: str
    title: str
    circularReference: str
    severity: str
    description: str
    actionRequired: str

class FinancialBreakdown(BaseModel):
    advertisedAmount: Optional[float] = None
    principalAmount: float
    totalDeductions: Optional[float] = None
    deductionStatus: Optional[str] = "NO_DEDUCTIONS"
    deductionStatusText: Optional[str] = "No upfront deductions identified"
    actualDisbursedAmount: Optional[float] = None
    isDisbursementConfirmed: Optional[bool] = True
    totalRepaymentAmount: Optional[float] = None
    isRepaymentConfirmed: Optional[bool] = True
    totalCostOfBorrowing: Optional[float] = None
    effectiveAnnualPercentageRate: Optional[float] = None
    effectiveMonthlyRate: Optional[float] = None
    durationDays: int
    numberOfInstallments: int
    installmentAmount: Optional[float] = None
    chargesList: List[LoanCharge] = []
    essentialTerms: Optional[List[EssentialFinancialTerm]] = []
    assumptions: List[str] = []
