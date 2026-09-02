/**
 * LoanShield AI - Server Data Storage Layer
 * Manages user accounts, active analyses, and analysis history.
 */

import { AnalysisResult, UserProfile } from '../src/types';
import { DEMO_SCENARIOS } from '../src/data/demoScenarios';

interface UserRecord extends UserProfile {
  passwordHash?: string;
  createdAt: string;
}

class StorageManager {
  private users: Map<string, UserRecord> = new Map();
  private analyses: Map<string, AnalysisResult> = new Map();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Seed standard demo user
    const demoUser: UserRecord = {
      id: 'demo-user-1',
      name: 'Ali Khan',
      email: 'ali.khan@example.com',
      passwordHash: 'demopassword123',
      createdAt: new Date().toISOString()
    };
    this.users.set(demoUser.email, demoUser);

    // Seed the 3 demo scenarios as preloaded accessible analyses
    for (const scenario of DEMO_SCENARIOS) {
      this.analyses.set(scenario.resultData.id, scenario.resultData);
    }
  }

  // User Management
  public createUser(name: string, email: string, passwordHash?: string): UserProfile {
    const existing = this.users.get(email.toLowerCase());
    if (existing) {
      return { id: existing.id, name: existing.name, email: existing.email };
    }
    const newUser: UserRecord = {
      id: 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: name || email.split('@')[0],
      email: email.toLowerCase(),
      passwordHash,
      createdAt: new Date().toISOString()
    };
    this.users.set(newUser.email, newUser);
    return { id: newUser.id, name: newUser.name, email: newUser.email };
  }

  public getUserByEmail(email: string): UserRecord | undefined {
    return this.users.get(email.toLowerCase());
  }

  // Analysis Records Management
  public saveAnalysis(analysis: AnalysisResult): AnalysisResult {
    this.analyses.set(analysis.id, analysis);
    return analysis;
  }

  public getAnalysisById(id: string): AnalysisResult | undefined {
    return this.analyses.get(id);
  }

  public getAllAnalyses(): AnalysisResult[] {
    return Array.from(this.analyses.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public deleteAnalysis(id: string): boolean {
    return this.analyses.delete(id);
  }
}

export const storage = new StorageManager();
