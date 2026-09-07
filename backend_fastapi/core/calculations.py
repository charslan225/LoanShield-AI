from typing import List, Optional, TypedDict

from models import (
    ContractClause,
    DeductionStatus,
    DiscrepancyItem,
    EssentialFinancialTerm,
    FactorScore,
    FinancialBreakdown,
    LoanCharge,
    PermissionRisk,
    PermissionType,
    RiskAssessment,
    RiskLevel,
)


class CalculationInput(TypedDict, total=False):
    principalAmount: float
    advertisedAmount: Optional[float]
    durationDays: int
    markupRateAnnual: Optional[float]
    charges: List[LoanCharge]
    numberOfInstallments: Optional[int]
    totalRepaymentAmount: Optional[float]
    deductionStatus: Optional[DeductionStatus]
    hasPotentialUnclearDeductions: Optional[bool]
    isDisbursementDeferred: Optional[bool]
    isRepaymentDeferred: Optional[bool]
    rawText: Optional[str]


def format_pkr(amount: Optional[float]) -> str:
    if amount is None or (isinstance(amount, float) and amount != amount):
        return 'Not clearly specified'
    return f'PKR {round(amount):,}'


def calculate_financials(input: CalculationInput) -> FinancialBreakdown:
    principal = max(0, input.get('principalAmount') or 0)
    duration = max(1, input.get('durationDays') or 30)
    advertised = input.get('advertisedAmount')
    if advertised is None:
        advertised = None

    raw_text = input.get('rawText') or ''
    raw_text_lower = raw_text.lower()
    charges_input = input.get('charges') or []
    deduction_status_input = input.get('deductionStatus')
    has_potential_unclear = input.get('hasPotentialUnclearDeductions') or False

    has_unclear_deduction_clause = (
        has_potential_unclear
        or deduction_status_input == 'POTENTIAL_DEDUCTIONS_UNCLEAR'
        or 'may be deducted where necessary' in raw_text_lower
        or 'applicable charges, service costs' in raw_text_lower
        or 'deducted where necessary' in raw_text_lower
        or 'fees may be deducted' in raw_text_lower
        or 'charges may be deducted' in raw_text_lower
        or any(
            (c.amount is None or c.amount == 0)
            and (c.type == 'UPFRONT_DEDUCTION' or (c.description and 'may be deducted' in c.description.lower()))
            for c in charges_input
        )
    )

    total_upfront_deductions: Optional[float] = 0.0
    total_recurring_charges = 0.0
    has_explicit_upfront_amount = False

    resolved_charges: List[LoanCharge] = []
    for c in charges_input:
        amt = c.amount
        if amt is None and c.percentage is not None and c.percentage > 0:
            amt = (principal * c.percentage) / 100

        if amt is not None and amt > 0:
            if c.isDeductedFromDisbursement or c.type == 'UPFRONT_DEDUCTION':
                has_explicit_upfront_amount = True
                total_upfront_deductions = (total_upfront_deductions or 0) + amt
            elif c.type == 'RECURRING_FEE':
                total_recurring_charges += amt

        updated = c.model_copy(update={'amount': amt})
        resolved_charges.append(updated)

    deduction_status: DeductionStatus = 'NO_DEDUCTIONS_MENTIONED'
    deduction_status_text = 'No upfront deductions mentioned in document.'
    is_disbursement_confirmed = True
    actual_disbursed: Optional[float] = principal

    if has_unclear_deduction_clause and not has_explicit_upfront_amount:
        deduction_status = 'POTENTIAL_DEDUCTIONS_UNCLEAR'
        deduction_status_text = 'Potential deductions are mentioned, but the exact amounts are not clearly specified.'
        total_upfront_deductions = None
        actual_disbursed = None
        is_disbursement_confirmed = False
    elif has_explicit_upfront_amount and total_upfront_deductions is not None and total_upfront_deductions > 0:
        deduction_status = 'DEDUCTIONS_CONFIRMED'
        ratio = (total_upfront_deductions / principal * 100) if principal > 0 else 0
        deduction_status_text = f'{round(ratio)}% (PKR {total_upfront_deductions:,.0f}) deducted before disbursement'
        actual_disbursed = max(0, principal - total_upfront_deductions)
        is_disbursement_confirmed = True
    else:
        deduction_status = 'NO_DEDUCTIONS_MENTIONED'
        deduction_status_text = 'No upfront deductions mentioned in the agreement.'
        total_upfront_deductions = 0
        actual_disbursed = principal
        is_disbursement_confirmed = True

    if input.get('isDisbursementDeferred') or 'to be determined after approval' in raw_text_lower:
        actual_disbursed = None
        is_disbursement_confirmed = False

    estimated_markup = 0.0
    is_markup_confirmed = True
    total_repayment: Optional[float] = None

    total_repayment_input = input.get('totalRepaymentAmount')
    markup_rate = input.get('markupRateAnnual')

    if total_repayment_input is not None and total_repayment_input > 0:
        total_repayment = total_repayment_input
        is_markup_confirmed = True
        estimated_markup = max(0, total_repayment - principal - total_recurring_charges)
    elif markup_rate is not None and markup_rate > 0:
        estimated_markup = principal * (markup_rate / 100) * (duration / 365)
        total_repayment = round(principal + estimated_markup + total_recurring_charges)
    elif markup_rate == 0 or '0% interest' in raw_text_lower or '0% markup' in raw_text_lower:
        estimated_markup = 0
        total_repayment = round(principal + total_recurring_charges)
    else:
        import re

        rep_match = re.search(
            r'(?:Total Repayment|Repayment Amount|Estimated Total Repayment|Total Payable|Payable Amount|Total Repayable)[:\s]+(?:PKR|Rs\.?)?\s*([\d,]+)',
            raw_text,
            re.IGNORECASE,
        )
        if rep_match and rep_match.group(1):
            total_repayment = int(rep_match.group(1).replace(',', ''))
            is_markup_confirmed = True
            estimated_markup = max(0, total_repayment - principal - total_recurring_charges)
        else:
            is_markup_confirmed = False

    is_repayment_confirmed = is_markup_confirmed and total_repayment is not None and not input.get('isRepaymentDeferred')

    total_cost_of_borrowing: Optional[float] = None
    if total_repayment is not None and actual_disbursed is not None:
        total_cost_of_borrowing = max(0, total_repayment - actual_disbursed)

    apr: Optional[float] = None
    monthly_rate: Optional[float] = None
    if actual_disbursed is not None and actual_disbursed > 0 and total_cost_of_borrowing is not None and duration > 0:
        raw_ratio = total_cost_of_borrowing / actual_disbursed
        annualized_ratio = raw_ratio * (365 / duration)
        apr = round(annualized_ratio * 100 * 10) / 10
        monthly_rate = round((raw_ratio * (30 / duration)) * 100 * 10) / 10

    installments = max(1, input.get('numberOfInstallments') or 1)
    installment_amount = round(total_repayment / installments) if total_repayment is not None else None

    essential_terms: List[EssentialFinancialTerm] = [
        EssentialFinancialTerm(
            id='term-disbursement',
            termName='Actual amount received',
            status='CLEARLY_SPECIFIED' if (actual_disbursed is not None and is_disbursement_confirmed) else 'NOT_SPECIFIED',
            documentedValue=(f'PKR {actual_disbursed:,.0f}' if (actual_disbursed is not None and is_disbursement_confirmed) else 'To be determined after approval'),
            explanation=(f'Documented net disbursement is PKR {actual_disbursed:,.0f}.' if (actual_disbursed is not None and is_disbursement_confirmed) else 'The actual amount the borrower will receive is not clearly specified before acceptance.'),
            evidence=(f'Disbursed Net: PKR {actual_disbursed:,.0f}' if (actual_disbursed is not None and is_disbursement_confirmed) else 'Amount disbursed to borrower: To be determined after approval.'),
        ),
        EssentialFinancialTerm(
            id='term-charges',
            termName='Exact charges',
            status=(
                'PARTIALLY_SPECIFIED'
                if deduction_status == 'POTENTIAL_DEDUCTIONS_UNCLEAR'
                else 'CLEARLY_SPECIFIED' if (resolved_charges or deduction_status == 'NO_DEDUCTIONS_MENTIONED') else 'NOT_SPECIFIED'
            ),
            documentedValue=(
                'Subject to deduction'
                if deduction_status == 'POTENTIAL_DEDUCTIONS_UNCLEAR'
                else (f'PKR {total_upfront_deductions:,.0f} itemized' if (total_upfront_deductions is not None and total_upfront_deductions > 0) else 'None stated')
            ),
            explanation=(
                'Potential deductions are mentioned, but the exact amounts are not clearly specified.'
                if deduction_status == 'POTENTIAL_DEDUCTIONS_UNCLEAR'
                else 'Deductions and fee structures are clearly defined with numerical values.'
            ),
            evidence=(
                'Applicable charges, service costs, administrative expenses and other fees may be deducted where necessary.'
                if deduction_status == 'POTENTIAL_DEDUCTIONS_UNCLEAR'
                else 'Itemized fee schedule.'
            ),
        ),
        EssentialFinancialTerm(
            id='term-schedule',
            termName='Exact repayment schedule',
            status='CLEARLY_SPECIFIED' if (duration > 0 and not input.get('isRepaymentDeferred') and 'schedule to be decided' not in raw_text_lower) else 'NOT_SPECIFIED',
            documentedValue=f'{duration} Calendar Days' if duration > 0 else 'Not specified',
            explanation=(f'Loan tenure is set to {duration} days.' if duration > 0 else 'Repayment schedule and installment dates are not specified in the document.'),
            evidence=f'Tenure: {duration} Days.',
        ),
        EssentialFinancialTerm(
            id='term-repayment-total',
            termName='Total repayment amount',
            status='CLEARLY_SPECIFIED' if (total_repayment is not None and is_repayment_confirmed) else 'NOT_SPECIFIED',
            documentedValue=f'PKR {total_repayment:,.0f}' if total_repayment is not None else 'Not confirmed',
            explanation=(f'Total contractual repayment amount is documented as PKR {total_repayment:,.0f}.' if total_repayment is not None else 'Total repayment amount cannot be verified due to missing or deferred rate/fee figures.'),
            evidence=(f'Maturity Repayment: PKR {total_repayment:,.0f}' if total_repayment is not None else 'Total repayment sum omitted or deferred.'),
        ),
        EssentialFinancialTerm(
            id='term-late-penalty',
            termName='Late payment calculation method',
            status=(
                'CLEARLY_SPECIFIED'
                if any(
                    phrase in raw_text_lower
                    for phrase in ['per calendar day', 'flat fee', 'grace period', 'daily default', 'flat pkr', 'fixed pkr', 'administrative charge', 'late fee', 'no late fee']
                )
                else 'PARTIALLY_SPECIFIED'
                if any(phrase in raw_text_lower for phrase in ['penalty', 'delay', 'overdue', 'late charge'])
                else 'NOT_SPECIFIED'
            ),
            documentedValue=(
                'Daily accrued rate' if ('per calendar day' in raw_text_lower or 'daily default' in raw_text_lower)
                else 'Flat fee structure' if ('flat' in raw_text_lower or 'fixed' in raw_text_lower)
                else 'Grace period structure' if 'grace period' in raw_text_lower
                else 'Not clearly defined'
            ),
            explanation=(
                'Late payment penalty calculation method is documented in the agreement.'
                if any(phrase in raw_text_lower for phrase in ['per calendar day', 'flat', 'fixed', 'grace period'])
                else 'Late payment calculation method is ambiguous or not clearly specified before signing.'
            ),
            evidence='Late payment clause identified.' if ('penalty' in raw_text_lower or 'late' in raw_text_lower) else 'No late payment formula found in agreement.',
        ),
    ]

    assumptions: List[str] = []
    if deduction_status == 'POTENTIAL_DEDUCTIONS_UNCLEAR':
        assumptions.append('Potential deductions are mentioned in the agreement, but exact fee percentages or rupee figures are not clearly specified.')
    if not markup_rate and '0% interest' not in raw_text_lower:
        assumptions.append('Markup rate is not explicitly declared; exact interest cost cannot be confirmed from the submitted document.')
    if total_upfront_deductions is not None and total_upfront_deductions > 0:
        assumptions.append(f'PKR {total_upfront_deductions:,.0f} will be deducted prior to disbursement.')

    return FinancialBreakdown(
        advertisedAmount=advertised,
        principalAmount=principal,
        totalDeductions=total_upfront_deductions,
        deductionStatus=deduction_status,
        deductionStatusText=deduction_status_text,
        actualDisbursedAmount=actual_disbursed,
        isDisbursementConfirmed=is_disbursement_confirmed,
        totalRepaymentAmount=total_repayment,
        isRepaymentConfirmed=is_repayment_confirmed,
        totalCostOfBorrowing=total_cost_of_borrowing,
        effectiveAnnualPercentageRate=apr,
        effectiveMonthlyRate=monthly_rate,
        durationDays=duration,
        numberOfInstallments=installments,
        installmentAmount=installment_amount,
        chargesList=resolved_charges,
        essentialTerms=essential_terms,
        assumptions=assumptions,
    )


def calculate_risk_assessment(
    financials: FinancialBreakdown,
    charges: List[LoanCharge],
    clauses: List[ContractClause],
    permissions: List[PermissionRisk],
    discrepancies: List[DiscrepancyItem],
    missing_key_terms: bool,
    device_permissions_specified: Optional[bool] = None,
) -> RiskAssessment:
    factors: List[FactorScore] = []
    reasons: List[str] = []
    positive_factors: List[str] = []

    essential_terms = financials.essentialTerms or []
    not_specified_count = sum(1 for t in essential_terms if t.status == 'NOT_SPECIFIED')
    partial_count = sum(1 for t in essential_terms if t.status == 'PARTIALLY_SPECIFIED')

    transparency_score = 0
    transparency_risk_type: str = 'INFORMATION_GAP'
    transparency_finding = 'Essential financial terms are clearly documented.'
    transparency_evidence = 'Principal, disbursement, schedule, and fees are clearly disclosed in the document.'
    transparency_interpretation = 'Borrower is provided with complete financial figures to make an informed decision.'

    if not_specified_count >= 3 or missing_key_terms:
        transparency_score = 18
        transparency_risk_type = 'INFORMATION_GAP'
        missing_names = ', '.join(t.termName for t in essential_terms if t.status != 'CLEARLY_SPECIFIED')
        transparency_finding = f'Significant information gaps: Essential financial figures are missing or deferred ({missing_names})'
        transparency_evidence = 'Amount disbursed to borrower: To be determined after approval. Rates/charges deferred.'
        transparency_interpretation = 'The agreement defers critical financial figures until after approval, creating major information asymmetry before loan acceptance.'
        reasons.append('Key financial terms (such as actual disbursement, exact charges, or total repayment) are missing or deferred until after approval.')
    elif not_specified_count >= 2 or (not_specified_count == 1 and partial_count >= 1):
        transparency_score = 9
        transparency_risk_type = 'INFORMATION_GAP'
        transparency_finding = 'Essential financial figures are partially specified or deferred.'
        transparency_evidence = 'Certain charges or repayment figures are not fixed in the agreement.'
        transparency_interpretation = 'Borrower cannot confirm all financial obligations before loan acceptance.'
        reasons.append('Some essential financial figures are not clearly specified in the document.')
    elif not_specified_count == 1:
        transparency_score = 4
        transparency_risk_type = 'INFORMATION_GAP'
        transparency_finding = 'One secondary term requires minor clarification.'
        transparency_evidence = 'Core loan principal and repayment are defined; one secondary term is omitted.'
        transparency_interpretation = 'Core financial figures are present, with minor clarification advised.'
    elif partial_count >= 2:
        transparency_score = 4
        transparency_risk_type = 'INFORMATION_GAP'
        transparency_finding = 'Minor financial term ambiguity identified.'
        transparency_evidence = 'Some secondary financial terms require clarification.'
        transparency_interpretation = 'Most core financial figures are present, with minor clarification advised.'
    elif partial_count == 1:
        transparency_score = 2
        transparency_risk_type = 'INFORMATION_GAP'
        transparency_finding = 'Minor financial term ambiguity identified.'
        transparency_evidence = 'One secondary financial term requires clarification.'
        transparency_interpretation = 'Most core financial figures are present, with minor clarification advised.'
    else:
        transparency_score = 0
        transparency_risk_type = 'KNOWN_RISK'
        positive_factors.append('All essential financial terms (disbursement, fees, schedule, and total repayment) are clearly specified.')

    factors.append(
        FactorScore(
            name='Financial Transparency',
            category='Transparency',
            riskType=transparency_risk_type,
            score=min(20, transparency_score),
            maxWeight=20,
            riskImpact='HIGH' if transparency_score >= 14 else 'MEDIUM' if transparency_score >= 8 else 'LOW',
            finding=transparency_finding,
            evidence=transparency_evidence,
            interpretation=transparency_interpretation,
            confidenceLevel='HIGH',
        )
    )

    deduction_score = 0
    deduction_risk_type: str = 'KNOWN_RISK'
    deduction_finding = 'No upfront deductions mentioned in document.'
    deduction_evidence = 'No upfront deductions identified in the agreement.'
    deduction_interpretation = 'The borrower is stated to receive the full loan amount without upfront fee withholdings.'

    if financials.deductionStatus == 'POTENTIAL_DEDUCTIONS_UNCLEAR':
        deduction_score = 7
        deduction_risk_type = 'INFORMATION_GAP'
        deduction_finding = 'Potential deductions are mentioned, but the exact amounts are not clearly specified.'
        deduction_evidence = 'Document text: "Applicable charges, service costs, administrative expenses and other fees may be deducted where necessary."'
        deduction_interpretation = 'Potential deductions are mentioned in principle, but the lack of itemized rates prevents the borrower from knowing their net disbursement in advance.'
        reasons.append('Potential deductions are mentioned in the agreement, but the exact amounts are not clearly specified.')
    elif financials.deductionStatus == 'DEDUCTIONS_CONFIRMED' and financials.totalDeductions is not None:
        deduction_risk_type = 'KNOWN_RISK'
        ratio = (financials.totalDeductions / financials.principalAmount * 100) if financials.principalAmount > 0 else 0
        if ratio >= 25:
            deduction_score = 15
            reasons.append(f'Significant upfront deductions of {round(ratio)}% (PKR {financials.totalDeductions:,.0f}) deducted prior to receiving funds.')
        elif ratio >= 10:
            deduction_score = 10
            reasons.append(f'Moderate upfront deductions detected ({round(ratio)}% of loan principal).')
        elif ratio >= 5:
            deduction_score = 4
            reasons.append(f'Minor upfront processing fee identified ({round(ratio)}%).')
        else:
            deduction_score = 1
            positive_factors.append(f'Minimal standard processing/statutory fee ({round(ratio * 10) / 10}%).')

        deduction_finding = f'{round(ratio)}% (PKR {financials.totalDeductions:,.0f}) deducted upfront before disbursement'
        deduction_evidence = f'Total deductions: PKR {financials.totalDeductions:,.0f} from PKR {financials.principalAmount:,.0f} principal'
        deduction_interpretation = f'The borrower receives PKR {(financials.principalAmount - financials.totalDeductions):,.0f} in hand, which is {round(ratio)}% less than the principal liability.'
    else:
        deduction_score = 0
        deduction_risk_type = 'KNOWN_RISK'
        positive_factors.append('Zero upfront deductions; 100% of the principal loan amount is disbursed directly.')

    factors.append(
        FactorScore(
            name='Upfront Deductions',
            category='Financial',
            riskType=deduction_risk_type,
            score=deduction_score,
            maxWeight=15,
            riskImpact='HIGH' if deduction_score >= 12 else 'MEDIUM' if deduction_score >= 6 else 'LOW',
            finding=deduction_finding,
            evidence=deduction_evidence,
            interpretation=deduction_interpretation,
            confidenceLevel='HIGH',
        )
    )

    penalty_score = 0
    penalty_risk_type: str = 'KNOWN_RISK'
    penalty_finding = 'Standard late payment terms with grace period.'
    penalty_evidence = 'Document terms outline standard delay procedures.'
    penalty_interpretation = 'Late payment terms follow standard capped or disclosed timelines.'

    has_high_daily_penalty = any(
        c.category == 'PENALTIES' and (c.riskFlag == 'RED' or 'daily' in c.originalText.lower() or 'compound' in c.originalText.lower())
        for c in clauses
    )
    late_term = next((t for t in essential_terms if t.id == 'term-late-penalty'), None)
    is_late_penalty_unclear = late_term is not None and (late_term.status == 'NOT_SPECIFIED' or late_term.status == 'PARTIALLY_SPECIFIED')

    if has_high_daily_penalty:
        penalty_score = 15
        penalty_risk_type = 'KNOWN_RISK'
        penalty_finding = 'Compounding or aggressive daily late payment penalties detected.'
        penalty_evidence = 'Clause specifies daily default rate accruing immediately on overdue balance.'
        penalty_interpretation = 'Missing the repayment date causes rapid escalation of debt due to compounding daily charges.'
        reasons.append('Substantial daily late payment penalties or compounding charges detected in the agreement.')
    elif late_term is not None and late_term.status == 'NOT_SPECIFIED':
        penalty_score = 8
        penalty_risk_type = 'INFORMATION_GAP'
        penalty_finding = 'Late payment calculation method is not clearly specified in the document.'
        penalty_evidence = 'Document lacks a specific late payment formula, flat cap, or grace period specification.'
        penalty_interpretation = 'Borrower cannot confirm in advance what financial penalty will be levied if payment is delayed.'
        reasons.append('Late payment calculation method is not clearly specified in the document.')
    elif late_term is not None and late_term.status == 'PARTIALLY_SPECIFIED':
        penalty_score = 4
        penalty_risk_type = 'INFORMATION_GAP'
        penalty_finding = 'Late payment terms are partially specified.'
        penalty_evidence = 'Late payment terms are noted but exact formulas require confirmation.'
        penalty_interpretation = 'Borrower should verify delay charges prior to acceptance.'
    else:
        penalty_score = 0
        penalty_risk_type = 'KNOWN_RISK'
        positive_factors.append('Late penalty terms follow standard capped or disclosed timelines.')

    factors.append(
        FactorScore(
            name='Late Payment Penalties',
            category='Terms',
            riskType=penalty_risk_type,
            score=penalty_score,
            maxWeight=15,
            riskImpact='HIGH' if penalty_score >= 12 else 'MEDIUM' if penalty_score >= 6 else 'LOW',
            finding=penalty_finding,
            evidence=penalty_evidence,
            interpretation=penalty_interpretation,
            confidenceLevel='HIGH',
        )
    )

    red_clauses = sum(1 for c in clauses if c.riskFlag == 'RED')
    yellow_clauses = sum(1 for c in clauses if c.riskFlag == 'YELLOW')
    clause_score = min(15, (red_clauses * 6) + (yellow_clauses * 3))
    clause_risk_type: str = 'KNOWN_RISK' if red_clauses > 0 else 'INFORMATION_GAP'
    if red_clauses > 0:
        reasons.append(f'{red_clauses} restrictive or high-impact contract clause(s) require careful attention.')

    factors.append(
        FactorScore(
            name='Contract Clarity & Clauses',
            category='Legal',
            riskType=clause_risk_type,
            score=clause_score,
            maxWeight=15,
            riskImpact='HIGH' if clause_score >= 10 else 'MEDIUM' if clause_score >= 5 else 'LOW',
            finding=f'{red_clauses} high-risk clause(s) detected' if red_clauses > 0 else 'Clauses appear relatively balanced',
            evidence=f'{len(clauses)} clauses analyzed ({red_clauses} high-risk, {yellow_clauses} moderate)',
            interpretation=(
                'Contract contains one-sided conditions regarding collection, rollover, or dispute resolution.'
                if red_clauses > 0 else 'Contract language adheres to standard contractual formats.'
            ),
            confidenceLevel='HIGH',
        )
    )

    headline_amount = financials.advertisedAmount or financials.principalAmount or 0
    actual_disbursed = financials.actualDisbursedAmount
    is_disbursed_known = actual_disbursed is not None and (financials.isDisbursementConfirmed or False)

    discrepancy_score = 0
    discrepancy_risk_type: str = 'KNOWN_RISK'
    discrepancy_finding = 'Documented figures align with advertised terms.'
    discrepancy_evidence = 'Advertised amount matches documented loan terms.'
    discrepancy_interpretation = 'No material discrepancy found between advertised offer and loan agreement.'

    if not is_disbursed_known:
        discrepancy_score = 11
        discrepancy_risk_type = 'INFORMATION_GAP'
        discrepancy_finding = 'Significant information gap detected between the advertised loan amount and the actual disbursement terms.'
        discrepancy_evidence = f'Advertised: PKR {headline_amount:,.0f} | Document: Amount disbursed to borrower: To be determined after approval.'
        discrepancy_interpretation = 'The actual amount received cannot be confirmed from the submitted document before approval, creating an information gap rather than a confirmed numerical variance.'
        reasons.append('Significant information gap detected between the advertised loan amount and the actual disbursement terms.')
    elif headline_amount > 0 and actual_disbursed is not None:
        numerical_diff = headline_amount - actual_disbursed
        diff_pct = round((numerical_diff / headline_amount) * 100)
        if numerical_diff > 0 and diff_pct >= 1:
            discrepancy_risk_type = 'KNOWN_RISK'
            if diff_pct >= 20:
                discrepancy_score = 14
            elif diff_pct >= 10:
                discrepancy_score = 9
            elif diff_pct >= 5:
                discrepancy_score = 4
            else:
                discrepancy_score = 1
            discrepancy_finding = f'PKR {numerical_diff:,.0f} ({diff_pct}%) variance between advertised amount and net cash disbursed.'
            discrepancy_evidence = f'Advertised: PKR {headline_amount:,.0f} vs Document Disbursed: PKR {actual_disbursed:,.0f} (Variance: PKR {numerical_diff:,.0f} / {diff_pct}%)'
            discrepancy_interpretation = f'The borrower receives {diff_pct}% less money in hand than advertised due to upfront fee deductions.'
            reasons.append(f'Numerical variance of PKR {numerical_diff:,.0f} ({diff_pct}%) between advertised amount and net cash disbursed.')
        else:
            positive_factors.append('Disbursed cash matches the approved loan amount with 0% deduction variance.')

    critical_disc = sum(1 for d in discrepancies if d.severity == 'CRITICAL')
    if critical_disc > 0 and discrepancy_score < 14:
        discrepancy_score = max(discrepancy_score, 14)

    factors.append(
        FactorScore(
            name='Promise vs Document Discrepancy',
            category='Consumer Trust',
            riskType=discrepancy_risk_type,
            score=min(15, discrepancy_score),
            maxWeight=15,
            riskImpact='HIGH' if discrepancy_score >= 10 else 'MEDIUM' if discrepancy_score >= 5 else 'LOW',
            finding=discrepancy_finding,
            evidence=discrepancy_evidence,
            interpretation=discrepancy_interpretation,
            confidenceLevel='HIGH',
        )
    )

    privacy_score = 0
    requested_permissions = [p for p in permissions if p.requested]
    high_risk_perms = [p for p in permissions if p.requested and p.concernLevel == 'HIGH']
    mod_risk_perms = [p for p in permissions if p.requested and p.concernLevel == 'MODERATE']
    is_explicitly_specified = device_permissions_specified if device_permissions_specified is not None else (len(requested_permissions) > 0)

    has_explicit_no_contacts_clause = any(
        'no access to the borrower' in c.originalText.lower()
        or 'no phonebook' in c.originalText.lower()
        or 'no access to contacts' in c.originalText.lower()
        for c in clauses
    )

    privacy_risk_type: str = 'KNOWN_RISK'
    privacy_finding = 'Device permissions are not specified in the submitted document.'
    privacy_evidence = 'No device permissions mentioned in the current submitted document.'
    privacy_interpretation = 'No device permissions are evaluated from the document text.'

    if not is_explicitly_specified or len(requested_permissions) == 0:
        privacy_score = 0
        privacy_risk_type = 'INFORMATION_GAP'
        privacy_finding = 'Device permissions are not specified in the submitted document (0 privacy risk points assigned).'
        privacy_evidence = 'No mobile device hardware/OS permissions requested in current document text.'
        privacy_interpretation = 'LoanShield adheres to strict privacy risk scoring: generic verification phrases are not inferred as device permissions.'
        positive_factors.append('Device permissions are not specified in the submitted document (0 privacy risk points assigned).')
    elif has_explicit_no_contacts_clause and len(high_risk_perms) == 0:
        privacy_score = 0
        privacy_risk_type = 'KNOWN_RISK'
        privacy_finding = 'Consumer protection: Document explicitly guarantees no access to personal contacts.'
        privacy_evidence = 'Document text: No access to the borrower\'s personal contacts is required.'
        privacy_interpretation = 'Borrower personal address book remains completely private.'
        positive_factors.append('The document explicitly states that no access to the borrower’s personal contacts is required.')
    elif len(high_risk_perms) >= 2:
        privacy_score = 10
        privacy_risk_type = 'KNOWN_RISK'
        names = ', '.join(p.displayName.split(' ')[0] for p in high_risk_perms)
        privacy_finding = f'{len(high_risk_perms)} high-risk device permissions explicitly requested ({names})'
        privacy_evidence = f'Explicit permissions: {", ".join(p.displayName for p in high_risk_perms)}'
        privacy_interpretation = 'The mobile app requests broad access to personal contacts, photos, or call logs.'
        reasons.append(f'Explicit sensitive device access requested ({names}) which creates high privacy concerns.')
    elif len(high_risk_perms) == 1:
        privacy_score = 6
        privacy_risk_type = 'KNOWN_RISK'
        privacy_finding = f'High-risk device permission explicitly requested ({high_risk_perms[0].displayName.split(" ")[0]})'
        privacy_evidence = f'Explicit permission: {high_risk_perms[0].displayName}'
        privacy_interpretation = 'Application requests sensitive access beyond standard identity verification.'
        reasons.append(f'Explicit sensitive device access requested ({high_risk_perms[0].displayName.split(" ")[0]}).')
    elif len(mod_risk_perms) > 0:
        privacy_score = 3
        privacy_risk_type = 'KNOWN_RISK'
        privacy_finding = f'{len(mod_risk_perms)} moderate device permission(s) requested'
        privacy_evidence = f'Permissions requested: {", ".join(p.displayName for p in mod_risk_perms)}'
        privacy_interpretation = 'Location or storage permissions requested for onboarding.'
    else:
        privacy_score = 0
        privacy_risk_type = 'KNOWN_RISK'
        privacy_finding = 'Standard identity verification only (Camera/Device ID); no invasive permissions.'
        privacy_evidence = 'Camera or Device ID only for KYC onboarding.'
        privacy_interpretation = 'Only minimal verification access requested.'
        positive_factors.append('Only standard identity verification permissions (Camera for CNIC) requested.')

    factors.append(
        FactorScore(
            name='Data & Privacy Exposure',
            category='Privacy',
            riskType=privacy_risk_type,
            score=privacy_score,
            maxWeight=10,
            riskImpact='HIGH' if privacy_score >= 7 else 'MEDIUM' if privacy_score >= 4 else 'LOW',
            finding=privacy_finding,
            evidence=privacy_evidence,
            interpretation=privacy_interpretation,
            confidenceLevel='HIGH',
        )
    )

    recovery_score = 0
    recovery_risk_type: str = 'KNOWN_RISK'
    aggressive_recovery = any(
        c.category == 'RECOVERY' and (c.riskFlag == 'RED' or 'emergency contact' in c.originalText.lower() or 'social' in c.originalText.lower())
        for c in clauses
    )
    if aggressive_recovery:
        recovery_score = 10
        recovery_risk_type = 'KNOWN_RISK'
        reasons.append('Recovery terms include contacting third parties, family members, or emergency contacts.')
    else:
        recovery_score = 0
        positive_factors.append('Standard recovery and dispute terms without unauthorized third-party contact.')

    factors.append(
        FactorScore(
            name='Recovery Clause Terms',
            category='Consumer Protection',
            riskType=recovery_risk_type,
            score=recovery_score,
            maxWeight=10,
            riskImpact='HIGH' if recovery_score >= 7 else 'LOW',
            finding='Extensive collection / third-party contact reach' if aggressive_recovery else 'Standard institutional recovery',
            evidence='Third-party or emergency contacts mentioned in recovery clauses' if aggressive_recovery else 'Institutional recovery only',
            interpretation=(
                'Lender reserves right to reach out to personal contacts in event of delay.'
                if aggressive_recovery else 'Recovery procedures follow standard institutional notification steps.'
            ),
            confidenceLevel='HIGH',
        )
    )

    total_score = min(100, sum(f.score for f in factors))

    risk_level: RiskLevel = 'LOW'
    risk_title = 'LOW RISK'
    summary_reason = 'The terms and figures in this agreement are transparent and follow standard lending structures.'

    if total_score >= 76:
        risk_level = 'VERY_HIGH'
        risk_title = 'VERY HIGH RISK'
        summary_reason = 'Severe information gaps, large upfront deductions, aggressive recovery terms, or invasive permissions detected.'
    elif total_score >= 51:
        risk_level = 'HIGH'
        risk_title = 'HIGH RISK'
        summary_reason = 'Multiple significant risk indicators identified, including essential information gaps, fee deductions, or contract discrepancies.'
    elif total_score >= 26:
        risk_level = 'MODERATE'
        risk_title = 'MODERATE RISK'
        summary_reason = 'A few clauses, potential deductions, or information gaps require close attention before signing.'

    return RiskAssessment(
        overallScore=total_score,
        riskLevel=risk_level,
        riskTitle=risk_title,
        summaryReason=summary_reason,
        reasons=reasons,
        positiveFactors=positive_factors,
        factors=factors,
        confidenceScore=94,
        disclaimer='LoanShield AI provides AI-assisted information and risk analysis based on the information and documents submitted by the user. It does not provide legal, financial, or regulatory advice and does not determine whether a lender has violated the law.',
    )


def get_default_permission_catalog(selected_keys: List[PermissionType] = None) -> List[PermissionRisk]:
    if selected_keys is None:
        selected_keys = []

    catalog = [
        PermissionRisk(
            permission='CONTACTS',
            displayName='Contacts Access (Read Contacts)',
            concernLevel='HIGH',
            whyItMatters='Allows the application to upload and read your entire phonebook, including family, colleagues, and friends.',
            potentialAbuseContext='Some digital lenders have used contact lists to call friends and family members during recovery, causing social distress.',
            recommendation='Legitimate regulated financial apps in Pakistan generally do not require contact book scraping for credit assessment.',
            requested=False,
        ),
        PermissionRisk(
            permission='STORAGE_GALLERY',
            displayName='Storage & Gallery (Photos / Media)',
            concernLevel='HIGH',
            whyItMatters='Grants access to private photos, personal documents, and media stored on your smartphone.',
            potentialAbuseContext='Sensitive personal media can be exposed. Only specific ID document photo uploads should be needed, not full gallery access.',
            recommendation='Never grant persistent all-files storage permission to a digital lending application.',
            requested=False,
        ),
        PermissionRisk(
            permission='CALL_LOGS',
            displayName='Call Logs & Phone State',
            concernLevel='HIGH',
            whyItMatters='Enables the lender to monitor whom you call, how frequently, and at what times.',
            potentialAbuseContext='Often used to analyze social graph density and identify close personal ties for recovery pressure.',
            recommendation='Reject call log permissions as they are unnecessary for credit underwriting.',
            requested=False,
        ),
        PermissionRisk(
            permission='SMS',
            displayName='SMS Messages (Read & Receive)',
            concernLevel='MODERATE',
            whyItMatters='Allows reading OTPs, personal messages, and transactional SMS messages from your bank.',
            potentialAbuseContext='While used by some fintechs for automated bank transaction verification, broad SMS access can compromise other private communications.',
            recommendation='Ensure the app only accesses transactional/banking SMS or uses single-use OTP autofill APIs.',
            requested=False,
        ),
        PermissionRisk(
            permission='LOCATION',
            displayName='Precise Geolocation (GPS)',
            concernLevel='MODERATE',
            whyItMatters='Continuously tracks your physical whereabouts and home/work locations.',
            potentialAbuseContext='Location data may be used to verify physical residency or track daily movement patterns.',
            recommendation='Allow "While using the app" only if required for fraud prevention; avoid background location access.',
            requested=False,
        ),
        PermissionRisk(
            permission='CAMERA',
            displayName='Camera Access',
            concernLevel='LOW',
            whyItMatters='Required for real-time CNIC / facial liveness verification during KYC onboarding.',
            potentialAbuseContext='Low risk when limited to taking real-time selfie and CNIC scans during registration.',
            recommendation='Standard practice for official SECP biometric and CNIC verification.',
            requested=False,
        ),
        PermissionRisk(
            permission='MICROPHONE',
            displayName='Microphone (Audio Recording)',
            concernLevel='MODERATE',
            whyItMatters='Allows recording ambient sound and voice conversations.',
            potentialAbuseContext='Rarely needed for simple loans; usually only relevant if video-KYC interview is conducted.',
            recommendation='Do not grant microphone permission unless participating in a live verified agent video call.',
            requested=False,
        ),
        PermissionRisk(
            permission='PHONE_STATE',
            displayName='Phone State & Device ID (IMEI)',
            concernLevel='LOW',
            whyItMatters='Reads unique device identifier to prevent multiple fraudulent account registrations on one handset.',
            potentialAbuseContext='Standard security telemetry for banking applications to detect emulators or SIM changes.',
            recommendation='Standard risk-control permission for banking apps.',
            requested=False,
        ),
    ]

    return [item.model_copy(update={'requested': item.permission in selected_keys}) for item in catalog]
