import React, { useEffect, useState } from 'react';
import { Plus, Users, Shield, ChefHat, UserCheck, Check, X, Lock } from 'lucide-react';
import { UserProfile, UserRole } from '../../types/restaurant';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';

export const AdminStaffPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [staffList, setStaffList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<{ email: string; full_name: string; role: UserRole }>({
    email: '',
    full_name: '',
    role: 'kitchen'
  });
  const [formError, setFormError] = useState<string | null>(null);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const data = await api.getStaff();
      setStaffList(data);
    } catch (err) {
      console.error('Failed to load staff list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.email || !formData.full_name) {
      setFormError('Email and full name are required');
      return;
    }

    try {
      await api.createStaff(formData, user?.full_name);
      setIsModalOpen(false);
      setFormData({ email: '', full_name: '', role: 'kitchen' });
      loadStaff();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create staff account');
    }
  };

  const handleToggleActive = async (member: UserProfile) => {
    if (member.id === user?.id) {
      alert('You cannot deactivate your own logged-in account.');
      return;
    }

    try {
      await api.updateStaff(member.id, { is_active: !member.is_active }, user?.full_name);
      setStaffList(prev => prev.map(s => s.id === member.id ? { ...s, is_active: !member.is_active } : s));
    } catch (err: any) {
      alert(err.message || 'Failed to update account status');
    }
  };

  const handleRoleChange = async (member: UserProfile, newRole: UserRole) => {
    if (member.id === user?.id && newRole !== 'admin') {
      alert('You cannot demote your own owner account.');
      return;
    }

    try {
      await api.updateStaff(member.id, { role: newRole }, user?.full_name);
      setStaffList(prev => prev.map(s => s.id === member.id ? { ...s, role: newRole } : s));
    } catch (err: any) {
      alert(err.message || 'Failed to update staff role');
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D8]">
        <div>
          <span className="text-[11px] uppercase font-bold tracking-wider text-[#E05A47] block">
            Access Control & Governance
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#1E1B18]">Staff & Role Permissions</h1>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setFormData({ email: '', full_name: '', role: 'kitchen' });
              setFormError(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#E05A47] hover:bg-[#cf4e3b] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Provision Staff Account</span>
          </button>
        )}
      </div>

      {/* Staff Accounts Table */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#F0EBE1] flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#1E1B18] uppercase tracking-wider">
            Authorized Personnel ({staffList.length})
          </h2>
          <span className="text-[11px] text-[#78716C]">
            RBAC enforced authoritatively on the backend
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-[#78716C]">Loading staff accounts...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#E8E2D8] bg-[#FAF7F2] text-[#78716C] font-semibold">
                  <th className="p-3">Staff Name</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Assigned Role</th>
                  <th className="p-3 text-center">Account Status</th>
                  <th className="p-3 text-right">Privilege Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE1]">
                {staffList.map(member => (
                  <tr key={member.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                    <td className="p-3 font-semibold text-[#1E1B18]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#E05A47]/10 text-[#E05A47] flex items-center justify-center font-bold text-xs uppercase">
                          {member.full_name[0]}
                        </div>
                        <span>{member.full_name}</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-[#78716C]">{member.email}</td>
                    <td className="p-3">
                      <select
                        value={member.role}
                        disabled={!isAdmin || member.id === user?.id}
                        onChange={(e) => handleRoleChange(member, e.target.value as UserRole)}
                        className="px-2.5 py-1 rounded-lg border border-[#E8E2D8] bg-white font-semibold text-[#1E1B18] text-xs focus:outline-none disabled:opacity-60"
                      >
                        <option value="admin">Super Admin (Owner)</option>
                        <option value="manager">Floor Manager</option>
                        <option value="kitchen">Kitchen Staff (KDS)</option>
                      </select>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleToggleActive(member)}
                        disabled={!isAdmin || member.id === user?.id}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all ${
                          member.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        } disabled:opacity-60`}
                      >
                        {member.is_active ? 'Active' : 'Deactivated'}
                      </button>
                    </td>
                    <td className="p-3 text-right text-[11px] text-[#A8A29E]">
                      {member.id === user?.id ? (
                        <span className="font-bold text-[#E05A47]">(Current User)</span>
                      ) : (
                        <span>Verified Account</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Permissions Breakdown Matrix */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-xs font-bold text-[#1E1B18] uppercase tracking-wider flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-[#E05A47]" />
          <span>Role Permissions Matrix</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#E8E2D8] text-[#78716C] font-semibold">
                <th className="py-2">System Capability</th>
                <th className="py-2 text-center">Super Admin</th>
                <th className="py-2 text-center">Floor Manager</th>
                <th className="py-2 text-center">Kitchen Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBE1] text-[#44403C]">
              <tr>
                <td className="py-2.5 font-medium">Access Kitchen Display System (/kitchen)</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium">Update Order Preparation Status</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium">Order Management & Cashier Settlement</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 text-center text-red-500 font-bold">✗</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium">Menu Pricing, Dishes & Category Edits</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 text-center text-red-500 font-bold">✗</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium">Financial Reports & CSV Analytics</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 text-center text-red-500 font-bold">✗</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium">Staff Provisioning & Role Delegation</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 text-center text-red-500 font-bold">✗</td>
                <td className="py-2.5 text-center text-red-500 font-bold">✗</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium">Restaurant Tax, Currency & System Settings</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 text-center text-red-500 font-bold">✗</td>
                <td className="py-2.5 text-center text-red-500 font-bold">✗</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#E8E2D8] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
            <h2 className="text-base font-bold text-[#1E1B18]">Provision Authorized Staff Account</h2>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="font-semibold block mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Sanya Sen (Head Chef)"
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8]"
                  required
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Work Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. sanya@demorestaurant.com"
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8]"
                  required
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Access Role Level *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8] bg-white font-semibold"
                >
                  <option value="kitchen">Kitchen Staff (KDS Display Only)</option>
                  <option value="manager">Floor Manager (Orders & Menu)</option>
                  <option value="admin">Super Admin (Full Ownership)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E2D8]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E05A47] text-white font-bold hover:bg-[#cb4f3e]"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
