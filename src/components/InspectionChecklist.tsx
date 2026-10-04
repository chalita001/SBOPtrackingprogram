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
  Sparkles, 
  Info, 
  Check, 
  Lock, 
  ExternalLink,
  ShieldAlert,
  UserCheck,
  ChevronRight,
  Eye,
  Hash,
  Tag
} from 'lucide-react';
import { PriorLayerChecklistView } from './PriorLayerChecklistView';

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

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentDateStr = new Date().toISOString().split('T')[0];

  // Determine user role layer: Layer 1, Layer 2, Layer 3, or null for admin (Admin can select any)
  const userRoleLayer = React.useMemo<'Layer 1' | 'Layer 2' | 'Layer 3' | null>(() => {
    if (!user) return null;
    const r = (user.role || '').toLowerCase();
    if (r === 'admin') return null; // Admin can inspect any layer
    if (r === 'layer3' || r === 'manager') return 'Layer 3';
    if (r === 'layer2' || r === 'supervisor') return 'Layer 2';
    return 'Layer 1'; // layer1, leader, inspector, staff, default
  }, [user]);

  // Header State
  const [departmentCode, setDepartmentCode] = useState<string>(user?.department || 'MOLD');
  const [year] = useState<number>(currentYear); // Locked to current year
  const [month] = useState<number>(currentMonth); // Locked to current month
  const [auditDate] = useState<string>(currentDateStr); // Locked to current date
  const [layer, setLayer] = useState<string>(userRoleLayer || 'Layer 1');
  const [shift, setShift] = useState<string>('กะ A (เช้า)');
  const [mcAndProducts, setMcAndProducts] = useState<string>('');
  const [comments, setComments] = useState<string>('');
  const [previousFindings, setPreviousFindings] = useState<string>('');

  // Inspection Code (รหัสรายการ e.g. 001, 002)
  const [inspectionCode, setInspectionCode] = useState<string>('001');
  const [availableCodes, setAvailableCodes] = useState<any[]>([]);
  const [isCustomCode, setIsCustomCode] = useState<boolean>(false);
  const [customCodeInput, setCustomCodeInput] = useState<string>('');

  // Items State
  const [items, setItems] = useState<ChecklistItemState[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Prior layers inspection data for Layer 2 & Layer 3 verification
  const [priorLayersData, setPriorLayersData] = useState<{ layer1: any; layer2: any } | null>(null);
  const [loadingPrior, setLoadingPrior] = useState<boolean>(false);

  // Is department locked? (Locked if user has a department and is not admin)
  const isDeptLocked = Boolean(user?.department && user.role !== 'admin');

  // Enforce layer lock when userRoleLayer is set
  useEffect(() => {
    if (userRoleLayer) {
      setLayer(userRoleLayer);
    }
  }, [userRoleLayer]);

  // Quick fill all OK
  const handleQuickFillAllOk = () => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        result: 'OK',
      }))
    );
  };

  // Load Departments & enforce user's department
  useEffect(() => {
    api.getDepartments().then((data) => {
      setDepartments(data || []);
      if (user?.department && user.role !== 'admin') {
        setDepartmentCode(user.department);
      }
    }).catch(console.error);
  }, [user]);

  // Load inspection batch codes for department & month
  const fetchCodes = async () => {
    try {
      const data = await api.getInspectionCodes(departmentCode, year, month);
      setAvailableCodes(data || []);
      return data || [];
    } catch (err) {
      console.warn('Failed to load inspection codes:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchCodes().then((codes) => {
      if (codes && codes.length > 0) {
        // If current inspectionCode is not in codes, select first code
        const exists = codes.some((c: any) => c.inspection_code === inspectionCode);
        if (!exists) {
          const first = codes[0];
          setInspectionCode(first.inspection_code);
          if (first.mc_and_products && !mcAndProducts) {
            setMcAndProducts(first.mc_and_products);
          }
          if (first.shift) {
            setShift(first.shift);
          }
        }
      }
    });
  }, [departmentCode, year, month]);

  // Load prior layers data when layer is Layer 2 or Layer 3, filtered by inspectionCode
  useEffect(() => {
    if (layer === 'Layer 2' || layer === 'Layer 3') {
      setLoadingPrior(true);
      api.getPriorLayers(departmentCode, year, month, inspectionCode)
        .then((data) => {
          setPriorLayersData(data);
          // If machine name is empty and prior layer has it, prefill it!
          if (data?.layer1?.mc_and_products && !mcAndProducts) {
            setMcAndProducts(data.layer1.mc_and_products);
          }
          if (data?.layer1?.shift) {
            setShift(data.layer1.shift);
          }
        })
        .catch((err) => {
          console.warn('Failed to load prior layers data:', err);
        })
        .finally(() => {
          setLoadingPrior(false);
        });
    } else {
      setPriorLayersData(null);
    }
  }, [departmentCode, layer, year, month, inspectionCode]);

  // Handle switching or selecting inspection code
  const handleSelectCode = (codeVal: string) => {
    if (codeVal === '__NEW__') {
      setIsCustomCode(true);
      const nextNum = availableCodes.length + 1;
      const formatted = String(nextNum).padStart(3, '0');
      setCustomCodeInput(formatted);
      setInspectionCode(formatted);
    } else {
      setIsCustomCode(false);
      setInspectionCode(codeVal);
      const item = availableCodes.find((c: any) => c.inspection_code === codeVal);
      if (item) {
        if (item.mc_and_products) setMcAndProducts(item.mc_and_products);
        if (item.shift) setShift(item.shift);
      }
    }
  };

  const handleCustomCodeChange = (val: string) => {
    setCustomCodeInput(val);
    setInspectionCode(val.trim() || '001');
  };

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
          dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
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
        inspectionCode: (inspectionCode || '001').trim(),
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
      await fetchCodes();

      if (res.defectsFound > 0) {
        setFeedback({
          text: `บันทึกข้อมูลการตรวจสำเร็จ! (รหัสรายการ: ${inspectionCode}) ตรวจพบข้อบกพร่อง ${res.defectsFound} จุด ระบบได้ส่งอีเมลแจ้งเตือนเรียบร้อยแล้ว`,
          type: 'warning',
        });
      } else {
        setFeedback({
          text: `บันทึกการตรวจเช็คระดับ ${layer} (รหัสรายการ: ${inspectionCode}) สำเร็จครบถ้วน 100% (Safety Score: ${scorePercent}%)`,
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

  // Group items by Category
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
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {layer === 'Layer 1' ? 'Layer 1 (Leader)' : layer === 'Layer 2' ? 'Layer 2 (Supervisor)' : 'Layer 3 (Manager)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ระบบสังเกตและตรวจประเมินพฤติกรรมความปลอดภัยหน้างาน (SBOP) แยกระดับ Leader / Supervisor / Manager
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

        {/* Form Controls: Locked Department, Locked Year/Month, Layer Level */}
        <form onSubmit={handleSave} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Department (Locked to user's department) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-sky-600" />
                  <span>{t.department}</span>
                </label>
                {isDeptLocked && (
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5 border border-amber-200">
                    <Lock className="w-2.5 h-2.5" />
                    <span>ล็อคตามแผนกของคุณ</span>
                  </span>
                )}
              </div>
              <select
                disabled={isDeptLocked}
                value={departmentCode}
                onChange={(e) => setDepartmentCode(e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-semibold text-slate-800 transition ${
                  isDeptLocked 
                    ? 'bg-slate-100 border-slate-300 cursor-not-allowed text-slate-600'
                    : 'bg-slate-50 border-slate-300 focus:ring-2 focus:ring-sky-500 focus:bg-white'
                }`}
              >
                {departments.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name_th} ({d.total_questions || 0} ข้อ)
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Cycle Year & Month (Locked to current period) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-sky-600" />
                    <span>{t.year}</span>
                  </label>
                  <Lock className="w-2.5 h-2.5 text-slate-400" />
                </div>
                <input
                  type="text"
                  disabled
                  value={`${year} (ปัจจุบัน)`}
                  className="w-full px-3 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 cursor-not-allowed"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {t.month}
                  </label>
                  <Lock className="w-2.5 h-2.5 text-slate-400" />
                </div>
                <input
                  type="text"
                  disabled
                  value={`เดือน ${month} (ปัจจุบัน)`}
                  className="w-full px-3 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 cursor-not-allowed"
                />
              </div>
            </div>

            {/* 3. Layer Level Selection (Locked to user role, Admin can choose) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>ระดับการตรวจ (Inspection Layer)</span>
                </label>
                {userRoleLayer ? (
                  <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-semibold flex items-center gap-1 border border-amber-200">
                    <Lock className="w-2.5 h-2.5" />
                    <span>ล็อคตามสิทธิ์ {userRoleLayer}</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-semibold border border-purple-200">
                    Admin: เลือกได้ทุกระดับ
                  </span>
                )}
              </div>

              {userRoleLayer ? (
                <div className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between cursor-not-allowed">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      layer === 'Layer 1' ? 'bg-emerald-500' :
                      layer === 'Layer 2' ? 'bg-indigo-600' : 'bg-purple-600'
                    }`} />
                    <span>
                      {layer === 'Layer 1' && 'Layer 1 — Leader (หัวหน้างานระดับต้น)'}
                      {layer === 'Layer 2' && 'Layer 2 — Supervisor (หัวหน้างานระดับกุม)'}
                      {layer === 'Layer 3' && 'Layer 3 — Manager (ผู้จัดการแผนก)'}
                    </span>
                  </div>
                </div>
              ) : (
                <select
                  value={layer}
                  onChange={(e) => setLayer(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-sky-50 border-2 border-sky-400 rounded-xl text-xs font-bold text-sky-900 focus:ring-2 focus:ring-sky-500 transition shadow-sm"
                >
                  <option value="Layer 1">Layer 1 — Leader (ตรวจรายกะ/รายวัน)</option>
                  <option value="Layer 2">Layer 2 — Supervisor (ตรวจรายสัปดาห์ & ตรวจทาน Layer 1)</option>
                  <option value="Layer 3">Layer 3 — Manager (ตรวจรายเดือน & ตรวจทาน Layer 1-2)</option>
                </select>
              )}
            </div>

            {/* 4. Shift */}
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

          {/* Row 2: Inspection Code, Machine/Products, Current Date */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-1">
            {/* รหัสรายการ (Inspection Code) */}
            <div className="sm:col-span-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-sky-600" />
                  <span>รหัสรายการ (Inspection Code) *</span>
                </label>
                <span className="text-[10px] text-slate-500">
                  {availableCodes.length > 0 ? `พบ ${availableCodes.length} รหัสในรอบนี้` : 'รหัสใหม่'}
                </span>
              </div>

              {!isCustomCode && availableCodes.length > 0 ? (
                <div className="flex gap-2">
                  <select
                    value={inspectionCode}
                    onChange={(e) => handleSelectCode(e.target.value)}
                    className="w-full px-3 py-2 bg-sky-50/70 border-2 border-sky-400 rounded-xl text-xs font-bold text-sky-950 focus:ring-2 focus:ring-sky-500 transition shadow-sm"
                  >
                    {availableCodes.map((c) => (
                      <option key={c.inspection_code} value={c.inspection_code}>
                        รหัส {c.inspection_code} — {c.mc_and_products} ({c.shift}) 
                        {c.has_layer1 ? ' [L1 ✅]' : ' [L1 ⏳]'}
                        {c.has_layer2 ? ' [L2 ✅]' : ''}
                        {c.has_layer3 ? ' [L3 ✅]' : ''}
                      </option>
                    ))}
                    <option value="__NEW__">+ สร้างหรือระบุรหัสใหม่ (New Code)...</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleSelectCode('__NEW__')}
                    className="px-2.5 py-2 bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold rounded-xl text-xs whitespace-nowrap transition shadow-sm"
                    title="สร้างรหัสรายการใหม่"
                  >
                    + รหัสใหม่
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={isCustomCode ? customCodeInput : inspectionCode}
                      onChange={(e) => handleCustomCodeChange(e.target.value)}
                      placeholder="เช่น 001, 002"
                      className="w-full pl-8 pr-3 py-2 bg-white border-2 border-sky-400 rounded-xl text-xs font-bold text-sky-950 focus:ring-2 focus:ring-sky-500 transition shadow-sm"
                    />
                  </div>
                  {availableCodes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCode(false);
                        if (availableCodes[0]) handleSelectCode(availableCodes[0].inspection_code);
                      }}
                      className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs whitespace-nowrap transition"
                    >
                      เลือกรหัสเดิม
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Machine & Products */}
            <div className="sm:col-span-5">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.machineAndProduct} *
              </label>
              <input
                type="text"
                required
                value={mcAndProducts}
                onChange={(e) => setMcAndProducts(e.target.value)}
                placeholder="เช่น เครื่องฉีด M/C 08 (Connector Type-C) หรือ โซนประกอบ Line 3"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white font-medium"
              />
            </div>

            {/* Locked Current Date */}
            <div className="sm:col-span-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {t.auditDate}
                </label>
                <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" />
                  <span>วันปัจจุบัน</span>
                </span>
              </div>
              <input
                type="text"
                disabled
                value={auditDate}
                className="w-full px-3.5 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 cursor-not-allowed"
              />
            </div>
          </div>

          {/* ============================================================== */}
          {/* SPECIAL SECTION: PRIOR LAYER VERIFICATION BOX                  */}
          {/* When Layer 2: Shows Layer 1 answers to verify                  */}
          {/* When Layer 3: Shows Layer 1 & 2 answers to review & audit       */}
          {/* ============================================================== */}

          {/* Layer 2: Supervisor reviewing Layer 1 Leader's inspection */}
          {layer === 'Layer 2' && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm animate-fadeIn">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-sm">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-indigo-950">
                      การตรวจสอบคำตอบและผลการตรวจของ Layer 1 (Leader Verification)
                    </h3>
                    <p className="text-xs text-indigo-700">
                      Supervisor ตรวจสอบผลการตรวจเช็คหน้างานของ Leader รายการต่อรายการตามแบบฟอร์ม เพื่อยืนยันว่าปัญหาได้รับการแก้ไขและนำขึ้นบอร์ด SBOP แล้ว
                    </p>
                  </div>
                </div>
                <span className="text-xs px-3 py-1 rounded-full font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 shrink-0">
                  Supervisor Audit
                </span>
              </div>

              {/* Inspection Code Target Info */}
              <div className="flex flex-wrap items-center justify-between bg-indigo-100/70 text-indigo-900 px-4 py-2.5 rounded-2xl text-xs font-semibold gap-2">
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  <span>ตรวจสอบผลตรวจรหัสรายการ: <strong className="text-indigo-950 font-bold bg-white px-2.5 py-0.5 rounded-lg border border-indigo-200">#{inspectionCode}</strong></span>
                  {mcAndProducts && <span className="text-indigo-700 font-normal">({mcAndProducts})</span>}
                </div>
                {priorLayersData?.layer1 ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    พบผลตรวจ Layer 1 เรียบร้อย ✅
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    ยังไม่มีผลตรวจ Layer 1 ในรหัสนี้ ⏳
                  </span>
                )}
              </div>

              {loadingPrior ? (
                <div className="py-8 text-center text-xs text-indigo-600 font-medium">
                  กำลังดึงผลตรวจของ Layer 1 (รหัส {inspectionCode})...
                </div>
              ) : priorLayersData?.layer1 ? (
                <PriorLayerChecklistView
                  inspection={priorLayersData.layer1}
                  layerTitle="Layer 1 (Leader)"
                  inspectionCode={inspectionCode}
                  defaultExpanded={true}
                />
              ) : (
                <div className="py-6 text-center bg-white/70 rounded-2xl border border-dashed border-indigo-200 text-slate-500 text-xs">
                  ℹ️ ยังไม่พบบันทึกการตรวจของ Layer 1 (Leader) ในรอบและรหัสนี้ สามารถตอบแบบประเมิน Layer 2 ได้ตามปกติ
                </div>
              )}
            </div>
          )}

          {/* Layer 3: Manager reviewing Layer 1 Leader & Layer 2 Supervisor */}
          {layer === 'Layer 3' && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-3xl p-5 sm:p-6 space-y-5 shadow-sm animate-fadeIn">
              <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-purple-700 text-white shadow-sm">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-purple-950">
                      การทบทวนผลของ Layer 1 (Leader) และ Layer 2 (Supervisor) Systems Verification
                    </h3>
                    <p className="text-xs text-purple-700">
                      Manager ทบทวนคำตอบและการดำเนินงานด้านความปลอดภัยของทั้งสองระดับ เพื่อนำประเด็นเข้าที่ประชุม GO-Meeting หรือขยายผลสู่ Plant VSM
                    </p>
                  </div>
                </div>
                <span className="text-xs px-3 py-1 rounded-full font-bold bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                  Manager Review
                </span>
              </div>

              {/* Inspection Code Target Info */}
              <div className="flex flex-wrap items-center justify-between bg-purple-100/70 text-purple-900 px-4 py-2.5 rounded-2xl text-xs font-semibold gap-2">
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-purple-600" />
                  <span>ทบทวนผลตรวจรหัสรายการ: <strong className="text-purple-950 font-bold bg-white px-2.5 py-0.5 rounded-lg border border-purple-200">#{inspectionCode}</strong></span>
                  {mcAndProducts && <span className="text-purple-700 font-normal">({mcAndProducts})</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    priorLayersData?.layer1 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                  }`}>
                    Layer 1: {priorLayersData?.layer1 ? 'ตรวจแล้ว ✅' : 'ไม่มี ⏳'}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    priorLayersData?.layer2 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                  }`}>
                    Layer 2: {priorLayersData?.layer2 ? 'ตรวจแล้ว ✅' : 'ไม่มี ⏳'}
                  </span>
                </div>
              </div>

              {loadingPrior ? (
                <div className="py-8 text-center text-xs text-purple-600 font-medium">
                  กำลังดึงผลตรวจของ Layer 1 & 2 (รหัส {inspectionCode})...
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Layer 1 Inspection Results */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                        <span>1. ผลการตรวจของ Layer 1 (Leader)</span>
                      </h4>
                      {priorLayersData?.layer1 && (
                        <span className="text-[11px] text-slate-500">
                          ผู้ตรวจ: {priorLayersData.layer1.auditor_name} ({priorLayersData.layer1.audit_date})
                        </span>
                      )}
                    </div>
                    {priorLayersData?.layer1 ? (
                      <PriorLayerChecklistView
                        inspection={priorLayersData.layer1}
                        layerTitle="Layer 1 (Leader)"
                        inspectionCode={inspectionCode}
                        defaultExpanded={false}
                      />
                    ) : (
                      <div className="py-4 text-center bg-white/70 rounded-2xl border border-dashed border-purple-200 text-slate-500 text-xs">
                        ℹ️ ยังไม่พบบันทึกการตรวจของ Layer 1 (Leader) ในรหัสนี้
                      </div>
                    )}
                  </div>

                  {/* Layer 2 Inspection Results */}
                  <div className="space-y-2 pt-2 border-t border-purple-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                        <span>2. ผลการตรวจของ Layer 2 (Supervisor)</span>
                      </h4>
                      {priorLayersData?.layer2 && (
                        <span className="text-[11px] text-slate-500">
                          ผู้ตรวจ: {priorLayersData.layer2.auditor_name} ({priorLayersData.layer2.audit_date})
                        </span>
                      )}
                    </div>
                    {priorLayersData?.layer2 ? (
                      <PriorLayerChecklistView
                        inspection={priorLayersData.layer2}
                        layerTitle="Layer 2 (Supervisor)"
                        inspectionCode={inspectionCode}
                        defaultExpanded={true}
                      />
                    ) : (
                      <div className="py-4 text-center bg-white/70 rounded-2xl border border-dashed border-purple-200 text-slate-500 text-xs">
                        ℹ️ ยังไม่พบบันทึกการตรวจของ Layer 2 (Supervisor) ในรหัสนี้
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Real-time Score Board */}
          <div className="bg-gradient-to-r from-slate-900 to-sky-950 p-4 rounded-xl text-white flex flex-wrap items-center justify-between gap-4 shadow-sm border border-slate-800">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">รายการตรวจระดับ {layer}</span>
                <span className="text-xl font-bold text-white">{items.length} ข้อ</span>
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
                <p className="text-xs text-slate-500">กำลังโหลดหัวข้อการตรวจประเมินของแผนก {departmentCode} ({layer})...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                ไม่พบคำถามการตรวจเช็คในระดับนี้
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

                          {/* When NO: Defect Form + Photo Upload to Cloudflare R2 */}
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
                <span>
                  {layer === 'Layer 1' && 'Leader: บันทึกการตรวจความปลอดภัยหน้างานประจำวัน/กะ'}
                  {layer === 'Layer 2' && 'Supervisor: ทบทวนและติดตามผลของ Layer 1 พร้อมรายงานประจำสัปดาห์'}
                  {layer === 'Layer 3' && 'Manager: ตรวจประเมินระดับระบบและติดตามผลเพื่อนำเข้าที่ประชุม GO-Meeting'}
                </span>
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
