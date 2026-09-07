import bcrypt from 'bcryptjs';
import { AnalysisResult, UserProfile } from '../types';
import { DEMO_SCENARIOS } from '../data/demoScenarios';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  createdAt: string;
}

export class StorageManager {
  private analyses: Map<string, AnalysisResult> = new Map();
  private users: Map<string, StoredUser> = new Map();

  constructor() {
    this.seedDemoData();
  }

  public seedDemoData(): void {
    // Seed demo scenarios analyses
    for (const scenario of DEMO_SCENARIOS) {
      if (scenario.resultData && scenario.resultData.id) {
        this.analyses.set(scenario.resultData.id, scenario.resultData);
      }
    }

    // Seed default demo user
    const demoEmail = 'ali.khan@example.com';
    if (!this.users.has(demoEmail)) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync('demopassword123', salt);
      this.users.set(demoEmail, {
        id: 'user-demo-ali',
        name: 'Ali Khan',
        email: demoEmail,
        password: hash,
        createdAt: new Date().toISOString(),
      });
    }
  }

  public saveAnalysis(analysis: AnalysisResult): AnalysisResult {
    const id = analysis.id || `analysis-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    analysis.id = id;
    if (!analysis.createdAt) {
      analysis.createdAt = new Date().toISOString();
    }
    this.analyses.set(id, analysis);
    return analysis;
  }

  public getAnalysisById(id: string): AnalysisResult | null {
    return this.analyses.get(id) || null;
  }

  public getAllAnalyses(): AnalysisResult[] {
    const list = Array.from(this.analyses.values());
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }

  public deleteAnalysis(id: string): boolean {
    return this.analyses.delete(id);
  }

  public createUser(name: string, email: string, password?: string): UserProfile {
    const id = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const lowerEmail = email.toLowerCase();
    let hashedPassword = '';
    if (password) {
      const salt = bcrypt.genSaltSync(10);
      hashedPassword = bcrypt.hashSync(password, salt);
    }

    const user: StoredUser = {
      id,
      name: name || 'User',
      email: lowerEmail,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    this.users.set(lowerEmail, user);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  public verifyPassword(plain: string, hashed: string): boolean {
    if (!hashed) return false;
    try {
      return bcrypt.compareSync(plain, hashed);
    } catch {
      return false;
    }
  }

  public getUserByEmail(email: string): StoredUser | null {
    return this.users.get(email.toLowerCase()) || null;
  }
}

export const storage = new StorageManager();
