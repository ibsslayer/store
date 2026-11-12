import React from 'react';
import { ShieldCheck, Truck, RotateCcw, HelpCircle, Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface InfoPageProps {
  pageType: 'about' | 'delivery' | 'returns' | 'privacy' | 'terms' | 'faqs' | 'contact';
  onNavigate: (page: string, param?: string) => void;
}

export const InfoPages: React.FC<InfoPageProps> = ({ pageType, onNavigate }) => {
  const { settings } = useSettings();
  const waPhone = (settings.whatsapp_number || '+923001234567').replace(/[^0-9]/g, '');

  if (pageType === 'contact') {
    return (
      <div className="max-w-3xl mx-auto space-y-8 pb-16">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-white font-['Outfit']">Contact iBs Slayer Support</h1>
          <p className="text-xs text-zinc-400">
            Have questions regarding phone availability, PTA tax, or bulk orders? Reach out directly.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-xs">
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 fill-current" />
            </div>
            <h3 className="text-sm font-bold text-white">Direct WhatsApp Sales & Support</h3>
            <p className="text-zinc-400 leading-relaxed">
              Quick replies from our mobile specialists in Hafeez Centre, Lahore.
            </p>
            <a
              href={`https://wa.me/${waPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-mono font-bold text-emerald-400 text-sm hover:underline"
            >
              {settings.whatsapp_number}
            </a>
          </div>

          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Calling Helpline</h3>
            <p className="text-zinc-400 leading-relaxed">
              Available Monday to Saturday (11:00 AM – 9:00 PM PST).
            </p>
            <div className="font-mono font-bold text-blue-400 text-sm">
              {settings.contact_number}
            </div>
          </div>

          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-3 sm:col-span-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Physical Store Location</h3>
            <p className="text-zinc-300">
              {settings.business_address}
            </p>
            <div className="text-[11px] text-zinc-500">
              Walk-in inspections and customer pickup available during normal business hours.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pageType === 'faqs') {
    const faqs = settings.policies?.faqs || [
      {
        question: 'Are all smartphones on iBs Slayer PTA Approved?',
        answer: 'Yes! Every device labelled "PTA approved" is 100% customs tax paid and verified on the official PTA DIRBS database. You can check the IMEI by sending SMS to 8484.'
      },
      {
        question: 'What does Non-PTA mean?',
        answer: 'Non-PTA phones provide 60 days of cellular SIM functionality upon first use in Pakistan. After 60 days, Wi-Fi continues to work, but cellular calling requires paying the PTA duty via DIRBS.'
      },
      {
        question: 'How do you accept JazzCash and Easypaisa?',
        answer: 'Select JazzCash or Easypaisa at checkout. Transfer the total order amount to our official till/account number, take a screenshot of the receipt showing the Transaction ID, and upload it on the confirmation page.'
      },
      {
        question: 'How fast is nationwide delivery in Pakistan?',
        answer: 'Major metropolitan areas (Lahore, Karachi, Islamabad, Rawalpindi) receive parcels within 24 to 48 hours. Other cities take 2 to 4 business days via TCS Express, Leopards, or Trax.'
      }
    ];

    return (
      <div className="max-w-3xl mx-auto space-y-8 pb-16">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-white font-['Outfit']">Frequently Asked Questions (FAQs)</h1>
          <p className="text-xs text-zinc-400">
            Answers to common questions regarding PTA taxes, genuine warranty, payments, and delivery.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div key={i} className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{f.question}</span>
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed pl-6">
                {f.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const titles: Record<string, string> = {
    about: 'About iBs Slayer Pakistan',
    delivery: 'Nationwide Delivery & Shipping Policy',
    returns: 'Warranty & 7-Day Replacement Policy',
    privacy: 'Privacy & Data Protection Policy',
    terms: 'Terms & Conditions of Service'
  };

  const contentMap: Record<string, string> = {
    about: settings.policies?.about_us || 'iBs Slayer is Pakistan’s leading electronics and smartphone retailer.',
    delivery: settings.policies?.shipping_policy || 'Express delivery to 400+ cities across Pakistan.',
    returns: settings.policies?.return_policy || '7-day replacement warranty for manufacturing defects.',
    privacy: settings.policies?.privacy_policy || 'We protect all Pakistani customer contact and delivery details.',
    terms: settings.policies?.terms_conditions || 'iBs Slayer terms of purchase and warranty compliance.'
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      <div className="pb-4 border-b border-zinc-800">
        <h1 className="text-3xl font-black text-white font-['Outfit']">
          {titles[pageType] || 'Information'}
        </h1>
      </div>

      <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line space-y-4 shadow-xl">
        {contentMap[pageType]}
      </div>
    </div>
  );
};
