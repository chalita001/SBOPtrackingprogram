import React from 'react';
import { useAuth } from '../context/AuthContext';
import { normalizeImageUrl } from '../services/api';
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
  Bell,
  Database,
  Cloud,
  BarChart3
} from 'lucide-react';
import { TELogo } from './TELogo';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenAccountInfo: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenLogin,
  onOpenRegister,
  onOpenAccountInfo,
  onOpenNotifications,
  unreadNotificationsCount = 0,
}) => {
  const { user, logout, language, toggleLanguage, t } = useAuth();

  return (
    <header className="bg-[#1A1D21] text-white shadow-xl sticky top-0 z-40 border-b border-slate-800">
      {/* Top Banner / Corporate TE Connectivity Status Bar */}
      <div className="bg-[#121518] px-4 py-1.5 text-xs text-slate-400 flex flex-wrap items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 text-[#F37021] font-extrabold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-[#F37021] animate-pulse inline-block"></span>
            <span>TE CONNECTIVITY</span>
          </span>
          <span className="hidden md:flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-600">•</span>
            <span>Safety Behavioral Observation Process (SBOP)</span>
          </span>
          <span className="hidden sm:flex items-center gap-1.5 text-slate-400 font-medium">
            <Database className="w-3.5 h-3.5 text-[#F37021]" />
            <span>Cloudflare D1: <strong className="text-white">d1sbop</strong></span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-xs font-medium border border-slate-700"
            title="Switch Language / สลับภาษา"
          >
            <Globe className="w-3.5 h-3.5 text-[#F37021]" />
            <span>{language === 'th' ? '🇹🇭 ภาษาไทย' : '🇬🇧 English'}</span>
            <span className="text-[10px] text-slate-400">({t.switchLanguage})</span>
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* TE Connectivity Logo & System Title */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer group shrink-0" onClick={() => setActiveTab(user ? 'profile' : 'checklist')}>
            <TELogo variant="white-text" height={28} className="sm:hidden" />
            <TELogo variant="white-text" height={36} className="hidden sm:block" />
            <div className="border-l border-slate-700/90 pl-2.5 sm:pl-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white group-hover:text-[#F37021] transition">
                  SBOP
                </span>
                <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-bold bg-[#F37021]/20 text-[#F37021] border border-[#F37021]/30">
                  Rev. H
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 hidden md:block">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {/* Profile Tab */}
            {user && (
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'profile'
                    ? 'bg-[#F37021] text-white shadow-md shadow-[#F37021]/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                <span>{language === 'en' ? 'Profile' : 'โปรไฟล์'}</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('checklist')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'checklist'
                  ? 'bg-[#F37021] text-white shadow-md shadow-[#F37021]/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>{t.tabChecklist}</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'history'
                  ? 'bg-[#F37021] text-white shadow-md shadow-[#F37021]/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>{t.tabHistory}</span>
            </button>

            <button
              onClick={() => setActiveTab('defects')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'defects'
                  ? 'bg-[#F37021] text-white shadow-md shadow-[#F37021]/30'
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
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    activeTab === 'dashboard'
                      ? 'bg-[#F37021] text-white shadow-md shadow-[#F37021]/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>{t.tabDashboard}</span>
                </button>

                <button
                  onClick={() => setActiveTab('accounts')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    activeTab === 'accounts'
                      ? 'bg-[#F37021] text-white shadow-md shadow-[#F37021]/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>{t.tabAccountManager}</span>
                </button>
              </>
            )}
          </nav>

          {/* User Profile & In-App Notification Bell */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Notification Bell Button */}
                <button
                  onClick={onOpenNotifications}
                  className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  title={language === 'en' ? 'In-App Notifications' : 'การแจ้งเตือน'}
                >
                  <Bell className="w-5 h-5 text-amber-400" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-black flex items-center justify-center animate-pulse">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {/* Profile Pill */}
                <button
                  onClick={() => setActiveTab('profile')}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#F37021] to-[#DE5F14] text-white flex items-center justify-center font-bold text-sm shadow overflow-hidden shrink-0 border border-slate-700">
                    {user.avatarUrl ? (
                      <img src={normalizeImageUrl(user.avatarUrl)} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      user.firstName?.charAt(0) || 'U'
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs font-semibold text-slate-200 leading-tight">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <span>@{user.username || user.email?.split('@')[0]}</span>
                      <span>•</span>
                      <span className="capitalize font-semibold text-[#F37021]">{user.role}</span>
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
                  <LogIn className="w-4 h-4 text-[#F37021]" />
                  <span>{t.login}</span>
                </button>
                <button
                  onClick={onOpenRegister}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium bg-[#F37021] hover:bg-[#DE5F14] text-white transition shadow-md shadow-[#F37021]/30 font-semibold"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{t.register}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Submenu Navigation */}
        <div className="lg:hidden flex items-center gap-1 py-1.5 px-1 border-t border-slate-800 text-xs overflow-x-auto no-scrollbar">
          {user && (
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg shrink-0 transition ${
                activeTab === 'profile' ? 'text-[#F37021] bg-orange-500/10 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-4 h-4" />
              <span className="text-[10px]">{language === 'th' ? 'โปรไฟล์' : 'Profile'}</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('checklist')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg shrink-0 transition ${
              activeTab === 'checklist' ? 'text-[#F37021] bg-orange-500/10 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span className="text-[10px]">{language === 'th' ? 'ตรวจเช็ค' : 'Checklist'}</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg shrink-0 transition ${
              activeTab === 'history' ? 'text-[#F37021] bg-orange-500/10 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span className="text-[10px]">{language === 'th' ? 'ประวัติ' : 'History'}</span>
          </button>
          <button
            onClick={() => setActiveTab('defects')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg shrink-0 transition ${
              activeTab === 'defects' ? 'text-[#F37021] bg-orange-500/10 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-[10px]">{language === 'th' ? 'สิ่งผิดปกติ' : 'Defects'}</span>
          </button>
          {user?.role === 'admin' && (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg shrink-0 transition ${
                  activeTab === 'dashboard' ? 'text-[#F37021] bg-orange-500/10 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px]">{t.tabDashboard}</span>
              </button>
              <button
                onClick={() => setActiveTab('accounts')}
                className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg shrink-0 transition ${
                  activeTab === 'accounts' ? 'text-[#F37021] bg-orange-500/10 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4 text-orange-400" />
                <span className="text-[10px]">{language === 'th' ? 'สมาชิก' : 'Members'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

