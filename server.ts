/**
 * LoanShield AI - Full-Stack Express Server Entry Point
 * Host: 0.0.0.0 | Port: 3000
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { analyzeLoanWithAI, askLoanAdvisor } from './server/gemini';
import { storage } from './server/storage';
import { DEMO_SCENARIOS } from './src/data/demoScenarios';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON & Base64 body parser (up to 25MB for document images/PDFs)
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // ==========================================
  // API ROUTES
  // ==========================================

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'LoanShield AI Intelligence Server',
      timestamp: new Date().toISOString()
    });
  });

  // 1. Get Demo Scenarios
  app.get('/api/demo-scenarios', (req, res) => {
    res.json({
      success: true,
      scenarios: DEMO_SCENARIOS.map(s => ({
        id: s.id,
        title: s.title,
        tagline: s.tagline,
        description: s.description,
        riskBadge: s.riskBadge,
        lenderName: s.lenderName,
        advertisedText: s.advertisedText,
        contractSnippet: s.contractSnippet,
        samplePermissions: s.samplePermissions,
        resultId: s.resultData.id
      }))
    });
  });

  // 2. Perform AI Document Analysis (Upload Method)
  app.post('/api/analyze/upload', async (req, res) => {
    try {
      const {
        method,
        lenderName,
        appName,
        advertisedAmount,
        advertisedDuration,
        advertisedMarkupRate,
        expectedRepayment,
        requestedPermissions,
        fileBase64,
        fileMimeType,
        fileName,
        rawText
      } = req.body;

      if (!fileBase64 && !rawText) {
        return res.status(400).json({
          success: false,
          error: 'Please provide either an uploaded file or document text.'
        });
      }

      const result = await analyzeLoanWithAI({
        method: method || 'AGREEMENT_UPLOAD',
        lenderName,
        appName,
        advertisedAmount: advertisedAmount ? Number(advertisedAmount) : null,
        advertisedDuration,
        advertisedMarkupRate,
        expectedRepayment: expectedRepayment ? Number(expectedRepayment) : null,
        requestedPermissions: requestedPermissions || [],
        fileBase64,
        fileMimeType,
        fileName,
        rawText
      });

      storage.saveAnalysis(result);

      res.json({
        success: true,
        analysis: result
      });
    } catch (error: any) {
      console.error('Error during upload analysis:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'An error occurred while analyzing the loan document.'
      });
    }
  });

  // 3. Perform AI Analysis (Manual Entry Method)
  app.post('/api/analyze/manual', async (req, res) => {
    try {
      const {
        lenderName,
        appName,
        advertisedAmount,
        advertisedDuration,
        advertisedMarkupRate,
        expectedRepayment,
        manualPrincipal,
        manualDurationDays,
        manualMarkupRateAnnual,
        manualUpfrontDeductions,
        manualChargesDescription,
        requestedPermissions
      } = req.body;

      const result = await analyzeLoanWithAI({
        method: 'MANUAL_ENTRY',
        lenderName,
        appName,
        advertisedAmount: advertisedAmount ? Number(advertisedAmount) : null,
        advertisedDuration,
        advertisedMarkupRate,
        expectedRepayment: expectedRepayment ? Number(expectedRepayment) : null,
        manualPrincipal: manualPrincipal ? Number(manualPrincipal) : Number(advertisedAmount) || 50000,
        manualDurationDays: manualDurationDays ? Number(manualDurationDays) : 30,
        manualMarkupRateAnnual: manualMarkupRateAnnual ? Number(manualMarkupRateAnnual) : null,
        manualUpfrontDeductions: manualUpfrontDeductions ? Number(manualUpfrontDeductions) : null,
        manualChargesDescription,
        requestedPermissions: requestedPermissions || []
      });

      storage.saveAnalysis(result);

      res.json({
        success: true,
        analysis: result
      });
    } catch (error: any) {
      console.error('Error during manual analysis:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'An error occurred while calculating loan parameters.'
      });
    }
  });

  // 4. Get Analysis By ID
  app.get('/api/analysis/:id', (req, res) => {
    const analysis = storage.getAnalysisById(req.params.id);
    if (!analysis) {
      // Check if it's one of the demo scenarios
      const demoMatch = DEMO_SCENARIOS.find(s => s.resultData.id === req.params.id || s.id === req.params.id);
      if (demoMatch) {
        return res.json({ success: true, analysis: demoMatch.resultData });
      }
      return res.status(404).json({ success: false, error: 'Analysis record not found.' });
    }
    res.json({ success: true, analysis });
  });

  // 5. Get Analysis History
  app.get('/api/analysis-history', (req, res) => {
    const history = storage.getAllAnalyses();
    res.json({
      success: true,
      history: history.map(h => ({
        id: h.id,
        createdAt: h.createdAt,
        lenderName: h.lenderName,
        analysisMethod: h.analysisMethod,
        isDemo: h.isDemo,
        principalAmount: h.financialBreakdown.principalAmount,
        actualDisbursed: h.financialBreakdown.actualDisbursedAmount,
        totalRepayment: h.financialBreakdown.totalRepaymentAmount,
        riskScore: h.riskAssessment.overallScore,
        riskLevel: h.riskAssessment.riskLevel,
        riskTitle: h.riskAssessment.riskTitle
      }))
    });
  });

  // 6. Delete Analysis
  app.delete('/api/analysis/:id', (req, res) => {
    const deleted = storage.deleteAnalysis(req.params.id);
    res.json({ success: true, deleted });
  });

  // 7. Ask AI Loan Advisor
  app.post('/api/ask-advisor', async (req, res) => {
    try {
      const { analysisId, question } = req.body;
      if (!question) {
        return res.status(400).json({ success: false, error: 'Question is required.' });
      }

      let analysis = storage.getAnalysisById(analysisId);
      if (!analysis) {
        const demo = DEMO_SCENARIOS.find(s => s.resultData.id === analysisId || s.id === analysisId);
        if (demo) analysis = demo.resultData;
      }

      if (!analysis) {
        return res.status(404).json({ success: false, error: 'Analysis context not found.' });
      }

      const answer = await askLoanAdvisor({
        analysis,
        question
      });

      res.json({ success: true, answer });
    } catch (err: any) {
      console.error('Advisor chat error:', err);
      res.status(500).json({ success: false, error: err.message || 'Advisor error.' });
    }
  });

  // 8. Auth Endpoints
  app.post('/api/auth/signup', (req, res) => {
    const { name, email, password } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required.' });
    }
    const user = storage.createUser(name || 'User', email, password);
    res.json({ success: true, user });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required.' });
    }
    let user = storage.getUserByEmail(email);
    if (!user) {
      // Auto register for seamless hackathon / test usability
      user = storage.createUser(email.split('@')[0], email, password) as any;
    }
    res.json({
      success: true,
      user: {
        id: user!.id,
        name: user!.name,
        email: user!.email
      }
    });
  });

  app.post('/api/auth/reset-password', (req, res) => {
    const { email } = req.body;
    res.json({
      success: true,
      message: `If an account with ${email} exists, a password reset link has been dispatched.`
    });
  });

  // ==========================================
  // Vite Integration (Dev vs Prod)
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LoanShield AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
