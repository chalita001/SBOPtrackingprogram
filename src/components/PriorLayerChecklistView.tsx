import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { localizeQuestion, localizeCategory, localizeSubcategory, localizeMethod } from '../i18n/translations';
import { 
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  AlertTriangle,
  Image as ImageIcon
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
  due_date?: string;
  image_url?: string;
}

interface PriorLayerChecklistViewProps {
  inspection: {
    id: number;
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
  defaultExpanded?: boolean;
}

export const PriorLayerChecklistView: React.FC<PriorLayerChecklistViewProps> = ({
  inspection,
  layerTitle,
  inspectionCode,
  defaultExpanded = true,
}) => {
  const { language, t } = useAuth();
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const items = inspection.items || [];
  const totalCount = items.length;
  const isPassed = (inspection.score_percent || 0) >= 85;

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
                {inspection.total_ok || 0}
              </span>
            </div>

            <div className="border-l border-slate-800 pl-6">
              <span className="text-xs text-slate-400 font-medium block">
                {t.totalNo}
              </span>
              <span className="text-2xl font-bold text-red-400 tracking-tight">
                {inspection.total_no || 0}
              </span>
            </div>

            <div className="border-l border-slate-800 pl-6">
              <span className="text-xs text-slate-400 font-medium block">
                {t.totalNa}
              </span>
              <span className="text-2xl font-bold text-slate-300 tracking-tight">
                {inspection.total_na || 0}
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
                {Number(inspection.score_percent || 0).toFixed(1)}%
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

            {/* Toggle button */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition ml-2"
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
                  const isNa = item.result === 'N/A';

                  return (
                    <div
                      key={item.id || itemIdx}
                      className={`p-4 transition ${isNo ? 'bg-red-50/20' : 'hover:bg-slate-50/60'}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        {/* Left: Subcategory, Question, Method */}
                        <div className="space-y-1 flex-1 pr-2">
                          {item.subcategory && (
                            <span className="inline-block text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                              {localizeSubcategory(item.subcategory, language)}
                            </span>
                          )}
                          <div className="text-xs font-bold text-slate-900 leading-snug">
                            {localizeQuestion(item.question, language)}
                          </div>
                          {item.method && (
                            <div className="text-[11px] text-slate-400 italic">
                              {language === 'th' ? `วิธีตรวจ: ${item.method}` : `Method: ${localizeMethod(item.method, 'en')}`}
                            </div>
                          )}
                        </div>

                        {/* Right: Read-only Status Buttons (OK / NO / N/A) */}
                        <div className="flex items-center gap-2 shrink-0">
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

                          {/* N/A Pill */}
                          <div
                            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition ${
                              isNa
                                ? 'bg-slate-600 text-white shadow-sm ring-2 ring-slate-200'
                                : 'border border-slate-200 text-slate-400 opacity-40 bg-slate-50'
                            }`}
                          >
                            <MinusCircle className="w-3.5 h-3.5" />
                            <span>N/A</span>
                          </div>
                        </div>
                      </div>

                      {/* If NO: Show finding details & Cloudflare R2 image */}
                      {isNo && (
                        <div className="mt-3 p-3.5 bg-red-50/80 border border-red-200 rounded-xl space-y-2 text-xs text-red-950">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 font-bold text-red-800">
                              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                              <span>{language === 'th' ? 'ประเด็นความเสี่ยง:' : 'Safety Finding:'} {item.finding_topic || (language === 'th' ? 'พบข้อผิดปกติ' : 'Defect Anomaly')}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-200 text-red-900 border border-red-300">
                              {item.severity || 'Major'}
                            </span>
                          </div>

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

                          {item.image_url && (
                            <div className="pt-2 flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setSelectedImage(item.image_url!)}
                                className="relative group overflow-hidden rounded-lg border border-red-200 shadow-sm"
                              >
                                <img
                                  src={item.image_url}
                                  alt="Defect proof"
                                  className="w-20 h-16 object-cover group-hover:scale-105 transition"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white">
                                  <ImageIcon className="w-4 h-4" />
                                </div>
                              </button>
                              <a
                                href={item.image_url}
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
