/**
 * LoanShield AI - Fictional Demonstration Scenarios
 * For Hackathon & Demo evaluation.
 * Note: All company names, numbers, and data are strictly fictional test cases.
 */

import { DemoScenario } from '../types';

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'transparent-nbfe',
    title: 'Scenario 1: Transparent Regulated Offer',
    tagline: 'SECP-Compliant NBFC with clear fee schedule and minimal permissions',
    description: 'A transparent digital micro-enterprise facility from a licensed institution with transparent upfront disclosures and standard consumer protection clauses.',
    riskBadge: 'LOW',
    lenderName: 'Karobar Asaan Microfinance (Fictional)',
    advertisedText: 'Advertised: PKR 50,000 Business Loan at 2% monthly markup for 90 days. Fixed processing fee of PKR 1,000 + FED.',
    contractSnippet: `LOAN FACILITY AGREEMENT
Lender: Karobar Asaan Microfinance Limited (SECP Licensed NBFC #2024-KBA-09)
Principal Loan Amount: PKR 50,000
Disbursement Deductions: Processing Fee PKR 1,000, FED (16%) PKR 160
Net Disbursed to Borrower: PKR 48,840
Total Markup over 90 Days: PKR 3,000 (2.0% per month on reducing balance)
Repayment Schedule: 3 equal monthly installments of PKR 17,667
Late Payment Penalty: Flat PKR 150 administrative charge per delayed installment (grace period of 5 working days).
Data Privacy: Biometric and CNIC data stored in compliance with SECP Circular No. 15. No phonebook scraping.`,
    samplePermissions: ['CAMERA', 'PHONE_STATE'],
    resultData: {
      id: 'demo-result-1',
      createdAt: new Date().toISOString(),
      lenderName: 'Karobar Asaan Microfinance (Fictional)',
      appName: 'Karobar Asaan App',
      analysisMethod: 'AGREEMENT_UPLOAD',
      fileName: 'Karobar_Asaan_Offer_Agreement.pdf',
      fileType: 'application/pdf',
      isDemo: true,
      demoScenarioId: 'transparent-nbfe',
      devicePermissionsSpecified: true,
      riskAssessment: {
        overallScore: 16,
        riskLevel: 'LOW',
        riskTitle: 'LOW INFORMATION RISK',
        summaryReason: 'The loan agreement clearly discloses all upfront deductions, markup calculations, and repayment schedules in compliance with transparent lending standards.',
        reasons: [
          'Principal amount, markup (2% monthly), and repayment schedule are explicitly itemized.',
          'Upfront deduction is minor (2.3% total, including statutory FED tax).',
          'Late payment fees are flat and capped with an established grace period.',
          'Only standard KYC device permissions are requested (Camera for CNIC liveness).'
        ],
        positiveFactors: [
          'Net disbursement (PKR 48,840) matches advertised calculations.',
          'Clear repayment schedule in 3 equal monthly installments.',
          'The document explicitly states that no access to the borrower’s personal contacts is required.',
          'SECP registration license reference provided in agreement.'
        ],
        factors: [
          {
            name: 'Financial Transparency',
            category: 'Transparency',
            score: 2,
            maxWeight: 20,
            riskImpact: 'LOW',
            finding: 'Complete disclosure of nominal markup, net disbursement, and repayment dates.'
          },
          {
            name: 'Upfront Deductions',
            category: 'Financial',
            score: 3,
            maxWeight: 15,
            riskImpact: 'LOW',
            finding: 'PKR 1,160 (2.32%) deducted upfront for processing and government sales tax.'
          },
          {
            name: 'Late Payment Penalties',
            category: 'Terms',
            score: 2,
            maxWeight: 15,
            riskImpact: 'LOW',
            finding: 'Flat PKR 150 fee with 5-day grace period; no daily compounding.'
          },
          {
            name: 'Contract Clarity & Clauses',
            category: 'Legal',
            score: 4,
            maxWeight: 15,
            riskImpact: 'LOW',
            finding: 'Standard institutional default provisions without unilateral amendment clauses.'
          },
          {
            name: 'Promise vs Document Discrepancy',
            category: 'Consumer Trust',
            score: 3,
            maxWeight: 15,
            riskImpact: 'LOW',
            finding: 'Net disbursed amount is within expected margin of advertised offer.'
          },
          {
            name: 'Data & Privacy Exposure',
            category: 'Privacy',
            score: 0,
            maxWeight: 10,
            riskImpact: 'LOW',
            finding: 'Low device privacy impact: Document explicitly states no access to personal contacts is required.'
          },
          {
            name: 'Recovery Clause Terms',
            category: 'Consumer Protection',
            score: 2,
            maxWeight: 10,
            riskImpact: 'LOW',
            finding: 'Recovery adheres to standard written notice procedures.'
          }
        ],
        confidenceScore: 96,
        disclaimer: 'LoanShield AI provides AI-assisted information and risk analysis based on the information and documents submitted by the user. It does not provide legal, financial, or regulatory advice and does not determine whether a lender has violated the law.'
      },
      financialBreakdown: {
        advertisedAmount: 50000,
        principalAmount: 50000,
        totalDeductions: 1160,
        actualDisbursedAmount: 48840,
        totalRepaymentAmount: 53000,
        totalCostOfBorrowing: 4160,
        effectiveAnnualPercentageRate: 34.6,
        effectiveMonthlyRate: 2.8,
        durationDays: 90,
        numberOfInstallments: 3,
        installmentAmount: 17667,
        chargesList: [
          {
            id: 'c-1',
            name: 'Processing Fee',
            type: 'UPFRONT_DEDUCTION',
            amount: 1000,
            percentage: 2,
            isDeductedFromDisbursement: true,
            frequency: 'ONCE',
            description: 'One-time loan processing and verification fee.',
            isClearlyDisclosed: true
          },
          {
            id: 'c-2',
            name: 'Federal Excise Duty (FED 16%)',
            type: 'TAX_GOVERNMENT',
            amount: 160,
            percentage: 0.32,
            isDeductedFromDisbursement: true,
            frequency: 'ONCE',
            description: 'Statutory 16% provincial/federal tax on processing fee.',
            isClearlyDisclosed: true
          },
          {
            id: 'c-3',
            name: 'Late Installment Penalty',
            type: 'PENALTY',
            amount: 150,
            isDeductedFromDisbursement: false,
            frequency: 'ON_DEFAULT',
            description: 'Flat charge applied after 5 days grace period.',
            isClearlyDisclosed: true
          }
        ],
        assumptions: [
          'Calculated on a 90-day equal monthly amortization schedule.',
          'Assumes on-time monthly installment payments of PKR 17,667.'
        ]
      },
      advertisedPromise: {
        advertisedAmount: 50000,
        advertisedMarkupRate: '2% per month',
        advertisedDuration: '90 Days',
        advertisedDisbursedAmount: 49000,
        marketingClaims: [
          'Transparent 2% monthly rate',
          '90-day flexible repayment',
          'SECP regulated institution'
        ],
        advertisedRepaymentAmount: 53000
      },
      contractReality: {
        documentedPrincipal: 50000,
        documentedDisbursement: 48840,
        documentedDurationDays: 90,
        documentedMarkupRateAnnual: 24,
        totalUpfrontDeductions: 1160,
        totalRecurringFees: 0,
        documentedRepaymentAmount: 53000,
        latePenaltyRatePerDay: null,
        isSecpRegisteredClaimed: true
      },
      discrepancies: [
        {
          id: 'disc-1',
          category: 'FEES_AND_CHARGES',
          promised: 'PKR 1,000 Processing Fee',
          actual: 'PKR 1,160 (Includes PKR 160 FED tax)',
          severity: 'INFO',
          explanation: 'Minor variance due to statutory FED tax on the processing fee, standard in Pakistani banking.'
        }
      ],
      clauses: [
        {
          id: 'cl-1',
          clauseTitle: 'Default and Grace Period Provision',
          originalText: 'In the event of non-payment on the scheduled monthly due date, the Borrower shall be granted a grace period of 5 calendar days. Thereafter, a one-off administrative default fee of PKR 150 shall accrue.',
          category: 'PENALTIES',
          simpleExplanation: {
            en: 'You get 5 extra days to pay without penalty. After 5 days, a single flat fee of Rs. 150 is charged.',
            ur: 'آپ کو مقررہ تاریخ کے بعد 5 دن کی مہلت دی جاتی ہے۔ 5 دن گزرنے کے بعد صرف 150 روپے کا یکمشت چارج لگے گا۔',
            roman_ur: 'Aap ko muqarrara tareekh ke baad 5 din ki mohlat milti hai. Iske baad sirf Rs. 150 ka flat fine lagega.'
          },
          whyItMatters: {
            en: 'This is a fair clause because it avoids compounding daily interest charges.',
            ur: 'یہ ایک شفاف شق ہے کیونکہ یہ روزانہ سود کے بجائے ایک مقررہ مناسب فیس رکھتی ہے۔',
            roman_ur: 'Yeh clause user-friendly hai kyunki daily double penalty nahi lagti.'
          },
          riskFlag: 'GREEN'
        },
        {
          id: 'cl-2',
          clauseTitle: 'Data Privacy & Dispute Resolution',
          originalText: 'Borrower data shall only be used for credit reporting to the Electronic Credit Information Bureau (e-CIB) and shall not be disseminated to third parties without prior court order.',
          category: 'DATA_PRIVACY',
          simpleExplanation: {
            en: 'Your financial track record is reported to official State Bank credit bureaus (e-CIB) but will not be shared with unauthorized third parties.',
            ur: 'آپ کا قرض کا ریکارڈ صرف سرکاری اسٹیٹ بینک کریڈٹ بیورو (e-CIB) کو بھیجا جائے گا اور کسی غیر متعلقہ فریق کو نہیں دیا جائے گا۔',
            roman_ur: 'Aap ka data sirf official State Bank e-CIB system me report hoga, kisi private third party ko nahi milega.'
          },
          whyItMatters: {
            en: 'On-time repayment will improve your formal credit rating in Pakistan.',
            ur: 'وقت پر ادائیگی آپ کے سرکاری کریڈٹ سکور کو بہتر بنائے گی۔',
            roman_ur: 'Waqt par repayment aap ke banking credit score ko behtar banayegi.'
          },
          riskFlag: 'GREEN'
        }
      ],
      permissions: [
        {
          permission: 'CAMERA',
          displayName: 'Camera Access',
          requested: true,
          concernLevel: 'LOW',
          whyItMatters: 'Used during onboarding for live CNIC selfie liveness check.',
          potentialAbuseContext: 'Standard verification when captured once during KYC.',
          recommendation: 'Standard practice for registered digital onboarding.'
        },
        {
          permission: 'PHONE_STATE',
          displayName: 'Phone State (Device ID)',
          requested: true,
          concernLevel: 'LOW',
          whyItMatters: 'Detects SIM tampering and binds your session to your handset.',
          potentialAbuseContext: 'Standard fraud telemetry in banking apps.',
          recommendation: 'Safe to grant for verified applications.'
        }
      ],
      executiveSummary: {
        actualAmountReceivedText: 'You will receive PKR 48,840 directly into your bank or mobile wallet account after a transparent deduction of PKR 1,160 (Processing fee + tax).',
        totalRepaymentText: 'You will need to repay a total of PKR 53,000 divided into 3 monthly installments of PKR 17,667 each.',
        chargesIdentifiedSummary: 'Only one upfront processing fee of PKR 1,000 plus 16% FED (PKR 160) was identified. No hidden recurring platform charges detected.',
        latePaymentImpactSummary: 'If you pay late, a 5-day grace period applies, followed by a reasonable flat fee of PKR 150 per delayed installment.',
        criticalClausesSummary: 'All reviewed clauses align with regulated microfinance standards; formal e-CIB reporting is present.',
        promiseDiscrepancySummary: 'The actual agreement closely reflects the advertised terms with zero material discrepancies.',
        privacyConcernsSummary: 'The app requests only minimal required KYC permissions (Camera and Phone State). No contacts or media gallery access requested.',
        verificationAdvice: [
          'Verify that the monthly installment amount of PKR 17,667 fits comfortably within your monthly budget.',
          'Confirm that the funds are transferred from the registered corporate account of the NBFC.',
          'Save the repayment receipts after each monthly installment.'
        ]
      },
      verificationChecklist: [
        {
          id: 'chk-1',
          title: 'Confirm SECP License Status',
          description: 'Check the NBFC name on the official SECP website (secp.gov.pk) under licensed digital lending companies.',
          isCritical: true,
          verificationTip: 'Official SECP list verifies active regulatory oversight.'
        },
        {
          id: 'chk-2',
          title: 'Check Net Inflow',
          description: 'Confirm that your bank receives exactly PKR 48,840 without unexpected intermediary deductions.',
          isCritical: false,
          verificationTip: 'Compare account credit SMS with the loan summary.'
        }
      ]
    }
  },
  {
    id: 'heavy-deductions-app',
    title: 'Scenario 2: Heavy Hidden Upfront Fees & High Daily Penalty',
    tagline: 'High upfront deduction (22% less cash) & aggressive late payment terms',
    description: 'A digital loan offering Rs. 50,000 but deducting PKR 11,000 upfront, paired with heavy daily penalties and contact scraping.',
    riskBadge: 'HIGH',
    lenderName: 'QuickCash Instant Wallet (Fictional)',
    advertisedText: 'Advertised: "Instant Rs. 50,000 Cash in 5 Minutes! Lowest 0.1% daily rate. Apply with CNIC now!"',
    contractSnippet: `DIGITAL ADVANCE MEMORANDUM & USER TERMS
Lender: QuickCash Instant Capital Tech Ltd.
Approved Credit Limit: PKR 50,000
Duration: 30 Calendar Days
Upfront Platform Maintenance & Risk Surcharge: PKR 6,500
Technical Verification Fee: PKR 3,000
Document Appraisal Charge: PKR 1,500
Net Cash Credited to Borrower: PKR 39,000
Repayment Sum at Day 30: PKR 52,500
Late Payment Clause: Daily default penalty of 1.5% (PKR 750/day) shall accrue immediately on Day 31.
Recovery & Contact Authorization: Borrower explicitly authorizes lender and third-party recovery teams to contact any phonebook contacts, emergency references, or employer numbers to facilitate settlement.`,
    samplePermissions: ['CONTACTS', 'SMS', 'LOCATION', 'STORAGE_GALLERY', 'CAMERA'],
    resultData: {
      id: 'demo-result-2',
      createdAt: new Date().toISOString(),
      lenderName: 'QuickCash Instant Wallet (Fictional)',
      appName: 'QuickCash Fast Loan App',
      analysisMethod: 'ADVERTISEMENT_UPLOAD',
      fileName: 'QuickCash_Promo_and_Agreement.jpg',
      fileType: 'image/jpeg',
      isDemo: true,
      demoScenarioId: 'heavy-deductions-app',
      riskAssessment: {
        overallScore: 73,
        riskLevel: 'HIGH',
        riskTitle: 'HIGH RISK',
        summaryReason: 'Significant upfront fee deductions of 22% (PKR 11,000) mean you receive far less than advertised, combined with high daily late penalties and aggressive contact permissions.',
        reasons: [
          'Large upfront deductions: You only receive PKR 39,000 out of the PKR 50,000 loan.',
          'High cost of borrowing: You pay back PKR 52,500 for receiving only PKR 39,000 in 30 days (Effective monthly cost of ~34.6%).',
          'Punitive late penalty: PKR 750/day (1.5% daily) accumulates immediately upon missing the due date.',
          'Invasive permission requests: Full contacts list and photo storage requested.',
          'Recovery clause permits contacting phonebook contacts and emergency references.'
        ],
        positiveFactors: [
          'Repayment timeline (30 days) is defined in writing.'
        ],
        factors: [
          {
            name: 'Financial Transparency',
            category: 'Transparency',
            score: 14,
            maxWeight: 20,
            riskImpact: 'HIGH',
            finding: 'Upfront deductions were split into 3 obscure fee lines not shown in primary advertisement.'
          },
          {
            name: 'Upfront Deductions',
            category: 'Financial',
            score: 14,
            maxWeight: 15,
            riskImpact: 'HIGH',
            finding: 'PKR 11,000 (22%) deducted upfront before disbursement.'
          },
          {
            name: 'Late Payment Penalties',
            category: 'Terms',
            score: 13,
            maxWeight: 15,
            riskImpact: 'HIGH',
            finding: 'PKR 750 daily penalty (1.5% per day) starts on Day 31.'
          },
          {
            name: 'Contract Clarity & Clauses',
            category: 'Legal',
            score: 11,
            maxWeight: 15,
            riskImpact: 'HIGH',
            finding: 'Contains unilateral collection and contact outreach clauses.'
          },
          {
            name: 'Promise vs Document Discrepancy',
            category: 'Consumer Trust',
            score: 12,
            maxWeight: 15,
            riskImpact: 'HIGH',
            finding: 'Advertised "Instant 50,000" delivers only 39,000 cash in hand.'
          },
          {
            name: 'Data & Privacy Exposure',
            category: 'Privacy',
            score: 9,
            maxWeight: 10,
            riskImpact: 'HIGH',
            finding: 'Requests access to Contacts and Photo Gallery.'
          },
          {
            name: 'Recovery Clause Terms',
            category: 'Consumer Protection',
            score: 9,
            maxWeight: 10,
            riskImpact: 'HIGH',
            finding: 'Explicit clause allowing recovery calls to your friends/family phonebook.'
          }
        ],
        confidenceScore: 94,
        disclaimer: 'LoanShield AI provides AI-assisted information and risk analysis based on the information and documents submitted by the user. It does not provide legal, financial, or regulatory advice and does not determine whether a lender has violated the law.'
      },
      financialBreakdown: {
        advertisedAmount: 50000,
        principalAmount: 50000,
        totalDeductions: 11000,
        actualDisbursedAmount: 39000,
        totalRepaymentAmount: 52500,
        totalCostOfBorrowing: 13500,
        effectiveAnnualPercentageRate: 421.2,
        effectiveMonthlyRate: 34.6,
        durationDays: 30,
        numberOfInstallments: 1,
        installmentAmount: 52500,
        chargesList: [
          {
            id: 'c-201',
            name: 'Platform Maintenance & Risk Surcharge',
            type: 'UPFRONT_DEDUCTION',
            amount: 6500,
            percentage: 13,
            isDeductedFromDisbursement: true,
            frequency: 'ONCE',
            description: 'Deducted directly before funds transfer.',
            isClearlyDisclosed: false
          },
          {
            id: 'c-202',
            name: 'Technical Verification Fee',
            type: 'UPFRONT_DEDUCTION',
            amount: 3000,
            percentage: 6,
            isDeductedFromDisbursement: true,
            frequency: 'ONCE',
            description: 'Automated algorithm processing fee deducted upfront.',
            isClearlyDisclosed: false
          },
          {
            id: 'c-203',
            name: 'Document Appraisal Charge',
            type: 'UPFRONT_DEDUCTION',
            amount: 1500,
            percentage: 3,
            isDeductedFromDisbursement: true,
            frequency: 'ONCE',
            description: 'Verification of CNIC data fee deducted upfront.',
            isClearlyDisclosed: false
          },
          {
            id: 'c-204',
            name: 'Daily Late Penalty',
            type: 'PENALTY',
            amount: 750,
            percentage: 1.5,
            isDeductedFromDisbursement: false,
            frequency: 'DAILY',
            description: 'PKR 750 per day (1.5%) starting from day 31.',
            isClearlyDisclosed: true
          }
        ],
        assumptions: [
          'Calculated for full single-bullet repayment at Day 30.',
          'Total cost of borrowing includes PKR 11,000 upfront deductions plus PKR 2,500 contract markup.'
        ]
      },
      advertisedPromise: {
        advertisedAmount: 50000,
        advertisedMarkupRate: '0.1% daily / Low Markup',
        advertisedDuration: '30 Days',
        advertisedDisbursedAmount: 50000,
        marketingClaims: [
          'Instant Rs. 50,000 Cash in 5 Minutes',
          'Lowest Daily Rate 0.1%',
          'No Paperwork / Easy Approval'
        ],
        advertisedRepaymentAmount: 51500
      },
      contractReality: {
        documentedPrincipal: 50000,
        documentedDisbursement: 39000,
        documentedDurationDays: 30,
        documentedMarkupRateAnnual: 60,
        totalUpfrontDeductions: 11000,
        totalRecurringFees: 0,
        documentedRepaymentAmount: 52500,
        latePenaltyRatePerDay: 1.5,
        isSecpRegisteredClaimed: false
      },
      discrepancies: [
        {
          id: 'disc-21',
          category: 'LOAN_AMOUNT',
          promised: 'PKR 50,000 Cash in Hand',
          actual: 'PKR 39,000 Received (PKR 11,000 deducted upfront)',
          severity: 'CRITICAL',
          explanation: 'The ad suggests you receive Rs. 50,000, but 3 separate fees are deducted before disbursement.'
        },
        {
          id: 'disc-22',
          category: 'FEES_AND_CHARGES',
          promised: 'Zero hidden fees mentioned in ad',
          actual: 'PKR 11,000 in 3 upfront fee categories',
          severity: 'CRITICAL',
          explanation: 'Platform and technical verification charges represent 22% of the principal loan amount.'
        },
        {
          id: 'disc-23',
          category: 'MARKUP_RATE',
          promised: '0.1% daily (approx 3% monthly)',
          actual: 'Total borrowing cost equals ~34.6% for 30 days when including upfront fees',
          severity: 'WARNING',
          explanation: 'Nominal interest hides the fact that true cost of borrowing is over 34% per month.'
        }
      ],
      clauses: [
        {
          id: 'cl-201',
          clauseTitle: 'Recovery & Third-Party Contact Clause',
          originalText: 'Borrower explicitly authorizes lender and third-party recovery teams to contact any phonebook contacts, emergency references, or employer numbers to facilitate settlement in case of overdue balance beyond 48 hours.',
          category: 'RECOVERY',
          simpleExplanation: {
            en: 'If you are late by 2 days, the company states it can call your family, employer, and any contact in your phonebook.',
            ur: 'اگر آپ کی ادائیگی میں 2 دن کی تاخیر ہوئی تو کمپنی آپ کے رشتہ داروں، دفتر اور فون بک کے دوستوں کو کال کر سکتی ہے۔',
            roman_ur: 'Agar aap 2 din late huay toh company aapke phonebook contacts aur rishtedaron ko recovery ke liye call kar sakti hai.'
          },
          whyItMatters: {
            en: 'This can cause serious social distress and embarrassment with friends and coworkers.',
            ur: 'اس سے آپ کے خاندان اور دوستوں میں شدید پریشانی اور بدنامی کا خطرہ پیدا ہو سکتا ہے۔',
            roman_ur: 'Is clause se aap ki social privacy aur family me sakht pareshani ho sakti hai.'
          },
          riskFlag: 'RED'
        },
        {
          id: 'cl-202',
          clauseTitle: 'Daily Default Surcharge Clause',
          originalText: 'A daily default penalty of 1.5% (PKR 750/day) calculated on the original gross facility of PKR 50,000 shall accrue immediately commencing from Day 31 until full liquidation.',
          category: 'PENALTIES',
          simpleExplanation: {
            en: 'You will be charged Rs. 750 every single day you are late, which adds up to Rs. 22,500 in just one month of delay.',
            ur: 'تاخیر کی صورت میں ہر روز 750 روپے جرمانہ لگے گا، یعنی صرف ایک ماہ کی تاخیر پر 22,500 روپے کا اضافی بوجھ۔',
            roman_ur: 'Late hone par rozana Rs. 750 ka fine parega jo ek mahine me Rs. 22,500 ban jayega.'
          },
          whyItMatters: {
            en: 'The debt can quickly double if you face temporary repayment delays.',
            ur: 'کسی عارضی مجبوری کی صورت میں قرض کی رقم تیزی سے دگنی ہو جائے گی۔',
            roman_ur: 'Thori si delay se bhi total loan rapidly double ho sakta hai.'
          },
          riskFlag: 'RED'
        }
      ],
      permissions: [
        {
          permission: 'CONTACTS',
          displayName: 'Contacts (Read Phonebook)',
          requested: true,
          concernLevel: 'HIGH',
          whyItMatters: 'Uploads your personal contact list to the server.',
          potentialAbuseContext: 'Directly enables the recovery clause allowing calls to your phonebook.',
          recommendation: 'Do NOT grant contact book permissions to quick loan apps.'
        },
        {
          permission: 'STORAGE_GALLERY',
          displayName: 'Photos / Gallery Storage',
          requested: true,
          concernLevel: 'HIGH',
          whyItMatters: 'Grants access to private photos and media on your phone.',
          potentialAbuseContext: 'Personal photos may be extracted or stored off-device.',
          recommendation: 'Refuse storage permissions; only provide individual CNIC image if required.'
        },
        {
          permission: 'SMS',
          displayName: 'SMS Messages',
          requested: true,
          concernLevel: 'MODERATE',
          whyItMatters: 'Can read OTPs and financial transaction alerts.',
          potentialAbuseContext: 'Financial history profiling.',
          recommendation: 'Be cautious when granting full SMS access.'
        }
      ],
      executiveSummary: {
        actualAmountReceivedText: 'Although the loan is for PKR 50,000, you will only receive PKR 39,000 in your account because PKR 11,000 is deducted upfront.',
        totalRepaymentText: 'You will be required to repay PKR 52,500 at the end of 30 days.',
        chargesIdentifiedSummary: 'Three large upfront fees were identified: Platform Maintenance (PKR 6,500), Technical Verification (PKR 3,000), and Document Appraisal (PKR 1,500).',
        latePaymentImpactSummary: 'Late payments incur an aggressive penalty of PKR 750 per day (1.5% daily), rapidly multiplying the amount you owe.',
        criticalClausesSummary: 'The agreement contains a high-risk recovery clause authorizing calls to your phonebook contacts and references.',
        promiseDiscrepancySummary: 'Critical discrepancies found: The advertisement promised Rs. 50,000 with low markup, but the agreement delivers only Rs. 39,000 cash with a true 30-day borrowing cost of 34.6%.',
        privacyConcernsSummary: 'The app requests invasive permissions including Contacts and Photo Gallery, which are unnecessary for standard lending.',
        verificationAdvice: [
          'Ask the lender in writing why PKR 11,000 is deducted upfront from your disbursement.',
          'Check if this company is registered on the official SECP licensed NBFC registry.',
          'Never permit contact list or photo gallery permissions on your smartphone.',
          'Consider whether you can repay PKR 52,500 in 30 days after receiving only PKR 39,000.'
        ]
      },
      verificationChecklist: [
        {
          id: 'chk-201',
          title: 'Examine Upfront Net Deduction',
          description: 'Confirm that you are comfortable receiving PKR 39,000 while remaining liable to repay PKR 52,500.',
          isCritical: true,
          verificationTip: 'A 22% upfront cut means your effective cost of borrowing is drastically higher.'
        },
        {
          id: 'chk-202',
          title: 'Review Phone Permission Prompts',
          description: 'Ensure you deny Contacts and Gallery permissions in Android/iOS app settings.',
          isCritical: true,
          verificationTip: 'Protect your family and friends privacy before installing.'
        }
      ]
    }
  },
  {
    id: 'predatory-rollover-trap',
    title: 'Scenario 3: 7-Day Rollover Trap with Massive Information Gaps',
    tagline: 'Severe discrepancy: 7-day tenure disguised as 90-day, extreme 5% daily fee',
    description: 'An aggressive 7-day micro-loan disguised as a 3-month loan, featuring 28% upfront deduction, 5% daily late penalty, and weekly rollover fee traps.',
    riskBadge: 'VERY_HIGH',
    lenderName: 'EasyMoney Express 24/7 (Fictional)',
    advertisedText: 'Advertised: "Rs. 100,000 Instant Cash in Easypaisa / JazzCash! 0% Interest, 3 Months Payback!"',
    contractSnippet: `SHORT TERM ADVANCE AGREEMENT (NON-BANK FACILITY)
Facility Amount: PKR 100,000
Effective Term: 7 Calendar Days (Due on Day 7)
Risk Insurance & Liquidity Surcharge: PKR 28,000 (Deducted upfront)
Disbursed Net Sum: PKR 72,000
Total Due on Day 7: PKR 105,000
Extension / Rollover Option: Borrower may postpone repayment for 7 days upon paying PKR 18,000 Extension Charge (does not reduce principal).
Default Penalty: 5% of gross facility (PKR 5,000/day) accrued daily for any default.
Full Recovery & Social Network Access: Borrower grants full permission to access device photos, contact book, location history, and publish overdue notices across social channels upon 24-hour default.`,
    samplePermissions: ['CONTACTS', 'STORAGE_GALLERY', 'CALL_LOGS', 'SMS', 'LOCATION', 'MICROPHONE'],
    resultData: {
      id: 'demo-result-3',
      createdAt: new Date().toISOString(),
      lenderName: 'EasyMoney Express 24/7 (Fictional)',
      appName: 'EasyMoney Express App',
      analysisMethod: 'AGREEMENT_UPLOAD',
      fileName: 'EasyMoney_Contract_Sample.pdf',
      fileType: 'application/pdf',
      isDemo: true,
      demoScenarioId: 'predatory-rollover-trap',
      riskAssessment: {
        overallScore: 92,
        riskLevel: 'VERY_HIGH',
        riskTitle: 'VERY HIGH RISK',
        summaryReason: 'Severe information asymmetry: The advertisement promised a 3-month tenure with 0% interest, but the actual contract demands full repayment in just 7 days with a 28% upfront fee deduction and 5% daily default penalties.',
        reasons: [
          'Major tenure discrepancy: Advertised as 3 months, contract is only for 7 days.',
          'Severe upfront deduction: PKR 28,000 deducted immediately; you only get PKR 72,000.',
          'Repayment shock: You must pay back PKR 105,000 in only 7 days (Cost of borrowing is PKR 33,000 in 1 week!).',
          'Astronomical APR: Equivalent to an annualized borrowing cost over 2,300%.',
          'Rollover trap: PKR 18,000 extension fee every 7 days without reducing the loan amount.',
          'Extreme daily penalty of PKR 5,000/day (5% daily).',
          'Invasive permissions and aggressive social recovery clause.'
        ],
        positiveFactors: [],
        factors: [
          {
            name: 'Financial Transparency',
            category: 'Transparency',
            score: 19,
            maxWeight: 20,
            riskImpact: 'CRITICAL',
            finding: 'Total concealment of 7-day tenure and APR in primary marketing.'
          },
          {
            name: 'Upfront Deductions',
            category: 'Financial',
            score: 15,
            maxWeight: 15,
            riskImpact: 'CRITICAL',
            finding: 'PKR 28,000 (28%) deducted upfront before disbursement.'
          },
          {
            name: 'Late Payment Penalties',
            category: 'Terms',
            score: 15,
            maxWeight: 15,
            riskImpact: 'CRITICAL',
            finding: 'Extreme penalty of PKR 5,000 per day (5% daily).'
          },
          {
            name: 'Contract Clarity & Clauses',
            category: 'Legal',
            score: 14,
            maxWeight: 15,
            riskImpact: 'CRITICAL',
            finding: 'Perpetual rollover clause and coercive social network recovery terms.'
          },
          {
            name: 'Promise vs Document Discrepancy',
            category: 'Consumer Trust',
            score: 15,
            maxWeight: 15,
            riskImpact: 'CRITICAL',
            finding: 'Advertised 3 months with 0% interest vs actual 7 days with PKR 33,000 cost.'
          },
          {
            name: 'Data & Privacy Exposure',
            category: 'Privacy',
            score: 9,
            maxWeight: 10,
            riskImpact: 'HIGH',
            finding: 'Requests full access to Contacts, Photos, Call logs, and Mic.'
          },
          {
            name: 'Recovery Clause Terms',
            category: 'Consumer Protection',
            score: 10,
            maxWeight: 10,
            riskImpact: 'CRITICAL',
            finding: 'Threatens social media dissemination and calling entire contact list.'
          }
        ],
        confidenceScore: 98,
        disclaimer: 'LoanShield AI provides AI-assisted information and risk analysis based on the information and documents submitted by the user. It does not provide legal, financial, or regulatory advice and does not determine whether a lender has violated the law.'
      },
      financialBreakdown: {
        advertisedAmount: 100000,
        principalAmount: 100000,
        totalDeductions: 28000,
        actualDisbursedAmount: 72000,
        totalRepaymentAmount: 105000,
        totalCostOfBorrowing: 33000,
        effectiveAnnualPercentageRate: 2389.2,
        effectiveMonthlyRate: 196.4,
        durationDays: 7,
        numberOfInstallments: 1,
        installmentAmount: 105000,
        chargesList: [
          {
            id: 'c-301',
            name: 'Risk Insurance & Liquidity Surcharge',
            type: 'UPFRONT_DEDUCTION',
            amount: 28000,
            percentage: 28,
            isDeductedFromDisbursement: true,
            frequency: 'ONCE',
            description: 'Deducted directly from the principal before transfer.',
            isClearlyDisclosed: false
          },
          {
            id: 'c-302',
            name: '7-Day Contract Markup',
            type: 'RECURRING_FEE',
            amount: 5000,
            percentage: 5,
            isDeductedFromDisbursement: false,
            frequency: 'ONCE',
            description: 'Added to principal due on Day 7.',
            isClearlyDisclosed: false
          },
          {
            id: 'c-303',
            name: '7-Day Extension / Rollover Fee',
            type: 'RECURRING_FEE',
            amount: 18000,
            percentage: 18,
            isDeductedFromDisbursement: false,
            frequency: 'WEEKLY',
            description: 'Weekly charge to delay repayment by 7 days (does not lower debt).',
            isClearlyDisclosed: false
          },
          {
            id: 'c-304',
            name: 'Daily Default Penalty',
            type: 'PENALTY',
            amount: 5000,
            percentage: 5,
            isDeductedFromDisbursement: false,
            frequency: 'DAILY',
            description: 'PKR 5,000 per day (5%) for every day of delay.',
            isClearlyDisclosed: true
          }
        ],
        assumptions: [
          'Assumes the borrower must repay in a single payment within 7 days.',
          'Borrowing cost is PKR 33,000 over 7 days for net PKR 72,000 in hand.'
        ]
      },
      advertisedPromise: {
        advertisedAmount: 100000,
        advertisedMarkupRate: '0% Interest',
        advertisedDuration: '3 Months (90 Days)',
        advertisedDisbursedAmount: 100000,
        marketingClaims: [
          'Rs. 100,000 Instant Cash in Easypaisa',
          '0% Interest Rate',
          '3 Months Payback Period'
        ],
        advertisedRepaymentAmount: 100000
      },
      contractReality: {
        documentedPrincipal: 100000,
        documentedDisbursement: 72000,
        documentedDurationDays: 7,
        documentedMarkupRateAnnual: 260,
        totalUpfrontDeductions: 28000,
        totalRecurringFees: 5000,
        documentedRepaymentAmount: 105000,
        latePenaltyRatePerDay: 5,
        isSecpRegisteredClaimed: false
      },
      discrepancies: [
        {
          id: 'disc-31',
          category: 'REPAYMENT_TIMELINE',
          promised: '3 Months (90 Days)',
          actual: '7 Days only',
          severity: 'CRITICAL',
          explanation: 'The ad advertised a 90-day term, but the agreement demands full repayment in just 7 days.'
        },
        {
          id: 'disc-32',
          category: 'LOAN_AMOUNT',
          promised: 'PKR 100,000 Disbursed',
          actual: 'PKR 72,000 Received (PKR 28,000 deducted upfront)',
          severity: 'CRITICAL',
          explanation: 'You receive 28% less cash than advertised.'
        },
        {
          id: 'disc-33',
          category: 'MARKUP_RATE',
          promised: '0% Interest',
          actual: 'PKR 33,000 total borrowing cost in 7 days',
          severity: 'CRITICAL',
          explanation: 'While labeled "0% interest", upfront fees and contract additions create a massive financial cost.'
        }
      ],
      clauses: [
        {
          id: 'cl-301',
          clauseTitle: 'Weekly Rollover & Extension Trap Clause',
          originalText: 'Borrower may postpone repayment for 7 days upon paying PKR 18,000 Extension Charge. Payment of extension charge shall not reduce the principal indebtedness.',
          category: 'UNILATERAL_CHANGE',
          simpleExplanation: {
            en: 'If you cannot pay after 7 days, you can pay Rs. 18,000 to get 7 more days, but your total debt stays exactly Rs. 105,000.',
            ur: 'اگر آپ 7 دن میں ادائیگی نہیں کر سکتے تو 18,000 روپے دے کر مزید 7 دن ملیں گے، لیکن آپ کا اصل قرضہ ایک روپیہ بھی کم نہیں ہو گا۔',
            roman_ur: 'Agar 7 din me wapis na kar sakein toh Rs. 18,000 de kar 7 din milenge, lekin aap ka original loan Rs. 105,000 hi rahega.'
          },
          whyItMatters: {
            en: 'This creates a recurring debt trap where you pay thousands every week without paying off the loan.',
            ur: 'یہ ایک نہ ختم ہونے والا قرض کا جال ہے جہاں ہر ہفتے پیسے دینے کے باوجود قرض ختم نہیں ہوتا۔',
            roman_ur: 'Yeh debt trap hai jahan har hafte extension fees jaati rehti hai par loan khatam nahi hota.'
          },
          riskFlag: 'RED'
        },
        {
          id: 'cl-302',
          clauseTitle: 'Coercive Social Recovery Clause',
          originalText: 'Borrower grants full permission to access device photos, contact book, location history, and publish overdue notices across social channels upon 24-hour default.',
          category: 'RECOVERY',
          simpleExplanation: {
            en: 'The lender claims the right to post your photo and loan status on social media and message all your contacts if payment is 24 hours late.',
            ur: 'کمپنی دعویٰ کرتی ہے کہ صرف 24 گھنٹے کی تاخیر پر وہ آپ کی تصاویر اور قرض کی تفصیلات سوشل میڈیا اور آپ کے دوستوں کو بھیج سکتی ہے۔',
            roman_ur: 'Company 24 ghante late hone par social media aur contacts par notices bhejney ka threat deti hai.'
          },
          whyItMatters: {
            en: 'This is a severe violation of personal privacy and harassment.',
            ur: 'یہ ذاتی پرائیویسی کی سنگین خلاف ورزی اور بلیک میلنگ کا خطرہ ہے۔',
            roman_ur: 'Yeh severe harassment aur privacy violation ka risk hai.'
          },
          riskFlag: 'RED'
        }
      ],
      permissions: [
        {
          permission: 'CONTACTS',
          displayName: 'Contacts (Full Phonebook)',
          requested: true,
          concernLevel: 'HIGH',
          whyItMatters: 'Uploads your whole address book.',
          potentialAbuseContext: 'Used for harassment calls to friends, family, and coworkers.',
          recommendation: 'DO NOT grant contact permissions.'
        },
        {
          permission: 'STORAGE_GALLERY',
          displayName: 'Photos & Media Gallery',
          requested: true,
          concernLevel: 'HIGH',
          whyItMatters: 'Full access to private images on device.',
          potentialAbuseContext: 'Risk of personal media misuse in recovery threats.',
          recommendation: 'Reject gallery access immediately.'
        },
        {
          permission: 'CALL_LOGS',
          displayName: 'Call Logs',
          requested: true,
          concernLevel: 'HIGH',
          whyItMatters: 'Tracks all call records.',
          potentialAbuseContext: 'Determines most frequently dialed contacts to pressure.',
          recommendation: 'Never grant call log access.'
        }
      ],
      executiveSummary: {
        actualAmountReceivedText: 'You will only receive PKR 72,000 in hand because PKR 28,000 is deducted upfront as an undisclosed risk surcharge.',
        totalRepaymentText: 'You must repay PKR 105,000 in only 7 calendar days.',
        chargesIdentifiedSummary: 'Substantial upfront fee of PKR 28,000, plus a PKR 5,000 markup fee and an aggressive PKR 18,000 weekly rollover extension charge.',
        latePaymentImpactSummary: 'Late payments trigger an extreme PKR 5,000 per day fine (5% daily) and immediate escalation to phonebook contacts.',
        criticalClausesSummary: 'Severe red flags: The loan duration is only 7 days (not 3 months), extension fees do not reduce principal, and recovery terms threaten social media exposure.',
        promiseDiscrepancySummary: 'Huge discrepancies: Advertised as 3-month 0% interest loan, but the contract is a 7-day high-cost debt trap requiring PKR 33,000 fee in 1 week.',
        privacyConcernsSummary: 'The app requests dangerous permissions including Contacts, Photo Gallery, and Call Logs.',
        verificationAdvice: [
          'DO NOT accept this loan offer or install this application.',
          'Verify if the entity is an illegal unregistered loan application reported to SECP/FIA.',
          'Be aware that extension fees will keep you trapped in debt without reducing your balance.',
          'Report predatory loan apps to the SECP Consumer Protection Department (queries@secp.gov.pk) or FIA Cyber Crime Wing (1991).'
        ]
      },
      verificationChecklist: [
        {
          id: 'chk-301',
          title: 'Immediate Rejection Advisory',
          description: 'A 7-day loan with 28% upfront cut and 5% daily penalty represents a classic digital debt trap.',
          isCritical: true,
          verificationTip: 'Official SECP licensed NBFCs in Pakistan are restricted from 7-day ultra-short debt traps.'
        },
        {
          id: 'chk-302',
          title: 'Uninstall App & Revoke Permissions',
          description: 'If already downloaded, uninstall the app immediately and revoke contacts/gallery access.',
          isCritical: true,
          verificationTip: 'Go to Android Settings > Apps > Permissions to ensure contacts access is disabled.'
        }
      ]
    }
  }
];
