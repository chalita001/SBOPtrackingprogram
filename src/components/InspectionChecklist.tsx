import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, normalizeImageUrl } from '../services/api';
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
  User,
  ChevronRight,
  Eye,
  Hash,
  Tag,
  Sliders
} from 'lucide-react';
import { PriorLayerChecklistView } from './PriorLayerChecklistView';
import { InspectionCodeHistoryModal } from './InspectionCodeHistoryModal';
import { ChecklistManagerModal } from './ChecklistManagerModal';
import { localizeQuestion, localizeCategory, localizeSubcategory, localizeMethod } from '../i18n/translations';

interface ChecklistItemState {
  templateItemId: number;
  question: string;
  category: string;
  subcategory?: string;
  method?: string;
  layer: string;
  result: 'OK' | 'NO' | '';
  findingTopic: string;
  severity: 'Minor' | 'Major';
  actionPlan: string;
  responsiblePerson: string;
  responsibleDept?: string;
  isCustomResponsible?: boolean;
  dueDate: string;
  imageUrl?: string;
  imageKey?: string;
  uploadingImage?: boolean;
}

export const InspectionChecklist: React.FC<{ onSuccessSave?: () => void }> = ({ onSuccessSave }) => {
  const { user, language, t } = useAuth();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentDateStr = new Date().toISOString().split('T')[0];

  // Determine user role layer: Layer 1, Layer 2, Layer 3, or null for admin/superadmin (Admin/Superadmin can select any)
  const userRoleLayer = React.useMemo<'Layer 1' | 'Layer 2' | 'Layer 3' | null>(() => {
    if (!user) return null;
    const r = (user.role || '').toLowerCase();
    if (r === 'admin' || r === 'superadmin') return null; // Admin and Super Admin can inspect any layer
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
  const [shift, setShift] = useState<string>('เช้า');
  const [mcAndProducts, setMcAndProducts] = useState<string>('');
  const [comments, setComments] = useState<string>('');
  const [previousFindings, setPreviousFindings] = useState<string>('');

  // Inspection Code (รหัสรายการ e.g. 001, 002)
  const [inspectionCode, setInspectionCode] = useState<string>('001');
  const [availableCodes, setAvailableCodes] = useState<any[]>([]);
  const [isCustomCode, setIsCustomCode] = useState<boolean>(false);
  const [customCodeInput, setCustomCodeInput] = useState<string>('');
  const [showCodeHistoryModal, setShowCodeHistoryModal] = useState<boolean>(false);
  const [showChecklistManager, setShowChecklistManager] = useState<boolean>(false);
  const [checklistVersion, setChecklistVersion] = useState<number>(0);

  // Next available numeric code (e.g. 001, 002, 003...)
  const nextAvailableCode = React.useMemo(() => {
    const usedNums = availableCodes
      .map((c: any) => parseInt(c.inspection_code, 10))
      .filter((n: number) => !isNaN(n));
    let next = 1;
    while (usedNums.includes(next)) {
      next++;
    }
    return String(next).padStart(3, '0');
  }, [availableCodes]);

  // Check if selected code was already inspected by Layer 1
  const selectedCodeObj = availableCodes.find((c: any) => c.inspection_code === inspectionCode);
  const isL1CodeTaken = layer === 'Layer 1' && Boolean(selectedCodeObj?.has_layer1);

  // Items State
  const [items, setItems] = useState<ChecklistItemState[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [usersDirectory, setUsersDirectory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Prior layers inspection data for Layer 2 & Layer 3 verification
  const [priorLayersData, setPriorLayersData] = useState<{ layer1: any; layer2: any } | null>(null);
  const [loadingPrior, setLoadingPrior] = useState<boolean>(false);

  // Is department locked? (Locked if user has a department and is not admin/superadmin)
  const isPrivilegedUser = user?.role === 'admin' || user?.role === 'superadmin';
  const isDeptLocked = Boolean(user?.department && !isPrivilegedUser);

  // Enforce layer lock when userRoleLayer is set
  useEffect(() => {
    if (userRoleLayer) {
      setLayer(userRoleLayer);
    }
  }, [userRoleLayer]);

  // Load Departments & enforce user's department
  useEffect(() => {
    api.getDepartments().then((data) => {
      setDepartments(data || []);
      if (user?.department && !isPrivilegedUser) {
        setDepartmentCode(user.department);
      }
    }).catch(console.error);

    api.getUsersDirectory().then((data) => {
      setUsersDirectory(data || []);
    }).catch(console.error);
  }, [user, isPrivilegedUser]);

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
        if (layer === 'Layer 1') {
          // If current code already has Layer 1, prefer an unused code or the next code
          const currentItem = codes.find((c: any) => c.inspection_code === inspectionCode);
          if (currentItem?.has_layer1) {
            const availableForL1 = codes.find((c: any) => !c.has_layer1);
            if (availableForL1) {
              setInspectionCode(availableForL1.inspection_code);
              if (availableForL1.mc_and_products) setMcAndProducts(availableForL1.mc_and_products);
              if (availableForL1.shift) setShift(availableForL1.shift);
            } else {
              const usedNums = codes.map((c: any) => parseInt(c.inspection_code, 10)).filter((n: number) => !isNaN(n));
              let next = 1;
              while (usedNums.includes(next)) next++;
              const formatted = String(next).padStart(3, '0');
              setInspectionCode(formatted);
              setIsCustomCode(true);
              setCustomCodeInput(formatted);
            }
          } else {
            const exists = codes.some((c: any) => c.inspection_code === inspectionCode);
            if (!exists) {
              const availableForL1 = codes.find((c: any) => !c.has_layer1) || codes[0];
              setInspectionCode(availableForL1.inspection_code);
              if (availableForL1.mc_and_products && !mcAndProducts) setMcAndProducts(availableForL1.mc_and_products);
              if (availableForL1.shift) setShift(availableForL1.shift);
            }
          }
        } else {
          // Layer 2 / Layer 3: select first code that HAS Layer 1
          const codeWithL1 = codes.find((c: any) => c.has_layer1);
          if (codeWithL1) {
            const currentItem = codes.find((c: any) => c.inspection_code === inspectionCode);
            if (!currentItem || !currentItem.has_layer1) {
              setInspectionCode(codeWithL1.inspection_code);
              if (codeWithL1.mc_and_products && !mcAndProducts) setMcAndProducts(codeWithL1.mc_and_products);
              if (codeWithL1.shift) setShift(codeWithL1.shift);
            }
          }
        }
      }
    });
  }, [departmentCode, year, month, layer]);

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
      setCustomCodeInput(nextAvailableCode);
      setInspectionCode(nextAvailableCode);
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

  // Load Checklist questions when Department, Layer, or Language changes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setFeedback(null);

    api.getChecklistTemplates(departmentCode, layer)
      .then((data) => {
        if (!isMounted) return;
        const initialItems: ChecklistItemState[] = (data.items || []).map((tmpl: any) => ({
          templateItemId: tmpl.id,
          question: language === 'en'
            ? (tmpl.question_en || localizeQuestion(tmpl.question_th, 'en'))
            : (tmpl.question_th || tmpl.question_en),
          category: localizeCategory(tmpl.category || 'General', language),
          subcategory: localizeSubcategory(tmpl.subcategory || '', language),
          method: localizeMethod(tmpl.method || (language === 'th' ? 'สังเกตและตรวจสอบ' : 'Observe & Audit'), language),
          layer: tmpl.layer || layer,
          result: '', // Starts unselected: auditor must choose OK or NO manually
          findingTopic: '',
          severity: 'Minor',
          actionPlan: '',
          responsiblePerson: '',
          responsibleDept: departmentCode,
          isCustomResponsible: false,
          dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
          imageUrl: '',
          imageKey: '',
          uploadingImage: false,
        }));
        setItems(initialItems);
      })
      .catch((err) => {
        if (isMounted) setFeedback({ text: (language === 'th' ? 'ไม่สามารถโหลดรายการตรวจเช็คได้: ' : 'Failed to load checklist: ') + err.message, type: 'error' });
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [departmentCode, layer, language, checklistVersion]);

  // Handle Result change (OK, NO)
  const handleResultChange = (index: number, result: 'OK' | 'NO') => {
    setItems((prev) => {
      const next = [...prev];
      const cur = next[index];
      const dept = cur.responsibleDept || departmentCode;
      let respPerson = cur.responsiblePerson;
      if (result === 'NO' && !respPerson) {
        const deptUsers = usersDirectory.filter((u) => u.department === dept);
        if (deptUsers.length > 0) {
          respPerson = `${deptUsers[0].first_name} ${deptUsers[0].last_name}`;
        }
      }
      next[index] = { 
        ...cur, 
        result,
        responsibleDept: dept,
        responsiblePerson: respPerson,
      };
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
      alert((language === 'en' ? 'Upload photo to Cloudflare R2 failed: ' : 'อัปโหลดรูปภาพไปยัง Cloudflare R2 ล้มเหลว: ') + err.message);
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
  const totalPending = items.filter((i) => !i.result).length;
  const totalEvaluated = totalOk + totalNo;
  const scorePercent = totalEvaluated > 0 ? ((totalOk / totalEvaluated) * 100).toFixed(1) : '100.0';

  // Save Inspection Form
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isL1CodeTaken) {
      setFeedback({
        text: language === 'th'
          ? `รหัสเอกสาร #${inspectionCode} ได้รับการตรวจโดย Layer 1 ไปแล้ว (${selectedCodeObj?.layer1_auditor || ''}) — ใน Layer 1 ตรวจได้เพียงครั้งเดียวต่อรหัส ไม่สามารถสร้างซ้ำได้ กรุณาใช้รหัสใหม่ เช่น #${nextAvailableCode}`
          : `Document Code #${inspectionCode} has already been inspected by Layer 1. Each code can only be audited once by Layer 1. Please use a new code like #${nextAvailableCode}.`,
        type: 'error'
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!mcAndProducts.trim()) {
      setFeedback({
        text: language === 'en' ? 'Please specify machine and product details (M/C and Products)' : 'กรุณากรอกข้อมูลเครื่องจักรและผลิตภัณฑ์ (M/C and Products)',
        type: 'error'
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const unevaluated = items.find((i) => !i.result);
    if (unevaluated) {
      setFeedback({
        text: language === 'en'
          ? `Please select OK or NO for all items before saving (${totalPending} questions remaining).`
          : `กรุณาติ๊กเลือก OK หรือ NO ให้ครบทุกข้อก่อนบันทึก (เหลืออีก ${totalPending} ข้อที่ยังไม่ได้ติ๊ก)`,
        type: 'error'
      });
      return;
    }

    const invalidDefect = items.find((i) => i.result === 'NO' && !i.findingTopic.trim());
    if (invalidDefect) {
      setFeedback({
        text: language === 'en'
          ? `Please describe the finding topic for defect item: "${invalidDefect.question.substring(0, 40)}..."`
          : `กรุณากรอกรายละเอียดปัญหาที่พบสำหรับข้อ: "${invalidDefect.question.substring(0, 40)}..."`,
        type: 'error'
      });
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
          text: language === 'en'
            ? `Inspection saved! (Inspection Code: ${inspectionCode}) Found ${res.defectsFound} defect(s). Email alerts dispatched.`
            : `บันทึกข้อมูลการตรวจสำเร็จ! (รหัสรายการ: ${inspectionCode}) ตรวจพบข้อบกพร่อง ${res.defectsFound} จุด ระบบได้ส่งอีเมลแจ้งเตือนเรียบร้อยแล้ว`,
          type: 'warning',
        });
      } else {
        setFeedback({
          text: language === 'en'
            ? `Saved ${layer} inspection (Inspection Code: ${inspectionCode}) successfully 100% (Safety Score: ${scorePercent}%)`
            : `บันทึกการตรวจเช็คระดับ ${layer} (รหัสรายการ: ${inspectionCode}) สำเร็จครบถ้วน 100% (Safety Score: ${scorePercent}%)`,
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
    const cat = item.category || (language === 'en' ? 'General Requirement' : 'ข้อกำหนดทั่วไป');
    if (!categorizedItems[cat]) categorizedItems[cat] = [];
    categorizedItems[cat].push(item);
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Form Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#F37021] text-white flex items-center justify-center shadow-md shadow-[#F37021]/20 shrink-0">
              <ClipboardCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">{t.tabChecklist}</h1>
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                  Doc. TE-EHS-053
                </span>
                <span className="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-bold bg-orange-50 text-[#F37021] border border-orange-200">
                  {layer === 'Layer 1' ? 'Layer 1 (Leader)' : layer === 'Layer 2' ? 'Layer 2 (Supervisor)' : 'Layer 3 (Manager)'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                {language === 'en'
                  ? 'On-site safety observation and verification form (SBOP) with Leader / Supervisor / Manager 3-layer audit'
                  : 'ระบบสังเกตและตรวจประเมินพฤติกรรมความปลอดภัยหน้างาน (SBOP) แยกระดับ Leader / Supervisor / Manager'}
              </p>
            </div>
          </div>

          {user?.role === 'superadmin' && (
            <button
              type="button"
              onClick={() => setShowChecklistManager(true)}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 self-start lg:self-center shrink-0 border border-purple-400/30"
            >
              <Sliders className="w-4 h-4 text-purple-200" />
              <span>{language === 'th' ? '⚙️ จัดการข้อตรวจเช็ค (Super Admin)' : '⚙️ Checklist Manager (Super Admin)'}</span>
            </button>
          )}
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
              {t.close}
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
                  <Building2 className="w-3.5 h-3.5 text-[#F37021]" />
                  <span>{t.department}</span>
                </label>
                {isDeptLocked && (
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5 border border-amber-200">
                    <Lock className="w-2.5 h-2.5" />
                    <span>{t.lockedDepartmentNotice}</span>
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
                    : 'bg-slate-50 border-slate-300 focus:ring-2 focus:ring-[#F37021] focus:bg-white'
                }`}
              >
                {departments.map((d) => (
                  <option key={d.code} value={d.code}>
                    {language === 'en' ? (d.name_en || d.code) : d.name_th} ({d.total_questions || 0} {t.itemsCountUnit})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Cycle Year & Month (Locked to current period) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#F37021]" />
                    <span>{t.year}</span>
                  </label>
                  <Lock className="w-2.5 h-2.5 text-slate-400" />
                </div>
                <input
                  type="text"
                  disabled
                  value={`${year} (${language === 'en' ? 'Current' : 'ปัจจุบัน'})`}
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
                  value={language === 'th' ? `เดือน ${month} (ปัจจุบัน)` : `Month ${month} (Current)`}
                  className="w-full px-3 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 cursor-not-allowed"
                />
              </div>
            </div>

            {/* 3. Layer Level Selection (Locked to user role, Admin can choose) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{t.layer}</span>
                </label>
                {userRoleLayer ? (
                  <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-semibold flex items-center gap-1 border border-amber-200">
                    <Lock className="w-2.5 h-2.5" />
                    <span>{language === 'th' ? `ล็อคตามสิทธิ์ ${userRoleLayer}` : `Locked to ${userRoleLayer}`}</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-semibold border border-purple-200">
                    {language === 'th' ? 'Admin: เลือกได้ทุกระดับ' : 'Admin: Select Any Layer'}
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
                      {layer === 'Layer 1' && (language === 'th' ? 'Layer 1 — Leader (เป้าหมาย 40 ครั้ง/เดือน)' : 'Layer 1 — Leader (Target: 40/month)')}
                      {layer === 'Layer 2' && (language === 'th' ? 'Layer 2 — Supervisor (เป้าหมาย 4 ครั้ง/เดือน)' : 'Layer 2 — Supervisor (Target: 4/month)')}
                      {layer === 'Layer 3' && (language === 'th' ? 'Layer 3 — Manager (เป้าหมาย 1 ครั้ง/เดือน)' : 'Layer 3 — Manager (Target: 1/month)')}
                    </span>
                  </div>
                </div>
              ) : (
                <select
                  value={layer}
                  onChange={(e) => setLayer(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-orange-50/60 border-2 border-[#F37021]/50 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#F37021] transition shadow-sm"
                >
                  <option value="Layer 1">{language === 'th' ? 'Layer 1 — Leader (40 ครั้ง/เดือน)' : 'Layer 1 — Leader (40/month)'}</option>
                  <option value="Layer 2">{language === 'th' ? 'Layer 2 — Supervisor (4 ครั้ง/เดือน)' : 'Layer 2 — Supervisor (4/month)'}</option>
                  <option value="Layer 3">{language === 'th' ? 'Layer 3 — Manager (1 ครั้ง/เดือน)' : 'Layer 3 — Manager (1/month)'}</option>
                </select>
              )}
            </div>

            {/* 4. Shift: เช้า / ดึก */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.shift}
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#F37021] focus:bg-white"
              >
                <option value="เช้า">{language === 'th' ? 'กะเช้า' : 'Morning Shift (เช้า)'}</option>
                <option value="ดึก">{language === 'th' ? 'กะดึก' : 'Night Shift (ดึก)'}</option>
              </select>
            </div>
          </div>

          {/* Row 2: Inspection Code, Machine/Products, Current Date */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-1">
            {/* รหัสรายการ (Inspection Code) */}
            <div className="sm:col-span-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#F37021]" />
                  <span>{t.inspectionCode} *</span>
                </label>
                <span className="text-[10px] text-slate-500">
                  {availableCodes.length > 0 ? (language === 'th' ? `พบ ${availableCodes.length} รหัสในรอบนี้` : `Found ${availableCodes.length} codes`) : (language === 'th' ? 'รหัสใหม่' : 'New Code')}
                </span>
              </div>

              {!isCustomCode && availableCodes.length > 0 ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <select
                    value={inspectionCode}
                    onChange={(e) => handleSelectCode(e.target.value)}
                    className="w-full px-2.5 sm:px-3 py-2 bg-orange-50/60 border-2 border-[#F37021] rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#F37021] transition shadow-sm"
                  >
                    {availableCodes.map((c) => (
                      <option key={c.inspection_code} value={c.inspection_code}>
                        {language === 'th' ? 'รหัส' : 'Code'} {c.inspection_code} — {c.mc_and_products} ({c.shift}) 
                        {c.has_layer1 ? ' [L1 ✅]' : ' [L1 ⏳]'}
                        {c.has_layer2 ? ' [L2 ✅]' : ''}
                        {c.has_layer3 ? ' [L3 ✅]' : ''}
                      </option>
                    ))}
                    <option value="__NEW__">{t.newInspectionCode}...</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleSelectCode('__NEW__')}
                    className="px-2 sm:px-2.5 py-2 bg-orange-100 hover:bg-orange-200 text-[#F37021] font-bold rounded-xl text-xs whitespace-nowrap transition shadow-sm shrink-0"
                    title={t.newInspectionCode}
                  >
                    <span>+ {t.newInspectionCode}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCodeHistoryModal(true)}
                    className="px-2 sm:px-2.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs whitespace-nowrap transition border border-indigo-200 shadow-sm flex items-center gap-1 shrink-0"
                    title={language === 'th' ? `ดูประวัติรหัส #${inspectionCode}` : `View Code #${inspectionCode} History`}
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="hidden sm:inline">{language === 'th' ? 'ประวัติ' : 'History'}</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="relative flex-1">
                    <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={isCustomCode ? customCodeInput : inspectionCode}
                      onChange={(e) => handleCustomCodeChange(e.target.value)}
                      placeholder={t.inspectionCodePlaceholder}
                      className="w-full pl-8 pr-3 py-2 bg-white border-2 border-[#F37021] rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#F37021] transition shadow-sm"
                    />
                  </div>
                  {availableCodes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCode(false);
                        if (availableCodes[0]) handleSelectCode(availableCodes[0].inspection_code);
                      }}
                      className="px-2 sm:px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs whitespace-nowrap transition shrink-0"
                    >
                      {language === 'th' ? 'รหัสเดิม' : 'Existing'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowCodeHistoryModal(true)}
                    className="px-2 sm:px-2.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs whitespace-nowrap transition border border-indigo-200 shadow-sm flex items-center gap-1 shrink-0"
                    title={language === 'th' ? `ดูประวัติรหัส #${inspectionCode}` : `View Code #${inspectionCode} History`}
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="hidden sm:inline">{language === 'th' ? 'ประวัติ' : 'History'}</span>
                  </button>
                </div>
              )}

              {/* Warning when code already audited by Layer 1 */}
              {isL1CodeTaken && (
                <div className="mt-2.5 p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-950 space-y-2 animate-fadeIn shadow-sm">
                  <div className="flex items-center gap-1.5 font-bold text-red-800">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{language === 'th' ? `รหัส #${inspectionCode} ตรวจโดย Layer 1 เรียบร้อยแล้ว` : `Code #${inspectionCode} already audited by Layer 1`}</span>
                  </div>
                  <p className="text-[11px] text-red-700 leading-relaxed">
                    {language === 'th'
                      ? `(ผู้ตรวจ: ${selectedCodeObj?.layer1_auditor || '-'}) แต่ละรหัสสามารถตรวจในระดับ Layer 1 ได้เพียงครั้งเดียว ไม่สามารถสร้างซ้ำได้`
                      : `(Auditor: ${selectedCodeObj?.layer1_auditor || '-'}) Each code can only be audited once by Layer 1. Duplicate submission is disabled.`}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCode(true);
                        setCustomCodeInput(nextAvailableCode);
                        setInspectionCode(nextAvailableCode);
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition shadow-sm"
                    >
                      {language === 'th' ? `✨ ใช้รหัสใหม่ถัดไป (#${nextAvailableCode})` : `✨ Use Next Code (#${nextAvailableCode})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCodeHistoryModal(true)}
                      className="px-3 py-1.5 bg-white border border-red-300 hover:bg-red-50 text-red-800 font-semibold rounded-lg text-xs transition"
                    >
                      {language === 'th' ? `👁️ ดูประวัติรหัส #${inspectionCode}` : `View Code History`}
                    </button>
                  </div>
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
                placeholder={t.machinePlaceholder}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#F37021] focus:bg-white font-medium"
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
                  <span>{language === 'th' ? 'วันปัจจุบัน' : 'Current Date'}</span>
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
                      {t.supervisorVerificationTitle}
                    </h3>
                    <p className="text-xs text-indigo-700">
                      {t.supervisorVerificationDesc}
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
                  <span>{t.verifyingInspectionCode} <strong className="text-indigo-950 font-bold bg-white px-2.5 py-0.5 rounded-lg border border-indigo-200">#{inspectionCode}</strong></span>
                  {mcAndProducts && <span className="text-indigo-700 font-normal">({mcAndProducts})</span>}
                </div>
                {priorLayersData?.layer1 ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {t.layer1AuditFound}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    {t.layer1AuditNotFound}
                  </span>
                )}
              </div>

              {loadingPrior ? (
                <div className="py-8 text-center text-xs text-indigo-600 font-medium">
                  {t.fetchingPriorLayerData}
                </div>
              ) : priorLayersData?.layer1 ? (
                <PriorLayerChecklistView
                  inspection={priorLayersData.layer1}
                  layerTitle="Layer 1 (Leader)"
                  inspectionCode={inspectionCode}
                  departmentCode={departmentCode}
                  defaultExpanded={true}
                  onRefresh={() => {
                    api.getPriorLayers(departmentCode, year, month, inspectionCode).then(setPriorLayersData).catch(console.error);
                  }}
                />
              ) : (
                <div className="py-6 text-center bg-white/70 rounded-2xl border border-dashed border-indigo-200 text-slate-500 text-xs">
                  ℹ️ {t.noPriorLayerNotice}
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
                      {t.managerVerificationTitle}
                    </h3>
                    <p className="text-xs text-purple-700">
                      {t.managerVerificationDesc}
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
                  <span>{t.reviewingInspectionCode} <strong className="text-purple-950 font-bold bg-white px-2.5 py-0.5 rounded-lg border border-purple-200">#{inspectionCode}</strong></span>
                  {mcAndProducts && <span className="text-purple-700 font-normal">({mcAndProducts})</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    priorLayersData?.layer1 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                  }`}>
                    Layer 1: {priorLayersData?.layer1 ? (language === 'en' ? 'Audited ✅' : 'ตรวจแล้ว ✅') : (language === 'en' ? 'Pending ⏳' : 'ไม่มี ⏳')}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    priorLayersData?.layer2 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                  }`}>
                    Layer 2: {priorLayersData?.layer2 ? (language === 'en' ? 'Audited ✅' : 'ตรวจแล้ว ✅') : (language === 'en' ? 'Pending ⏳' : 'ไม่มี ⏳')}
                  </span>
                </div>
              </div>

              {loadingPrior ? (
                <div className="py-8 text-center text-xs text-purple-600 font-medium">
                  {t.fetchingPriorLayerData}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Layer 1 Inspection Results */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#F37021]"></span>
                        <span>{t.layer1LeaderResults}</span>
                      </h4>
                      {priorLayersData?.layer1 && (
                        <span className="text-[11px] text-slate-500">
                          {t.auditorBy}: {priorLayersData.layer1.auditor_name} ({priorLayersData.layer1.audit_date})
                        </span>
                      )}
                    </div>
                    {priorLayersData?.layer1 ? (
                      <PriorLayerChecklistView
                        inspection={priorLayersData.layer1}
                        layerTitle="Layer 1 (Leader)"
                        inspectionCode={inspectionCode}
                        departmentCode={departmentCode}
                        defaultExpanded={false}
                        onRefresh={() => {
                          api.getPriorLayers(departmentCode, year, month, inspectionCode).then(setPriorLayersData).catch(console.error);
                        }}
                      />
                    ) : (
                      <div className="py-4 text-center bg-white/70 rounded-2xl border border-dashed border-purple-200 text-slate-500 text-xs">
                        ℹ️ {t.noPriorLayerNotice}
                      </div>
                    )}
                  </div>

                  {/* Layer 2 Inspection Results */}
                  <div className="space-y-2 pt-2 border-t border-purple-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                        <span>{t.layer2SupervisorResults}</span>
                      </h4>
                      {priorLayersData?.layer2 && (
                        <span className="text-[11px] text-slate-500">
                          {t.auditorBy}: {priorLayersData.layer2.auditor_name} ({priorLayersData.layer2.audit_date})
                        </span>
                      )}
                    </div>
                    {priorLayersData?.layer2 ? (
                      <PriorLayerChecklistView
                        inspection={priorLayersData.layer2}
                        layerTitle="Layer 2 (Supervisor)"
                        inspectionCode={inspectionCode}
                        departmentCode={departmentCode}
                        defaultExpanded={true}
                        onRefresh={() => {
                          api.getPriorLayers(departmentCode, year, month, inspectionCode).then(setPriorLayersData).catch(console.error);
                        }}
                      />
                    ) : (
                      <div className="py-4 text-center bg-white/70 rounded-2xl border border-dashed border-purple-200 text-slate-500 text-xs">
                        ℹ️ {t.noPriorLayerNotice}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Real-time Score Board */}
          <div className="bg-gradient-to-r from-[#181B20] to-[#252C37] p-3.5 sm:p-4 rounded-2xl text-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 shadow-sm border border-slate-800">
            <div className="grid grid-cols-4 gap-2 sm:gap-6 divide-x divide-slate-800/80">
              <div className="text-center sm:text-left">
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block truncate">
                  {language === 'en' ? 'Total' : 'ข้อตรวจ'}
                </span>
                <span className="text-lg sm:text-xl font-bold text-white">{items.length}</span>
              </div>
              <div className="pl-2 sm:pl-6 text-center sm:text-left">
                <span className="text-[10px] sm:text-[11px] text-emerald-400 font-medium block truncate">{t.totalOk}</span>
                <span className="text-lg sm:text-xl font-bold text-emerald-400">{totalOk}</span>
              </div>
              <div className="pl-2 sm:pl-6 text-center sm:text-left">
                <span className="text-[10px] sm:text-[11px] text-red-400 font-medium block truncate">{t.totalNo}</span>
                <span className="text-lg sm:text-xl font-bold text-red-400">{totalNo}</span>
              </div>
              <div className="pl-2 sm:pl-6 text-center sm:text-left">
                <span className="text-[10px] sm:text-[11px] text-amber-400 font-medium block truncate">
                  {language === 'en' ? 'Wait' : 'ยังไม่ตรวจ'}
                </span>
                <span className="text-lg sm:text-xl font-bold text-amber-400">{totalPending}</span>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
              <div className="text-left sm:text-right">
                <div className="text-[11px] sm:text-xs text-orange-200 font-semibold">{t.safetyScore}</div>
                <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {scorePercent}%
                </div>
              </div>
              <div
                className={`px-3 py-1.5 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm shadow shrink-0 ${
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
                <div className="w-8 h-8 border-4 border-[#F37021] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-xs text-slate-500">
                  {t.loadingDeptQuestions.replace('{0}', departmentCode).replace('{1}', layer)}
                </p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                {t.noQuestionsInLayer}
              </div>
            ) : (
              Object.entries(categorizedItems).map(([categoryName, catItems]) => (
                <div key={categoryName} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  {/* Category Header */}
                  <div className="bg-slate-100 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div className="font-bold text-slate-800 text-xs tracking-wide uppercase flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#F37021]"></span>
                      <span>{categoryName}</span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500">
                      {catItems.length} {t.itemsCountUnit}
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
                                <div className="text-[11px] font-semibold text-[#F37021] bg-orange-50 inline-block px-2 py-0.5 rounded">
                                  {item.subcategory}
                                </div>
                              )}
                              <p className="text-xs text-slate-800 font-medium leading-relaxed">
                                {item.question}
                              </p>
                            </div>

                            {/* Evaluation Buttons: OK / NO */}
                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                              <button
                                type="button"
                                onClick={() => handleResultChange(itemIndex, 'OK')}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
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
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                  item.result === 'NO'
                                    ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-400'
                                    : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-700'
                                }`}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>NO</span>
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
                                  <span className="text-[11px] text-slate-600 font-normal">{t.severity}:</span>
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

                              {/* Action Plan */}
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                  {t.actionPlan}
                                </label>
                                <input
                                  type="text"
                                  value={item.actionPlan}
                                  onChange={(e) => handleItemFieldChange(itemIndex, 'actionPlan', e.target.value)}
                                  placeholder={t.actionPlaceholder}
                                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-[#F37021]"
                                />
                              </div>

                              {/* ผู้รับผิดชอบ: แผนก > userในแผนก */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                                {/* 1. แผนกของผู้รับผิดชอบ */}
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                    <Building2 className="w-3 h-3 text-[#F37021]" />
                                    <span>{language === 'en' ? 'Responsible Dept' : 'แผนกผู้รับผิดชอบ'} *</span>
                                  </label>
                                  <select
                                    value={item.responsibleDept || departmentCode}
                                    onChange={(e) => {
                                      const newDept = e.target.value;
                                      handleItemFieldChange(itemIndex, 'responsibleDept', newDept);
                                      const deptUsers = usersDirectory.filter((u) => u.department === newDept);
                                      if (deptUsers.length > 0) {
                                        handleItemFieldChange(itemIndex, 'responsiblePerson', `${deptUsers[0].first_name} ${deptUsers[0].last_name}`);
                                        handleItemFieldChange(itemIndex, 'isCustomResponsible', false);
                                      } else {
                                        handleItemFieldChange(itemIndex, 'responsiblePerson', '');
                                      }
                                    }}
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#F37021]"
                                  >
                                    <option value="MOLD">Molding / MM (แผนกฉีด)</option>
                                    <option value="FACILITY">Facility (สาธารณูปโภค)</option>
                                    <option value="ASSY">Assembly (แผนกประกอบ)</option>
                                    <option value="WH">Warehouse (คลังสินค้า)</option>
                                    <option value="QC">QC (ควบคุมคุณภาพ)</option>
                                    <option value="STAMPING">Stamping (ปั๊มขึ้นรูป)</option>
                                    <option value="TOOL">Tooling (แม่พิมพ์/เครื่องมือ)</option>
                                    <option value="SAFETY">Safety / ความปลอดภัย (EHS)</option>
                                  </select>
                                </div>

                                {/* 2. ผู้รับผิดชอบ (User ในแผนก) */}
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                                      <User className="w-3 h-3 text-[#F37021]" />
                                      <span>{language === 'en' ? 'Responsible User' : 'ผู้รับผิดชอบ (User ในแผนก)'} *</span>
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextCustom = !item.isCustomResponsible;
                                        handleItemFieldChange(itemIndex, 'isCustomResponsible', nextCustom);
                                        if (nextCustom) handleItemFieldChange(itemIndex, 'responsiblePerson', '');
                                      }}
                                      className="text-[10px] text-[#F37021] hover:text-[#DE5F14] underline font-medium"
                                    >
                                      {item.isCustomResponsible
                                        ? (language === 'en' ? '← Select from list' : '← เลือกจากรายชื่อ')
                                        : (language === 'en' ? '✏️ Type custom' : '✏️ ระบุชื่ออื่น')}
                                    </button>
                                  </div>

                                  {item.isCustomResponsible ? (
                                    <input
                                      type="text"
                                      value={item.responsiblePerson}
                                      onChange={(e) => handleItemFieldChange(itemIndex, 'responsiblePerson', e.target.value)}
                                      placeholder={language === 'en' ? 'Type contractor / external name...' : 'ระบุชื่อพนักงาน หรือผู้รับเหมา...'}
                                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-amber-400"
                                    />
                                  ) : (
                                    <select
                                      value={item.responsiblePerson}
                                      onChange={(e) => {
                                        if (e.target.value === '__custom__') {
                                          handleItemFieldChange(itemIndex, 'isCustomResponsible', true);
                                          handleItemFieldChange(itemIndex, 'responsiblePerson', '');
                                        } else {
                                          handleItemFieldChange(itemIndex, 'responsiblePerson', e.target.value);
                                        }
                                      }}
                                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#F37021]"
                                    >
                                      <option value="">{language === 'en' ? '-- Select User in Dept --' : '-- เลือกผู้รับผิดชอบในแผนก --'}</option>
                                      {usersDirectory
                                        .filter((u) => u.department === (item.responsibleDept || departmentCode))
                                        .map((u) => (
                                          <option key={u.id} value={`${u.first_name} ${u.last_name}`}>
                                            {u.first_name} {u.last_name} (@{u.username}) {u.position ? `— ${u.position}` : ''}
                                          </option>
                                        ))}
                                      {usersDirectory.filter((u) => u.department === (item.responsibleDept || departmentCode)).length === 0 && (
                                        <option value="" disabled>
                                          {language === 'en' ? '(No users registered in this dept)' : '(ยังไม่มี User ลงทะเบียนในแผนกนี้)'}
                                        </option>
                                      )}
                                      <option value="__custom__">
                                        {language === 'en' ? '✏️ Specify other / external person...' : '✏️ ระบุชื่ออื่น / ผู้รับเหมา...'}
                                      </option>
                                    </select>
                                  )}
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
                                        src={normalizeImageUrl(item.imageUrl)}
                                        alt="Defect"
                                        className="w-10 h-10 object-cover rounded shadow-sm"
                                      />
                                      <div className="flex-1 truncate">
                                        <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                                          <Check className="w-3 h-3" />
                                          <span>{t.photoUploaded}</span>
                                        </div>
                                        <a
                                          href={normalizeImageUrl(item.imageUrl)}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-[10px] text-[#F37021] hover:underline block truncate"
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
                                      <Camera className="w-4 h-4 text-[#F37021]" />
                                      <span>
                                        {item.uploadingImage
                                          ? (language === 'en' ? 'Uploading to Cloudflare R2...' : 'กำลังอัปโหลดไปยัง Cloudflare R2...')
                                          : t.takePhoto}
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
              {t.commentsSectionTitle}
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
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#F37021] focus:bg-white"
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
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#F37021] focus:bg-white"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#F37021]" />
                <span>
                  {layer === 'Layer 1' && t.l1Guidance}
                  {layer === 'Layer 2' && t.l2Guidance}
                  {layer === 'Layer 3' && t.l3Guidance}
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="submit"
                  disabled={saving || loading || items.length === 0 || isL1CodeTaken}
                  title={isL1CodeTaken ? (language === 'th' ? 'รหัสนี้ตรวจโดย Layer 1 ไปแล้ว ไม่สามารถสร้างซ้ำได้' : 'Code already inspected by Layer 1') : undefined}
                  className="w-full sm:w-auto px-6 py-3 bg-[#F37021] hover:bg-[#DE5F14] text-white font-bold rounded-xl shadow-lg shadow-[#F37021]/30 text-xs sm:text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? t.saving : t.saveInspection}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Sticky Mobile Floating Action Bar for Quick Save & Real-time Progress */}
      {items.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1A1D21]/95 backdrop-blur-md border-t border-slate-800 p-2.5 px-4 z-30 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-2">
            <div className={`px-2 py-0.5 rounded text-[10px] font-black ${
              parseFloat(scorePercent) >= 95 ? 'bg-emerald-500 text-white' : parseFloat(scorePercent) >= 85 ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
            }`}>
              {scorePercent}%
            </div>
            <div className="text-[11px] text-slate-300 font-semibold">
              <span className="text-emerald-400">{totalOk} OK</span>
              <span className="text-slate-500 mx-1">•</span>
              <span className="text-red-400">{totalNo} NO</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading || items.length === 0 || isL1CodeTaken}
            className="px-4 py-2 bg-[#F37021] hover:bg-[#DE5F14] text-white font-bold rounded-xl text-xs transition shadow-md shadow-[#F37021]/30 flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? t.saving : t.saveInspection}</span>
          </button>
        </div>
      )}

      {/* Inspection Code Multi-Layer History Modal */}
      <InspectionCodeHistoryModal
        isOpen={showCodeHistoryModal}
        onClose={() => setShowCodeHistoryModal(false)}
        departmentCode={departmentCode}
        inspectionCode={inspectionCode}
        year={year}
        month={month}
      />

      {/* Super Admin Checklist Templates Manager Modal */}
      {user?.role === 'superadmin' && (
        <ChecklistManagerModal
          isOpen={showChecklistManager}
          onClose={() => setShowChecklistManager(false)}
          initialDepartment={departmentCode}
          initialLayer={layer}
          onUpdated={() => setChecklistVersion((v) => v + 1)}
        />
      )}
    </div>
  );
};
