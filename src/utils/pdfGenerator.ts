import { jsPDF } from 'jspdf';
import { AnalysisResult } from '../types';

export function generateLoanAuditPdf(analysis: AnalysisResult): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let y = 18;

  // Header Banner
  doc.setFillColor(15, 23, 42); // Dark Navy Slate
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent Line
  doc.setFillColor(255, 99, 33); // LoanShield Orange
  doc.rect(0, 27, pageWidth, 2, 'F');

  // Brand Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('LOANSHIELD AI', margin, 12);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('Digital Consumer Protection & Loan Transparency Audit', margin, 18);
  doc.text('SECP Digital Lending Compliance Standard (Circulars 10 & 15)', margin, 23);

  // Top Right Meta Box
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  const auditDate = new Date(analysis.createdAt || Date.now()).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  doc.text(`Audit ID: ${analysis.id || 'AUDIT-' + Date.now()}`, pageWidth - margin, 12, { align: 'right' });
  doc.text(`Audit Date: ${auditDate}`, pageWidth - margin, 17, { align: 'right' });
  doc.text(`Method: ${(analysis.analysisMethod || 'DOCUMENT').replace('_', ' ')}`, pageWidth - margin, 22, { align: 'right' });

  y = 36;

  // Lender & Entity Info Block
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(analysis.lenderName || 'Digital Lending Institution', margin + 4, y + 7);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`App / Platform: ${analysis.appName || 'Mobile Credit Application'} | Document: ${analysis.fileName || 'Contract Agreement'}`, margin + 4, y + 13);

  y += 24;

  // Executive Risk Score Card
  const risk = analysis.riskAssessment || {
    overallScore: 50,
    riskLevel: 'MODERATE',
    riskTitle: 'Moderate Risk',
    summaryReason: 'Financial terms have noticeable variance or disclosure gaps.'
  };

  const riskLevel = (risk.riskLevel || 'MODERATE').toUpperCase();
  let badgeColor: [number, number, number] = [234, 88, 12]; // Amber/Orange
  if (riskLevel.includes('CRITICAL') || riskLevel.includes('VERY_HIGH')) {
    badgeColor = [225, 29, 72]; // Rose/Red
  } else if (riskLevel.includes('LOW')) {
    badgeColor = [16, 185, 129]; // Green
  }

  doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('EXPLAINABLE RISK EVALUATION', margin + 5, y + 7);

  doc.setFontSize(18);
  doc.text(`${risk.overallScore || 0} / 100`, margin + 5, y + 16);

  doc.setFontSize(11);
  doc.text(`[ ${riskLevel} RISK ]`, margin + 42, y + 16);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const riskDesc = doc.splitTextToSize(risk.riskTitle || risk.summaryReason || 'Overall lending risk evaluated against statutory norms.', contentWidth - 90);
  doc.text(riskDesc, margin + 85, y + 8);

  y += 30;

  // Section: Financial Truth Table
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. FINANCIAL TRANSPARENCY & COST BREAKDOWN', margin, y);
  y += 4;

  const fin = analysis.financialBreakdown || {
    principalAmount: 0,
    actualDisbursedAmount: 0,
    totalDeductions: 0,
    durationDays: 30,
    totalRepaymentAmount: 0,
    totalCostOfBorrowing: 0,
    effectiveAnnualPercentageRate: 0
  };

  const colW = contentWidth / 3;
  const rowH = 14;

  const finItems = [
    { label: 'Sanctioned Principal', val: `PKR ${(fin.principalAmount || 0).toLocaleString()}`, desc: 'Total credit limit approved' },
    { label: 'Upfront Deductions', val: `PKR ${(fin.totalDeductions || 0).toLocaleString()}`, desc: 'Processing / platform fees cut' },
    { label: 'Actual Cash Received', val: `PKR ${(fin.actualDisbursedAmount !== null && fin.actualDisbursedAmount !== undefined ? fin.actualDisbursedAmount.toLocaleString() : 'Undisclosed')}`, desc: 'Net cash disbursed to borrower' },
    { label: 'Repayment Tenure', val: `${fin.durationDays || 'N/A'} Days`, desc: (fin.durationDays && fin.durationDays < 30) ? 'VIOLATES SECP 30-Day Rule' : 'Contract duration' },
    { label: 'Total Repayment', val: `PKR ${(fin.totalRepaymentAmount !== null && fin.totalRepaymentAmount !== undefined ? fin.totalRepaymentAmount.toLocaleString() : 'To be confirmed')}`, desc: 'Total sum required to settle' },
    { label: 'Effective APR', val: `${fin.effectiveAnnualPercentageRate !== null && fin.effectiveAnnualPercentageRate !== undefined ? fin.effectiveAnnualPercentageRate + '%' : 'Undisclosed'}`, desc: 'True annualized cost of borrowing' }
  ];

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);

  finItems.forEach((item, idx) => {
    const r = Math.floor(idx / 3);
    const c = idx % 3;
    const itemX = margin + (c * colW);
    const itemY = y + (r * (rowH + 2));

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(itemX, itemY, colW - 2, rowH, 1.5, 1.5, 'FD');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(item.label.toUpperCase(), itemX + 3, itemY + 4);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(item.val, itemX + 3, itemY + 9);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    if (item.desc.includes('VIOLATES')) {
      doc.setTextColor(225, 29, 72);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(148, 163, 184);
    }
    doc.text(item.desc, itemX + 3, itemY + 12.5);
  });

  y += (rowH + 2) * 2 + 6;

  // Section: Mobile Device Permissions & Privacy Risks
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. PRIVACY & MOBILE DEVICE ACCESS AUDIT', margin, y);
  y += 4;

  const perms = (analysis.permissions || []).filter(p => p.requested);
  if (perms.length === 0) {
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'FD');
    doc.setTextColor(22, 101, 52);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('No aggressive device permissions detected or requested in this contract.', margin + 4, y + 7.5);
    y += 16;
  } else {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 202, 202);
    const permBoxH = Math.min(24, Math.max(14, perms.length * 5.5 + 5));
    doc.roundedRect(margin, y, contentWidth, permBoxH, 1.5, 1.5, 'FD');

    let pY = y + 5;
    perms.slice(0, 4).forEach(p => {
      const isSevere = p.concernLevel === 'HIGH' || p.permission === 'CONTACTS' || p.permission === 'STORAGE_GALLERY';
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(isSevere ? 185 : 100, isSevere ? 28 : 116, isSevere ? 28 : 139);
      doc.text(`[ ${p.concernLevel} RISK ] ${p.displayName || p.permission}:`, margin + 4, pY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(` - ${p.whyItMatters || p.potentialAbuseContext || 'Device access scrutinized under privacy regulations'}`, margin + 45, pY);
      pY += 5;
    });

    y += permBoxH + 4;
  }

  // Section: High-Risk Clauses & Regulatory Violations
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('3. CONTRACT CLAUSES & SECP COMPLIANCE AUDIT', margin, y);
  y += 4;

  const discrepancies = analysis.discrepancies || [];
  const clauses = analysis.clauses || [];
  const keyViolations = discrepancies.slice(0, 3);

  if (keyViolations.length === 0 && clauses.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'FD');
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Terms appear consistent with baseline statutory disclosures.', margin + 4, y + 7.5);
    y += 16;
  } else {
    keyViolations.forEach(disc => {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(185, 28, 28);
      doc.text(`FLAGGED VARIANCE [${disc.category || 'TERMS'}]:`, margin + 3, y + 4.5);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(`Promised: ${disc.promised || 'N/A'}  -->  Actual Contract: ${disc.actual || 'N/A'}`, margin + 3, y + 9);
      doc.text(`Note: ${disc.explanation || disc.evidence || 'Discrepancy identified between advertised and documented terms.'}`, margin + 3, y + 12.5);

      y += 16;
    });
  }

  // Footer: SECP Guidance & Complaint Channels
  const footerY = Math.max(y + 2, pageHeight - 34);
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, footerY, contentWidth, 26, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('SECP REGULATORY PROTECTION & COMPLAINT DIRECTORY', margin + 4, footerY + 5.5);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Under SECP Digital Lending Regulations, bullet loans under 30 days and unauthorized contact harvesting are strictly prohibited.', margin + 4, footerY + 10);
  doc.text('File an official grievance: SECP SDMS Portal (https://sdms.secp.gov.pk) | Toll-Free Helpline: 0800-88008', margin + 4, footerY + 14.5);
  doc.text('Report Blackmail or Harassment: FIA Cybercrime Wing Helpline 1991 | https://complaint.fia.gov.pk', margin + 4, footerY + 19);
  doc.text('This audit certificate is generated for borrower consumer awareness by LoanShield AI and does not constitute formal legal counsel.', margin + 4, footerY + 23.5);

  // Save the PDF
  const filename = `LoanShield_Audit_${(analysis.lenderName || 'Loan').replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now().toString().slice(-4)}.pdf`;
  doc.save(filename);
}
