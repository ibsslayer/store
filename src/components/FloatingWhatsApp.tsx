import React, { useState } from 'react';
import { MessageCircle, X, Send, ShieldCheck } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export const FloatingWhatsApp: React.FC<{ hasBottomBar?: boolean }> = ({ hasBottomBar = true }) => {
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
    const finalMsg = encodeURIComponent(
      text || 'Salam iBs Slayer! I would like to inquire about phone prices and availability.'
    );
    window.open(`https://wa.me/${waPhone}?text=${finalMsg}`, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  return (
    <div
      className={`fixed right-3 sm:right-6 z-40 flex flex-col items-end ${
        hasBottomBar ? 'bottom-20 md:bottom-6' : 'bottom-4 md:bottom-6'
      }`}
    >
      {/* Popover window — constrained cleanly inside 320px+ screens */}
      {isOpen && (
        <div className="mb-3 w-[calc(100vw-1.5rem)] max-w-sm bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-3.5 sm:p-4 text-white flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 fill-current text-white" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm truncate">iBs Slayer Live Support</h4>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping flex-shrink-0"></span>
                  <span className="truncate">Usually replies in ~5 mins</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="min-w-[38px] min-h-[38px] flex items-center justify-center hover:bg-white/20 rounded-xl transition flex-shrink-0"
              aria-label="Close WhatsApp support"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Body */}
          <div className="p-3.5 sm:p-4 bg-zinc-950/80 space-y-3 text-xs max-h-[65dvh] overflow-y-auto">
            <div className="bg-zinc-800 text-zinc-200 p-3 rounded-xl rounded-tl-none border border-zinc-700/60 leading-relaxed">
              👋 Salam! Welcome to <strong>iBs Slayer Support</strong>.
              <br />
              Choose a quick question below or type your inquiry directly.
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                Quick Questions:
              </span>
              {quickOptions.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(opt)}
                  className="w-full min-h-[40px] text-left p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition text-[11px] leading-snug"
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
                className="flex-1 min-w-0 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-emerald-500 min-h-[42px]"
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSend(quickMsg);
                }}
              />
              <button
                onClick={() => handleSend(quickMsg)}
                className="min-w-[42px] min-h-[42px] flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded-xl transition flex-shrink-0"
                aria-label="Send WhatsApp message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[10px] text-zinc-500 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              <span className="truncate">Official WhatsApp: {settings.whatsapp_number}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main floating action button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2 p-3 sm:px-4 sm:py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 font-bold text-sm rounded-full shadow-2xl shadow-emerald-500/40 active:scale-95 transition-all duration-200"
        aria-label="Contact on WhatsApp"
      >
        <MessageCircle className="w-6 h-6 fill-current" />
        <span className="hidden sm:inline font-['Outfit'] tracking-wide">
          Order on WhatsApp
        </span>
        <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-300"></span>
        </span>
      </button>
    </div>
  );
};
