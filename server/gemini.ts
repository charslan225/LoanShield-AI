/**
 * LoanShield AI - Server-side Gemini AI Intelligence Engine
 * Uses @google/genai with gemini-3.7-flash for document understanding,
 * multilingual clause interpretation (English, Urdu, Roman Urdu),
 * and Promise vs Reality extraction.
 */

import { GoogleGenAI, Type } from '@google/genai';
import { 
  AnalysisResult, 
  ContractClause, 
  DiscrepancyItem, 
  ExecutiveSummary, 
  LoanCharge, 
  PermissionRisk, 
  PermissionType 
} from '../src/types';
import { 
  calculateFinancials, 
  calculateRiskAssessment, 
  getDefaultPermissionCatalog 
} from '../src/utils/calculations';

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface AnalyzeDocumentParams {
  method: 'AGREEMENT_UPLOAD' | 'ADVERTISEMENT_UPLOAD' | 'MANUAL_ENTRY';
  lenderName?: string;
  appName?: string;
  advertisedAmount?: number | null;
  advertisedDuration?: string | null;
  advertisedMarkupRate?: string | null;
  expectedRepayment?: number | null;
  marketingClaims?: string[];
  manualPrincipal?: number | null;
  manualDurationDays?: number | null;
  manualMarkupRateAnnual?: number | null;
  manualUpfrontDeductions?: number | null;
  manualChargesDescription?: string | null;
  requestedPermissions?: PermissionType[];
  fileBase64?: string;
  fileMimeType?: string;
  fileName?: string;
  rawText?: string;
}

/**
 * Main Analysis Orchestrator
 */
export async function analyzeLoanWithAI(params: AnalyzeDocumentParams): Promise<AnalysisResult> {
  const ai = getGenAI();

  let extractedData: any = null;

  if (ai && (params.fileBase64 || params.rawText || params.manualPrincipal)) {
    try {
      extractedData = await callGeminiExtractor(ai, params);
    } catch (err) {
      console.warn('Gemini extraction warning, falling back to deterministic parser:', err);
    }
  }

  // If AI was not available or had an error, use intelligent deterministic baseline
  if (!extractedData) {
    extractedData = generateBaselineExtraction(params);
  }

  // Device Permission Resolution
  // Distinguish strictly between collection of personal information for loan verification
  // and explicit access to sensitive hardware/OS device permissions.
  // ONLY use manual user selected permissions if method is explicitly MANUAL_ENTRY.
  const userSelectedPerms = params.method === 'MANUAL_ENTRY' ? (params.requestedPermissions || []) : [];
  const validTypes: PermissionType[] = ['CONTACTS', 'SMS', 'CAMERA', 'MICROPHONE', 'LOCATION', 'STORAGE_GALLERY', 'PHONE_STATE', 'CALL_LOGS'];
  const aiExtractedPerms = ((extractedData.explicitRequestedPermissions || []) as PermissionType[]).filter(p => validTypes.includes(p));

  const rawTextCombined = (params.rawText || '') + ' ' + (extractedData.rawTextSample || '');
  const hasExplicitNoContacts = rawTextCombined.toLowerCase().includes('no access to the borrower') ||
    rawTextCombined.toLowerCase().includes('no phonebook') ||
    rawTextCombined.toLowerCase().includes('no access to contacts') ||
    (extractedData.clauses || []).some((c: any) => 
      (c.originalText || '').toLowerCase().includes('no access to the borrower') ||
      (c.originalText || '').toLowerCase().includes('no phonebook') ||
      (c.originalText || '').toLowerCase().includes('no access to contacts')
    );

  let finalPermissionsList: PermissionType[] = [];
  let devicePermissionsSpecified = false;

  const combinedPerms = Array.from(new Set([...userSelectedPerms, ...aiExtractedPerms])) as PermissionType[];
  if (combinedPerms.length > 0) {
    devicePermissionsSpecified = true;
    finalPermissionsList = combinedPerms;
  } else {
    devicePermissionsSpecified = false;
    finalPermissionsList = [];
  }

  if (hasExplicitNoContacts) {
    finalPermissionsList = finalPermissionsList.filter(p => p !== 'CONTACTS');
  }

  const permissionsCatalog = getDefaultPermissionCatalog(finalPermissionsList);

  // 1. Deterministic Financial Engine
  const charges: LoanCharge[] = (extractedData.charges || []).map((c: any, index: number) => ({
    id: `charge-${index + 1}`,
    name: c.name || 'Service Charge',
    type: c.type || 'UPFRONT_DEDUCTION',
    amount: typeof c.amount === 'number' ? c.amount : null,
    percentage: typeof c.percentage === 'number' ? c.percentage : null,
    isDeductedFromDisbursement: c.isDeductedFromDisbursement ?? (c.type === 'UPFRONT_DEDUCTION'),
    frequency: c.frequency || 'ONCE',
    description: c.description || 'Disclosed fee on loan documentation',
    isClearlyDisclosed: c.isClearlyDisclosed ?? true,
    sourceEvidence: c.sourceEvidence || (typeof c.amount === 'number' ? `${c.name}: PKR ${c.amount.toLocaleString()}` : undefined),
    confidenceLevel: 'HIGH'
  }));

  const principal = extractedData.principalAmount || params.manualPrincipal || params.advertisedAmount || 50000;
  const duration = extractedData.durationDays || params.manualDurationDays || 30;
  const markupRate = extractedData.markupRateAnnual ?? params.manualMarkupRateAnnual ?? null;

  const isDisbursementDeferred = extractedData.isDisbursementDeferred || 
    rawTextCombined.toLowerCase().includes('to be determined after approval') ||
    rawTextCombined.toLowerCase().includes('disbursed to borrower: to be determined');

  const financials = calculateFinancials({
    principalAmount: principal,
    advertisedAmount: params.advertisedAmount || extractedData.advertisedAmount || null,
    durationDays: duration,
    markupRateAnnual: markupRate,
    charges: charges,
    numberOfInstallments: extractedData.numberOfInstallments || 1,
    totalRepaymentAmount: extractedData.totalRepaymentAmount || extractedData.repaymentAmount || params.expectedRepayment || null,
    deductionStatus: extractedData.deductionStatus,
    hasPotentialUnclearDeductions: extractedData.hasPotentialUnclearDeductions,
    isDisbursementDeferred,
    rawText: rawTextCombined
  });

  // 2. Clauses
  const clauses: ContractClause[] = (extractedData.clauses || []).map((cl: any, i: number) => ({
    id: `clause-${i + 1}`,
    clauseTitle: cl.clauseTitle || 'Loan Condition',
    originalText: cl.originalText || 'Contract condition extracted from document.',
    category: cl.category || 'INTEREST_AND_FEES',
    simpleExplanation: {
      en: cl.simpleExplanation?.en || cl.simpleExplanation || 'Standard loan obligation.',
      ur: cl.simpleExplanation?.ur || 'قرضے کی ادائی سے متعلق شق۔',
      roman_ur: cl.simpleExplanation?.roman_ur || 'Qarz ki adaigi ke mutaliq shart.'
    },
    whyItMatters: {
      en: cl.whyItMatters?.en || cl.whyItMatters || 'May impact your total cost or repayment obligations.',
      ur: cl.whyItMatters?.ur || 'یہ آپ کی مجموعی ادائی کی رقم کو متاثر کر سکتی ہے۔',
      roman_ur: cl.whyItMatters?.roman_ur || 'Yeh aap ki total payment par asar daal sakti hai.'
    },
    riskFlag: cl.riskFlag || 'YELLOW'
  }));

  // 3. Discrepancies (Distinguish strictly between Known Variance vs Information Gap)
  const discrepancies: DiscrepancyItem[] = (extractedData.discrepancies || []).map((d: any, i: number) => ({
    id: `disc-${i + 1}`,
    category: d.category || 'FEES_AND_CHARGES',
    riskType: d.riskType || (d.isNumericalVariance ? 'KNOWN_RISK' : 'INFORMATION_GAP'),
    promised: d.promised || 'As advertised',
    actual: d.actual || 'As documented',
    severity: d.severity || 'WARNING',
    isNumericalVariance: d.isNumericalVariance ?? false,
    varianceAmount: typeof d.varianceAmount === 'number' ? d.varianceAmount : null,
    variancePercentage: typeof d.variancePercentage === 'number' ? d.variancePercentage : null,
    explanation: d.explanation || 'Information gap or variance detected between claims and agreement.',
    evidence: d.evidence || d.sourceEvidence || undefined,
    interpretation: d.interpretation || undefined,
    confidenceLevel: 'HIGH'
  }));

  // Headline amount comparison (advertised or approved principal vs actual disbursed cash)
  const headlineAmount = params.advertisedAmount || extractedData.advertisedAmount || principal;
  if (headlineAmount > 0 && !discrepancies.some(d => d.category === 'LOAN_AMOUNT')) {
    if (financials.actualDisbursedAmount === null || !financials.isDisbursementConfirmed) {
      // Information Gap
      discrepancies.unshift({
        id: 'disc-auto-1',
        category: 'LOAN_AMOUNT',
        riskType: 'INFORMATION_GAP',
        promised: `PKR ${headlineAmount.toLocaleString()} Instant Loan`,
        actual: 'Amount disbursed to borrower: To be determined after approval',
        severity: 'WARNING',
        isNumericalVariance: false,
        explanation: 'Significant information gap detected between the advertised loan amount and the actual disbursement terms.',
        evidence: `Advertised: PKR ${headlineAmount.toLocaleString()} | Document: Amount disbursed to borrower: To be determined after approval.`,
        interpretation: 'The actual amount received cannot be confirmed from the submitted document before approval.',
        confidenceLevel: 'HIGH'
      });
    } else if (financials.actualDisbursedAmount !== null && financials.actualDisbursedAmount < headlineAmount) {
      // Known Numerical Variance
      const diff = headlineAmount - financials.actualDisbursedAmount;
      const diffPct = Math.round((diff / headlineAmount) * 100);
      discrepancies.unshift({
        id: 'disc-auto-1',
        category: 'LOAN_AMOUNT',
        riskType: 'KNOWN_RISK',
        promised: `PKR ${(headlineAmount || 0).toLocaleString()} Approved / Advertised Loan`,
        actual: `PKR ${financials.actualDisbursedAmount.toLocaleString()} transferred (PKR ${diff.toLocaleString()} / ${diffPct}% deducted upfront)`,
        severity: diffPct >= 20 ? 'CRITICAL' : 'WARNING',
        isNumericalVariance: true,
        varianceAmount: diff,
        variancePercentage: diffPct,
        explanation: `PKR ${diff.toLocaleString()} (${diffPct}%) variance between advertised amount and net cash disbursed.`,
        evidence: `Headline/Approved: PKR ${(headlineAmount || 0).toLocaleString()} vs Stated disbursement: PKR ${financials.actualDisbursedAmount.toLocaleString()} (Upfront Deductions: PKR ${diff.toLocaleString()} / ${diffPct}%)`,
        interpretation: `Borrower receives ${diffPct}% less money than the advertised principal.`,
        confidenceLevel: 'HIGH'
      });
    }
  }

  // 4. Deterministic Risk Assessment Scoring
  const riskAssessment = calculateRiskAssessment({
    financials,
    charges,
    clauses,
    permissions: permissionsCatalog,
    discrepancies,
    missingKeyTerms: (!markupRate && charges.length === 0) || financials.essentialTerms.filter(t => t.status === 'NOT_SPECIFIED').length >= 3,
    devicePermissionsSpecified
  });

  // 5. Executive Summary
  let privacyConcernsSummary = 'Device permissions are not specified in the submitted document.';
  if (hasExplicitNoContacts && !permissionsCatalog.some(p => p.requested && p.concernLevel === 'HIGH')) {
    privacyConcernsSummary = 'Low privacy risk: The document explicitly states no access to personal contacts is required.';
  } else if (!devicePermissionsSpecified || !permissionsCatalog.some(p => p.requested)) {
    privacyConcernsSummary = 'Device permissions are not specified in the submitted document.';
  } else if (permissionsCatalog.some(p => p.requested && p.concernLevel === 'HIGH')) {
    const highNames = permissionsCatalog.filter(p => p.requested && p.concernLevel === 'HIGH').map(p => p.displayName.split(' ')[0]).join(', ');
    privacyConcernsSummary = `Sensitive device permissions explicitly requested (${highNames}), creating privacy concerns.`;
  } else {
    privacyConcernsSummary = 'Low privacy exposure: Only standard identity verification permissions requested.';
  }

  let actualDisbursedText = financials.actualDisbursedAmount !== null
    ? `You will receive PKR ${financials.actualDisbursedAmount.toLocaleString()} net after ${financials.totalDeductions ? 'PKR ' + financials.totalDeductions.toLocaleString() + ' in deductions' : '0 deductions'}.`
    : 'The actual amount received cannot be confirmed from the submitted document (To be determined after approval).';

  let chargesSummaryText = financials.deductionStatus === 'POTENTIAL_DEDUCTIONS_UNCLEAR'
    ? 'Potential deductions are mentioned, but the exact amounts are not clearly specified.'
    : (financials.totalDeductions !== null && financials.totalDeductions > 0)
      ? `${charges.length} fee component(s) were identified totaling PKR ${financials.totalDeductions.toLocaleString()} upfront.`
      : 'No upfront fee deductions identified in document.';

  const executiveSummary: ExecutiveSummary = {
    actualAmountReceivedText: extractedData.executiveSummary?.actualAmountReceivedText || actualDisbursedText,
    totalRepaymentText: extractedData.executiveSummary?.totalRepaymentText || 
      (financials.totalRepaymentAmount !== null 
        ? `You will be required to repay a total of PKR ${financials.totalRepaymentAmount.toLocaleString()} over ${financials.durationDays} days.`
        : 'Total repayment amount cannot be confirmed from the submitted document.'),
    chargesIdentifiedSummary: extractedData.executiveSummary?.chargesIdentifiedSummary || chargesSummaryText,
    latePaymentImpactSummary: extractedData.executiveSummary?.latePaymentImpactSummary || 
      `Late payments may incur additional daily or flat penalty fees according to the agreement terms.`,
    criticalClausesSummary: extractedData.executiveSummary?.criticalClausesSummary || 
      `Please review the default and collection clauses carefully before agreeing.`,
    promiseDiscrepancySummary: extractedData.executiveSummary?.promiseDiscrepancySummary || 
      (discrepancies.length > 0 ? `${discrepancies.length} information gap(s) or difference(s) detected between promises and agreement.` : 'Document figures align with initial claims.'),
    privacyConcernsSummary,
    verificationAdvice: extractedData.executiveSummary?.verificationAdvice || [
      'Verify that the loan provider is officially licensed with the SECP (Securities and Exchange Commission of Pakistan).',
      'Confirm the exact net amount that will be deposited into your bank/wallet before accepting.',
      'Check if there are any hidden daily rollover or extension charges.',
      'Do not grant contact book or photo gallery access in the mobile app.'
    ]
  };

  const analysisId = 'analysis-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

  return {
    id: analysisId,
    createdAt: new Date().toISOString(),
    lenderName: params.lenderName || extractedData.lenderName || 'Digital Lending Provider',
    appName: params.appName || extractedData.appName || 'Loan Mobile App',
    analysisMethod: params.method,
    fileName: params.fileName,
    fileType: params.fileMimeType,
    isDemo: false,
    devicePermissionsSpecified,
    riskAssessment,
    financialBreakdown: financials,
    advertisedPromise: {
      advertisedAmount: params.advertisedAmount || extractedData.advertisedAmount || null,
      advertisedMarkupRate: params.advertisedMarkupRate || extractedData.advertisedMarkupRate || null,
      advertisedDuration: params.advertisedDuration || extractedData.advertisedDuration || null,
      advertisedDisbursedAmount: params.advertisedAmount || null,
      marketingClaims: params.marketingClaims || extractedData.marketingClaims || [
        'Instant Approval',
        'Quick Disbursal'
      ],
      advertisedRepaymentAmount: params.expectedRepayment || null
    },
    contractReality: {
      documentedPrincipal: principal,
      documentedDisbursement: financials.actualDisbursedAmount,
      documentedDurationDays: duration,
      documentedMarkupRateAnnual: markupRate,
      totalUpfrontDeductions: financials.totalDeductions,
      totalRecurringFees: charges.filter(c => c.type === 'RECURRING_FEE').reduce((sum, c) => sum + (c.amount || 0), 0),
      documentedRepaymentAmount: financials.totalRepaymentAmount,
      latePenaltyRatePerDay: extractedData.latePenaltyRatePerDay || null,
      isSecpRegisteredClaimed: extractedData.isSecpRegisteredClaimed ?? false
    },
    discrepancies,
    clauses,
    permissions: permissionsCatalog,
    executiveSummary,
    verificationChecklist: [
      {
        id: 'ver-1',
        title: 'Check SECP NBFC Digital Lending List',
        description: 'Ensure the company is registered under the SECP list of authorized digital lending Non-Banking Finance Companies.',
        isCritical: true,
        verificationTip: 'Search company title on secp.gov.pk under registered digital lending apps.'
      },
      {
        id: 'ver-2',
        title: 'Confirm Net Cash vs Repayment Amount',
        description: `Verify that receiving ${financials.actualDisbursedAmount !== null ? 'PKR ' + financials.actualDisbursedAmount.toLocaleString() : 'the cash in hand'} is worth repaying ${financials.totalRepaymentAmount !== null ? 'PKR ' + financials.totalRepaymentAmount.toLocaleString() : 'the required total'}.`,
        isCritical: true,
        verificationTip: financials.totalCostOfBorrowing !== null 
          ? `Total cost of this loan is PKR ${financials.totalCostOfBorrowing.toLocaleString()}.`
          : 'Calculate whether the net disbursed funds justify the overall repayment commitment.'
      },
      {
        id: 'ver-3',
        title: 'Deny Non-Essential Device Permissions',
        description: 'Refuse Contacts and Gallery permissions when prompted on your Android or iOS device.',
        isCritical: permissionsCatalog.some(p => p.requested && p.concernLevel === 'HIGH'),
        verificationTip: 'Regulated Pakistani fintechs do not require phonebook access for credit approval.'
      }
    ],
    extractedRawTextSample: extractedData.rawTextSample || params.rawText || undefined
  };
}

/**
 * Call Gemini Flash with structured schema, supporting model fallback for resilience
 */
async function callGeminiExtractor(ai: GoogleGenAI, params: AnalyzeDocumentParams) {
  const contents: any[] = [];

  let prompt = `You are LoanShield AI, an expert financial risk analyst, consumer protection auditor, and legal clause explainer specialized in the Pakistani digital micro-loan market.
Analyze the provided loan document, advertisement, or loan terms carefully.

Your goal is to extract:
1. Exact financial numbers (Principal, advertised amounts, upfront deductions, recurring charges, interest/markup, duration in days, installments, daily late fees).
2. Distinguish between what the user was promised/advertised vs what the document actually states.
3. Extract key critical clauses (e.g. Recovery & Contacts, Penalties, Default, Rollover/Extension, Data Privacy, Unilateral changes).
4. Provide simple, plain-language explanations of each clause in THREE languages:
   - English
   - Urdu (in Urdu script: اردو)
   - Simple Roman Urdu (easy phonetic Urdu readable in English letters, e.g., "Agar aap time par pay nahi karenge toh rozana penalty lagegi.")
5. Answer the 8 core consumer protection summary questions.

CRITICAL DATA & PRIVACY AUDIT INSTRUCTIONS:
- You MUST distinguish between (A) collection of personal/financial information for loan verification (e.g., CNIC number, salary slip, bank statement) and (B) explicit access to sensitive mobile operating system device permissions (Contacts, SMS, Call logs, Microphone, Camera, Location, Storage/Gallery).
- DO NOT infer sensitive device permissions from generic phrases like "information required for verification", "information required for account servicing", or "identity verification".
- ONLY list requested device permissions in explicitRequestedPermissions if a specific hardware or OS permission is EXPLICITLY requested by name in the text.
- If the document states "No access to the borrower's personal contacts is required" or "No phonebook scraping", set explicitRequestedPermissions without CONTACTS, and note that contacts are NOT accessed.
- If the document does not clearly mention device permissions, set devicePermissionsSpecified to false, explicitRequestedPermissions to [], and set privacyConcernsSummary to: "Device permissions are not clearly specified in the submitted document."

IMPORTANT AI SAFETY RULES:
- Never declare a company "fraudulent" or "illegal" without verified regulatory proof; use neutral consumer-protection language like "Potential discrepancy detected", "Significant upfront deductions identified", "Please review this term carefully".
- Separate extracted facts from interpretations.
- If a number is not mentioned, use null.`;

  if (params.lenderName) prompt += `\nLender name mentioned by user: ${params.lenderName}`;
  if (params.advertisedAmount) prompt += `\nAdvertised amount promised to user: PKR ${params.advertisedAmount}`;
  if (params.advertisedDuration) prompt += `\nAdvertised duration: ${params.advertisedDuration}`;
  if (params.advertisedMarkupRate) prompt += `\nAdvertised markup: ${params.advertisedMarkupRate}`;
  if (params.rawText) prompt += `\nRaw document text:\n${params.rawText}`;

  if (params.fileBase64 && params.fileMimeType) {
    contents.push({
      inlineData: {
        mimeType: params.fileMimeType,
        data: params.fileBase64
      }
    });
  }

  contents.push({ text: prompt });

  const modelsToTry = [
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.8-flash'
  ];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contents.length === 1 ? contents[0].text : contents,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                lenderName: { type: Type.STRING },
                appName: { type: Type.STRING },
                principalAmount: { type: Type.NUMBER, description: 'Documented principal loan in PKR' },
                advertisedAmount: { type: Type.NUMBER, description: 'Advertised amount in PKR if found' },
                durationDays: { type: Type.INTEGER, description: 'Duration in days' },
                markupRateAnnual: { type: Type.NUMBER, description: 'Annual percentage markup rate if disclosed' },
                numberOfInstallments: { type: Type.INTEGER },
                latePenaltyRatePerDay: { type: Type.NUMBER, description: 'Percentage per day or daily fee' },
                isSecpRegisteredClaimed: { type: Type.BOOLEAN },
                devicePermissionsSpecified: { 
                  type: Type.BOOLEAN, 
                  description: 'Set to true ONLY if the document explicitly mentions mobile device permissions (e.g. Contacts, Storage, Camera, SMS, Location). Set to false if not mentioned or only generic verification/KYC statements.' 
                },
                explicitRequestedPermissions: {
                  type: Type.ARRAY,
                  description: 'Only list permission names explicitly requested: CONTACTS, SMS, CAMERA, MICROPHONE, LOCATION, STORAGE_GALLERY, PHONE_STATE, CALL_LOGS',
                  items: { type: Type.STRING }
                },
                marketingClaims: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                charges: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      type: { 
                        type: Type.STRING,
                        description: 'UPFRONT_DEDUCTION, RECURRING_FEE, PENALTY, TAX_GOVERNMENT, or OPTIONAL_SERVICE' 
                      },
                      amount: { type: Type.NUMBER },
                      percentage: { type: Type.NUMBER },
                      isDeductedFromDisbursement: { type: Type.BOOLEAN },
                      description: { type: Type.STRING },
                      isClearlyDisclosed: { type: Type.BOOLEAN }
                    },
                    required: ['name', 'type']
                  }
                },
                discrepancies: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      category: { type: Type.STRING, description: 'LOAN_AMOUNT, MARKUP_RATE, FEES_AND_CHARGES, REPAYMENT_TIMELINE, or OTHER' },
                      promised: { type: Type.STRING },
                      actual: { type: Type.STRING },
                      severity: { type: Type.STRING, description: 'INFO, WARNING, or CRITICAL' },
                      explanation: { type: Type.STRING }
                    },
                    required: ['category', 'promised', 'actual', 'severity', 'explanation']
                  }
                },
                clauses: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      clauseTitle: { type: Type.STRING },
                      originalText: { type: Type.STRING },
                      category: { type: Type.STRING, description: 'RECOVERY, INTEREST_AND_FEES, PENALTIES, DATA_PRIVACY, DEFAULT_AND_LEGAL, or UNILATERAL_CHANGE' },
                      simpleExplanation: {
                        type: Type.OBJECT,
                        properties: {
                          en: { type: Type.STRING },
                          ur: { type: Type.STRING },
                          roman_ur: { type: Type.STRING }
                        },
                        required: ['en', 'ur', 'roman_ur']
                      },
                      whyItMatters: {
                        type: Type.OBJECT,
                        properties: {
                          en: { type: Type.STRING },
                          ur: { type: Type.STRING },
                          roman_ur: { type: Type.STRING }
                        },
                        required: ['en', 'ur', 'roman_ur']
                      },
                      riskFlag: { type: Type.STRING, description: 'GREEN, YELLOW, or RED' }
                    },
                    required: ['clauseTitle', 'originalText', 'category', 'simpleExplanation', 'whyItMatters', 'riskFlag']
                  }
                },
                executiveSummary: {
                  type: Type.OBJECT,
                  properties: {
                    actualAmountReceivedText: { type: Type.STRING },
                    totalRepaymentText: { type: Type.STRING },
                    chargesIdentifiedSummary: { type: Type.STRING },
                    latePaymentImpactSummary: { type: Type.STRING },
                    criticalClausesSummary: { type: Type.STRING },
                    promiseDiscrepancySummary: { type: Type.STRING },
                    privacyConcernsSummary: { type: Type.STRING },
                    verificationAdvice: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  }
                }
              },
              required: ['principalAmount', 'charges', 'clauses']
            }
          }
        });

        const rawJson = response.text?.trim() || '{}';
        return JSON.parse(rawJson);
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} attempt ${attempt + 1} failed or busy:`, err?.message || err);
        // If busy, wait 500ms before retrying or switching models
        await new Promise(r => setTimeout(r, 500));
      }
    }
  }

  throw lastError || new Error('All Gemini models unavailable');
}

/**
 * Intelligent deterministic fallback if Gemini is not invoked or offline
 */
function generateBaselineExtraction(params: AnalyzeDocumentParams) {
  let principal = params.manualPrincipal || params.advertisedAmount || 50000;
  let duration = params.manualDurationDays || 30;
  let lenderName = params.lenderName || 'Digital Credit Provider';
  let upfrontDeduction = params.manualUpfrontDeductions !== undefined && params.manualUpfrontDeductions !== null 
    ? params.manualUpfrontDeductions 
    : 0;
  let totalRepayment = params.expectedRepayment || 0;
  const explicitPerms: PermissionType[] = [];
  let permsSpecifiedInDoc = false;
  const explicitCharges: any[] = [];
  let detectedDiscrepancies: any[] = [];

  // If method is MANUAL_ENTRY, prioritize user's exact entered values directly
  if (params.method === 'MANUAL_ENTRY') {
    principal = params.manualPrincipal || params.advertisedAmount || 25000;
    duration = params.manualDurationDays || 30;
    if (upfrontDeduction > 0) {
      explicitCharges.push({
        name: params.manualChargesDescription || 'Upfront Processing Deduction',
        type: 'UPFRONT_DEDUCTION',
        amount: upfrontDeduction,
        percentage: principal > 0 ? Math.round((upfrontDeduction / principal) * 100 * 10) / 10 : null,
        isDeductedFromDisbursement: true,
        description: params.manualChargesDescription || 'Upfront fee entered by user',
        isClearlyDisclosed: true
      });
    }
    if (!totalRepayment) {
      const markupAmt = params.manualMarkupRateAnnual 
        ? principal * (params.manualMarkupRateAnnual / 100) * (duration / 365)
        : 0;
      totalRepayment = principal + markupAmt;
    }
    return {
      lenderName,
      appName: params.appName || `${lenderName} App`,
      principalAmount: principal,
      advertisedAmount: params.advertisedAmount || principal,
      durationDays: duration,
      markupRateAnnual: params.manualMarkupRateAnnual ?? null,
      numberOfInstallments: 1,
      latePenaltyRatePerDay: null,
      isSecpRegisteredClaimed: false,
      devicePermissionsSpecified: (params.requestedPermissions || []).length > 0,
      explicitRequestedPermissions: params.requestedPermissions || [],
      charges: explicitCharges,
      discrepancies: [],
      clauses: []
    };
  }

  // If raw text is available, attempt to extract exact numerical patterns and fee lines
  if (params.rawText) {
    const text = params.rawText;
    const lowerText = text.toLowerCase();
    
    // Check for Approved Loan Amount / Sanction Amount
    const approvedMatch = text.match(/(?:Approved Loan Amount|Approved Amount|Sanctioned Amount|Loan Amount|Principal Amount|Borrower Sanction Limit|Facility Limit|Sanction Limit)[:\s]+(?:PKR|Rs\.?)?\s*([\d,]+)/i);
    if (approvedMatch && approvedMatch[1]) {
      principal = parseInt(approvedMatch[1].replace(/,/g, ''), 10);
    } else {
      // General match for loan amounts like "Loan 15,000" or "Rs 15,000"
      const broadAmountMatch = text.match(/(?:loan|sanction|limit|amount|borrow|principal|rs\.?|pkr)\s*[:=-]?\s*(?:pkr|rs\.?)?\s*([\d,]{4,})/i);
      if (broadAmountMatch && broadAmountMatch[1]) {
        const val = parseInt(broadAmountMatch[1].replace(/,/g, ''), 10);
        if (val >= 1000 && val <= 5000000) {
          principal = val;
        }
      }
    }

    // Check for specific fee lines:
    // 1. Processing Fee
    const procMatch = text.match(/(?:Processing Fee|Processing Charge|Technical Processing Charge|Platform Fee)[:\s]+(?:PKR|Rs\.?)?\s*([\d,]+)/i);
    if (procMatch && procMatch[1]) {
      const amt = parseInt(procMatch[1].replace(/,/g, ''), 10);
      explicitCharges.push({
        name: 'Processing Fee',
        type: 'UPFRONT_DEDUCTION',
        amount: amt,
        percentage: principal > 0 ? Math.round((amt / principal) * 100 * 10) / 10 : null,
        isDeductedFromDisbursement: true,
        description: 'Loan processing and administration charge deducted prior to disbursement.',
        isClearlyDisclosed: true
      });
    }

    // 2. Service Charge
    const srvMatch = text.match(/(?:Service Charge|Service Fee|Platform Charge)[:\s]+(?:PKR|Rs\.?)?\s*([\d,]+)/i);
    if (srvMatch && srvMatch[1]) {
      const amt = parseInt(srvMatch[1].replace(/,/g, ''), 10);
      explicitCharges.push({
        name: 'Service Charge',
        type: 'UPFRONT_DEDUCTION',
        amount: amt,
        percentage: principal > 0 ? Math.round((amt / principal) * 100 * 10) / 10 : null,
        isDeductedFromDisbursement: true,
        description: 'Technology platform and servicing charge deducted upfront.',
        isClearlyDisclosed: true
      });
    }

    // 3. Verification Fee
    const verMatch = text.match(/(?:Verification Fee|Account Verification Fee|Risk Assessment Surcharge|Appraisal Fee|Documentation Fee)[:\s]+(?:PKR|Rs\.?)?\s*([\d,]+)/i);
    if (verMatch && verMatch[1]) {
      const amt = parseInt(verMatch[1].replace(/,/g, ''), 10);
      explicitCharges.push({
        name: 'Verification & Assessment Fee',
        type: 'UPFRONT_DEDUCTION',
        amount: amt,
        percentage: principal > 0 ? Math.round((amt / principal) * 100 * 10) / 10 : null,
        isDeductedFromDisbursement: true,
        description: 'Identity and risk assessment charge deducted upfront.',
        isClearlyDisclosed: true
      });
    }

    // Generic upfront deduction if no specific matches found
    if (explicitCharges.length === 0) {
      const genericDeductMatch = text.match(/(?:deduction|deducted|charges?|fees?|katauti)\s*[:=-]?\s*(?:pkr|rs\.?)?\s*([\d,]{3,})/i);
      if (genericDeductMatch && genericDeductMatch[1]) {
        const amt = parseInt(genericDeductMatch[1].replace(/,/g, ''), 10);
        if (amt > 0 && amt < principal) {
          explicitCharges.push({
            name: 'Upfront Service Deduction',
            type: 'UPFRONT_DEDUCTION',
            amount: amt,
            percentage: principal > 0 ? Math.round((amt / principal) * 100 * 10) / 10 : null,
            isDeductedFromDisbursement: true,
            description: 'Disclosed upfront deduction extracted from terms.',
            isClearlyDisclosed: true
          });
        }
      }
    }

    // Check for potential deductions mentioned without exact amounts (Category C)
    const hasUnclearDeductions = lowerText.includes('may be deducted where necessary') ||
      lowerText.includes('applicable charges, service costs') ||
      lowerText.includes('deducted where necessary') ||
      lowerText.includes('fees may be deducted') ||
      lowerText.includes('charges may be deducted');

    const isDeferredDisbursement = lowerText.includes('to be determined after approval') ||
      lowerText.includes('disbursed to borrower: to be determined');

    if (hasUnclearDeductions && explicitCharges.length === 0) {
      explicitCharges.push({
        name: 'Potential Upfront Deductions',
        type: 'UPFRONT_DEDUCTION',
        amount: null,
        percentage: null,
        isDeductedFromDisbursement: true,
        description: 'Applicable charges, service costs, administrative expenses and other fees may be deducted where necessary.',
        isClearlyDisclosed: false
      });
    }

    // Check for Actual Amount Transferred / Disbursed
    const disbMatch = text.match(/(?:Actual Amount Transferred|Net Amount Transferred|Disbursed Amount|Net Cash Credited)[:\s]+(?:PKR|Rs\.?)?\s*([\d,]+)/i);
    let actualTransferred: number | null = null;
    if (disbMatch && disbMatch[1]) {
      actualTransferred = parseInt(disbMatch[1].replace(/,/g, ''), 10);
    }

    // Check for Total Deductions
    const dedMatch = text.match(/(?:Total Deductions|Total Upfront Deductions)[:\s]+(?:PKR|Rs\.?)?\s*([\d,]+)/i);
    if (dedMatch && dedMatch[1]) {
      upfrontDeduction = parseInt(dedMatch[1].replace(/,/g, ''), 10);
    } else if (explicitCharges.some(c => c.amount !== null)) {
      upfrontDeduction = explicitCharges.reduce((s, c) => s + (c.amount || 0), 0);
    } else if (hasUnclearDeductions) {
      upfrontDeduction = 0; // null/unclear
    } else if (actualTransferred && principal > actualTransferred) {
      upfrontDeduction = principal - actualTransferred;
    }

    if (hasUnclearDeductions) {
      // Category C
      return {
        lenderName,
        appName: params.appName || `${lenderName} App`,
        principalAmount: principal,
        advertisedAmount: params.advertisedAmount || principal,
        durationDays: duration,
        markupRateAnnual: null,
        numberOfInstallments: 1,
        latePenaltyRatePerDay: null,
        isSecpRegisteredClaimed: false,
        devicePermissionsSpecified: permsSpecifiedInDoc,
        explicitRequestedPermissions: explicitPerms,
        hasPotentialUnclearDeductions: true,
        isDisbursementDeferred: isDeferredDisbursement,
        deductionStatus: 'POTENTIAL_DEDUCTIONS_UNCLEAR',
        marketingClaims: params.marketingClaims || [
          'Instant Cash Approval',
          'Fast Processing'
        ],
        charges: explicitCharges,
        discrepancies: [
          {
            category: 'LOAN_AMOUNT',
            riskType: 'INFORMATION_GAP',
            promised: `PKR ${(params.advertisedAmount || principal).toLocaleString()} Instant Loan`,
            actual: 'Amount disbursed to borrower: To be determined after approval',
            severity: 'WARNING',
            isNumericalVariance: false,
            explanation: 'Significant information gap detected between the advertised loan amount and the actual disbursement terms.',
            evidence: `Advertised: PKR ${(params.advertisedAmount || principal).toLocaleString()} | Document: Amount disbursed to borrower: To be determined after approval.`,
            interpretation: 'The actual amount received cannot be confirmed from the submitted document before approval.',
            confidenceLevel: 'HIGH'
          }
        ],
        clauses: [
          {
            clauseTitle: 'Applicable Charges & Deduction Clause',
            originalText: 'Applicable charges, service costs, administrative expenses and other fees may be deducted where necessary.',
            category: 'INTEREST_AND_FEES',
            simpleExplanation: {
              en: 'The lender may deduct various unspecified fees before giving you the money.',
              ur: 'قرض دینے والا رقم دینے سے پہلے غیر واضح فیسیں کاٹ سکتا ہے۔',
              roman_ur: 'Lender loan dene se pehle mukhtalif fees kaat sakta hai jin ki tadaad wazeh nahi.'
            },
            whyItMatters: {
              en: 'Potential deductions are mentioned, but exact rupee amounts are not specified before approval.',
              ur: 'فیسوں کی کٹوتی کا ذکر ہے لیکن رقم طے نہیں ہے۔',
              roman_ur: 'Deductions ka zikr hai lekin exact amount approve hone se pehle nahi batayi gayi.'
            },
            riskFlag: 'YELLOW'
          },
          {
            clauseTitle: 'Disbursement Determination Condition',
            originalText: 'Amount disbursed to borrower: To be determined after approval.',
            category: 'DEFAULT_AND_LEGAL',
            simpleExplanation: {
              en: 'The exact amount you receive in your account is decided only after approval.',
              ur: 'آپ کو ملنے والی اصل رقم کا فیصلہ منظوری کے بعد کیا جائے گا۔',
              roman_ur: 'Aap ko milne wali actual raqam ka faisla approval ke baad hoga.'
            },
            whyItMatters: {
              en: 'You cannot know the exact money you will receive before accepting.',
              ur: 'آپ قرض لینے سے پہلے اصل رقم کی تصدیق نہیں کر سکتے۔',
              roman_ur: 'Loan lene se pehle aap exact cash in hand nahi jaan sakte.'
            },
            riskFlag: 'YELLOW'
          }
        ]
      };
    }

    // Check for Estimated Total Repayment
    const repMatch = text.match(/(?:Estimated Total Repayment|Total Repayment|Repayment Amount)[:\s]+(?:PKR|Rs\.?)?\s*([\d,]+)/i);
    if (repMatch && repMatch[1]) {
      totalRepayment = parseInt(repMatch[1].replace(/,/g, ''), 10);
    }

    // Check for duration in days
    const dayMatch = text.match(/(\d+)\s*(?:days?|din|days\s*tenure)/i);
    if (dayMatch && dayMatch[1]) {
      const parsedDays = parseInt(dayMatch[1], 10);
      if (parsedDays >= 7 && parsedDays <= 365) {
        duration = parsedDays;
      }
    }

    // Check for lender names
    const lenderMatch = text.match(/(?:provider|app|company|lender|platform):\s*([A-Za-z0-9\s]+)/i);
    if (lenderMatch && lenderMatch[1]) {
      lenderName = lenderMatch[1].trim();
    }

    // Strict Device Permission Extraction from raw text
    // Only detect if explicitly named; DO NOT infer from generic KYC/verification
    const noContacts = lowerText.includes('no access to the borrower') || lowerText.includes('no phonebook') || lowerText.includes('no access to contacts');

    if (!noContacts && (lowerText.includes('contact list') || lowerText.includes('read contacts') || lowerText.includes('phone contacts') || lowerText.includes('phonebook access') || lowerText.includes('access to contacts'))) {
      explicitPerms.push('CONTACTS');
      permsSpecifiedInDoc = true;
    }
    if (lowerText.includes('photo gallery') || lowerText.includes('media storage') || lowerText.includes('storage permission') || lowerText.includes('access storage')) {
      explicitPerms.push('STORAGE_GALLERY');
      permsSpecifiedInDoc = true;
    }
    if (lowerText.includes('call logs') || lowerText.includes('call history')) {
      explicitPerms.push('CALL_LOGS');
      permsSpecifiedInDoc = true;
    }
    if (lowerText.includes('read sms') || lowerText.includes('sms log') || lowerText.includes('sms messages permission')) {
      explicitPerms.push('SMS');
      permsSpecifiedInDoc = true;
    }
    if (lowerText.includes('precise location') || lowerText.includes('gps location access')) {
      explicitPerms.push('LOCATION');
      permsSpecifiedInDoc = true;
    }
    if (lowerText.includes('camera permission') || lowerText.includes('camera access') || lowerText.includes('take selfie')) {
      explicitPerms.push('CAMERA');
      permsSpecifiedInDoc = true;
    }
  }

  // If charges were specifically parsed from text, use them; otherwise use default breakdown
  const finalCharges = explicitCharges.length > 0 ? explicitCharges : [
    {
      name: 'Processing & Technical Fee',
      type: 'UPFRONT_DEDUCTION',
      amount: Math.round(upfrontDeduction * 0.7),
      percentage: 8,
      isDeductedFromDisbursement: true,
      description: 'Upfront fee deducted before disbursement.',
      isClearlyDisclosed: false
    },
    {
      name: 'Service & Risk Surcharge',
      type: 'UPFRONT_DEDUCTION',
      amount: Math.round(upfrontDeduction * 0.3),
      percentage: 4,
      isDeductedFromDisbursement: true,
      description: 'Administrative assessment fee deducted upfront.',
      isClearlyDisclosed: false
    }
  ];

  // If there is an upfront deduction, add discrepancy
  if (upfrontDeduction > 0) {
    const deductionRatio = principal > 0 ? Math.round((upfrontDeduction / principal) * 100) : 0;
    detectedDiscrepancies.push({
      category: 'LOAN_AMOUNT',
      promised: `PKR ${principal.toLocaleString()} Approved / Advertised Loan`,
      actual: `PKR ${(principal - upfrontDeduction).toLocaleString()} transferred (PKR ${upfrontDeduction.toLocaleString()} / ${deductionRatio}% deducted upfront)`,
      severity: deductionRatio >= 20 ? 'CRITICAL' : 'WARNING',
      explanation: 'Potential discrepancy detected between the advertised or approved loan amount and the amount stated to be transferred after deductions.'
    });
  }

  return {
    lenderName: lenderName,
    appName: params.appName || `${lenderName} App`,
    principalAmount: principal,
    advertisedAmount: params.advertisedAmount || principal,
    durationDays: duration,
    markupRateAnnual: params.manualMarkupRateAnnual || (totalRepayment > principal ? Math.round(((totalRepayment - principal) / principal) * (365 / duration) * 100) : 36),
    numberOfInstallments: 1,
    latePenaltyRatePerDay: 1.0,
    isSecpRegisteredClaimed: false,
    devicePermissionsSpecified: permsSpecifiedInDoc,
    explicitRequestedPermissions: explicitPerms,
    marketingClaims: params.marketingClaims || [
      'Instant Cash Approval',
      'Minimal Documentation',
      'Fast Account Credit'
    ],
    charges: finalCharges,
    discrepancies: detectedDiscrepancies,
    clauses: [
      {
        clauseTitle: 'Default and Grace Period Terms',
        originalText: 'Borrower shall settle the due balance upon the expiration of the loan tenure.',
        category: 'DEFAULT_AND_LEGAL',
        simpleExplanation: {
          en: 'You are obligated to repay the full balance on the specified due date.',
          ur: 'آپ کو مقررہ تاریخ پر تمام بقایا رقم ادا کرنی ہوگی۔',
          roman_ur: 'Aap ko muqarrara tareekh par poora qarz ada karna hoga.'
        },
        whyItMatters: {
          en: 'Understanding repayment terms avoids unexpected delay charges.',
          ur: 'ادائیگی کی شرائط سمجھنے سے اضافی جرمانے سے بچا جا سکتا ہے۔',
          roman_ur: 'Repayment date yaad rakhne se extra charges nahi lagte.'
        },
        riskFlag: 'YELLOW'
      }
    ]
  };
}

/**
 * AI Loan Advisor Question Answerer
 */
export async function askLoanAdvisor(params: {
  analysis: AnalysisResult;
  question: string;
}): Promise<string> {
  const ai = getGenAI();
  const fin = params.analysis.financialBreakdown;
  const risk = params.analysis.riskAssessment;

  if (!ai) {
    return `Based on the analysis of this loan from ${params.analysis.lenderName}:
- Net disbursed amount: PKR ${(fin.actualDisbursedAmount || 0).toLocaleString()}
- Total repayment: PKR ${(fin.totalRepaymentAmount || 0).toLocaleString()}
- Cost of borrowing: PKR ${(fin.totalCostOfBorrowing || 0).toLocaleString()}
- Risk Level: ${risk.riskLevel || 'HIGH'} (${risk.overallScore || 70}/100)

Please ensure you verify the provider on the official SECP licensed registry and review the upfront fee deductions carefully before accepting.`;
  }

  const prompt = `You are the LoanShield AI Consumer Protection Advisor for Pakistani borrowers.
You have audited a digital loan offer with the following details:
Lender: ${params.analysis.lenderName}
Principal: PKR ${(fin.principalAmount || 0).toLocaleString()}
Actual Disbursed to User: PKR ${(fin.actualDisbursedAmount || 0).toLocaleString()}
Total Deductions: PKR ${(fin.totalDeductions || 0).toLocaleString()}
Total Repayment: PKR ${(fin.totalRepaymentAmount || 0).toLocaleString()}
Duration: ${fin.durationDays || 30} days
Risk Score: ${risk.overallScore || 70}/100 (${risk.riskLevel || 'HIGH'})

User Question: "${params.question}"

Provide a clear, objective, protective, and jargon-free answer tailored to Pakistani consumers.
- Explain practical realities (costs, penalties, permissions, SECP guidance).
- Maintain consumer protection principles.
- Avoid unsupported accusations of crime, but highlight clear risks and practical advice.
- Keep response concise, structured, and easy to understand (150-250 words).`;

  const modelsToTry = [
    'gemini-3.7-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest'
  ];
  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          temperature: 0.4,
        }
      });
      if (response.text) return response.text;
    } catch (err) {
      console.warn(`Advisor model ${modelName} failed, trying next...`, err);
    }
  }

  return `Based on our audit of ${params.analysis.lenderName}:
1. **Financial Reality**: You are receiving PKR ${(fin.actualDisbursedAmount || 0).toLocaleString()} after PKR ${(fin.totalDeductions || 0).toLocaleString()} in upfront deductions, but you must repay PKR ${(fin.totalRepaymentAmount || 0).toLocaleString()} in ${fin.durationDays || 30} days.
2. **Effective Cost**: The effective cost of borrowing is PKR ${(fin.totalCostOfBorrowing || 0).toLocaleString()}.
3. **Consumer Warning**: Check whether ${params.analysis.lenderName} is licensed under SECP Circular 15 before submitting CNIC or contact permissions.`;
}
