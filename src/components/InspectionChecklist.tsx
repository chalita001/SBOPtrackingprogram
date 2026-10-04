import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  Camera, 
  Upload, 
  Trash2, 
  AlertTriangle, 
  Calendar, 
  Building2, 
  Clock, 
  Send, 
  Save, 
  RotateCcw,
  Sparkles,
  Info,
  Check
} from 'lucide-react';

interface ChecklistItemState {
  templateItemId: number;
  question: string;
  category: string;
  subcategory?: string;
  method?: string;
  layer: string;
  result: 'OK' | 'NO' | 'N/A';
  findingTopic: string;
  severity: 'Minor' | 'Major';
  actionPlan: string;
  responsiblePerson: string;
  dueDate: string;
  imageUrl?: string;
  imageKey?: string;
  uploadingImage?: boolean;
}

export const InspectionChecklist: React.FC<{ onSuccessSave?: () => void }> = ({ onSuccessSave }) => {
  const { user, t } = useAuth();

  // Header State
  const [departmentCode, setDepartmentCode] = useState<string>('MOLD');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [layer, setLayer] = useState<string>('Layer 1');
  const [shift, setShift] = useState<string>('กะ A (เช้า)');
  const [mcAndProducts, setMcAndProducts] = useState<string>('');
  const [auditDate, setAuditDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [comments, setComments] = useState<string>('');
  const [previousFindings, setPreviousFindings] = useState<string>('');

  // Items State
  const [items, setItems] = useState<ChecklistItemState[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Quick fill all OK
  const handleQuickFillAllOk = () => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        result: 'OK',
      }))
    );
  };

  // Load Departments
  useEffect(() => {
    api.getDepartments().then((data) => {
      setDepartments(data || []);
      if (user?.department) {
        setDepartmentCode(user.department);
      }
    }).catch(console.error);
  }, [user]);

  // Load Checklist questions when Department or Layer changes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setFeedback(null);

    api.getChecklistTemplates(departmentCode, layer)
      .then((data) => {
        if (!isMounted) return;
        const initialItems: ChecklistItemState[] = (data.items || []).map((tmpl: any) => ({
          templateItemId: tmpl.id,
          question: tmpl.question_th,
          category: tmpl.category || 'General',
          subcategory: tmpl.subcategory || '',
          method: tmpl.method || 'สังเกตและตรวจสอบ',
          layer: tmpl.layer || layer,
          result: 'OK', // Default to OK
          findingTopic: '',
          severity: 'Minor',
          actionPlan: '',
          responsiblePerson: '',
          dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0], // 3 days default
          imageUrl: '',
          imageKey: '',
          uploadingImage: false,
        }));
        setItems(initialItems);
      })
      .catch((err) => {
        if (isMounted) setFeedback({ text: 'ไม่สามารถโหลดรายการตรวจเช็คได้: ' + err.message, type: 'error' });
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [departmentCode, layer]);

  // Handle Result change (OK, NO, N/A)
  const handleResultChange = (index: number, result: 'OK' | 'NO' | 'N/A') => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], result };
      return next;
    });
  };

  // Handle Defect Details change
  const handleItemFieldChange = (index: number, field: keyof ChecklistItemState, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Handle Photo Upload directly to Cloudflare R2
  const handlePhotoUpload = async (index: number, file: File) => {
    handleItemFieldChange(index, 'uploadingImage', true);
    try {
      const uploadRes = await api.uploadImage(file);
      setItems((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          imageUrl: uploadRes.imageUrl,
          imageKey: uploadRes.imageKey,
          uploadingImage: false,
        };
        return next;
      });
    } catch (err: any) {
      alert('อัปโหลดรูปภาพไปยัง Cloudflare R2 ล้มเหลว: ' + err.message);
      handleItemFieldChange(index, 'uploadingImage', false);
    }
  };

  // Remove Photo
  const handleRemovePhoto = (index: number) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        imageUrl: '',
        imageKey: '',
      };
      return next;
    });
  };

  // Calculate stats
  const totalOk = items.filter((i) => i.result === 'OK').length;
  const totalNo = items.filter((i) => i.result === 'NO').length;
  const totalNa = items.filter((i) => i.result === 'N/A').length;
  const totalEvaluated = totalOk + totalNo;
  const scorePercent = totalEvaluated > 0 ? ((totalOk / totalEvaluated) * 100).toFixed(1) : '100.0';

  // Save Inspection Form
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mcAndProducts.trim()) {
      setFeedback({ text: 'กรุณากรอกข้อมูลเครื่องจักรและผลิตภัณฑ์ (M/C and Products)', type: 'error' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Check if any NO items lack finding details
    const invalidDefect = items.find((i) => i.result === 'NO' && !i.findingTopic.trim());
    if (invalidDefect) {
      setFeedback({ text: `กรุณากรอกรายละเอียดปัญหาที่พบสำหรับข้อ: "${invalidDefect.question.substring(0, 40)}..."`, type: 'error' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const payload = {
        departmentCode,
        year,
        month,
        layer,
        shift,
        mcAndProducts,
        auditDate,
        comments,
        previousFindings,
        items: items.map((i) => ({
          templateItemId: i.templateItemId,
          layer: i.layer,
          category: i.category,
          subcategory: i.subcategory,
          question: i.question,
          result: i.result,
          findingTopic: i.result === 'NO' ? i.findingTopic : null,
          severity: i.result === 'NO' ? i.severity : null,
          actionPlan: i.result === 'NO' ? i.actionPlan : null,
          responsiblePerson: i.result === 'NO' ? i.responsiblePerson : null,
          dueDate: i.result === 'NO' ? i.dueDate : null,
          imageUrl: i.result === 'NO' ? i.imageUrl : null,
          imageKey: i.result === 'NO' ? i.imageKey : null,
        })),
      };

      const res = await api.createInspection(payload);

      if (res.defectsFound > 0) {
        setFeedback({
          text: `บันทึกข้อมูลสำเร็จ! ตรวจพบข้อบกพร่อง ${res.defectsFound} จุด ระบบได้ส่งอีเมลแจ้งเตือนพร้อมรูปภาพไปยังผู้รับผิดชอบและแอดมินเรียบร้อยแล้ว`,
          type: 'warning',
        });
      } else {
        setFeedback({
          text: 'บันทึกการตรวจเช็คความปลอดภัย SBOP สำเร็จครบถ้วน 100% (Safety Score: ' + scorePercent + '%)',
          type: 'success',
        });
      }

      if (onSuccessSave) {
        onSuccessSave();
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setFeedback({ text: err.message || 'Save failed', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Group items by Category for clean UI view
  const categorizedItems: Record<string, ChecklistItemState[]> = {};
  items.forEach((item) => {
    const cat = item.category || 'ข้อกำหนดทั่วไป';
    if (!categorizedItems[cat]) categorizedItems[cat] = [];
    categorizedItems[cat].push(item);
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Form Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{t.tabChecklist}</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                  Doc. TE-EHS-053
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                บันทึกการสังเกตและตรวจประเมินพฤติกรรมความปลอดภัยหน้างาน แยกแผนก แยกรอบเดือนรอบปี
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleQuickFillAllOk}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition"
              title="ตั้งค่าทุกข้อเป็น OK ทั้งหมด"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>ผ่านทั้งหมด (All OK)</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mt-4 p-4 rounded-xl border text-sm flex items-start gap-3 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : feedback.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : feedback.type === 'warning' ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 font-medium">{feedback.text}</div>
            <button onClick={() => setFeedback(null)} className="text-xs underline font-semibold">
              ปิด
            </button>
          </div>
        )}

        {/* Form Selection Controls: Department, Year, Month, Layer, Shift, M/C */}
        <form onSubmit={handleSave} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Department */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-sky-600" />
                <span>{t.department} (Department)</span>
              </label>
              <select
                value={departmentCode}
                onChange={(e) => setDepartmentCode(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              >
                {departments.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name_th} ({d.total_questions || 0} ข้อ)
                  </option>
                ))}
              </select>
            </div>

            {/* Cycle Year & Month */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-sky-600" />
                  <span>{t.year}</span>
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:bg-white"
                >
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                  <option value={2024}>2024</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t.month}
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:bg-white"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      เดือน {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Inspection Layer */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>{t.layer}</span>
              </label>
              <select
                value={layer}
                onChange={(e) => setLayer(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              >
                <option value="Layer 1">Layer 1 (ตรวจประจำกะ/วัน - Daily)</option>
                <option value="Layer 2">Layer 2 (ตรวจรายสัปดาห์ - Weekly)</option>
                <option value="Layer 3">Layer 3 (ตรวจรายเดือน - Monthly Systems)</option>
              </select>
            </div>

            {/* Shift */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.shift}
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:bg-white"
              >
                <option value="กะ A (เช้า)">{t.shiftA}</option>
                <option value="กะ B (บ่าย)">{t.shiftB}</option>
                <option value="กะ C (ดึก)">{t.shiftC}</option>
                <option value="กะกลางวัน (Day)">{t.shiftDay}</option>
                <option value="กะกลางคืน (Night)">{t.shiftNight}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Machine & Products */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.machineAndProduct} *
              </label>
              <input
                type="text"
                required
                value={mcAndProducts}
                onChange={(e) => setMcAndProducts(e.target.value)}
                placeholder="เช่น เครื่องฉีด M/C 08 (ชิ้นส่วน Connector Type-C)"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white font-medium"
              />
            </div>

            {/* Audit Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.auditDate}
              </label>
              <input
                type="date"
                required
                value={auditDate}
                onChange={(e) => setAuditDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Real-time Score Board */}
          <div className="bg-gradient-to-r from-slate-900 to-sky-950 p-4 rounded-xl text-white flex flex-wrap items-center justify-between gap-4 shadow-sm border border-slate-800">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">รายการทั้งหมด</span>
                <span className="text-xl font-bold text-white">{items.length}</span>
              </div>
              <div className="border-l border-slate-800 pl-6">
                <span className="text-[11px] text-emerald-400 font-medium block">ผ่าน (OK)</span>
                <span className="text-xl font-bold text-emerald-400">{totalOk}</span>
              </div>
              <div className="border-l border-slate-800 pl-6">
                <span className="text-[11px] text-red-400 font-medium block">ไม่ผ่าน (NO)</span>
                <span className="text-xl font-bold text-red-400">{totalNo}</span>
              </div>
              <div className="border-l border-slate-800 pl-6">
                <span className="text-[11px] text-slate-400 font-medium block">N/A</span>
                <span className="text-xl font-bold text-slate-300">{totalNa}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-sky-200 font-semibold">{t.safetyScore}</div>
                <div className="text-2xl font-black text-white tracking-tight">
                  {scorePercent}%
                </div>
              </div>
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shadow ${
                  parseFloat(scorePercent) >= 95
                    ? 'bg-emerald-500 text-white'
                    : parseFloat(scorePercent) >= 85
                    ? 'bg-amber-500 text-white'
                    : 'bg-red-500 text-white'
                }`}
              >
                {parseFloat(scorePercent) >= 95 ? 'PASS' : 'WARN'}
              </div>
            </div>
          </div>

          {/* Checklist Items by Category */}
          <div className="space-y-6 pt-4">
            {loading ? (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-xs text-slate-500">กำลังโหลดหัวข้อการตรวจประเมินของแผนก {departmentCode}...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                ไม่พบคำถามการตรวจเช็คในหมวดนี้
              </div>
            ) : (
              Object.entries(categorizedItems).map(([categoryName, catItems]) => (
                <div key={categoryName} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  {/* Category Header */}
                  <div className="bg-slate-100 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div className="font-bold text-slate-800 text-xs tracking-wide uppercase flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                      <span>{categoryName}</span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500">
                      {catItems.length} ข้อ
                    </span>
                  </div>

                  {/* Items list */}
                  <div className="divide-y divide-slate-100">
                    {catItems.map((item) => {
                      const itemIndex = items.findIndex((i) => i.templateItemId === item.templateItemId);
                      const isDefect = item.result === 'NO';

                      return (
                        <div
                          key={item.templateItemId}
                          className={`p-4 transition ${
                            isDefect ? 'bg-red-50/40 border-l-4 border-l-red-500' : 'hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            {/* Question text */}
                            <div className="flex-1 space-y-1">
                              {item.subcategory && (
                                <div className="text-[11px] font-semibold text-sky-700 bg-sky-50 inline-block px-2 py-0.5 rounded">
                                  {item.subcategory}
                                </div>
                              )}
                              <p className="text-xs text-slate-800 font-medium leading-relaxed">
                                {item.question}
                              </p>
                              {item.method && (
                                <p className="text-[11px] text-slate-400 italic">
                                  วิธีตรวจ: {item.method}
                                </p>
                              )}
                            </div>

                            {/* Evaluation Buttons: OK / NO / N/A */}
                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                              <button
                                type="button"
                                onClick={() => handleResultChange(itemIndex, 'OK')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                  item.result === 'OK'
                                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>OK</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleResultChange(itemIndex, 'NO')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                  item.result === 'NO'
                                    ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-400'
                                    : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-700'
                                }`}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>NO</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleResultChange(itemIndex, 'N/A')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                                  item.result === 'N/A'
                                    ? 'bg-slate-600 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                              >
                                N/A
                              </button>
                            </div>
                          </div>

                          {/* When NO (Defect Found): Expandable Defect Form + Photo Upload to Cloudflare R2 */}
                          {isDefect && (
                            <div className="mt-3.5 pt-3.5 border-t border-red-200 bg-red-50/70 p-4 rounded-xl space-y-3 animate-fadeIn">
                              <div className="flex items-center justify-between text-xs font-bold text-red-800">
                                <span className="flex items-center gap-1.5">
                                  <AlertTriangle className="w-4 h-4 text-red-600" />
                                  <span>{t.defectDetails}</span>
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-slate-600 font-normal">ความรุนแรง:</span>
                                  <select
                                    value={item.severity}
                                    onChange={(e) => handleItemFieldChange(itemIndex, 'severity', e.target.value)}
                                    className="px-2 py-0.5 rounded bg-white border border-red-300 text-[11px] font-bold text-red-700"
                                  >
                                    <option value="Minor">{t.severityMinor}</option>
                                    <option value="Major">{t.severityMajor}</option>
                                  </select>
                                </div>
                              </div>

                              {/* Finding topic */}
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                  {t.findingTopic} *
                                </label>
                                <input
                                  type="text"
                                  required={isDefect}
                                  value={item.findingTopic}
                                  onChange={(e) => handleItemFieldChange(itemIndex, 'findingTopic', e.target.value)}
                                  placeholder={t.findingPlaceholder}
                                  className="w-full px-3 py-1.5 bg-white border border-red-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-red-400"
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-2">
                                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                    {t.actionPlan}
                                  </label>
                                  <input
                                    type="text"
                                    value={item.actionPlan}
                                    onChange={(e) => handleItemFieldChange(itemIndex, 'actionPlan', e.target.value)}
                                    placeholder={t.actionPlaceholder}
                                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-sky-400"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                    {t.responsiblePerson}
                                  </label>
                                  <input
                                    type="text"
                                    value={item.responsiblePerson}
                                    onChange={(e) => handleItemFieldChange(itemIndex, 'responsiblePerson', e.target.value)}
                                    placeholder={t.responsiblePlaceholder}
                                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                    {t.dueDate}
                                  </label>
                                  <input
                                    type="date"
                                    value={item.dueDate}
                                    onChange={(e) => handleItemFieldChange(itemIndex, 'dueDate', e.target.value)}
                                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
                                  />
                                </div>

                                {/* Photo Upload Button for Cloudflare R2 */}
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                    {t.attachPhoto}
                                  </label>
                                  {item.imageUrl ? (
                                    <div className="flex items-center gap-2 p-1.5 bg-white border border-emerald-300 rounded-lg">
                                      <img
                                        src={item.imageUrl}
                                        alt="Defect"
                                        className="w-10 h-10 object-cover rounded shadow-sm"
                                      />
                                      <div className="flex-1 truncate">
                                        <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                                          <Check className="w-3 h-3" />
                                          <span>อัปโหลดเข้า R2 สำเร็จ</span>
                                        </div>
                                        <a
                                          href={item.imageUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-[10px] text-sky-600 hover:underline block truncate"
                                        >
                                          {item.imageUrl}
                                        </a>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleRemovePhoto(itemIndex)}
                                        className="p-1 rounded text-red-500 hover:bg-red-50"
                                        title={t.removePhoto}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <label className="flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer shadow-sm transition">
                                      <Camera className="w-4 h-4 text-sky-600" />
                                      <span>
                                        {item.uploadingImage ? 'กำลังอัปโหลดไปยัง Cloudflare R2...' : t.takePhoto}
                                      </span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        className="hidden"
                                        disabled={item.uploadingImage}
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handlePhotoUpload(itemIndex, file);
                                        }}
                                      />
                                    </label>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Comments and Previous Findings */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              ส่วนสรุปความคิดเห็นและติดตามผล (Comments & Action Tracking)
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.previousFindings}
              </label>
              <textarea
                rows={2}
                value={previousFindings}
                onChange={(e) => setPreviousFindings(e.target.value)}
                placeholder={t.previousPlaceholder}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-sky-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.comments}
              </label>
              <textarea
                rows={2}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={t.commentsPlaceholder}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-sky-500 focus:bg-white"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-sky-600" />
                <span>เมื่อบันทึกข้อมูล หากมีข้อบกพร่อง (NO) ระบบจะส่งอีเมลแจ้งเตือนผู้รับผิดชอบทันที</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="submit"
                  disabled={saving || loading || items.length === 0}
                  className="w-full sm:w-auto px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg shadow-sky-600/20 text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? t.saving : t.saveInspection}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
