import { LanguageCode } from '../types';

export interface TranslationDictionary {
  // Navbar & Global
  nav: {
    tagline: string;
    home: string;
    analyze: string;
    history: string;
    demoScenarios: string;
    login: string;
    logout: string;
    switchLanguage: string;
  };
  // Landing Page
  landing: {
    badge: string;
    heroTitlePrefix: string;
    heroTitleHighlight: string;
    heroTitleSuffix: string;
    heroDescription: string;
    analyzeButton: string;
    tryDemoButton: string;
    secpWarningTitle: string;
    secpWarningDesc: string;
    statsScanned: string;
    statsScannedLabel: string;
    statsHiddenFees: string;
    statsHiddenFeesLabel: string;
    statsPredatory: string;
    statsPredatoryLabel: string;
    featuresHeading: string;
    feature1Title: string;
    feature1Desc: string;
    feature2Title: string;
    feature2Desc: string;
    feature3Title: string;
    feature3Desc: string;
    feature4Title: string;
    feature4Desc: string;
    howItWorksHeading: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    ctaHeading: string;
    ctaDesc: string;
    ctaButton: string;
  };
  // Analyze Page
  analyze: {
    pageTitle: string;
    pageSubtitle: string;
    tabUpload: string;
    tabManual: string;
    uploadTitle: string;
    uploadSubtitle: string;
    dropzoneTitle: string;
    dropzoneSubtitle: string;
    chooseFileBtn: string;
    fileSelected: string;
    orPasteText: string;
    pastePlaceholder: string;
    lenderNameLabel: string;
    lenderNamePlaceholder: string;
    advertisedAmountLabel: string;
    advertisedDurationLabel: string;
    repaymentExpectedLabel: string;
    permissionsLabel: string;
    permissionsSubtitle: string;
    permContacts: string;
    permLocation: string;
    permStorage: string;
    permCamera: string;
    permPhoneState: string;
    startAnalysisBtn: string;
    demoNotice: string;
    demoNoticeLink: string;
    manualHeading: string;
    manualPrincipalLabel: string;
    manualDurationLabel: string;
    manualRateLabel: string;
    manualUpfrontLabel: string;
    manualCalculateBtn: string;
  };
  // Progress Page
  progress: {
    analyzingTitle: string;
    analyzingSubtitle: string;
    stepExtracting: string;
    stepCalculating: string;
    stepCheckingSECP: string;
    stepScoring: string;
  };
  // Results Page
  results: {
    newAnalysis: string;
    auditId: string;
    askAdvisor: string;
    printPdf: string;
    downloadPdfReport: string;
    simpleViewMode: string;
    detailedViewMode: string;
    verdictDoNotBorrow: string;
    verdictProceedWithCaution: string;
    verdictSafeRegulated: string;
    verdictSubtitleDanger: string;
    verdictSubtitleCaution: string;
    verdictSubtitleSafe: string;
    keyTruthNumbers: string;
    receivedCashLabel: string;
    repayCashLabel: string;
    tenureLabel: string;
    topWarningsTitle: string;
    viewFullAuditBtn: string;
    backToSimpleBtn: string;
    riskScoreTitle: string;
    riskScoreSubtitle: string;
    tabOverview: string;
    tabPromiseVsReality: string;
    tabFinancials: string;
    tabClauses: string;
    tabPrivacy: string;
    tabChecklist: string;
    netCashReceived: string;
    sanctionedAmount: string;
    upfrontDeductions: string;
    totalRepayment: string;
    effectiveAPR: string;
    tenureDays: string;
    secpViolationsTitle: string;
    noViolationsFound: string;
    simulatorTitle: string;
    simulatorSubtitle: string;
    simulateDelayDays: string;
    advisorDrawerTitle: string;
    advisorPlaceholder: string;
    advisorSendBtn: string;
  };
  // Dashboard / History
  dashboard: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    noHistoryTitle: string;
    noHistorySubtitle: string;
    startNewAudit: string;
    viewReport: string;
    riskBadge: string;
    date: string;
    lender: string;
    principal: string;
    riskScore: string;
  };
  // Footer
  footer: {
    disclaimer: string;
    secpAdvisory: string;
    rightsReserved: string;
    privacyPolicy: string;
    termsOfService: string;
  };
}

export const translations: Record<LanguageCode, TranslationDictionary> = {
  en: {
    nav: {
      tagline: "Know the Truth Before You Borrow",
      home: "Home",
      analyze: "Analyze Loan",
      history: "Audit History",
      demoScenarios: "Demo Scenarios",
      login: "Login",
      logout: "Logout",
      switchLanguage: "Language"
    },
    landing: {
      badge: "SECP & SBP Digital Lending Compliance Engine",
      heroTitlePrefix: "Know the ",
      heroTitleHighlight: "Hidden Truth",
      heroTitleSuffix: " Before You Borrow",
      heroDescription: "Protect yourself from predatory digital loan apps in Pakistan. Instantly audit contracts, detect illegal contact harvesting, calculate true APR, and uncover hidden upfront fee deductions.",
      analyzeButton: "Audit Your Loan Free",
      tryDemoButton: "Explore Live Demos",
      secpWarningTitle: "SECP Consumer Protection Advisory",
      secpWarningDesc: "Digital lenders are legally prohibited from harvesting borrower contact lists, deducting arbitrary upfront fees, or misrepresenting true interest rates under SECP Circulars 10, 15, and 22.",
      statsScanned: "50,000+",
      statsScannedLabel: "Contracts Audited",
      statsHiddenFees: "PKR 18.5M+",
      statsHiddenFeesLabel: "Hidden Deductions Flagged",
      statsPredatory: "98.4%",
      statsPredatoryLabel: "Detection Accuracy",
      featuresHeading: "Why Borrowers Trust LoanShield AI",
      feature1Title: "Upfront Fee & Cashout Audit",
      feature1Desc: "Instantly reveals how much money will actually hit your account versus the loan principal you are charged interest on.",
      feature2Title: "True APR Calculation",
      feature2Desc: "Calculates the real Annual Percentage Rate including all hidden service charges, verification fees, and insurance cuts.",
      feature3Title: "Illegal Permission Detection",
      feature3Desc: "Flags predatory apps requesting access to your phone contacts, gallery, or call logs in direct violation of SECP Circular 15.",
      feature4Title: "SECP Regulatory Cross-Check",
      feature4Desc: "Validates contract terms against official NBFC lending circulars and consumer financial protection frameworks.",
      howItWorksHeading: "How LoanShield AI Works in 3 Simple Steps",
      step1Title: "1. Upload Agreement or Enter Terms",
      step1Desc: "Upload your loan screenshot, PDF agreement, or manually enter the loan amount, tenure, and claimed interest rate.",
      step2Title: "2. Intelligent SECP & Financial Audit",
      step2Desc: "Our AI scans the terms, extracts deductions, verifies contact permissions, and computes the effective APR.",
      step3Title: "3. Get Comprehensive Risk Report",
      step3Desc: "Receive an explainable 0-100 risk score, complete cash breakdown, and personalized guidance before accepting.",
      ctaHeading: "Don't Sign an Unfair Loan Agreement",
      ctaDesc: "Take 30 seconds to audit your contract before accepting funds. Completely free and secure.",
      ctaButton: "Start Instant Loan Audit"
    },
    analyze: {
      pageTitle: "Audit a Loan Agreement",
      pageSubtitle: "Upload your loan document or enter the terms to uncover hidden fees, true APR, and regulatory violations.",
      tabUpload: "Upload Contract / Screenshot",
      tabManual: "Manual Financial Calculator",
      uploadTitle: "Upload Document or Loan Screenshot",
      uploadSubtitle: "Supports PDF, JPEG, PNG, or pasted contract text",
      dropzoneTitle: "Drag & drop your loan contract here, or click to browse",
      dropzoneSubtitle: "Supports PDF, JPG, PNG (Max 15MB)",
      chooseFileBtn: "Choose File",
      fileSelected: "File selected:",
      orPasteText: "Or Paste Agreement Text Directly",
      pastePlaceholder: "Paste the loan contract terms, SMS offer, or app terms and conditions here...",
      lenderNameLabel: "Lender / App Name",
      lenderNamePlaceholder: "e.g. EasyPaisa, Barwaqt, SmartQarza",
      advertisedAmountLabel: "Advertised Loan Amount (PKR)",
      advertisedDurationLabel: "Advertised Tenure (e.g. 30 Days)",
      repaymentExpectedLabel: "Expected Total Repayment (PKR)",
      permissionsLabel: "Requested Phone Permissions",
      permissionsSubtitle: "Select any permissions the loan app asks for on your smartphone",
      permContacts: "Contacts / Phonebook (SECP Prohibited)",
      permLocation: "Device Location / GPS",
      permStorage: "Photos, Media & Files",
      permCamera: "Camera / Video",
      permPhoneState: "Phone State / Call Logs",
      startAnalysisBtn: "Run Full Loan Audit",
      demoNotice: "Want to see how this works first?",
      demoNoticeLink: "Try a preloaded demo scenario",
      manualHeading: "Manual Financial Terms Verification",
      manualPrincipalLabel: "Loan Principal Amount (PKR)",
      manualDurationLabel: "Loan Tenure (Days)",
      manualRateLabel: "Claimed Interest / Markup Rate (%)",
      manualUpfrontLabel: "Upfront Deductions / Processing Fee (PKR)",
      manualCalculateBtn: "Calculate True APR & Risk"
    },
    progress: {
      analyzingTitle: "Analyzing Loan Agreement...",
      analyzingSubtitle: "Auditing financial terms against SECP regulations and computing true borrowing costs.",
      stepExtracting: "Extracting contract terms and numerical schedules...",
      stepCalculating: "Computing effective Annual Percentage Rate (APR)...",
      stepCheckingSECP: "Checking SECP Circulars 10, 15 & 22 compliance...",
      stepScoring: "Generating 7-factor explainable risk assessment..."
    },
    results: {
      newAnalysis: "New Analysis",
      auditId: "Audit ID",
      askAdvisor: "Ask AI Advisor",
      printPdf: "Print / PDF",
      downloadPdfReport: "Download PDF",
      simpleViewMode: "5-Sec Verdict",
      detailedViewMode: "Detailed Legal Audit",
      verdictDoNotBorrow: "DO NOT TAKE THIS LOAN",
      verdictProceedWithCaution: "PROCEED WITH CAUTION",
      verdictSafeRegulated: "FAIR & REGULATED LOAN",
      verdictSubtitleDanger: "Critical violations and predatory terms detected. Taking this loan puts you at extreme risk of debt traps and personal harassment.",
      verdictSubtitleCaution: "Noticeable hidden fees or tenure issues found. Review the breakdown carefully before agreeing.",
      verdictSubtitleSafe: "Complies with standard digital lending parameters. Transparent disclosures with no dangerous mobile permissions.",
      keyTruthNumbers: "The 3 Financial Realities (Sachai)",
      receivedCashLabel: "You Will Receive (Net)",
      repayCashLabel: "You Must Pay Back",
      tenureLabel: "Time Given To Pay",
      topWarningsTitle: "Critical Red Flags You Must Know",
      viewFullAuditBtn: "View Full Technical & Legal Audit (For SECP / Evidence)",
      backToSimpleBtn: "Back to 5-Second Simple Verdict",
      riskScoreTitle: "LoanShield Risk Assessment",
      riskScoreSubtitle: "Explainable 0-100 risk score based on financial transparency and regulatory compliance.",
      tabOverview: "Audit Overview",
      tabPromiseVsReality: "Advertised vs Reality",
      tabFinancials: "Cash Breakdown & APR",
      tabClauses: "Clauses & SECP Rules",
      tabPrivacy: "Privacy & Permissions",
      tabChecklist: "Borrower Checklist",
      netCashReceived: "Actual Cash Disbursed",
      sanctionedAmount: "Sanctioned Principal",
      upfrontDeductions: "Upfront Fee Deductions",
      totalRepayment: "Total Repayment Amount",
      effectiveAPR: "Effective Annual Rate (APR)",
      tenureDays: "Repayment Tenure",
      secpViolationsTitle: "SECP Regulatory Violations Identified",
      noViolationsFound: "No direct SECP violations identified in this agreement.",
      simulatorTitle: "Late Payment Penalty Simulator",
      simulatorSubtitle: "Simulate how compounding late fees increase your total debt if payment is delayed.",
      simulateDelayDays: "Simulate Delay (Days)",
      advisorDrawerTitle: "LoanShield Consumer Protection Advisor",
      advisorPlaceholder: "Ask a question about this loan, interest rate, or your legal rights...",
      advisorSendBtn: "Send"
    },
    dashboard: {
      title: "Loan Audit History",
      subtitle: "View and review all your past loan contract audits and risk evaluations.",
      searchPlaceholder: "Search by lender name or date...",
      noHistoryTitle: "No Audit Records Yet",
      noHistorySubtitle: "Start your first loan audit to verify loan contracts and protect your finances.",
      startNewAudit: "Audit a New Loan",
      viewReport: "View Full Report",
      riskBadge: "Risk Level",
      date: "Date",
      lender: "Lender Name",
      principal: "Principal",
      riskScore: "Risk Score"
    },
    footer: {
      disclaimer: "LoanShield AI is an independent consumer financial protection tool. It is not a lender or financial institution.",
      secpAdvisory: "Governed by SECP NBFC Digital Lending Regulations & SBP Consumer Protection Directives.",
      rightsReserved: "All rights reserved.",
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service"
    }
  },

  ur: {
    nav: {
      tagline: "قرض لینے سے پہلے سچائی جانیے",
      home: "ہوم",
      analyze: "قرض کی جانچ",
      history: "آڈٹ ہسٹری",
      demoScenarios: "ڈیمو نمونے",
      login: "لاگ ان",
      logout: "لاگ آؤٹ",
      switchLanguage: "زبان"
    },
    landing: {
      badge: "SECP اور اسٹیٹ بینک ڈیجیٹل قرضہ حفاظتی نظام",
      heroTitlePrefix: "قرض لینے سے پہلے ",
      heroTitleHighlight: "پوشیدہ سچائی",
      heroTitleSuffix: " جانیے",
      heroDescription: "پاکستان میں دھوکے باز اور غیر قانونی لون ایپس کے چنگل سے بچیں۔ فوری طور پر کنٹریکٹ کی جانچ کریں، فون بک چوری پکڑیں، اصل سالانہ شرح سود (APR) اور چھپی ہوئی کٹوتیاں معلوم کریں۔",
      analyzeButton: "مفت قرضہ جانچ شروع کریں",
      tryDemoButton: "ڈیمو مثالیں دیکھیں",
      secpWarningTitle: "SECP کی اہم ہدایات برائے صارفین",
      secpWarningDesc: "ایس ای سی پی کے سرکلر 10، 15 اور 22 کے تحت کوئی بھی لون ایپ آپ کے فون کی رابطہ فہرست (Contacts) حاصل کرنے، ایڈوانس کٹوتی کرنے یا شرح سود چھپانے کی مجاز نہیں ہے۔",
      statsScanned: "+50,000",
      statsScannedLabel: "چیک کیے گئے معاہدے",
      statsHiddenFees: "18.5 ملین+ روپے",
      statsHiddenFeesLabel: "پکڑی گئی پوشیدہ فیسیں",
      statsPredatory: "98.4%",
      statsPredatoryLabel: "درست جانچ کی شرح",
      featuresHeading: "قرض خواہ لون شیلڈ اے آئی پر کیوں اعتماد کرتے ہیں؟",
      feature1Title: "ایڈوانس فیس اور نیٹ کیش کا آڈٹ",
      feature1Desc: "فوری طور پر جانیں کہ آپ کے اکاؤنٹ میں اصل رقم کتنی آئے گی اور سود کس رقم پر چارج کیا جائے گا۔",
      feature2Title: "اصل سالانہ شرح سود (APR)",
      feature2Desc: "تمام خفیہ چارجز، پروسیسنگ فیس اور انشورنس ملا کر اصل شرح سود کا حساب لگاتا ہے۔",
      feature3Title: "غیر قانونی اجازتوں (Permissions) کی نشاندہی",
      feature3Desc: "ایس ای سی پی کے سرکلر 15 کے مطابق فون بک، فوٹوز یا کال لاگز مانگنے والی خطرناک ایپس کو فوری فلیگ کرتا ہے۔",
      feature4Title: "SECP قوانین سے تصدیق",
      feature4Desc: "قرض کے معاہدے کو آفیشل NBFC ڈیجیٹل لینڈنگ ریگولیشنز کے مطابق پرکھتا ہے۔",
      howItWorksHeading: "لون شیلڈ کس طرح کام کرتا ہے؟ (3 آسان مراحل)",
      step1Title: "1. معاہدہ اپ لوڈ کریں یا تفصیل درج کریں",
      step1Desc: "اپنے قرض کا اسکرین شاٹ، پی ڈی ایف یا رقم، مدت اور دعویٰ کردہ سود درج کریں۔",
      step2Title: "2. فوری AI اور مالیاتی آڈٹ",
      step2Desc: "ہمارا سسٹم شرائط کو اسکین کر کے پوشیدہ کٹوتیاں اور غیر قانونی پرمیشنز چیک کرتا ہے۔",
      step3Title: "3. جامع رسک رپورٹ حاصل کریں",
      step3Desc: "0 سے 100 کا رسک اسکور، مکمل مالیاتی بریک ڈاؤن اور رہنمائی حاصل کریں۔",
      ctaHeading: "غیر منصفانہ قرض معاہدے پر ہرگز دستخط نہ کریں",
      ctaDesc: "رقم وصول کرنے سے پہلے صرف 30 سیکنڈ میں اپنے معاہدے کا مفت آڈٹ کریں۔",
      ctaButton: "ابھی مفت آڈٹ کریں"
    },
    analyze: {
      pageTitle: "قرض کے معاہدے کی جانچ کریں",
      pageSubtitle: "خفیہ فیسوں، اصل شرح سود اور ریگولیٹری خلاف ورزیوں کا پتہ لگانے کے لیے دستاویز اپ لوڈ کریں یا تفصیلات درج کریں۔",
      tabUpload: "معاہدہ / اسکرین شاٹ اپ لوڈ کریں",
      tabManual: "دستی فنانشل کیلکولیٹر",
      uploadTitle: "دستاویز یا لون اسکرین شاٹ اپ لوڈ کریں",
      uploadSubtitle: "پی ڈی ایف، جے پی جی، پی این جی یا کاپی شدہ ٹیکسٹ سپورٹ کرتا ہے",
      dropzoneTitle: "فائل یہاں ڈریگ کریں یا منتخب کرنے کے لیے کلک کریں",
      dropzoneSubtitle: "سپورٹ شدہ فارمیٹس: PDF, JPG, PNG (زیادہ سے زیادہ 15MB)",
      chooseFileBtn: "فائل منتخب کریں",
      fileSelected: "منتخب فائل:",
      orPasteText: "یا معاہدے کا متن یہاں پیسٹ کریں",
      pastePlaceholder: "قرض کے معاہدے کی شرائط، میسج یا ایپ کی شرائط یہاں پیسٹ کریں...",
      lenderNameLabel: "قرض دینے والی ایپ / کمپنی کا نام",
      lenderNamePlaceholder: "مثلاً ایزی لون، بروقت، اسمارٹ قرضہ",
      advertisedAmountLabel: "ظاہری قرض کی رقم (روپے)",
      advertisedDurationLabel: "قرض کی مدت (مثلاً 30 دن)",
      repaymentExpectedLabel: "کل متوقع واپسی کی رقم (روپے)",
      permissionsLabel: "موبائل پر مانگی گئی پرمیشنز",
      permissionsSubtitle: "وہ تمام پرمیشنز منتخب کریں جو لون ایپ نے مانگی ہیں",
      permContacts: "فون بک / رابطے (SECP کے تحت سخت منع)",
      permLocation: "لوکیشن / GPS",
      permStorage: "تصاویر، میڈیا اور فائلز",
      permCamera: "کیمرہ / ویڈیو",
      permPhoneState: "فون اسٹیٹ / کال لاگز",
      startAnalysisBtn: "مکمل آڈٹ شروع کریں",
      demoNotice: "کیا آپ پہلے ڈیمو دیکھنا چاہتے ہیں؟",
      demoNoticeLink: "تیار شدہ ڈیمو منظر نامہ آزمائیں",
      manualHeading: "دستی فنانشل کیلکولیشن",
      manualPrincipalLabel: "اصل قرض کی رقم (روپے)",
      manualDurationLabel: "قرض کی مدت (دن)",
      manualRateLabel: "دعویٰ کردہ شرح سود (%)",
      manualUpfrontLabel: "ایڈوانس کٹوتی / پروسیسنگ فیس (روپے)",
      manualCalculateBtn: "اصل APR اور رسک کیلکولیٹ کریں"
    },
    progress: {
      analyzingTitle: "قرض کے معاہدے کی جانچ جاری ہے...",
      analyzingSubtitle: "ایس ای سی پی قوانین اور اصل لاگت کا تجزیہ کیا جا رہا ہے۔",
      stepExtracting: "معاہدے کی شرائط اور اعداد و شمار نکالے جا رہے ہیں...",
      stepCalculating: "اصل سالانہ شرح سود (APR) کا حساب لگایا جا رہا ہے...",
      stepCheckingSECP: "SECP سرکلر 10، 15 اور 22 کی خلاف ورزیوں کی جانچ...",
      stepScoring: "7 فیکٹر رسک اسکور تیار کیا جا رہا ہے..."
    },
    results: {
      newAnalysis: "نیا آڈٹ",
      auditId: "آڈٹ آئی ڈی",
      askAdvisor: "AI مشیر سے پوچھیں",
      printPdf: "پرنٹ / پی ڈی ایف",
      downloadPdfReport: "پی ڈی ایف ڈاؤنلوڈ",
      simpleViewMode: "فوری خلاصہ (5 سیکنڈ)",
      detailedViewMode: "مکمل قانونی آڈٹ",
      verdictDoNotBorrow: "یہ قرض ہرگز مت لیں!",
      verdictProceedWithCaution: "احتیاط کے ساتھ آگے بڑھیں",
      verdictSafeRegulated: "شفاف اور ریگولیٹڈ قرض",
      verdictSubtitleDanger: "انتہائی خطرناک شرائط اور SECP کی خلاف ورزیاں پائی گئیں۔ یہ قرض بلیک میلنگ اور قرض کے جال کا سبب بن سکتا ہے۔",
      verdictSubtitleCaution: "پوشیدہ فیس یا مدت کے مسائل پائے گئے۔ دستخط کرنے سے پہلے تمام شرائط بغور پڑھیں۔",
      verdictSubtitleSafe: "معیاری اور قانونی قرض کی شرائط۔ کوئی جارحانہ موبائل پرمیشنز یا چھپی ہوئی فیس نہیں ہے۔",
      keyTruthNumbers: "3 بنیادی حقائق (سچائی)",
      receivedCashLabel: "آپ کو ملیں گے (اصل کیش)",
      repayCashLabel: "واپس کرنے ہوں گے",
      tenureLabel: "واپسی کی کل مدت",
      topWarningsTitle: "اہم ترین انتباہات جو جاننا ضروری ہیں",
      viewFullAuditBtn: "مکمل قانونی اور تکنیکی آڈٹ دیکھیں (ثبوت و عدالت کے لیے)",
      backToSimpleBtn: "فوری خلاصے پر واپس جائیں",
      riskScoreTitle: "لون شیلڈ رسک اسسمنٹ",
      riskScoreSubtitle: "شفافیت اور قانونی ضوابط پر مبنی 0 سے 100 کا رسک اسکور۔",
      tabOverview: "آڈٹ خلاصہ",
      tabPromiseVsReality: "دعوے بمقابلہ حقیقت",
      tabFinancials: "مالیاتی بریک ڈاؤن اور APR",
      tabClauses: "شرائط و SECP قوانین",
      tabPrivacy: "پرائیویسی اور پرمیشنز",
      tabChecklist: "صارفین کے لیے چیک لسٹ",
      netCashReceived: "اصل موصول ہونے والی رقم",
      sanctionedAmount: "منظور شدہ قرض",
      upfrontDeductions: "ایڈوانس کٹوتیاں",
      totalRepayment: "کل واجب الادا رقم",
      effectiveAPR: "اصل سالانہ شرح سود (APR)",
      tenureDays: "قرض کی مدت",
      secpViolationsTitle: "SECP کی شناخت شدہ خلاف ورزیاں",
      noViolationsFound: "اس معاہدے میں کوئی براہ راست خلاف ورزی نہیں پائی گئی۔",
      simulatorTitle: "لیٹ فیس پینلٹی سمیلیٹر",
      simulatorSubtitle: "دیکھیں کہ تاخیر کی صورت میں روزانہ جرمانہ آپ کے قرض کو کتنا بڑھا دیتا ہے۔",
      simulateDelayDays: "تاخیر کے دن منتخب کریں",
      advisorDrawerTitle: "لون شیلڈ لیگل و فنانشل ایڈوائزر",
      advisorPlaceholder: "اس قرض یا اپنے قانونی حقوق کے بارے میں کوئی بھی سوال پوچھیں...",
      advisorSendBtn: "ارسال کریں"
    },
    dashboard: {
      title: "قرضہ آڈٹ ہسٹری",
      subtitle: "اپنے پچھلے تمام چیک کیے گئے معاہدے اور رسک رپورٹس دیکھیں۔",
      searchPlaceholder: "کمپنی کا نام یا تاریخ تلاش کریں...",
      noHistoryTitle: "کوئی پرانا ریکارڈ موجود نہیں",
      noHistorySubtitle: "اپنے مالی تحفظ کے لیے پہلا لون آڈٹ شروع کریں۔",
      startNewAudit: "نئے قرض کی جانچ کریں",
      viewReport: "مکمل رپورٹ دیکھیں",
      riskBadge: "رسک لیول",
      date: "تاریخ",
      lender: "ادارے کا نام",
      principal: "اصل رقم",
      riskScore: "رسک اسکور"
    },
    footer: {
      disclaimer: "لون شیلڈ اے آئی صارفین کے مالیاتی تحفظ کا ایک آزاد پلیٹ فارم ہے اور خود قرض فراہم نہیں کرتا۔",
      secpAdvisory: "ایس ای سی پی این بی ایف سی اور اسٹیٹ بینک کے قواعد کے تحت رہنمائی فراہم کرتا ہے۔",
      rightsReserved: "جملہ حقوق محفوظ ہیں۔",
      privacyPolicy: "پرائیویسی پالیسی",
      termsOfService: "شرائط و ضوابط"
    }
  },

  roman_ur: {
    nav: {
      tagline: "Qarz Lene Se Pehle Haqeeqat Janiye",
      home: "Home",
      analyze: "Qarz Ki Jaanch",
      history: "Audit History",
      demoScenarios: "Demo Scenarios",
      login: "Login",
      logout: "Logout",
      switchLanguage: "Language"
    },
    landing: {
      badge: "SECP & SBP Digital Lending Protection Engine",
      heroTitlePrefix: "Qarz Lene Se Pehle ",
      heroTitleHighlight: "Chhupi Haqeeqat",
      heroTitleSuffix: " Janiye",
      heroDescription: "Pakistan mein dhoke baaz aur illegal loan apps se bachein. Fori tor par contract check karein, phone contacts chori pakrein, asil saalana sood (APR) aur advance deductions maloom karein.",
      analyzeButton: "Muft Loan Audit Karein",
      tryDemoButton: "Live Demos Dekhein",
      secpWarningTitle: "SECP Consumer Protection Advisory",
      secpWarningDesc: "SECP Circulars 10, 15 aur 22 ke mutabiq koi bhi loan app aap ke phone contacts lene, ghair-waazeh advance fees kaatne ya sood chupane ki haqdaar nahi hai.",
      statsScanned: "50,000+",
      statsScannedLabel: "Audited Contracts",
      statsHiddenFees: "PKR 18.5M+",
      statsHiddenFeesLabel: "Chhupi Fees Pakri Gayi",
      statsPredatory: "98.4%",
      statsPredatoryLabel: "Sahi Shanakht Ki Ratio",
      featuresHeading: "Log LoanShield AI Par Kyun Bharosa Karte Hain?",
      feature1Title: "Upfront Fee & Cashout Audit",
      feature1Desc: "Fori pata chalayein ke aap ke account mein asil raqam kitni aye gi aur sood kis raqam par lage ga.",
      feature2Title: "Asil Saalana Sood (APR)",
      feature2Desc: "Tamam hidden charges aur processing fees mila kar asil Annual Percentage Rate calculate karta hai.",
      feature3Title: "Illegal Permissions Ki Shanakht",
      feature3Desc: "SECP Circular 15 ke tehat contacts, gallery ya call logs mangne wali apps ko warning deta hai.",
      feature4Title: "SECP Regulatory Cross-Check",
      feature4Desc: "Qarz ke muahiday ko SECP ke official rules aur consumer protection laws se verify karta hai.",
      howItWorksHeading: "LoanShield AI Kaise Kaam Karta Hai? (3 Aasan Steps)",
      step1Title: "1. Agreement Upload Karein Ya Details Likhein",
      step1Desc: "Apne loan ka screenshot, PDF ya raqam, muddat aur sood enter karein.",
      step2Title: "2. Intelligent AI & Financial Audit",
      step2Desc: "Hamara system contract scan kar ke hidden deductions aur illegal permissions check karta hai.",
      step3Title: "3. Complete Risk Report Hasil Karein",
      step3Desc: "0 se 100 ka risk score, mukammal cash breakdown aur rehnumai hasil karein.",
      ctaHeading: "Kisi Ghair-Munsifana Qarz Par Dastakhat Na Karein",
      ctaDesc: "Raqam lene se pehle sirf 30 seconds mein apne contract ka muft audit karein.",
      ctaButton: "Abhi Muft Audit Start Karein"
    },
    analyze: {
      pageTitle: "Qarz Ke Muahiday Ka Audit Karein",
      pageSubtitle: "Chhupi fees, asil sood aur regulatory violations pakarne ke liye document upload karein ya details enter karein.",
      tabUpload: "Contract / Screenshot Upload Karein",
      tabManual: "Manual Financial Calculator",
      uploadTitle: "Document Ya Loan Screenshot Upload Karein",
      uploadSubtitle: "PDF, JPEG, PNG ya copy kiya gaya text support karta hai",
      dropzoneTitle: "File yahan drag karein ya browse karne ke liye click karein",
      dropzoneSubtitle: "Supported: PDF, JPG, PNG (Max 15MB)",
      chooseFileBtn: "File Choose Karein",
      fileSelected: "Selected File:",
      orPasteText: "Ya Contract Ka Text Yahan Paste Karein",
      pastePlaceholder: "Loan agreement, SMS offer ya app ki terms yahan paste karein...",
      lenderNameLabel: "Lender / App Ka Naam",
      lenderNamePlaceholder: "Maslan EasyPaisa, Barwaqt, SmartQarza",
      advertisedAmountLabel: "Zahiri Loan Amount (PKR)",
      advertisedDurationLabel: "Muddat / Tenure (Maslan 30 Days)",
      repaymentExpectedLabel: "Kul Wapsi Ki Raqam (PKR)",
      permissionsLabel: "Mobile Par Mangi Gayi Permissions",
      permissionsSubtitle: "Wo tamam permissions select karein jo app ne mangi hain",
      permContacts: "Contacts / Phonebook (SECP Forbidden)",
      permLocation: "Device Location / GPS",
      permStorage: "Photos, Media & Files",
      permCamera: "Camera / Video",
      permPhoneState: "Phone State / Call Logs",
      startAnalysisBtn: "Mukammal Audit Start Karein",
      demoNotice: "Pehle dekhna chahte hain ke ye kaise kaam karta hai?",
      demoNoticeLink: "Preloaded demo scenario try karein",
      manualHeading: "Manual Financial Calculation",
      manualPrincipalLabel: "Asil Loan Principal (PKR)",
      manualDurationLabel: "Loan Tenure (Days)",
      manualRateLabel: "Claim Kiya Gaya Sood (%)",
      manualUpfrontLabel: "Upfront Deductions / Processing Fee (PKR)",
      manualCalculateBtn: "Asil APR & Risk Calculate Karein"
    },
    progress: {
      analyzingTitle: "Loan Agreement Ki Jaanch Ho Rahi Hai...",
      analyzingSubtitle: "SECP rules aur asil borrowing costs ka audit kiya ja raha hai.",
      stepExtracting: "Contract terms aur schedules nikale ja rahe hain...",
      stepCalculating: "Asil Saalana Sood (APR) calculate ho raha hai...",
      stepCheckingSECP: "SECP Circulars 10, 15 & 22 violations check ho rahi hain...",
      stepScoring: "7-Factor explainable risk score banaya ja raha hai..."
    },
    results: {
      newAnalysis: "Naya Audit",
      auditId: "Audit ID",
      askAdvisor: "AI Advisor Se Poochein",
      printPdf: "Print / PDF",
      downloadPdfReport: "Download PDF",
      simpleViewMode: "5-Sec Verdict",
      detailedViewMode: "Detailed Legal Audit",
      verdictDoNotBorrow: "YEH LOAN HARGEZ MAT LEIN!",
      verdictProceedWithCaution: "AHTIYAAT SE AAGAY BARHEIN",
      verdictSafeRegulated: "MEHFOOZ AUR SHAFAAF LOAN",
      verdictSubtitleDanger: "Intehai khatarnak terms aur SECP violations pakri gayin. Yeh loan debt trap aur personal harassment ka sabab ban sakta hai.",
      verdictSubtitleCaution: "Chupai hui fees ya muddat ke masail hain. Agreement sign karne se pehle achi tarah check karein.",
      verdictSubtitleSafe: "Complies with standard digital lending rules. Transparent disclosures with no dangerous mobile permissions.",
      keyTruthNumbers: "3 Bunyaadi Haqaiq (Sachai)",
      receivedCashLabel: "Aap Ko Milenge (Net Cash)",
      repayCashLabel: "Wapas Dene Honge",
      tenureLabel: "Wapsi Ki Muddat",
      topWarningsTitle: "Zaroori Baatein Jo Jan-na Lazmi Hain",
      viewFullAuditBtn: "Mukammal Legal & Technical Audit Dekhein (SECP / Evidence ke liye)",
      backToSimpleBtn: "5-Second Simple Verdict Par Wapas Aayein",
      riskScoreTitle: "LoanShield Risk Assessment",
      riskScoreSubtitle: "Transparency aur legal compliance par mabni 0 se 100 ka risk score.",
      tabOverview: "Audit Overview",
      tabPromiseVsReality: "Dawa vs Haqeeqat",
      tabFinancials: "Cash Breakdown & APR",
      tabClauses: "Clauses & SECP Rules",
      tabPrivacy: "Privacy & Permissions",
      tabChecklist: "Borrower Checklist",
      netCashReceived: "Asil Mily Huay Paisay",
      sanctionedAmount: "Sanctioned Principal",
      upfrontDeductions: "Upfront Deductions",
      totalRepayment: "Kul Wapsi Ki Raqam",
      effectiveAPR: "Asil Saalana Sood (APR)",
      tenureDays: "Repayment Muddat",
      secpViolationsTitle: "SECP Ki Violations Jo Pakri Gayi",
      noViolationsFound: "Is contract mein koi direct SECP violation nahi mili.",
      simulatorTitle: "Late Payment Penalty Simulator",
      simulatorSubtitle: "Dekhein ke delay hone par daily penalty aap ke total debt ko kitna barha deti hai.",
      simulateDelayDays: "Delay Ke Din Select Karein",
      advisorDrawerTitle: "LoanShield Consumer Protection Advisor",
      advisorPlaceholder: "Is loan ya apne legal rights ke mutalliq sawal poochein...",
      advisorSendBtn: "Bhejein"
    },
    dashboard: {
      title: "Loan Audit History",
      subtitle: "Apne purane tamam audited contracts aur risk reports dekhein.",
      searchPlaceholder: "Lender ka naam ya date search karein...",
      noHistoryTitle: "Abhi Koi Audit Record Nahi Hai",
      noHistorySubtitle: "Apne financial protection ke liye pehla loan audit start karein.",
      startNewAudit: "Naya Loan Audit Karein",
      viewReport: "Mukammal Report Dekhein",
      riskBadge: "Risk Level",
      date: "Date",
      lender: "Lender Name",
      principal: "Principal",
      riskScore: "Risk Score"
    },
    footer: {
      disclaimer: "LoanShield AI aik azaad consumer protection platform hai aur khud loan provide nahi karta.",
      secpAdvisory: "SECP NBFC aur State Bank ke rules ke tehat banaya gaya hai.",
      rightsReserved: "Tamam huqooq mehfooz hain.",
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service"
    }
  }
};
