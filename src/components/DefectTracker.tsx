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
  Camera
} from 'lucide-react';

export const DefectTracker: React.FC = () => {
  const { user, t, language } = useAuth();
  const [defects, setDefects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterDept, setFilterDept] = useState<string>('all');

  // In-App Notification Modal State
  const [notifyModalDefect, setNotifyModalDefect] = useState<any | null>(null);
  const [usersDirectory, setUsersDirectory] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState<string | null>(null);

  const loadDefects = async () => {
    setLoading(true);
    try {
      const data = await api.getInspections();
      const allDefects: any[] = [];

      for (const ins of (data.inspections || [])) {
        if (ins.defects_count > 0) {
          const detail = await api.getInspection(ins.id);
          const noItems = (detail.items || []).filter((it: any) => it.result === 'NO');
          noItems.forEach((item: any) => {
            allDefects.push({
              ...item,
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
    return true;
  });

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
      } else {
        const deptUsers = (list || []).filter((u: any) => u.department === defect.departmentCode);
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
              <p className="text-xs text-slate-500">{t.defectBoardSubtitle}</p>
            </div>
          </div>

          <button
            onClick={loadDefects}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition self-start md:self-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t.refresh}</span>
          </button>
        </div>

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
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">{t.filterLabel}</span>
        </div>

        {/* Severity */}
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
        >
          <option value="all">{t.allSeverities}</option>
          <option value="Major">{t.majorOnly}</option>
          <option value="Minor">{t.minorOnly}</option>
        </select>

        {/* Dept */}
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
        >
          <option value="all">{t.allDepartments}</option>
          <option value="MOLD">Molding / MM</option>
          <option value="FACILITY">Facility</option>
          <option value="ASSY">Assembly</option>
          <option value="WH">Warehouse</option>
          <option value="QC">QC</option>
          <option value="STAMPING">Stamping</option>
          <option value="TOOL">Tooling</option>
          <option value="SAFETY">{language === 'en' ? 'Safety / EHS' : 'Safety / EHS (ความปลอดภัย)'}</option>
        </select>

        <div className="ml-auto text-xs text-slate-500 font-medium">
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
                        <Building2 className="w-3.5 h-3.5 text-sky-600" />
                        <span>{t.department}: {d.departmentCode}</span>
                        <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-bold">
                          #{d.inspectionCode || '001'}
                        </span>
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          isMajor ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {d.severity || 'Minor'}
                      </span>
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
                      <Camera className="w-3.5 h-3.5 text-sky-600" />
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

                {/* In-app notification reminder button */}
                <div className="pt-2">
                  <button
                    onClick={() => handleOpenNotifyModal(d)}
                    className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm"
                  >
                    <Bell className="w-3.5 h-3.5 text-amber-600" />
                    <span>{t.sendAlertEmailBtn}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Send In-App Notification to Responsible Person Modal */}
      {notifyModalDefect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6">
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
              {/* Recipient User Picker */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t.selectResponsibleUser}
                </label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white"
                >
                  <option value="">{language === 'en' ? '-- Select Recipient User --' : '-- กรุณาเลือกผู้รับผิดชอบ --'}</option>
                  {usersDirectory.map((u) => {
                    const isSameDept = u.department === notifyModalDefect.departmentCode;
                    return (
                      <option key={u.id} value={u.id.toString()}>
                        {isSameDept ? '⭐ ' : ''}{u.first_name} {u.last_name} (@{u.username}) — [{u.department}] {u.position || u.role}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  {language === 'en' 
                    ? '⭐ Highlights users in the same department.' 
                    : '⭐ สัญลักษณ์ดาวระบุผู้ใช้งานที่อยู่ในแผนกเดียวกัน'}
                </p>
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
    </div>
  );
};
