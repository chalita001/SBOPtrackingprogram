import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { InspectionChecklist } from './components/InspectionChecklist';
import { InspectionHistory } from './components/InspectionHistory';
import { DefectTracker } from './components/DefectTracker';
import { AccountManager } from './components/AccountManager';
import { LoginModal } from './components/LoginModal';
import { RegisterModal } from './components/RegisterModal';
import { AccountInfoModal } from './components/AccountInfoModal';
import { EmailLogsModal } from './components/EmailLogsModal';
import { ShieldCheck, AlertCircle, Database, Cloud } from 'lucide-react';

const MainContent: React.FC = () => {
  const { user, loading, t } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('checklist');

  // Modals
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [showRegister, setShowRegister] = useState<boolean>(false);
  const [showAccountInfo, setShowAccountInfo] = useState<boolean>(false);
  const [showEmailLogs, setShowEmailLogs] = useState<boolean>(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="font-bold text-lg">กำลังโหลดระบบ SBOP Safety Tracking...</div>
        <div className="text-xs text-slate-400 mt-1">Cloudflare D1 & R2 Ready</div>
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
        onOpenEmailLogs={() => setShowEmailLogs(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* User Status Notice if pending approval */}
        {user && user.status === 'pending' && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                บัญชีของคุณ (<strong>{user.email}</strong>) อยู่ระหว่างรอการอนุมัติสิทธิ์จากผู้ดูแลระบบ คุณสามารถทดลองดูข้อมูลทั่วไปได้
              </span>
            </div>
            <button
              onClick={() => setShowAccountInfo(true)}
              className="px-3 py-1 bg-amber-200/70 hover:bg-amber-200 rounded-lg font-bold transition text-amber-900"
            >
              ดูข้อมูลโปรไฟล์
            </button>
          </div>
        )}

        {/* View Switcher */}
        {activeTab === 'checklist' && (
          <InspectionChecklist onSuccessSave={() => setActiveTab('history')} />
        )}

        {activeTab === 'history' && <InspectionHistory />}

        {activeTab === 'defects' && <DefectTracker />}

        {activeTab === 'accounts' && user?.role === 'admin' && <AccountManager />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span className="font-semibold text-slate-200">
              SBOP Tracking Program — Rev. H (TE-EHS-053)
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3 text-sky-400" />
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

      <EmailLogsModal
        isOpen={showEmailLogs}
        onClose={() => setShowEmailLogs(false)}
      />
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
