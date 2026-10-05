import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, normalizeImageUrl } from '../services/api';
import { localizeQuestion } from '../i18n/translations';
import { 
  AlertTriangle, 
  ExternalLink, 
  Calendar, 
  User, 
  Bell, 
  CheckCircle, 
  Filter, 
  Send,
  Building2,
  RefreshCw,
  Camera,
  Trash2,
  FileSpreadsheet,
  Image as ImageIcon
} from 'lucide-react';
import { ExportDataModal } from './ExportDataModal';

export const DefectTracker: React.FC = () => {
  const { user, t, language } = useAuth();
  const [defects, setDefects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Deletion and status update state
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Export Modal state (Admin & Superadmin)
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportModalTab, setExportModalTab] = useState<'excel' | 'images'>('excel');

  // In-App Notification Modal State
  const [notifyModalDefect, setNotifyModalDefect] = useState<any | null>(null);
  const [usersDirectory, setUsersDirectory] = useState<any[]>([]);
  const [modalDept, setModalDept] = useState<string>('all');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState<string | null>(null);

  const isPrivileged = user?.role === 'admin' || user?.role === 'superadmin';

  const loadDefects = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      // Privileged admins and guests see all departments; normal users see only their department
      if (!isPrivileged && user?.role !== 'guest') {
        params.department = user?.department || 'MOLD';
      }
      const data = await api.getInspections(params);
      const allDefects: any[] = [];

      for (const ins of (data.inspections || [])) {
        if (ins.defects_count > 0) {
          const detail = await api.getInspection(ins.id);
          const noItems = (detail.items || []).filter((it: any) => it.result === 'NO');
          noItems.forEach((item: any) => {
            allDefects.push({
              ...item,
              defect_status: item.defect_status || 'pending',
              inspectionId: ins.id,
              departmentCode: ins.department_code,
              auditDate: ins.audit_date,
              shift: ins.shift,
              mcAndProducts: ins.mc_and_products,
              inspectionCode: ins.inspection_code,
              auditorName: ins.auditor_name,
            });
          });
        }
      }

      setDefects(allDefects);
    } catch (err) {
      console.error('Failed to load defects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDefects();
  }, []);

  const filteredDefects = defects.filter((d) => {
    if (filterSeverity !== 'all' && d.severity !== filterSeverity) return false;
    if (filterDept !== 'all' && d.departmentCode !== filterDept) return false;
    if (filterStatus !== 'all') {
      const current = d.defect_status || 'pending';
      if (current !== filterStatus) return false;
    }
    return true;
  });

  const handleToggleDefectStatus = async (defect: any) => {
    if (user?.role === 'guest') return;
    const currentStatus = defect.defect_status === 'resolved' ? 'resolved' : 'pending';
    const newStatus = currentStatus === 'resolved' ? 'pending' : 'resolved';

    setUpdatingStatusId(defect.id);
    setActionMessage(null);
    try {
      await api.updateDefectStatus(defect.id, newStatus);
      setDefects((prev) =>
        prev.map((d) => (d.id === defect.id ? { ...d, defect_status: newStatus } : d))
      );
      setActionMessage({
        type: 'success',
        text: newStatus === 'resolved'
          ? (language === 'th' ? 'เปลี่ยนสถานะเป็น "แก้แล้ว" เรียบร้อย (ขณะนี้สามารถกดลบข้อผิดพลาดได้แล้ว)' : 'Marked as resolved. You can now delete this defect.')
          : (language === 'th' ? 'เปลี่ยนสถานะกลับเป็น "ยังไม่แก้" เรียบร้อย' : 'Reopened defect to pending.'),
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: (language === 'th' ? 'ไม่สามารถเปลี่ยนสถานะได้: ' : 'Failed to change status: ') + (err.message || 'Unknown error'),
      });
    } finally {
      setUpdatingStatusId(null);
      setTimeout(() => {
        setActionMessage(null);
      }, 5000);
    }
  };

  const handleDeleteResolvedDefect = async (defect: any) => {
    if (user?.role === 'guest') return;
    if (defect.defect_status !== 'resolved') {
      setActionMessage({
        type: 'error',
        text: language === 'th'
          ? 'ไม่สามารถลบรายการนี้ได้เนื่องจากยังไม่ได้รับการแก้ไข กรุณากด "ทำเครื่องหมายว่าแก้แล้ว" ก่อน จึงจะลบได้'
          : 'Cannot delete unresolved defect. Please mark as resolved first.'
      });
      return;
    }

    const confirmMsg = language === 'en'
      ? `Are you sure you want to remove this resolved defect (#${defect.inspectionCode || '001'} - ${defect.finding_topic || defect.question})?\nThis will permanently delete any associated photo evidence from Cloudflare R2 storage and recalculate the compliance score.`
      : `คุณต้องการลบข้อผิดพลาดนี้ที่ได้รับการแก้ไขแล้ว (รหัสตรวจ #${defect.inspectionCode || '001'} - ${defect.finding_topic || defect.question}) ใช่หรือไม่?\nระบบจะลบรูปภาพหลักฐานออกจาก Cloudflare R2 อย่างถาวร และปรับปรุงคะแนนความปลอดภัยของรอบตรวจให้ถูกต้อง`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setDeletingId(defect.id);
    setActionMessage(null);
    try {
      await api.deleteDefect(defect.id);
      setActionMessage({
        type: 'success',
        text: language === 'en'
          ? 'Defect resolved and photo evidence permanently deleted from Cloudflare R2 successfully.'
          : 'ลบข้อผิดพลาดและรูปภาพหลักฐานออกจากระบบจัดเก็บเรียบร้อยแล้ว (อัปเดตสถานะเป็นผ่าน/OK และคำนวณคะแนนใหม่สำเร็จ)',
      });
      await loadDefects();
    } catch (err: any) {
      console.error('Failed to delete resolved defect:', err);
      setActionMessage({
        type: 'error',
        text: (language === 'en' ? 'Failed to delete defect: ' : 'ไม่สามารถลบข้อผิดพลาดได้: ') + (err.message || 'Unknown error'),
      });
    } finally {
      setDeletingId(null);
      setTimeout(() => {
        setActionMessage(null);
      }, 5000);
    }
  };

  const handleOpenNotifyModal = async (defect: any) => {
    setNotifyModalDefect(defect);
    setNotifSuccess(null);

    const defaultTitle = language === 'en'
      ? `[Action Required] Unsafe Condition at ${defect.departmentCode} (#${defect.inspectionCode || '001'})`
      : `[แจ้งเตือนการแก้ไขความปลอดภัย] แผนก ${defect.departmentCode} (รหัสตรวจ #${defect.inspectionCode || '001'})`;

    const defaultMsg = language === 'en'
      ? `Dear Responsible Person,\nAn unsafe condition was detected in SBOP Audit (Inspection #${defect.inspectionCode || '001'}):\n` +
        `- Department: ${defect.departmentCode}\n` +
        `- Location/Machine: ${defect.mcAndProducts || '-'}\n` +
        `- Issue/Topic: ${defect.finding_topic || defect.question}\n` +
        `- Severity: ${defect.severity || 'Minor'}\n` +
        `- Action Plan: ${defect.action_plan || 'Please specify plan'}\n` +
        `- Target Due Date: ${defect.due_date || 'ASAP'}\n` +
        `- Auditor: ${defect.auditorName || '-'}\n\n` +
        (defect.image_url ? `Photo evidence: ${defect.image_url}\n\n` : '') +
        `Please proceed with corrective action and update the SBOP Accountability Board.`
      : `เรียน ผู้รับผิดชอบ,\nตรวจพบสภาพไม่ปลอดภัยจากการตรวจ SBOP หน้างาน (รหัสตรวจ #${defect.inspectionCode || '001'}):\n` +
        `- แผนก: ${defect.departmentCode}\n` +
        `- จุดตรวจ/เครื่องจักร: ${defect.mcAndProducts || '-'}\n` +
        `- ประเด็นที่พบ: ${defect.finding_topic || defect.question}\n` +
        `- ระดับความรุนแรง: ${defect.severity || 'Minor'}\n` +
        `- แผนการแก้ไข: ${defect.action_plan || 'ระบุมาตรการแก้ไข'}\n` +
        `- กำหนดเสร็จ: ${defect.due_date || 'โดยเร็ว'}\n` +
        `- ผู้ตรวจประเมิน: ${defect.auditorName || '-'}\n\n` +
        (defect.image_url ? `รูปถ่ายหลักฐาน: ${defect.image_url}\n\n` : '') +
        `กรุณาดำเนินการแก้ไขและบันทึกลงในบอร์ด SBOP ตามระเบียบ`;

    setNotifTitle(defaultTitle);
    setNotifMessage(defaultMsg);

    try {
      let list = usersDirectory;
      if (!list || list.length === 0) {
        list = await api.getUsersDirectory();
        setUsersDirectory(list || []);
      }

      // Try auto-matching defect.responsible_person with users
      const respName = (defect.responsible_person || '').trim().toLowerCase();
      let matchedUser = null;
      if (respName && list && list.length > 0) {
        matchedUser = list.find((u: any) => {
          const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
          const uName = (u.username || '').toLowerCase();
          return fullName.includes(respName) || respName.includes(u.first_name?.toLowerCase()) || uName === respName;
        });
      }

      if (matchedUser) {
        setSelectedUserId(matchedUser.id.toString());
        if (matchedUser.department) setModalDept(matchedUser.department);
      } else {
        const targetDept = defect.departmentCode || 'all';
        setModalDept(targetDept);
        const deptUsers = (list || []).filter((u: any) => u.department === targetDept);
        if (deptUsers.length > 0) {
          setSelectedUserId(deptUsers[0].id.toString());
        } else if (list && list.length > 0) {
          setSelectedUserId(list[0].id.toString());
        } else {
          setSelectedUserId('');
        }
      }
    } catch (err) {
      console.error('Failed to load user directory:', err);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !notifTitle.trim() || !notifMessage.trim()) return;

    setSendingNotif(true);
    try {
      await api.sendNotification({
        userId: Number(selectedUserId),
        title: notifTitle,
        message: notifMessage,
        type: 'alert',
        link: '/defects',
      });

      const targetUser = usersDirectory.find((u) => u.id.toString() === selectedUserId);
      const targetName = targetUser ? `${targetUser.first_name} ${targetUser.last_name} (@${targetUser.username})` : 'ผู้รับผิดชอบ';
      setNotifSuccess(
        language === 'en'
          ? `In-App Notification dispatched to ${targetName} successfully! It will appear on their profile and notification bell.`
          : `ส่งการแจ้งเตือนไปยัง ${targetName} เรียบร้อยแล้ว! ข้อความจะปรากฏที่กระดิ่งและโปรไฟล์ของผู้รับผิดชอบ`
      );
      setTimeout(() => {
        setNotifyModalDefect(null);
      }, 1800);
    } catch (err: any) {
      alert((language === 'en' ? 'Failed to send notification: ' : 'ส่งการแจ้งเตือนล้มเหลว: ') + err.message);
    } finally {
      setSendingNotif(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Criteria Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{t.tabDefects}</h1>
              <p className="text-xs text-slate-500">
                {user?.role === 'guest'
                  ? (language === 'th' ? 'โหมดผู้มาเยือน (ดูข้อมูลได้อย่างเดียว) • รายการสิ่งผิดปกติทั้งหมดในทุกแผนก' : 'Guest Mode (View Only) • All defects across departments')
                  : isPrivileged
                  ? (language === 'th' ? 'รายการสิ่งผิดปกติทั้งหมดในระบบ (สิทธิ์ Admin / Super Admin เห็นข้อมูลทุกแผนก)' : 'Defects and anomalies across all departments (Admin/Superadmin)')
                  : (language === 'th' ? `รายการสิ่งผิดปกติทั้งหมดที่ตรวจพบในแผนก ${user?.department || ''} (เชื่อมโยงข้อมูลร่วมกันในแผนก)` : `Linked anomalies for department ${user?.department || ''}`)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            <button
              onClick={loadDefects}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{t.refresh}</span>
            </button>

            {/* Export Buttons: Admin & Superadmin Only */}
            {isPrivileged && (
              <>
                <button
                  onClick={() => {
                    setExportModalTab('excel');
                    setShowExportModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  title={language === 'th' ? 'ส่งออกข้อมูลสิ่งผิดปกติเป็น Excel' : 'Export defects to Excel'}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>{t.exportExcelBtn || 'Export Excel'}</span>
                </button>

                <button
                  onClick={() => {
                    setExportModalTab('images');
                    setShowExportModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F37021] hover:bg-[#DE5F14] text-white rounded-xl text-xs font-bold transition shadow-xs"
                  title={language === 'th' ? 'ส่งออกรูปภาพสิ่งผิดปกติเป็น ZIP' : 'Export defect photos to ZIP'}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{t.exportImagesBtn || 'Export รูปภาพ'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Action Message Banner */}
        {actionMessage && (
          <div className={`mt-4 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border animate-fadeIn ${
            actionMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {actionMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Criteria Note from TE-EHS-053 */}
        <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <span>{t.criteriaTitle}</span>
          </div>
          <div>
            <strong className="text-amber-700">• Minor:</strong> {t.minorDesc}
          </div>
          <div>
            <strong className="text-red-700">• Major:</strong> {t.majorDesc}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Filter className="w-4 h-4 text-slate-400" />
            <span>{t.filterLabel}:</span>
          </div>

          {/* Severity */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
          >
            <option value="all">{t.allSeverities}</option>
            <option value="Major">{t.majorOnly}</option>
            <option value="Minor">{t.minorOnly}</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
          >
            <option value="all">{language === 'th' ? 'สถานะทั้งหมด' : 'All Statuses'}</option>
            <option value="pending">{language === 'th' ? '🟡 ยังไม่แก้' : '🟡 Pending'}</option>
            <option value="resolved">{language === 'th' ? '🟢 แก้แล้ว' : '🟢 Resolved'}</option>
          </select>

          {/* Dept */}
          {isPrivileged || user?.role === 'guest' ? (
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            >
              <option value="all">{t.allDepartments}</option>
              <option value="MOLD">Molding</option>
              <option value="FACILITY">Facility</option>
              <option value="ASSY">Assembly</option>
              <option value="WH">Warehouse</option>
              <option value="QC">QC</option>
              <option value="STAMPING">Stamping</option>
              <option value="TOOL">Tooling</option>
              <option value="SAFETY">{language === 'en' ? 'Safety' : 'Safety'}</option>
            </select>
          ) : (
            <div className="px-2.5 py-1.5 bg-orange-50 border border-orange-200 text-[#F37021] rounded-xl text-xs font-bold flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span>{user?.department || 'MOLD'}</span>
            </div>
          )}
        </div>

        <div className="text-xs text-slate-500 font-medium ml-auto">
          {t.foundDefectsCount.replace('{0}', filteredDefects.length.toString())}
        </div>
      </div>

      {/* Defect Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 text-center py-16 bg-white rounded-2xl border border-slate-200">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500">{t.loadingDefects}</p>
          </div>
        ) : filteredDefects.length === 0 ? (
          <div className="col-span-2 text-center py-16 bg-white rounded-2xl border border-slate-200">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-bold text-slate-800 text-sm">{t.zeroDefectsBanner}</h3>
            <p className="text-xs text-slate-500 mt-1">{t.allDepartmentsComply}</p>
          </div>
        ) : (
          filteredDefects.map((d, index) => {
            const isMajor = d.severity === 'Major';
            return (
              <div
                key={d.id || index}
                className={`bg-white rounded-2xl border p-5 shadow-sm space-y-4 transition ${
                  isMajor ? 'border-red-200 hover:border-red-400' : 'border-amber-200 hover:border-amber-400'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-[#F37021]" />
                        <span>{t.department}: {d.departmentCode}</span>
                        <span className="px-1.5 py-0.5 rounded bg-orange-100 text-[#F37021] text-[10px] font-bold">
                          #{d.inspectionCode || '001'}
                        </span>
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            isMajor ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {d.severity || 'Minor'}
                        </span>
                        {d.defect_status === 'resolved' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>{language === 'th' ? 'แก้แล้ว' : 'Resolved'}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            <span>{language === 'th' ? 'ยังไม่แก้' : 'Pending'}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-slate-800">
                      {d.mcAndProducts}
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-400">
                    <div>{d.auditDate}</div>
                    <div>{d.shift}</div>
                  </div>
                </div>

                {/* Finding & Question */}
                <div className="p-3 bg-red-50/60 border border-red-100 rounded-xl space-y-1">
                  <div className="text-[11px] text-red-600 font-semibold">{t.question}: {localizeQuestion(d.question, language)}</div>
                  <div className="text-xs font-bold text-red-900 leading-snug">
                    {t.findingTopic}: {d.finding_topic || (language === 'en' ? 'Unsafe condition observed' : 'ตรวจพบสภาพไม่ปลอดภัย')}
                  </div>
                </div>

                {/* Photo attached from Cloudflare R2 */}
                {d.image_url ? (
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500 font-semibold block flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-[#F37021]" />
                      <span>📸 {t.attachPhoto}:</span>
                    </span>
                    <a
                      href={normalizeImageUrl(d.image_url)}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden rounded-xl border border-slate-200 group relative"
                    >
                      <img
                        src={normalizeImageUrl(d.image_url)}
                        alt="Defect"
                        className="w-full h-44 object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold gap-1.5 backdrop-blur-[1px]">
                        <span>{t.openFullProofPhoto}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </a>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl text-center text-slate-400 text-xs border border-dashed border-slate-200">
                    {t.noPhotoEvidence}
                  </div>
                )}

                {/* Action plan & Responsible person */}
                <div className="text-xs space-y-1.5 border-t border-slate-100 pt-3 text-slate-600">
                  <div>
                    <span className="font-semibold text-slate-700">{t.actionPlan}: </span>
                    <span>{d.action_plan || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="flex items-center gap-1 text-slate-700 font-medium">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.responsiblePerson}: {d.responsible_person || '-'}</span>
                    </span>
                    <span className="flex items-center gap-1 text-amber-700 font-bold">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{t.dueDate}: {d.due_date || '-'}</span>
                    </span>
                  </div>
                </div>

                {/* Actions: Status toggle, notification & Delete resolved defect */}
                <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {/* Status Toggle Button */}
                    {user?.role !== 'guest' ? (
                      <button
                        type="button"
                        onClick={() => handleToggleDefectStatus(d)}
                        disabled={updatingStatusId === d.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                          d.defect_status === 'resolved'
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                        } disabled:opacity-50`}
                        title={d.defect_status === 'resolved'
                          ? (language === 'th' ? 'เปลี่ยนสถานะกลับเป็นยังไม่แก้' : 'Reopen defect')
                          : (language === 'th' ? 'เปลี่ยนสถานะเป็นได้รับการแก้ไขแล้ว' : 'Mark as resolved')}
                      >
                        <CheckCircle className={`w-3.5 h-3.5 ${updatingStatusId === d.id ? 'animate-spin' : ''}`} />
                        <span>
                          {updatingStatusId === d.id
                            ? (language === 'th' ? 'กำลังบันทึก...' : 'Saving...')
                            : d.defect_status === 'resolved'
                            ? (language === 'th' ? '↩️ ยังไม่แก้' : 'Reopen')
                            : (language === 'th' ? '✅ ทำเครื่องหมายแก้แล้ว' : 'Mark Resolved')}
                        </span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        {language === 'th' ? '👁️ ดูได้อย่างเดียว (ผู้มาเยือน)' : '👁️ View Only (Guest)'}
                      </span>
                    )}

                    {/* Delete Resolved Defect Button (Enabled ONLY if resolved and not guest) */}
                    {user?.role !== 'guest' && (
                      d.defect_status === 'resolved' ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteResolvedDefect(d)}
                          disabled={deletingId === d.id}
                          className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs disabled:opacity-50"
                          title={language === 'th' ? 'ลบข้อผิดพลาดนี้ที่ได้รับการแก้ไขแล้ว พร้อมลบรูปภาพหลักฐานออกจากระบบจัดเก็บ' : 'Delete this defect that has been resolved and permanently delete its photo'}
                        >
                          <Trash2 className={`w-3.5 h-3.5 shrink-0 ${deletingId === d.id ? 'animate-spin' : 'text-rose-600'}`} />
                          <span>{deletingId === d.id ? (language === 'th' ? 'กำลังลบ...' : 'Deleting...') : (t.deleteResolvedDefect || 'ลบข้อผิดพลาด (แก้ไขแล้ว)')}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={true}
                          className="py-1.5 px-3 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed opacity-75"
                          title={language === 'th' ? 'ต้องเปลี่ยนสถานะเป็น "แก้แล้ว" ก่อน จึงจะสามารถลบออกจากระบบได้' : 'Defect must be marked as resolved before it can be deleted'}
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                          <span>{language === 'th' ? '🔒 ลบไม่ได้ (ยังไม่แก้)' : '🔒 Locked (Unresolved)'}</span>
                        </button>
                      )
                    )}
                  </div>

                  {/* Notification Button (hidden for guests) */}
                  {user?.role !== 'guest' && (
                    <button
                      type="button"
                      onClick={() => handleOpenNotifyModal(d)}
                      className="w-full py-1.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
                    >
                      <Bell className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">{t.sendAlertEmailBtn}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Send In-App Notification to Responsible Person Modal */}
      {notifyModalDefect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              <span>{t.notifyModalTitle}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              {language === 'en' 
                ? 'Send an in-app notification directly to the responsible person account. It will show on their profile & notification badge.' 
                : 'ส่งการแจ้งเตือนไปยังบัญชีผู้รับผิดชอบงานโดยตรง ข้อความจะแจ้งเตือนที่กระดิ่งและหน้าโปรไฟล์ของพนักงาน'}
            </p>

            {/* Quick defect summary chip */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 mb-4">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span>{notifyModalDefect.departmentCode} • #{notifyModalDefect.inspectionCode || '001'}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                  notifyModalDefect.severity === 'Major' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {notifyModalDefect.severity || 'Minor'}
                </span>
              </div>
              <div className="text-slate-600 truncate">
                <strong>{t.findingTopic}:</strong> {notifyModalDefect.finding_topic || notifyModalDefect.question}
              </div>
              <div className="text-slate-500 text-[11px]">
                {t.responsiblePerson}: <span className="text-slate-800 font-semibold">{notifyModalDefect.responsible_person || '-'}</span> | {t.dueDate}: <span className="text-amber-700 font-semibold">{notifyModalDefect.due_date || '-'}</span>
              </div>
            </div>

            {notifSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{notifSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSendNotification} className="space-y-3.5 text-xs">
              {/* Recipient User: แผนก > user ในแผนก */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. แผนก */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#F37021]" />
                    <span>{language === 'en' ? 'Department' : 'แผนกผู้รับผิดชอบ'}</span>
                  </label>
                  <select
                    value={modalDept}
                    onChange={(e) => {
                      const newDept = e.target.value;
                      setModalDept(newDept);
                      const deptUsers = newDept === 'all' 
                        ? usersDirectory 
                        : usersDirectory.filter((u) => u.department === newDept);
                      if (deptUsers.length > 0) {
                        setSelectedUserId(deptUsers[0].id.toString());
                      } else {
                        setSelectedUserId('');
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  >
                    <option value="all">{language === 'en' ? '-- All Departments --' : '-- ทุกแผนก --'}</option>
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

                {/* 2. User ในแผนก */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{language === 'en' ? 'Responsible User' : 'ผู้รับผิดชอบ (User ในแผนก)'} *</span>
                  </label>
                  <select
                    required
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  >
                    <option value="">{language === 'en' ? '-- Select User in Dept --' : '-- กรุณาเลือกผู้รับผิดชอบ --'}</option>
                    {usersDirectory
                      .filter((u) => modalDept === 'all' || u.department === modalDept)
                      .map((u) => (
                        <option key={u.id} value={u.id.toString()}>
                          {u.first_name} {u.last_name} (@{u.username}) [{u.department}] {u.position ? `— ${u.position}` : ''}
                        </option>
                      ))}
                    {usersDirectory.filter((u) => modalDept === 'all' || u.department === modalDept).length === 0 && (
                      <option value="" disabled>
                        {language === 'en' ? '(No users registered in this department)' : '(ไม่มีพนักงานในแผนกนี้)'}
                      </option>
                    )}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t.notificationTitleLabel}
                </label>
                <input
                  type="text"
                  required
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t.notificationMessageLabel}
                </label>
                <textarea
                  rows={5}
                  required
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNotifyModalDefect(null)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={sendingNotif || !selectedUserId}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow flex items-center gap-1.5 disabled:opacity-50 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingNotif ? t.sendingNotification : t.sendNotificationBtn}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Center Modal */}
      <ExportDataModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        defaultTab={exportModalTab}
      />
    </div>
  );
};
