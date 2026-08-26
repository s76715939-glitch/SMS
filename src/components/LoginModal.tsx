import React, { useState } from 'react';
import { Lock, User, ShieldCheck, Sparkles, AlertCircle, ArrowRight, Wallet } from 'lucide-react';

interface LoginModalProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export function LoginModal({ onLoginSuccess }: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid credentials');
      }

      localStorage.setItem('mfs_auth_token', data.token);
      localStorage.setItem('mfs_auth_user', JSON.stringify(data.user));
      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 sm:p-6 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-2xl">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
            <Wallet className="h-8 w-8" />
          </div>
          <h2 className="mt-5 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">MFS Gateway</h2>
          <p className="mt-1.5 text-xs sm:text-sm font-medium text-slate-500">
            Secure Money Received & SMS Verification Portal
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mt-6 flex items-center space-x-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 animate-in shake">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden transition shadow-xs"
                placeholder="Enter admin username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden transition shadow-xs"
                placeholder="Enter password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center space-x-2 rounded-2xl bg-emerald-600 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 transition"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        {/* Security Badge */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <div className="inline-flex items-center space-x-2 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>JWT Authenticated & Encrypted Session</span>
          </div>
        </div>
      </div>
    </div>
  );
}

