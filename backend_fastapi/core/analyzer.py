import math
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from models import (
    AnalysisMethod,
    AnalysisResult,
    ContractClause,
    ContractReality,
    DemoScenario,
    DiscrepancyItem,
    EssentialFinancialTerm,
    ExecutiveSummary,
    FinancialBreakdown,
    LoanCharge,
    MultilingualText,
    PermissionRisk,
    PermissionType,
    RiskLevel,
    SecpViolation,
    VerificationItem,
)
from core.calculations import calculate_financials, calculate_risk_assessment, get_default_permission_catalog
from core.demo_scenarios import DEMO_SCENARIOS
from core.gemini_service import extract_loan_data


class AnalysisInputParams:
    def __init__(
        self,
        method: Optional[AnalysisMethod] = None,
        lenderName: Optional[str] = None,
        appName: Optional[str] = None,
        advertisedAmount: Optional[Any] = None,
        advertisedDuration: Optional[str] = None,
        advertisedMarkupRate: Optional[str] = None,
        expectedRepayment: Optional[Any] = None,
        requestedPermissions: Optional[List[str]] = None,
        fileBase64: Optional[str] = None,
        fileMimeType: Optional[str] = None,
        fileName: Optional[str] = None,
        rawText: Optional[str] = None,
        manualPrincipal: Optional[Any] = None,
        manualDurationDays: Optional[Any] = None,
        manualMarkupRateAnnual: Optional[Any] = None,
        manualUpfrontDeductions: Optional[Any] = None,
        manualChargesDescription: Optional[str] = None,
    ) -> None:
        self.method = method or 'AGREEMENT_UPLOAD'
        self.lenderName = lenderName
        self.appName = appName
        self.advertisedAmount = advertisedAmount
        self.advertisedDuration = advertisedDuration
        self.advertisedMarkupRate = advertisedMarkupRate
        self.expectedRepayment = expectedRepayment
        self.requestedPermissions = requestedPermissions or []
        self.fileBase64 = fileBase64
        self.fileMimeType = fileMimeType
        self.fileName = fileName
        self.rawText = rawText
        self.manualPrincipal = manualPrincipal
        self.manualDurationDays = manualDurationDays
        self.manualMarkupRateAnnual = manualMarkupRateAnnual
        self.manualUpfrontDeductions = manualUpfrontDeductions
        self.manualChargesDescription = manualChargesDescription


def _safe_float(val: Any) -> Optional[float]:
    if val is None or val == '':
        return None
    try:
        num = float(val)
        return None if math.isnan(num) else num
    except (TypeError, ValueError):
        return None


def _safe_int(val: Any) -> Optional[int]:
    if val is None or val == '':
        return None
    try:
        num = int(float(val))
        return num
    except (TypeError, ValueError):
        return None


def _calculate_apr(
    principal: Optional[float],
    net_disbursed: Optional[float],
    total_repayment: Optional[float],
    tenure_days: Optional[int],
) -> Optional[float]:
    if principal is None or net_disbursed is None or total_repayment is None or tenure_days is None:
        return None
    if net_disbursed <= 0 or tenure_days <= 0:
        return None
    total_cost = total_repayment - net_disbursed
    if total_cost <= 0:
        return 0.0
    period_rate = total_cost / net_disbursed
    annual_periods = 365.0 / tenure_days
    apr = period_rate * annual_periods * 100.0
    return round(apr * 100) / 100


def _format_pkr(amount: Optional[float]) -> str:
    if amount is None or (isinstance(amount, float) and math.isnan(amount)):
        return 'Not clearly specified'
    return f'PKR {round(amount):,}'


async def analyze_loan_document(params: AnalysisInputParams) -> AnalysisResult:
    raw_text = (params.rawText or '').strip()
    lender_name = params.lenderName or 'Digital Lending Entity'
    app_name = params.appName or 'Mobile Loan App'
    advertised_amount = _safe_float(params.advertisedAmount)
    advertised_duration = params.advertisedDuration or 'Not specified'
    advertised_rate = params.advertisedMarkupRate or 'Not specified'
    expected_repayment = _safe_float(params.expectedRepayment)
    requested_perms = list(params.requestedPermissions or [])

    manual_principal = _safe_float(params.manualPrincipal)
    manual_duration = _safe_int(params.manualDurationDays)
    manual_markup_annual = _safe_float(params.manualMarkupRateAnnual)
    manual_upfront = _safe_float(params.manualUpfrontDeductions)

    ai_data: Optional[Dict[str, Any]] = None
    if raw_text or params.fileBase64 or manual_principal is not None:
        ai_data = await extract_loan_data(
            raw_text=raw_text,
            file_base64=params.fileBase64,
            file_mime_type=params.fileMimeType,
            advertised_amount=advertised_amount,
            advertised_duration=advertised_duration,
        )

    text_lower = raw_text.lower()
    principal: Optional[float] = manual_principal
    duration_days: Optional[int] = manual_duration
    upfront_deductions: Optional[float] = manual_upfront
    total_repayment: Optional[float] = expected_repayment
    charges_list: List[LoanCharge] = []

    is_disbursement_deferred = (
        'to be determined after approval' in text_lower
        or ('disbursed to borrower' in text_lower and 'after approval' in text_lower)
    )
    is_repayment_deferred = (
        is_disbursement_deferred
        or 'repayment schedule provided after' in text_lower
        or 'schedule provided after disbursement' in text_lower
        or ('repayment schedule' in text_lower and 'after disbursement' in text_lower)
    )

    ai_principal = _safe_float(ai_data.get('principal')) if ai_data else None
    ai_duration = _safe_int(ai_data.get('duration_days')) if ai_data else None
    ai_upfront = _safe_float(ai_data.get('upfront_deductions')) if ai_data else None
    ai_repayment = _safe_float(ai_data.get('total_repayment')) if ai_data else None
    ai_markup = _safe_float(ai_data.get('markup_rate_annual')) if ai_data else None

    if ai_data:
        if ai_data.get('lenderName') and lender_name == 'Digital Lending Entity':
            lender_name = ai_data['lenderName']
        if ai_data.get('appName') and app_name == 'Mobile Loan App':
            app_name = ai_data['appName']
        if ai_data.get('sensitive_permissions') and not requested_perms:
            requested_perms = [str(p).upper() for p in ai_data['sensitive_permissions']]
        if ai_data.get('is_deferred_disbursement'):
            is_disbursement_deferred = True
            is_repayment_deferred = True

    if principal is None and ai_principal is not None:
        principal = ai_principal

    if principal is None:
        p_match = re.search(
            r'(?:approved|loan|sanction|limit|amount|borrow|principal|rs\.?|pkr)\s*[:=-]?\s*(?:pkr|rs\.?)?\s*([\d,]{4,})',
            text_lower,
        )
        if p_match:
            principal = float(p_match.group(1).replace(',', ''))

    if duration_days is None and ai_duration is not None:
        duration_days = ai_duration

    if duration_days is None:
        t_match = re.search(
            r'(?:tenure|duration|term|din|days)\s*[:=-]?\s*(\d+)\s*(?:days?|din)?',
            text_lower,
        )
        if t_match:
            duration_days = int(t_match.group(1))
        elif '7 days' in text_lower or '7 din' in text_lower or '7-day' in text_lower:
            duration_days = 7
        elif '14 days' in text_lower or '14 din' in text_lower or '14-day' in text_lower:
            duration_days = 14
        elif '90 days' in text_lower or '3 months' in text_lower:
            duration_days = 90
        elif '180 days' in text_lower or '6 months' in text_lower:
            duration_days = 180

    if ai_data and isinstance(ai_data.get('charges'), list):
        for ch in ai_data['charges']:
            if not isinstance(ch, dict):
                continue
            amt = _safe_float(ch.get('amount'))
            if amt is not None and amt > 0:
                charges_list.append(
                    LoanCharge(
                        id=f'ch-{len(charges_list) + 1}',
                        name=str(ch.get('name') or 'Upfront Deduction').strip(),
                        amount=amt,
                        percentage=round((amt / principal) * 10000) / 100 if principal and principal > 0 else None,
                        isDeductedFromDisbursement=True,
                        description='Deducted upfront from loan amount.',
                        isClearlyDisclosed=True,
                        type='UPFRONT_DEDUCTION',
                    )
                )

    if (upfront_deductions is None or upfront_deductions <= 0) and manual_upfront is None:
        if ai_upfront is not None and ai_upfront > 0:
            upfront_deductions = ai_upfront
        elif charges_list:
            upfront_deductions = sum(c.amount or 0 for c in charges_list)
        else:
            fee_match = re.search(
                r'(?:total deductions?|processing fee|service charge|deductions?|platform fee|katauti|cut)\s*[:=-]?\s*(?:pkr|rs\.?)?\s*([\d,]{3,})',
                text_lower,
            )
            upfront_deductions = float(fee_match.group(1).replace(',', '')) if fee_match else 0.0

            itemized_sum = 0.0
            for match in re.finditer(
                r'[-•*]?\s*([A-Za-z\s]+(?:Fee|Charge|Surcharge|Commission|Deduction))\s*[:=-]\s*(?:pkr|rs\.?)?\s*([\d,]+)',
                raw_text or '',
                re.IGNORECASE,
            ):
                name = match.group(1).strip()
                val = float(match.group(2).replace(',', ''))
                if val > 0:
                    itemized_sum += val
                    charges_list.append(
                        LoanCharge(
                            id=f'ch-{len(charges_list) + 1}',
                            name=name,
                            amount=val,
                            percentage=round((val / principal) * 10000) / 100 if principal and principal > 0 else None,
                            isDeductedFromDisbursement=True,
                            description='Deducted upfront from loan amount.',
                            isClearlyDisclosed=True,
                            type='UPFRONT_DEDUCTION',
                        )
                    )
            if itemized_sum > 0 and (not upfront_deductions or upfront_deductions <= 0):
                upfront_deductions = itemized_sum

    if charges_list and upfront_deductions is not None and upfront_deductions > 0:
        itemized_sum = sum(c.amount or 0 for c in charges_list)
        if itemized_sum < upfront_deductions - 0.01:
            remainder = round(upfront_deductions - itemized_sum, 2)
            charges_list.append(
                LoanCharge(
                    id='ch-addl-1',
                    name='Other upfront deductions',
                    amount=remainder,
                    percentage=round((remainder / principal) * 10000) / 100 if principal and principal > 0 else None,
                    isDeductedFromDisbursement=True,
                    description='Stated total deductions exceed itemized fees.',
                    isClearlyDisclosed=True,
                    type='UPFRONT_DEDUCTION',
                )
            )
        elif itemized_sum > upfront_deductions + 0.01:
            upfront_deductions = itemized_sum

    deduction_status: str = 'NO_DEDUCTIONS_MENTIONED'
    deduction_status_text = 'No upfront fee deductions declared.'
    actual_disbursed: Optional[float] = principal
    is_disbursement_confirmed = principal is not None

    if is_disbursement_deferred:
        is_disbursement_confirmed = False
        actual_disbursed = None
        deduction_status = 'POTENTIAL_DEDUCTIONS_UNCLEAR'
        deduction_status_text = 'Potential deductions are mentioned, but the exact amounts are not clearly specified.'
    else:
        net_match = re.search(
            r'(?:net disbursed|net disbursement|disbursed net|amount disbursed|cash in hand|credited to borrower|disbursed)\s*(?:net)?\s*(?:to bank account|to borrower|to account)?\s*[:=-]?\s*(?:pkr|rs\.?)?\s*([\d,]+)',
            text_lower,
        )
        if net_match:
            net_val = float(net_match.group(1).replace(',', ''))
            if principal is not None and net_val < principal:
                if not upfront_deductions or upfront_deductions <= 0:
                    upfront_deductions = principal - net_val
                actual_disbursed = net_val
                deduction_status = 'DEDUCTIONS_CONFIRMED'
                deduction_status_text = f'PKR {upfront_deductions:,.0f} deducted upfront.'
            elif net_val > 0:
                actual_disbursed = net_val
        elif upfront_deductions and upfront_deductions > 0 and principal is not None:
            actual_disbursed = max(0.0, principal - upfront_deductions)
            deduction_status = 'DEDUCTIONS_CONFIRMED'
            deduction_status_text = f'PKR {upfront_deductions:,.0f} deducted upfront.'
        elif principal is None:
            actual_disbursed = None
            is_disbursement_confirmed = False

    if upfront_deductions and upfront_deductions > 0 and principal is not None and principal > 0 and not charges_list:
        charges_list.append(
            LoanCharge(
                id='ch-upfront-1',
                name='Upfront Processing & Service Deduction',
                amount=upfront_deductions,
                percentage=round((upfront_deductions / principal) * 10000) / 100,
                isDeductedFromDisbursement=True,
                description='Deducted directly from sanctioned loan before transfer.',
                isClearlyDisclosed=True,
                type='UPFRONT_DEDUCTION',
            )
        )

    number_of_installments = 1
    if is_repayment_deferred:
        total_repayment = None
        duration_days = None
    elif total_repayment is None and ai_repayment is not None and ai_repayment > 0:
        total_repayment = ai_repayment
    elif total_repayment is None:
        rep_match = re.search(
            r'(?:total repayment(?:\s+(?:due|payable))?|repayment amount|total payable|payable amount|repay a total of|total obligation|repayment sum|wapis)\s*[:=-]?\s*(?:of)?\s*(?:pkr|rs\.?)?\s*([\d,]+)',
            text_lower,
        )
        if rep_match:
            total_repayment = float(rep_match.group(1).replace(',', ''))
        else:
            inst_match = re.search(
                r'(\d+)\s*(?:equal\s+)?(?:monthly\s+)?installments?\s+of\s*(?:pkr|rs\.?)?\s*([\d,]+)',
                text_lower,
            )
            if inst_match:
                number_of_installments = int(inst_match.group(1))
                inst_amt = float(inst_match.group(2).replace(',', ''))
                total_repayment = number_of_installments * inst_amt
            elif (manual_markup_annual or ai_markup) and principal is not None and duration_days is not None:
                markup_rate_src = manual_markup_annual or ai_markup
                markup_amount = principal * (markup_rate_src / 100.0) * (duration_days / 365.0)
                total_repayment = principal + markup_amount

    is_repayment_confirmed = total_repayment is not None
    apr = _calculate_apr(principal, actual_disbursed, total_repayment, duration_days)

    has_contact_violation = any(
        'CONTACT' in p.upper() or 'PHONEBOOK' in p.upper() for p in requested_perms
    )

    secp_violations: List[SecpViolation] = []
    if has_contact_violation:
        secp_violations.append(
            SecpViolation(
                code='SECP-CIRC-15-CONTACTS',
                title='Illegal Contact List & Phonebook Harvest',
                severity='CRITICAL',
                description='SECP Circular No. 15 of 2023 prohibits digital lending platforms from accessing borrower contact lists.',
                actionRequired='Immediately revoke phonebook permissions and file a complaint via SECP ServiceDesk.',
            )
        )
    if principal is not None and upfront_deductions is not None and upfront_deductions > principal * 0.15:
        secp_violations.append(
            SecpViolation(
                code='SECP-CIRC-10-FEES',
                title='Excessive Upfront Processing Deductions',
                severity='CRITICAL',
                description='Deducting excessive processing or service charges upfront before cash disbursement violates SECP pricing transparency rules.',
                actionRequired='Verify that all charges are explicitly reflected in a standardized Key Fact Statement (KFS).',
            )
        )
    if duration_days is not None and duration_days < 30:
        secp_violations.append(
            SecpViolation(
                code='SECP-CIRC-10-TENURE',
                title='Sub-30-Day Predatory Tenure',
                severity='HIGH',
                description='Digital nano-loans with ultra-short repayment windows (e.g. 7 or 14 days) subject borrowers to debt-trap roll-over cycles.',
                actionRequired='Opt for regulated microfinance providers offering standard installment horizons (>= 30 days).',
            )
        )

    permission_types: List[PermissionType] = [
        'CONTACTS', 'CAMERA', 'LOCATION', 'STORAGE_GALLERY', 'SMS', 'PHONE_STATE', 'CALL_LOGS', 'MICROPHONE'
    ]
    active_perm_types: List[PermissionType] = [
        pt for pt in permission_types
        if any(pt in p.upper() for p in requested_perms)
    ]
    perms_catalog = get_default_permission_catalog(active_perm_types)

    upfront_ratio = (upfront_deductions / principal * 100) if principal and principal > 0 and upfront_deductions else 0.0
    clause1_risk = 'RED' if upfront_ratio >= 20 else ('YELLOW' if upfront_ratio >= 5 else 'GREEN')
    clause2_risk = 'RED' if (duration_days is not None and duration_days < 30) else ('YELLOW' if duration_days is None else 'GREEN')
    has_daily_penalty = any(
        phrase in text_lower
        for phrase in ['daily default', 'per calendar day', 'compound', '1.5% per day', '2.5% per day']
    )
    clause3_risk = (
        'RED' if has_daily_penalty
        else 'GREEN' if any(p in text_lower for p in ['grace period', 'flat fee', 'flat pkr', 'fixed pkr'])
        else 'YELLOW'
    )

    clauses: List[ContractClause] = [
        ContractClause(
            id='clause-1',
            clauseTitle='Disbursement & Upfront Deductions',
            originalText=deduction_status_text,
            category='INTEREST_AND_FEES',
            simpleExplanation=MultilingualText(
                en=(f'Upfront deduction of PKR {upfront_deductions:,.0f} from the sanctioned principal.' if upfront_deductions and upfront_deductions > 0 and principal is not None else 'No excessive upfront cuts detected.'),
                ur=(f'منظور شدہ رقم میں سے PKR {upfront_deductions:,.0f} پیشگی فیس کاٹ لی جائے گی۔' if upfront_deductions and upfront_deductions > 0 and principal is not None else 'کوئی غیر معمولی پیشگی کٹوتی نہیں پائی گئی۔'),
                roman_ur=(f'Manzoor shuda raqam mein se PKR {upfront_deductions:,.0f} peshgi fees kaat li jaye gi.' if upfront_deductions and upfront_deductions > 0 and principal is not None else 'Koi ghair mamooli peshgi katouti nahi payi gayi.'),
            ),
            whyItMatters=MultilingualText(
                en='Reduces actual cash received while liability remains on the full principal.',
                ur='ہاتھ میں ملنے والی رقم کم ہو جاتی ہے لیکن واپسی پورے قرض پر کرنا ہوتی ہے۔',
                roman_ur=(f'Manzoor shuda raqam mein se peshgi fees kaat li jaye gi.' if upfront_deductions and upfront_deductions > 0 and principal is not None else 'Koi ghair mamooli peshgi katouti nahi payi gayi.'),
            ),
            riskFlag=clause1_risk,
        ),
        ContractClause(
            id='clause-2',
            clauseTitle='Repayment Horizon & Due Date',
            originalText=(f'Total repayment of PKR {total_repayment:,.0f} due strictly within {duration_days} days.' if total_repayment is not None and duration_days is not None else 'Repayment amount and due date are not specified before approval.'),
            category='DEFAULT_AND_LEGAL',
            simpleExplanation=MultilingualText(
                en=(f'Loan must be fully cleared in {duration_days} days.' if duration_days is not None else 'Loan tenure is not specified in the submitted document.'),
                ur=(f'قرضے کی مکمل واپسی {duration_days} دن کے اندر کرنا ہوگی۔' if duration_days is not None else 'قرضے کی مدت دستاویز میں درج نہیں۔'),
                roman_ur=(f'Qarzay ki mukammal wapsi {duration_days} din ke andar karna hogi.' if duration_days is not None else 'Qarzay ki muddat dastaweez mein darj nahi.'),
            ),
            whyItMatters=MultilingualText(
                en='Short durations (7-14 days) lead to severe rollover debt-traps.',
                ur='کم مدت (7 تا 14 دن) ادھار واپس نہ کر سکنے کی صورت میں شدید سود کا باعث بنتی ہے۔',
                roman_ur='Kam muddat (7 se 14 din) qarz wapas na hone par mazeed jurmana lagati hai.',
            ),
            riskFlag=clause2_risk,
        ),
        ContractClause(
            id='clause-3',
            clauseTitle='Late Payment Penalties & Default Charges',
            originalText='A daily compound default penalty accrues immediately upon overdue balance.' if has_daily_penalty else 'Late payments incur flat capped charges after a defined grace period.',
            category='PENALTIES',
            simpleExplanation=MultilingualText(
                en=('Daily default penalties will accrue automatically upon missing the scheduled due date.' if has_daily_penalty else 'Standard flat late fee with grace period applied if repayment is delayed.'),
                ur=('مقررہ تاریخ پر رقم واپس نہ کرنے کی صورت میں روزانہ جرمانہ عائد ہوگا۔' if has_daily_penalty else 'معیاری فلیٹ لیٹ فیس رعایت کی مدت کے بعد لاگو ہوگی۔'),
                roman_ur=('Muqarrara tareekh par raqam wapas na karne par rozana jurmana aaid hoga.' if has_daily_penalty else 'Meyari flat late fee grace period ke baad aaid hogi.'),
            ),
            whyItMatters=MultilingualText(
                en=('Daily penalty compounding can rapidly escalate outstanding debt.' if has_daily_penalty else 'Disclosed flat charges provide predictability.'),
                ur=('روزانہ جرمانہ لگنے سے قرضہ چند ہفتوں میں دگنا ہو سکتا ہے۔' if has_daily_penalty else 'واضح فلیٹ فیس سے اخراجات کا اندازہ رہتا ہے۔'),
                roman_ur=('Rozana jurmana lagne se qarz tezi se barh sakta hai.' if has_daily_penalty else 'Wazeh flat fees se ikhrajat ka andaza rehta hai.'),
            ),
            riskFlag=clause3_risk,
        ),
    ]

    has_negative_recovery = any(
        phrase in text_lower for phrase in [
            'no phonebook', 'no access to the borrower', 'no access to personal contacts',
            'no access to contacts', 'no contact access', 'no contacts',
            'institutional bank notices only', 'institutional recovery only', 'institutional notices only'
        ]
    )
    has_aggressive_recovery = (
        not has_negative_recovery
        and any(
            phrase in text_lower for phrase in [
                'emergency contact', 'family references', 'social references', 'access contacts',
                'reach out to personal contacts', 'contact book'
            ]
        )
        or ('phonebook' in text_lower and 'no phonebook' not in text_lower)
    )

    if has_aggressive_recovery:
        clauses.append(
            ContractClause(
                id='clause-4',
                clauseTitle='Collection & Third-Party Reach',
                originalText='Borrower authorizes lender to reach out to personal contacts, family, or references.',
                category='RECOVERY',
                simpleExplanation=MultilingualText(
                    en='Lender reserves right to contact your family, friends, or employer for recovery.',
                    ur='قرض دہندہ وصولی کے لیے آپ کے خاندان اور دوستوں سے رابطہ کر سکتا ہے۔',
                    roman_ur='Qarz dahinda wasooli ke liye aap ke khandaan aur doston se rabta kar sakta hai.',
                ),
                whyItMatters=MultilingualText(
                    en='Harassment and contact shaming violate SECP digital lending regulations.',
                    ur='خاندان سے رابطہ کرنا اور ہراساں کرنا ایس ای سی پی قوانین کی خلاف ورزی ہے۔',
                    roman_ur='Khandan se rabta karna SECP qawaneen ki khilaf warzi hai.',
                ),
                riskFlag='RED',
            )
        )
    elif has_negative_recovery or 'institutional' in text_lower:
        clauses.append(
            ContractClause(
                id='clause-4',
                clauseTitle='Institutional Recovery & Consumer Protection',
                originalText='Standard institutional recovery notices only. No access to personal contacts or phonebook.',
                category='RECOVERY',
                simpleExplanation=MultilingualText(
                    en='Lender adheres to SECP fair debt collection guidelines with institutional bank notices only.',
                    ur='قرض دہندہ وصولی کے لیے صرف باقاعدہ نوٹس بھیجنے کا مجاز ہے، نجی رابطوں تک رسائی ممنوع ہے۔',
                    roman_ur='Qarz dahinda wasooli ke liye sirf baqaida notice bhej sakta hai, niji rabton tak rasai mamnoo hai.',
                ),
                whyItMatters=MultilingualText(
                    en='Protects borrower from harassment and unauthorized third-party contact.',
                    ur='صارف کو ہراساں کیے جانے اور دوست احباب سے رابطے سے محفوظ رکھتا ہے۔',
                    roman_ur='Sarif ko harasan kiye jane se mehfooz rakhta hai.',
                ),
                riskFlag='GREEN',
            )
        )

    discrepancies: List[DiscrepancyItem] = []
    if (upfront_deductions or 0) > 0 or not is_disbursement_confirmed or principal is None:
        is_critical = upfront_ratio >= 20
        is_warning = upfront_ratio >= 10
        discrepancies.append(
            DiscrepancyItem(
                id='disc-1',
                category='FEES_AND_CHARGES',
                riskType='INFORMATION_GAP' if (deduction_status == 'POTENTIAL_DEDUCTIONS_UNCLEAR' or principal is None) else 'KNOWN_RISK',
                promised=f'Disbursed: {_format_pkr(principal)}' if principal is not None else 'Disbursed amount not specified',
                actual=f'Received: {_format_pkr(actual_disbursed)}' if actual_disbursed is not None else 'Amount unconfirmed before approval',
                severity='CRITICAL' if is_critical else 'WARNING' if is_warning else 'INFO',
                explanation=(f'Upfront deduction of PKR {upfront_deductions:,.0f} ({round(upfront_ratio)}%) reduces actual in-hand cash.' if (upfront_deductions or 0) > 0 else 'Exact disbursement amount and deductions are not disclosed before approval.'),
                isNumericalVariance=((upfront_deductions or 0) > 0 and principal is not None and actual_disbursed is not None),
                varianceAmount=upfront_deductions if (upfront_deductions or 0) > 0 else None,
                variancePercentage=round(upfront_ratio * 10) / 10 if (upfront_deductions or 0) > 0 and principal else None,
                evidence=deduction_status_text,
                interpretation=(f'Borrower pays interest on full principal despite receiving lower net amount.' if (upfront_deductions or 0) > 0 else 'Borrower cannot verify the true cost of the loan before accepting.'),
            )
        )

    missing_essential_terms = [principal, actual_disbursed, total_repayment, duration_days, apr]
    missing_count = sum(1 for v in missing_essential_terms if v is None)
    has_major_information_gap = (
        missing_count >= 2
        or deduction_status == 'POTENTIAL_DEDUCTIONS_UNCLEAR'
        or not is_disbursement_confirmed
    )

    financial_breakdown = calculate_financials({
        'advertisedAmount': advertised_amount,
        'principalAmount': principal or 0,
        'durationDays': duration_days or 30,
        'markupRateAnnual': manual_markup_annual or ai_markup or (apr if apr is not None and apr < 100 else None),
        'totalRepaymentAmount': total_repayment,
        'numberOfInstallments': number_of_installments,
        'charges': charges_list,
        'rawText': raw_text,
        'isDisbursementDeferred': is_disbursement_deferred,
        'isRepaymentDeferred': is_repayment_deferred,
    })

    risk_assessment = calculate_risk_assessment(
        financials=financial_breakdown,
        charges=charges_list,
        clauses=clauses,
        permissions=perms_catalog,
        discrepancies=discrepancies,
        missing_key_terms=has_major_information_gap,
        device_permissions_specified=len(requested_perms) > 0,
    )

    actual_disbursed_text = (
        f'You will receive PKR {actual_disbursed:,.0f} net after deductions.'
        if actual_disbursed is not None
        else 'The actual amount received cannot be confirmed from the submitted document before approval.'
    )
    total_repay_text = (
        f'You will be required to repay a total of PKR {total_repayment:,.0f} over {duration_days} days.'
        if total_repayment is not None and duration_days is not None
        else 'The total repayment amount and tenure cannot be confirmed from the submitted document.'
    )

    executive_summary = ExecutiveSummary(
        actualAmountReceivedText=actual_disbursed_text,
        totalRepaymentText=total_repay_text,
        chargesIdentifiedSummary=deduction_status_text,
        latePaymentImpactSummary=(
            'Daily compounding penalty of 1.5% - 2.5% per day will rapidly increase outstanding debt.'
            if has_daily_penalty
            else 'Late payments incur flat capped charges after a defined grace period.'
        ),
        criticalClausesSummary='Please review the default, tenure, and collection clauses carefully before agreeing.',
        promiseDiscrepancySummary=f'Identified {len(secp_violations)} regulatory alerts and upfront deduction evaluations.',
        privacyConcernsSummary=(
            'Sensitive device permissions detected (Contacts access illegal under SECP).'
            if has_contact_violation
            else (f'Standard KYC permissions requested: {", ".join(active_perm_types)}.' if active_perm_types else 'Low privacy exposure: No invasive permissions requested.')
        ),
        verificationAdvice=[
            'Verify that the loan provider is officially licensed with the SECP.',
            'Confirm the exact net amount deposited into your wallet before accepting.',
            'Never grant contact book or photo gallery access on your device.',
        ],
    )

    verification_checklist = [
        VerificationItem(
            id='ver-1',
            title='Check SECP NBFC Digital Lending List',
            description='Ensure the company is registered under the SECP list of authorized digital lending Non-Banking Finance Companies.',
            isCritical=True,
            verificationTip='Search company title on secp.gov.pk under registered digital lending apps.',
        ),
        VerificationItem(
            id='ver-2',
            title='Confirm Net Cash vs Repayment Amount',
            description=f'Verify that receiving {_format_pkr(actual_disbursed)} is worth repaying {_format_pkr(total_repayment)}.',
            isCritical=True,
            verificationTip=(
                f'Total cost of this loan is PKR {(total_repayment - (actual_disbursed or principal or 0)):,.0f}.'
                if total_repayment is not None and (actual_disbursed is not None or principal is not None)
                else 'Total cost cannot be calculated because repayment or disbursement is not specified.'
            ),
        ),
        VerificationItem(
            id='ver-3',
            title='Deny Non-Essential Device Permissions',
            description='Refuse Contacts and Gallery permissions when prompted on your Android or iOS device.',
            isCritical=has_contact_violation,
            verificationTip='Regulated Pakistani fintechs do not require phonebook access for credit approval.',
        ),
    ]

    return AnalysisResult(
        id=f'analysis-{int(datetime.now(timezone.utc).timestamp() * 1000)}-{__import__("uuid").uuid4().hex[:4]}',
        createdAt=datetime.now(timezone.utc).isoformat(),
        lenderName=lender_name,
        appName=app_name,
        analysisMethod=params.method,
        fileName=params.fileName,
        fileType=params.fileMimeType,
        isDemo=False,
        devicePermissionsSpecified=len(requested_perms) > 0,
        riskAssessment=risk_assessment,
        financialBreakdown=financial_breakdown,
        advertisedPromise={
            'advertisedAmount': advertised_amount,
            'advertisedMarkupRate': advertised_rate,
            'advertisedDuration': advertised_duration,
            'advertisedDisbursedAmount': advertised_amount,
            'marketingClaims': ['Instant Loan Approval', 'Low Markup Rate', 'Quick Disbursal'],
            'advertisedRepaymentAmount': expected_repayment,
        },
        contractReality=ContractReality(
            documentedPrincipal=principal,
            documentedDisbursement=actual_disbursed,
            isDisbursementConfirmed=is_disbursement_confirmed,
            documentedDurationDays=duration_days,
            documentedMarkupRateAnnual=apr,
            totalUpfrontDeductions=upfront_deductions if deduction_status == 'DEDUCTIONS_CONFIRMED' else None,
            deductionStatus=deduction_status,
            totalRecurringFees=0.0,
            documentedRepaymentAmount=total_repayment,
            isRepaymentConfirmed=is_repayment_confirmed,
            latePenaltyRatePerDay=1.5 if has_daily_penalty else None,
            isSecpRegisteredClaimed=not has_contact_violation,
        ),
        discrepancies=discrepancies,
        permissions=perms_catalog,
        clauses=clauses,
        executiveSummary=executive_summary,
        verificationChecklist=verification_checklist,
        extractedRawTextSample=raw_text[:500] if raw_text else None,
    )


def get_demo_scenarios() -> List[DemoScenario]:
    return DEMO_SCENARIOS
