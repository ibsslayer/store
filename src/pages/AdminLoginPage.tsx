import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  AlertCircle,
  KeyRound,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isStaticShowcaseMode } from '../lib/staticFallback';

interface AdminLoginPageProps {
  onNavigate: (page: string, param?: string) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onNavigate }) => {
  const { adminLogin, changePassword, isLoading } = useAuth();

  const [email, setEmail] = useState('ibsslayer@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = await adminLogin(email.trim(), password);
    if (!res.success) {
      setError(res.error || 'Invalid administrator credentials');
      return;
    }

    if (res.requirePasswordChange) {
      setMustChangePassword(true);
    } else {
      onNavigate('admin');
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      return setError('New password must be at least 8 characters long');
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match');
    }

    const res = await changePassword(newPassword);
    if (res.success) {
      setPasswordChangeSuccess(true);
      setTimeout(() => {
        onNavigate('admin');
      }, 1500);
    } else {
      setError(res.error || 'Failed to update password');
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-16 pb-16 sm:pb-24">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl space-y-5 sm:space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
            Store Administrator Portal
          </h2>
          <p className="text-xs text-zinc-400">
            Authorized administrative access for store operations, inventory, and Backblaze B2 storage.
          </p>
        </div>

        {isStaticShowcaseMode() && (
          <div className="p-3.5 bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs rounded-xl leading-relaxed">
            <strong>GitHub Pages Static Mode:</strong> Storefront browsing works here, while Admin sign-in requires connecting your live Node.js backend via the <code>VITE_API_BASE_URL</code> repository variable.
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!mustChangePassword ? (
          <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1.5">
                Administrator Email Address:
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ibsslayer@gmail.com"
                  required
                  className="w-full min-h-[44px] bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1.5">
                Secure Administrator Password:
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full min-h-[44px] bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
              </div>
            </div>

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-[11px] text-zinc-400 space-y-2">
              <div className="font-bold text-zinc-300 flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  First-Login Setup Credentials:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('ibsslayer@gmail.com');
                    setPassword('2026');
                  }}
                  className="min-h-[30px] px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-[10px] font-bold rounded-lg"
                >
                  Fill Initial Setup (2026)
                </button>
              </div>
              <div className="space-y-0.5 font-mono text-[10px] text-zinc-300 break-all">
                <div>Email: <strong className="text-white">ibsslayer@gmail.com</strong></div>
                <div>Initial Setup Only: <strong className="text-emerald-400">2026</strong> or <strong className="text-emerald-400">ChangeMeOnFirstLogin2026!</strong></div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[46px] py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition active:scale-95"
            >
              {isLoading ? (
                <span>Authenticating Administrator...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Access Admin Dashboard</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-xs animate-in fade-in">
            <div className="p-3 bg-amber-950/40 border border-amber-500/50 rounded-xl text-amber-200 text-xs">
              <strong>Action Required:</strong> Initial temporary administrator password detected. Set a permanent secure password before proceeding.
            </div>

            {passwordChangeSuccess ? (
              <div className="p-6 bg-emerald-950/50 border border-emerald-500/40 rounded-2xl text-center space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-white text-sm">Password Updated Successfully!</h4>
                <p className="text-xs text-zinc-400">Redirecting to administrator dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1.5">
                    Enter New Secure Password:
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    required
                    className="w-full min-h-[44px] bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1.5">
                    Confirm New Password:
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    className="w-full min-h-[44px] bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[46px] py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl transition"
                >
                  Save New Password &amp; Continue
                </button>
              </form>
            )}
          </div>
        )}

        <div className="pt-2 border-t border-zinc-800 text-center">
          <button
            onClick={() => onNavigate('home')}
            className="min-h-[38px] text-xs text-zinc-400 hover:text-white transition"
          >
            ← Return to Customer Storefront
          </button>
        </div>
      </div>
    </div>
  );
};
