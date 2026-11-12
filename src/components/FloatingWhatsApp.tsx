import React, { useState } from 'react';
import { MessageCircle, X, Send, Sparkles, ShieldCheck } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export const FloatingWhatsApp: React.FC = () => {
  const { settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [quickMsg, setQuickMsg] = useState('');

  const waPhone = (settings.whatsapp_number || '+923001234567').replace(/[^0-9]/g, '');

  const quickOptions = [
    'Salam! Is iPhone 16 Pro Max in stock with PTA approval?',
    'What is the PTA tax difference for Samsung S24 Ultra?',
    'Can I pay via JazzCash / Easypaisa and get today dispatch?',
    'I want to place an order for delivery in Karachi / Lahore.'
  ];

  const handleSend = (text: string) => {
    const finalMsg = encodeURIComponent(text || 'Salam iBs Slayer! I would like to inquire about phone prices and availability.');
    window.open(`https://wa.me/${waPhone}?text=${finalMsg}`, '_blank');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Popover window */}
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                <MessageCircle className="w-6 h-6 fill-current text-white" />
              </div>
              <div>
                <h4 className="font-bold text-sm">iBs Slayer Live Support</h4>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
                  <span>Usually replies in ~5 mins</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 bg-zinc-950/70 space-y-3 text-xs">
            <div className="bg-zinc-800 text-zinc-200 p-3 rounded-xl rounded-tl-none border border-zinc-700/60 leading-relaxed">
              👋 Salam! Welcome to <strong>iBs Slayer Support</strong>.
              <br />
              How can we assist you today? You can choose a quick topic below or type your inquiry directly.
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                Quick Questions:
              </span>
              {quickOptions.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(opt)}
                  className="w-full text-left p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition text-[11px]"
                >
                  💬 {opt}
                </button>
              ))}
            </div>

            {/* Custom input */}
            <div className="pt-2 border-t border-zinc-800 flex items-center gap-2">
              <input
                type="text"
                value={quickMsg}
                onChange={e => setQuickMsg(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-emerald-500"
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSend(quickMsg);
                }}
              />
              <button
                onClick={() => handleSend(quickMsg)}
                className="p-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded-lg transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[10px] text-zinc-500 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Official WhatsApp: {settings.whatsapp_number}
            </div>
          </div>
        </div>
      )}

      {/* Main floating action button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 font-bold text-sm rounded-full shadow-2xl shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all duration-200"
        aria-label="Contact on WhatsApp"
      >
        <MessageCircle className="w-6 h-6 fill-current" />
        <span className="hidden sm:inline font-['Outfit'] tracking-wide">
          Order on WhatsApp
        </span>
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-300"></span>
        </span>
      </button>
    </div>
  );
};
