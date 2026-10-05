import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, normalizeImageUrl } from '../services/api';
import { localizeQuestion, localizeCategory, localizeSubcategory } from '../i18n/translations';
import { 
  X, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Building2, 
  Tag, 
  User, 
  Image as ImageIcon,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Printer
} from 'lucide-react';

interface InspectionCodeHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentCode: string;
  inspectionCode: string;
  year?: number;
  month?: number;
}

export const InspectionCodeHistoryModal: React.FC<InspectionCodeHistoryModalProps> = ({
  isOpen,
  onClose,
  departmentCode,
  inspectionCode,
  year,
  month,
}) => {
  const { language, t } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'layer1' | 'layer2' | 'layer3'>('timeline');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (!inspectionCode) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCodeHistory({
        department: departmentCode,
        year,
        month,
        code: inspectionCode,
      });
      setData(res);
    } catch (err: any) {
      console.error('Failed to load code history:', err);
      setError(err.message || 'Failed to load inspection code audit trail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && inspectionCode) {
      fetchHistory();
      setActiveTab('timeline');
    } else {
      setData(null);
      setError(null);
    }
  }, [isOpen, departmentCode, inspectionCode, year, month]);

  if (!isOpen) return null;

  const layer1 = data?.layer1;
  const layer2 = data?.layer2;
  const layer3 = data?.layer3;

  // Active layer data for tab view
  const currentTabLayer = activeTab === 'layer1' ? layer1 : activeTab === 'layer2' ? layer2 : activeTab === 'layer3' ? layer3 : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#F37021]/20 text-[#F37021] border border-[#F37021]/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#F37021]/20 text-orange-300 border border-[#F37021]/30">
                  {language === 'th' ? 'รหัสเอกสาร' : 'Document Code'} #{inspectionCode}
                </span>
                <span className="text-xs text-slate-400">
                  {departmentCode} • {data?.year || year || new Date().getFullYear()}/{String(data?.month || month || (new Date().getMonth() + 1)).padStart(2, '0')}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
                {language === 'th' ? 'ประวัติการตรวจเช็คและสายการอนุมัติ (Audit Trail)' : 'Inspection History & Multi-Layer Audit Trail'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchHistory}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title={t.refresh}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
              <RefreshCw className="w-8 h-8 text-[#F37021] animate-spin" />
              <span className="text-xs font-semibold">{language === 'th' ? 'กำลังโหลดประวัติรหัสเอกสาร...' : 'Loading document audit trail...'}</span>
            </div>
          ) : error ? (
            <div className="py-12 px-6 text-center bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="font-bold">{error}</p>
            </div>
          ) : !data || data.totalRounds === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700 text-sm">{language === 'th' ? `ยังไม่พบประวัติการตรวจสำหรับรหัส #${inspectionCode}` : `No audit records found for code #${inspectionCode}`}</p>
              <p className="text-slate-400">{language === 'th' ? 'รหัสนี้ยังไม่เคยผ่านการตรวจเช็คในระบบ หรือเป็นรหัสใหม่ที่ยังไม่ได้บันทึก' : 'This code has not been audited yet or is a new unrecorded code.'}</p>
            </div>
          ) : (
            <>
              {/* Document Info Card */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-3 sm:gap-6">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">{language === 'th' ? 'แผนก' : 'Department'}</span>
                    <strong className="text-slate-800 text-sm">{data.departmentCode}</strong>
                  </div>
                  <div className="border-l border-slate-200 pl-3 sm:pl-6">
                    <span className="text-[10px] text-slate-400 block font-semibold">{language === 'th' ? 'เครื่องจักร/สายการผลิต' : 'Machine / Line'}</span>
                    <strong className="text-slate-800 text-sm truncate max-w-[140px] sm:max-w-none block">{data.mcAndProducts || '-'}</strong>
                  </div>
                  <div className="border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-6">
                    <span className="text-[10px] text-slate-400 block font-semibold">{language === 'th' ? 'กะการทำงาน' : 'Shift'}</span>
                    <strong className="text-slate-800 text-sm">{data.shift || '-'}</strong>
                  </div>
                  <div className="border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-6 pl-3 sm:pl-6">
                    <span className="text-[10px] text-slate-400 block font-semibold">{language === 'th' ? 'จำนวนรอบที่ตรวจ' : 'Total Audits'}</span>
                    <span className="font-bold text-[#F37021] text-sm">{data.totalRounds} / 3 Layers</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    layer1 && layer2 && layer3 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : layer1 && layer2
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : layer1 
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {layer1 && layer2 && layer3 
                      ? (language === 'th' ? '✅ ตรวจครบ 3 Layer สมบูรณ์' : '✅ Fully Audited (3/3)')
                      : layer1 && layer2 
                      ? (language === 'th' ? '⏳ รอ Layer 3 (Manager)' : '⏳ Awaiting Layer 3')
                      : layer1 
                      ? (language === 'th' ? '⏳ รอ Layer 2 (Supervisor)' : '⏳ Awaiting Layer 2')
                      : (language === 'th' ? '⏳ รอการตรวจ' : '⏳ Pending')}
                  </span>
                </div>
              </div>

              {/* 3-Stage Progress Timeline */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#F37021]" />
                  <span>{language === 'th' ? 'สายการตรวจเช็คตามลำดับขั้น (Audit Progression)' : 'Audit Progression Across Layers'}</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  
                  {/* Stage 1: Layer 1 Leader */}
                  <div className={`p-4 rounded-2xl border transition relative ${
                    layer1 
                      ? 'bg-emerald-50/60 border-emerald-200 ring-1 ring-emerald-200' 
                      : 'bg-slate-50/80 border-slate-200 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${layer1 ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                        <span>Layer 1 (Leader)</span>
                      </span>
                      {layer1 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{language === 'th' ? 'ตรวจแล้ว' : 'Audited'}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600">
                          {language === 'th' ? 'ยังไม่ตรวจ' : 'Pending'}
                        </span>
                      )}
                    </div>

                    {layer1 ? (
                      <div className="space-y-1 text-xs">
                        <div className="font-bold text-slate-900 truncate">
                          👤 {layer1.auditor_name}
                          {layer1.auditor_username && <span className="font-normal text-slate-500 text-[11px]"> (@{layer1.auditor_username})</span>}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{layer1.audit_date} ({layer1.shift})</span>
                        </div>
                        <div className="pt-2 flex items-center justify-between border-t border-emerald-100/80">
                          <span className="text-[11px] text-slate-600 font-medium">
                            Score: <strong className="text-emerald-700">{layer1.score_percent}%</strong>
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            layer1.total_no > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {layer1.total_no > 0 ? `${layer1.total_no} Defect` : '0 Defect (OK)'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('layer1')}
                          className="w-full mt-2 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition text-center"
                        >
                          {language === 'th' ? 'ดูรายการตรวจ Layer 1' : 'View Layer 1 Sheet'}
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-3 text-center">
                        {language === 'th' ? 'ยังไม่มีการตรวจเช็คในระดับ Layer 1' : 'No Layer 1 audit yet'}
                      </p>
                    )}
                  </div>

                  {/* Stage 2: Layer 2 Supervisor */}
                  <div className={`p-4 rounded-2xl border transition relative ${
                    layer2 
                      ? 'bg-blue-50/60 border-blue-200 ring-1 ring-blue-200' 
                      : 'bg-slate-50/80 border-slate-200 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${layer2 ? 'bg-blue-500' : 'bg-slate-300'}`}></span>
                        <span>Layer 2 (Supervisor)</span>
                      </span>
                      {layer2 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-blue-600" />
                          <span>{language === 'th' ? 'ตรวจสอบแล้ว' : 'Verified'}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600">
                          {language === 'th' ? 'รอตรวจสอบ' : 'Awaiting'}
                        </span>
                      )}
                    </div>

                    {layer2 ? (
                      <div className="space-y-1 text-xs">
                        <div className="font-bold text-slate-900 truncate">
                          👤 {layer2.auditor_name}
                          {layer2.auditor_username && <span className="font-normal text-slate-500 text-[11px]"> (@{layer2.auditor_username})</span>}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{layer2.audit_date} ({layer2.shift})</span>
                        </div>
                        <div className="pt-2 flex items-center justify-between border-t border-blue-100/80">
                          <span className="text-[11px] text-slate-600 font-medium">
                            Score: <strong className="text-blue-700">{layer2.score_percent}%</strong>
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            layer2.total_no > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {layer2.total_no > 0 ? `${layer2.total_no} Defect` : '0 Defect (OK)'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('layer2')}
                          className="w-full mt-2 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition text-center"
                        >
                          {language === 'th' ? 'ดูรายการตรวจ Layer 2' : 'View Layer 2 Sheet'}
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-3 text-center">
                        {language === 'th' ? 'รอ Supervisor เข้ามาตรวจสอบ' : 'Waiting for Supervisor'}
                      </p>
                    )}
                  </div>

                  {/* Stage 3: Layer 3 Manager */}
                  <div className={`p-4 rounded-2xl border transition relative ${
                    layer3 
                      ? 'bg-purple-50/60 border-purple-200 ring-1 ring-purple-200' 
                      : 'bg-slate-50/80 border-slate-200 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${layer3 ? 'bg-purple-500' : 'bg-slate-300'}`}></span>
                        <span>Layer 3 (Manager)</span>
                      </span>
                      {layer3 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-purple-600" />
                          <span>{language === 'th' ? 'อนุมัติแล้ว' : 'Approved'}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600">
                          {language === 'th' ? 'รออนุมัติ' : 'Awaiting'}
                        </span>
                      )}
                    </div>

                    {layer3 ? (
                      <div className="space-y-1 text-xs">
                        <div className="font-bold text-slate-900 truncate">
                          👤 {layer3.auditor_name}
                          {layer3.auditor_username && <span className="font-normal text-slate-500 text-[11px]"> (@{layer3.auditor_username})</span>}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{layer3.audit_date} ({layer3.shift})</span>
                        </div>
                        <div className="pt-2 flex items-center justify-between border-t border-purple-100/80">
                          <span className="text-[11px] text-slate-600 font-medium">
                            Score: <strong className="text-purple-700">{layer3.score_percent}%</strong>
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            layer3.total_no > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {layer3.total_no > 0 ? `${layer3.total_no} Defect` : '0 Defect (OK)'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('layer3')}
                          className="w-full mt-2 py-1.5 px-2 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded-lg transition text-center"
                        >
                          {language === 'th' ? 'ดูรายการตรวจ Layer 3' : 'View Layer 3 Sheet'}
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-3 text-center">
                        {language === 'th' ? 'รอ Manager เข้ามาตรวจสอบ' : 'Waiting for Manager'}
                      </p>
                    )}
                  </div>

                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-200 gap-1 overflow-x-auto no-scrollbar py-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('timeline')}
                  className={`px-4 py-2 text-xs font-bold rounded-t-xl transition whitespace-nowrap ${
                    activeTab === 'timeline'
                      ? 'bg-white border-t-2 border-x border-t-[#F37021] border-x-slate-200 text-[#F37021]'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {language === 'th' ? '📋 สรุปไทม์ไลน์ภาพรวม' : '📋 Timeline Summary'}
                </button>

                {layer1 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('layer1')}
                    className={`px-4 py-2 text-xs font-bold rounded-t-xl transition whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === 'layer1'
                        ? 'bg-white border-t-2 border-x border-t-emerald-600 border-x-slate-200 text-emerald-800'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Layer 1 ({layer1.auditor_name})</span>
                  </button>
                )}

                {layer2 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('layer2')}
                    className={`px-4 py-2 text-xs font-bold rounded-t-xl transition whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === 'layer2'
                        ? 'bg-white border-t-2 border-x border-t-blue-600 border-x-slate-200 text-blue-800'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>Layer 2 ({layer2.auditor_name})</span>
                  </button>
                )}

                {layer3 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('layer3')}
                    className={`px-4 py-2 text-xs font-bold rounded-t-xl transition whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === 'layer3'
                        ? 'bg-white border-t-2 border-x border-t-purple-600 border-x-slate-200 text-purple-800'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <span>Layer 3 ({layer3.auditor_name})</span>
                  </button>
                )}
              </div>

              {/* Tab Content: Timeline Summary */}
              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  {/* Audit Trail Log Rows */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 divide-y divide-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 mb-3">
                      {language === 'th' ? 'ลำดับประวัติการเข้าตรวจรหัสนี้' : 'Audit Log Entries for this Code'}
                    </h4>

                    {(data.layers || []).map((round: any, idx: number) => (
                      <div key={round.id || idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-lg font-black text-[11px] ${
                            round.layer === 'Layer 1'
                              ? 'bg-emerald-100 text-emerald-800'
                              : round.layer === 'Layer 2'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {round.layer}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900">
                              {round.auditor_name}
                              {round.auditor_position && <span className="font-normal text-slate-500 text-[11px]"> — {round.auditor_position}</span>}
                            </div>
                            <div className="text-slate-400 text-[11px]">
                              {language === 'th' ? 'ตรวจเมื่อ' : 'Audited on'}: {round.audit_date} ({round.shift}) • {round.created_at ? new Date(round.created_at).toLocaleTimeString() : ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-semibold">คะแนนความปลอดภัย</span>
                            <span className="font-bold text-slate-900">{round.score_percent}%</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (round.layer === 'Layer 1') setActiveTab('layer1');
                              else if (round.layer === 'Layer 2') setActiveTab('layer2');
                              else if (round.layer === 'Layer 3') setActiveTab('layer3');
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                          >
                            {language === 'th' ? 'ดูใบตรวจ' : 'View Sheet'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Defects Found Across Layers under this code */}
                  {(() => {
                    const allDefects: any[] = [];
                    (data.layers || []).forEach((l: any) => {
                      (l.items || []).filter((it: any) => it.result === 'NO').forEach((it: any) => {
                        allDefects.push({ ...it, fromLayer: l.layer, auditor: l.auditor_name, date: l.audit_date });
                      });
                    });

                    if (allDefects.length === 0) {
                      return (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                          <span>{language === 'th' ? 'ยอดเยี่ยม! ไม่พบประเด็นความไม่ปลอดภัย (Defects = 0) ในทุกรอบของรหัสเอกสารนี้' : 'Great! No safety defects found across all audits for this code.'}</span>
                        </div>
                      );
                    }

                    return (
                      <div className="bg-red-50/60 border border-red-200 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span>{language === 'th' ? `ข้อบกพร่องที่พบในรหัสนี้ (${allDefects.length} รายการ)` : `Defects Recorded Under this Code (${allDefects.length})`}</span>
                          </h4>
                        </div>

                        <div className="space-y-2">
                          {allDefects.map((def: any, dIdx: number) => (
                            <div key={dIdx} className="bg-white p-3 rounded-xl border border-red-200 text-xs shadow-sm space-y-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <div className="font-bold text-slate-900">
                                  <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold mr-1.5">
                                    {def.fromLayer}
                                  </span>
                                  <span>{def.finding_topic || def.question}</span>
                                </div>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-800 shrink-0">
                                  {def.severity || 'Minor'}
                                </span>
                              </div>

                              <div className="text-[11px] text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1 border-t border-slate-100">
                                <div><strong>{t.actionPlan}:</strong> {def.action_plan || '-'}</div>
                                <div><strong>{t.responsiblePerson}:</strong> {def.responsible_person || '-'}</div>
                                <div><strong>{t.dueDate}:</strong> {def.due_date || '-'}</div>
                                <div><strong>{language === 'th' ? 'ผู้พบ' : 'Auditor'}:</strong> {def.auditor} ({def.date})</div>
                              </div>

                              {def.image_url && (
                                <div className="pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedImage(normalizeImageUrl(def.image_url))}
                                    className="inline-flex items-center gap-1 text-[11px] text-[#F37021] hover:text-[#DE5F14] font-semibold underline"
                                  >
                                    <ImageIcon className="w-3 h-3" />
                                    <span>{language === 'th' ? 'ดูรูปหลักฐาน' : 'View Proof Photo'}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Tab Content: Specific Layer Checklist View */}
              {currentTabLayer && (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between text-xs gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">{language === 'th' ? 'ระดับการตรวจ' : 'Layer'}</span>
                      <strong className="text-base text-slate-900">{currentTabLayer.layer}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">{t.auditorCol}</span>
                      <strong className="text-slate-800">{currentTabLayer.auditor_name}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">{t.auditDate}</span>
                      <strong className="text-slate-800">{currentTabLayer.audit_date} ({currentTabLayer.shift})</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">{t.scoreCol}</span>
                      <strong className="text-emerald-700 text-sm">{currentTabLayer.score_percent}%</strong>
                    </div>
                  </div>

                  {/* Checklist Items Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100 text-xs">
                    {(currentTabLayer.items || []).map((it: any, qIdx: number) => {
                      const isOk = it.result === 'OK';
                      const isNo = it.result === 'NO';
                      return (
                        <div key={it.id || qIdx} className={`p-3.5 transition ${isNo ? 'bg-red-50/20' : 'hover:bg-slate-50/50'}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 flex-1">
                              {it.subcategory && (
                                <span className="inline-block text-[10px] font-bold text-[#F37021] bg-orange-50 border border-orange-200 px-2 py-0.5 rounded">
                                  {localizeSubcategory(it.subcategory, language)}
                                </span>
                              )}
                              <p className="font-semibold text-slate-900 leading-snug">
                                {localizeQuestion(it.question, language)}
                              </p>
                            </div>

                            <span className={`px-3 py-1 rounded-full text-[11px] font-black shrink-0 ${
                              isOk 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : isNo
                                ? 'bg-red-100 text-red-800 border border-red-300'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {it.result || 'N/A'}
                            </span>
                          </div>

                          {isNo && (
                            <div className="mt-2.5 p-3 bg-red-50 border border-red-200 rounded-xl space-y-1 text-[11px] text-red-950">
                              <div className="font-bold text-red-800">
                                <strong>{t.findingTopic}:</strong> {it.finding_topic || 'พบข้อบกพร่อง'}
                              </div>
                              {it.action_plan && (
                                <div><strong>{t.actionPlan}:</strong> {it.action_plan}</div>
                              )}
                              <div className="flex flex-wrap items-center gap-4 text-slate-700 pt-0.5">
                                {it.responsible_person && (
                                  <div><strong>{t.responsiblePerson}:</strong> {it.responsible_person}</div>
                                )}
                                {it.due_date && (
                                  <div><strong>{t.dueDate}:</strong> {it.due_date}</div>
                                )}
                              </div>
                              {it.image_url && (
                                <div className="pt-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedImage(normalizeImageUrl(it.image_url))}
                                    className="inline-flex items-center gap-1 text-[#F37021] hover:text-[#DE5F14] font-bold underline"
                                  >
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    <span>{language === 'th' ? 'ดูรูปถ่ายหลักฐาน' : 'View Proof Photo'}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            SBOP Document Code #{inspectionCode}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
          >
            {language === 'th' ? 'ปิดหน้าต่าง' : 'Close'}
          </button>
        </div>

      </div>

      {/* Lightbox Modal for Photo Evidence */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] p-2 bg-slate-900 rounded-2xl shadow-2xl border border-slate-800" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-3 -right-3 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={selectedImage} 
              alt="Proof" 
              className="max-h-[80vh] w-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
