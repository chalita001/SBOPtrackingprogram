import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Bell, 
  X, 
  RefreshCw, 
  Check, 
  AlertTriangle, 
  Send, 
  ExternalLink, 
  CheckCheck,
  Building2,
  User as UserIcon
} from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
}) => {
  const { user, language, t } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Send Alert state (for admin)
  const [showSendForm, setShowSendForm] = useState(false);
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [alertType, setAlertType] = useState<'info' | 'alert' | 'success'>('alert');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);

      if (user?.role === 'admin') {
        const uData = await api.getUsers({ status: 'approved' });
        setUsersList(uData.users || []);
      }
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      setShowSendForm(false);
      setSendSuccess(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setSending(true);
    setSendSuccess(null);
    try {
      await api.sendNotification({
        userId: targetUserId ? parseInt(targetUserId, 10) : undefined,
        title: title.trim(),
        message: message.trim(),
        type: alertType,
      });

      setSendSuccess(language === 'en' ? 'In-app notification sent!' : 'ส่งการแจ้งเตือนสำเร็จแล้ว!');
      setTitle('');
      setMessage('');
      setTargetUserId('');
      setShowSendForm(false);
      loadNotifications();
    } catch (err: any) {
      alert((language === 'en' ? 'Failed to send: ' : 'ส่งไม่สำเร็จ: ') + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-sky-950 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">
                  {language === 'en' ? 'In-App Notifications' : 'ระบบการแจ้งเตือน'}
                </h2>
                {unreadCount > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-black bg-red-500 text-white">
                    {unreadCount} {language === 'en' ? 'new' : 'ใหม่'}
                  </span>
                )}
              </div>
              <p className="text-xs text-sky-200">
                {language === 'en' ? 'Notifications and alerts for your account' : 'ข้อความแจ้งเตือนเฉพาะผู้ใช้งานและการตรวจพบสิ่งผิดปกติ'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadNotifications}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title={language === 'en' ? 'Refresh' : 'รีเฟรช'}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs font-semibold text-slate-600">
            {language === 'th' ? `ทั้งหมด ${notifications.length} รายการ` : `Total ${notifications.length} notifications`}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-bold text-sky-700 hover:text-sky-800 bg-sky-100/70 hover:bg-sky-100 px-3 py-1 rounded-lg transition flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Mark All Read' : 'อ่านทั้งหมดแล้ว'}</span>
              </button>
            )}

            {user?.role === 'admin' && (
              <button
                type="button"
                onClick={() => setShowSendForm(!showSendForm)}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-100/70 hover:bg-indigo-100 px-3 py-1 rounded-lg transition flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{showSendForm ? (language === 'en' ? 'Close Form' : 'ปิดฟอร์ม') : (language === 'en' ? '+ Send Alert' : '+ ส่งการแจ้งเตือน')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Send Alert Form (Admin only) */}
        {showSendForm && user?.role === 'admin' && (
          <form onSubmit={handleSendNotification} className="p-4 bg-indigo-50/60 border-b border-indigo-100 space-y-3 shrink-0 animate-fadeIn">
            <div className="font-bold text-xs text-indigo-900 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-indigo-600" />
              <span>{language === 'en' ? 'Send In-App Notification to User' : 'ส่งการแจ้งเตือนไปยังผู้ใช้งาน'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Department' : 'แผนก'}
                </label>
                <select
                  value={deptFilter}
                  onChange={(e) => {
                    const newDept = e.target.value;
                    setDeptFilter(newDept);
                    setTargetUserId('');
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
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

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Recipient User' : 'ผู้รับการแจ้งเตือน'}
                </label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="">{language === 'en' ? 'Broadcast to All Users' : 'แจ้งเตือนทุกคน (Broadcast)'}</option>
                  {usersList
                    .filter((u) => deptFilter === 'all' || u.department === deptFilter)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.first_name} {u.last_name} (@{u.username || u.email}) — แผนก {u.department}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Alert Type' : 'ประเภทการเตือน'}
                </label>
                <select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="alert">⚠️ {language === 'en' ? 'Safety Alert (Red)' : 'เตือนความปลอดภัย (สีแดง)'}</option>
                  <option value="info">ℹ️ {language === 'en' ? 'General Info (Blue)' : 'ข้อมูลทั่วไป (สีฟ้า)'}</option>
                  <option value="success">✅ {language === 'en' ? 'Success (Green)' : 'ความสำเร็จ (สีเขียว)'}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                {language === 'en' ? 'Title' : 'หัวข้อเรื่อง'} *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={language === 'en' ? 'e.g. Action required for Safety defect' : 'เช่น แจ้งเตือนข้อบกพร่องด้านความปลอดภัย'}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                {language === 'en' ? 'Message' : 'ข้อความแจ้งเตือน'} *
              </label>
              <textarea
                required
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={language === 'en' ? 'Enter detailed message...' : 'พิมพ์ข้อความแจ้งเตือน...'}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowSendForm(false)}
                className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={sending}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
              >
                {sending ? (language === 'en' ? 'Sending...' : 'กำลังส่ง...') : (language === 'en' ? 'Send Alert' : 'ส่งแจ้งเตือน')}
              </button>
            </div>
          </form>
        )}

        {sendSuccess && (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold border-b border-emerald-200 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{sendSuccess}</span>
          </div>
        )}

        {/* Notifications List */}
        <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">
              <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <span>{t.loading}</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-600">
                {language === 'en' ? 'No notifications yet' : 'ยังไม่มีการแจ้งเตือน'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {language === 'en' ? 'Safety alerts and approval notices will appear here' : 'การแจ้งเตือนสิ่งผิดปกติและการอนุมัติจะแสดงที่นี่'}
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isUnread = notif.is_read === 0;
              const dateStr = notif.created_at
                ? new Date(notif.created_at).toLocaleString(language === 'th' ? 'th-TH' : 'en-US')
                : '';

              return (
                <div
                  key={notif.id}
                  onClick={() => isUnread && handleMarkAsRead(notif.id)}
                  className={`p-4 transition flex items-start gap-3.5 cursor-pointer ${
                    isUnread ? 'bg-sky-50/50 hover:bg-sky-50' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      notif.type === 'alert'
                        ? 'bg-red-100 text-red-700'
                        : notif.type === 'success'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-sky-100 text-sky-700'
                    }`}
                  >
                    {notif.type === 'alert' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : notif.type === 'success' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 leading-snug">
                          {notif.title}
                        </span>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0"></span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{dateStr}</span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>

                    {notif.link && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                            if (onNavigateToTab) {
                              if (notif.link.includes('defects')) onNavigateToTab('defects');
                              else onNavigateToTab('checklist');
                            }
                          }}
                          className="text-[11px] font-semibold text-sky-600 hover:underline inline-flex items-center gap-1"
                        >
                          <span>{language === 'en' ? 'Open link' : 'ดูรายละเอียด'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
