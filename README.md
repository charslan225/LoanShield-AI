# LOANSHIELD AI
**"Know the Truth Before You Borrow."**

LoanShield AI is an AI-powered consumer protection and financial transparency platform designed for the digital micro-lending ecosystem in Pakistan.

The platform eliminates **information asymmetry** between loan providers and borrowers by analyzing loan contracts, sanction letters, and advertisements *before* users accept or disburse a loan offer.

---

## 🎯 The Core Problem: Information Asymmetry in Pakistan

In Pakistan, digital lending apps often market offers such as:
- *"Instant Rs. 50,000 Cash Loan"*
- *"Low Markup / 0% Interest"*
- *"Flexible 90-Day Tenure"*

However, borrowers frequently encounter hidden traps:
1. **Hidden Upfront Cuts**: A borrower expecting Rs. 50,000 receives only Rs. 38,000–Rs. 39,000 due to undisclosed processing, platform, and assessment fees deducted upfront.
2. **7-Day Rollover Traps**: Promised 90-day durations collapse into 7-day deadlines with daily extension and penalty fees.
3. **Invasive Privacy & Social Recovery**: Apps request contact book and photo gallery access to threaten calling family, friends, and employers if repayment is delayed.

LoanShield AI audits these risks instantly using **Google Gemini 3.7 Flash** coupled with a **100% deterministic financial calculations engine**.

---

## 🚀 Core Features & Architectural Pillars

### 1. Promise vs Reality Comparator
- Directly juxtaposes what was advertised (advertised amount, claimed interest, promised tenure) against binding contract clauses.
- Flags critical discrepancies with actionable explanations.

### 2. Deterministic Financial Engine
- Zero mathematical hallucinations.
- Calculates:
  - Total upfront deductions & percentage cut
  - Net cash disbursed into bank/wallet
  - Total repayment amount
  - True total cost of borrowing
  - Estimated Annualized Percentage Rate (APR)

### 3. Explainable 7-Factor Risk Scoring (0–100)
Transparent, mathematical 100-point model with transparent weights:
- **Financial Transparency (20 pts)**
- **Upfront Deductions (15 pts)**
- **Late Payment Penalties (15 pts)**
- **Contract Clarity & Ambiguity (15 pts)**
- **Promise vs Reality Discrepancy (15 pts)**
- **Data & Permission Privacy (10 pts)**
- **Recovery Practice Risk (10 pts)**

### 4. Multilingual Plain-Language Clause Explainer
Translates complex legal boilerplate into three accessible formats:
- **English**
- **Urdu (اردو)** (in clean Nastaliq script)
- **Roman Urdu** (phonetic Urdu readable in English letters, e.g. *"Agar aap 2 din late huay toh rozana fine lagega."*)

### 5. App Permissions & Social Recovery Risk Audit
- Audits requested mobile permissions (Contacts, Storage/Gallery, SMS, Location, Camera) against **SECP Circular No. 15** regulations.
- Alerts borrowers when non-essential permissions pose harassment risks.

### 6. Pre-Borrowing SECP Verification Checklist
- Actionable guide for verifying licensed Non-Banking Finance Companies (NBFCs) on `secp.gov.pk`.

### 7. Interactive AI Loan Advisor
- Grounded contextual chat assistant answering borrower questions regarding specific clauses.

### 8. Fictional Demo Mode
- Includes 3 synthetic scenarios for instant evaluation:
  1. *Transparent Standard Loan* (Low Risk - Score: 88/100)
  2. *Hidden Upfront Deductions* (High Risk - Score: 39/100)
  3. *Predatory Micro-Loan App* (Very High Risk - Score: 18/100)

---

## 🛠️ Tech Stack & Environment

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts
- **Backend**: Node.js, Express, tsx, esbuild
- **AI Intelligence**: Google Gemini 3.7 Flash (`@google/genai`)
- **Typography**: Plus Jakarta Sans, Noto Nastaliq Urdu, JetBrains Mono

---

## 🔐 Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Google Gemini API Key (Server-side only)
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 📜 Official Consumer Protection Disclaimer

> LoanShield AI provides AI-assisted information and risk analysis based on the information and documents submitted by the user. It does not provide legal, financial, or regulatory advice and does not determine whether a lender has violated the law.
