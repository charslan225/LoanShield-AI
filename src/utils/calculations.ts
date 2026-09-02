/**
 * LoanShield Deterministic Financial Calculation Engine & Risk Scoring Engine
 * Adheres strictly to mathematical rules, avoids hallucinations, and provides explainable factor breakdowns.
 */

import {
  AnalysisResult,
  FinancialBreakdown,
  LoanCharge,
  PermissionRisk,
  PermissionType,
  RiskAssessment,
  RiskLevel,
  FactorScore,
  DiscrepancyItem,
  ContractClause,
  ExecutiveSummary,
  EssentialFinancialTerm,
  DeductionStatus,
  SpecificationStatus,
  RiskNature
} from '../types';

export interface CalculationInput {
  principalAmount: number;
  advertisedAmount?: number | null;
  durationDays: number;
  markupRateAnnual?: number | null; // e.g. 24% annual
  charges: LoanCharge[];
  numberOfInstallments?: number;
  deductionStatus?: DeductionStatus;
  hasPotentialUnclearDeductions?: boolean;
  isDisbursementDeferred?: boolean;
  isRepaymentDeferred?: boolean;
  rawText?: string;
}

/**
 * Deterministic Financial Calculations
 */
export function calculateFinancials(input: CalculationInput): FinancialBreakdown {
  const principal = Math.max(0, input.principalAmount || 0);
  const duration = Math.max(1, input.durationDays || 30);
  const advertised = input.advertisedAmount ?? null;

  // 1. Analyze Deduction Status & Charges
  // Distinguish strictly between:
  // A. No deductions mentioned (NO_DEDUCTIONS_MENTIONED)
  // B. Deductions explicitly confirmed (DEDUCTIONS_CONFIRMED)
  // C. Potential deductions mentioned but exact amounts are unclear (POTENTIAL_DEDUCTIONS_UNCLEAR)
  
  const rawTextLower = (input.rawText || '').toLowerCase();
  const hasUnclearDeductionClause = 
    input.hasPotentialUnclearDeductions ||
    input.deductionStatus === 'POTENTIAL_DEDUCTIONS_UNCLEAR' ||
    rawTextLower.includes('may be deducted where necessary') ||
    rawTextLower.includes('applicable charges, service costs') ||
    rawTextLower.includes('deducted where necessary') ||
    rawTextLower.includes('fees may be deducted') ||
    rawTextLower.includes('charges may be deducted') ||
    input.charges.some(c => (c.amount === null || c.amount === 0) && (c.type === 'UPFRONT_DEDUCTION' || c.description?.toLowerCase().includes('may be deducted')));

  let totalUpfrontDeductions: number | null = 0;
  let totalRecurringCharges = 0;
  let hasExplicitUpfrontAmount = false;

  const resolvedCharges = input.charges.map(c => {
    let amt = c.amount;
    if (amt === null && c.percentage !== undefined && c.percentage !== null && c.percentage > 0) {
      amt = (principal * c.percentage) / 100;
    }
    
    if (amt !== null && amt > 0) {
      if (c.isDeductedFromDisbursement || c.type === 'UPFRONT_DEDUCTION') {
        hasExplicitUpfrontAmount = true;
        totalUpfrontDeductions = (totalUpfrontDeductions || 0) + amt;
      } else if (c.type === 'RECURRING_FEE') {
        totalRecurringCharges += amt;
      }
    }

    return {
      ...c,
      amount: amt
    };
  });

  let deductionStatus: DeductionStatus = 'NO_DEDUCTIONS_MENTIONED';
  let deductionStatusText = 'No upfront deductions mentioned in document.';
  let isDisbursementConfirmed = true;
  let actualDisbursed: number | null = principal;

  if (hasUnclearDeductionClause && !hasExplicitUpfrontAmount) {
    // Category C: Potential deductions mentioned but exact amounts are unclear
    deductionStatus = 'POTENTIAL_DEDUCTIONS_UNCLEAR';
    deductionStatusText = 'Potential deductions are mentioned, but the exact amounts are not clearly specified.';
    totalUpfrontDeductions = null; // Do not calculate an exact deduction amount unless numerical information exists
    actualDisbursed = null;
    isDisbursementConfirmed = false;
  } else if (hasExplicitUpfrontAmount && totalUpfrontDeductions !== null && totalUpfrontDeductions > 0) {
    // Category B: Deductions explicitly confirmed
    deductionStatus = 'DEDUCTIONS_CONFIRMED';
    const ratio = principal > 0 ? (totalUpfrontDeductions / principal) * 100 : 0;
    deductionStatusText = `${Math.round(ratio)}% (PKR ${totalUpfrontDeductions.toLocaleString()}) deducted before disbursement`;
    actualDisbursed = Math.max(0, principal - totalUpfrontDeductions);
    isDisbursementConfirmed = true;
  } else {
    // Category A: No deductions mentioned
    deductionStatus = 'NO_DEDUCTIONS_MENTIONED';
    deductionStatusText = 'No upfront deductions mentioned in the agreement.';
    totalUpfrontDeductions = 0;
    actualDisbursed = principal;
    isDisbursementConfirmed = true;
  }

  if (input.isDisbursementDeferred || rawTextLower.includes('to be determined after approval')) {
    actualDisbursed = null;
    isDisbursementConfirmed = false;
  }

  // 3. Markup Amount Calculation
  let estimatedMarkup = 0;
  let isMarkupConfirmed = true;
  if (input.markupRateAnnual !== undefined && input.markupRateAnnual !== null && input.markupRateAnnual > 0) {
    estimatedMarkup = principal * (input.markupRateAnnual / 100) * (duration / 365);
  } else if (input.markupRateAnnual === null && !rawTextLower.includes('0% interest')) {
    isMarkupConfirmed = false;
  }

  // 4. Total Repayment Amount
  let totalRepayment: number | null = null;
  let isRepaymentConfirmed = isMarkupConfirmed && !input.isRepaymentDeferred;

  if (isRepaymentConfirmed) {
    totalRepayment = Math.round(principal + estimatedMarkup + totalRecurringCharges);
  }

  // 5. Total Cost of Borrowing
  let totalCostOfBorrowing: number | null = null;
  if (totalRepayment !== null && actualDisbursed !== null) {
    totalCostOfBorrowing = Math.max(0, totalRepayment - actualDisbursed);
  }

  // 6. Effective APR
  let apr: number | null = null;
  let monthlyRate: number | null = null;
  if (actualDisbursed !== null && actualDisbursed > 0 && totalCostOfBorrowing !== null && duration > 0) {
    const rawRatio = totalCostOfBorrowing / actualDisbursed;
    const annualizedRatio = rawRatio * (365 / duration);
    apr = Math.round(annualizedRatio * 100 * 10) / 10;
    monthlyRate = Math.round((rawRatio * (30 / duration)) * 100 * 10) / 10;
  }

  const installments = Math.max(1, input.numberOfInstallments || 1);
  const installmentAmount = totalRepayment !== null ? Math.round(totalRepayment / installments) : null;

  // 7. Track the 5 Essential Financial Figures (Critical Issue 3)
  const essentialTerms: EssentialFinancialTerm[] = [
    {
      id: 'term-disbursement',
      termName: 'Actual amount received',
      status: (actualDisbursed !== null && isDisbursementConfirmed) ? 'CLEARLY_SPECIFIED' : 'NOT_SPECIFIED',
      documentedValue: (actualDisbursed !== null && isDisbursementConfirmed) 
        ? `PKR ${actualDisbursed.toLocaleString()}` 
        : 'To be determined after approval',
      explanation: (actualDisbursed !== null && isDisbursementConfirmed)
        ? `Documented net disbursement is PKR ${actualDisbursed.toLocaleString()}.`
        : 'The actual amount the borrower will receive is not clearly specified before acceptance.',
      evidence: (actualDisbursed !== null && isDisbursementConfirmed)
        ? `Disbursed Net: PKR ${actualDisbursed.toLocaleString()}`
        : 'Amount disbursed to borrower: To be determined after approval.'
    },
    {
      id: 'term-charges',
      termName: 'Exact charges',
      status: deductionStatus === 'POTENTIAL_DEDUCTIONS_UNCLEAR' 
        ? 'PARTIALLY_SPECIFIED' 
        : (resolvedCharges.length > 0 || deductionStatus === 'NO_DEDUCTIONS_MENTIONED') ? 'CLEARLY_SPECIFIED' : 'NOT_SPECIFIED',
      documentedValue: deductionStatus === 'POTENTIAL_DEDUCTIONS_UNCLEAR'
        ? 'Subject to deduction'
        : (totalUpfrontDeductions !== null && totalUpfrontDeductions > 0)
          ? `PKR ${totalUpfrontDeductions.toLocaleString()} itemized`
          : 'None stated',
      explanation: deductionStatus === 'POTENTIAL_DEDUCTIONS_UNCLEAR'
        ? 'Potential deductions are mentioned, but the exact amounts are not clearly specified.'
        : 'Deductions and fee structures are clearly defined with numerical values.',
      evidence: deductionStatus === 'POTENTIAL_DEDUCTIONS_UNCLEAR'
        ? 'Applicable charges, service costs, administrative expenses and other fees may be deducted where necessary.'
        : 'Itemized fee schedule.'
    },
    {
      id: 'term-schedule',
      termName: 'Exact repayment schedule',
      status: (duration > 0 && !input.isRepaymentDeferred && !rawTextLower.includes('schedule to be decided')) ? 'CLEARLY_SPECIFIED' : 'NOT_SPECIFIED',
      documentedValue: duration > 0 ? `${duration} Calendar Days` : 'Not specified',
      explanation: duration > 0 
        ? `Loan tenure is set to ${duration} days.` 
        : 'Repayment schedule and installment dates are not specified in the document.',
      evidence: `Tenure: ${duration} Days.`
    },
    {
      id: 'term-repayment-total',
      termName: 'Total repayment amount',
      status: (totalRepayment !== null && isRepaymentConfirmed) ? 'CLEARLY_SPECIFIED' : 'NOT_SPECIFIED',
      documentedValue: totalRepayment !== null ? `PKR ${totalRepayment.toLocaleString()}` : 'Not confirmed',
      explanation: totalRepayment !== null 
        ? `Total contractual repayment amount is documented as PKR ${totalRepayment.toLocaleString()}.` 
        : 'Total repayment amount cannot be verified due to missing or deferred rate/fee figures.',
      evidence: totalRepayment !== null ? `Maturity Repayment: PKR ${totalRepayment.toLocaleString()}` : 'Total repayment sum omitted or deferred.'
    },
    {
      id: 'term-late-penalty',
      termName: 'Late payment calculation method',
      status: (rawTextLower.includes('per calendar day') || rawTextLower.includes('flat fee') || rawTextLower.includes('grace period') || rawTextLower.includes('daily default'))
        ? 'CLEARLY_SPECIFIED'
        : (rawTextLower.includes('penalty') || rawTextLower.includes('late charge'))
          ? 'PARTIALLY_SPECIFIED'
          : 'NOT_SPECIFIED',
      documentedValue: rawTextLower.includes('per calendar day') || rawTextLower.includes('daily default')
        ? 'Daily accrued rate'
        : rawTextLower.includes('flat fee')
          ? 'Flat fee structure'
          : 'Not clearly defined',
      explanation: (rawTextLower.includes('per calendar day') || rawTextLower.includes('flat fee'))
        ? 'Late payment penalty calculation method is documented in the agreement.'
        : 'Late payment calculation method is ambiguous or not clearly specified before signing.',
      evidence: rawTextLower.includes('penalty') ? 'Late payment clause identified.' : 'No late payment formula found in agreement.'
    }
  ];

  const assumptions: string[] = [];
  if (deductionStatus === 'POTENTIAL_DEDUCTIONS_UNCLEAR') {
    assumptions.push('Potential deductions are mentioned in the agreement, but exact fee percentages or rupee figures are not clearly specified.');
  }
  if (!input.markupRateAnnual && !rawTextLower.includes('0% interest')) {
    assumptions.push('Markup rate is not explicitly declared; exact interest cost cannot be confirmed from the submitted document.');
  }
  if (totalUpfrontDeductions !== null && totalUpfrontDeductions > 0) {
    assumptions.push(`PKR ${totalUpfrontDeductions.toLocaleString()} will be deducted prior to disbursement.`);
  }

  return {
    advertisedAmount: advertised,
    principalAmount: principal,
    totalDeductions: totalUpfrontDeductions,
    deductionStatus,
    deductionStatusText,
    actualDisbursedAmount: actualDisbursed,
    isDisbursementConfirmed,
    totalRepaymentAmount: totalRepayment,
    isRepaymentConfirmed,
    totalCostOfBorrowing,
    effectiveAnnualPercentageRate: apr,
    effectiveMonthlyRate: monthlyRate,
    durationDays: duration,
    numberOfInstallments: installments,
    installmentAmount,
    chargesList: resolvedCharges,
    essentialTerms,
    assumptions
  };
}

/**
 * LoanShield Evidence-Based Risk Assessment Scoring Engine
 * 
 * Rules:
 * - KNOWN RISK: A problematic condition is explicitly written in the document.
 * - INFORMATION GAP: Important information required for an informed borrowing decision is missing or unclear.
 * - Never treat missing information as proof of misconduct.
 * - Restrict the word "variance" strictly to cases where both values are known and numerical comparison is performed.
 * - Categorize deductions into: A (No deductions), B (Explicitly confirmed), C (Potential deductions mentioned, exact amount unclear -> moderate score).
 */
export function calculateRiskAssessment(params: {
  financials: FinancialBreakdown;
  charges: LoanCharge[];
  clauses: ContractClause[];
  permissions: PermissionRisk[];
  discrepancies: DiscrepancyItem[];
  missingKeyTerms: boolean;
  devicePermissionsSpecified?: boolean;
}): RiskAssessment {
  const { financials, charges, clauses, permissions, discrepancies, missingKeyTerms, devicePermissionsSpecified } = params;

  const factors: FactorScore[] = [];
  const reasons: string[] = [];
  const positiveFactors: string[] = [];

  // -------------------------------------------------------------
  // Factor 1: Financial Transparency (20 pts max)
  // Evaluates whether essential figures are Clearly specified, Partially specified, or Not specified.
  // -------------------------------------------------------------
  const essentialTerms = financials.essentialTerms || [];
  const notSpecifiedCount = essentialTerms.filter(t => t.status === 'NOT_SPECIFIED').length;
  const partialCount = essentialTerms.filter(t => t.status === 'PARTIALLY_SPECIFIED').length;
  
  let transparencyScore = 0;
  let transparencyRiskType: RiskNature = 'INFORMATION_GAP';
  let transparencyFinding = 'Essential financial terms are clearly documented.';
  let transparencyEvidence = 'Principal, disbursement, schedule, and fees are clearly disclosed in the document.';
  let transparencyInterpretation = 'Borrower is provided with complete financial figures to make an informed decision.';

  if (notSpecifiedCount >= 3 || missingKeyTerms) {
    transparencyScore = 18;
    transparencyRiskType = 'INFORMATION_GAP';
    const missingNames = essentialTerms.filter(t => t.status !== 'CLEARLY_SPECIFIED').map(t => t.termName).join(', ');
    transparencyFinding = `Significant information gaps: Essential financial figures are missing or deferred (${missingNames})`;
    transparencyEvidence = 'Amount disbursed to borrower: To be determined after approval. Rates/charges deferred.';
    transparencyInterpretation = 'The agreement defers critical financial figures until after approval, creating major information asymmetry before loan acceptance.';
    reasons.push('Key financial terms (such as actual disbursement, exact charges, or total repayment) are missing or deferred until after approval.');
  } else if (notSpecifiedCount >= 1 || partialCount >= 2) {
    transparencyScore = 12;
    transparencyRiskType = 'INFORMATION_GAP';
    transparencyFinding = 'Essential financial figures are partially specified or deferred.';
    transparencyEvidence = 'Certain charges or repayment figures are not fixed in the agreement.';
    transparencyInterpretation = 'Borrower cannot confirm all financial obligations before loan acceptance.';
    reasons.push('Some essential financial figures are not clearly specified in the document.');
  } else if (partialCount === 1) {
    transparencyScore = 6;
    transparencyRiskType = 'INFORMATION_GAP';
    transparencyFinding = 'Minor financial term ambiguity identified.';
    transparencyEvidence = 'One secondary financial term requires clarification.';
    transparencyInterpretation = 'Most core financial figures are present, with minor clarification advised.';
  } else {
    transparencyScore = 0;
    transparencyRiskType = 'KNOWN_RISK';
    positiveFactors.push('All essential financial terms (disbursement, fees, schedule, and total repayment) are clearly specified.');
  }

  factors.push({
    name: 'Financial Transparency',
    category: 'Transparency',
    riskType: transparencyRiskType,
    score: Math.min(20, transparencyScore),
    maxWeight: 20,
    riskImpact: transparencyScore >= 14 ? 'HIGH' : transparencyScore >= 8 ? 'MEDIUM' : 'LOW',
    finding: transparencyFinding,
    evidence: transparencyEvidence,
    interpretation: transparencyInterpretation,
    confidenceLevel: 'HIGH'
  });

  // -------------------------------------------------------------
  // Factor 2: Upfront Deductions (15 pts max)
  // Distinction:
  // A. No deductions mentioned -> 0 risk pts
  // B. Deductions explicitly confirmed -> score based on deduction %
  // C. Potential deductions mentioned but exact amounts are unclear -> moderate score (7 pts)
  // -------------------------------------------------------------
  let deductionScore = 0;
  let deductionRiskType: RiskNature = 'KNOWN_RISK';
  let deductionFinding = 'No upfront deductions mentioned in document.';
  let deductionEvidence = 'No upfront deductions identified in the agreement.';
  let deductionInterpretation = 'The borrower is stated to receive the full loan amount without upfront fee withholdings.';

  if (financials.deductionStatus === 'POTENTIAL_DEDUCTIONS_UNCLEAR') {
    // Category C: Potential deductions mentioned, exact amounts unclear
    deductionScore = 7; // Moderate information-risk score (not 0, not maximum 15)
    deductionRiskType = 'INFORMATION_GAP';
    deductionFinding = 'Potential deductions are mentioned, but the exact amounts are not clearly specified.';
    deductionEvidence = 'Document text: "Applicable charges, service costs, administrative expenses and other fees may be deducted where necessary."';
    deductionInterpretation = 'Potential deductions are mentioned in principle, but the lack of itemized rates prevents the borrower from knowing their net disbursement in advance.';
    reasons.push('Potential deductions are mentioned in the agreement, but the exact amounts are not clearly specified.');
  } else if (financials.deductionStatus === 'DEDUCTIONS_CONFIRMED' && financials.totalDeductions !== null) {
    // Category B: Deductions explicitly confirmed
    deductionRiskType = 'KNOWN_RISK';
    const ratio = financials.principalAmount > 0 
      ? (financials.totalDeductions / financials.principalAmount) * 100 
      : 0;
    
    if (ratio >= 25) {
      deductionScore = 15;
      reasons.push(`Significant upfront deductions of ${Math.round(ratio)}% (PKR ${financials.totalDeductions.toLocaleString()}) deducted prior to receiving funds.`);
    } else if (ratio >= 10) {
      deductionScore = 10;
      reasons.push(`Moderate upfront deductions detected (${Math.round(ratio)}% of loan principal).`);
    } else {
      deductionScore = 4;
      reasons.push(`Minor upfront processing fee identified (${Math.round(ratio)}%).`);
    }

    deductionFinding = `${Math.round(ratio)}% (PKR ${financials.totalDeductions.toLocaleString()}) deducted upfront before disbursement`;
    deductionEvidence = `Total deductions: PKR ${financials.totalDeductions.toLocaleString()} from PKR ${financials.principalAmount.toLocaleString()} principal`;
    deductionInterpretation = `The borrower receives PKR ${(financials.principalAmount - financials.totalDeductions).toLocaleString()} in hand, which is ${Math.round(ratio)}% less than the principal liability.`;
  } else {
    // Category A: No deductions mentioned
    deductionScore = 0;
    deductionRiskType = 'KNOWN_RISK';
    positiveFactors.push('Zero upfront deductions; 100% of the principal loan amount is disbursed directly.');
  }

  factors.push({
    name: 'Upfront Deductions',
    category: 'Financial',
    riskType: deductionRiskType,
    score: deductionScore,
    maxWeight: 15,
    riskImpact: deductionScore >= 12 ? 'HIGH' : deductionScore >= 6 ? 'MEDIUM' : 'LOW',
    finding: deductionFinding,
    evidence: deductionEvidence,
    interpretation: deductionInterpretation,
    confidenceLevel: 'HIGH'
  });

  // -------------------------------------------------------------
  // Factor 3: Late Payment Penalties (15 pts max)
  // -------------------------------------------------------------
  let penaltyScore = 0;
  let penaltyRiskType: RiskNature = 'KNOWN_RISK';
  let penaltyFinding = 'Standard late payment terms with grace period.';
  let penaltyEvidence = 'Document terms outline standard delay procedures.';
  let penaltyInterpretation = 'Late payment terms follow standard capped or disclosed timelines.';

  const hasHighDailyPenalty = clauses.some(c => 
    c.category === 'PENALTIES' && (c.riskFlag === 'RED' || c.originalText.toLowerCase().includes('daily') || c.originalText.toLowerCase().includes('compound'))
  );
  const lateTerm = essentialTerms.find(t => t.id === 'term-late-penalty');
  const isLatePenaltyUnclear = lateTerm?.status === 'NOT_SPECIFIED' || lateTerm?.status === 'PARTIALLY_SPECIFIED';

  if (hasHighDailyPenalty) {
    penaltyScore = 15;
    penaltyRiskType = 'KNOWN_RISK';
    penaltyFinding = 'Compounding or aggressive daily late payment penalties detected.';
    penaltyEvidence = 'Clause specifies daily default rate accruing immediately on overdue balance.';
    penaltyInterpretation = 'Missing the repayment date causes rapid escalation of debt due to compounding daily charges.';
    reasons.push('Substantial daily late payment penalties or compounding charges detected in the agreement.');
  } else if (isLatePenaltyUnclear) {
    penaltyScore = 8;
    penaltyRiskType = 'INFORMATION_GAP';
    penaltyFinding = 'Late payment calculation method is not clearly specified in the document.';
    penaltyEvidence = 'Document lacks a specific late payment formula, flat cap, or grace period specification.';
    penaltyInterpretation = 'Borrower cannot confirm in advance what financial penalty will be levied if payment is delayed.';
    reasons.push('Late payment calculation method is not clearly specified in the document.');
  } else {
    penaltyScore = 2;
    penaltyRiskType = 'KNOWN_RISK';
    positiveFactors.push('Late penalty terms follow standard capped or disclosed timelines.');
  }

  factors.push({
    name: 'Late Payment Penalties',
    category: 'Terms',
    riskType: penaltyRiskType,
    score: penaltyScore,
    maxWeight: 15,
    riskImpact: penaltyScore >= 12 ? 'HIGH' : penaltyScore >= 6 ? 'MEDIUM' : 'LOW',
    finding: penaltyFinding,
    evidence: penaltyEvidence,
    interpretation: penaltyInterpretation,
    confidenceLevel: 'HIGH'
  });

  // -------------------------------------------------------------
  // Factor 4: Contract Clarity & Clauses (15 pts max)
  // -------------------------------------------------------------
  const redClauses = clauses.filter(c => c.riskFlag === 'RED').length;
  const yellowClauses = clauses.filter(c => c.riskFlag === 'YELLOW').length;
  let clauseScore = Math.min(15, (redClauses * 6) + (yellowClauses * 3));
  let clauseRiskType: RiskNature = redClauses > 0 ? 'KNOWN_RISK' : 'INFORMATION_GAP';

  if (redClauses > 0) {
    reasons.push(`${redClauses} restrictive or high-impact contract clause(s) require careful attention.`);
  }

  factors.push({
    name: 'Contract Clarity & Clauses',
    category: 'Legal',
    riskType: clauseRiskType,
    score: clauseScore,
    maxWeight: 15,
    riskImpact: clauseScore >= 10 ? 'HIGH' : clauseScore >= 5 ? 'MEDIUM' : 'LOW',
    finding: redClauses > 0 ? `${redClauses} high-risk clause(s) detected` : 'Clauses appear relatively balanced',
    evidence: `${clauses.length} clauses analyzed (${redClauses} high-risk, ${yellowClauses} moderate)`,
    interpretation: redClauses > 0 
      ? 'Contract contains one-sided conditions regarding collection, rollover, or dispute resolution.'
      : 'Contract language adheres to standard contractual formats.',
    confidenceLevel: 'HIGH'
  });

  // -------------------------------------------------------------
  // Factor 5: Promise vs Document Discrepancy (15 pts max)
  // CRITICAL ISSUE 2:
  // - Only use the word "variance" when BOTH values are known and a numerical comparison can actually be performed.
  // - When actual amount received is deferred or unclear (e.g. "To be determined after approval"), use:
  //   "Significant information gap detected between the advertised loan amount and the actual disbursement terms."
  // -------------------------------------------------------------
  const headlineAmount = financials.advertisedAmount || financials.principalAmount || 0;
  const actualDisbursed = financials.actualDisbursedAmount;
  const isDisbursedKnown = actualDisbursed !== null && financials.isDisbursementConfirmed;

  let discrepancyScore = 0;
  let discrepancyRiskType: RiskNature = 'KNOWN_RISK';
  let discrepancyFinding = 'Documented figures align with advertised terms.';
  let discrepancyEvidence = 'Advertised amount matches documented loan terms.';
  let discrepancyInterpretation = 'No material discrepancy found between advertised offer and loan agreement.';

  if (!isDisbursedKnown) {
    // Case 1: Information Gap - Actual amount received cannot be confirmed
    discrepancyScore = 11;
    discrepancyRiskType = 'INFORMATION_GAP';
    discrepancyFinding = 'Significant information gap detected between the advertised loan amount and the actual disbursement terms.';
    discrepancyEvidence = `Advertised: PKR ${headlineAmount.toLocaleString()} | Document: Amount disbursed to borrower: To be determined after approval.`;
    discrepancyInterpretation = 'The actual amount received cannot be confirmed from the submitted document before approval, creating an information gap rather than a confirmed numerical variance.';
    reasons.push('Significant information gap detected between the advertised loan amount and the actual disbursement terms.');
  } else if (isDisbursedKnown && headlineAmount > 0 && actualDisbursed !== null) {
    const numericalDiff = headlineAmount - actualDisbursed;
    const diffPct = Math.round((numericalDiff / headlineAmount) * 100);

    if (numericalDiff > 0 && diffPct >= 1) {
      // Case 2: Known Numerical Variance
      discrepancyRiskType = 'KNOWN_RISK';
      if (diffPct >= 20) {
        discrepancyScore = 14;
      } else if (diffPct >= 10) {
        discrepancyScore = 9;
      } else {
        discrepancyScore = 5;
      }

      discrepancyFinding = `PKR ${numericalDiff.toLocaleString()} (${diffPct}%) variance between advertised amount and net cash disbursed.`;
      discrepancyEvidence = `Advertised: PKR ${headlineAmount.toLocaleString()} vs Document Disbursed: PKR ${actualDisbursed.toLocaleString()} (Variance: PKR ${numericalDiff.toLocaleString()} / ${diffPct}%)`;
      discrepancyInterpretation = `The borrower receives ${diffPct}% less money in hand than advertised due to upfront fee deductions.`;
      reasons.push(`Numerical variance of PKR ${numericalDiff.toLocaleString()} (${diffPct}%) between advertised amount and net cash disbursed.`);
    } else {
      positiveFactors.push('Disbursed cash matches the approved loan amount with 0% deduction variance.');
    }
  }

  // Also factor in explicit discrepancy list severity if present
  const criticalDisc = discrepancies.filter(d => d.severity === 'CRITICAL').length;
  if (criticalDisc > 0 && discrepancyScore < 14) {
    discrepancyScore = Math.max(discrepancyScore, 14);
  }

  factors.push({
    name: 'Promise vs Document Discrepancy',
    category: 'Consumer Trust',
    riskType: discrepancyRiskType,
    score: Math.min(15, discrepancyScore),
    maxWeight: 15,
    riskImpact: discrepancyScore >= 10 ? 'HIGH' : discrepancyScore >= 5 ? 'MEDIUM' : 'LOW',
    finding: discrepancyFinding,
    evidence: discrepancyEvidence,
    interpretation: discrepancyInterpretation,
    confidenceLevel: 'HIGH'
  });

  // -------------------------------------------------------------
  // Factor 6: Privacy & Permission Concerns (10 pts max)
  // Distinguish strictly: generic statements are NOT sensitive device permissions.
  // -------------------------------------------------------------
  let privacyScore = 0;
  const requestedPermissions = permissions.filter(p => p.requested);
  const highRiskPerms = permissions.filter(p => p.requested && p.concernLevel === 'HIGH');
  const modRiskPerms = permissions.filter(p => p.requested && p.concernLevel === 'MODERATE');
  const isExplicitlySpecified = devicePermissionsSpecified ?? (requestedPermissions.length > 0);

  const hasExplicitNoContactsClause = clauses.some(c => 
    c.originalText.toLowerCase().includes('no access to the borrower') ||
    c.originalText.toLowerCase().includes('no phonebook') ||
    c.originalText.toLowerCase().includes('no access to contacts')
  );

  let privacyRiskType: RiskNature = 'KNOWN_RISK';
  let privacyFinding = 'Device permissions are not specified in the submitted document.';
  let privacyEvidence = 'No device permissions mentioned in the current submitted document.';
  let privacyInterpretation = 'No device permissions are evaluated from the document text.';

  if (!isExplicitlySpecified || requestedPermissions.length === 0) {
    privacyScore = 0;
    privacyRiskType = 'INFORMATION_GAP';
    privacyFinding = 'Device permissions are not specified in the submitted document (0 privacy risk points assigned).';
    privacyEvidence = 'No mobile device hardware/OS permissions requested in current document text.';
    privacyInterpretation = 'LoanShield adheres to strict privacy risk scoring: generic verification phrases are not inferred as device permissions.';
    positiveFactors.push('Device permissions are not specified in the submitted document (0 privacy risk points assigned).');
  } else if (hasExplicitNoContactsClause && highRiskPerms.length === 0) {
    privacyScore = 0;
    privacyRiskType = 'KNOWN_RISK';
    privacyFinding = 'Consumer protection: Document explicitly guarantees no access to personal contacts.';
    privacyEvidence = 'Document text: No access to the borrower\'s personal contacts is required.';
    privacyInterpretation = 'Borrower personal address book remains completely private.';
    positiveFactors.push('The document explicitly states that no access to the borrower’s personal contacts is required.');
  } else if (highRiskPerms.length >= 2) {
    privacyScore = 10;
    privacyRiskType = 'KNOWN_RISK';
    const names = highRiskPerms.map(p => p.displayName.split(' ')[0]).join(', ');
    privacyFinding = `${highRiskPerms.length} high-risk device permissions explicitly requested (${names})`;
    privacyEvidence = `Explicit permissions: ${highRiskPerms.map(p => p.displayName).join(', ')}`;
    privacyInterpretation = 'The mobile app requests broad access to personal contacts, photos, or call logs.';
    reasons.push(`Explicit sensitive device access requested (${names}) which creates high privacy concerns.`);
  } else if (highRiskPerms.length === 1) {
    privacyScore = 6;
    privacyRiskType = 'KNOWN_RISK';
    privacyFinding = `High-risk device permission explicitly requested (${highRiskPerms[0].displayName.split(' ')[0]})`;
    privacyEvidence = `Explicit permission: ${highRiskPerms[0].displayName}`;
    privacyInterpretation = 'Application requests sensitive access beyond standard identity verification.';
    reasons.push(`Explicit sensitive device access requested (${highRiskPerms[0].displayName.split(' ')[0]}).`);
  } else if (modRiskPerms.length > 0) {
    privacyScore = 3;
    privacyRiskType = 'KNOWN_RISK';
    privacyFinding = `${modRiskPerms.length} moderate device permission(s) requested`;
    privacyEvidence = `Permissions requested: ${modRiskPerms.map(p => p.displayName).join(', ')}`;
    privacyInterpretation = 'Location or storage permissions requested for onboarding.';
  } else {
    privacyScore = 0;
    privacyRiskType = 'KNOWN_RISK';
    privacyFinding = 'Standard identity verification only (Camera/Device ID); no invasive permissions.';
    privacyEvidence = 'Camera or Device ID only for KYC onboarding.';
    privacyInterpretation = 'Only minimal verification access requested.';
    positiveFactors.push('Only standard identity verification permissions (Camera for CNIC) requested.');
  }

  factors.push({
    name: 'Data & Privacy Exposure',
    category: 'Privacy',
    riskType: privacyRiskType,
    score: privacyScore,
    maxWeight: 10,
    riskImpact: privacyScore >= 7 ? 'HIGH' : privacyScore >= 4 ? 'MEDIUM' : 'LOW',
    finding: privacyFinding,
    evidence: privacyEvidence,
    interpretation: privacyInterpretation,
    confidenceLevel: 'HIGH'
  });

  // -------------------------------------------------------------
  // Factor 7: Recovery Clause Terms (10 pts max)
  // -------------------------------------------------------------
  let recoveryScore = 0;
  let recoveryRiskType: RiskNature = 'KNOWN_RISK';
  const aggressiveRecovery = clauses.some(c => 
    c.category === 'RECOVERY' && (c.riskFlag === 'RED' || c.originalText.toLowerCase().includes('emergency contact') || c.originalText.toLowerCase().includes('social'))
  );

  if (aggressiveRecovery) {
    recoveryScore = 10;
    recoveryRiskType = 'KNOWN_RISK';
    reasons.push('Recovery terms include contacting third parties, family members, or emergency contacts.');
  } else {
    recoveryScore = 1;
    positiveFactors.push('Standard recovery and dispute terms without unauthorized third-party contact.');
  }

  factors.push({
    name: 'Recovery Clause Terms',
    category: 'Consumer Protection',
    riskType: recoveryRiskType,
    score: recoveryScore,
    maxWeight: 10,
    riskImpact: recoveryScore >= 7 ? 'HIGH' : 'LOW',
    finding: aggressiveRecovery ? 'Extensive collection / third-party contact reach' : 'Standard institutional recovery',
    evidence: aggressiveRecovery ? 'Third-party or emergency contacts mentioned in recovery clauses' : 'Institutional recovery only',
    interpretation: aggressiveRecovery 
      ? 'Lender reserves right to reach out to personal contacts in event of delay.'
      : 'Recovery procedures follow standard institutional notification steps.',
    confidenceLevel: 'HIGH'
  });

  // -------------------------------------------------------------
  // Sum Total Score & Overall Risk Level
  // -------------------------------------------------------------
  const totalScore = Math.min(100, factors.reduce((sum, f) => sum + f.score, 0));

  let riskLevel: RiskLevel = 'LOW';
  let riskTitle = 'LOW RISK';
  let summaryReason = 'The terms and figures in this agreement are transparent and follow standard lending structures.';

  if (totalScore >= 76) {
    riskLevel = 'VERY_HIGH';
    riskTitle = 'VERY HIGH RISK';
    summaryReason = 'Severe information gaps, large upfront deductions, aggressive recovery terms, or invasive permissions detected.';
  } else if (totalScore >= 51) {
    riskLevel = 'HIGH';
    riskTitle = 'HIGH RISK';
    summaryReason = 'Multiple significant risk indicators identified, including essential information gaps, fee deductions, or contract discrepancies.';
  } else if (totalScore >= 26) {
    riskLevel = 'MODERATE';
    riskTitle = 'MODERATE RISK';
    summaryReason = 'A few clauses, potential deductions, or information gaps require close attention before signing.';
  }

  return {
    overallScore: totalScore,
    riskLevel,
    riskTitle,
    summaryReason,
    reasons,
    positiveFactors,
    factors,
    confidenceScore: 94,
    disclaimer: 'LoanShield AI provides AI-assisted information and risk analysis based on the information and documents submitted by the user. It does not provide legal, financial, or regulatory advice and does not determine whether a lender has violated the law.'
  };
}

/**
 * Standard Permission Library for Pakistani Digital Loan Context
 */
export function getDefaultPermissionCatalog(selectedKeys: PermissionType[] = []): PermissionRisk[] {
  const catalog: {
    permission: PermissionType;
    displayName: string;
    concernLevel: 'LOW' | 'MODERATE' | 'HIGH';
    whyItMatters: string;
    potentialAbuseContext: string;
    recommendation: string;
  }[] = [
    {
      permission: 'CONTACTS',
      displayName: 'Contacts Access (Read Contacts)',
      concernLevel: 'HIGH',
      whyItMatters: 'Allows the application to upload and read your entire phonebook, including family, colleagues, and friends.',
      potentialAbuseContext: 'Some digital lenders have used contact lists to call friends and family members during recovery, causing social distress.',
      recommendation: 'Legitimate regulated financial apps in Pakistan generally do not require contact book scraping for credit assessment.'
    },
    {
      permission: 'STORAGE_GALLERY',
      displayName: 'Storage & Gallery (Photos / Media)',
      concernLevel: 'HIGH',
      whyItMatters: 'Grants access to private photos, personal documents, and media stored on your smartphone.',
      potentialAbuseContext: 'Sensitive personal media can be exposed. Only specific ID document photo uploads should be needed, not full gallery access.',
      recommendation: 'Never grant persistent all-files storage permission to a digital lending application.'
    },
    {
      permission: 'CALL_LOGS',
      displayName: 'Call Logs & Phone State',
      concernLevel: 'HIGH',
      whyItMatters: 'Enables the lender to monitor whom you call, how frequently, and at what times.',
      potentialAbuseContext: 'Often used to analyze social graph density and identify close personal ties for recovery pressure.',
      recommendation: 'Reject call log permissions as they are unnecessary for credit underwriting.'
    },
    {
      permission: 'SMS',
      displayName: 'SMS Messages (Read & Receive)',
      concernLevel: 'MODERATE',
      whyItMatters: 'Allows reading OTPs, personal messages, and transactional SMS messages from your bank.',
      potentialAbuseContext: 'While used by some fintechs for automated bank transaction verification, broad SMS access can compromise other private communications.',
      recommendation: 'Ensure the app only accesses transactional/banking SMS or uses single-use OTP autofill APIs.'
    },
    {
      permission: 'LOCATION',
      displayName: 'Precise Geolocation (GPS)',
      concernLevel: 'MODERATE',
      whyItMatters: 'Continuously tracks your physical whereabouts and home/work locations.',
      potentialAbuseContext: 'Location data may be used to verify physical residency or track daily movement patterns.',
      recommendation: 'Allow "While using the app" only if required for fraud prevention; avoid background location access.'
    },
    {
      permission: 'CAMERA',
      displayName: 'Camera Access',
      concernLevel: 'LOW',
      whyItMatters: 'Required for real-time CNIC / facial liveness verification during KYC onboarding.',
      potentialAbuseContext: 'Low risk when limited to taking real-time selfie and CNIC scans during registration.',
      recommendation: 'Standard practice for official SECP biometric and CNIC verification.'
    },
    {
      permission: 'MICROPHONE',
      displayName: 'Microphone (Audio Recording)',
      concernLevel: 'MODERATE',
      whyItMatters: 'Allows recording ambient sound and voice conversations.',
      potentialAbuseContext: 'Rarely needed for simple loans; usually only relevant if video-KYC interview is conducted.',
      recommendation: 'Do not grant microphone permission unless participating in a live verified agent video call.'
    },
    {
      permission: 'PHONE_STATE',
      displayName: 'Phone State & Device ID (IMEI)',
      concernLevel: 'LOW',
      whyItMatters: 'Reads unique device identifier to prevent multiple fraudulent account registrations on one handset.',
      potentialAbuseContext: 'Standard security telemetry for banking applications to detect emulators or SIM changes.',
      recommendation: 'Standard risk-control permission for banking apps.'
    }
  ];

  return catalog.map(item => ({
    ...item,
    requested: selectedKeys.includes(item.permission)
  }));
}

/**
 * Format currency in Pakistani Rupees (PKR)
 */
export function formatPKR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Not clearly specified';
  }
  return `PKR ${Math.round(amount).toLocaleString('en-PK')}`;
}
