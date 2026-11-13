import React, { createContext, useContext, useState, useEffect } from 'react';
import { WebsiteSettings, R2StorageStatus } from '../types';
import { apiFetch } from '../lib/staticFallback';

interface SettingsContextType {
  settings: WebsiteSettings;
  storageStatus: R2StorageStatus | null;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  refreshStorageStatus: () => Promise<void>;
}

const defaultSettings: WebsiteSettings = {
  store_name: 'iBs Slayer',
  store_logo_url: '',
  tagline: "Pakistan's #1 Destination for PTA-Approved Smartphones & Gadgets",
  contact_number: '+92 (042) 3578-9000',
  whatsapp_number: '+923001234567',
  support_email: 'support@ibsslayer.pk',
  business_address: 'Suite 42-45, 3rd Floor, Hafeez Centre, Main Boulevard Gulberg III, Lahore, Pakistan',
  announcement_bar: '⚡ Flash Sale Live: Up to Rs. 25,000 Off on Flagship Phones + Free Delivery Nationwide on orders above Rs. 50,000! Official PTA Approved Guarantee.',
  free_shipping_threshold: 50000,
  standard_shipping_rate: 450,
  jazzcash_details: {
    enabled: true,
    title: 'iBs Slayer Technologies',
    account_number: '03001234567',
    mobile_number: '03001234567',
    instructions: 'Send money to our JazzCash account and upload screenshot with TID.'
  },
  easypaisa_details: {
    enabled: true,
    title: 'iBs Slayer Official Store',
    account_number: '03459876543',
    mobile_number: '03459876543',
    instructions: 'Send payment via Easypaisa to 0345-9876543 and upload receipt.'
  },
  hero_banners: [],
  policies: {
    about_us: '',
    shipping_policy: '',
    return_policy: '',
    privacy_policy: '',
    terms_conditions: '',
    faqs: []
  }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<WebsiteSettings>(defaultSettings);
  const [storageStatus, setStorageStatus] = useState<R2StorageStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      const res = await apiFetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const refreshStorageStatus = async () => {
    try {
      const res = await apiFetch('/api/storage/status');
      if (res.ok) {
        const data = await res.json();
        setStorageStatus(data);
      }
    } catch (err) {
      console.error('Error fetching storage status:', err);
    }
  };

  useEffect(() => {
    Promise.all([refreshSettings(), refreshStorageStatus()]).finally(() => {
      setIsLoading(false);
    });
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        storageStatus,
        isLoading,
        refreshSettings,
        refreshStorageStatus
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};
