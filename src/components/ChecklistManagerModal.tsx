import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Sliders,
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  CheckCircle,
  AlertCircle,
  Building2,
  Layers,
  HelpCircle,
  RefreshCw,
  Tag,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface ChecklistTemplateItem {
  id: number;
  department_code: string;
  layer: string;
  category: string;
  subcategory?: string;
  method?: string;
  item_order: number;
  question_th: string;
  question_en?: string;
  row_in_excel?: number;
}

interface ChecklistManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
  initialDepartment?: string;
  initialLayer?: string;
}

const DEPARTMENTS = [
  { code: 'QC', nameTh: 'QC (ควบคุมคุณภาพ)', nameEn: 'Quality Control (QC)' },
  { code: 'SAFETY', nameTh: 'Safety / EHS (ความปลอดภัย)', nameEn: 'Safety / EHS' },
  { code: 'MOLD', nameTh: 'Molding / MM (แผนกฉีด)', nameEn: 'Molding / MM' },
  { code: 'FACILITY', nameTh: 'Facility (สาธารณูปโภค)', nameEn: 'Facility' },
  { code: 'ASSY', nameTh: 'Assembly (แผนกประกอบ)', nameEn: 'Assembly' },
  { code: 'WH', nameTh: 'Warehouse (คลังสินค้า)', nameEn: 'Warehouse' },
  { code: 'STAMPING', nameTh: 'Stamping (ปั๊มขึ้นรูป)', nameEn: 'Stamping' },
  { code: 'TOOL', nameTh: 'Tooling (แม่พิมพ์/เครื่องมือ)', nameEn: 'Tooling' },
];

const LAYERS = ['All', 'Layer 1', 'Layer 2', 'Layer 3'];

export const ChecklistManagerModal: React.FC<ChecklistManagerModalProps> = ({
  isOpen,
  onClose,
  onUpdated,
  initialDepartment = 'QC',
  initialLayer = 'All',
}) => {
  const { user, language, t } = useAuth();

  const [selectedDept, setSelectedDept] = useState<string>(initialDepartment);
  const [selectedLayer, setSelectedLayer] = useState<string>(initialLayer);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [items, setItems] = useState<ChecklistTemplateItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit/Add modal state
  const [editingItem, setEditingItem] = useState<ChecklistTemplateItem | null>(null);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [formData, setFormData] = useState<{
    departmentCode: string;
    layer: string;
    itemOrder: number;
    category: string;
    subcategory: string;
    method: string;
    questionTh: string;
    questionEn: string;
  }>({
    departmentCode: 'QC',
    layer: 'Layer 1',
    itemOrder: 1,
    category: 'Safety / ความปลอดภัย',
    subcategory: '',
    method: 'สังเกตและตรวจสอบ',
    questionTh: '',
    questionEn: '',
  });

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Synchronize initial prop
  useEffect(() => {
    if (isOpen) {
      if (initialDepartment) setSelectedDept(initialDepartment);
      if (initialLayer) setSelectedLayer(initialLayer);
    }
  }, [isOpen, initialDepartment, initialLayer]);

  // Load questions whenever department changes
  const loadQuestions = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const data = await api.getChecklistTemplates(selectedDept);
      setItems(data.items || []);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'ไม่สามารถโหลดรายการคำถามได้' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadQuestions();
    }
  }, [isOpen, selectedDept]);

  if (!isOpen) return null;

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchLayer = selectedLayer === 'All' || item.layer === selectedLayer;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      String(item.item_order) === q ||
      (item.question_th && item.question_th.toLowerCase().includes(q)) ||
      (item.question_en && item.question_en.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q)) ||
      (item.subcategory && item.subcategory.toLowerCase().includes(q));
    return matchLayer && matchSearch;
  });

  // Open Add Dialog
  const handleOpenAdd = () => {
    const targetLayer = selectedLayer === 'All' ? 'Layer 1' : selectedLayer;
    const sameLayerItems = items.filter((i) => i.layer === targetLayer);
    const maxOrder = sameLayerItems.reduce((max, i) => Math.max(max, i.item_order || 0), 0);

    setFormData({
      departmentCode: selectedDept,
      layer: targetLayer,
      itemOrder: maxOrder + 1,
      category: sameLayerItems[0]?.category || 'Safety / ความปลอดภัย',
      subcategory: '',
      method: 'สังเกตและตรวจสอบ',
      questionTh: '',
      questionEn: '',
    });
    setIsAdding(true);
    setEditingItem(null);
  };

  // Open Edit Dialog
  const handleOpenEdit = (item: ChecklistTemplateItem) => {
    setEditingItem(item);
    setIsAdding(false);
    setFormData({
      departmentCode: item.department_code,
      layer: item.layer,
      itemOrder: item.item_order,
      category: item.category || 'General',
      subcategory: item.subcategory || '',
      method: item.method || 'สังเกตและตรวจสอบ',
      questionTh: item.question_th || '',
      questionEn: item.question_en || '',
    });
  };

  // Submit Add or Edit
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.questionTh.trim()) {
      setFeedback({ type: 'error', message: 'กรุณาระบุข้อความคำถาม (ภาษาไทย)' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      if (isAdding) {
        await api.createChecklistTemplate({
          departmentCode: formData.departmentCode,
          layer: formData.layer,
          itemOrder: formData.itemOrder,
          category: formData.category,
          subcategory: formData.subcategory,
          method: formData.method,
          questionTh: formData.questionTh,
          questionEn: formData.questionEn,
        });
        setFeedback({
          type: 'success',
          message: `เพิ่มข้อตรวจเช็ค #${formData.itemOrder} แผนก ${formData.departmentCode} เรียบร้อยแล้ว`,
        });
      } else if (editingItem) {
        await api.updateChecklistTemplate(editingItem.id, {
          departmentCode: formData.departmentCode,
          layer: formData.layer,
          itemOrder: formData.itemOrder,
          category: formData.category,
          subcategory: formData.subcategory,
          method: formData.method,
          questionTh: formData.questionTh,
          questionEn: formData.questionEn,
        });
        setFeedback({
          type: 'success',
          message: `แก้ไขข้อตรวจเช็ค #${formData.itemOrder} แผนก ${formData.departmentCode} เรียบร้อยแล้ว`,
        });
      }

      setIsAdding(false);
      setEditingItem(null);
      await loadQuestions();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'บันทึกข้อมูลไม่สำเร็จ' });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (item: ChecklistTemplateItem) => {
    const confirmMsg =
      language === 'th'
        ? `คุณแน่ใจหรือไม่ว่าต้องการลบ ข้อที่ ${item.item_order} (${item.layer}): "${item.question_th.substring(0, 40)}..."?`
        : `Are you sure you want to delete item #${item.item_order} (${item.layer})?`;

    if (!window.confirm(confirmMsg)) return;

    setDeletingId(item.id);
    setFeedback(null);
    try {
      await api.deleteChecklistTemplate(item.id);
      setFeedback({
        type: 'success',
        message: `ลบข้อตรวจเช็ค #${item.item_order} (${item.layer}) เรียบร้อยแล้ว`,
      });
      await loadQuestions();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'ลบข้อมูลไม่สำเร็จ' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl my-4 sm:my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#14171C] text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg border border-purple-400/30 shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span>{t.checklistManagerTitle}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                    👑 Super Admin
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block mt-0.5">
                {t.checklistManagerSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div
            className={`px-4 py-2.5 text-xs font-semibold flex items-center justify-between shrink-0 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : 'bg-red-50 text-red-800 border-b border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 sm:p-4 space-y-3 shrink-0">
          {/* Top Row: Department Selector + Add Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Department pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <span className="text-xs font-bold text-slate-600 shrink-0 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#F37021]" />
                <span>{language === 'th' ? 'เลือกแผนก:' : 'Department:'}</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {DEPARTMENTS.map((dept) => {
                  const isActive = selectedDept === dept.code;
                  return (
                    <button
                      key={dept.code}
                      onClick={() => {
                        setSelectedDept(dept.code);
                        setEditingItem(null);
                        setIsAdding(false);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                        isActive
                          ? 'bg-[#F37021] text-white shadow-sm'
                          : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {dept.code}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Add New Question Button */}
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow transition flex items-center justify-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addQuestion}</span>
            </button>
          </div>

          {/* Bottom Row: Layer filter + Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Layer tabs */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
              {LAYERS.map((lay) => (
                <button
                  key={lay}
                  onClick={() => setSelectedLayer(lay)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    selectedLayer === lay
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {lay === 'All' ? (language === 'th' ? 'ทุก Layer' : 'All Layers') : lay}
                </button>
              ))}
            </div>

            {/* Search input */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'th' ? 'ค้นหาข้อความ, หมายเลขข้อ...' : 'Search question or item #...'}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F37021]"
              />
            </div>
          </div>
        </div>

        {/* Content Body: Question List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3">
          {loading ? (
            <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-[#F37021]" />
              <span>{t.loading}</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8">
              <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="font-semibold text-slate-700 text-sm mb-1">
                {language === 'th' ? 'ไม่พบหัวข้อตรวจเช็ค' : 'No checklist items found'}
              </div>
              <p className="text-slate-400 mb-4">
                {language === 'th'
                  ? `แผนก ${selectedDept} (${selectedLayer}) ยังไม่มีรายการตามเงื่อนไขนี้ คุณสามารถกดปุ่มเพิ่มข้อใหม่ได้ทันที`
                  : `Department ${selectedDept} (${selectedLayer}) has no items matching. Click below to add one.`}
              </p>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addQuestion}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>
                  {language === 'th'
                    ? `พบทั้งหมด ${filteredItems.length} ข้อ สำหรับแผนก ${selectedDept}`
                    : `Total ${filteredItems.length} items for ${selectedDept}`}
                </span>
                <span className="font-medium">
                  {language === 'th' ? 'เรียงตามลำดับข้อ (Item Order)' : 'Sorted by Item Order'}
                </span>
              </div>

              {filteredItems.map((item) => {
                const isDeleting = deletingId === item.id;
                return (
                  <div
                    key={item.id}
                    className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs transition hover:shadow flex flex-col sm:flex-row sm:items-start justify-between gap-3 group"
                  >
                    {/* Item details */}
                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Order badge */}
                        <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-slate-100 text-slate-800 border border-slate-300">
                          ข้อ {item.item_order}
                        </span>

                        {/* Layer badge */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.layer === 'Layer 1'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : item.layer === 'Layer 2'
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {item.layer}
                        </span>

                        {/* Category badge */}
                        {item.category && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5 text-[#F37021]" />
                            <span>{item.category}</span>
                          </span>
                        )}

                        {/* Method badge */}
                        {item.method && (
                          <span className="text-[11px] text-slate-500 italic">
                            • {item.method}
                          </span>
                        )}
                      </div>

                      {/* Question texts */}
                      <div className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug pt-0.5">
                        {item.question_th}
                      </div>
                      {item.question_en && item.question_en !== item.question_th && (
                        <div className="text-xs text-slate-500 italic">
                          {item.question_en}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center gap-1"
                        title={t.editQuestion}
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                        <span>{t.edit}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteQuestion(item)}
                        disabled={isDeleting}
                        className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition flex items-center gap-1 disabled:opacity-50"
                        title={t.deleteQuestion}
                      >
                        {isDeleting ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        )}
                        <span>{t.delete}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 p-3 sm:p-4 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>
              {language === 'th'
                ? 'Superadmin สามารถจัดการหัวข้อตรวจเช็คของทุกแผนกได้ทันที การเปลี่ยนแปลงมีผลกับผู้ตรวจทุกคน'
                : 'Changes take immediate effect across all inspection forms in real-time.'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition"
          >
            {t.close}
          </button>
        </div>
      </div>

      {/* Nested Add / Edit Modal */}
      {(isAdding || editingItem) && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#F37021]" />
                <h3 className="text-sm font-bold text-slate-100">
                  {isAdding ? t.addQuestion : t.editQuestion} (
                  {formData.departmentCode})
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingItem(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                {/* Department */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.department}
                  </label>
                  <select
                    value={formData.departmentCode}
                    onChange={(e) =>
                      setFormData({ ...formData, departmentCode: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#F37021]"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.code} - {d.nameTh}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Layer */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.layer}
                  </label>
                  <select
                    value={formData.layer}
                    onChange={(e) =>
                      setFormData({ ...formData, layer: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#F37021]"
                  >
                    <option value="Layer 1">Layer 1 (Leader)</option>
                    <option value="Layer 2">Layer 2 (Supervisor)</option>
                    <option value="Layer 3">Layer 3 (Manager)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Item Order Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.questionNumber} *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.itemOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, itemOrder: parseInt(e.target.value, 10) || 1 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#F37021]"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {language === 'th' ? 'เช่น ข้อที่ 40 หรือข้อที่ 1' : 'e.g. Item #40 or #1'}
                  </p>
                </div>

                {/* Inspection Method */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.methodLabel}
                  </label>
                  <input
                    type="text"
                    value={formData.method}
                    onChange={(e) =>
                      setFormData({ ...formData, method: e.target.value })
                    }
                    placeholder="สังเกตและตรวจสอบ"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#F37021]"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.categoryLabel}
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="Safety / ความปลอดภัย, Quality, 5S..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#F37021]"
                />
              </div>

              {/* Question Thai */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.questionTh} *
                </label>
                <textarea
                  rows={3}
                  value={formData.questionTh}
                  onChange={(e) =>
                    setFormData({ ...formData, questionTh: e.target.value })
                  }
                  placeholder="ระบุข้อความคำถามหัวข้อการตรวจเช็ค..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#F37021] resize-none"
                  required
                />
              </div>

              {/* Question English */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.questionEn}
                </label>
                <textarea
                  rows={2}
                  value={formData.questionEn}
                  onChange={(e) =>
                    setFormData({ ...formData, questionEn: e.target.value })
                  }
                  placeholder="Inspection question in English (optional)..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#F37021] resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#F37021] hover:bg-[#DE5F14] text-white transition shadow flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{t.save}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
