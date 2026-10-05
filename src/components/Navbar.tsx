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
  BarChart3,
  Sliders
} from 'lucide-react';
import { TELogo } from './TELogo';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenAccountInfo: () => void;
  onOpenNotifications: () => void;
  onOpenChecklistManager?: () => void;
  unreadNotificationsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenLogin,
  onOpenRegister,
  onOpenAccountInfo,
  onOpenNotifications,
  onOpenChecklistManager,
  unreadNotificationsCount = 0,
}) => {
  const { user, logout, language, toggleLanguage, t } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperAdmin = user?.role === 'superadmin';

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
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
          {/* TE Connectivity Logo & System Title */}
          <div 
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group shrink-0" 
            onClick={() => setActiveTab(user ? 'profile' : 'checklist')}
          >
            <TELogo variant="white-text" height={28} className="sm:hidden" />
            <TELogo variant="white-text" height={34} className="hidden sm:block" />
            <div className="border-l border-slate-700/80 pl-2.5 sm:pl-3 flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white group-hover:text-[#F37021] transition">
                SBOP
              </span>
              <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-bold bg-[#F37021]/20 text-[#F37021] border border-[#F37021]/30">
                Rev. H
              </span>
            </div>
          </div>

          {/* Navigation Links (Desktop Segmented Bar) */}
          <nav className="hidden lg:flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 gap-1 shrink-0">
            {/* Profile Tab */}
            {user && (
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === 'profile'
                    ? 'bg-[#F37021] text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70 font-medium'
                }`}
              >
                <User className="w-4 h-4 shrink-0" />
                <span>{language === 'th' ? 'โปรไฟล์' : 'Profile'}</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('checklist')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'checklist'
                  ? 'bg-[#F37021] text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70 font-medium'
              }`}
            >
              <ClipboardCheck className="w-4 h-4 shrink-0" />
              <span>{language === 'th' ? 'แบบตรวจเช็ค' : 'Checklist'}</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'history'
                  ? 'bg-[#F37021] text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70 font-medium'
              }`}
            >
              <History className="w-4 h-4 shrink-0" />
              <span>{language === 'th' ? 'ประวัติการตรวจ' : 'History'}</span>
            </button>

            <button
              onClick={() => setActiveTab('defects')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'defects'
                  ? 'bg-[#F37021] text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70 font-medium'
              }`}
            >
              <AlertTriangle className={`w-4 h-4 shrink-0 ${activeTab === 'defects' ? 'text-white' : 'text-amber-400'}`} />
              <span>{language === 'th' ? 'สิ่งผิดปกติ' : 'Defects'}</span>
            </button>

            {/* Admin/Superadmin Tabs: Dashboard, Account Manager & Checklist Editor */}
            {isAdmin && (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    activeTab === 'dashboard'
                      ? 'bg-[#F37021] text-white shadow-xs font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70 font-medium'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  <span>{language === 'th' ? 'แดชบอร์ด' : 'Dashboard'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('accounts')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    activeTab === 'accounts'
                      ? 'bg-[#F37021] text-white shadow-xs font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70 font-medium'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>{language === 'th' ? 'จัดการสมาชิก' : 'Members'}</span>
                </button>

                {isSuperAdmin && (
                  <button
                    onClick={() => {
                      if (onOpenChecklistManager) {
                        onOpenChecklistManager();
                      } else {
                        setActiveTab('checklist');
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition bg-purple-950/70 hover:bg-purple-900 text-purple-300 hover:text-white border border-purple-500/40 shadow-xs"
                    title={language === 'th' ? 'ระบบจัดการหัวข้อตรวจเช็ค (Super Admin)' : 'Checklist Templates Manager (Super Admin)'}
                  >
                    <Sliders className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>{language === 'th' ? 'จัดการเช็คลิสต์' : 'Checklists'}</span>
                  </button>
                )}
              </>
            )}
          </nav>

          {/* User Profile & In-App Notification Bell */}
          <div className="flex items-center gap-3 shrink-0">
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
                  <div className="w-8 h-8 min-w-[2rem] min-h-[2rem] max-w-[2rem] max-h-[2rem] aspect-square rounded-full bg-gradient-to-tr from-[#F37021] to-[#DE5F14] text-white flex items-center justify-center font-bold text-sm shadow overflow-hidden shrink-0 border border-slate-700">
                    {user.avatarUrl ? (
                      <img src={normalizeImageUrl(user.avatarUrl)} alt="Avatar" className="w-full h-full max-w-full max-h-full object-cover aspect-square block" />
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
                      <span className={`capitalize font-semibold ${user.role === 'superadmin' ? 'text-purple-300 font-bold' : 'text-[#F37021]'}`}>
                        {user.role === 'superadmin' ? '👑 Super Admin' : user.role}
                      </span>
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
          {isAdmin && (
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
              {isSuperAdmin && (
                <button
                  onClick={() => {
                    if (onOpenChecklistManager) {
                      onOpenChecklistManager();
                    } else {
                      setActiveTab('checklist');
                    }
                  }}
                  className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg shrink-0 transition text-purple-300 hover:text-white"
                >
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <span className="text-[10px]">{language === 'th' ? 'เช็คลิสต์' : 'Templates'}</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};

