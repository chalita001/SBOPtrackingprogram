import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { ProfileView } from './components/ProfileView';
import { InspectionChecklist } from './components/InspectionChecklist';
import { InspectionHistory } from './components/InspectionHistory';
import { DefectTracker } from './components/DefectTracker';
import { AccountManager } from './components/AccountManager';
import { AdminDashboard } from './components/AdminDashboard';
import { LoginModal } from './components/LoginModal';
import { RegisterModal } from './components/RegisterModal';
import { AccountInfoModal } from './components/AccountInfoModal';
import { NotificationsModal } from './components/NotificationsModal';
import { ChecklistManagerModal } from './components/ChecklistManagerModal';
import { ShieldCheck, AlertCircle, Database, Cloud, Eye } from 'lucide-react';

const MainContent: React.FC = () => {
  const { user, logout, loading, language, t } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modals
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [showRegister, setShowRegister] = useState<boolean>(false);
  const [showAccountInfo, setShowAccountInfo] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showChecklistManager, setShowChecklistManager] = useState<boolean>(false);
  const [unreadNotifs, setUnreadNotifs] = useState<number>(0);

  // Load unread notification count
  const refreshUnreadCount = async () => {
    if (!user) return;
    try {
      const data = await api.getNotifications();
      setUnreadNotifs(data.unreadCount || 0);
    } catch (err) {
      console.warn('Failed to load notifications count:', err);
    }
  };

  useEffect(() => {
    if (user) {
      if (user.role === 'guest') {
        setActiveTab('dashboard');
      } else {
        refreshUnreadCount();
        setActiveTab('profile');
      }
    } else {
      setActiveTab('dashboard');
    }
  }, [user?.id, user?.role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#14171C] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-[#F37021] border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="font-bold text-lg">{t.systemLoading}</div>
        <div className="text-xs text-slate-400 mt-1">TE Connectivity • Cloudflare D1 & R2 Ready</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLogin={() => setShowLogin(true)}
        onOpenRegister={() => setShowRegister(true)}
        onOpenAccountInfo={() => setShowAccountInfo(true)}
        onOpenNotifications={() => setShowNotifications(true)}
        onOpenChecklistManager={() => setShowChecklistManager(true)}
        unreadNotificationsCount={unreadNotifs}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Guest Mode Banner (User requirement 3) */}
        {user && user.role === 'guest' && (
          <div className="mb-5 p-3.5 bg-gradient-to-r from-slate-900 via-[#1E2229] to-slate-900 border border-emerald-500/50 rounded-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md animate-fadeIn">
            <div className="flex items-center gap-2.5 text-xs">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
                <Eye className="w-4 h-4" />
              </span>
              <div className="leading-snug">
                <span className="font-extrabold text-emerald-300">
                  {language === 'th' ? 'โหมดผู้มาเยือน (Guest / View-Only Mode)' : 'Guest / View-Only Mode'}
                </span>
                <span className="text-slate-300 ml-1.5 block sm:inline">
                  {language === 'th' 
                    ? '— คุณสามารถดูแดชบอร์ดสถิติรวมทุกแผนก และรายการสิ่งผิดปกติได้ทั้งหมด (ดูได้อย่างเดียว ไม่สามารถแก้ไขหรือบันทึกข้อมูลได้)'
                    : '— View-only access to combined executive dashboard & defects across all departments.'}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                setShowLogin(true);
              }}
              className="px-3 py-1.5 bg-[#F37021] hover:bg-[#DE5F14] text-white rounded-xl text-xs font-bold transition shadow-xs shrink-0 whitespace-nowrap"
            >
              {language === 'th' ? 'เข้าสู่ระบบด้วยบัญชีจริง' : 'Login to Real Account'}
            </button>
          </div>
        )}

        {/* User Status Notice if pending approval */}
        {user && user.status === 'pending' && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                {t.pendingApprovalNotice.replace('{0}', user.username ? `@${user.username}` : user.email)}
              </span>
            </div>
            <button
              onClick={() => setShowAccountInfo(true)}
              className="px-3 py-1 bg-amber-200/70 hover:bg-amber-200 rounded-lg font-bold transition text-amber-900"
            >
              {t.viewProfileBtn}
            </button>
          </div>
        )}

        {/* View Switcher */}
        {/* Profile Landing View */}
        {activeTab === 'profile' && user && (
          <ProfileView
            onGoToChecklist={() => setActiveTab('checklist')}
            onOpenAccountInfo={() => setShowAccountInfo(true)}
            onNavigateToHistory={() => setActiveTab('history')}
            onNavigateToDefects={() => setActiveTab('defects')}
          />
        )}

        {activeTab === 'checklist' && (
          <InspectionChecklist onSuccessSave={() => setActiveTab('history')} />
        )}

        {activeTab === 'history' && <InspectionHistory />}

        {activeTab === 'defects' && <DefectTracker />}

        {activeTab === 'dashboard' && (
          <AdminDashboard
            onNavigateToAccounts={() => setActiveTab('accounts')}
            onNavigateToDefects={() => setActiveTab('defects')}
          />
        )}

        {activeTab === 'accounts' && (user?.role === 'admin' || user?.role === 'superadmin') && <AccountManager />}
      </main>

      {/* Footer */}
      <footer className="bg-[#14171C] text-slate-400 py-6 border-t border-slate-800 text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#F37021]" />
            <span className="font-semibold text-slate-200">
              TE Connectivity • SBOP Safety Tracking System — Rev. H (TE-EHS-053)
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3 text-[#F37021]" />
              <span>Cloudflare D1: d1sbop (413b2fe9-b280-4a1b-81ac-cb20f9e41935)</span>
            </span>
            <span className="flex items-center gap-1">
              <Cloud className="w-3 h-3 text-amber-400" />
              <span>Cloudflare R2: r2sbop</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToRegister={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
        onGuestLoginSuccess={() => {
          setActiveTab('dashboard');
        }}
      />

      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onSwitchToLogin={() => {
          setShowRegister(false);
          setShowLogin(true);
        }}
      />

      <AccountInfoModal
        isOpen={showAccountInfo}
        onClose={() => setShowAccountInfo(false)}
      />

      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => {
          setShowNotifications(false);
          refreshUnreadCount();
        }}
        onNavigateToTab={(tab) => {
          setActiveTab(tab);
        }}
      />

      {/* Global Checklist Manager Modal for Super Admin */}
      {(user?.role === 'superadmin') && (
        <ChecklistManagerModal
          isOpen={showChecklistManager}
          onClose={() => setShowChecklistManager(false)}
          initialDepartment={user?.department || 'QC'}
          initialLayer="All"
        />
      )}
    </div>
  );
};


export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
};

export default App;
