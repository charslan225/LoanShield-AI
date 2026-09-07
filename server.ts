import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { DEMO_SCENARIOS } from './src/data/demoScenarios';
import { storage } from './src/server/storage';
import { analyzeLoanDocument, answerAdvisorQuestion } from './src/server/geminiService';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // CORS & Preflight handling
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // JSON Body parsing with generous payload limit for base64 documents/images
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // -------------------------------------------------------------
  // API Routes (mounted BEFORE Vite/static handlers)
  // -------------------------------------------------------------

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'LoanShield AI Server',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Demo Scenarios catalog
  app.get('/api/demo-scenarios', (_req, res) => {
    res.json({
      success: true,
      scenarios: DEMO_SCENARIOS,
    });
  });

  // Analyze via document or agreement upload
  app.post('/api/analyze/upload', async (req, res) => {
    try {
      const analysis = await analyzeLoanDocument({
        method: req.body.method || 'AGREEMENT_UPLOAD',
        lenderName: req.body.lenderName,
        appName: req.body.appName,
        advertisedAmount: req.body.advertisedAmount,
        advertisedDuration: req.body.advertisedDuration,
        advertisedMarkupRate: req.body.advertisedMarkupRate,
        expectedRepayment: req.body.expectedRepayment,
        requestedPermissions: req.body.requestedPermissions,
        fileBase64: req.body.fileBase64,
        fileMimeType: req.body.fileMimeType,
        fileName: req.body.fileName,
        rawText: req.body.rawText,
      });

      const saved = storage.saveAnalysis(analysis);
      res.json({
        success: true,
        analysis: saved,
      });
    } catch (err: any) {
      console.error('Analysis error:', err);
      res.status(500).json({
        success: false,
        error: err?.message || 'Failed to process document analysis.',
      });
    }
  });

  // Analyze via manual parameters
  app.post('/api/analyze/manual', async (req, res) => {
    try {
      const analysis = await analyzeLoanDocument({
        method: 'MANUAL_ENTRY',
        lenderName: req.body.lenderName,
        appName: req.body.appName,
        advertisedAmount: req.body.advertisedAmount,
        advertisedDuration: req.body.advertisedDuration,
        advertisedMarkupRate: req.body.advertisedMarkupRate,
        expectedRepayment: req.body.expectedRepayment,
        manualPrincipal: req.body.manualPrincipal,
        manualDurationDays: req.body.manualDurationDays,
        manualMarkupRateAnnual: req.body.manualMarkupRateAnnual,
        manualUpfrontDeductions: req.body.manualUpfrontDeductions,
        manualChargesDescription: req.body.manualChargesDescription,
        requestedPermissions: req.body.requestedPermissions,
      });

      const saved = storage.saveAnalysis(analysis);
      res.json({
        success: true,
        analysis: saved,
      });
    } catch (err: any) {
      console.error('Manual analysis error:', err);
      res.status(500).json({
        success: false,
        error: err?.message || 'Failed to process manual analysis.',
      });
    }
  });

  // Get specific analysis by ID
  app.get('/api/analysis/:id', (req, res) => {
    const analysis = storage.getAnalysisById(req.params.id);
    if (!analysis) {
      res.status(404).json({
        success: false,
        error: 'Analysis not found.',
      });
      return;
    }
    res.json({
      success: true,
      analysis,
    });
  });

  // History list
  app.get('/api/analysis-history', (_req, res) => {
    const all = storage.getAllAnalyses();
    const history = all.map((a) => ({
      id: a.id,
      createdAt: a.createdAt,
      lenderName: a.lenderName,
      analysisMethod: a.analysisMethod,
      isDemo: a.isDemo || false,
      principalAmount: a.financialBreakdown?.principalAmount || 0,
      actualDisbursed: a.financialBreakdown?.actualDisbursedAmount || 0,
      totalRepayment: a.financialBreakdown?.totalRepaymentAmount || 0,
      riskScore: a.riskAssessment?.overallScore || 0,
      riskLevel: a.riskAssessment?.riskLevel || 'LOW',
      riskTitle: a.riskAssessment?.riskTitle || '',
    }));

    res.json({
      success: true,
      history,
    });
  });

  // Delete analysis
  app.delete('/api/analysis/:id', (req, res) => {
    const deleted = storage.deleteAnalysis(req.params.id);
    res.json({
      success: deleted,
      message: deleted ? 'Analysis record deleted.' : 'Record not found.',
    });
  });

  // Ask AI Advisor
  app.post('/api/ask-advisor', async (req, res) => {
    try {
      const { analysisId, question } = req.body;
      if (!question) {
        res.status(400).json({ success: false, error: 'Question is required.' });
        return;
      }

      const analysis = analysisId ? storage.getAnalysisById(analysisId) : null;
      const answer = await answerAdvisorQuestion(analysis || {}, question);

      res.json({
        success: true,
        answer,
      });
    } catch (err: any) {
      console.error('Advisor error:', err);
      res.status(500).json({
        success: false,
        error: err?.message || 'Failed to query advisor.',
      });
    }
  });

  // Auth: Sign up
  app.post('/api/auth/signup', (req, res) => {
    const { name, email, password } = req.body;
    if (!email || typeof email !== 'string') {
      res.status(400).json({ success: false, error: 'Valid email is required.' });
      return;
    }
    const existing = storage.getUserByEmail(email);
    if (existing) {
      res.status(400).json({ success: false, error: 'An account with this email already exists.' });
      return;
    }

    const user = storage.createUser(name || 'User', email, password);
    res.json({
      success: true,
      user,
    });
  });

  // Auth: Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email) {
      res.status(400).json({ success: false, error: 'Email is required.' });
      return;
    }
    const user = storage.getUserByEmail(email);
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password.' });
      return;
    }

    if (user.password && password) {
      const valid = storage.verifyPassword(password, user.password);
      if (!valid) {
        res.status(401).json({ success: false, error: 'Invalid email or password.' });
        return;
      }
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  });

  // Auth: Reset password
  app.post('/api/auth/reset-password', (_req, res) => {
    res.json({
      success: true,
      message: 'Password reset link has been dispatched to your email.',
    });
  });

  // -------------------------------------------------------------
  // Frontend Serving (Vite middleware in dev, Static in prod)
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Express error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Express server error:', err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal Server Error',
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LoanShield AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
