import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, setAuthToken, removeAuthToken } from '../services/api';
import { Language, translations } from '../i18n/translations';

export interface User {
  id: number;
  username?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email: string;
  department: string;
  position: string;
  responsibleArea?: string;
  avatarUrl?: string;
  role: 'superadmin' | 'admin' | 'layer1' | 'layer2' | 'layer3' | 'manager' | 'supervisor' | 'leader' | 'inspector' | 'staff' | 'guest';
  status: 'pending' | 'approved' | 'rejected';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  language: Language;
  t: typeof translations['th'];
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  login: (credentials: any) => Promise<void>;
  loginAsGuest: () => void;
  register: (userData: any) => Promise<any>;
  logout: () => void;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('sbop_lang') as Language) || 'th';
  });

  const t = translations[language];

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('sbop_lang', lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'th' ? 'en' : 'th');
  };

  const reloadUser = async () => {
    // Check if in guest mode
    if (localStorage.getItem('sbop_guest_mode') === 'true') {
      setUser({
        id: 999999,
        username: 'guest',
        firstName: language === 'th' ? 'ผู้มาเยือน' : 'Guest',
        lastName: language === 'th' ? '(ดูข้อมูลได้อย่างเดียว)' : '(View Only)',
        email: 'guest@sbop.local',
        department: 'ALL',
        position: language === 'th' ? 'ผู้มาเยือน / Visitor' : 'Visitor (View Only)',
        role: 'guest',
        status: 'approved',
      });
      setLoading(false);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user || data);
    } catch (err) {
      console.warn('Session expired or invalid token:', err);
      removeAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadUser();
  }, []);

  const login = async (credentials: any) => {
    localStorage.removeItem('sbop_guest_mode');
    const res = await api.login(credentials);
    setAuthToken(res.token);
    setUser(res.user);
  };

  const loginAsGuest = () => {
    localStorage.setItem('sbop_guest_mode', 'true');
    removeAuthToken();
    setUser({
      id: 999999,
      username: 'guest',
      firstName: language === 'th' ? 'ผู้มาเยือน' : 'Guest',
      lastName: language === 'th' ? '(ดูข้อมูลได้อย่างเดียว)' : '(View Only)',
      email: 'guest@sbop.local',
      department: 'ALL',
      position: language === 'th' ? 'ผู้มาเยือน / Visitor' : 'Visitor (View Only)',
      role: 'guest',
      status: 'approved',
    });
  };

  const register = async (userData: any) => {
    localStorage.removeItem('sbop_guest_mode');
    return await api.register(userData);
  };

  const logout = () => {
    localStorage.removeItem('sbop_guest_mode');
    removeAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        language,
        t,
        setLanguage,
        toggleLanguage,
        login,
        loginAsGuest,
        register,
        logout,
        reloadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
