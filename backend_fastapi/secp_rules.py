"""
SECP & State Bank of Pakistan Digital Lending Regulatory Rules & Guidelines
Governed by:
- SECP Circular No. 10 of 2023 (Digital Lending Regulations for NBFCs)
- SECP Circular No. 15 of 2023 (Prohibition of intrusive device permissions)
- SECP Circular No. 22 of 2023 (Key Fact Statement & APR Transparency Mandate)
- SBP BPRD Circulars on Consumer Financial Protection
"""

SECP_REGULATORY_BENCHMARKS = {
    "MAX_ANNUAL_APR_RECOMMENDED": 65.0,  # Warning if APR exceeds 65% annualized
    "MAX_UPFRONT_DEDUCTION_PCT": 5.0,    # Warning if upfront processing fees exceed 5% of sanctioned principal
    "MIN_TENURE_DAYS": 30,               # 7-day or 14-day nano-loans violate SECP tenure requirements
    "PROHIBITED_PERMISSIONS": [
        "READ_CONTACTS",
        "ACCESS_MEDIA_LOCATION",
        "READ_EXTERNAL_STORAGE",
        "CAMERA",
        "READ_PHONE_STATE",
        "ACCESS_FINE_LOCATION"
    ]
}

SECP_VIOLATION_DEFINITIONS = {
    "UNAUTHORIZED_CONTACTS_ACCESS": {
        "code": "SECP-CIRC-15-CONTACTS",
        "title": "Illegal Contact List & Phonebook Harvest",
        "circularReference": "SECP Circular No. 15 of 2023 / SBP Consumer Protection Regulations",
        "severity": "CRITICAL",
        "description": "Lending apps are strictly prohibited from accessing borrower contact lists, call logs, or messaging history to prevent social harassment and recovery intimidation.",
        "actionRequired": "Immediately revoke phonebook permissions and file a complaint via SECP ServiceDesk."
    },
    "EXCESSIVE_UPFRONT_DEDUCTIONS": {
        "code": "SECP-CIRC-10-FEES",
        "title": "Hidden Upfront Processing Deductions",
        "circularReference": "SECP Circular No. 10 / Circular No. 22 of 2023 (Transparency of Charges)",
        "severity": "CRITICAL",
        "description": "Deducting excessive processing or service charges upfront before cash disbursement creates deceptive net interest rates exceeding disclosed pricing.",
        "actionRequired": "Verify that all charges are explicitly reflected in a standardized Key Fact Statement (KFS)."
    },
    "SHORT_TENURE_PREDATORY_TERM": {
        "code": "SECP-CIRC-10-TENURE",
        "title": "Sub-30-Day Predatory Tenure",
        "circularReference": "SECP Digital Lending Regulatory Framework (Tenure Requirements)",
        "severity": "HIGH",
        "description": "Digital nano-loans with ultra-short repayment windows (e.g. 7 or 14 days) subject borrowers to debt-trap roll-over cycles.",
        "actionRequired": "Opt for regulated microfinance providers offering standard installment horizons (>= 30 days)."
    },
    "MISSING_KEY_FACT_STATEMENT": {
        "code": "SECP-CIRC-22-KFS",
        "title": "Missing or Incomplete Key Fact Statement (KFS)",
        "circularReference": "SECP Circular No. 22 of 2023 (Mandatory Pre-Contract KFS)",
        "severity": "HIGH",
        "description": "Borrowers must be provided with a standalone 1-page Key Fact Statement outlining all charges, APR, and repayment schedules prior to loan disbursement.",
        "actionRequired": "Demand the formal KFS document before consenting to terms."
    }
}
