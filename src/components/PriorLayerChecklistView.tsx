import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { localizeQuestion, localizeCategory, localizeSubcategory } from '../i18n/translations';
import { api, normalizeImageUrl } from '../services/api';
import { 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  AlertTriangle,
  Image as ImageIcon,
  Edit3,
  Save,
  Check,
  RotateCcw,
  Building2,
  User
} from 'lucide-react';

interface PriorItem {
  id: number;
  template_item_id?: number;
  layer: string;
  category: string;
  subcategory?: string;
  question: string;
  method?: string;
  result: 'OK' | 'NO' | 'N/A';
  finding_topic?: string;
  severity?: string;
  action_plan?: string;
  responsible_person?: string;
  responsible_dept?: string;
  is_custom_responsible?: boolean;
  due_date?: string;
  image_url?: string;
}

interface PriorLayerChecklistViewProps {
  inspection: {
    id: number;
    department_code?: string;
    auditor_name: string;
    audit_date: string;
    shift: string;
    score_percent: number;
    total_ok: number;
    total_no: number;
    total_na: number;
    comments?: string;
    items?: PriorItem[];
  };
  layerTitle: string; // e.g. "Layer 1 (Leader)" or "Layer 2 (Supervisor)"
  inspectionCode?: string;
  departmentCode?: string;
  defaultExpanded?: boolean;
  onRefresh?: () => void;
}

export const PriorLayerChecklistView: React.FC<PriorLayerChecklistViewProps> = ({
  inspection,
  layerTitle,
  inspectionCode,
  departmentCode,
  defaultExpanded = true,
  onRefresh,
}) => {
  const { language, t } = useAuth();
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [usersDirectory, setUsersDirectory] = useState<any[]>([]);

  // Fetch approved users directory for responsible person selector
  useEffect(() => {
    api.getUsersDirectory().then((data) => {
      setUsersDirectory(data || []);
    }).catch(console.error);
  }, []);

  // Editable state for Layer 2 / Layer 3 to modify Layer 1's answers
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedItems, setEditedItems] = useState<PriorItem[]>(inspection.items || []);
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setEditedItems(inspection.items || []);
  }, [inspection.items]);

  const items = isEditing ? editedItems : (inspection.items || []);
  const totalCount = items.length;

  const currentOk = items.filter((i) => i.result === 'OK').length;
  const currentNo = items.filter((i) => i.result === 'NO').length;
  const totalEval = currentOk + currentNo;
  const currentScore = totalEval > 0 ? ((currentOk / totalEval) * 100).toFixed(1) : Number(inspection.score_percent || 100).toFixed(1);
  const isPassed = parseFloat(currentScore) >= 85;

  // Handle changing result in edit mode
  const handleItemResultChange = (itemId: number, newResult: 'OK' | 'NO') => {
    setEditedItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, result: newResult } : it))
    );
  };

  const handleItemFieldChange = (itemId: number, field: keyof PriorItem, val: any) => {
    setEditedItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, [field]: val } : it))
    );
  };

  // Save modified answers to database
  const handleSaveEdits = async () => {
    setSavingEdit(true);
    setSaveSuccessMsg(null);
    try {
      await api.updateInspectionItems(inspection.id, editedItems);
      setSaveSuccessMsg(
        language === 'en' ? 'Updated answers successfully!' : 'บันทึกการแก้ไขคำตอบเรียบร้อยแล้ว!'
      );
      setIsEditing(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert((language === 'en' ? 'Failed to update: ' : 'บันทึกไม่สำเร็จ: ') + err.message);
    } finally {
      setSavingEdit(false);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    }
  };

  // Group items by category
  const groupedByCategory = items.reduce((acc, item) => {
    const cat = item.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, PriorItem[]>);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 1. Header Banner styled exactly like image (Dark Navy Score Board) */}
      <div className="bg-slate-950 text-white rounded-2xl p-5 shadow-lg border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left stats */}
          <div className="flex flex-wrap items-center gap-6 sm:gap-8">
            <div>
              <span className="text-xs text-slate-400 font-medium block">
                {language === 'th' ? `รายการตรวจระดับ ${layerTitle}` : `${layerTitle} Questions`}
              </span>
              <span className="text-2xl font-bold text-white tracking-tight">
                {totalCount} {t.itemsCountUnit}
              </span>
            </div>

            <div className="border-l border-slate-800 pl-6">
              <span className="text-xs text-slate-400 font-medium block">
                {t.totalOk}
              </span>
              <span className="text-2xl font-bold text-emerald-400 tracking-tight">
                {currentOk}
              </span>
            </div>

            <div className="border-l border-slate-800 pl-6">
              <span className="text-xs text-slate-400 font-medium block">
                {t.totalNo}
              </span>
              <span className="text-2xl font-bold text-red-400 tracking-tight">
                {currentNo}
              </span>
            </div>
          </div>

          {/* Right score & PASS pill */}
          <div className="flex items-center gap-4 self-end lg:self-center border-t lg:border-t-0 border-slate-800 pt-3 lg:pt-0">
            <div className="text-right">
              <span className="text-xs text-slate-400 font-medium block">
                {t.safetyScore}
              </span>
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {currentScore}%
              </span>
            </div>

            <span
              className={`px-4 py-2 rounded-xl text-sm font-black tracking-wider uppercase shadow-md flex items-center justify-center min-w-[72px] ${
                isPassed
                  ? 'bg-emerald-500 text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
              {isPassed ? 'PASS' : 'FAIL'}
            </span>

            {/* Edit Mode Toggle Button */}
            {!isEditing ? (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  setIsExpanded(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                title={language === 'en' ? 'Edit prior layer answers' : 'แก้ไขคำตอบของผลการตรวจนี้'}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Edit Answers' : 'แก้ไขคำตอบ'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveEdits}
                  disabled={savingEdit}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingEdit ? (language === 'en' ? 'Saving...' : 'กำลังบันทึก...') : (language === 'en' ? 'Save Changes' : 'บันทึกการแก้ไข')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditedItems(inspection.items || []);
                    setIsEditing(false);
                  }}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title={language === 'en' ? 'Cancel' : 'ยกเลิก'}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Toggle button */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title={isExpanded ? t.collapseForm : t.expandForm}
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Auditor details bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-3">
            <span>{language === 'th' ? 'ผู้ตรวจ:' : 'Auditor:'} <strong className="text-slate-200">{inspection.auditor_name}</strong></span>
            <span>•</span>
            <span>{language === 'th' ? 'วันที่ตรวจ:' : 'Audit Date:'} <strong className="text-slate-200">{inspection.audit_date} ({inspection.shift})</strong></span>
            {inspectionCode && (
              <>
                <span>•</span>
                <span>{language === 'th' ? 'รหัสรายการ:' : 'Code:'} <strong className="text-sky-300">#{inspectionCode}</strong></span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sky-400 hover:text-sky-300 text-xs font-semibold underline flex items-center gap-1"
          >
            {isExpanded ? t.collapseChecklist : `${t.viewAllAnswers} (${totalCount} ${t.itemsCountUnit})`}
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* 2. Questions list grouped by Category */}
      {isExpanded && (
        <div className="space-y-4 animate-fadeIn">
          {Object.entries(groupedByCategory).map(([category, catItems], catIdx) => (
            <div
              key={catIdx}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Category Header */}
              <div className="bg-sky-50/70 border-b border-sky-100 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block"></span>
                  <h4 className="text-xs font-bold text-slate-800 tracking-wide">
                    {localizeCategory(category, language)}
                  </h4>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {catItems.length} {t.itemsCountUnit}
                </span>
              </div>

              {/* Questions Rows */}
              <div className="divide-y divide-slate-100">
                {catItems.map((item, itemIdx) => {
                  const isOk = item.result === 'OK';
                  const isNo = item.result === 'NO';

                  return (
                    <div
                      key={item.id || itemIdx}
                      className={`p-4 transition ${isNo ? 'bg-red-50/20' : 'hover:bg-slate-50/60'}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        {/* Left: Subcategory, Question (Explanation/Method removed as per request 4) */}
                        <div className="space-y-1 flex-1 pr-2">
                          {item.subcategory && (
                            <span className="inline-block text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                              {localizeSubcategory(item.subcategory, language)}
                            </span>
                          )}
                          <div className="text-xs font-bold text-slate-900 leading-snug">
                            {localizeQuestion(item.question, language)}
                          </div>
                        </div>

                        {/* Right: Status Buttons (OK / NO) - Editable or View mode */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleItemResultChange(item.id, 'OK')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                                  isOk
                                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>OK</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleItemResultChange(item.id, 'NO')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                                  isNo
                                    ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-400'
                                    : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-700'
                                }`}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>NO</span>
                              </button>
                            </>
                          ) : (
                            <>
                              {/* OK Pill */}
                              <div
                                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition ${
                                  isOk
                                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-200'
                                    : 'border border-slate-200 text-slate-400 opacity-40 bg-slate-50'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>OK</span>
                              </div>

                              {/* NO Pill */}
                              <div
                                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition ${
                                  isNo
                                    ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-200'
                                    : 'border border-slate-200 text-slate-400 opacity-40 bg-slate-50'
                                }`}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>NO</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* If NO: Show or edit finding details & Cloudflare R2 image */}
                      {isNo && (
                        <div className="mt-3 p-3.5 bg-red-50/80 border border-red-200 rounded-xl space-y-2 text-xs text-red-950">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 font-bold text-red-800 flex-1">
                              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={item.finding_topic || ''}
                                  onChange={(e) => handleItemFieldChange(item.id, 'finding_topic', e.target.value)}
                                  placeholder={language === 'th' ? 'ระบุประเด็นความผิดปกติ...' : 'Finding topic...'}
                                  className="w-full px-2.5 py-1 bg-white border border-red-300 rounded text-xs font-normal"
                                />
                              ) : (
                                <span>{language === 'th' ? 'ประเด็นความเสี่ยง:' : 'Safety Finding:'} {item.finding_topic || (language === 'th' ? 'พบข้อผิดปกติ' : 'Defect Anomaly')}</span>
                              )}
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-200 text-red-900 border border-red-300 shrink-0">
                              {item.severity || 'Major'}
                            </span>
                          </div>

                          {isEditing ? (
                            <div className="space-y-2 pt-1">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div className="sm:col-span-2">
                                  <label className="block text-[10px] font-bold text-slate-700">{t.actionPlan}</label>
                                  <input
                                    type="text"
                                    value={item.action_plan || ''}
                                    onChange={(e) => handleItemFieldChange(item.id, 'action_plan', e.target.value)}
                                    placeholder="Action plan..."
                                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-700">{t.dueDate}</label>
                                  <input
                                    type="date"
                                    value={item.due_date || ''}
                                    onChange={(e) => handleItemFieldChange(item.id, 'due_date', e.target.value)}
                                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                                  />
                                </div>
                              </div>

                              {/* Cascading: แผนกผู้รับผิดชอบ > ผู้รับผิดชอบ (User ในแผนก) */}
                              {(() => {
                                const currentItemDept = item.responsible_dept || 
                                  (item.responsible_person ? usersDirectory.find((u) => `${u.first_name} ${u.last_name}` === item.responsible_person)?.department : null) || 
                                  inspection.department_code || departmentCode || 'MOLD';

                                return (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-red-200/60">
                                    {/* 1. แผนกผู้รับผิดชอบ */}
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-700 mb-0.5 flex items-center gap-1">
                                        <Building2 className="w-3 h-3 text-sky-600" />
                                        <span>{language === 'en' ? 'Responsible Dept' : 'แผนกผู้รับผิดชอบ'}</span>
                                      </label>
                                      <select
                                        value={currentItemDept}
                                        onChange={(e) => {
                                          const newDept = e.target.value;
                                          handleItemFieldChange(item.id, 'responsible_dept', newDept);
                                          const deptUsers = usersDirectory.filter((u) => u.department === newDept);
                                          if (deptUsers.length > 0) {
                                            handleItemFieldChange(item.id, 'responsible_person', `${deptUsers[0].first_name} ${deptUsers[0].last_name}`);
                                            handleItemFieldChange(item.id, 'is_custom_responsible', false);
                                          } else {
                                            handleItemFieldChange(item.id, 'responsible_person', '');
                                          }
                                        }}
                                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-sky-400"
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
                                      <div className="flex items-center justify-between mb-0.5">
                                        <label className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                                          <User className="w-3 h-3 text-indigo-600" />
                                          <span>{language === 'en' ? 'Responsible User' : 'ผู้รับผิดชอบ (User ในแผนก)'}</span>
                                        </label>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const nextCustom = !item.is_custom_responsible;
                                            handleItemFieldChange(item.id, 'is_custom_responsible', nextCustom);
                                            if (nextCustom) handleItemFieldChange(item.id, 'responsible_person', '');
                                          }}
                                          className="text-[9px] text-sky-600 hover:text-sky-800 underline font-medium"
                                        >
                                          {item.is_custom_responsible
                                            ? (language === 'en' ? '← Select from list' : '← เลือกจากรายชื่อ')
                                            : (language === 'en' ? '✏️ Type custom' : '✏️ ระบุชื่ออื่น')}
                                        </button>
                                      </div>

                                      {item.is_custom_responsible ? (
                                        <input
                                          type="text"
                                          value={item.responsible_person || ''}
                                          onChange={(e) => handleItemFieldChange(item.id, 'responsible_person', e.target.value)}
                                          placeholder={language === 'en' ? 'Type contractor / external name...' : 'ระบุชื่อพนักงาน หรือผู้รับเหมา...'}
                                          className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs text-slate-800"
                                        />
                                      ) : (
                                        <select
                                          value={item.responsible_person || ''}
                                          onChange={(e) => {
                                            if (e.target.value === '__custom__') {
                                              handleItemFieldChange(item.id, 'is_custom_responsible', true);
                                              handleItemFieldChange(item.id, 'responsible_person', '');
                                            } else {
                                              handleItemFieldChange(item.id, 'responsible_person', e.target.value);
                                            }
                                          }}
                                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-sky-400"
                                        >
                                          <option value="">{language === 'en' ? '-- Select User in Dept --' : '-- เลือกผู้รับผิดชอบในแผนก --'}</option>
                                          {usersDirectory
                                            .filter((u) => u.department === currentItemDept)
                                            .map((u) => (
                                              <option key={u.id} value={`${u.first_name} ${u.last_name}`}>
                                                {u.first_name} {u.last_name} (@{u.username}) {u.position ? `— ${u.position}` : ''}
                                              </option>
                                            ))}
                                          {usersDirectory.filter((u) => u.department === currentItemDept).length === 0 && (
                                            <option value="" disabled>
                                              {language === 'en' ? '(No users registered in this dept)' : '(ยังไม่มี User ลงทะเบียนในแผนกนี้)'}
                                            </option>
                                          )}
                                        </select>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          ) : (
                            <>
                              {item.action_plan && (
                                <div className="text-[11px] text-slate-700">
                                  <strong>{language === 'th' ? 'แผนแก้ไข:' : 'Action Plan:'}</strong> {item.action_plan}
                                </div>
                              )}

                              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600">
                                {item.responsible_person && (
                                  <span>{language === 'th' ? 'ผู้รับผิดชอบ:' : 'Responsible:'} <strong>{item.responsible_person}</strong></span>
                                )}
                                {item.due_date && (
                                  <span>{language === 'th' ? 'กำหนดเสร็จ:' : 'Target Due:'} <strong>{item.due_date}</strong></span>
                                )}
                              </div>
                            </>
                          )}

                          {item.image_url && (
                            <div className="pt-2 flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setSelectedImage(normalizeImageUrl(item.image_url))}
                                className="relative group overflow-hidden rounded-lg border border-red-200 shadow-sm"
                              >
                                <img
                                  src={normalizeImageUrl(item.image_url)}
                                  alt="Defect proof"
                                  className="w-20 h-16 object-cover group-hover:scale-105 transition"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white">
                                  <ImageIcon className="w-4 h-4" />
                                </div>
                              </button>
                              <a
                                href={normalizeImageUrl(item.image_url)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-sky-600 hover:text-sky-700 font-semibold underline"
                              >
                                <span>{t.viewFullProofPhoto}</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Leader/Auditor comments */}
          {inspection.comments && (
            <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 shadow-sm">
              <span className="font-bold text-slate-900 block mb-1">
                💬 {t.auditorCommentsTitle} {inspection.auditor_name}:
              </span>
              <p className="leading-relaxed">{inspection.comments}</p>
            </div>
          )}
        </div>
      )}

      {/* Image Modal Preview */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2">
            <img
              src={selectedImage}
              alt="Defect Full View"
              className="max-w-full max-h-[80vh] object-contain rounded-xl mx-auto"
            />
            <div className="p-3 text-center">
              <a
                href={selectedImage}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-sky-600 hover:underline font-semibold inline-flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <span>{t.openInNewTab}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

