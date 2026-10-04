import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  History, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  Trash2, 
  RefreshCw, 
  X, 
  ExternalLink,
  Search
} from 'lucide-react';

export const InspectionHistory: React.FC = () => {
  const { user, t } = useAuth();
  const [inspections, setInspections] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected inspection for detail modal
  const [activeInspection, setActiveInspection] = useState<any | null>(null);
  const [inspectionItems, setInspectionItems] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedDept !== 'all') params.department = selectedDept;
      if (selectedYear !== 'all') params.year = selectedYear;
      if (selectedMonth !== 'all') params.month = selectedMonth;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const data = await api.getInspections(params);
      setInspections(data.inspections || []);
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to load inspections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [selectedDept, selectedYear, selectedMonth]);

  const handleViewDetails = async (id: number) => {
    setLoadingDetails(true);
    try {
      const data = await api.getInspection(id);
      setActiveInspection(data.inspection);
      setInspectionItems(data.items || []);
    } catch (err) {
      alert('ไม่สามารถโหลดรายละเอียดได้');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบประวัติการตรวจเช็คนี้?')) return;
    try {
      await api.deleteInspection(id);
      loadHistory();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Stats */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-600">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{t.tabHistory}</h1>
              <p className="text-xs text-slate-500">ประวัติการตรวจประเมินความปลอดภัย SBOP แยกตามแผนก รอบเดือน และรอบปี</p>
            </div>
          </div>

          <button
            onClick={loadHistory}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition self-start md:self-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>รีเฟรช</span>
          </button>
        </div>

        {/* Aggregate Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 font-medium">บันทึกทั้งหมด</div>
              <div className="text-2xl font-bold text-slate-800 mt-1">{stats.total_inspections || 0}</div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="text-xs text-emerald-700 font-medium">ผ่านรวม (OK)</div>
              <div className="text-2xl font-bold text-emerald-800 mt-1">{stats.grand_total_ok || 0}</div>
            </div>
            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
              <div className="text-xs text-red-700 font-medium">ไม่ผ่านรวม (NO)</div>
              <div className="text-2xl font-bold text-red-800 mt-1">{stats.grand_total_no || 0}</div>
            </div>
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-200">
              <div className="text-xs text-sky-700 font-medium">คะแนนเฉลี่ย</div>
              <div className="text-2xl font-bold text-sky-800 mt-1">{stats.average_score || 0}%</div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="ค้นหาเครื่องจักร, ผลิตภัณฑ์ หรือผู้ตรวจ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadHistory()}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Dept Filter */}
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
        >
          <option value="all">ทุกแผนก (All Departments)</option>
          <option value="MOLD">Molding / MM</option>
          <option value="FACILITY">Facility</option>
          <option value="ASSY">Assembly</option>
          <option value="WH">Warehouse</option>
          <option value="QC">QC</option>
          <option value="STAMPING">Stamping</option>
          <option value="TOOL">Tooling</option>
        </select>

        {/* Year Filter */}
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
        >
          <option value="all">ทุกปี (All Years)</option>
          <option value="2026">2026</option>
          <option value="2025">2025</option>
        </select>

        {/* Month Filter */}
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
        >
          <option value="all">ทุกเดือน (All Months)</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>เดือน {m}</option>
          ))}
        </select>
      </div>

      {/* Inspections Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold border-b border-slate-800">
                <th className="py-3.5 px-4">วันที่ตรวจ & กะ</th>
                <th className="py-3.5 px-4">แผนก & ระดับ (Layer)</th>
                <th className="py-3.5 px-4">เครื่องจักร / ผลิตภัณฑ์</th>
                <th className="py-3.5 px-4">ผู้ตรวจ (Auditor)</th>
                <th className="py-3.5 px-4 text-center">ผลการตรวจ (OK / NO)</th>
                <th className="py-3.5 px-4 text-center">Safety Score</th>
                <th className="py-3.5 px-4 text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    กำลังโหลดประวัติการตรวจเช็ค...
                  </td>
                </tr>
              ) : inspections.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    ไม่พบข้อมูลการตรวจเช็คตามตัวกรองที่เลือก
                  </td>
                </tr>
              ) : (
                inspections.map((ins) => (
                  <tr key={ins.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{ins.audit_date}</div>
                      <div className="text-[11px] text-slate-500">{ins.shift}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-sky-700">{ins.department_code}</div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {ins.layer}
                      </span>
                    </td>

                    <td className="py-3 px-4 max-w-[220px]">
                      <div className="font-medium text-slate-800 truncate" title={ins.mc_and_products}>
                        {ins.mc_and_products}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        รอบ {ins.month}/{ins.year}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{ins.auditor_name}</div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {ins.total_ok}
                        </span>
                        <span>/</span>
                        <span className="text-red-600 font-bold flex items-center gap-0.5">
                          <XCircle className="w-3.5 h-3.5" />
                          {ins.total_no}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          ins.score_percent >= 95
                            ? 'bg-emerald-100 text-emerald-800'
                            : ins.score_percent >= 85
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {ins.score_percent}%
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleViewDetails(ins.id)}
                          className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 transition"
                          title="ดูรายละเอียดฉบับเต็ม"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(user?.role === 'admin' || user?.id === ins.auditor_id) && (
                          <button
                            onClick={() => handleDelete(ins.id)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition"
                            title="ลบรายการ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {activeInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-sky-900 p-6 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-bold">
                  บันทึกการตรวจเช็ค: {activeInspection.department_code} ({activeInspection.layer})
                </h3>
                <p className="text-xs text-sky-200 mt-0.5">
                  วันที่: {activeInspection.audit_date} | {activeInspection.shift} | ผู้ตรวจ: {activeInspection.auditor_name}
                </p>
              </div>
              <button
                onClick={() => setActiveInspection(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Summary Header Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 font-medium">เครื่องจักร / ผลิตภัณฑ์</span>
                  <div className="font-bold text-slate-800 truncate">{activeInspection.mc_and_products}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">รอบเดือน / ปี</span>
                  <div className="font-bold text-slate-800">{activeInspection.month} / {activeInspection.year}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">ผ่าน / ไม่ผ่าน</span>
                  <div className="font-bold text-slate-800">
                    <span className="text-emerald-600">{activeInspection.total_ok} OK</span> / <span className="text-red-600">{activeInspection.total_no} NO</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">คะแนนความปลอดภัย</span>
                  <div className="font-black text-sky-600 text-sm">{activeInspection.score_percent}%</div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
                  รายการที่ตรวจประเมิน ({inspectionItems.length} ข้อ)
                </h4>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {inspectionItems.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className={`p-3 ${
                        item.result === 'NO' ? 'bg-red-50/70 border-l-4 border-l-red-500' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <span className="text-[10px] text-slate-500 block font-semibold">{item.category}</span>
                          <span className="font-medium text-slate-800">{item.question}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            item.result === 'OK'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.result === 'NO'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.result}
                        </span>
                      </div>

                      {/* Defect details & R2 image */}
                      {item.result === 'NO' && (
                        <div className="mt-2 pt-2 border-t border-red-200 text-slate-700 space-y-1.5">
                          <div className="font-semibold text-red-700">
                            ปัญหาที่พบ ({item.severity || 'Minor'}): {item.finding_topic}
                          </div>
                          {item.action_plan && (
                            <div className="text-[11px] text-slate-600">
                              <strong>แผนแก้ไข:</strong> {item.action_plan} (ผู้รับผิดชอบ: {item.responsible_person || '-'}, กำหนดเสร็จ: {item.due_date || '-'})
                            </div>
                          )}
                          {item.image_url && (
                            <div className="pt-1">
                              <span className="font-semibold text-[11px] block mb-1">📸 รูปภาพที่แนบ (Cloudflare R2):</span>
                              <a href={item.image_url} target="_blank" rel="noreferrer" className="inline-block group">
                                <img
                                  src={item.image_url}
                                  alt="Defect photo"
                                  className="h-28 w-auto object-cover rounded-lg border border-red-300 shadow-sm group-hover:opacity-90"
                                />
                                <span className="text-[10px] text-sky-600 flex items-center gap-1 mt-0.5">
                                  <span>เปิดดูรูปขนาดเต็ม</span>
                                  <ExternalLink className="w-3 h-3" />
                                </span>
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments & Previous findings */}
              {activeInspection.comments && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-0.5">ข้อคิดเห็นหรือข้อเสนอแนะ:</span>
                  <p className="text-slate-600">{activeInspection.comments}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
