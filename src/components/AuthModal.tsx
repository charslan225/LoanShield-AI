import React, { useState } from 'react';
import { ShieldCheck, User, Mail, Lock, X, ArrowRight } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (data.success && data.user) {
        onLoginSuccess(data.user);
        onClose();
      } else {
        setError(data.error || 'Authentication error.');
      }
    } catch (err: any) {
      setError('Failed to authenticate. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoGuest = () => {
    onLoginSuccess({
      id: 'guest-' + Date.now(),
      name: 'Guest User',
      email: 'guest@loanshield.pk'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-[#111111] rounded-3xl shadow-2xl border border-[#222222] overflow-hidden text-[#E0E0E0]">
        
        {/* Header */}
        <div className="bg-[#161616] p-6 flex items-center justify-between border-b border-[#222222]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF6321] text-black flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isSignUp ? 'Create LoanShield Account' : 'Welcome Back'}
              </h3>
              <p className="text-[11px] text-[#888888]">Secure & Confidential Loan Auditing</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#888888] hover:text-white hover:bg-[#222222] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
              {error}
            </div>
          )}

          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-[#A0A0A0] mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#666666] absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Ali Khan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#2a2a2a] bg-[#181818] text-xs text-white placeholder-[#555555] focus:border-[#FF6321] focus:ring-1 focus:ring-[#FF6321]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#A0A0A0] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#666666] absolute left-3 top-3" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#2a2a2a] bg-[#181818] text-xs text-white placeholder-[#555555] focus:border-[#FF6321] focus:ring-1 focus:ring-[#FF6321]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A0A0A0] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#666666] absolute left-3 top-3" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#2a2a2a] bg-[#181818] text-xs text-white placeholder-[#555555] focus:border-[#FF6321] focus:ring-1 focus:ring-[#FF6321]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#FF6321] hover:bg-[#ff7538] text-black font-extrabold text-xs shadow-md shadow-[#FF6321]/20 transition-all flex items-center justify-center space-x-2"
          >
            <span>{isSignUp ? 'Create Account' : 'Log In'}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[#262626]"></span></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-[#666666] bg-[#111111] px-2">Or</div>
          </div>

          <button
            type="button"
            onClick={handleQuickDemoGuest}
            className="w-full py-2.5 rounded-xl border border-[#2a2a2a] hover:bg-[#1a1a1a] text-[#CCCCCC] font-semibold text-xs transition-colors"
          >
            Continue as Guest / Evaluator
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
              className="text-xs font-semibold text-[#FF6321] hover:underline"
            >
              {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
