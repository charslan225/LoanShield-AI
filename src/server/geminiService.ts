import { GoogleGenAI } from '@google/genai';
import {
  AnalysisResult,
  ContractClause,
  DiscrepancyItem,
  FactorScore,
  LoanCharge,
  PermissionRisk,
  PermissionType,
  RiskLevel
} from '../types';
import { calculateFinancials, calculateRiskAssessment, formatPKR, getDefaultPermissionCatalog } from '../utils/calculations';

let cachedKey: string | null = null;
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  if (!geminiClient || cachedKey !== apiKey) {
    try {
      geminiClient = new GoogleGenAI({
        apiKey,
      });
      cachedKey = apiKey;
    } catch (err) {
      console.warn('Failed to initialize GoogleGenAI client:', err);
      return null;
    }
  }
  return geminiClient;
}

export interface AnalysisInputParams {
  method?: 'AGREEMENT_UPLOAD' | 'ADVERTISEMENT_UPLOAD' | 'MANUAL_ENTRY';
  lenderName?: string;
  appName?: string;
  advertisedAmount?: number | string;
  advertisedDuration?: string;
  advertisedMarkupRate?: string;
  expectedRepayment?: number | string;
  requestedPermissions?: string[];
  fileBase64?: string;
  fileMimeType?: string;
  fileName?: string;
  rawText?: string;
  // Manual params
  manualPrincipal?: number | string;
  manualDurationDays?: number | string;
  manualMarkupRateAnnual?: number | string;
  manualUpfrontDeductions?: number | string;
  manualChargesDescription?: string;
}

function safeFloat(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
}

function safeInt(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  const num = parseInt(val, 10);
  return isNaN(num) ? null : num;
}

function calculateApr(
  principal: number | null,
  netDisbursed: number | null,
  totalRepayment: number | null,
  tenureDays: number | null
): number | null {
  if (principal === null || netDisbursed === null || totalRepayment === null || tenureDays === null) {
    return null;
  }
  if (netDisbursed <= 0 || tenureDays <= 0) {
    return null;
  }
  const totalCost = totalRepayment - netDisbursed;
  if (totalCost <= 0) {
    return 0;
  }
  const periodRate = totalCost / netDisbursed;
  const annualPeriods = 365.0 / tenureDays;
  const apr = periodRate * annualPeriods * 100.0;
  return Math.round(apr * 100) / 100;
}

export async function analyzeLoanDocument(params: AnalysisInputParams): Promise<AnalysisResult> {
  const rawText = (params.rawText || '').trim();
  const fileBase64 = params.fileBase64;
  const fileMimeType = params.fileMimeType;
  let lenderName = params.lenderName || 'Digital Lending Entity';
  let appName = params.appName || 'Mobile Loan App';
  const advertisedAmount = safeFloat(params.advertisedAmount);
  const advertisedDuration = params.advertisedDuration || 'Not specified';
  const advertisedRate = params.advertisedMarkupRate || 'Not specified';
  const expectedRepayment = safeFloat(params.expectedRepayment);
  let requestedPerms = params.requestedPermissions || [];

  const manualPrincipal = safeFloat(params.manualPrincipal);
  const manualDuration = safeInt(params.manualDurationDays);
  const manualMarkupAnnual = safeFloat(params.manualMarkupRateAnnual);
  const manualUpfront = safeFloat(params.manualUpfrontDeductions);

  let aiData: Record<string, any> | null = null;
  const ai = getGeminiClient();

  if (ai && (rawText || fileBase64 || manualPrincipal)) {
    try {
      const extractionPrompt = `You are LoanShield AI, an expert loan document analyst in Pakistan.
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

Input Context:
Advertised Amount: ${advertisedAmount}
Advertised Duration: ${advertisedDuration}
Text:
${rawText}

Return strictly a JSON object with these keys.`;

      const contentsParts: any[] = [];
      if (fileBase64 && fileMimeType) {
        contentsParts.push({
          inlineData: {
            mimeType: fileMimeType,
            data: fileBase64,
          },
        });
      }
      contentsParts.push({ text: extractionPrompt });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contentsParts,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text?.trim();
      if (responseText) {
        aiData = JSON.parse(responseText);
      }
    } catch {
      // Proceed gracefully with deterministic extraction rules if AI extraction is unavailable
    }
  }

  const textLower = rawText.toLowerCase();
  let principal: number | null = manualPrincipal !== null ? manualPrincipal : null;
  let durationDays: number | null = manualDuration !== null ? manualDuration : null;
  let upfrontDeductions: number | null = manualUpfront !== null ? manualUpfront : 0;
  let totalRepayment: number | null = expectedRepayment !== null ? expectedRepayment : null;
  const chargesList: LoanCharge[] = [];

  let isDisbursementDeferred =
    textLower.includes('to be determined after approval') ||
    (textLower.includes('disbursed to borrower') && textLower.includes('after approval'));

  let isRepaymentDeferred =
    isDisbursementDeferred ||
    textLower.includes('repayment schedule provided after') ||
    textLower.includes('schedule provided after disbursement') ||
    (textLower.includes('repayment schedule') && textLower.includes('after disbursement'));

  if (aiData) {
    if (aiData.lenderName && lenderName === 'Digital Lending Entity') {
      lenderName = aiData.lenderName;
    }
    if (aiData.appName && appName === 'Mobile Loan App') {
      appName = aiData.appName;
    }
    if (aiData.sensitive_permissions && requestedPerms.length === 0) {
      requestedPerms = aiData.sensitive_permissions.map((p: string) => p.toUpperCase());
    }
    if (aiData.is_deferred_disbursement) {
      isDisbursementDeferred = true;
      isRepaymentDeferred = true;
    }
  }

  // Fallback regex parsing if figures not provided manually
  if (principal === null) {
    const pMatch = textLower.match(/(?:approved|loan|sanction|limit|amount|borrow|principal|rs\.?|pkr)\s*[:=-]?\s*(?:pkr|rs\.?)?\s*([\d,]{4,})/);
    if (pMatch) {
      principal = parseFloat(pMatch[1].replace(/,/g, ''));
    }
  }

  if (durationDays === null) {
    const tMatch = textLower.match(/(?:tenure|duration|term|din|days)\s*[:=-]?\s*(\d+)\s*(?:days?|din)?/);
    if (tMatch) {
      durationDays = parseInt(tMatch[1], 10);
    } else if (textLower.includes('7 days') || textLower.includes('7 din') || textLower.includes('7-day')) {
      durationDays = 7;
    } else if (textLower.includes('14 days') || textLower.includes('14 din') || textLower.includes('14-day')) {
      durationDays = 14;
    } else if (textLower.includes('90 days') || textLower.includes('3 months')) {
      durationDays = 90;
    } else if (textLower.includes('180 days') || textLower.includes('6 months')) {
      durationDays = 180;
    }
  }

  if ((upfrontDeductions === null || upfrontDeductions <= 0) && manualUpfront === null) {
    const feeMatch = textLower.match(/(?:total deductions?|processing fee|service charge|deductions?|platform fee|katauti|cut)\s*[:=-]?\s*(?:pkr|rs\.?)?\s*([\d,]{3,})/);
    if (feeMatch) {
      upfrontDeductions = parseFloat(feeMatch[1].replace(/,/g, ''));
    } else {
      upfrontDeductions = 0;
    }

    // Extract itemized fees under Upfront Charges Deducted if present
    const feeItemMatches = (rawText || '').matchAll(/[-•*]?\s*([A-Za-z\s]+(?:Fee|Charge|Surcharge|Commission|Deduction))\s*[:=-]\s*(?:pkr|rs\.?)?\s*([\d,]+)/gi);
    let itemizedSum = 0;
    for (const match of feeItemMatches) {
      const name = match[1].trim();
      const val = parseFloat(match[2].replace(/,/g, ''));
      if (val > 0) {
        itemizedSum += val;
        chargesList.push({
          id: `ch-${chargesList.length + 1}`,
          name,
          amount: val,
          percentage: principal && principal > 0 ? Math.round((val / principal) * 10000) / 100 : undefined,
          isDeductedFromDisbursement: true,
          description: 'Deducted upfront from loan amount.',
          isClearlyDisclosed: true,
          type: 'UPFRONT_DEDUCTION',
        });
      }
    }
    if (itemizedSum > 0 && (!upfrontDeductions || upfrontDeductions <= 0)) {
      upfrontDeductions = itemizedSum;
    }
  }

  let deductionStatus: 'NO_DEDUCTIONS_MENTIONED' | 'DEDUCTIONS_CONFIRMED' | 'POTENTIAL_DEDUCTIONS_UNCLEAR' = 'NO_DEDUCTIONS_MENTIONED';
  let deductionStatusText = 'No upfront fee deductions declared.';
  let actualDisbursed = principal;
  let isDisbursementConfirmed = principal !== null;

  if (isDisbursementDeferred) {
    isDisbursementConfirmed = false;
    actualDisbursed = null;
    deductionStatus = 'POTENTIAL_DEDUCTIONS_UNCLEAR';
    deductionStatusText = 'Potential deductions are mentioned, but the exact amounts are not clearly specified.';
  } else {
    // Check if document mentions net disbursed amount
    const netMatch = textLower.match(/(?:net disbursed|net disbursement|disbursed net|amount disbursed|cash in hand|credited to borrower|disbursed)\s*(?:net)?\s*(?:to bank account|to borrower|to account)?\s*[:=-]?\s*(?:pkr|rs\.?)?\s*([\d,]+)/);
    if (netMatch) {
      const netVal = parseFloat(netMatch[1].replace(/,/g, ''));
      if (principal !== null && netVal < principal) {
        if (!upfrontDeductions || upfrontDeductions <= 0) {
          upfrontDeductions = principal - netVal;
        }
        actualDisbursed = netVal;
        deductionStatus = 'DEDUCTIONS_CONFIRMED';
        deductionStatusText = `PKR ${upfrontDeductions.toLocaleString()} deducted upfront.`;
      } else if (netVal > 0) {
        actualDisbursed = netVal;
      }
    } else if (upfrontDeductions && upfrontDeductions > 0 && principal !== null) {
      actualDisbursed = Math.max(0, principal - upfrontDeductions);
      deductionStatus = 'DEDUCTIONS_CONFIRMED';
      deductionStatusText = `PKR ${upfrontDeductions.toLocaleString()} deducted upfront.`;
    } else if (principal === null) {
      actualDisbursed = null;
      isDisbursementConfirmed = false;
    }
  }

  if (upfrontDeductions && upfrontDeductions > 0 && principal !== null && principal > 0) {
    chargesList.push({
      id: 'ch-upfront-1',
      name: 'Upfront Processing & Service Deduction',
      amount: upfrontDeductions,
      percentage: Math.round((upfrontDeductions / principal) * 10000) / 100,
      isDeductedFromDisbursement: true,
      description: 'Deducted directly from sanctioned loan before transfer.',
      isClearlyDisclosed: true,
      type: 'UPFRONT_DEDUCTION',
    });
  }

  let numberOfInstallments = 1;
  if (isRepaymentDeferred) {
    totalRepayment = null;
    durationDays = null;
  } else if (totalRepayment === null) {
    const repMatch = textLower.match(/(?:total repayment|repayment amount|total payable|payable amount|repay a total of|total obligation|repayment sum|wapis)\s*[:=-]?\s*(?:of)?\s*(?:pkr|rs\.?)?\s*([\d,]+)/);
    if (repMatch) {
      totalRepayment = parseFloat(repMatch[1].replace(/,/g, ''));
    } else {
      const instMatch = textLower.match(/(\d+)\s*(?:equal\s+)?(?:monthly\s+)?installments?\s+of\s*(?:pkr|rs\.?)?\s*([\d,]+)/);
      if (instMatch) {
        numberOfInstallments = parseInt(instMatch[1], 10);
        const instAmt = parseFloat(instMatch[2].replace(/,/g, ''));
        totalRepayment = numberOfInstallments * instAmt;
      } else if (manualMarkupAnnual && principal !== null && durationDays !== null) {
        const markupAmount = principal * (manualMarkupAnnual / 100.0) * (durationDays / 365.0);
        totalRepayment = principal + markupAmount;
      }
    }
  }

  const isRepaymentConfirmed = totalRepayment !== null;
  const apr = calculateApr(principal, actualDisbursed, totalRepayment, durationDays);

  const hasContactViolation = requestedPerms.some((p) => {
    const u = p.toUpperCase();
    return u.includes('CONTACT') || u.includes('PHONEBOOK');
  });

  const secpViolations: Array<{ code: string; title: string; severity: string; description: string; actionRequired: string }> = [];
  if (hasContactViolation) {
    secpViolations.push({
      code: 'SECP-CIRC-15-CONTACTS',
      title: 'Illegal Contact List & Phonebook Harvest',
      severity: 'CRITICAL',
      description: 'SECP Circular No. 15 of 2023 prohibits digital lending platforms from accessing borrower contact lists.',
      actionRequired: 'Immediately revoke phonebook permissions and file a complaint via SECP ServiceDesk.',
    });
  }
  if (principal !== null && upfrontDeductions !== null && upfrontDeductions > principal * 0.15) {
    secpViolations.push({
      code: 'SECP-CIRC-10-FEES',
      title: 'Excessive Upfront Processing Deductions',
      severity: 'CRITICAL',
      description: 'Deducting excessive processing or service charges upfront before cash disbursement violates SECP pricing transparency rules.',
      actionRequired: 'Verify that all charges are explicitly reflected in a standardized Key Fact Statement (KFS).',
    });
  }
  if (durationDays !== null && durationDays < 30) {
    secpViolations.push({
      code: 'SECP-CIRC-10-TENURE',
      title: 'Sub-30-Day Predatory Tenure',
      severity: 'HIGH',
      description: 'Digital nano-loans with ultra-short repayment windows (e.g. 7 or 14 days) subject borrowers to debt-trap roll-over cycles.',
      actionRequired: 'Opt for regulated microfinance providers offering standard installment horizons (>= 30 days).',
    });
  }

  // Permissions Catalog
  const permissionTypes: PermissionType[] = [
    'CONTACTS',
    'CAMERA',
    'LOCATION',
    'STORAGE_GALLERY',
    'SMS',
    'PHONE_STATE',
    'CALL_LOGS',
    'MICROPHONE',
  ];
  const activePermTypes: PermissionType[] = [];
  for (const pt of permissionTypes) {
    if (requestedPerms.some((p) => p.toUpperCase().includes(pt))) {
      activePermTypes.push(pt);
    }
  }
  const permsCatalog = getDefaultPermissionCatalog(activePermTypes);

  // Clauses Catalog
  const upfrontRatio = principal && principal > 0 && upfrontDeductions ? (upfrontDeductions / principal) * 100 : 0;
  const clause1Risk = upfrontRatio >= 20 ? 'RED' : (upfrontRatio >= 5 ? 'YELLOW' : 'GREEN');
  const clause2Risk = durationDays !== null && durationDays < 30 ? 'RED' : (durationDays === null ? 'YELLOW' : 'GREEN');
  const hasDailyPenalty = textLower.includes('daily default') || textLower.includes('per calendar day') || textLower.includes('compound') || textLower.includes('1.5% per day') || textLower.includes('2.5% per day');
  const clause3Risk = hasDailyPenalty ? 'RED' : (textLower.includes('grace period') || textLower.includes('flat fee') || textLower.includes('flat pkr') || textLower.includes('fixed pkr') ? 'GREEN' : 'YELLOW');

  const clauses: ContractClause[] = [
    {
      id: 'clause-1',
      clauseTitle: 'Disbursement & Upfront Deductions',
      originalText: deductionStatusText,
      category: 'INTEREST_AND_FEES',
      simpleExplanation: {
        en: upfrontDeductions && upfrontDeductions > 0 && principal !== null ? `Upfront deduction of PKR ${upfrontDeductions.toLocaleString()} from the sanctioned principal.` : 'No excessive upfront cuts detected.',
        ur: upfrontDeductions && upfrontDeductions > 0 && principal !== null ? `منظور شدہ رقم میں سے PKR ${upfrontDeductions.toLocaleString()} پیشگی فیس کاٹ لی جائے گی۔` : 'کوئی غیر معمولی پیشگی کٹوتی نہیں پائی گئی۔',
        roman_ur: upfrontDeductions && upfrontDeductions > 0 && principal !== null ? `Manzoor shuda raqam mein se PKR ${upfrontDeductions.toLocaleString()} peshgi fees kaat li jaye gi.` : 'Koi ghair mamooli peshgi katouti nahi payi gayi.',
      },
      whyItMatters: {
        en: 'Reduces actual cash received while liability remains on the full principal.',
        ur: 'ہاتھ میں ملنے والی رقم کم ہو جاتی ہے لیکن واپسی پورے قرض پر کرنا ہوتی ہے۔',
        roman_ur: upfrontDeductions && upfrontDeductions > 0 && principal !== null ? 'Manzoor shuda raqam mein se peshgi fees kaat li jaye gi.' : 'Koi ghair mamooli peshgi katouti nahi payi gayi.',
      },
      riskFlag: clause1Risk,
    },
    {
      id: 'clause-2',
      clauseTitle: 'Repayment Horizon & Due Date',
      originalText: totalRepayment !== null && durationDays !== null ? `Total repayment of PKR ${totalRepayment.toLocaleString()} due strictly within ${durationDays} days.` : 'Repayment amount and due date are not specified before approval.',
      category: 'DEFAULT_AND_LEGAL',
      simpleExplanation: {
        en: durationDays !== null ? `Loan must be fully cleared in ${durationDays} days.` : 'Loan tenure is not specified in the submitted document.',
        ur: durationDays !== null ? `قرضے کی مکمل واپسی ${durationDays} دن کے اندر کرنا ہوگی۔` : 'قرضے کی مدت دستاویز میں درج نہیں۔',
        roman_ur: durationDays !== null ? `Qarzay ki mukammal wapsi ${durationDays} din ke andar karna hogi.` : 'Qarzay ki muddat dastaweez mein darj nahi.',
      },
      whyItMatters: {
        en: 'Short durations (7-14 days) lead to severe rollover debt-traps.',
        ur: 'کم مدت (7 تا 14 دن) ادھار واپس نہ کر سکنے کی صورت میں شدید سود کا باعث بنتی ہے۔',
        roman_ur: 'Kam muddat (7 se 14 din) qarz wapas na hone par mazeed jurmana lagati hai.',
      },
      riskFlag: clause2Risk,
    },
    {
      id: 'clause-3',
      clauseTitle: 'Late Payment Penalties & Default Charges',
      originalText: hasDailyPenalty
        ? 'A daily compound default penalty accrues immediately upon overdue balance.'
        : 'Late payments incur flat capped charges after a defined grace period.',
      category: 'PENALTIES',
      simpleExplanation: {
        en: hasDailyPenalty ? 'Daily default penalties will accrue automatically upon missing the scheduled due date.' : 'Standard flat late fee with grace period applied if repayment is delayed.',
        ur: hasDailyPenalty ? 'مقررہ تاریخ پر رقم واپس نہ کرنے کی صورت میں روزانہ جرمانہ عائد ہوگا۔' : 'معیاری فلیٹ لیٹ فیس رعایت کی مدت کے بعد لاگو ہوگی۔',
        roman_ur: hasDailyPenalty ? 'Muqarrara tareekh par raqam wapas na karne par rozana jurmana aaid hoga.' : 'Meyari flat late fee grace period ke baad aaid hogi.',
      },
      whyItMatters: {
        en: hasDailyPenalty ? 'Daily penalty compounding can rapidly escalate outstanding debt.' : 'Disclosed flat charges provide predictability.',
        ur: hasDailyPenalty ? 'روزانہ جرمانہ لگنے سے قرضہ چند ہفتوں میں دگنا ہو سکتا ہے۔' : 'واضح فلیٹ فیس سے اخراجات کا اندازہ رہتا ہے۔',
        roman_ur: hasDailyPenalty ? 'Rozana jurmana lagne se qarz tezi se barh sakta hai.' : 'Wazeh flat fees se ikhrajat ka andaza rehta hai.',
      },
      riskFlag: clause3Risk,
    },
  ];

  const hasNegativeRecovery = textLower.includes('no phonebook') ||
    textLower.includes('no access to the borrower') ||
    textLower.includes('no access to personal contacts') ||
    textLower.includes('no access to contacts') ||
    textLower.includes('no contact access') ||
    textLower.includes('no contacts') ||
    textLower.includes('institutional bank notices only') ||
    textLower.includes('institutional recovery only') ||
    textLower.includes('institutional notices only');

  const hasAggressiveRecovery = !hasNegativeRecovery && (
    textLower.includes('emergency contact') ||
    textLower.includes('family references') ||
    textLower.includes('social references') ||
    textLower.includes('access contacts') ||
    textLower.includes('reach out to personal contacts') ||
    textLower.includes('contact book') ||
    (textLower.includes('phonebook') && !textLower.includes('no phonebook'))
  );

  if (hasAggressiveRecovery) {
    clauses.push({
      id: 'clause-4',
      clauseTitle: 'Collection & Third-Party Reach',
      originalText: 'Borrower authorizes lender to reach out to personal contacts, family, or references.',
      category: 'RECOVERY',
      simpleExplanation: {
        en: 'Lender reserves right to contact your family, friends, or employer for recovery.',
        ur: 'قرض دہندہ وصولی کے لیے آپ کے خاندان اور دوستوں سے رابطہ کر سکتا ہے۔',
        roman_ur: 'Qarz dahinda wasooli ke liye aap ke khandaan aur doston se rabta kar sakta hai.',
      },
      whyItMatters: {
        en: 'Harassment and contact shaming violate SECP digital lending regulations.',
        ur: 'خاندان سے رابطہ کرنا اور ہراساں کرنا ایس ای سی پی قوانین کی خلاف ورزی ہے۔',
        roman_ur: 'Khandan se rabta karna SECP qawaneen ki khilaf warzi hai.',
      },
      riskFlag: 'RED',
    });
  } else if (hasNegativeRecovery || textLower.includes('institutional')) {
    clauses.push({
      id: 'clause-4',
      clauseTitle: 'Institutional Recovery & Consumer Protection',
      originalText: 'Standard institutional recovery notices only. No access to personal contacts or phonebook.',
      category: 'RECOVERY',
      simpleExplanation: {
        en: 'Lender adheres to SECP fair debt collection guidelines with institutional bank notices only.',
        ur: 'قرض دہندہ وصولی کے لیے صرف باقاعدہ نوٹس بھیجنے کا مجاز ہے، نجی رابطوں تک رسائی ممنوع ہے۔',
        roman_ur: 'Qarz dahinda wasooli ke liye sirf baqaida notice bhej sakta hai, niji rabton tak rasai mamnoo hai.',
      },
      whyItMatters: {
        en: 'Protects borrower from harassment and unauthorized third-party contact.',
        ur: 'صارف کو ہراساں کیے جانے اور دوست احباب سے رابطے سے محفوظ رکھتا ہے۔',
        roman_ur: 'Sarif ko harasan kiye jane se mehfooz rakhta hai.',
      },
      riskFlag: 'GREEN',
    });
  }

  // Discrepancies
  const discrepancies: DiscrepancyItem[] = [];
  if ((upfrontDeductions || 0) > 0 || !isDisbursementConfirmed || principal === null) {
    const isCritical = upfrontRatio >= 20;
    const isWarning = upfrontRatio >= 10;
    discrepancies.push({
      id: 'disc-1',
      category: 'FEES_AND_CHARGES',
      riskType: deductionStatus === 'POTENTIAL_DEDUCTIONS_UNCLEAR' || principal === null ? 'INFORMATION_GAP' : 'KNOWN_RISK',
      promised: principal !== null ? `Disbursed: PKR ${principal.toLocaleString()}` : 'Disbursed amount not specified',
      actual: actualDisbursed !== null ? `Received: PKR ${actualDisbursed.toLocaleString()}` : 'Amount unconfirmed before approval',
      severity: isCritical ? 'CRITICAL' : isWarning ? 'WARNING' : 'INFO',
      explanation: (upfrontDeductions || 0) > 0 ? `Upfront deduction of PKR ${(upfrontDeductions || 0).toLocaleString()} (${Math.round(upfrontRatio)}%) reduces actual in-hand cash.` : 'Exact disbursement amount and deductions are not disclosed before approval.',
      isNumericalVariance: (upfrontDeductions || 0) > 0 && principal !== null && actualDisbursed !== null,
      varianceAmount: (upfrontDeductions || 0) > 0 ? upfrontDeductions : null,
      variancePercentage: (upfrontDeductions || 0) > 0 && principal !== null ? Math.round(upfrontRatio * 10) / 10 : null,
      evidence: deductionStatusText,
      interpretation: (upfrontDeductions || 0) > 0 ? 'Borrower pays interest on full principal despite receiving lower net amount.' : 'Borrower cannot verify the true cost of the loan before accepting.',
    });
  }

  const missingEssentialTerms = [
    principal,
    actualDisbursed,
    totalRepayment,
    durationDays,
    apr,
  ];
  const missingCount = missingEssentialTerms.filter((v) => v === null).length;
  const hasMajorInformationGap = missingCount >= 2 || deductionStatus === 'POTENTIAL_DEDUCTIONS_UNCLEAR' || !isDisbursementConfirmed;

  const financialBreakdown = calculateFinancials({
    advertisedAmount,
    principalAmount: principal || 0,
    durationDays: durationDays || 30,
    markupRateAnnual: manualMarkupAnnual || (apr !== null && apr < 100 ? apr : null),
    totalRepaymentAmount: totalRepayment,
    numberOfInstallments,
    charges: chargesList,
    rawText,
    isDisbursementDeferred,
    isRepaymentDeferred,
  });

  const riskAssessment = calculateRiskAssessment({
    financials: financialBreakdown,
    charges: chargesList,
    clauses,
    permissions: permsCatalog,
    discrepancies,
    missingKeyTerms: hasMajorInformationGap,
    devicePermissionsSpecified: requestedPerms.length > 0,
  });

  // Executive Summary
  const actualDisbursedText = actualDisbursed !== null ? `You will receive PKR ${actualDisbursed.toLocaleString()} net after deductions.` : 'The actual amount received cannot be confirmed from the submitted document before approval.';
  const totalRepayText = totalRepayment !== null && durationDays !== null ? `You will be required to repay a total of PKR ${totalRepayment.toLocaleString()} over ${durationDays} days.` : 'The total repayment amount and tenure cannot be confirmed from the submitted document.';

  const executiveSummary = {
    actualAmountReceivedText: actualDisbursedText,
    totalRepaymentText: totalRepayText,
    chargesIdentifiedSummary: deductionStatusText,
    latePaymentImpactSummary: hasDailyPenalty
      ? 'Daily compounding penalty of 1.5% - 2.5% per day will rapidly increase outstanding debt.'
      : 'Late payments incur flat capped charges after a defined grace period.',
    criticalClausesSummary: 'Please review the default, tenure, and collection clauses carefully before agreeing.',
    promiseDiscrepancySummary: `Identified ${secpViolations.length} regulatory alerts and upfront deduction evaluations.`,
    privacyConcernsSummary: hasContactViolation
      ? 'Sensitive device permissions detected (Contacts access illegal under SECP).'
      : (activePermTypes.length > 0 ? `Standard KYC permissions requested: ${activePermTypes.join(', ')}.` : 'Low privacy exposure: No invasive permissions requested.'),
    verificationAdvice: [
      'Verify that the loan provider is officially licensed with the SECP.',
      'Confirm the exact net amount deposited into your wallet before accepting.',
      'Never grant contact book or photo gallery access on your device.',
    ],
  };

  const verificationChecklist = [
    {
      id: 'ver-1',
      title: 'Check SECP NBFC Digital Lending List',
      description: 'Ensure the company is registered under the SECP list of authorized digital lending Non-Banking Finance Companies.',
      isCritical: true,
      verificationTip: 'Search company title on secp.gov.pk under registered digital lending apps.',
    },
    {
      id: 'ver-2',
      title: 'Confirm Net Cash vs Repayment Amount',
      description: `Verify that receiving ${actualDisbursed !== null ? `PKR ${actualDisbursed.toLocaleString()}` : 'the cash in hand'} is worth repaying ${totalRepayment !== null ? `PKR ${totalRepayment.toLocaleString()}` : 'the unspecified repayment amount'}.`,
      isCritical: true,
      verificationTip: totalRepayment !== null && (actualDisbursed !== null || principal !== null) ? `Total cost of this loan is PKR ${(totalRepayment - (actualDisbursed || principal || 0)).toLocaleString()}.` : 'Total cost cannot be calculated because repayment or disbursement is not specified.',
    },
    {
      id: 'ver-3',
      title: 'Deny Non-Essential Device Permissions',
      description: 'Refuse Contacts and Gallery permissions when prompted on your Android or iOS device.',
      isCritical: hasContactViolation,
      verificationTip: 'Regulated Pakistani fintechs do not require phonebook access for credit approval.',
    },
  ];

  const analysisId = `analysis-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

  return {
    id: analysisId,
    createdAt: new Date().toISOString(),
    lenderName,
    appName,
    analysisMethod: params.method || 'AGREEMENT_UPLOAD',
    isDemo: false,
    devicePermissionsSpecified: requestedPerms.length > 0,
    riskAssessment,
    financialBreakdown,
    advertisedPromise: {
      advertisedAmount,
      advertisedMarkupRate: advertisedRate,
      advertisedDuration: advertisedDuration,
      advertisedDisbursedAmount: advertisedAmount,
      marketingClaims: [
        'Instant Loan Approval',
        'Low Markup Rate',
        'Quick Disbursal',
      ],
      advertisedRepaymentAmount: expectedRepayment,
    },
    contractReality: {
      documentedPrincipal: principal,
      documentedDisbursement: actualDisbursed,
      isDisbursementConfirmed,
      documentedDurationDays: durationDays,
      documentedMarkupRateAnnual: apr,
      totalUpfrontDeductions: deductionStatus === 'DEDUCTIONS_CONFIRMED' ? upfrontDeductions : null,
      deductionStatus,
      totalRecurringFees: 0,
      documentedRepaymentAmount: totalRepayment,
      isRepaymentConfirmed,
      latePenaltyRatePerDay: hasDailyPenalty ? 1.5 : null,
      isSecpRegisteredClaimed: !hasContactViolation,
    },
    discrepancies,
    permissions: permsCatalog,
    clauses,
    executiveSummary,
    verificationChecklist,
    extractedRawTextSample: rawText ? rawText.substring(0, 500) : undefined,
  };
}

export async function answerAdvisorQuestion(analysis: any, question: string): Promise<string> {
  const ai = getGeminiClient();
  if (ai) {
    try {
      const prompt = `You are LoanShield AI's Senior Consumer Lending & Legal Advisor in Pakistan.
Context of analyzed loan:
- Lender: ${analysis.lenderName || 'Unknown'}
- Principal: PKR ${(analysis.financialBreakdown?.principalAmount || 0).toLocaleString()}
- Effective APR: ${analysis.financialBreakdown?.effectiveAnnualPercentageRate ?? 'Unspecified'}%
- Risk Score: ${analysis.riskAssessment?.overallScore || 0}/100 (${analysis.riskAssessment?.riskLevel || 'UNKNOWN'})
- SECP Regulatory Violations: ${JSON.stringify(analysis.secpViolations || [])}

User Question: ${question}

Provide an objective, protective, and actionable answer citing Pakistani lending protections (SECP / SBP) in clear language. Keep response under 3 paragraphs.`;

      const res = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      if (res.text) {
        return res.text;
      }
    } catch {
      // Proceed gracefully with deterministic advisor response if AI service is unavailable
    }
  }

  // Deterministic fallback response
  const qLower = question.toLowerCase();
  if (qLower.includes('safe') || qLower.includes('scam') || qLower.includes('risk')) {
    const score = analysis.riskAssessment?.overallScore || 0;
    return `Based on our automated risk analysis, this loan received an overall risk score of ${score}/100. Always check if the lender holds an active digital lending NBFC license from SECP (secp.gov.pk) and never grant phonebook contacts permissions.`;
  } else if (qLower.includes('apr') || qLower.includes('interest') || qLower.includes('markup')) {
    const apr = analysis.financialBreakdown?.effectiveAnnualPercentageRate;
    return `The calculated effective Annual Percentage Rate (APR) for this agreement is ${apr !== null && apr !== undefined ? `${apr}%` : 'unspecified due to missing disbursement terms'}. Regulated standard microfinance rates in Pakistan generally range between 20%–45% annualized.`;
  } else {
    return `Regarding your inquiry: ensure you carefully verify any upfront deductions and demand a standardized SECP Key Fact Statement (KFS) prior to consenting to any digital disbursement.`;
  }
}
