import React, { useState } from 'react';
import { LogIn, UserPlus, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CustomerAuthPageProps {
  onNavigate: (page: string, param?: string) => void;
}

export const CustomerAuthPage: React.FC<CustomerAuthPageProps> = ({ onNavigate }) => {
  const { login, register, isLoading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegister) {
      if (!fullName || !email || !phone || !password) {
        return setError('Please fill all required fields.');
      }
      const res = await register(fullName, email, phone, whatsapp || phone, password);
      if (res.success) {
        onNavigate('account');
      } else {
        setError(res.error || 'Registration failed.');
      }
    } else {
      if (!email || !password) {
        return setError('Please enter your email and password.');
      }
      const res = await login(email, password);
      if (res.success) {
        onNavigate('account');
      } else {
        setError(res.error || 'Invalid email or password.');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 pb-20">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center font-black text-sm">
            iBs
          </div>
          <h2 className="text-2xl font-black text-white font-['Outfit']">
            {isRegister ? 'Create Customer Account' : 'Welcome to iBs Slayer'}
          </h2>
          <p className="text-xs text-zinc-400">
            {isRegister
              ? 'Save Pakistani delivery addresses and track lifetime warranty'
              : 'Sign in to view orders, warranties, and fast checkout'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <>
              <div>
                <label className="block font-semibold text-zinc-300 mb-1.5">
                  Full Name <span className="text-rose-400">*</span>:
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Kamran Ali"
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1.5">
                  Mobile Number <span className="text-rose-400">*</span>:
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="0300-1234567"
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1.5">
                  WhatsApp Number:
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white font-mono"
                />
              </div>
            </>
          )}

          <div>
            <label className="block font-semibold text-zinc-300 mb-1.5">
              Email Address <span className="text-rose-400">*</span>:
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 mb-1.5">
              Password <span className="text-rose-400">*</span>:
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition active:scale-95"
          >
            {isLoading ? (
              <span>Processing...</span>
            ) : isRegister ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-zinc-800 text-center text-xs text-zinc-400">
          {isRegister ? (
            <span>
              Already have an account?{' '}
              <button
                onClick={() => { setIsRegister(false); setError(null); }}
                className="text-emerald-400 font-bold hover:underline"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account?{' '}
              <button
                onClick={() => { setIsRegister(true); setError(null); }}
                className="text-emerald-400 font-bold hover:underline"
              >
                Register Here
              </button>
            </span>
          )}
        </div>

        <div className="text-center pt-2">
          <button
            onClick={() => onNavigate('admin-login')}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 transition flex items-center justify-center gap-1 mx-auto"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Store Administrator Login Portal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
