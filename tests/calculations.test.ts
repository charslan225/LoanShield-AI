/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import {
  calculateFinancials,
  calculateRiskAssessment,
  formatPKR,
  getDefaultPermissionCatalog,
  CalculationInput,
} from '../src/utils/calculations';
import type {
  LoanCharge,
  ContractClause,
  PermissionRisk,
  DiscrepancyItem,
  FinancialBreakdown,
} from '../src/types';

function makeCharge(overrides: Partial<LoanCharge> = {}): LoanCharge {
  return {
    id: 'charge-1',
    name: 'Processing Fee',
    type: 'UPFRONT_DEDUCTION',
    amount: 1000,
    isDeductedFromDisbursement: true,
    description: 'Standard processing fee',
    isClearlyDisclosed: true,
    ...overrides,
  };
}

function makeClause(overrides: Partial<ContractClause> = {}): ContractClause {
  return {
    id: 'clause-1',
    clauseTitle: 'Standard Clause',
    originalText: 'Standard repayment terms apply.',
    category: 'INTEREST_AND_FEES',
    simpleExplanation: { en: '', ur: '', roman_ur: '' },
    whyItMatters: { en: '', ur: '', roman_ur: '' },
    riskFlag: 'GREEN',
    ...overrides,
  };
}

function makePermission(overrides: Partial<PermissionRisk> = {}): PermissionRisk {
  return {
    permission: 'CAMERA',
    displayName: 'Camera Access',
    requested: false,
    concernLevel: 'LOW',
    whyItMatters: '',
    potentialAbuseContext: '',
    recommendation: '',
    ...overrides,
  };
}

// ─── calculateFinancials ─────────────────────────────────────────────

describe('calculateFinancials', () => {
  it('Category A: no deductions mentioned returns full principal as disbursed', () => {
    const input: CalculationInput = {
      principalAmount: 50000,
      durationDays: 90,
      markupRateAnnual: 24,
      charges: [],
    };
    const result = calculateFinancials(input);

    expect(result.deductionStatus).toBe('NO_DEDUCTIONS_MENTIONED');
    expect(result.totalDeductions).toBe(0);
    expect(result.actualDisbursedAmount).toBe(50000);
    expect(result.isDisbursementConfirmed).toBe(true);
    expect(result.principalAmount).toBe(50000);
  });

  it('Category B: explicit upfront deductions reduce disbursed amount', () => {
    const input: CalculationInput = {
      principalAmount: 50000,
      durationDays: 90,
      markupRateAnnual: 24,
      charges: [makeCharge({ amount: 1160 })],
    };
    const result = calculateFinancials(input);

    expect(result.deductionStatus).toBe('DEDUCTIONS_CONFIRMED');
    expect(result.totalDeductions).toBe(1160);
    expect(result.actualDisbursedAmount).toBe(48840);
    expect(result.isDisbursementConfirmed).toBe(true);
  });

  it('Category B: high upfront deductions (>25%) still compute correctly', () => {
    const input: CalculationInput = {
      principalAmount: 20000,
      durationDays: 30,
      charges: [makeCharge({ amount: 6000 })],
    };
    const result = calculateFinancials(input);

    expect(result.deductionStatus).toBe('DEDUCTIONS_CONFIRMED');
    expect(result.totalDeductions).toBe(6000);
    expect(result.actualDisbursedAmount).toBe(14000);
  });

  it('Category C: potential deductions unclear sets null disbursed', () => {
    const input: CalculationInput = {
      principalAmount: 50000,
      durationDays: 90,
      charges: [],
      rawText: 'Applicable charges, service costs may be deducted where necessary.',
    };
    const result = calculateFinancials(input);

    expect(result.deductionStatus).toBe('POTENTIAL_DEDUCTIONS_UNCLEAR');
    expect(result.totalDeductions).toBeNull();
    expect(result.actualDisbursedAmount).toBeNull();
    expect(result.isDisbursementConfirmed).toBe(false);
  });

  it('calculates markup from annual rate over duration', () => {
    const input: CalculationInput = {
      principalAmount: 100000,
      durationDays: 365,
      markupRateAnnual: 12,
      charges: [],
    };
    const result = calculateFinancials(input);

    expect(result.totalRepaymentAmount).toBe(112000);
    expect(result.isRepaymentConfirmed).toBe(true);
  });

  it('uses totalRepaymentAmount directly when provided', () => {
    const input: CalculationInput = {
      principalAmount: 50000,
      durationDays: 90,
      totalRepaymentAmount: 53000,
      charges: [],
    };
    const result = calculateFinancials(input);

    expect(result.totalRepaymentAmount).toBe(53000);
    expect(result.totalCostOfBorrowing).toBe(3000);
  });

  it('handles 0% markup correctly', () => {
    const input: CalculationInput = {
      principalAmount: 50000,
      durationDays: 90,
      markupRateAnnual: 0,
      charges: [],
      rawText: '0% interest loan',
    };
    const result = calculateFinancials(input);

    expect(result.totalRepaymentAmount).toBe(50000);
    expect(result.isRepaymentConfirmed).toBe(true);
  });

  it('deferred disbursement sets actualDisbursed to null', () => {
    const input: CalculationInput = {
      principalAmount: 50000,
      durationDays: 90,
      markupRateAnnual: 10,
      charges: [],
      isDisbursementDeferred: true,
    };
    const result = calculateFinancials(input);

    expect(result.actualDisbursedAmount).toBeNull();
    expect(result.isDisbursementConfirmed).toBe(false);
  });

  it('computes APR when disbursed and total cost are known', () => {
    const input: CalculationInput = {
      principalAmount: 50000,
      durationDays: 90,
      totalRepaymentAmount: 53000,
      charges: [],
    };
    const result = calculateFinancials(input);

    expect(result.effectiveAnnualPercentageRate).not.toBeNull();
    expect(result.effectiveAnnualPercentageRate).toBeGreaterThan(0);
    expect(result.effectiveMonthlyRate).not.toBeNull();
  });

  it('computes installment amount from total repayment', () => {
    const input: CalculationInput = {
      principalAmount: 60000,
      durationDays: 90,
      totalRepaymentAmount: 63000,
      numberOfInstallments: 3,
      charges: [],
    };
    const result = calculateFinancials(input);

    expect(result.numberOfInstallments).toBe(3);
    expect(result.installmentAmount).toBe(21000);
  });

  it('percentage-based charge resolves amount from principal', () => {
    const input: CalculationInput = {
      principalAmount: 100000,
      durationDays: 60,
      charges: [
        makeCharge({
          amount: null,
          percentage: 5,
          type: 'UPFRONT_DEDUCTION',
          isDeductedFromDisbursement: true,
        }),
      ],
    };
    const result = calculateFinancials(input);

    expect(result.totalDeductions).toBe(5000);
    expect(result.actualDisbursedAmount).toBe(95000);
  });

  it('zero principal is clamped to 0', () => {
    const input: CalculationInput = {
      principalAmount: -100,
      durationDays: 30,
      charges: [],
    };
    const result = calculateFinancials(input);

    expect(result.principalAmount).toBe(0);
  });

  it('extracts total repayment from raw text', () => {
    const input: CalculationInput = {
      principalAmount: 50000,
      durationDays: 90,
      charges: [],
      rawText: 'Total Repayment: PKR 55,000 as per agreement.',
    };
    const result = calculateFinancials(input);

    expect(result.totalRepaymentAmount).toBe(55000);
    expect(result.isRepaymentConfirmed).toBe(true);
  });

  it('essential terms array has 5 entries', () => {
    const input: CalculationInput = {
      principalAmount: 50000,
      durationDays: 90,
      markupRateAnnual: 12,
      charges: [],
    };
    const result = calculateFinancials(input);

    expect(result.essentialTerms).toHaveLength(5);
    const ids = result.essentialTerms!.map((t) => t.id);
    expect(ids).toContain('term-disbursement');
    expect(ids).toContain('term-charges');
    expect(ids).toContain('term-schedule');
    expect(ids).toContain('term-repayment-total');
    expect(ids).toContain('term-late-penalty');
  });
});

// ─── calculateRiskAssessment ──────────────────────────────────────────

describe('calculateRiskAssessment', () => {
  function buildRiskParams(overrides: Partial<Parameters<typeof calculateRiskAssessment>[0]> = {}) {
    const financials: FinancialBreakdown = overrides.financials ?? calculateFinancials({
      principalAmount: 50000,
      durationDays: 90,
      markupRateAnnual: 24,
      charges: [],
    });

    return {
      financials,
      charges: overrides.charges ?? [],
      clauses: overrides.clauses ?? [],
      permissions: overrides.permissions ?? [],
      discrepancies: overrides.discrepancies ?? [],
      missingKeyTerms: overrides.missingKeyTerms ?? false,
      devicePermissionsSpecified: overrides.devicePermissionsSpecified ?? false,
    };
  }

  it('returns LOW risk for a fully transparent loan', () => {
    const params = buildRiskParams({
      permissions: [
        makePermission({ permission: 'CAMERA', requested: true, concernLevel: 'LOW' }),
        makePermission({ permission: 'PHONE_STATE', requested: true, concernLevel: 'LOW' }),
      ],
      devicePermissionsSpecified: true,
    });

    const result = calculateRiskAssessment(params);

    expect(result.riskLevel).toBe('LOW');
    expect(result.overallScore).toBeLessThan(26);
    expect(result.factors).toHaveLength(7);
    expect(result.positiveFactors.length).toBeGreaterThan(0);
  });

  it('returns HIGH risk when missingKeyTerms is true', () => {
    const params = buildRiskParams({ missingKeyTerms: true });
    const result = calculateRiskAssessment(params);

    expect(result.overallScore).toBeGreaterThanOrEqual(26);
    const transparencyFactor = result.factors.find((f) => f.name === 'Financial Transparency');
    expect(transparencyFactor!.score).toBeGreaterThanOrEqual(14);
  });

  it('scores high deductions (>=25%) aggressively', () => {
    const financials = calculateFinancials({
      principalAmount: 20000,
      durationDays: 30,
      charges: [makeCharge({ amount: 6000 })],
    });
    const params = buildRiskParams({ financials });
    const result = calculateRiskAssessment(params);

    const deductionFactor = result.factors.find((f) => f.name === 'Upfront Deductions');
    expect(deductionFactor!.score).toBe(15);
  });

  it('detects aggressive daily penalty clauses', () => {
    const params = buildRiskParams({
      clauses: [
        makeClause({
          category: 'PENALTIES',
          riskFlag: 'RED',
          originalText: 'A daily compound interest of 5% will be charged on overdue amounts.',
        }),
      ],
    });
    const result = calculateRiskAssessment(params);

    const penaltyFactor = result.factors.find((f) => f.name === 'Late Payment Penalties');
    expect(penaltyFactor!.score).toBe(15);
    expect(penaltyFactor!.riskType).toBe('KNOWN_RISK');
  });

  it('scores high privacy risk when multiple HIGH permissions requested', () => {
    const params = buildRiskParams({
      permissions: [
        makePermission({ permission: 'CONTACTS', requested: true, concernLevel: 'HIGH', displayName: 'Contacts Access' }),
        makePermission({ permission: 'STORAGE_GALLERY', requested: true, concernLevel: 'HIGH', displayName: 'Storage Gallery' }),
        makePermission({ permission: 'CALL_LOGS', requested: true, concernLevel: 'HIGH', displayName: 'Call Logs' }),
      ],
      devicePermissionsSpecified: true,
    });
    const result = calculateRiskAssessment(params);

    const privacyFactor = result.factors.find((f) => f.name === 'Data & Privacy Exposure');
    expect(privacyFactor!.score).toBe(10);
  });

  it('scores aggressive recovery clauses at maximum', () => {
    const params = buildRiskParams({
      clauses: [
        makeClause({
          category: 'RECOVERY',
          riskFlag: 'RED',
          originalText: 'Lender may contact emergency contact and social connections of the borrower.',
        }),
      ],
    });
    const result = calculateRiskAssessment(params);

    const recoveryFactor = result.factors.find((f) => f.name === 'Recovery Clause Terms');
    expect(recoveryFactor!.score).toBe(10);
  });

  it('caps total score at 100 and returns VERY_HIGH for extreme cases', () => {
    const financials = calculateFinancials({
      principalAmount: 20000,
      durationDays: 30,
      charges: [makeCharge({ amount: 6000 })],
      rawText: 'Applicable charges may be deducted where necessary.',
    });

    const params = buildRiskParams({
      financials,
      missingKeyTerms: true,
      clauses: [
        makeClause({ category: 'PENALTIES', riskFlag: 'RED', originalText: 'Daily compound default rate.' }),
        makeClause({ category: 'RECOVERY', riskFlag: 'RED', originalText: 'Emergency contact and social reach.' }),
        makeClause({ category: 'UNILATERAL_CHANGE', riskFlag: 'YELLOW', originalText: 'Terms may change.' }),
      ],
      permissions: [
        makePermission({ permission: 'CONTACTS', requested: true, concernLevel: 'HIGH', displayName: 'Contacts Access' }),
        makePermission({ permission: 'STORAGE_GALLERY', requested: true, concernLevel: 'HIGH', displayName: 'Storage Gallery' }),
      ],
      devicePermissionsSpecified: true,
    });
    const result = calculateRiskAssessment(params);

    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.riskLevel).toBe('VERY_HIGH');
  });

  it('assigns MODERATE risk for partially specified terms', () => {
    const financials = calculateFinancials({
      principalAmount: 50000,
      durationDays: 90,
      charges: [],
      rawText: 'Late penalty may apply. Fees may be deducted.',
    });
    const params = buildRiskParams({ financials });
    const result = calculateRiskAssessment(params);

    expect(['MODERATE', 'HIGH']).toContain(result.riskLevel);
  });

  it('always includes disclaimer text', () => {
    const params = buildRiskParams();
    const result = calculateRiskAssessment(params);
    expect(result.disclaimer).toContain('LoanShield AI');
  });
});

// ─── formatPKR ────────────────────────────────────────────────────────

describe('formatPKR', () => {
  it('formats positive numbers with PKR prefix', () => {
    expect(formatPKR(50000)).toBe('PKR 50,000');
  });

  it('returns fallback for null', () => {
    expect(formatPKR(null)).toBe('Not clearly specified');
  });

  it('returns fallback for undefined', () => {
    expect(formatPKR(undefined)).toBe('Not clearly specified');
  });

  it('returns fallback for NaN', () => {
    expect(formatPKR(NaN)).toBe('Not clearly specified');
  });

  it('rounds decimal amounts', () => {
    expect(formatPKR(1234.7)).toBe('PKR 1,235');
  });
});

// ─── getDefaultPermissionCatalog ──────────────────────────────────────

describe('getDefaultPermissionCatalog', () => {
  it('returns 8 permissions when called with no args', () => {
    const catalog = getDefaultPermissionCatalog();
    expect(catalog).toHaveLength(8);
    expect(catalog.every((p) => p.requested === false)).toBe(true);
  });

  it('marks selected permissions as requested', () => {
    const catalog = getDefaultPermissionCatalog(['CONTACTS', 'CAMERA']);
    const requested = catalog.filter((p) => p.requested);
    expect(requested).toHaveLength(2);
    expect(requested.map((p) => p.permission).sort()).toEqual(['CAMERA', 'CONTACTS']);
  });

  it('includes all expected permission types', () => {
    const catalog = getDefaultPermissionCatalog();
    const types = catalog.map((p) => p.permission).sort();
    expect(types).toEqual([
      'CALL_LOGS', 'CAMERA', 'CONTACTS', 'LOCATION',
      'MICROPHONE', 'PHONE_STATE', 'SMS', 'STORAGE_GALLERY',
    ]);
  });
});
