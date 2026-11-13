import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { apiFetch } from '../lib/staticFallback';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  adminLogin: (email: string, pass: string) => Promise<{ success: boolean; requirePasswordChange?: boolean; message?: string; error?: string }>;
  register: (fullName: string, email: string, phone: string, whatsapp: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (newPass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('pkm_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pkm_token'));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (token) {
      apiFetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setUser(data);
            localStorage.setItem('pkm_user', JSON.stringify(data));
          } else {
            logout();
          }
        })
        .catch(() => {});
    }
  }, [token]);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      setToken(data.token);
      setUser(data.profile);
      localStorage.setItem('pkm_token', data.token);
      localStorage.setItem('pkm_user', JSON.stringify(data.profile));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const adminLogin = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Admin login failed');

      setToken(data.token);
      setUser(data.profile);
      localStorage.setItem('pkm_token', data.token);
      localStorage.setItem('pkm_user', JSON.stringify(data.profile));

      return {
        success: true,
        requirePasswordChange: data.requirePasswordChange,
        message: data.message
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (fullName: string, email: string, phone: string, whatsapp: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          whatsapp,
          password: pass
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      setToken(data.token);
      setUser(data.profile);
      localStorage.setItem('pkm_token', data.token);
      localStorage.setItem('pkm_user', JSON.stringify(data.profile));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (newPass: string) => {
    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ new_password: newPass })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');

      if (user) {
        const updated = { ...user, must_change_password: false };
        setUser(updated);
        localStorage.setItem('pkm_user', JSON.stringify(updated));
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('pkm_token');
    localStorage.removeItem('pkm_user');
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem('pkm_user', JSON.stringify(updated));
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAdmin,
        isLoading,
        login,
        adminLogin,
        register,
        changePassword,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
