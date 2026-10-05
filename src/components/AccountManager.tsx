import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, normalizeImageUrl } from '../services/api';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Trash2, 
  Shield, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  RefreshCw,
  KeyRound
} from 'lucide-react';

export const AccountManager: React.FC = () => {
  const { user, language, t } = useAuth();
  const [usersList, setUsersList] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Edit Role Modal State
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [newRole, setNewRole] = useState('');
  const [newDept, setNewDept] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedDept !== 'all') params.department = selectedDept;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const data = await api.getUsers(params);
      setUsersList(data.users || []);
      if (data.counts) {
        setStats(data.counts);
      }
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [selectedStatus, selectedDept]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  const handleApprove = async (id: number, name: string) => {
    const confirmMsg = language === 'th'
      ? `คุณต้องการอนุมัติการสมัครสมาชิกของ ${name} ใช่หรือไม่? ระบบจะส่งอีเมลแจ้งเตือนไปยังผู้ใช้ทันที`
      : `Are you sure you want to approve registration for ${name}? An email alert will be sent immediately.`;
    if (!confirm(confirmMsg)) return;

    try {
      await api.approveUser(id);
      const successMsg = language === 'th'
        ? `อนุมัติการสมัครของ ${name} สำเร็จและส่งอีเมลแจ้งเตือนเรียบร้อยแล้ว`
        : `Approved registration for ${name} successfully and email sent.`;
      setActionMessage({ text: successMsg, type: 'success' });
      loadUsers();
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Approve failed', type: 'error' });
    }
  };

  const handleReject = async (id: number, name: string) => {
    const confirmMsg = language === 'th'
      ? `คุณต้องการปฏิเสธการสมัครสมาชิกของ ${name} ใช่หรือไม่?`
      : `Are you sure you want to reject registration for ${name}?`;
    if (!confirm(confirmMsg)) return;

    try {
      await api.rejectUser(id);
      const successMsg = language === 'th'
        ? `ปฏิเสธการสมัครของ ${name} เรียบร้อยแล้ว`
        : `Rejected registration for ${name}.`;
      setActionMessage({ text: successMsg, type: 'success' });
      loadUsers();
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Reject failed', type: 'error' });
    }
  };

  const handleDelete = async (id: number, name: string) => {
    const confirmMsg = language === 'th'
      ? `คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลสมาชิก ${name} ออกจากระบบ? การกระทำนี้ไม่สามารถย้อนกลับได้`
      : `Are you sure you want to permanently delete user ${name}? This action cannot be undone.`;
    if (!confirm(confirmMsg)) return;

    try {
      await api.deleteUser(id);
      const successMsg = language === 'th'
        ? `ลบสมาชิก ${name} ออกจากระบบแล้ว`
        : `User ${name} has been deleted.`;
      setActionMessage({ text: successMsg, type: 'success' });
      loadUsers();
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Delete failed', type: 'error' });
    }
  };

  const handleSaveRole = async () => {
    if (!editingUser) return;
    try {
      await api.updateUserRole(editingUser.id, {
        role: newRole,
        department: newDept,
      });
      setActionMessage({ text: t.saveRoleSuccess, type: 'success' });
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Update role failed', type: 'error' });
    }
  };

  const handleResetPassword = async (targetUser: any) => {
    const confirmMsg = language === 'th'
      ? `คุณต้องการรีเซ็ตรหัสผ่านของ ${targetUser.first_name} ${targetUser.last_name} ให้เป็น "123456" ใช่หรือไม่?\n(ผู้ใช้จะสามารถใช้รหัส 123456 เพื่อเข้าสู่ระบบได้ทันที)`
      : `Are you sure you want to reset password for ${targetUser.first_name} ${targetUser.last_name} to "123456"?`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await api.resetUserPassword(targetUser.id);
      const successMsg = language === 'th'
        ? `รีเซ็ตรหัสผ่านของ ${targetUser.first_name} ${targetUser.last_name} เป็น 123456 สำเร็จแล้ว`
        : res.message || 'Password reset to 123456 successfully.';
      setActionMessage({ text: successMsg, type: 'success' });
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Reset password failed', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title & Stats Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-50 border border-orange-200 text-[#F37021]">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{t.accountManagerTitle}</h1>
                <p className="text-xs text-slate-500">{t.accountManagerSubtitle}</p>
              </div>
            </div>
          </div>
          <button
            onClick={loadUsers}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition self-start md:self-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t.refresh}</span>
          </button>
        </div>

        {/* Counter cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500 font-medium">{t.totalMembers}</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{stats.total || 0}</div>
          </div>
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="text-xs text-amber-700 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{t.pendingApproval}</span>
            </div>
            <div className="text-2xl font-bold text-amber-800 mt-1">{stats.pending || 0}</div>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="text-xs text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{t.approvedMembers}</span>
            </div>
            <div className="text-2xl font-bold text-emerald-800 mt-1">{stats.approved || 0}</div>
          </div>
          <div className="p-4 rounded-xl bg-red-50 border border-red-200">
            <div className="text-xs text-red-700 font-medium flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              <span>{t.rejectedMembers}</span>
            </div>
            <div className="text-2xl font-bold text-red-800 mt-1">{stats.rejected || 0}</div>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-xs underline font-semibold ml-4">
            {t.close}
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:flex-1 sm:min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder={t.searchMember}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#F37021] focus:bg-white"
          />
        </form>

        {/* Status & Dept Filters in a 2-col grid on mobile, flex on sm */}
        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center sm:gap-2">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#F37021]"
          >
            <option value="all">{t.allStatus}</option>
            <option value="pending">{t.statusPending}</option>
            <option value="approved">{t.statusApproved}</option>
            <option value="rejected">{t.statusRejected}</option>
          </select>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#F37021]"
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
        </div>
      </div>

      {/* Users Container: Mobile Cards (< md) + Desktop Table (>= md) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* 1. Mobile Cards View (< md) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              {t.loading}
            </div>
          ) : usersList.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              {t.noDataFound}
            </div>
          ) : (
            usersList.map((u) => {
              const isCurrentUser = u.id === user?.id;
              return (
                <div key={u.id} className="p-4 space-y-2.5 hover:bg-slate-50/70 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#F37021] to-[#DE5F14] text-white font-bold text-xs flex items-center justify-center shadow-sm overflow-hidden shrink-0 border border-slate-200">
                        {u.avatar_url ? (
                          <img src={normalizeImageUrl(u.avatar_url)} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          u.first_name?.charAt(0) || 'U'
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
                          <span>{u.first_name} {u.last_name}</span>
                          {isCurrentUser && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-[#F37021] font-semibold">
                              {t.you}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#F37021] font-bold">
                          @{u.username || u.email?.split('@')[0]}
                        </div>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="shrink-0">
                      {u.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                          <Clock className="w-3 h-3" />
                          <span>{language === 'th' ? 'รออนุมัติ' : 'Pending'}</span>
                        </span>
                      )}
                      {u.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" />
                          <span>{language === 'th' ? 'อนุมัติแล้ว' : 'Approved'}</span>
                        </span>
                      )}
                      {u.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                          <XCircle className="w-3 h-3" />
                          <span>{language === 'th' ? 'ปฏิเสธ' : 'Rejected'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-1 gap-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-[#F37021]" />
                        <span>{u.department}</span>
                      </span>
                      {u.position && (
                        <span className="text-slate-400 text-[11px]">• {u.position}</span>
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'superadmin'
                          ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-xs border border-purple-400'
                          : u.role === 'admin'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : u.role === 'layer3' || u.role === 'manager'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : u.role === 'layer2' || u.role === 'supervisor'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      <Shield className="w-3 h-3" />
                      <span>
                        {u.role === 'superadmin'
                          ? '👑 Super Admin'
                          : u.role === 'admin'
                          ? 'Admin'
                          : u.role === 'layer3' || u.role === 'manager'
                          ? 'Layer 3'
                          : u.role === 'layer2' || u.role === 'supervisor'
                          ? 'Layer 2'
                          : 'Layer 1'}
                      </span>
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    {u.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(u.id, `${u.first_name} ${u.last_name}`)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition flex items-center gap-1"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{t.approve}</span>
                        </button>
                        <button
                          onClick={() => handleReject(u.id, `${u.first_name} ${u.last_name}`)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition flex items-center gap-1"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>{t.reject}</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => {
                        setEditingUser(u);
                        setNewRole(u.role);
                        setNewDept(u.department);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center gap-1"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>{language === 'th' ? 'แก้ไขสิทธิ์' : 'Edit Role'}</span>
                    </button>

                    <button
                      onClick={() => handleResetPassword(u)}
                      className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition flex items-center gap-1"
                      title={language === 'th' ? 'รีเซ็ตรหัสผ่านเป็น 123456' : 'Reset password to 123456'}
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>{language === 'th' ? 'รีเซ็ตรหัส' : 'Reset Pass'}</span>
                    </button>

                    {!isCurrentUser && (
                      <button
                        onClick={() => handleDelete(u.id, `${u.first_name} ${u.last_name}`)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition"
                        title={t.deleteUser}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 2. Desktop Table View (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1E2229] text-white font-semibold border-b border-[#2A2F3A]">
                <th className="py-3.5 px-4">{t.nameSurname}</th>
                <th className="py-3.5 px-4">{language === 'th' ? 'ชื่อผู้ใช้งาน (Username)' : 'Username'}</th>
                <th className="py-3.5 px-4">{t.deptAndPosition}</th>
                <th className="py-3.5 px-4">{t.systemRole}</th>
                <th className="py-3.5 px-4">{t.accountStatus}</th>
                <th className="py-3.5 px-4 text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    {t.loading}
                  </td>
                </tr>
              ) : usersList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    {t.noDataFound}
                  </td>
                </tr>
              ) : (
                usersList.map((u) => {
                  const isCurrentUser = u.id === user?.id;
                  const dateFormatted = u.created_at
                    ? new Date(u.created_at).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US')
                    : '-';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#F37021] to-[#DE5F14] text-white font-bold text-xs flex items-center justify-center shadow-sm overflow-hidden shrink-0 border border-slate-200">
                            {u.avatar_url ? (
                              <img src={normalizeImageUrl(u.avatar_url)} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              u.first_name?.charAt(0) || 'U'
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              <span>{u.first_name} {u.last_name}</span>
                              {u.username && (
                                <span className="text-[11px] font-semibold text-[#F37021] bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                                  @{u.username}
                                </span>
                              )}
                              {isCurrentUser && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-[#F37021] font-semibold">
                                  {t.you}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {t.registeredDate} {dateFormatted}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                          <span className="text-[#F37021]">@</span>
                          <span>{u.username || u.email?.split('@')[0]}</span>
                        </div>
                      </td>

                      {/* Department & Position */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#F37021]" />
                          <span>{u.department}</span>
                        </div>
                        <div className="text-slate-500 text-[11px]">{u.position}</div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            u.role === 'superadmin'
                              ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-xs border border-purple-400'
                              : u.role === 'admin'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : u.role === 'layer3' || u.role === 'manager'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : u.role === 'layer2' || u.role === 'supervisor'
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          <span>
                            {u.role === 'superadmin'
                              ? (language === 'th' ? '👑 ผู้ดูแลระบบสูงสุด (Super Admin)' : '👑 Super Admin')
                              : u.role === 'admin'
                              ? (language === 'th' ? 'ผู้ดูแลระบบ (Admin)' : 'Admin')
                              : u.role === 'layer3' || u.role === 'manager'
                              ? (language === 'th' ? 'Layer 3 (Manager)' : 'Layer 3 (Manager)')
                              : u.role === 'layer2' || u.role === 'supervisor'
                              ? (language === 'th' ? 'Layer 2 (Supervisor)' : 'Layer 2 (Supervisor)')
                              : (language === 'th' ? 'Layer 1 (Leader)' : 'Layer 1 (Leader)')}
                          </span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {u.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                            <Clock className="w-3 h-3" />
                            <span>{language === 'th' ? 'รออนุมัติ' : 'Pending'}</span>
                          </span>
                        )}
                        {u.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle className="w-3 h-3" />
                            <span>{language === 'th' ? 'อนุมัติแล้ว' : 'Approved'}</span>
                          </span>
                        )}
                        {u.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                            <XCircle className="w-3 h-3" />
                            <span>{language === 'th' ? 'ปฏิเสธ' : 'Rejected'}</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {u.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(u.id, `${u.first_name} ${u.last_name}`)}
                                className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
                                title={t.approve}
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(u.id, `${u.first_name} ${u.last_name}`)}
                                className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition"
                                title={t.reject}
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setNewRole(u.role);
                              setNewDept(u.department);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            title={t.editRoleAndDept}
                          >
                            <Shield className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleResetPassword(u)}
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition"
                            title={language === 'th' ? 'รีเซ็ตรหัสผ่านเป็น 123456' : 'Reset password to 123456'}
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {!isCurrentUser && (
                            <button
                              onClick={() => handleDelete(u.id, `${u.first_name} ${u.last_name}`)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition"
                              title={t.deleteUser}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {t.editRoleAndDept}: {editingUser.first_name} {editingUser.last_name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">{editingUser.email}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.systemRole}
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#F37021]"
                >
                  <option value="layer1">1. {t.roleLayer1}</option>
                  <option value="layer2">2. {t.roleLayer2}</option>
                  <option value="layer3">3. {t.roleLayer3}</option>
                  <option value="admin">{t.roleAdmin}</option>
                  <option value="superadmin">👑 {t.roleSuperAdmin}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.department}
                </label>
                <select
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#F37021]"
                >
                  <option value="MOLD">Molding / MM</option>
                  <option value="FACILITY">Facility</option>
                  <option value="ASSY">Assembly</option>
                  <option value="WH">Warehouse</option>
                  <option value="QC">QC</option>
                  <option value="STAMPING">Stamping</option>
                  <option value="TOOL">Tooling</option>
                  <option value="SAFETY">{language === 'en' ? 'Safety / EHS' : 'Safety / EHS (ความปลอดภัย)'}</option>
                </select>
              </div>

              {/* Reset Password to 123456 */}
              <div className="pt-2 pb-1 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-amber-50/90 border border-amber-200/90 rounded-xl">
                  <div>
                    <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                      <span>{language === 'th' ? 'รีเซ็ตรหัสผ่าน (เป็น 123456)' : 'Reset Password (to 123456)'}</span>
                    </div>
                    <div className="text-[11px] text-amber-700 mt-0.5">
                      {language === 'th' 
                        ? 'กรณีผู้ใช้ลืมรหัสผ่าน สามารถกดรีเซ็ตให้เป็น 123456 ได้ทันที' 
                        : 'Reset password directly to "123456" in case user forgot.'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleResetPassword(editingUser)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-sm shrink-0 flex items-center justify-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{language === 'th' ? 'รีเซ็ตเป็น 123456' : 'Reset to 123456'}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleSaveRole}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F37021] hover:bg-[#DE5F14] text-white transition shadow"
                >
                  {t.saveChanges}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
