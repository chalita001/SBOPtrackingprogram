import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Mail, X, RefreshCw, Send, CheckCircle2, Clock, AlertCircle, Eye } from 'lucide-react';

interface EmailLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailLogsModal: React.FC<EmailLogsModalProps> = ({ isOpen, onClose }) => {
  const { t, language } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewEmail, setPreviewEmail] = useState<any | null>(null);

  // Manual Send State
  const [showSendForm, setShowSendForm] = useState(false);
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getEmailLogs();
      setLogs(data || []);
    } catch (err) {
      console.error('Failed to load email logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
      setShowSendForm(false);
      setPreviewEmail(null);
      setSendResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendResult(null);
    try {
      await api.sendCustomEmail({
        to: toEmail.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      setSendResult(language === 'en' ? 'Email notification sent successfully' : 'ส่งอีเมลแจ้งเตือนเรียบร้อยแล้ว');
      setToEmail('');
      setSubject('');
      setMessage('');
      loadLogs();
      setTimeout(() => setShowSendForm(false), 1500);
    } catch (err: any) {
      alert('Failed: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#1E2229] p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F37021]/20 border border-[#F37021]/30 flex items-center justify-center">
              <Mail className="w-5 h-5 text-[#F37021]" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{t.emailLogsTitle}</h2>
              <p className="text-xs text-slate-300">
                {language === 'en' ? 'History of account approval alerts and SBOP defect notifications' : 'ประวัติการส่งอีเมลเตือนการอนุมัติสมาชิกและแจ้งเตือนข้อบกพร่อง SBOP'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSendForm(!showSendForm)}
              className="px-3 py-1.5 rounded-lg bg-[#F37021] hover:bg-[#DE5F14] text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{showSendForm ? (language === 'en' ? 'View Email History' : 'ดูประวัติอีเมล') : (language === 'en' ? 'Send Custom Alert' : 'ส่งอีเมลแจ้งเตือน')}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {showSendForm ? (
            <div className="max-w-xl mx-auto space-y-4">
              <h3 className="font-bold text-slate-900 text-sm border-b pb-2">
                {t.directEmailAlert}
              </h3>

              {sendResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{sendResult}</span>
                </div>
              )}

              <form onSubmit={handleSendManual} className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t.recipientEmailLabel}
                  </label>
                  <input
                    type="email"
                    required
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    placeholder="user@sbop.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#F37021]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'en' ? 'Subject *' : 'หัวข้อเรื่อง (Subject) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={language === 'en' ? '[SBOP Notice] Safety Observation Alert' : '[SBOP Notice] แจ้งเตือนรอบการตรวจเช็คความปลอดภัย'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#F37021]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t.messageContentLabel}
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={language === 'en' ? 'Enter notification message...' : 'ระบุข้อความที่ต้องการแจ้งเตือน...'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSendForm(false)}
                    className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-5 py-2 bg-[#F37021] hover:bg-[#DE5F14] text-white font-bold rounded-xl shadow flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sending ? (language === 'en' ? 'Sending...' : 'กำลังส่ง...') : t.sendNow}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm">
                  {t.systemSentEmails.replace('{0}', logs.length.toString())}
                </span>
                <button
                  onClick={loadLogs}
                  className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-semibold"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>{t.refresh}</span>
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12 text-slate-400">{t.loadingLogs}</div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12 text-slate-400">{t.noEmailLogs}</div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {logs.map((log) => (
                    <div key={log.id} className="p-3.5 hover:bg-slate-50 transition flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              log.type === 'defect_alert'
                                ? 'bg-red-100 text-red-800'
                                : log.type === 'approval_status'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-orange-100 text-[#F37021]'
                            }`}
                          >
                            {log.type}
                          </span>
                          <span className="font-bold text-slate-800 text-xs">
                            {log.subject}
                          </span>
                        </div>
                        <div className="text-slate-500 text-[11px] flex items-center gap-3">
                          <span>{language === 'en' ? 'To:' : 'ถึง:'} <strong>{log.recipient_email}</strong></span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(log.sent_at).toLocaleString(language === 'en' ? 'en-US' : 'th-TH')}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{log.status}</span>
                        </span>
                        <button
                          onClick={() => setPreviewEmail(log)}
                          className="p-1 rounded hover:bg-slate-200 text-slate-600"
                          title={t.viewEmail}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Email Preview Modal */}
        {previewEmail && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between border-b pb-3 mb-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{previewEmail.subject}</h4>
                  <div className="text-xs text-slate-500">{language === 'en' ? 'To:' : 'ถึง:'} {previewEmail.recipient_email}</div>
                </div>
                <button onClick={() => setPreviewEmail(null)} className="p-1 rounded text-slate-400 hover:text-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div
                className="overflow-y-auto flex-1 p-3 bg-slate-50 rounded-xl border border-slate-200"
                dangerouslySetInnerHTML={{ __html: previewEmail.body }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
