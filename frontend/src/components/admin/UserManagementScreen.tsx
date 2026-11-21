import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  KeyRound,
  Shield,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  Edit2,
  Lock,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  X,
  Check,
} from 'lucide-react';
import clsx from 'clsx';
import { User, Role } from '../../types/auth';
import { authService } from '../../services/auth.service';

interface UserManagementScreenProps {
  onToast: (msg: string) => void;
}

export const UserManagementScreen: React.FC<UserManagementScreenProps> = ({ onToast }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resettingUser, setResettingUser] = useState<User | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    phone: '',
    password: '',
    roleId: '',
  });

  const [editFormData, setEditFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    roleId: '',
  });

  const [newPassword, setNewPassword] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [uList, rList] = await Promise.all([authService.getUsers(), authService.getRoles()]);
      setUsers(uList);
      setRoles(rList);
    } catch (err: any) {
      onToast(err.message || 'Failed to load operators list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    try {
      await authService.createUser(formData);
      onToast(`Operator account '@${formData.username}' created successfully!`);
      setIsCreateOpen(false);
      setFormData({
        username: '',
        email: '',
        fullName: '',
        phone: '',
        password: '',
        roleId: '',
      });
      fetchData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create operator');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setModalError(null);
    try {
      await authService.updateUser(editingUser.id, editFormData);
      onToast(`Operator account '@${editingUser.username}' updated successfully!`);
      setEditingUser(null);
      fetchData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to update operator');
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const res = await authService.toggleUserStatus(user.id);
      onToast(
        `Operator '@${user.username}' ${res.isActive ? 'activated' : 'deactivated'} successfully`
      );
      fetchData();
    } catch (err: any) {
      onToast(err.message || 'Failed to toggle operator status');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;
    setModalError(null);
    try {
      await authService.resetPassword(resettingUser.id, newPassword);
      onToast(`Password for '@${resettingUser.username}' reset successfully!`);
      setResettingUser(null);
      setNewPassword('');
    } catch (err: any) {
      setModalError(err.message || 'Failed to reset password');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery));
    const matchesRole = !roleFilter || u.roleName === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-[#087A55] rounded-xl font-bold">
              <Shield className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-[#172B25]">Operator & User Management</h2>
          </div>
          <p className="text-xs text-[#718078] mt-1">
            RBAC authority matrix, operator credentials, role bindings & status toggles
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="p-2.5 bg-white border border-[#E4EAE5] text-[#172B25] hover:bg-[#F5F7F5] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={clsx('w-4 h-4 text-[#087A55]', isLoading && 'animate-spin')} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => {
              setModalError(null);
              setIsCreateOpen(true);
            }}
            className="px-4 py-2.5 bg-[#087A55] hover:bg-[#064E3B] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Operator</span>
          </button>
        </div>
      </div>

      {/* Role Summary Badges */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {roles.map((r) => {
          const count = users.filter((u) => u.roleName === r.name).length;
          return (
            <div
              key={r.id}
              onClick={() => setRoleFilter(roleFilter === r.name ? '' : r.name)}
              className={clsx(
                'p-3.5 rounded-2xl border transition-all cursor-pointer',
                roleFilter === r.name
                  ? 'bg-[#087A55] text-white border-[#087A55] shadow-xs'
                  : 'bg-white border-[#E4EAE5] hover:border-emerald-300'
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={clsx(
                    'text-[10px] font-bold uppercase tracking-wider',
                    roleFilter === r.name ? 'text-emerald-100' : 'text-[#718078]'
                  )}
                >
                  {r.name}
                </span>
                <span
                  className={clsx(
                    'text-xs px-2 py-0.5 rounded-full font-bold',
                    roleFilter === r.name
                      ? 'bg-white text-[#087A55]'
                      : 'bg-[#E8F5E9] text-[#087A55]'
                  )}
                >
                  {count}
                </span>
              </div>
              <p
                className={clsx(
                  'text-xs font-bold mt-1 truncate',
                  roleFilter === r.name ? 'text-white' : 'text-[#172B25]'
                )}
              >
                {r.description.split(':')[0]}
              </p>
              <p
                className={clsx(
                  'text-[10px] mt-0.5',
                  roleFilter === r.name ? 'text-emerald-100' : 'text-[#718078]'
                )}
              >
                {r.permissions.length} Permissions
              </p>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-[#E4EAE5] flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[#718078] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, username, email, phone..."
            className="w-full text-xs pl-9 pr-4 py-2.5 bg-[#F5F7F5] border border-[#E4EAE5] rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#087A55]/30"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs font-semibold text-[#172B25] bg-[#F5F7F5] border border-[#E4EAE5] rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-[#087A55]/30 cursor-pointer"
          >
            <option value="">All Roles (No Filter)</option>
            {roles.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
          {roleFilter && (
            <button
              onClick={() => setRoleFilter('')}
              className="text-xs font-bold text-red-600 hover:text-red-700 px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Operators Table */}
      <div className="bg-white rounded-2xl border border-[#E4EAE5] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F7F5] border-b border-[#E4EAE5] text-[#718078] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Operator</th>
                <th className="px-4 py-3.5">Role & Access</th>
                <th className="px-4 py-3.5">Contact Details</th>
                <th className="px-4 py-3.5">Permissions</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4EAE5]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[#718078]">
                    No operators match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  return (
                    <tr key={u.id} className="hover:bg-[#F5F7F5]/50 transition-colors">
                      {/* Operator Details */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#087A55] text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {u.fullName
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#172B25] text-sm">{u.fullName}</p>
                            <p className="text-[11px] text-[#718078]">@{u.username}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role & Access */}
                      <td className="px-4 py-4">
                        <span
                          className={clsx(
                            'text-[10px] px-2.5 py-1 rounded-full font-bold border inline-block',
                            u.roleName === 'ADMIN' || u.roleName === 'SUPER_ADMIN'
                              ? 'bg-emerald-100 text-[#087A55] border-emerald-300'
                              : u.roleName === 'ACCOUNTANT'
                              ? 'bg-blue-100 text-blue-700 border-blue-300'
                              : u.roleName === 'STOCK_MANAGER'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : u.roleName === 'SALES_OPERATOR'
                              ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          )}
                        >
                          {u.roleName}
                        </span>
                      </td>

                      {/* Contact Details */}
                      <td className="px-4 py-4 text-[#172B25]">
                        <p className="flex items-center gap-1.5 text-[11px]">
                          <Mail className="w-3.5 h-3.5 text-[#718078]" /> {u.email}
                        </p>
                        <p className="flex items-center gap-1.5 text-[11px] text-[#718078] mt-0.5">
                          <Phone className="w-3.5 h-3.5" /> {u.phone || 'No phone recorded'}
                        </p>
                      </td>

                      {/* Permissions */}
                      <td className="px-4 py-4">
                        <span className="font-mono text-xs font-bold text-[#087A55] bg-[#E8F5E9] px-2 py-0.5 rounded border border-[#A7F3D0]">
                          {u.permissions?.length || 0} Grated
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span
                          className={clsx(
                            'text-[11px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1',
                            u.isActive
                              ? 'bg-emerald-50 text-[#16A36A] border border-emerald-200'
                              : 'bg-red-50 text-red-600 border border-red-200'
                          )}
                        >
                          {u.isActive ? (
                            <>
                              <CheckCircle className="w-3 h-3" /> Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" /> Inactive
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="Edit Operator Profile"
                            onClick={() => {
                              setEditingUser(u);
                              setEditFormData({
                                fullName: u.fullName,
                                email: u.email,
                                phone: u.phone || '',
                                roleId: u.roleId,
                              });
                              setModalError(null);
                            }}
                            className="p-1.5 text-[#718078] hover:text-[#087A55] hover:bg-[#F5F7F5] rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            title="Reset Password"
                            onClick={() => {
                              setResettingUser(u);
                              setNewPassword('');
                              setModalError(null);
                            }}
                            className="p-1.5 text-[#718078] hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            title={u.isActive ? 'Deactivate Operator' : 'Activate Operator'}
                            onClick={() => handleToggleStatus(u)}
                            className={clsx(
                              'p-1.5 rounded-lg transition-colors cursor-pointer',
                              u.isActive
                                ? 'text-red-500 hover:bg-red-50 hover:text-red-700'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            )}
                          >
                            {u.isActive ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
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

      {/* CREATE OPERATOR MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-[#E4EAE5]">
            <div className="bg-[#087A55] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Register New Operator</h3>
                  <p className="text-xs text-emerald-100">Create login credentials and bind role</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#172B25] uppercase tracking-wider mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. mandi_clerk"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F5F7F5] border border-[#E4EAE5] rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#087A55]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#172B25] uppercase tracking-wider mb-1">
                    Assigned Role
                  </label>
                  <select
                    required
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F5F7F5] border border-[#E4EAE5] rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#087A55]/30 font-semibold"
                  >
                    <option value="">Select a Role...</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.description.split(':')[0]})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172B25] uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Chaudhry Aslam Gondal"
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F5F7F5] border border-[#E4EAE5] rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#087A55]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#172B25] uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="clerk@alarabricetraders.com"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F5F7F5] border border-[#E4EAE5] rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#087A55]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#172B25] uppercase tracking-wider mb-1">
                    Mobile Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+92-300-1234567"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F5F7F5] border border-[#E4EAE5] rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#087A55]/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172B25] uppercase tracking-wider mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="At least 6 characters"
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F5F7F5] border border-[#E4EAE5] rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#087A55]/30"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#E4EAE5]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#718078] hover:bg-[#F5F7F5] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#087A55] hover:bg-[#064E3B] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Save Operator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT OPERATOR MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-[#E4EAE5]">
            <div className="bg-[#087A55] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Edit Operator: @{editingUser.username}</h3>
                  <p className="text-xs text-emerald-100">Update operator profile details and assigned role</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#172B25] uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F5F7F5] border border-[#E4EAE5] rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#087A55]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172B25] uppercase tracking-wider mb-1">
                  Assigned Role
                </label>
                <select
                  required
                  value={editFormData.roleId}
                  onChange={(e) => setEditFormData({ ...editFormData, roleId: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F5F7F5] border border-[#E4EAE5] rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#087A55]/30 font-semibold"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.description.split(':')[0]})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#172B25] uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F5F7F5] border border-[#E4EAE5] rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#087A55]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#172B25] uppercase tracking-wider mb-1">
                    Mobile Phone
                  </label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F5F7F5] border border-[#E4EAE5] rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#087A55]/30"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#E4EAE5]">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-bold text-[#718078] hover:bg-[#F5F7F5] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#087A55] hover:bg-[#064E3B] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[#E4EAE5]">
            <div className="bg-amber-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Reset Password: @{resettingUser.username}</h3>
                  <p className="text-xs text-amber-100">Set a new password for this operator</p>
                </div>
              </div>
              <button
                onClick={() => setResettingUser(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#172B25] uppercase tracking-wider mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F5F7F5] border border-[#E4EAE5] rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#E4EAE5]">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-4 py-2 text-xs font-bold text-[#718078] hover:bg-[#F5F7F5] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
