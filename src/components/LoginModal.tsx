import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, X, Lock, AlertCircle, Eye } from 'lucide-react';
import { TELogo } from './TELogo';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
  onGuestLoginSuccess?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSwitchToRegister,
  onGuestLoginSuccess,
}) => {
  const { login, loginAsGuest, t, language } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ username, password });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-[#1E2229] border-b border-slate-800 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TELogo variant="mark" height={34} />
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span>{t.login}</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#F37021]/20 text-[#F37021] border border-[#F37021]/30">
                  SBOP
                </span>
              </h2>
              <p className="text-xs text-slate-400">{t.loginSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="leading-snug">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                {language === 'en' ? 'Username' : 'ชื่อผู้ใช้งาน (Username)'}
              </label>
              <div className="relative">
                <span className="w-4 h-4 text-slate-400 font-bold absolute left-3.5 top-2.5">@</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin หรือ usertester"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F37021] focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                {t.password}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F37021] focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#F37021] hover:bg-[#DE5F14] text-white font-semibold rounded-xl shadow-md shadow-[#F37021]/20 text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? t.signingIn : t.login}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-semibold">
                {language === 'th' ? 'หรือเข้าชมแบบผู้มาเยือน' : 'or continue as guest'}
              </span>
            </div>
          </div>

          {/* Guest Login Button (User requirement 3) */}
          <button
            type="button"
            onClick={() => {
              loginAsGuest();
              if (onGuestLoginSuccess) onGuestLoginSuccess();
              onClose();
            }}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-sm border border-slate-700 hover:border-slate-600 group"
          >
            <Eye className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
            <span>{language === 'th' ? 'เข้าสู่ระบบสำหรับผู้มาเยือน (ดูข้อมูลได้อย่างเดียว)' : 'Login as Guest (View-Only Mode)'}</span>
          </button>
          <p className="text-[11px] text-center text-slate-400 mt-1.5 leading-tight">
            {language === 'th' ? '*สำหรับผู้มาเยือน: ดูหน้าแดชบอร์ดรวมทุกแผนก และหน้ารายการปัญหาได้ (ไม่สามารถแก้ไขข้อมูลได้)' : '*View-only: Access combined dashboards & defects across all departments.'}
          </p>

          <div className="mt-5 text-center text-xs text-slate-600">
            {t.noAccountYet}{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-[#F37021] hover:text-[#DE5F14] font-bold underline transition ml-1"
            >
              {t.register}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
