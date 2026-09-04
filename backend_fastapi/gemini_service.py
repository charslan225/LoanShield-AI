import os
import re
import json
import uuid
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional
from datetime import datetime

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None

try:
    from secp_rules import SECP_VIOLATION_DEFINITIONS, SECP_REGULATORY_BENCHMARKS
except (ImportError, ValueError):
    from .secp_rules import SECP_VIOLATION_DEFINITIONS, SECP_REGULATORY_BENCHMARKS

def get_gemini_client():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None
    if genai:
        try:
            return genai.Client(api_key=api_key)
        except Exception:
            return None
    return None

def call_gemini_rest_api(prompt: str, file_base64: Optional[str] = None, mime_type: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Direct Gemini API caller using Python standard library (urllib.request).
    Supports gemini-1.5-flash and gemini-2.0-flash-exp with multimodal file support.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None

    models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-2.0-flash-exp"]
    
    parts: List[Dict[str, Any]] = []
    if file_base64 and mime_type:
        parts.append({
            "inlineData": {
                "mimeType": mime_type,
                "data": file_base64
            }
        })
    parts.append({"text": prompt})

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    encoded_body = json.dumps(payload).encode("utf-8")

    for model in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        req = urllib.request.Request(
            url,
            data=encoded_body,
            headers={"Content-Type": "application/json"}
        )
        try:
            with urllib.request.urlopen(req, timeout=12) as response:
                if response.status == 200:
                    resp_json = json.loads(response.read().decode("utf-8"))
                    candidates = resp_json.get("candidates", [])
                    if candidates:
                        text_content = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        if text_content:
                            return json.loads(text_content)
        except Exception as e:
            # Try next model in sequence
            continue

    return None

def safe_float(val: Any) -> Optional[float]:
    if val is None:
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def safe_int(val: Any) -> Optional[int]:
    if val is None:
        return None
    try:
        return int(val)
    except (ValueError, TypeError):
        return None


def calculate_apr(principal: Optional[float], net_disbursed: Optional[float], total_repayment: Optional[float], tenure_days: Optional[int]) -> Optional[float]:
    """
    Computes Effective Annual Percentage Rate (APR) based on net received vs total repaid over tenure.
    Returns None when any required value is missing or non-positive.
    """
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
    return round(apr, 2)

async def analyze_loan_document(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main loan analysis orchestration for Python FastAPI.
    Extracts real data using Gemini AI (REST/SDK) or advanced deterministic regex matching.
    """
    raw_text = params.get("rawText", "") or ""
    file_base64 = params.get("fileBase64")
    file_mime_type = params.get("fileMimeType")
    lender_name = params.get("lenderName") or "Digital Lending Entity"
    app_name = params.get("appName") or "Mobile Loan App"
    advertised_amount = params.get("advertisedAmount")
    advertised_duration = params.get("advertisedDuration") or "Not specified"
    advertised_rate = params.get("advertisedMarkupRate") or "Not specified"
    expected_repayment = params.get("expectedRepayment")
    requested_perms = params.get("requestedPermissions") or []

    # Manual input overrides
    manual_principal = params.get("manualPrincipal")
    manual_duration = params.get("manualDurationDays")
    manual_markup_annual = params.get("manualMarkupRateAnnual")
    manual_upfront = params.get("manualUpfrontDeductions")

    ai_data: Optional[Dict[str, Any]] = None

    # Step 1: Call Gemini AI if API key is present
    if os.environ.get("GEMINI_API_KEY") and (raw_text or file_base64 or manual_principal):
        extraction_prompt = f"""You are LoanShield AI, an expert loan document analyst in Pakistan.
Read the document carefully and extract only values that are EXPLICITLY stated.
CRITICAL: Do not infer, estimate, or hallucinate numbers. If a figure is not clearly stated (e.g., says "to be determined after approval" or "schedule provided after disbursement"), return null for that field.
Fields to extract:
- lenderName (string)
- appName (string)
- principal (exact approved/sanctioned loan amount number in PKR; null if only an advertised/marketing amount is shown)
- duration_days (tenure integer number of days explicitly stated; null if tenure or schedule is deferred)
- upfront_deductions (total amount deducted before cashout if explicitly stated; null if not)
- total_repayment (total repayment required if explicitly stated; null if deferred or schedule not provided)
- markup_rate_annual (percentage number if explicitly stated; null if not)
- charges (array of objects with name, amount, type: "UPFRONT_DEDUCTION"; empty if no explicit fees)
- sensitive_permissions (array of permissions mentioned e.g. CONTACTS, CAMERA, LOCATION, STORAGE)
- is_deferred_disbursement (boolean, true if document defers disbursement, fees, or repayment schedule until after approval)

Input Context:
Advertised Amount: {advertised_amount}
Advertised Duration: {advertised_duration}
Text:
{raw_text}

Return strictly a JSON object with these keys."""
        ai_data = call_gemini_rest_api(extraction_prompt, file_base64, file_mime_type)

    # Step 2: Establish base figures from manual overrides or deterministic regex parsing.
    # Unknown values remain None; no synthetic defaults are applied.
    # AI extraction is intentionally NOT trusted for numeric figures to avoid hallucinations;
    # it is used only for entity names, permissions, and deferred-disbursement flags.
    text_lower = raw_text.lower()
    principal = safe_float(manual_principal) if manual_principal is not None else None
    duration_days = safe_int(manual_duration) if manual_duration is not None else None
    upfront_deductions = safe_float(manual_upfront) if manual_upfront is not None else 0.0
    total_repayment = safe_float(expected_repayment) if expected_repayment is not None else None
    charges_list: List[Dict[str, Any]] = []

    # Detect intentionally vague / deferred terms before any extraction.
    is_disbursement_deferred = (
        "to be determined after approval" in text_lower or
        "disbursed to borrower" in text_lower and "after approval" in text_lower
    )
    is_repayment_deferred = (
        is_disbursement_deferred or
        "repayment schedule provided after" in text_lower or
        "schedule provided after disbursement" in text_lower or
        "repayment schedule" in text_lower and "after disbursement" in text_lower
    )

    if ai_data:
        # Only use AI for non-numeric context; ignore AI dollar/day figures.
        if ai_data.get("lenderName") and lender_name == "Digital Lending Entity":
            lender_name = ai_data["lenderName"]
        if ai_data.get("appName") and app_name == "Mobile Loan App":
            app_name = ai_data["appName"]
        if ai_data.get("sensitive_permissions") and not requested_perms:
            requested_perms = [p.upper() for p in ai_data["sensitive_permissions"]]
        if ai_data.get("is_deferred_disbursement"):
            is_disbursement_deferred = True
            is_repayment_deferred = True

    # Fallback to intelligent regex if figures are still missing
    if principal is None:
        p_match = re.search(r'(?:approved|loan|sanction|limit|amount|borrow|principal|rs\.?|pkr)\s*[:=-]?\s*(?:pkr|rs\.?)?\s*([\d,]{4,})', text_lower)
        if p_match:
            principal = float(p_match.group(1).replace(',', ''))

    if duration_days is None:
        t_match = re.search(r'(?:tenure|duration|term|din|days)\s*[:=-]?\s*(\d+)\s*(?:days?|din)?', text_lower)
        if t_match:
            duration_days = int(t_match.group(1))
        elif "7 days" in text_lower or "7 din" in text_lower or "7-day" in text_lower:
            duration_days = 7
        elif "14 days" in text_lower or "14 din" in text_lower or "14-day" in text_lower:
            duration_days = 14
        elif "90 days" in text_lower or "3 months" in text_lower:
            duration_days = 90
        elif "180 days" in text_lower or "6 months" in text_lower:
            duration_days = 180

    if (upfront_deductions is None or upfront_deductions <= 0) and manual_upfront is None:
        fee_match = re.search(r'(?:processing fee|service charge|deduction|fees?|katauti|cut)\s*[:=-]?\s*(?:pkr|rs\.?)?\s*([\d,]{3,})', text_lower)
        if fee_match:
            upfront_deductions = float(fee_match.group(1).replace(',', ''))
        else:
            upfront_deductions = 0.0

    if upfront_deductions and upfront_deductions > 0 and principal is not None and principal > 0:
        charges_list.append({
            "name": "Upfront Processing & Service Deduction",
            "amount": upfront_deductions,
            "percentageOfPrincipal": round((upfront_deductions / principal) * 100, 2),
            "isDisclosedUpfront": True,
            "isLegitimateUnderSECP": upfront_deductions <= (principal * 0.05),
            "category": "PROCESSING_FEE",
            "explanation": "Deducted directly from sanctioned loan before transfer."
        })

    # Step 3: Upfront deductions status & amounts
    deduction_status = "NO_DEDUCTIONS"
    deduction_status_text = "No upfront fee deductions declared."
    actual_disbursed = principal
    is_disbursement_confirmed = principal is not None

    if is_disbursement_deferred:
        is_disbursement_confirmed = False
        actual_disbursed = None
        deduction_status = "POTENTIAL_DEDUCTIONS_UNCLEAR"
        deduction_status_text = "Potential deductions are mentioned, but the exact amounts are not clearly specified."
    elif upfront_deductions and upfront_deductions > 0 and principal is not None:
        actual_disbursed = max(0.0, principal - upfront_deductions)
        deduction_status = "CONFIRMED_DEDUCTIONS"
        deduction_status_text = f"PKR {upfront_deductions:,.0f} deducted upfront."
    elif principal is None:
        actual_disbursed = None
        is_disbursement_confirmed = False

    # Step 4: Total Repayment & Markup
    # When repayment is deferred, do not invent a total or tenure.
    if is_repayment_deferred:
        total_repayment = None
        duration_days = None
    elif total_repayment is None:
        rep_match = re.search(r'(?:total repayment|repayment amount|total payable|payable amount|wapis)\s*[:=-]?\s*(?:pkr|rs\.?)?\s*([\d,]+)', text_lower)
        if rep_match:
            total_repayment = float(rep_match.group(1).replace(',', ''))
        elif manual_markup_annual and principal is not None and duration_days is not None:
            markup_amount = principal * (float(manual_markup_annual) / 100.0) * (duration_days / 365.0)
            total_repayment = principal + markup_amount

    is_repayment_confirmed = total_repayment is not None

    # Step 5: APR Calculation
    apr = calculate_apr(principal, actual_disbursed, total_repayment, duration_days)

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
                "riskLevel": "LOW",
                "explanation": "Standard mobile OS permission.",
                "secpViolation": False
            })

    # 6. SECP Violations List
    secp_violations = []
    if has_contact_violation:
        secp_violations.append(SECP_VIOLATION_DEFINITIONS["UNAUTHORIZED_CONTACTS_ACCESS"])
    if principal is not None and upfront_deductions > (principal * 0.10):
        secp_violations.append(SECP_VIOLATION_DEFINITIONS["EXCESSIVE_UPFRONT_DEDUCTIONS"])
    if duration_days is not None and duration_days < 30:
        secp_violations.append(SECP_VIOLATION_DEFINITIONS["SHORT_TENURE_PREDATORY_TERM"])

    # Track missing essential terms for information-gap scoring
    missing_essential_terms = [
        ("Sanctioned Principal Amount", principal),
        ("Disbursement Amount", actual_disbursed),
        ("Total Repayment Amount", total_repayment),
        ("Loan Tenure & Due Date", duration_days),
        ("Effective APR", apr)
    ]
    missing_key_terms_count = sum(1 for _, v in missing_essential_terms if v is None)
    has_major_information_gap = missing_key_terms_count >= 2 or deduction_status == "POTENTIAL_DEDUCTIONS_UNCLEAR" or not is_disbursement_confirmed

    # 7. 7-Factor Risk Model Scoring (0 to 100 scale)
    factor_breakdown = [
        {
            "name": "Upfront Fee Deductions & Net Cashout",
            "category": "FINANCIAL_TRANSPARENCY",
            "riskType": "INFORMATION_GAP" if deduction_status == "POTENTIAL_DEDUCTIONS_UNCLEAR" else "KNOWN_RISK",
            "score": 18 if has_major_information_gap else (15 if deduction_status == "CONFIRMED_DEDUCTIONS" and upfront_deductions > 0 else (12 if deduction_status == "POTENTIAL_DEDUCTIONS_UNCLEAR" else 2)),
            "maxWeight": 20,
            "riskImpact": "HIGH" if has_major_information_gap or upfront_deductions > 0 or deduction_status == "POTENTIAL_DEDUCTIONS_UNCLEAR" else "LOW",
            "finding": deduction_status_text,
            "evidence": "Loan schedule deduction clause in agreement",
            "interpretation": "Upfront cuts reduce actual received money while total repayment remains on full principal.",
            "confidenceLevel": "HIGH"
        },
        {
            "name": "Effective Annual Percentage Rate (APR)",
            "category": "PRICING_USURY",
            "riskType": "INFORMATION_GAP" if apr is None else "KNOWN_RISK",
            "score": 18 if apr is None else (18 if apr > 100 else (10 if apr > 40 else 3)),
            "maxWeight": 20,
            "riskImpact": "HIGH" if apr is None else ("CRITICAL" if apr > 100 else ("HIGH" if apr > 40 else "LOW")),
            "finding": "APR cannot be calculated: repayment or disbursement amount is not specified." if apr is None else f"Calculated effective APR of {apr}% annualized.",
            "evidence": f"Repayment obligation PKR {total_repayment:,.0f} over {duration_days} days." if total_repayment is not None and duration_days is not None else "Total repayment or tenure not specified in document.",
            "interpretation": "Annualized percentage reflects true borrowing cost.",
            "confidenceLevel": "HIGH"
        },
        {
            "name": "Repayment Horizon & Tenure Risk",
            "category": "TENURE_SUITABILITY",
            "riskType": "INFORMATION_GAP" if duration_days is None else "KNOWN_RISK",
            "score": 15 if duration_days is None else (15 if duration_days < 30 else 3),
            "maxWeight": 15,
            "riskImpact": "HIGH" if duration_days is None or duration_days < 30 else "LOW",
            "finding": "Loan tenure is not specified in the document." if duration_days is None else f"{duration_days}-day tenure ({'Violates 30-day SECP recommendation' if duration_days < 30 else 'Complies with standard term'}).",
            "evidence": f"Tenure: {duration_days} days" if duration_days is not None else "No explicit tenure or due-date found.",
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

    if total_risk_score >= 76:
        risk_level = "VERY_HIGH"
        risk_title = "Very High Risk / Predatory Indicators Detected"
        risk_summary = "Severe information gaps, large upfront deductions, aggressive recovery terms, or invasive permissions detected."
    elif total_risk_score >= 51:
        risk_level = "HIGH"
        risk_title = "High Risk / Caution Advised"
        risk_summary = "Multiple significant risk indicators identified, including essential information gaps, fee deductions, or contract discrepancies."
    elif total_risk_score >= 26:
        risk_level = "MODERATE"
        risk_title = "Moderate Risk / Caution Advised"
        risk_summary = "Loan contains terms that require careful verification before accepting."
    else:
        risk_level = "LOW"
        risk_title = "Low Risk / Standard Microfinance Terms"
        risk_summary = "Loan structure aligns with transparent consumer lending standards."

    # 8. Permissions Catalog matching PermissionRisk[]
    perms_catalog = [
        {
            "permission": "CONTACTS",
            "displayName": "Contacts & Phonebook",
            "requested": has_contact_violation or any("CONTACT" in p.upper() for p in requested_perms),
            "concernLevel": "HIGH",
            "whyItMatters": "SECP Circular 15/2023 prohibits digital lending platforms from accessing borrower contact lists.",
            "potentialAbuseContext": "Predatory recovery agents use contact lists to contact family, colleagues, and employers with defamatory messages.",
            "recommendation": "Deny this permission immediately. Regulated lenders in Pakistan do not require phonebook access."
        },
        {
            "permission": "CAMERA",
            "displayName": "Camera Access",
            "requested": any("CAMERA" in p.upper() for p in requested_perms),
            "concernLevel": "MODERATE",
            "whyItMatters": "Used for live selfie verification (Liveness Detection / e-KYC).",
            "potentialAbuseContext": "May be used inappropriately if continuous or background photo capture is authorized.",
            "recommendation": "Allow only during live identity verification session."
        },
        {
            "permission": "LOCATION",
            "displayName": "Precise GPS Location",
            "requested": any("LOCATION" in p.upper() for p in requested_perms),
            "concernLevel": "MODERATE",
            "whyItMatters": "Verifies geographical location within Pakistan's jurisdictional boundary.",
            "potentialAbuseContext": "Continuous tracking of residence and workplace movements.",
            "recommendation": "Grant 'While using the app only'."
        },
        {
            "permission": "STORAGE_GALLERY",
            "displayName": "Photos & Media Storage",
            "requested": any("STORAGE" in p.upper() or "GALLERY" in p.upper() for p in requested_perms),
            "concernLevel": "HIGH",
            "whyItMatters": "Allows scanning of stored images and documents on the mobile device.",
            "potentialAbuseContext": "High-risk black-box apps have harvested personal photos for extortion purposes.",
            "recommendation": "Strictly deny. Upload required CNIC or salary slips via selective file picker only."
        },
        {
            "permission": "SMS",
            "displayName": "SMS Messages",
            "requested": any("SMS" in p.upper() for p in requested_perms),
            "concernLevel": "HIGH",
            "whyItMatters": "Permits reading transactional and personal text messages.",
            "potentialAbuseContext": "Access to banking SMS OTPs or personal communication history.",
            "recommendation": "Deny SMS permissions; use auto-fill OTP APIs provided by the OS."
        },
        {
            "permission": "PHONE_STATE",
            "displayName": "Device & SIM Information",
            "requested": any("PHONE" in p.upper() for p in requested_perms),
            "concernLevel": "LOW",
            "whyItMatters": "Device fingerprinting to prevent multiple duplicate accounts.",
            "potentialAbuseContext": "Cross-app device telemetry tracking.",
            "recommendation": "Acceptable under standard NBFC guidelines."
        }
    ]

    # 9. Clauses Catalog matching ContractClause[]
    clause1_risk = "RED" if upfront_deductions and upfront_deductions > 0 else ("YELLOW" if deduction_status == "POTENTIAL_DEDUCTIONS_UNCLEAR" or principal is None else "GREEN")
    clause2_risk = "RED" if duration_days is not None and duration_days < 30 else ("YELLOW" if duration_days is None else "GREEN")

    clauses = [
        {
            "id": "clause-1",
            "clauseTitle": "Disbursement & Upfront Deductions",
            "originalText": deduction_status_text,
            "category": "INTEREST_AND_FEES",
            "simpleExplanation": {
                "en": f"Upfront deduction of PKR {upfront_deductions:,.0f} from the sanctioned principal." if upfront_deductions and upfront_deductions > 0 and principal is not None else "The exact upfront deductions are not disclosed before approval.",
                "ur": f"منظور شدہ رقم میں سے PKR {upfront_deductions:,.0f} پیشگی فیس کاٹ لی جائے گی۔" if upfront_deductions and upfront_deductions > 0 and principal is not None else "منظوری سے قبل پیشگی کٹوتیوں کی تفصیل نہیں دی گئی۔",
                "roman_ur": f"Manzoor shuda raqam mein se PKR {upfront_deductions:,.0f} peshgi fees kaat li jaye gi." if upfront_deductions and upfront_deductions > 0 and principal is not None else "Manzoori se pehle peshgi katoutiyon ki tafseel nahi di gayi."
            },
            "whyItMatters": {
                "en": "Reduces actual cash received while liability remains on the full principal.",
                "ur": "ہاتھ میں ملنے والی رقم کم ہو جاتی ہے لیکن واپسی پورے قرض پر کرنا ہوتی ہے۔",
                "roman_ur": "Haath mein milne wali raqam kam ho jati hai lekin wapsi pooray qarz par karni hoti hai."
            },
            "riskFlag": clause1_risk
        },
        {
            "id": "clause-2",
            "clauseTitle": "Repayment Horizon & Due Date",
            "originalText": f"Total repayment of PKR {total_repayment:,.0f} due strictly within {duration_days} days." if total_repayment is not None and duration_days is not None else "Repayment amount and due date are not specified before approval.",
            "category": "DEFAULT_AND_LEGAL",
            "simpleExplanation": {
                "en": f"Loan must be fully cleared in {duration_days} days." if duration_days is not None else "Loan tenure is not specified in the submitted document.",
                "ur": f"قرضے کی مکمل واپسی {duration_days} دن کے اندر کرنا ہوگی۔" if duration_days is not None else "قرضے کی مدت دستاویز میں درج نہیں۔",
                "roman_ur": f"Qarzay ki mukammal wapsi {duration_days} din ke andar karna hogi." if duration_days is not None else "Qarzay ki muddat dastaweez mein darj nahi."
            },
            "whyItMatters": {
                "en": "Short durations (7-14 days) lead to severe rollover debt-traps.",
                "ur": "کم مدت (7 تا 14 دن) ادھار واپس نہ کر سکنے کی صورت میں شدید سود کا باعث بنتی ہے۔",
                "roman_ur": "Kam muddat (7 se 14 din) qarz wapas na hone par mazeed jurmana lagati hai."
            },
            "riskFlag": clause2_risk
        },
        {
            "id": "clause-3",
            "clauseTitle": "Late Payment Penalties & Compounding",
            "originalText": "Late payments are subject to daily penalties and administrative collection charges.",
            "category": "PENALTIES",
            "simpleExplanation": {
                "en": "Daily penalties will accrue automatically upon missing the scheduled due date.",
                "ur": "مقررہ تاریخ پر رقم واپس نہ کرنے کی صورت میں روزانہ جرمانہ عائد ہوگا۔",
                "roman_ur": "Muqarrara tareekh par raqam wapas na karne par rozana jurmana aaid hoga."
            },
            "whyItMatters": {
                "en": "Late penalty compounding can double total outstanding debt within 2 weeks.",
                "ur": "روزانہ جرمانہ لگنے سے قرضہ چند ہفتوں میں دگنا ہو سکتا ہے۔",
                "roman_ur": "Rozana jurmana lagne se qarz chand hafton mein dugna ho sakta hai."
            },
            "riskFlag": "YELLOW"
        }
    ]

    # 10. Verification Checklist
    verification_checklist = [
        {
            "id": "ver-1",
            "title": "Check SECP NBFC Digital Lending List",
            "description": "Ensure the company is registered under the SECP list of authorized digital lending Non-Banking Finance Companies.",
            "isCritical": True,
            "verificationTip": "Search company title on secp.gov.pk under registered digital lending apps."
        },
        {
            "id": "ver-2",
            "title": "Confirm Net Cash vs Repayment Amount",
            "description": f"Verify that receiving {'PKR ' + f'{actual_disbursed:,.0f}' if actual_disbursed is not None else 'the cash in hand'} is worth repaying {'PKR ' + f'{total_repayment:,.0f}' if total_repayment is not None else 'the unspecified repayment amount'}.",
            "isCritical": True,
            "verificationTip": f"Total cost of this loan is PKR {(total_repayment - (actual_disbursed or principal)):,.0f}." if total_repayment is not None and (actual_disbursed is not None or principal is not None) else "Total cost cannot be calculated because repayment or disbursement is not specified."
        },
        {
            "id": "ver-3",
            "title": "Deny Non-Essential Device Permissions",
            "description": "Refuse Contacts and Gallery permissions when prompted on your Android or iOS device.",
            "isCritical": has_contact_violation,
            "verificationTip": "Regulated Pakistani fintechs do not require phonebook access for credit approval."
        }
    ]

    # 11. Executive Summary
    actual_disbursed_text = f"You will receive PKR {actual_disbursed:,.0f} net after deductions." if actual_disbursed is not None else "The actual amount received cannot be confirmed from the submitted document before approval."
    total_repay_text = f"You will be required to repay a total of PKR {total_repayment:,.0f} over {duration_days} days." if total_repayment is not None and duration_days is not None else "The total repayment amount and tenure cannot be confirmed from the submitted document."

    executive_summary = {
        "actualAmountReceivedText": actual_disbursed_text,
        "totalRepaymentText": total_repay_text,
        "chargesIdentifiedSummary": deduction_status_text,
        "latePaymentImpactSummary": "Late payments incur daily penalty fees according to the agreement terms.",
        "criticalClausesSummary": "Please review the default, tenure, and collection clauses carefully before agreeing.",
        "promiseDiscrepancySummary": f"Identified {len(secp_violations)} regulatory alerts and upfront deduction evaluations.",
        "privacyConcernsSummary": "Sensitive device permissions detected (Contacts access illegal under SECP)." if has_contact_violation else "Low privacy exposure: Only standard identity verification permissions requested.",
        "verificationAdvice": [
            "Verify that the loan provider is officially licensed with the SECP.",
            "Confirm the exact net amount deposited into your wallet before accepting.",
            "Never grant contact book or photo gallery access on your device."
        ]
    }

    # 12. Compile Full Analysis Result
    analysis_id = "analysis-py-" + str(uuid.uuid4())[:8]

    return {
        "id": analysis_id,
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "lenderName": lender_name,
        "appName": app_name,
        "analysisMethod": params.get("method", "AGREEMENT_UPLOAD"),
        "isDemo": False,
        "devicePermissionsSpecified": len(requested_perms) > 0,
        "riskAssessment": {
            "overallScore": total_risk_score,
            "riskLevel": risk_level,
            "riskTitle": risk_title,
            "summaryReason": risk_summary,
            "reasons": [f["finding"] for f in factor_breakdown if f["riskImpact"] in ("HIGH", "CRITICAL")],
            "positiveFactors": [f["finding"] for f in factor_breakdown if f["riskImpact"] == "LOW"],
            "factors": factor_breakdown,
            "confidenceScore": 92,
            "disclaimer": "This analysis is an automated advisory assessment based on Pakistani digital lending regulations (SECP)."
        },
        "financialBreakdown": {
            "advertisedAmount": advertised_amount,
            "principalAmount": principal,
            "totalDeductions": upfront_deductions if deduction_status == "CONFIRMED_DEDUCTIONS" else None,
            "deductionStatus": "DEDUCTIONS_CONFIRMED" if deduction_status == "CONFIRMED_DEDUCTIONS" else ("POTENTIAL_DEDUCTIONS_UNCLEAR" if deduction_status == "POTENTIAL_DEDUCTIONS_UNCLEAR" else "NO_DEDUCTIONS_MENTIONED"),
            "deductionStatusText": deduction_status_text,
            "actualDisbursedAmount": actual_disbursed,
            "isDisbursementConfirmed": is_disbursement_confirmed,
            "totalRepaymentAmount": total_repayment,
            "isRepaymentConfirmed": is_repayment_confirmed,
            "totalCostOfBorrowing": (total_repayment - actual_disbursed) if total_repayment is not None and actual_disbursed is not None else None,
            "effectiveAnnualPercentageRate": apr,
            "effectiveMonthlyRate": round(apr / 12, 2) if apr is not None else None,
            "durationDays": duration_days,
            "numberOfInstallments": 1,
            "installmentAmount": total_repayment,
            "chargesList": charges_list,
            "essentialTerms": [
                {
                    "id": "term-principal",
                    "termName": "Sanctioned Principal Amount",
                    "status": "CLEARLY_SPECIFIED" if principal is not None else "NOT_SPECIFIED",
                    "documentedValue": f"PKR {principal:,.0f}" if principal is not None else "Not specified",
                    "explanation": f"Documented principal is PKR {principal:,.0f}." if principal is not None else "The approved/sanctioned loan amount is not stated in the document.",
                    "evidence": f"Principal: PKR {principal:,.0f}" if principal is not None else "No explicit principal amount found."
                },
                {
                    "id": "term-disbursement",
                    "termName": "Disbursement Amount",
                    "status": "CLEARLY_SPECIFIED" if is_disbursement_confirmed and actual_disbursed is not None else ("PARTIALLY_SPECIFIED" if deduction_status == "POTENTIAL_DEDUCTIONS_UNCLEAR" else "NOT_SPECIFIED"),
                    "documentedValue": f"PKR {actual_disbursed:,.0f}" if actual_disbursed is not None else "To be determined after approval",
                    "explanation": f"Documented net disbursement is PKR {actual_disbursed:,.0f}." if actual_disbursed is not None else "The actual amount the borrower will receive is not clearly specified before acceptance.",
                    "evidence": f"Disbursed Net: PKR {actual_disbursed:,.0f}" if actual_disbursed is not None else "Amount disbursed to borrower: To be determined after approval."
                },
                {
                    "id": "term-repayment",
                    "termName": "Total repayment amount",
                    "status": "CLEARLY_SPECIFIED" if is_repayment_confirmed and total_repayment is not None else "NOT_SPECIFIED",
                    "documentedValue": f"PKR {total_repayment:,.0f}" if total_repayment is not None else "Not confirmed",
                    "explanation": f"Total contractual repayment amount is documented as PKR {total_repayment:,.0f}." if total_repayment is not None else "Total repayment amount is not specified in the document.",
                    "evidence": f"Total Repayment: PKR {total_repayment:,.0f}" if total_repayment is not None else "No explicit total repayment figure found."
                },
                {
                    "id": "term-tenure",
                    "termName": "Loan Tenure & Due Date",
                    "status": "CLEARLY_SPECIFIED" if duration_days is not None else "NOT_SPECIFIED",
                    "documentedValue": f"{duration_days} Calendar Days" if duration_days is not None else "Not specified",
                    "explanation": f"Loan tenure is set to {duration_days} days." if duration_days is not None else "Repayment schedule and installment dates are not specified in the document.",
                    "evidence": f"Tenure: {duration_days} Days." if duration_days is not None else "No explicit tenure found."
                },
                {
                    "id": "term-charges",
                    "termName": "Fee Deductions Breakdown",
                    "status": "CLEARLY_SPECIFIED" if deduction_status == "CONFIRMED_DEDUCTIONS" else ("PARTIALLY_SPECIFIED" if deduction_status == "POTENTIAL_DEDUCTIONS_UNCLEAR" else "NOT_SPECIFIED"),
                    "documentedValue": deduction_status_text,
                    "explanation": "Upfront deductions reduce the net cash received by the borrower.",
                    "evidence": deduction_status_text
                }
            ],
            "assumptions": [
                f"Calculations based on {duration_days}-day tenure." if duration_days is not None else "Tenure is not specified in the document.",
                "Markup compounded standardly over repayment horizon." if apr is not None else "APR cannot be calculated due to missing repayment or disbursement figures."
            ]
        },
        "advertisedPromise": {
            "advertisedAmount": advertised_amount,
            "advertisedMarkupRate": advertised_rate,
            "advertisedDuration": advertised_duration,
            "advertisedDisbursedAmount": advertised_amount,
            "marketingClaims": [
                "Instant Loan Approval",
                "Low Markup Rate",
                "Quick Disbursal"
            ],
            "advertisedRepaymentAmount": expected_repayment
        },
        "contractReality": {
            "documentedPrincipal": principal,
            "documentedDisbursement": actual_disbursed,
            "isDisbursementConfirmed": is_disbursement_confirmed,
            "documentedDurationDays": duration_days,
            "documentedMarkupRateAnnual": round(apr, 2) if apr is not None else None,
            "totalUpfrontDeductions": upfront_deductions if deduction_status == "CONFIRMED_DEDUCTIONS" else None,
            "deductionStatus": "DEDUCTIONS_CONFIRMED" if deduction_status == "CONFIRMED_DEDUCTIONS" else ("POTENTIAL_DEDUCTIONS_UNCLEAR" if deduction_status == "POTENTIAL_DEDUCTIONS_UNCLEAR" else "NO_DEDUCTIONS_MENTIONED"),
            "totalRecurringFees": 0,
            "documentedRepaymentAmount": total_repayment,
            "isRepaymentConfirmed": is_repayment_confirmed,
            "latePenaltyRatePerDay": None,
            "isSecpRegisteredClaimed": not has_contact_violation
        },
        "discrepancies": [
            {
                "id": "disc-1",
                "category": "FEES_AND_CHARGES",
                "riskType": "INFORMATION_GAP" if deduction_status == "POTENTIAL_DEDUCTIONS_UNCLEAR" or principal is None else "KNOWN_RISK",
                "promised": f"Disbursed: PKR {principal:,.0f}" if principal is not None else "Disbursed amount not specified",
                "actual": f"Received: PKR {actual_disbursed:,.0f}" if actual_disbursed is not None else "Amount unconfirmed before approval",
                "severity": "CRITICAL" if upfront_deductions and upfront_deductions > 0 else "WARNING",
                "explanation": "Upfront deduction reduces actual in-hand cash." if upfront_deductions and upfront_deductions > 0 else "Exact disbursement amount and deductions are not disclosed before approval.",
                "isNumericalVariance": upfront_deductions is not None and upfront_deductions > 0 and principal is not None and actual_disbursed is not None,
                "varianceAmount": upfront_deductions if upfront_deductions and upfront_deductions > 0 else None,
                "variancePercentage": round((upfront_deductions / principal) * 100, 1) if upfront_deductions and upfront_deductions > 0 and principal is not None else None,
                "evidence": deduction_status_text,
                "interpretation": "Borrower pays interest on full principal despite receiving lower net amount." if upfront_deductions and upfront_deductions > 0 else "Borrower cannot verify the true cost of the loan before accepting."
            }
        ] if upfront_deductions > 0 or not is_disbursement_confirmed or principal is None else [],
        "permissions": perms_catalog,
        "permissionAudits": permission_audits,
        "clauses": clauses,
        "secpViolations": secp_violations,
        "executiveSummary": executive_summary,
        "verificationChecklist": verification_checklist
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
                model="gemini-1.5-flash-latest",
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
