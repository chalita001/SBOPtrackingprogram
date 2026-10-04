import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Globe, 
  User, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Users, 
  ClipboardCheck, 
  History, 
  AlertTriangle, 
  Mail,
  Database,
  Cloud,
  BarChart3
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenAccountInfo: () => void;
  onOpenEmailLogs: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenLogin,
  onOpenRegister,
  onOpenAccountInfo,
  onOpenEmailLogs,
}) => {
  const { user, logout, language, toggleLanguage, t } = useAuth();

  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-40 border-b border-slate-800">
      {/* Top Banner / Cloudflare Status Bar */}
      <div className="bg-slate-950 px-4 py-1.5 text-xs text-slate-400 flex flex-wrap items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-sky-400 font-medium">
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span>Cloudflare D1: <strong className="text-white">d1sbop</strong> (413b2fe9...)</span>
          </span>
          <span className="hidden sm:flex items-center gap-1.5 text-amber-400 font-medium">
            <Cloud className="w-3.5 h-3.5 text-amber-400" />
            <span>Cloudflare R2: <strong className="text-white">r2sbop</strong></span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-xs font-medium border border-slate-700"
            title="Switch Language / สลับภาษา"
          >
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span>{language === 'th' ? '🇹🇭 ภาษาไทย' : '🇬🇧 English'}</span>
            <span className="text-[10px] text-slate-400">({t.switchLanguage})</span>
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & System Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('checklist')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">SBOP System</span>
                <span className="text-[11px] px-1.5 py-0.5 rounded font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Rev. H
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden md:block">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('checklist')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'checklist'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>{t.tabChecklist}</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'history'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>{t.tabHistory}</span>
            </button>

            <button
              onClick={() => setActiveTab('defects')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'defects'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>{t.tabDefects}</span>
            </button>

            {/* Admin only Tabs: Dashboard & Account Manager */}
            {user?.role === 'admin' && (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === 'dashboard'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span>แดชบอร์ด</span>
                </button>

                <button
                  onClick={() => setActiveTab('accounts')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === 'accounts'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>{t.tabAccountManager}</span>
                </button>
              </>
            )}

            <button
              onClick={onOpenEmailLogs}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
              title="View Email Logs"
            >
              <Mail className="w-4 h-4 text-emerald-400" />
              <span className="hidden xl:inline">{t.tabEmailLogs}</span>
            </button>
          </nav>

          {/* User Profile / Auth Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={onOpenAccountInfo}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow">
                    {user.firstName.charAt(0)}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs font-semibold text-slate-200 leading-tight">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <span>{user.department}</span>
                      <span>•</span>
                      <span className="capitalize font-medium text-sky-400">{user.role}</span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={logout}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                  title={t.logout}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenLogin}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800 transition border border-slate-700"
                >
                  <LogIn className="w-4 h-4 text-sky-400" />
                  <span>{t.login}</span>
                </button>
                <button
                  onClick={onOpenRegister}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium bg-sky-600 hover:bg-sky-500 text-white transition shadow-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{t.register}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Submenu Navigation */}
        <div className="lg:hidden flex items-center justify-around py-2 border-t border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded ${
              activeTab === 'checklist' ? 'text-sky-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>ตรวจเช็ค</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded ${
              activeTab === 'history' ? 'text-sky-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <History className="w-4 h-4" />
            <span>ประวัติ</span>
          </button>
          <button
            onClick={() => setActiveTab('defects')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded ${
              activeTab === 'defects' ? 'text-sky-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>สิ่งผิดปกติ</span>
          </button>
          {user?.role === 'admin' && (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded ${
                  activeTab === 'dashboard' ? 'text-sky-400 font-semibold' : 'text-slate-400'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>แดชบอร์ด</span>
              </button>
              <button
                onClick={() => setActiveTab('accounts')}
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded ${
                  activeTab === 'accounts' ? 'text-sky-400 font-semibold' : 'text-slate-400'
                }`}
              >
                <Users className="w-4 h-4 text-indigo-400" />
                <span>สมาชิก</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
