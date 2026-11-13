import React, { useState } from 'react';
import { X, Sparkles, Send, ShieldCheck, Phone, CheckCircle2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { apiFetch } from '../lib/staticFallback';

interface AiPhoneAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string, param?: string) => void;
}

export const AiPhoneAdvisorModal: React.FC<AiPhoneAdvisorModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const { settings } = useSettings();
  const [query, setQuery] = useState('');
  const [budget, setBudget] = useState('Rs. 100,000 - 250,000');
  const [brand, setBrand] = useState('Any');
  const [ptaStatus, setPtaStatus] = useState('PTA Approved');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  if (!isOpen) return null;

  const budgetOptions = [
    'Under Rs. 50,000',
    'Rs. 50,000 - 100,000',
    'Rs. 100,000 - 250,000',
    'Flagship (Rs. 250,000+)'
  ];

  const brandOptions = ['Any', 'Apple', 'Samsung', 'Xiaomi', 'Google Pixel', 'Vivo', 'Infinix'];

  const handleAsk = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setAiResponse(null);

    try {
      const res = await apiFetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query || `Recommend the best smartphone for ${budget} with ${brand} preference (${ptaStatus})`,
          budget,
          preferred_brand: brand,
          pta_preference: ptaStatus
        })
      });
      const data = await res.json();
      setAiResponse(data.reply || 'No response available at the moment.');
    } catch {
      setAiResponse(
        'Our phone specialists recommend browsing our curated PTA-Approved flagship & mid-range selection, or contacting us directly on WhatsApp for real-time stock quotes.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const waPhone = (settings.whatsapp_number || '+923001234567').replace(/[^0-9]/g, '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-purple-900/80 via-indigo-900/80 to-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base font-['Outfit'] flex items-center gap-2">
                iBs Slayer AI Phone Advisor
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-500/40 uppercase font-black">
                  Gemini Powered
                </span>
              </h3>
              <p className="text-xs text-purple-200/80">
                Tailored recommendations for Pakistani market prices, taxes, and cameras.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-zinc-300">
          {/* Preset Filters */}
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Budget in PKR:
              </label>
              <select
                value={budget}
                onChange={e => setBudget(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {budgetOptions.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Brand Preference:
              </label>
              <select
                value={brand}
                onChange={e => setBrand(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {brandOptions.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                PTA Requirement:
              </label>
              <select
                value={ptaStatus}
                onChange={e => setPtaStatus(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="PTA Approved">PTA Approved (100% Tax Paid)</option>
                <option value="Non-PTA">Non-PTA (Cheaper / Pay Later)</option>
                <option value="Any">Either</option>
              </select>
            </div>
          </div>

          {/* Custom Question */}
          <form onSubmit={handleAsk} className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-400">
              Specific Questions or Use-case (Optional):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g. Best battery life for PUBG, or best camera under 150k..."
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow"
              >
                {isLoading ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Get Advice</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* AI Output Result */}
          {aiResponse && (
            <div className="p-4 rounded-2xl bg-zinc-950 border border-purple-500/30 text-zinc-200 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>iBs Slayer Specialist Recommendation:</span>
              </div>
              <div className="text-xs leading-relaxed whitespace-pre-line text-zinc-300 font-sans">
                {aiResponse}
              </div>
              <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('shop');
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-bold rounded-lg transition"
                >
                  Browse Matching Phones in Store →
                </button>
                <a
                  href={`https://wa.me/${waPhone}?text=${encodeURIComponent(`Salam! I got an AI recommendation from your website regarding ${budget} phones. Could you share available models?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  Chat with Human Agent on WhatsApp
                </a>
              </div>
            </div>
          )}

          {/* Quick FAQ info */}
          <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
            <div className="font-bold text-zinc-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Pakistani Buyer Tip:
            </div>
            <p>
              Non-PTA phones will operate on cellular networks for 60 days upon inserting a Pakistani SIM card. After 60 days, PTA customs duty must be deposited through DIRBS or Bank voucher. All "PTA Approved" phones on iBs Slayer are already 100% duty cleared.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
