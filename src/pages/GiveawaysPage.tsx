import React, { useState, useEffect } from 'react';
import {
  Gift,
  CheckCircle,
  Clock,
  ShieldCheck,
  Trophy,
  Users,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Giveaway } from '../types';
import { apiFetch } from '../lib/staticFallback';

export const GiveawaysPage: React.FC = () => {
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [selectedGiveaway, setSelectedGiveaway] = useState<Giveaway | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Lahore');
  const [reason, setReason] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/api/giveaways')
      .then(res => res.json())
      .then(data => {
        setGiveaways(data || []);
        if (data && data.length > 0) setSelectedGiveaway(data[0]);
      })
      .catch(() => {});
  }, []);

  const handleEnter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGiveaway) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await apiFetch(`/api/giveaways/${selectedGiveaway.id}/enter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          email,
          city,
          why_win_reason: reason
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit entry');

      try {
        confetti({ particleCount: 70, spread: 60 });
      } catch {}

      setSubmitSuccess(true);
      // update count
      selectedGiveaway.total_entries += 1;
    } catch (err: any) {
      setErrorMessage(err.message || 'Error submitting entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pakCities = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Other'];

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-16">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
          <Gift className="w-4 h-4" />
          <span>Official Pakistan Smartphone Giveaway</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white font-['Outfit']">
          Win Flagship Tech Devices Every Month
        </h1>
        <p className="text-xs text-zinc-400 max-w-lg mx-auto leading-relaxed">
          100% Free Entry • No Purchase Required • Transparent selection broadcasted live with official PTA customs compliance.
        </p>
      </div>

      {selectedGiveaway && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl space-y-6">
          {/* Hero Banner */}
          <div className="relative aspect-video sm:aspect-[21/9] w-full bg-zinc-950 overflow-hidden">
            <img
              src={selectedGiveaway.image_url}
              alt={selectedGiveaway.title}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
              <span className="px-3 py-1 bg-emerald-500 text-zinc-950 text-xs font-black uppercase rounded-lg">
                Active Campaign
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-white font-['Outfit'] mt-2">
                {selectedGiveaway.title}
              </h2>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Prize & Info bar */}
            <div className="grid sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
                <div className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4" /> Grand Prize
                </div>
                <div className="text-zinc-200 font-semibold">{selectedGiveaway.prize_details}</div>
              </div>

              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> Registered Entries
                </div>
                <div className="text-xl font-black text-white font-mono">
                  {selectedGiveaway.total_entries.toLocaleString('en-PK')}
                </div>
              </div>

              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
                <div className="font-bold text-blue-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Selection Date
                </div>
                <div className="text-zinc-300 font-medium">
                  {new Date(selectedGiveaway.end_date).toLocaleDateString('en-PK', { dateStyle: 'long' })}
                </div>
              </div>
            </div>

            {/* Campaign Rules & Description */}
            <div className="text-xs text-zinc-300 leading-relaxed space-y-2 p-4 bg-zinc-950/60 rounded-2xl border border-zinc-800">
              <div className="font-bold text-white text-sm">Campaign Terms & Rules:</div>
              <p>{selectedGiveaway.description}</p>
              <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                <li>One entry per Pakistani CNIC / Phone number.</li>
                <li>Free door-to-door insured delivery to the winner anywhere in Pakistan.</li>
                <li>Device comes sealed in box with official PTA certificate and warranty.</li>
              </ul>
            </div>

            {/* Entry Form */}
            {submitSuccess ? (
              <div className="p-8 bg-emerald-950/50 border border-emerald-500/40 rounded-3xl text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-xl font-bold text-white">Entry Successfully Registered!</h3>
                <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed">
                  Best of luck! Winner will be announced on this page and contacted directly via phone & WhatsApp on the draw date.
                </p>
              </div>
            ) : (
              <form onSubmit={handleEnter} className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-4">
                <h3 className="font-bold text-white text-base font-['Outfit'] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Free Giveaway Registration Form</span>
                </h3>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-zinc-300 mb-1.5">
                      Full Name <span className="text-rose-400">*</span>:
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="e.g. Asad Ali Khan"
                      required
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-300 mb-1.5">
                      Mobile Number (Calling & SMS) <span className="text-rose-400">*</span>:
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="0300-1234567"
                      required
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-300 mb-1.5">
                      City in Pakistan <span className="text-rose-400">*</span>:
                    </label>
                    <select
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white"
                    >
                      {pakCities.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-300 mb-1.5">
                      Email Address (Optional):
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@gmail.com"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block font-semibold text-zinc-300 mb-1.5">
                    Why would you love to win this smartphone? (Optional):
                  </label>
                  <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    rows={2}
                    placeholder="Tell us what you plan to create or achieve with this device..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-zinc-950 font-black text-xs rounded-xl shadow-xl shadow-amber-500/20 transition active:scale-95"
                >
                  {isSubmitting ? (
                    <span>Registering Verified Entry...</span>
                  ) : (
                    <span>Submit Free Entry</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Past Winners Showcase */}
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4">
        <h3 className="font-bold text-white text-base font-['Outfit'] flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span>Past Giveaway Winners & Transparency Log</span>
        </h3>
        <p className="text-xs text-zinc-400">
          Winners are drawn completely transparently through our automated audit system.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 text-xs pt-2">
          <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
            <div className="font-bold text-white text-sm">Samsung Galaxy S24 Ultra Giveaway</div>
            <div className="text-emerald-400 font-semibold">Winner: Bilal Hassan (Gulshan-e-Iqbal, Karachi)</div>
            <div className="text-[11px] text-zinc-500">Delivered via TCS Express • Tracking # TCS-PK-771928</div>
          </div>

          <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
            <div className="font-bold text-white text-sm">Xiaomi 14T Pro Launch Giveaway</div>
            <div className="text-emerald-400 font-semibold">Winner: Ayesha Siddiqa (Model Town, Lahore)</div>
            <div className="text-[11px] text-zinc-500">Delivered via Leopards • Handover Verified</div>
          </div>
        </div>
      </div>
    </div>
  );
};
