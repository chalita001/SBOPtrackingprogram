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
  const createGuestUser = (lang: Language = language): User => ({
    id: 999999,
    username: 'guest',
    firstName: lang === 'th' ? 'ผู้มาเยือน' : 'Guest',
    lastName: lang === 'th' ? '(ดูข้อมูลได้อย่างเดียว)' : '(View Only)',
    email: 'guest@sbop.local',
    department: 'ALL',
    position: lang === 'th' ? 'ผู้มาเยือน / Visitor' : 'Visitor (View Only)',
    role: 'guest',
    status: 'approved',
  });

  const [user, setUser] = useState<User | null>(() => {
    // If no real token is stored, start directly in Guest Mode
    const token = getAuthToken();
    if (!token) {
      return {
        id: 999999,
        username: 'guest',
        firstName: 'ผู้มาเยือน',
        lastName: '(ดูข้อมูลได้อย่างเดียว)',
        email: 'guest@sbop.local',
        department: 'ALL',
        position: 'ผู้มาเยือน / Visitor',
        role: 'guest',
        status: 'approved',
      };
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('sbop_lang') as Language) || 'th';
  });

  const t = translations[language];

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('sbop_lang', lang);
  };

  const toggleLanguage = () => {
    const nextLang = language === 'th' ? 'en' : 'th';
    setLanguage(nextLang);
    setUser((curr) => {
      if (curr && curr.role === 'guest') {
        return createGuestUser(nextLang);
      }
      return curr;
    });
  };

  const reloadUser = async () => {
    const token = getAuthToken();
    if (!token) {
      // Default to guest mode automatically
      setUser(createGuestUser());
      setLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user || data);
    } catch (err) {
      console.warn('Session expired or invalid token:', err);
      removeAuthToken();
      setUser(createGuestUser());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadUser();
  }, []);

  const login = async (credentials: any) => {
    const res = await api.login(credentials);
    setAuthToken(res.token);
    setUser(res.user);
  };

  const loginAsGuest = () => {
    removeAuthToken();
    setUser(createGuestUser());
  };

  const register = async (userData: any) => {
    return await api.register(userData);
  };

  const logout = () => {
    removeAuthToken();
    setUser(createGuestUser());
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
