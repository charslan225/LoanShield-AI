import base64
import json
from typing import Any, Dict, Optional

from google import genai
from google.genai import types

from config import get_settings


def _get_gemini_client() -> Optional[genai.Client]:
    api_key = get_settings().gemini_api_key.strip()
    if not api_key:
        return None
    try:
        return genai.Client(api_key=api_key)
    except Exception as err:
        print('Failed to initialize GoogleGenAI client:', err)
        return None


FALLBACK_MODELS = [
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest',
]


def _generate_with_fallback(client: genai.Client, contents: Any, config: Optional[Dict[str, Any]] = None) -> Optional[str]:
    """Try the configured model first, then fallbacks on 429/503 demand errors."""
    models = [get_settings().gemini_model] + [m for m in FALLBACK_MODELS if m != get_settings().gemini_model]
    last_err: Optional[Exception] = None
    for model in models:
        try:
            response = client.models.generate_content(model=model, contents=contents, config=config)
            text = (response.text or '').strip()
            if text:
                return text
        except Exception as err:
            last_err = err
            print(f'Gemini call failed on {model}:', err)
    if last_err is not None:
        print('All Gemini model attempts failed.')
    return None


EXTRACTION_SCHEMA_INSTRUCTION = """You are LoanShield AI, an expert loan document analyst in Pakistan.
Read the document carefully and extract only values that are EXPLICITLY stated.
CRITICAL: Do not infer, estimate, or hallucinate numbers. If a figure is not clearly stated (e.g., says "to be determined after approval" or "schedule provided after disbursement"), return null for that field.
Fields to extract in JSON:
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

Return strictly a JSON object with these keys."""


async def extract_loan_data(
    raw_text: str,
    file_base64: Optional[str] = None,
    file_mime_type: Optional[str] = None,
    advertised_amount: Optional[float] = None,
    advertised_duration: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    client = _get_gemini_client()
    if not client:
        return None

    prompt = f"""{EXTRACTION_SCHEMA_INSTRUCTION}

Input Context:
Advertised Amount: {advertised_amount}
Advertised Duration: {advertised_duration}
Text:
{raw_text}
"""

    contents: list[Any] = []
    if file_base64 and file_mime_type:
        try:
            data = base64.b64decode(file_base64)
            contents.append(
                types.Part(
                    inline_data=types.Blob(mime_type=file_mime_type, data=data)
                )
            )
        except Exception:
            pass
    contents.append(prompt)

    try:
        text = _generate_with_fallback(
            client, contents, {'response_mime_type': 'application/json'}
        )
        if text:
            return json.loads(text)
    except Exception as err:
        print('Gemini extraction failed:', err)
    return None


async def answer_advisor_question(analysis: Any, question: str) -> str:
    client = _get_gemini_client()
    if client:
        try:
            prompt = f"""You are LoanShield AI's Senior Consumer Lending & Legal Advisor in Pakistan.
Context of analyzed loan:
- Lender: {getattr(analysis, 'lenderName', None) or 'Unknown'}
- Principal: PKR {getattr(getattr(analysis, 'financialBreakdown', None), 'principalAmount', 0):,.0f}
- Effective APR: {getattr(getattr(analysis, 'financialBreakdown', None), 'effectiveAnnualPercentageRate', None) or 'Unspecified'}%
- Risk Score: {getattr(getattr(analysis, 'riskAssessment', None), 'overallScore', 0)}/100 ({getattr(getattr(analysis, 'riskAssessment', None), 'riskLevel', 'UNKNOWN')})
- SECP Regulatory Violations: {getattr(analysis, 'secpViolations', [])}

User Question: {question}

Provide an objective, protective, and actionable answer citing Pakistani lending protections (SECP / SBP) in clear language. Keep response under 3 paragraphs."""
            text = _generate_with_fallback(client, prompt)
            if text:
                return text
        except Exception as err:
            print('Gemini advisor failed:', err)

    q_lower = question.lower()
    risk_score = getattr(getattr(analysis, 'riskAssessment', None), 'overallScore', 0) or 0
    apr = getattr(getattr(analysis, 'financialBreakdown', None), 'effectiveAnnualPercentageRate', None)
    if 'safe' in q_lower or 'scam' in q_lower or 'risk' in q_lower:
        return f"Based on our automated risk analysis, this loan received an overall risk score of {risk_score}/100. Always check if the lender holds an active digital lending NBFC license from SECP (secp.gov.pk) and never grant phonebook contacts permissions."
    if 'apr' in q_lower or 'interest' in q_lower or 'markup' in q_lower:
        return f"The calculated effective Annual Percentage Rate (APR) for this agreement is {f'{apr}%' if apr is not None else 'unspecified due to missing disbursement terms'}. Regulated standard microfinance rates in Pakistan generally range between 20%-45% annualized."
    return "Regarding your inquiry: ensure you carefully verify any upfront deductions and demand a standardized SECP Key Fact Statement (KFS) prior to consenting to any digital disbursement."
