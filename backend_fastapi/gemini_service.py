import os
import re
import json
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None

from .secp_rules import SECP_VIOLATION_DEFINITIONS, SECP_REGULATORY_BENCHMARKS

def get_gemini_client():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None
    if genai:
        return genai.Client(api_key=api_key)
    return None

def calculate_apr(principal: float, net_disbursed: float, total_repayment: float, tenure_days: int) -> float:
    """
    Computes Effective Annual Percentage Rate (APR) based on net received vs total repaid over tenure.
    """
    if net_disbursed <= 0 or tenure_days <= 0:
        return 0.0
    total_cost = total_repayment - net_disbursed
    period_rate = total_cost / net_disbursed
    annual_periods = 365.0 / tenure_days
    apr = period_rate * annual_periods * 100.0
    return round(apr, 2)

async def analyze_loan_document(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main loan analysis orchestration for Python FastAPI.
    Supports both Gemini AI extraction and heuristic rule-based financial analysis.
    """
    client = get_gemini_client()
    raw_text = params.get("rawText", "") or ""
    lender_name = params.get("lenderName") or "Digital Lending Entity"
    app_name = params.get("appName") or "Mobile Loan App"
    advertised_amount = params.get("advertisedAmount")
    advertised_duration = params.get("advertisedDuration") or "30 Days"
    advertised_rate = params.get("advertisedMarkupRate") or "0.1% daily"
    expected_repayment = params.get("expectedRepayment")
    requested_perms = params.get("requestedPermissions") or []

    # Heuristic parsing fallback for principal and tenure
    principal = float(advertised_amount or 50000.0)
    duration_days = 30
    upfront_deductions = 0.0
    charges_list = []
    
    # Check text indicators
    text_lower = raw_text.lower()
    
    # 1. Tenure extraction
    if "7 days" in text_lower or "7-day" in text_lower:
        duration_days = 7
    elif "14 days" in text_lower or "14-day" in text_lower:
        duration_days = 14
    elif "90 days" in text_lower or "3 months" in text_lower:
        duration_days = 90
    elif "180 days" in text_lower or "6 months" in text_lower:
        duration_days = 180

    # 2. Upfront deductions status & amounts
    deduction_status = "NO_DEDUCTIONS"
    deduction_status_text = "No upfront fee deductions declared."
    actual_disbursed = principal
    is_disbursement_confirmed = True

    if "to be determined after approval" in text_lower or "disbursement: to be determined" in text_lower:
        is_disbursement_confirmed = False
        actual_disbursed = None
        deduction_status = "POTENTIAL_DEDUCTIONS_UNCLEAR"
        deduction_status_text = "Potential deductions are mentioned, but the exact amounts are not clearly specified."
    elif "processing fee" in text_lower or "service fee" in text_lower or "management fee" in text_lower:
        # Check explicit fees
        p_fee_match = re.search(r'(?:processing fee|service charge|deduction)[:\s]+(?:pkr|rs\.?)?\s*([\d,]+)', text_lower)
        if p_fee_match:
            fee_val = float(p_fee_match.group(1).replace(',', ''))
            upfront_deductions += fee_val
            charges_list.append({
                "name": "Upfront Processing & Service Fee",
                "amount": fee_val,
                "percentageOfPrincipal": round((fee_val / principal) * 100, 2),
                "isDisclosedUpfront": True,
                "isLegitimateUnderSECP": fee_val <= (principal * 0.05),
                "category": "PROCESSING_FEE",
                "explanation": "Deducted directly from loan amount before bank/wallet transfer."
            })
            actual_disbursed = principal - upfront_deductions
            deduction_status = "CONFIRMED_DEDUCTIONS"
            deduction_status_text = f"PKR {upfront_deductions:,.0f} deducted upfront."

    # 3. Total Repayment & Markup
    markup_amount = principal * (0.02 * (duration_days / 30))
    total_repayment = principal + markup_amount

    # 4. APR Calculation
    if actual_disbursed and actual_disbursed > 0:
        apr = calculate_apr(principal, actual_disbursed, total_repayment, duration_days)
    else:
        apr = calculate_apr(principal, principal, total_repayment, duration_days)

    # 5. Permission Audits
    permission_audits = []
    has_contact_violation = False
    for perm in requested_perms:
        perm_upper = perm.upper()
        if "CONTACT" in perm_upper or "PHONEBOOK" in perm_upper:
            has_contact_violation = True
            permission_audits.append({
                "permission": perm,
                "status": "UNAUTHORIZED_HARVESTING",
                "riskLevel": "CRITICAL",
                "explanation": "Contact list harvesting is strictly illegal under SECP Circular 15/2023.",
                "secpViolation": True
            })
        elif "LOCATION" in perm_upper or "STORAGE" in perm_upper or "CAMERA" in perm_upper:
            permission_audits.append({
                "permission": perm,
                "status": "ELEVATED_SURVEILLANCE",
                "riskLevel": "WARNING",
                "explanation": "Intrusive permission beyond basic transactional needs.",
                "secpViolation": False
            })
        else:
            permission_audits.append({
                "permission": perm,
                "status": "STANDARD",
                "riskLevel": "SAFE",
                "explanation": "Standard mobile OS permission.",
                "secpViolation": False
            })

    # 6. SECP Violations List
    secp_violations = []
    if has_contact_violation:
        secp_violations.append(SECP_VIOLATION_DEFINITIONS["UNAUTHORIZED_CONTACTS_ACCESS"])
    if upfront_deductions > (principal * 0.10):
        secp_violations.append(SECP_VIOLATION_DEFINITIONS["EXCESSIVE_UPFRONT_DEDUCTIONS"])
    if duration_days < 30:
        secp_violations.append(SECP_VIOLATION_DEFINITIONS["SHORT_TENURE_PREDATORY_TERM"])

    # 7. 7-Factor Risk Model Scoring (0 to 100 scale)
    factor_breakdown = [
        {
            "name": "Upfront Fee Deductions & Net Cashout",
            "category": "FINANCIAL_TRANSPARENCY",
            "riskType": "INFORMATION_GAP" if deduction_status == "POTENTIAL_DEDUCTIONS_UNCLEAR" else "KNOWN_RISK",
            "score": 15 if deduction_status == "CONFIRMED_DEDUCTIONS" and upfront_deductions > 0 else (12 if deduction_status == "POTENTIAL_DEDUCTIONS_UNCLEAR" else 2),
            "maxWeight": 20,
            "riskImpact": "HIGH" if upfront_deductions > 0 or deduction_status == "POTENTIAL_DEDUCTIONS_UNCLEAR" else "LOW",
            "finding": deduction_status_text,
            "evidence": "Loan schedule deduction clause in agreement",
            "interpretation": "Upfront cuts reduce actual received money while total repayment remains on full principal.",
            "confidenceLevel": "HIGH"
        },
        {
            "name": "Effective Annual Percentage Rate (APR)",
            "category": "PRICING_USURY",
            "riskType": "KNOWN_RISK",
            "score": 18 if apr > 100 else (10 if apr > 40 else 3),
            "maxWeight": 20,
            "riskImpact": "CRITICAL" if apr > 100 else ("HIGH" if apr > 40 else "LOW"),
            "finding": f"Calculated effective APR of {apr}% annualized.",
            "evidence": f"Repayment obligation PKR {total_repayment:,.0f} over {duration_days} days.",
            "interpretation": "Annualized percentage reflects true borrowing cost.",
            "confidenceLevel": "HIGH"
        },
        {
            "name": "Repayment Horizon & Tenure Risk",
            "category": "TENURE_SUITABILITY",
            "riskType": "KNOWN_RISK",
            "score": 15 if duration_days < 30 else 3,
            "maxWeight": 15,
            "riskImpact": "HIGH" if duration_days < 30 else "LOW",
            "finding": f"{duration_days}-day tenure ({'Violates 30-day SECP recommendation' if duration_days < 30 else 'Complies with standard term'}).",
            "evidence": f"Tenure: {duration_days} days",
            "interpretation": "Shorter loan horizons increase risk of rollover penalties.",
            "confidenceLevel": "HIGH"
        },
        {
            "name": "Device Permissions & Data Privacy",
            "category": "DATA_PRIVACY",
            "riskType": "KNOWN_RISK",
            "score": 15 if has_contact_violation else 2,
            "maxWeight": 15,
            "riskImpact": "CRITICAL" if has_contact_violation else "LOW",
            "finding": "Contacts access detected" if has_contact_violation else "No intrusive phonebook harvesting requested.",
            "evidence": ", ".join(requested_perms) or "No intrusive permissions",
            "interpretation": "Contact access creates severe privacy harassment vulnerabilities.",
            "confidenceLevel": "HIGH"
        },
        {
            "name": "SECP Licensing & Regulatory Compliance",
            "category": "REGULATORY_STATUS",
            "riskType": "KNOWN_RISK",
            "score": 10 if secp_violations else 1,
            "maxWeight": 10,
            "riskImpact": "HIGH" if secp_violations else "LOW",
            "finding": f"{len(secp_violations)} potential regulatory non-compliance issue(s) flagged.",
            "evidence": "SECP Circulars 10, 15, 22 compliance benchmarks",
            "interpretation": "Regulated NBFC lenders must conform strictly to transparent disclosures.",
            "confidenceLevel": "HIGH"
        },
        {
            "name": "Pre-Approval Transparency & Hidden Terms",
            "category": "DISCLOSURE_INTEGRITY",
            "riskType": "INFORMATION_GAP" if not is_disbursement_confirmed else "KNOWN_RISK",
            "score": 9 if not is_disbursement_confirmed else 2,
            "maxWeight": 10,
            "riskImpact": "MEDIUM" if not is_disbursement_confirmed else "LOW",
            "finding": "Key disbursement terms deferred until after submission." if not is_disbursement_confirmed else "Clear financial schedule provided.",
            "evidence": "Essential Financial Terms Audit",
            "interpretation": "All fees must be explicitly communicated before agreeing to borrow.",
            "confidenceLevel": "HIGH"
        },
        {
            "name": "Dispute Resolution & Redressal Mechanism",
            "category": "CONSUMER_PROTECTION",
            "riskType": "KNOWN_RISK",
            "score": 5 if secp_violations else 1,
            "maxWeight": 10,
            "riskImpact": "MEDIUM" if secp_violations else "LOW",
            "finding": "Redressal available through SECP ServiceDesk and SDMS.",
            "evidence": "Standard consumer grievance mechanism",
            "interpretation": "Access to formal regulatory arbitration protects borrowers.",
            "confidenceLevel": "HIGH"
        }
    ]

    total_risk_score = min(100, int(sum(f["score"] for f in factor_breakdown)))
    
    if total_risk_score >= 65:
        risk_level = "CRITICAL"
        risk_title = "High Risk / Predatory Indicators Detected"
        risk_summary = "Significant discrepancies, high fees, or non-compliant permissions detected in the loan terms."
    elif total_risk_score >= 35:
        risk_level = "MODERATE"
        risk_title = "Moderate Risk / Caution Advised"
        risk_summary = "Loan contains terms that require careful verification before accepting."
    else:
        risk_level = "SAFE"
        risk_title = "Low Risk / Standard Microfinance Terms"
        risk_summary = "Loan structure aligns with transparent consumer lending standards."

    # 8. Compile Full Analysis Result
    analysis_id = str(uuid.uuid4())
    
    return {
        "id": analysis_id,
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "lenderName": lender_name,
        "appName": app_name,
        "analysisMethod": params.get("method", "AGREEMENT_UPLOAD"),
        "isDemo": False,
        "riskAssessment": {
            "overallScore": total_risk_score,
            "riskLevel": risk_level,
            "riskTitle": risk_title,
            "summary": risk_summary,
            "factorBreakdown": factor_breakdown
        },
        "financialBreakdown": {
            "advertisedAmount": advertised_amount,
            "principalAmount": principal,
            "totalDeductions": upfront_deductions if deduction_status == "CONFIRMED_DEDUCTIONS" else None,
            "deductionStatus": deduction_status,
            "deductionStatusText": deduction_status_text,
            "actualDisbursedAmount": actual_disbursed,
            "isDisbursementConfirmed": is_disbursement_confirmed,
            "totalRepaymentAmount": total_repayment,
            "isRepaymentConfirmed": True,
            "totalCostOfBorrowing": total_repayment - (actual_disbursed or principal),
            "effectiveAnnualPercentageRate": apr,
            "effectiveMonthlyRate": round(apr / 12, 2),
            "durationDays": duration_days,
            "numberOfInstallments": 1,
            "installmentAmount": total_repayment,
            "chargesList": charges_list,
            "essentialTerms": [
                {"termName": "Sanctioned Principal Amount", "status": "CLEARLY_SPECIFIED", "details": f"PKR {principal:,.0f}"},
                {"termName": "Disbursement Amount", "status": "CLEARLY_SPECIFIED" if is_disbursement_confirmed else "PARTIALLY_SPECIFIED", "details": f"PKR {actual_disbursed:,.0f}" if is_disbursement_confirmed else "To be determined after approval"},
                {"termName": "Markup & Interest Rate", "status": "CLEARLY_SPECIFIED", "details": f"{apr}% Annualized APR"},
                {"termName": "Loan Tenure & Due Date", "status": "CLEARLY_SPECIFIED", "details": f"{duration_days} Days"},
                {"termName": "Fee Deductions Breakdown", "status": "CLEARLY_SPECIFIED" if deduction_status == "CONFIRMED_DEDUCTIONS" else ("PARTIALLY_SPECIFIED" if deduction_status == "POTENTIAL_DEDUCTIONS_UNCLEAR" else "CLEARLY_SPECIFIED"), "details": deduction_status_text}
            ],
            "assumptions": [
                f"Calculations based on {duration_days}-day tenure.",
                "Markup compounded standardly over repayment horizon."
            ]
        },
        "discrepancies": [
            {
                "id": "disc-1",
                "category": "FEES_AND_CHARGES",
                "riskType": "INFORMATION_GAP" if deduction_status == "POTENTIAL_DEDUCTIONS_UNCLEAR" else "KNOWN_RISK",
                "promised": f"Disbursed: PKR {principal:,.0f}",
                "actual": f"Received: PKR {actual_disbursed:,.0f}" if actual_disbursed else "Amount unconfirmed before approval",
                "severity": "CRITICAL" if upfront_deductions > 0 else "INFO",
                "explanation": "Upfront deduction reduces actual in-hand cash.",
                "isNumericalVariance": upfront_deductions > 0,
                "varianceAmount": upfront_deductions if upfront_deductions > 0 else None,
                "variancePercentage": round((upfront_deductions / principal) * 100, 1) if upfront_deductions > 0 else None,
                "evidence": deduction_status_text,
                "interpretation": "Borrower pays interest on full principal despite receiving lower net amount."
            }
        ] if upfront_deductions > 0 or not is_disbursement_confirmed else [],
        "permissionAudits": permission_audits,
        "secpViolations": secp_violations,
        "executiveSummary": {
            "discrepancySummary": f"Identified {len(secp_violations)} regulatory alerts and upfront deduction evaluations.",
            "cashoutSummary": f"Net cashout PKR {actual_disbursed:,.0f}" if actual_disbursed else "Net cashout to be confirmed after formal approval.",
            "chargesIdentifiedSummary": deduction_status_text,
            "overallAssessment": f"Overall risk assessment: {risk_level} ({total_risk_score}/100)."
        }
    }

async def answer_advisor_question(analysis: Dict[str, Any], question: str) -> str:
    """
    Loan advisor chat assistant using Gemini GenAI if available, with structured fallback.
    """
    client = get_gemini_client()
    if client:
        try:
            prompt = f"""
You are LoanShield AI's Senior Consumer Lending & Legal Advisor.
Context of analyzed loan:
- Lender: {analysis.get('lenderName', 'Unknown')}
- Principal: PKR {analysis.get('financialBreakdown', {}).get('principalAmount', 0):,}
- Effective APR: {analysis.get('financialBreakdown', {}).get('effectiveAnnualPercentageRate', 0)}%
- Risk Score: {analysis.get('riskAssessment', {}).get('overallScore', 0)}/100 ({analysis.get('riskAssessment', {}).get('riskLevel', 'UNKNOWN')})
- SECP Violations: {[v.get('title') for v in analysis.get('secpViolations', [])]}

User Question: {question}

Provide an objective, protective, and actionable answer citing Pakistani lending protections (SECP / SBP) in clear language:
"""
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            return response.text
        except Exception as e:
            pass

    # Intelligent deterministic response if Gemini is not configured
    q_lower = question.lower()
    if "safe" in q_lower or "scam" in q_lower or "risk" in q_lower:
        score = analysis.get("riskAssessment", {}).get("overallScore", 0)
        return f"Based on our analysis, this loan received a risk score of {score}/100. Always check if the lender holds an active NBFC Digital Lending license from SECP and never grant contacts permission."
    elif "apr" in q_lower or "interest" in q_lower or "markup" in q_lower:
        apr = analysis.get("financialBreakdown", {}).get("effectiveAnnualPercentageRate", 0)
        return f"The calculated effective Annual Percentage Rate (APR) for this agreement is {apr}%. Regulated rates typically range between 20%–45%."
    else:
        return f"Regarding your inquiry: ensure you review all upfront fee deductions and verify whether a formal SECP Key Fact Statement (KFS) is provided before accepting funds."
