import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, normalizeImageUrl } from '../services/api';
import { 
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
  Award,
  Target,
  TrendingUp,
  Calendar,
  CheckCircle,
  BarChart2,
  Sparkles,
  Users
} from 'lucide-react';

interface ProfileViewProps {
  onGoToChecklist: () => void;
  onOpenAccountInfo: () => void;
  onNavigateToHistory: () => void;
  onNavigateToDefects: () => void;
}

interface MonthlyCountItem {
  month: number;
  count: number;
  avg_score: number;
  defects?: number;
}

interface ProfileStats {
  totalInspections: number;
  averageScore: number;
  defectsFound: number;
  currentYear: number;
  currentMonth: number;
  targetMonthly: number;
  thisMonthCount: number;
  myThisMonthCount?: number;
  departmentCode?: string;
  targetLayer?: string;
  thisMonthAvgScore: number;
  thisMonthOk: number;
  thisMonthNo: number;
  monthlyCounts: MonthlyCountItem[];
  recentInspections: any[];
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const SHORT_MONTHS_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const SHORT_MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const ProfileView: React.FC<ProfileViewProps> = ({
  onGoToChecklist,
  onOpenAccountInfo,
  onNavigateToHistory,
  onNavigateToDefects,
}) => {
  const { user, language } = useAuth();
  const [stats, setStats] = useState<ProfileStats>({
    totalInspections: 0,
    averageScore: 100.0,
    defectsFound: 0,
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    targetMonthly: 40,
    thisMonthCount: 0,
    myThisMonthCount: 0,
    thisMonthAvgScore: 100.0,
    thisMonthOk: 0,
    thisMonthNo: 0,
    monthlyCounts: [],
    recentInspections: [],
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Compute default target monthly based on user role
  const getDefaultTarget = (role?: string) => {
    const r = (role || '').toLowerCase();
    if (r === 'layer1' || r === 'leader') return 40;
    if (r === 'layer2' || r === 'supervisor') return 4;
    if (r === 'layer3' || r === 'manager') return 1;
    return 40;
  };

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // 1. Get Me & Dashboard Stats
      const meData = await api.getMe();
      if (meData.stats) {
        setStats({
          ...meData.stats,
          targetMonthly: meData.stats.targetMonthly || getDefaultTarget(user?.role),
        });
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
  }, [user?.id]);

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
    user.role === 'superadmin'
      ? (language === 'en' ? 'Super Administrator (Super Admin)' : 'ผู้ดูแลระบบสูงสุด (Super Admin)')
      : user.role === 'admin'
      ? (language === 'en' ? 'System Administrator' : 'ผู้ดูแลระบบ (Admin)')
      : user.role === 'layer3' || user.role === 'manager'
      ? (language === 'en' ? 'Layer 3 — Department Manager (1 time/month)' : 'Layer 3 — ผู้จัดการแผนก (เป้าหมาย 1 ครั้ง/เดือน)')
      : user.role === 'layer2' || user.role === 'supervisor'
      ? (language === 'en' ? 'Layer 2 — Supervisor (4 times/month)' : 'Layer 2 — หัวหน้างานระดับกุม (เป้าหมาย 4 ครั้ง/เดือน)')
      : (language === 'en' ? 'Layer 1 — Shift Leader (40 times/month)' : 'Layer 1 — หัวหน้างานระดับต้น (เป้าหมาย 40 ครั้ง/เดือน)');

  const targetQuota = stats.targetMonthly || getDefaultTarget(user.role);
  const thisMonthDone = stats.thisMonthCount || 0;
  const progressPercent = Math.min(100, Math.round((thisMonthDone / targetQuota) * 100));
  const remainingCount = Math.max(0, targetQuota - thisMonthDone);
  const isTargetAchieved = thisMonthDone >= targetQuota;

  const currentMonthName = language === 'th' 
    ? `${THAI_MONTHS[stats.currentMonth - 1]} ${stats.currentYear + 543}`
    : `${SHORT_MONTHS_EN[stats.currentMonth - 1]} ${stats.currentYear}`;

  // Build 12-month series for the chart
  const monthlyDataMap: Record<number, MonthlyCountItem> = {};
  for (const item of stats.monthlyCounts || []) {
    monthlyDataMap[item.month] = item;
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* 1. Profile Welcome Hero Card */}
      <div className="bg-gradient-to-r from-[#181B20] via-[#1E2229] to-[#252C37] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F37021]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#F37021] to-[#DE5F14] text-white font-extrabold text-2xl sm:text-3xl flex items-center justify-center shadow-lg border-2 border-white/20 shrink-0 overflow-hidden relative group">
              {user.avatarUrl ? (
                <img src={normalizeImageUrl(user.avatarUrl)} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user.firstName?.charAt(0) || 'U'
              )}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {user.firstName} {user.lastName}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#F37021]/20 text-orange-300 border border-[#F37021]/30">
                  @{user.username || user.email?.split('@')[0]}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {user.status === 'approved' ? (language === 'en' ? 'Approved' : 'อนุมัติแล้ว') : user.status}
                </span>
              </div>
              <p className="text-sm font-medium text-orange-200 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#F37021]" />
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
              className="px-6 py-3 rounded-xl bg-[#F37021] hover:bg-[#DE5F14] text-white font-bold text-sm shadow-lg shadow-[#F37021]/30 transition flex items-center justify-center gap-2 group"
            >
              <ClipboardCheck className="w-5 h-5 text-white/90" />
              <span>{language === 'en' ? 'Go to SBOP Checklist' : 'ไปยังแบบตรวจเช็ค SBOP'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Personal Monthly Dashboard (แดชบอร์ดส่วนบุคคลประจำเดือน) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6">
        {/* Header with Month indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-50 border border-orange-100 text-[#F37021]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>{language === 'en' ? 'Department Team Monthly Dashboard' : 'แดชบอร์ดการตรวจเช็คทีมแผนกประจำเดือน'}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-orange-100 text-[#F37021]">
                  {currentMonthName}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'en'
                  ? `Pooled audits for ${stats.departmentCode || user.department} (${stats.targetLayer || 'Layer 1'}). All members in this layer contribute to the monthly target.`
                  : `ยอดตรวจรวมของทุกคนในแผนก ${stats.departmentCode || user.department} (${stats.targetLayer || 'Layer 1'}) นับสะสมรวมกันสู่เป้าหมายของทีม`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#F37021]" />
              <span>
                {language === 'en' 
                  ? `Team Target: ${targetQuota} audits/month`
                  : `เป้าหมายทีม: ${targetQuota} ครั้ง/เดือน`}
              </span>
            </span>
          </div>
        </div>

        {/* Progress Bar & Quota Status Card */}
        <div className={`p-5 sm:p-6 rounded-2xl border transition ${
          isTargetAchieved 
            ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-50 to-teal-50 border-emerald-200' 
            : 'bg-gradient-to-r from-orange-50/70 via-amber-50/40 to-slate-50 border-orange-200'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {isTargetAchieved ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-sm">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Team Target Achieved 🎉' : 'ทีมบรรลุเป้าหมายของเดือนแล้ว 🎉'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#F37021] text-white shadow-sm">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'In Progress' : 'กำลังดำเนินการ'}</span>
                  </span>
                )}
                <span className="text-xs font-bold text-slate-700">
                  {language === 'en'
                    ? `Team Total: ${thisMonthDone} of ${targetQuota} audits (Your audits: ${stats.myThisMonthCount || 0})`
                    : `ยอดรวมทีมแผนก: ${thisMonthDone} จากเป้าหมาย ${targetQuota} ครั้ง (คุณตรวจแล้ว ${stats.myThisMonthCount || 0} ครั้ง)`}
                </span>
              </div>

              <p className="text-xs text-slate-600 pt-1">
                {isTargetAchieved ? (
                  <span className="text-emerald-800 font-semibold">
                    {language === 'en'
                      ? `Excellent team work! Department ${stats.departmentCode || user.department} (${stats.targetLayer || 'Layer 1'}) has completed ${thisMonthDone} audits this month, reaching 100% of the target. (Your contribution: ${stats.myThisMonthCount || 0} audits)`
                      : `ยอดเยี่ยมมาก! ทีมแผนก ${stats.departmentCode || user.department} (${stats.targetLayer || 'Layer 1'}) ทำการตรวจเช็คครบตามเป้าหมายของเดือนแล้ว (${thisMonthDone} ครั้ง) โดยคุณช่วยตรวจไป ${stats.myThisMonthCount || 0} ครั้ง`}
                  </span>
                ) : (
                  <span className="text-slate-700">
                    {language === 'en'
                      ? `Department ${stats.departmentCode || user.department} (${stats.targetLayer || 'Layer 1'}) needs ${remainingCount} more audits this month to achieve the team target (${targetQuota} audits/month). You have personally completed ${stats.myThisMonthCount || 0} audits.`
                      : `ทีมแผนก ${stats.departmentCode || user.department} (${stats.targetLayer || 'Layer 1'}) ยังต้องทำการตรวจเช็คอีก `}
                    <strong className="text-[#F37021] font-bold">{remainingCount} ครั้ง</strong>
                    {language === 'th' ? ` เพื่อให้ครบตามเป้าหมายของแผนก (${targetQuota} ครั้ง/เดือน) • (คุณช่วยตรวจแล้ว ${stats.myThisMonthCount || 0} ครั้ง)` : ''}
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right shrink-0">
                <div className="text-2xl sm:text-3xl font-black text-slate-900">
                  {progressPercent}%
                </div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  {language === 'en' ? 'Team Progress' : 'ความคืบหน้าทีม'}
                </div>
              </div>

              <button
                onClick={onGoToChecklist}
                className="px-4 py-2.5 rounded-xl bg-[#F37021] hover:bg-[#DE5F14] text-white font-bold text-xs shadow-md shadow-[#F37021]/30 transition flex items-center gap-1.5 shrink-0"
              >
                <span>{language === 'en' ? 'Start Audit (+1)' : 'เริ่มตรวจเช็ค (+1 ครั้ง)'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Linear Progress Bar */}
          <div className="w-full bg-slate-200/80 rounded-full h-3.5 mt-4 overflow-hidden p-0.5 border border-slate-300/40">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isTargetAchieved
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : 'bg-gradient-to-r from-[#F37021] to-[#DE5F14]'
              }`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* 4 Metric Cards for This Month */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* 1. Monthly Audits Done (Department Team) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>{language === 'en' ? 'Team Audits This Month' : 'ยอดรวมแผนกเดือนนี้'}</span>
              <div className="p-1.5 rounded-lg bg-orange-100 text-[#F37021]">
                <ClipboardCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2 flex items-baseline gap-1">
              <span>{thisMonthDone}</span>
              <span className="text-xs text-slate-400 font-normal">/ {targetQuota} {language === 'th' ? 'ครั้ง' : 'times'}</span>
            </div>
            <div className="text-[11px] text-[#F37021] font-bold mt-1">
              {language === 'th' ? `คุณตรวจแล้ว: ${stats.myThisMonthCount || 0} ครั้ง (ช่วยทีม)` : `You audited: ${stats.myThisMonthCount || 0} times`}
            </div>
          </div>

          {/* 2. Monthly Average Score */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>{language === 'en' ? 'Monthly Avg Score' : 'คะแนนเฉลี่ยเดือนนี้'}</span>
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                <Award className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-2">
              {stats.thisMonthAvgScore}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {stats.thisMonthAvgScore >= 95 ? (language === 'th' ? 'ปลอดภัยระดับดีเยี่ยม' : 'Excellent') : (language === 'th' ? 'ต้องปรับปรุง' : 'Attention needed')}
            </div>
          </div>

          {/* 3. Safe Items OK this month */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>{language === 'en' ? 'Passed (OK)' : 'จุดที่ปลอดภัย (OK)'}</span>
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {stats.thisMonthOk}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">
              {language === 'th' ? 'ข้อที่ผ่านการตรวจ' : 'Items compliant'}
            </div>
          </div>

          {/* 4. Defects Found this month */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>{language === 'en' ? 'Defects (NO)' : 'พบสิ่งผิดปกติ (NO)'}</span>
              <div className="p-1.5 rounded-lg bg-red-100 text-red-700">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-red-600 mt-2">
              {stats.thisMonthNo}
            </div>
            <div className="text-[11px] text-red-600 font-medium mt-1">
              {language === 'th' ? 'จุดที่ต้องแก้ไข/ติดตาม' : 'Items requiring action'}
            </div>
          </div>
        </div>

        {/* 12-Month Audit History Visual Bar Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#F37021]" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {language === 'en' 
                  ? `Audit Frequency Overview (${stats.currentYear})` 
                  : `ความถี่การตรวจเช็คในแต่ละเดือน (${stats.currentYear + 543})`}
              </h3>
            </div>
            <span className="text-[11px] text-slate-500">
              {language === 'en' ? `Target: ${targetQuota} audits/mo` : `เส้นเป้าหมาย: ${targetQuota} ครั้ง/เดือน`}
            </span>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 text-center pt-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => {
              const mData = monthlyDataMap[m];
              const count = mData?.count || 0;
              const isCurrent = m === stats.currentMonth;
              const monthLabel = language === 'th' ? SHORT_MONTHS_TH[m - 1] : SHORT_MONTHS_EN[m - 1];

              // Height calculation: max relative height
              const maxScale = Math.max(targetQuota * 1.2, 5);
              const barHeightPct = Math.min(100, Math.max(8, Math.round((count / maxScale) * 100)));

              return (
                <div key={m} className="flex flex-col items-center gap-1.5">
                  <div className="text-[10px] font-bold text-slate-600 h-4">
                    {count > 0 ? count : '-'}
                  </div>

                  <div className={`w-full max-w-[28px] h-24 bg-white rounded-lg flex flex-col justify-end p-0.5 border ${
                    isCurrent ? 'border-[#F37021] bg-orange-50/50' : 'border-slate-200'
                  }`}>
                    <div
                      className={`w-full rounded-md transition-all duration-500 ${
                        count >= targetQuota
                          ? 'bg-emerald-500'
                          : isCurrent
                          ? 'bg-[#F37021]'
                          : count > 0
                          ? 'bg-orange-300'
                          : 'bg-transparent'
                      }`}
                      style={{ height: `${count > 0 ? barHeightPct : 0}%` }}
                      title={`${monthLabel}: ${count} ${language === 'th' ? 'ครั้ง' : 'audits'}`}
                    ></div>
                  </div>

                  <span className={`text-[10px] font-semibold ${
                    isCurrent ? 'text-[#F37021] font-black' : 'text-slate-500'
                  }`}>
                    {monthLabel}
                    {isCurrent && <span className="block text-[8px] text-[#F37021] leading-none">●</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Personal Inspections Table */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{language === 'en' ? 'Recent Inspections by You' : 'ประวัติการตรวจล่าสุดของคุณ'}</span>
            </h3>
            <button
              onClick={onNavigateToHistory}
              className="text-xs font-bold text-[#F37021] hover:text-[#DE5F14] flex items-center gap-1"
            >
              <span>{language === 'en' ? 'View all inspection history' : 'ดูประวัติการตรวจทั้งหมด'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {stats.recentInspections && stats.recentInspections.length > 0 ? (
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
              {/* Mobile Card List (< sm) */}
              <div className="block sm:hidden divide-y divide-slate-100">
                {stats.recentInspections.map((ins: any) => (
                  <div key={ins.id} className="p-3.5 space-y-1.5 hover:bg-slate-50/70 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs">{ins.audit_date}</span>
                          <span className="text-[11px] text-slate-500 font-medium">({ins.shift})</span>
                          <span className="text-xs font-bold text-[#F37021]">#{ins.inspection_code || '001'}</span>
                        </div>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ins.layer === 'Layer 1' ? 'bg-emerald-100 text-emerald-800' :
                          ins.layer === 'Layer 2' ? 'bg-indigo-100 text-indigo-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {ins.layer}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-600 text-xs block">{ins.score_percent}%</span>
                        <div className="text-[11px] font-semibold mt-0.5">
                          <span className="text-emerald-700">{ins.total_ok} OK</span>
                          {ins.total_no > 0 && <span className="text-red-600 ml-1">• {ins.total_no} NO</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-600 truncate">
                      📍 {ins.mc_and_products}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table (>= sm) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3">{language === 'th' ? 'วันที่ตรวจ' : 'Date'}</th>
                      <th className="py-2.5 px-3">{language === 'th' ? 'รหัสรายการ' : 'Code'}</th>
                      <th className="py-2.5 px-3">{language === 'th' ? 'ระดับ' : 'Layer'}</th>
                      <th className="py-2.5 px-3">{language === 'th' ? 'กะ' : 'Shift'}</th>
                      <th className="py-2.5 px-3">{language === 'th' ? 'เครื่องจักร/ผลิตภัณฑ์' : 'M/C & Products'}</th>
                      <th className="py-2.5 px-3 text-center">{language === 'th' ? 'คะแนน' : 'Score'}</th>
                      <th className="py-2.5 px-3 text-center">{language === 'th' ? 'ผลตรวจ' : 'Results'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {stats.recentInspections.map((ins: any) => (
                      <tr key={ins.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{ins.audit_date}</td>
                        <td className="py-2.5 px-3 font-bold text-[#F37021]">#{ins.inspection_code || '001'}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ins.layer === 'Layer 1' ? 'bg-emerald-100 text-emerald-800' :
                            ins.layer === 'Layer 2' ? 'bg-indigo-100 text-indigo-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {ins.layer}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium">
                          {ins.shift === 'เช้า' ? (language === 'th' ? 'กะเช้า' : 'Morning') :
                           ins.shift === 'ดึก' ? (language === 'th' ? 'กะดึก' : 'Night') : ins.shift}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 truncate max-w-[200px]">{ins.mc_and_products}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-emerald-600">{ins.score_percent}%</td>
                        <td className="py-2.5 px-3 text-center font-medium">
                          <span className="text-emerald-700 font-bold">{ins.total_ok} OK</span>
                          {ins.total_no > 0 && (
                            <span className="text-red-600 font-bold ml-1.5">{ins.total_no} NO</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
              <ClipboardCheck className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
              <span>{language === 'th' ? 'ยังไม่มีประวัติการตรวจในรอบนี้ กดเริ่มตรวจเพื่อบันทึกรายการแรก' : 'No audits yet. Click Start Audit to begin.'}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. In-App User Notifications Feed */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
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
              className="text-xs font-bold text-[#F37021] hover:text-[#DE5F14] bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition"
            >
              {language === 'en' ? 'Mark All as Read' : 'อ่านทั้งหมดแล้ว'}
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
          {loading ? (
            <div className="py-10 text-center text-xs text-slate-400">
              <div className="w-6 h-6 border-2 border-[#F37021] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
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
                    isUnread ? 'bg-orange-50/40 hover:bg-orange-50/70' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      notif.type === 'alert'
                        ? 'bg-red-100 text-red-700'
                        : notif.type === 'success'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-orange-100 text-[#F37021]'
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
                          <span className="w-2 h-2 rounded-full bg-[#F37021] shrink-0"></span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{dateStr}</span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>

                    {notif.link && (
                      <div className="pt-1">
                        <span className="text-[11px] font-semibold text-[#F37021] hover:underline inline-flex items-center gap-1">
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
