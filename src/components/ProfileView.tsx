import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  User as UserIcon, 
  Shield, 
  Building2, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ClipboardCheck, 
  Bell, 
  AlertTriangle, 
  FileText, 
  Check, 
  ExternalLink,
  Lock,
  Layers,
  Award
} from 'lucide-react';

interface ProfileViewProps {
  onGoToChecklist: () => void;
  onOpenAccountInfo: () => void;
  onNavigateToHistory: () => void;
  onNavigateToDefects: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  onGoToChecklist,
  onOpenAccountInfo,
  onNavigateToHistory,
  onNavigateToDefects,
}) => {
  const { user, t, language } = useAuth();
  const [stats, setStats] = useState({ totalInspections: 0, averageScore: 100.0, defectsFound: 0 });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // 1. Get Me & Stats
      const meData = await api.getMe();
      if (meData.stats) {
        setStats(meData.stats);
      }

      // 2. Get In-App Notifications
      const notifData = await api.getNotifications();
      setNotifications(notifData.notifications || []);
      setUnreadCount(notifData.unreadCount || 0);
    } catch (err) {
      console.warn('Failed to load profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  const roleTitle =
    user.role === 'admin'
      ? (language === 'en' ? 'System Administrator' : 'ผู้ดูแลระบบสูงสุด (Admin)')
      : user.role === 'layer3' || user.role === 'manager'
      ? (language === 'en' ? 'Layer 3 — Department Manager' : 'Layer 3 — ผู้จัดการแผนก (Manager)')
      : user.role === 'layer2' || user.role === 'supervisor'
      ? (language === 'en' ? 'Layer 2 — Supervisor' : 'Layer 2 — หัวหน้างานระดับกุม (Supervisor)')
      : (language === 'en' ? 'Layer 1 — Shift Leader' : 'Layer 1 — หัวหน้างานระดับต้น (Leader)');

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* 1. Profile Welcome Hero Card */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-extrabold text-2xl sm:text-3xl flex items-center justify-center shadow-lg border-2 border-white/20 shrink-0">
              {user.firstName?.charAt(0) || 'U'}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {user.firstName} {user.lastName}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  @{user.username || user.email?.split('@')[0]}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {user.status === 'approved' ? (language === 'en' ? 'Active' : 'อนุมัติแล้ว') : user.status}
                </span>
              </div>
              <p className="text-sm font-medium text-sky-200 flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-400" />
                <span>{roleTitle}</span>
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{language === 'en' ? 'Department' : 'แผนก'}: <strong className="text-slate-200">{user.department}</strong></span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>{language === 'en' ? 'Position' : 'ตำแหน่ง'}: <strong className="text-slate-200">{user.position}</strong></span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={onOpenAccountInfo}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/20 transition text-center shadow-sm"
            >
              {language === 'en' ? 'Edit Profile & Password' : 'แก้ไขข้อมูลส่วนตัว / เปลี่ยนรหัส'}
            </button>

            {/* Main Call to action: Button to go to Checklist */}
            <button
              onClick={onGoToChecklist}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-sky-600/30 transition flex items-center justify-center gap-2 group"
            >
              <ClipboardCheck className="w-5 h-5 text-sky-200" />
              <span>{language === 'en' ? 'Go to SBOP Checklist' : 'ไปยังแบบตรวจเช็ค SBOP'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Quick Auditing Stats & Checklist Launcher Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Inspections Done Card */}
        <div 
          onClick={onNavigateToHistory}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{language === 'en' ? 'Your Total Inspections' : 'บันทึกการตรวจของคุณ'}</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600 group-hover:scale-110 transition">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {stats.totalInspections}
          </div>
          <p className="text-[11px] text-sky-600 mt-1 flex items-center gap-1 font-medium">
            <span>{language === 'en' ? 'View your inspection history' : 'ดูประวัติการตรวจของคุณ'}</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
          </p>
        </div>

        {/* Average Score Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{language === 'en' ? 'Average Safety Score' : 'คะแนนความปลอดภัยเฉลี่ย'}</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2">
            {stats.averageScore}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats.averageScore >= 95 ? (language === 'en' ? 'Excellent Safety Standard' : 'มาตรฐานความปลอดภัยระดับดีเยี่ยม') : (language === 'en' ? 'Compliance Monitored' : 'อยู่ในเกณฑ์ติดตามควบคุม')}
          </p>
        </div>

        {/* Defects Found Card */}
        <div 
          onClick={onNavigateToDefects}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{language === 'en' ? 'Defects Discovered' : 'ข้อบกพร่องที่ตรวจพบ'}</span>
            <div className="p-2 rounded-xl bg-red-50 text-red-600 group-hover:scale-110 transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-red-600 mt-2">
            {stats.defectsFound}
          </div>
          <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1 font-medium">
            <span>{language === 'en' ? 'Track and follow-up defects' : 'ติดตามประเด็นความผิดปกติ'}</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
          </p>
        </div>
      </div>

      {/* 3. In-App User Notifications (User Request 5) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                <Bell className="w-4 h-4" />
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-black flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {language === 'en' ? 'Your In-App Notifications' : 'การแจ้งเตือนเฉพาะคุณ'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {language === 'en'
                  ? 'Real-time inspection notifications, safety alerts, and account updates'
                  : 'แจ้งเตือนการตรวจเช็ค สิ่งผิดปกติที่พบ และการอัปเดตสิทธิ์ในระบบ'}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition"
            >
              {language === 'en' ? 'Mark All as Read' : 'อ่านทั้งหมดแล้ว'}
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
          {loading ? (
            <div className="py-10 text-center text-xs text-slate-400">
              <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <span>{language === 'en' ? 'Loading notifications...' : 'กำลังโหลดการแจ้งเตือน...'}</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p>{language === 'en' ? 'No new notifications at this time.' : 'ไม่มีการแจ้งเตือนใหม่ในขณะนี้'}</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isUnread = notif.is_read === 0;
              const dateStr = notif.created_at
                ? new Date(notif.created_at).toLocaleString(language === 'th' ? 'th-TH' : 'en-US')
                : '';

              return (
                <div
                  key={notif.id}
                  onClick={() => isUnread && handleMarkAsRead(notif.id)}
                  className={`p-4 transition flex items-start gap-3.5 cursor-pointer ${
                    isUnread ? 'bg-sky-50/50 hover:bg-sky-50' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      notif.type === 'alert'
                        ? 'bg-red-100 text-red-700'
                        : notif.type === 'success'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-sky-100 text-sky-700'
                    }`}
                  >
                    {notif.type === 'alert' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : notif.type === 'success' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 leading-snug">
                          {notif.title}
                        </span>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0"></span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{dateStr}</span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>

                    {notif.link && (
                      <div className="pt-1">
                        <span className="text-[11px] font-semibold text-sky-600 hover:underline inline-flex items-center gap-1">
                          <span>{language === 'en' ? 'Open link' : 'ดูรายละเอียด'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
