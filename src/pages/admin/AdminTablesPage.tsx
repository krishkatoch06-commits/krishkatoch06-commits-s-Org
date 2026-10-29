import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Users, Check, X, QrCode } from 'lucide-react';
import { RestaurantTable } from '../../types/restaurant';
import { api } from '../../lib/api';
import { useCart } from '../../lib/cart';
import { useAuth } from '../../lib/auth';
import { TableQRCard } from '../../components/admin/TableQRCard';

export const AdminTablesPage: React.FC = () => {
  const { settings } = useCart();
  const { user } = useAuth();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    table_number: '',
    display_name: '',
    capacity: 4,
    is_active: true
  });
  const [formError, setFormError] = useState<string | null>(null);

  const loadTables = async () => {
    setLoading(true);
    try {
      const data = await api.getTables(false);
      setTables(data);
    } catch (err) {
      console.error('Failed to load tables', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const openNewModal = () => {
    setEditingTable(null);
    setFormData({
      table_number: String(tables.length + 1),
      display_name: `Table ${tables.length + 1} (Dining Room)`,
      capacity: 4,
      is_active: true
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (table: RestaurantTable) => {
    setEditingTable(table);
    setFormData({
      table_number: table.table_number,
      display_name: table.display_name,
      capacity: table.capacity,
      is_active: table.is_active
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.table_number || !formData.display_name) {
      setFormError('Table number and display name are required');
      return;
    }

    try {
      if (editingTable) {
        await api.updateTable(editingTable.id, formData, user?.full_name);
      } else {
        await api.createTable(formData, user?.full_name);
      }
      setIsModalOpen(false);
      loadTables();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save table');
    }
  };

  const handleToggleActive = async (table: RestaurantTable) => {
    try {
      await api.updateTable(table.id, { is_active: !table.is_active }, user?.full_name);
      setTables(prev => prev.map(t => t.id === table.id ? { ...t, is_active: !table.is_active } : t));
    } catch (err: any) {
      alert(err.message || 'Failed to update table status');
    }
  };

  const handleDelete = async (table: RestaurantTable) => {
    if (!confirm(`Are you sure you want to delete "${table.display_name}"?`)) return;
    try {
      await api.deleteTable(table.id, user?.full_name);
      loadTables();
    } catch (err: any) {
      alert(err.message || 'Cannot delete table with active orders');
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D8]">
        <div>
          <span className="text-[11px] uppercase font-bold tracking-wider text-[#E05A47] block">
            Floor Architecture & QR
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#1E1B18]">Table Seating & Common QR</h1>
        </div>

        <button
          onClick={openNewModal}
          className="px-4 py-2 rounded-xl bg-[#E05A47] hover:bg-[#cf4e3b] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Table</span>
        </button>
      </div>

      {/* Common Restaurant Dining QR Generator & Print Stand */}
      <TableQRCard settings={settings} />

      {/* Tables Floor Plan Table */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-xs space-y-4 p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
          <h2 className="text-xs font-bold text-[#1E1B18] uppercase tracking-wider">
            Active Restaurant Tables ({tables.length})
          </h2>
          <span className="text-xs text-[#78716C]">
            Inactive tables are strictly blocked from customer order placement.
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-[#78716C]">Loading dining tables...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#E8E2D8] bg-[#FAF7F2] text-[#78716C] font-semibold">
                  <th className="p-3">Table No.</th>
                  <th className="p-3">Display Name</th>
                  <th className="p-3">Capacity</th>
                  <th className="p-3">QR Identifier</th>
                  <th className="p-3 text-center">Active Orders</th>
                  <th className="p-3 text-center">Ordering Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE1]">
                {tables.map(table => (
                  <tr key={table.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#1E1B18]">{table.table_number}</td>
                    <td className="p-3 font-semibold text-[#1E1B18]">{table.display_name}</td>
                    <td className="p-3 text-[#78716C]">
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {table.capacity} guests
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[#A8A29E] text-[11px]">
                      {table.qr_code_identifier || `TBL-${table.table_number}`}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        (table.active_order_count || 0) > 0
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-[#78716C]'
                      }`}>
                        {table.active_order_count || 0} active
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleToggleActive(table)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all ${
                          table.is_active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {table.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(table)}
                          className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1E1B18] hover:bg-[#FAF7F2]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(table)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Table Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#E8E2D8] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
            <h2 className="text-base font-bold text-[#1E1B18]">
              {editingTable ? 'Edit Table Configuration' : 'Add New Restaurant Table'}
            </h2>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="font-semibold block mb-1">Table Number *</label>
                <input
                  type="text"
                  value={formData.table_number}
                  onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
                  placeholder="e.g. 7"
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8]"
                  required
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Display Name / Section *</label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="e.g. Table 7 (Rooftop Balcony)"
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8]"
                  required
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Guest Seating Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8]"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span className="font-semibold">Active for Online QR Ordering</span>
                </label>
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
                  Save Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
