import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  AlertTriangle, 
  ExternalLink, 
  Calendar, 
  User, 
  Mail, 
  CheckCircle, 
  Filter, 
  Send,
  Building2,
  RefreshCw,
  Camera
} from 'lucide-react';

export const DefectTracker: React.FC = () => {
  const { user, t } = useAuth();
  const [defects, setDefects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterDept, setFilterDept] = useState<string>('all');

  // Send Email Modal State
  const [emailModalDefect, setEmailModalDefect] = useState<any | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

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

  const handleOpenEmailModal = (defect: any) => {
    setEmailModalDefect(defect);
    setRecipientEmail(user?.email || '');
    setRecipientName(defect.responsible_person || '');
    setEmailMessage(
      `ขอความอนุเคราะห์ติดตามการแก้ไขปัญหาความปลอดภัยที่ตรวจพบ:\n` +
      `- แผนก: ${defect.departmentCode}\n` +
      `- เครื่องจักร/พื้นที่: ${defect.mcAndProducts}\n` +
      `- ปัญหาที่พบ: ${defect.finding_topic || defect.question}\n` +
      `- แผนการแก้ไข: ${defect.action_plan || 'ระบุมาตรการแก้ไข'}\n` +
      `- กำหนดเสร็จ: ${defect.due_date || 'ตามที่ตกลง'}\n\n` +
      (defect.image_url ? `ดูภาพหลักฐานจาก Cloudflare R2: ${defect.image_url}` : '')
    );
    setEmailSuccess(null);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail.trim() || !emailMessage.trim()) return;

    setSendingEmail(true);
    try {
      await api.sendCustomEmail({
        to: recipientEmail,
        toName: recipientName,
        subject: `[SBOP Follow-up] แจ้งเตือนการแก้ไขปัญหาความปลอดภัย แผนก ${emailModalDefect.departmentCode}`,
        message: emailMessage,
        inspectionId: emailModalDefect.inspectionId,
      });

      setEmailSuccess(`ส่งอีเมลแจ้งเตือนไปยัง ${recipientEmail} เรียบร้อยแล้ว`);
      setTimeout(() => {
        setEmailModalDefect(null);
      }, 1500);
    } catch (err: any) {
      alert('Failed to send email: ' + err.message);
    } finally {
      setSendingEmail(false);
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
              <p className="text-xs text-slate-500">SBOP Accountability Board & ติดตามผลการแก้ไขสิ่งผิดปกติที่ตรวจพบ</p>
            </div>
          </div>

          <button
            onClick={loadDefects}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition self-start md:self-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>รีเฟรชข้อมูล</span>
          </button>
        </div>

        {/* Criteria Note from TE-EHS-053 */}
        <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <span>เกณฑ์การประเมินข้อบกพร่อง (Criteria of Outstanding Item):</span>
          </div>
          <div>
            <strong className="text-amber-700">• Minor:</strong> ปัญหาที่ไม่ซับซ้อน สามารถแก้ไขได้ในทันที (ไม่จำเป็นต้องลงบันทึกในบอร์ด SBOP)
          </div>
          <div>
            <strong className="text-red-700">• Major:</strong> ปัญหาที่ใช้เวลาในการแก้ไขนาน หรือต้องการแผนกอื่นสนับสนุน ซึ่งต้องกำหนดวันเสร็จ (ลงบันทึกในบอร์ด SBOP)
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">ตัวกรอง:</span>
        </div>

        {/* Severity */}
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
        >
          <option value="all">ระดับความรุนแรงทั้งหมด (All)</option>
          <option value="Major">เฉพาะ Major (ต้องลงบอร์ด)</option>
          <option value="Minor">เฉพาะ Minor (แก้ไขทันที)</option>
        </select>

        {/* Dept */}
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
        >
          <option value="all">ทุกแผนก (All Depts)</option>
          <option value="MOLD">Molding / MM</option>
          <option value="FACILITY">Facility</option>
          <option value="ASSY">Assembly</option>
          <option value="WH">Warehouse</option>
          <option value="QC">QC</option>
          <option value="STAMPING">Stamping</option>
          <option value="TOOL">Tooling</option>
        </select>

        <div className="ml-auto text-xs text-slate-500 font-medium">
          พบข้อบกพร่อง {filteredDefects.length} รายการ
        </div>
      </div>

      {/* Defect Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 text-center py-16 bg-white rounded-2xl border border-slate-200">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500">กำลังดึงข้อมูลข้อบกพร่องและรูปภาพ...</p>
          </div>
        ) : filteredDefects.length === 0 ? (
          <div className="col-span-2 text-center py-16 bg-white rounded-2xl border border-slate-200">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-bold text-slate-800 text-sm">ไม่พบข้อบกพร่องหรือสิ่งผิดปกติค้างอยู่</h3>
            <p className="text-xs text-slate-500 mt-1">ทุกแผนกปฏิบัติตามมาตรฐานความปลอดภัยครบถ้วน</p>
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
                        <span>แผนก: {d.departmentCode}</span>
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
                  <div className="text-[11px] text-red-600 font-semibold">หัวข้อตรวจ: {d.question}</div>
                  <div className="text-xs font-bold text-red-900 leading-snug">
                    ปัญหาที่พบ: {d.finding_topic || 'ตรวจพบสภาพไม่ปลอดภัย'}
                  </div>
                </div>

                {/* Photo attached from Cloudflare R2 */}
                {d.image_url ? (
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500 font-semibold block flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-sky-600" />
                      <span>ภาพถ่ายหลักฐาน (Cloudflare R2):</span>
                    </span>
                    <a
                      href={d.image_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden rounded-xl border border-slate-200 group relative"
                    >
                      <img
                        src={d.image_url}
                        alt="Defect"
                        className="w-full h-44 object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold gap-1.5 backdrop-blur-[1px]">
                        <span>เปิดดูรูปขนาดเต็มบน Cloudflare R2</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </a>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl text-center text-slate-400 text-xs border border-dashed border-slate-200">
                    ไม่มีรูปภาพแนบ
                  </div>
                )}

                {/* Action plan & Responsible person */}
                <div className="text-xs space-y-1.5 border-t border-slate-100 pt-3 text-slate-600">
                  <div>
                    <span className="font-semibold text-slate-700">แนวทางแก้ไข: </span>
                    <span>{d.action_plan || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="flex items-center gap-1 text-slate-700 font-medium">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>ผู้รับผิดชอบ: {d.responsible_person || '-'}</span>
                    </span>
                    <span className="flex items-center gap-1 text-amber-700 font-bold">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>กำหนดเสร็จ: {d.due_date || '-'}</span>
                    </span>
                  </div>
                </div>

                {/* Email reminder button */}
                <div className="pt-2">
                  <button
                    onClick={() => handleOpenEmailModal(d)}
                    className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <Mail className="w-3.5 h-3.5 text-sky-600" />
                    <span>ส่งอีเมลติดตามงานแก้ไข (Send Email Alert)</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Send Email Reminder Modal */}
      {emailModalDefect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Mail className="w-5 h-5 text-sky-600" />
              <span>ส่งอีเมลติดตามงานแก้ไขความปลอดภัย</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              ส่งข้อความแจ้งเตือนไปยังอีเมลของบัญชีพนักงาน หรือผู้รับผิดชอบงาน
            </p>

            {emailSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>{emailSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSendEmail} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  อีเมลผู้รับ (Recipient Email) *
                </label>
                <input
                  type="email"
                  required
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="เช่น maintainer@sbop.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ชื่อผู้รับ (Recipient Name)
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="ชื่อผู้รับผิดชอบ"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ข้อความในอีเมล (Message Content) *
                </label>
                <textarea
                  rows={6}
                  required
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEmailModalDefect(null)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingEmail ? 'กำลังส่งเมล...' : 'ส่งอีเมลทันที'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
