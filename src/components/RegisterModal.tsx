import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, X, AlertCircle, CheckCircle2, Shield, Building2, Phone, Mail, Briefcase, MapPin, Lock } from 'lucide-react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
}) => {
  const { register, t, language } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    department: 'MOLD',
    position: '',
    role: 'layer1',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (formData.password !== formData.confirmPassword) {
      setError(language === 'en' ? 'Password and confirm password do not match' : 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    if (formData.password.length < 6) {
      setError(language === 'en' ? 'Password must be at least 6 characters' : 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setLoading(true);

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        department: formData.department,
        position: formData.position,
        role: formData.role,
        password: formData.password,
      });

      setSuccess(
        language === 'en'
          ? 'Registration submitted! Your request has been sent for admin approval.'
          : 'ลงทะเบียนสำเร็จ! ระบบได้บันทึกข้อมูลและส่งแจ้งเตือนไปยังผู้ดูแลระบบเพื่อทำการอนุมัติสิทธิ์การใช้งานแล้ว'
      );
    } catch (err: any) {
      setError(err.message || (language === 'en' ? 'Registration failed' : 'การลงทะเบียนไม่สำเร็จ'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full my-8 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-sky-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{t.register}</h2>
              <p className="text-xs text-sky-200">{t.registerSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="leading-snug">{error}</div>
            </div>
          )}

          {success ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                {language === 'en' ? 'Registration Successful!' : 'ลงทะเบียนสำเร็จ!'}
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                {success}
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-sm transition shadow"
                >
                  {t.backToLogin}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.firstName} *
                  </label>
                  <input
                    type="text"
                    required
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder={language === 'en' ? 'e.g. Somchai' : 'เช่น สมศักดิ์'}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.lastName} *
                  </label>
                  <input
                    type="text"
                    required
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder={language === 'en' ? 'e.g. Jaidee' : 'เช่น มั่นคง'}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Username (for login)' : 'ชื่อผู้ใช้งาน (Username)'} *
                </label>
                <div className="relative">
                  <span className="w-4 h-4 text-slate-400 font-bold absolute left-3.5 top-2">@</span>
                  <input
                    type="text"
                    required
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder={language === 'en' ? 'e.g. somchai.m' : 'เช่น somchai.m หรือ admin'}
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.department} *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition font-medium"
                    >
                      <option value="MOLD">{language === 'en' ? 'Molding / MM' : 'Molding / MM (แผนกฉีด)'}</option>
                      <option value="FACILITY">{language === 'en' ? 'Facility' : 'Facility (สาธารณูปโภค)'}</option>
                      <option value="ASSY">{language === 'en' ? 'Assembly' : 'Assembly (แผนกประกอบ)'}</option>
                      <option value="WH">{language === 'en' ? 'Warehouse' : 'Warehouse (คลังสินค้า)'}</option>
                      <option value="QC">{language === 'en' ? 'QC (Quality Control)' : 'QC (ควบคุมคุณภาพ)'}</option>
                      <option value="STAMPING">{language === 'en' ? 'Stamping' : 'Stamping (ปั๊มขึ้นรูป)'}</option>
                      <option value="TOOL">{language === 'en' ? 'Tooling' : 'Tooling (แม่พิมพ์/เครื่องมือ)'}</option>
                      <option value="SAFETY">{language === 'en' ? 'Safety / EHS' : 'Safety / EHS (ความปลอดภัย)'}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.position} *
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      placeholder={language === 'en' ? 'e.g. Safety Officer, Supervisor' : 'เช่น Safety Officer, Supervisor'}
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.systemRole}
                </label>
                <div className="relative">
                  <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition font-medium"
                  >
                    <option value="layer1">1. {t.roleLayer1}</option>
                    <option value="layer2">2. {t.roleLayer2}</option>
                    <option value="layer3">3. {t.roleLayer3}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.regPasswordMin}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.confirmPassword} *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  {t.regPendingNote}
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl shadow-md shadow-sky-600/20 text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
              >
                {loading ? t.submitting : t.register}
              </button>

              <div className="text-center text-xs text-slate-600 pt-2">
                {t.alreadyHaveAccount}{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-sky-600 hover:text-sky-700 font-bold underline transition ml-1"
                >
                  {t.login}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
