import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Users,
  Building2,
  Layers,
  Calendar,
  RefreshCw,
  ExternalLink,
  Image as ImageIcon,
  Clock,
  Tag,
  ChevronRight,
  TrendingUp,
  Activity,
  AlertCircle
} from 'lucide-react';

interface DashboardStats {
  overall: {
    total_inspections: number;
    average_score: number;
    total_ok: number;
    total_no: number;
    total_na: number;
    active_auditors: number;
    active_departments: number;
  };
  deptStats: Array<{
    code: string;
    name_th: string;
    name_en: string;
    inspections_count: number;
    average_score: number;
    total_ok: number;
    total_no: number;
    auditor_count: number;
  }>;
  layerStats: Array<{
    layer: string;
    count: number;
    average_score: number;
    defects_count: number;
  }>;
  recentDefects: Array<{
    id: number;
    inspection_id: number;
    question: string;
    finding_topic?: string;
    severity?: string;
    action_plan?: string;
    responsible_person?: string;
    due_date?: string;
    image_url?: string;
    layer: string;
    department_code: string;
    inspection_code?: string;
    audit_date: string;
    mc_and_products?: string;
    auditor_name: string;
  }>;
  userCounts: {
    total: number;
    layer1_users: number;
    layer2_users: number;
    layer3_users: number;
    admin_users: number;
    pending_users: number;
  };
}

export const AdminDashboard: React.FC<{ onNavigateToAccounts?: () => void; onNavigateToDefects?: () => void }> = ({
  onNavigateToAccounts,
  onNavigateToDefects,
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const currentYear = new Date().getFullYear().toString();
  const currentMonth = (new Date().getMonth() + 1).toString();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  // Image Preview Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (selectedYear !== 'all') params.year = selectedYear;
      if (selectedMonth !== 'all') params.month = selectedMonth;
      if (selectedDept !== 'all') params.department = selectedDept;

      const data = await api.getDashboardStats(params);
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load dashboard statistics:', err);
      setError(err.message || 'ไม่สามารถโหลดข้อมูลแดชบอร์ดได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDashboardData();
    }
  }, [selectedYear, selectedMonth, selectedDept]);

  if (user?.role !== 'admin') {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center max-w-xl mx-auto my-12 shadow-sm">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-red-900">การเข้าถึงถูกจำกัด (Access Denied)</h2>
        <p className="text-xs text-red-700 mt-2">
          หน้านี้สงวนไว้สำหรับผู้ดูแลระบบ (Admin) เท่านั้น บัญชีของคุณไม่มีสิทธิ์ในการดูข้อมูลแดชบอร์ดบริหารนี้
        </p>
      </div>
    );
  }

  const overall = stats?.overall;
  const avgScore = overall?.average_score ?? 100;
  const isHealthy = avgScore >= 85;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Dashboard Header & Filter Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Admin Executive Dashboard
              </span>
              <span className="text-xs text-slate-400">Cloudflare D1 & R2 Connected</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3 text-white">
              <BarChart3 className="w-8 h-8 text-sky-400" />
              <span>แดชบอร์ดบริหารความปลอดภัย SBOP</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              ภาพรวมการตรวจสอบความปลอดภัยของทุกแผนก การทบทวนผล 3 ระดับ (Layer 1-3) การติดตามประเด็นความเสี่ยง และสถานะสมาชิกในระบบ
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 self-start lg:self-center">
            <div className="text-center px-2">
              <span className="text-[10px] text-slate-300 font-semibold block uppercase">สถานะรวม</span>
              <span className={`text-base font-extrabold ${isHealthy ? 'text-emerald-400' : 'text-red-400'}`}>
                {isHealthy ? 'ผ่านเกณฑ์ (PASS)' : 'เฝ้าระวัง (ATTN)'}
              </span>
            </div>
            <div className="h-8 w-px bg-white/20"></div>
            <div className="text-center px-2">
              <span className="text-[10px] text-slate-300 font-semibold block uppercase">คะแนนเฉลี่ย</span>
              <span className="text-xl font-black text-white">{avgScore}%</span>
            </div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Year Filter */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              <label className="text-slate-400 font-medium">ปี:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">ทุกปี (All Years)</option>
                <option value="2026" className="bg-slate-900 text-white">2026</option>
                <option value="2025" className="bg-slate-900 text-white">2025</option>
              </select>
            </div>

            {/* Month Filter */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <label className="text-slate-400 font-medium">รอบเดือน:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">ทุกเดือน (All Months)</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m.toString()} className="bg-slate-900 text-white">
                    เดือน {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <label className="text-slate-400 font-medium">แผนก:</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">ทุกแผนก (All)</option>
                <option value="MOLD" className="bg-slate-900 text-white">Molding / MM</option>
                <option value="FACILITY" className="bg-slate-900 text-white">Facility</option>
                <option value="ASSY" className="bg-slate-900 text-white">Assembly</option>
                <option value="WH" className="bg-slate-900 text-white">Warehouse</option>
                <option value="QC" className="bg-slate-900 text-white">QC</option>
                <option value="STAMPING" className="bg-slate-900 text-white">Stamping</option>
                <option value="TOOL" className="bg-slate-900 text-white">Tooling</option>
              </select>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>อัปเดตข้อมูล</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Top Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Inspections */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">การตรวจประเมินทั้งหมด</span>
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {overall?.total_inspections ?? 0}
            </span>
            <span className="text-xs font-semibold text-slate-500">ครั้ง</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span>ครอบคลุม {overall?.active_departments ?? 0} แผนก</span>
            <span>•</span>
            <span>ผู้ตรวจ {overall?.active_auditors ?? 0} ท่าน</span>
          </div>
        </div>

        {/* Card 2: Average Safety Score */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">คะแนนความปลอดภัยเฉลี่ย</span>
            <div className={`p-2.5 rounded-xl ${isHealthy ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-black ${isHealthy ? 'text-emerald-600' : 'text-red-600'}`}>
              {avgScore}%
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isHealthy ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
              {isHealthy ? 'เกณฑ์มาตรฐาน' : 'ต่ำกว่าเกณฑ์ 85%'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            เกณฑ์ผ่านของโรงงานคือ 85.0% ขึ้นไป
          </div>
        </div>

        {/* Card 3: Defect Count (NO) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">ข้อบกพร่องที่พบ (NO)</span>
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-red-600">
              {overall?.total_no ?? 0}
            </span>
            <span className="text-xs font-semibold text-slate-500">รายการ</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>ผ่านการตรวจ (OK): <strong className="text-emerald-700">{overall?.total_ok ?? 0}</strong></span>
            {onNavigateToDefects && (
              <button
                type="button"
                onClick={onNavigateToDefects}
                className="text-sky-600 font-bold hover:underline"
              >
                ดูทั้งหมด →
              </button>
            )}
          </div>
        </div>

        {/* Card 4: System Users Summary */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">สมาชิกในระบบ</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-900">
              {stats?.userCounts?.total ?? 0}
            </span>
            <span className="text-xs font-semibold text-slate-500">บัญชี</span>
          </div>
          <div className="mt-2 text-[11px] flex items-center justify-between">
            {(stats?.userCounts?.pending_users ?? 0) > 0 ? (
              <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                รออนุมัติ {stats?.userCounts?.pending_users} บัญชี ⏳
              </span>
            ) : (
              <span className="text-emerald-700 font-medium">ทุกบัญชีได้รับการอนุมัติแล้ว</span>
            )}
            {onNavigateToAccounts && (
              <button
                type="button"
                onClick={onNavigateToAccounts}
                className="text-indigo-600 font-bold hover:underline"
              >
                จัดการ →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Grid: Department Performance Table + Layer Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): 7 Departments Matrix */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  ผลการดำเนินงานความปลอดภัยแยกตามแผนก (Department Matrix)
                </h3>
                <p className="text-[11px] text-slate-500">
                  สถิติการตรวจเช็ค คะแนนเฉลี่ย และข้อบกพร่องตาม 7 แผนกหลัก
                </p>
              </div>
            </div>
            <span className="text-xs text-slate-400 font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              7 แผนก
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-3">แผนก (Department)</th>
                  <th className="py-3 px-3 text-center">จำนวนครั้งที่ตรวจ</th>
                  <th className="py-3 px-3 text-center">คะแนนเฉลี่ย</th>
                  <th className="py-3 px-3 text-center">ผ่าน (OK)</th>
                  <th className="py-3 px-3 text-center">พบปัญหา (NO)</th>
                  <th className="py-3 px-3 text-center">ผู้ตรวจ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats?.deptStats?.map((dept) => {
                  const score = Number(dept.average_score || 0);
                  const isDeptHealthy = dept.inspections_count > 0 ? score >= 85 : true;

                  return (
                    <tr key={dept.code} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{dept.name_th}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{dept.code} — {dept.name_en}</div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {dept.inspections_count}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {dept.inspections_count > 0 ? (
                          <div className="flex flex-col items-center">
                            <span className={`font-black text-xs ${isDeptHealthy ? 'text-emerald-600' : 'text-red-600'}`}>
                              {score.toFixed(1)}%
                            </span>
                            {/* Small Progress bar */}
                            <div className="w-16 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isDeptHealthy ? 'bg-emerald-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.min(score, 100)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">- ยังไม่เริ่ม -</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-emerald-600">
                        {dept.total_ok}
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-red-600">
                        {dept.total_no > 0 ? (
                          <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold">
                            {dept.total_no}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center text-slate-600 font-medium">
                        {dept.auditor_count} ท่าน
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Layer 1, 2, 3 Verification Status & User Distribution */}
        <div className="space-y-6">
          {/* Layer Verification Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Layers className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  การตรวจสอบ 3 ระดับ (Layers Audit)
                </h3>
                <p className="text-[11px] text-slate-500">
                  สถานะการตรวจตามสายการบังคับบัญชา
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Layer 1 */}
              <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
                    <strong className="text-xs text-sky-950 font-bold">Layer 1: Leader</strong>
                  </div>
                  <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full">
                    ตรวจรายกะ / รายวัน
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                  <span>บันทึกแล้ว: <strong className="text-slate-900">{stats?.layerStats?.find(l => l.layer.includes('1'))?.count ?? 0} ครั้ง</strong></span>
                  <span>ปัญหาที่พบ: <strong className="text-red-600">{stats?.layerStats?.find(l => l.layer.includes('1'))?.defects_count ?? 0} รายการ</strong></span>
                </div>
              </div>

              {/* Layer 2 */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    <strong className="text-xs text-indigo-950 font-bold">Layer 2: Supervisor</strong>
                  </div>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                    ทบทวน & ตรวจสอบ L1
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                  <span>บันทึกแล้ว: <strong className="text-slate-900">{stats?.layerStats?.find(l => l.layer.includes('2'))?.count ?? 0} ครั้ง</strong></span>
                  <span>ปัญหาที่พบ: <strong className="text-red-600">{stats?.layerStats?.find(l => l.layer.includes('2'))?.defects_count ?? 0} รายการ</strong></span>
                </div>
              </div>

              {/* Layer 3 */}
              <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                    <strong className="text-xs text-purple-950 font-bold">Layer 3: Manager</strong>
                  </div>
                  <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                    ภาพรวมระบบ & GO-Meeting
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                  <span>บันทึกแล้ว: <strong className="text-slate-900">{stats?.layerStats?.find(l => l.layer.includes('3'))?.count ?? 0} ครั้ง</strong></span>
                  <span>คะแนนเฉลี่ย: <strong className="text-purple-700">{stats?.layerStats?.find(l => l.layer.includes('3'))?.average_score ?? 0}%</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* User Distribution Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">ผู้ใช้งานในระบบแยกตามระดับ</h3>
              </div>
              {onNavigateToAccounts && (
                <button
                  type="button"
                  onClick={onNavigateToAccounts}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  จัดการสมาชิก →
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Layer 1 (Leader)</span>
                <span className="text-lg font-bold text-slate-900">{stats?.userCounts?.layer1_users ?? 0}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Layer 2 (Supervisor)</span>
                <span className="text-lg font-bold text-slate-900">{stats?.userCounts?.layer2_users ?? 0}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Layer 3 (Manager)</span>
                <span className="text-lg font-bold text-slate-900">{stats?.userCounts?.layer3_users ?? 0}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
                <span className="text-purple-700 block text-[11px]">ผู้ดูแลระบบ (Admin)</span>
                <span className="text-lg font-bold text-purple-900">{stats?.userCounts?.admin_users ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Recent Defect Feed with Cloudflare R2 Proof Photos */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-100 text-red-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                ประเด็นความไม่ปลอดภัยล่าสุดที่ตรวจพบ (Recent Safety Defects)
              </h3>
              <p className="text-xs text-slate-500">
                รายการข้อบกพร่องที่บันทึกพร้อมหลักฐานภาพถ่ายบน Cloudflare R2
              </p>
            </div>
          </div>

          {onNavigateToDefects && (
            <button
              type="button"
              onClick={onNavigateToDefects}
              className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 self-start sm:self-center"
            >
              <span>ดูและอัปเดตสถานะแก้ไขทั้งหมด</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {stats?.recentDefects && stats.recentDefects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.recentDefects.map((defect) => (
              <div
                key={defect.id}
                className="bg-white rounded-2xl border border-red-200/80 p-4 shadow-sm hover:shadow transition space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  {/* Badge Row */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
                      {defect.severity || 'Minor'}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {defect.audit_date}
                    </span>
                  </div>

                  {/* Department & Machine */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <strong className="text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                      {defect.department_code}
                    </strong>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                      #{defect.inspection_code || '001'}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="truncate" title={defect.mc_and_products}>
                      {defect.mc_and_products || defect.layer}
                    </span>
                  </div>

                  {/* Finding Topic / Question */}
                  <div className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">
                    {defect.finding_topic || defect.question}
                  </div>

                  {/* Action Plan */}
                  {defect.action_plan && (
                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl">
                      <strong>แผนแก้ไข:</strong> {defect.action_plan}
                    </div>
                  )}

                  {/* Responsible & Due date */}
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>ผู้รับผิดชอบ: <strong>{defect.responsible_person || '-'}</strong></span>
                    <span>กำหนด: <strong>{defect.due_date || '-'}</strong></span>
                  </div>
                </div>

                {/* Proof Image on Cloudflare R2 */}
                {defect.image_url ? (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setPreviewImage(defect.image_url!)}
                      className="flex items-center gap-1.5 text-[11px] text-sky-600 hover:text-sky-700 font-bold"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                      <span>ดูรูปหลักฐาน (Cloudflare R2)</span>
                    </button>
                    <a
                      href={defect.image_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-sky-600"
                      title="เปิดในแท็บใหม่"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 italic">
                    ไม่มีรูปถ่ายแนบ
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <span>ไม่พบประเด็นข้อบกพร่องตามตัวกรองที่เลือก (Zero Defects Found)</span>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2">
            <img
              src={previewImage}
              alt="Defect Full View"
              className="max-w-full max-h-[80vh] object-contain rounded-xl mx-auto"
            />
            <div className="p-3 text-center">
              <a
                href={previewImage}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-sky-600 hover:underline font-semibold inline-flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <span>เปิดในแท็บใหม่ (Cloudflare R2)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
