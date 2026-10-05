import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, normalizeImageUrl } from '../services/api';
import { User, X, Shield, Phone, Mail, Building2, Briefcase, MapPin, KeyRound, CheckCircle2, AlertCircle, Camera, Upload, Loader2 } from 'lucide-react';

interface AccountInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountInfoModal: React.FC<AccountInfoModalProps> = ({ isOpen, onClose }) => {
  const { user, reloadUser, t, language } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Profile Edit State
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [position, setPosition] = useState(user?.position || '');
  const [department, setDepartment] = useState(user?.department || 'MOLD');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !user) return null;

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ text: language === 'en' ? 'File too large. Maximum size is 10MB.' : 'ไฟล์ภาพมีขนาดใหญ่เกินไป (จำกัดไม่เกิน 10MB)', type: 'error' });
      return;
    }

    setUploadingAvatar(true);
    setMessage(null);

    try {
      const res = await api.uploadImage(file);
      setAvatarUrl(res.imageUrl);
      setMessage({
        text: language === 'en' 
          ? 'Profile photo uploaded to Cloudflare R2! Click "Save Changes" to apply.' 
          : 'อัปโหลดรูปภาพไปยัง Cloudflare R2 แล้ว! กรุณากด "บันทึกการเปลี่ยนแปลง"',
        type: 'success'
      });
    } catch (err: any) {
      setMessage({
        text: (language === 'en' ? 'Photo upload failed: ' : 'อัปโหลดรูปภาพไม่สำเร็จ: ') + err.message,
        type: 'error'
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await api.updateProfile({
        firstName,
        lastName,
        position,
        avatarUrl,
        department: user.role === 'admin' ? department : undefined,
      });
      await reloadUser();
      setMessage({ text: language === 'en' ? 'Profile updated successfully' : 'อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Update failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ text: language === 'en' ? 'New password and confirmation do not match' : 'รหัสผ่านใหม่และการยืนยันไม่ตรงกัน', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ text: language === 'en' ? 'New password must be at least 6 characters' : 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      await api.changePassword({ currentPassword, newPassword });
      setMessage({ text: language === 'en' ? 'Password changed successfully' : 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage({ text: err.message || 'Change password failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-sky-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 text-white font-bold text-xl flex items-center justify-center shadow-lg border border-white/20 overflow-hidden shrink-0">
              {avatarUrl ? (
                <img src={normalizeImageUrl(avatarUrl)} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user.firstName.charAt(0)
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold">{user.firstName} {user.lastName}</h2>
              <div className="flex items-center gap-2 text-xs text-sky-200">
                <span>@{user.username || user.email?.split('@')[0]}</span>
                <span>•</span>
                <span className="font-semibold text-emerald-300">
                  {user.role === 'admin'
                    ? 'Admin'
                    : user.role === 'layer3' || user.role === 'manager'
                    ? 'Layer 3 (Manager)'
                    : user.role === 'layer2' || user.role === 'supervisor'
                    ? 'Layer 2 (Supervisor)'
                    : 'Layer 1 (Leader)'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-200 px-6 pt-3 bg-slate-50">
          <button
            onClick={() => { setActiveTab('profile'); setMessage(null); }}
            className={`pb-3 px-4 text-sm font-semibold transition border-b-2 ${
              activeTab === 'profile'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.userInfoTitle}
          </button>
          <button
            onClick={() => { setActiveTab('security'); setMessage(null); }}
            className={`pb-3 px-4 text-sm font-semibold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>{t.changePassword}</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {message && (
            <div
              className={`mb-4 p-3.5 rounded-xl border text-sm flex items-center gap-2.5 ${
                message.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {activeTab === 'profile' ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {/* Profile Avatar Upload Section */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50/60 border border-sky-200/80 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md border-2 border-white overflow-hidden">
                    {avatarUrl ? (
                      <img src={normalizeImageUrl(avatarUrl)} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      user.firstName?.charAt(0) || 'U'
                    )}
                  </div>
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-slate-900/60 rounded-2xl flex items-center justify-center text-white backdrop-blur-[1px]">
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-md border border-white transition group-hover:scale-110"
                    title={language === 'en' ? 'Upload new photo' : 'อัปโหลดรูปใหม่'}
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileSelect}
                    className="hidden"
                  />
                </div>

                <div className="space-y-1.5 text-center sm:text-left flex-1">
                  <div className="font-bold text-slate-800 text-xs flex items-center justify-center sm:justify-start gap-1.5">
                    <Camera className="w-4 h-4 text-sky-600" />
                    <span>{language === 'en' ? 'Profile Avatar (Cloudflare R2)' : 'รูปภาพประจำตัว (Cloudflare R2)'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {language === 'en' 
                      ? 'Upload a profile picture to appear on audits, defect follow-ups, and the system leaderboard.' 
                      : 'เลือกรูปภาพเพื่อแสดงในบัตรพนักงาน รายการตรวจเช็ค และการติดตามงานแก้ไข'}
                  </p>
                  <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Upload className="w-3 h-3 text-sky-600" />
                      <span>{uploadingAvatar ? t.uploadingAvatar : t.changeAvatar}</span>
                    </button>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl('')}
                        className="px-2 py-1 text-[11px] text-slate-400 hover:text-red-500 transition"
                      >
                        {language === 'en' ? 'Remove Photo' : 'ลบรูปโปรไฟล์'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Status Badge */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-medium">{t.accountStatus}</div>
                  <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="capitalize">{user.status}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 font-medium">{t.systemRole}</div>
                  <span className="inline-block px-2.5 py-0.5 mt-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 uppercase">
                    {user.role}
                  </span>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.firstName}
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.lastName}
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Username & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'en' ? 'Username' : 'ชื่อผู้ใช้งาน (Username)'} ({language === 'en' ? 'Read-only' : 'แก้ไขไม่ได้'})
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user.username ? `@${user.username}` : user.email}
                    className="w-full px-3.5 py-2 bg-slate-100 border border-slate-300 rounded-xl text-sm text-slate-700 font-semibold cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>{t.department}</span>
                    {user.role === 'admin' ? (
                      <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                        👑 {language === 'en' ? 'Admin Editable' : 'แอดมินแก้ไขได้'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        ({language === 'en' ? 'Read-only' : 'ล็อค'})
                      </span>
                    )}
                  </label>
                  {user.role === 'admin' ? (
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3.5 py-2 bg-purple-50/50 border border-purple-300 rounded-xl text-sm text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  ) : (
                    <input
                      type="text"
                      disabled
                      value={user.department}
                      className="w-full px-3.5 py-2 bg-slate-100 border border-slate-300 rounded-xl text-sm text-slate-700 font-semibold cursor-not-allowed"
                    />
                  )}
                </div>
              </div>

              {/* Position */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.position}
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="เช่น Safety Inspector / Line Leader"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-sm transition shadow mt-2 disabled:opacity-50"
              >
                {loading ? (language === 'en' ? 'Saving...' : 'กำลังบันทึก...') : t.saveChanges}
              </button>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.currentPassword}
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.newPassword}
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.confirmPassword}
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-sm transition shadow mt-2 disabled:opacity-50"
              >
                {loading ? (language === 'en' ? 'Changing Password...' : 'กำลังเปลี่ยนรหัสผ่าน...') : t.changePassword}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
