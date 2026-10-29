import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Tag, CheckCircle2, Clock } from 'lucide-react';
import { Coupon } from '../../types/restaurant';
import { api } from '../../lib/api';
import { useCart } from '../../lib/cart';
import { useAuth } from '../../lib/auth';

export const AdminPromotionsPage: React.FC = () => {
  const { settings } = useCart();
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_amount: 500,
    max_discount_amount: 150,
    valid_until: '',
    usage_limit: 100,
    is_active: true
  });
  const [formError, setFormError] = useState<string | null>(null);

  const currencySymbol = settings?.currency_symbol || '₹';

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const data = await api.getCoupons(false);
      setCoupons(data);
    } catch (err) {
      console.error('Failed to load coupons', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const openNewModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_amount: 500,
      max_discount_amount: 150,
      valid_until: '',
      usage_limit: 100,
      is_active: true
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_amount: coupon.min_order_amount,
      max_discount_amount: coupon.max_discount_amount || '',
      valid_until: coupon.valid_until ? coupon.valid_until.slice(0, 10) : '',
      usage_limit: coupon.usage_limit || '',
      is_active: coupon.is_active
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.code || !formData.discount_value) {
      setFormError('Coupon code and discount value are required');
      return;
    }

    try {
      if (editingCoupon) {
        await api.updateCoupon(editingCoupon.id, formData, user?.full_name);
      } else {
        await api.createCoupon(formData, user?.full_name);
      }
      setIsModalOpen(false);
      loadCoupons();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save coupon');
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      await api.updateCoupon(coupon.id, { is_active: !coupon.is_active }, user?.full_name);
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: !coupon.is_active } : c));
    } catch (err: any) {
      alert(err.message || 'Failed to toggle coupon status');
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(`Are you sure you want to delete coupon code "${coupon.code}"?`)) return;
    try {
      await api.deleteCoupon(coupon.id);
      loadCoupons();
    } catch (err: any) {
      alert(err.message || 'Failed to delete coupon');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D8]">
        <div>
          <span className="text-[11px] uppercase font-bold tracking-wider text-[#E05A47] block">
            Marketing & Loyalty
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#1E1B18]">Promotional Offers & Coupons</h1>
        </div>

        <button
          onClick={openNewModal}
          className="px-4 py-2 rounded-xl bg-[#E05A47] hover:bg-[#cf4e3b] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon Code</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center text-xs text-[#78716C]">Loading active promotions...</div>
        ) : coupons.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#78716C]">No coupons found. Create your first offer!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#E8E2D8] bg-[#FAF7F2] text-[#78716C] font-semibold">
                  <th className="p-3">Coupon Code</th>
                  <th className="p-3">Discount Type & Value</th>
                  <th className="p-3">Minimum Order</th>
                  <th className="p-3">Expiry Date</th>
                  <th className="p-3 text-center">Usage Count</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE1]">
                {coupons.map(cpn => (
                  <tr key={cpn.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-[#E05A47]" />
                        <span className="font-mono font-bold text-sm text-[#1E1B18]">{cpn.code}</span>
                      </div>
                      <span className="text-[11px] text-[#78716C] block pl-5">{cpn.description}</span>
                    </td>
                    <td className="p-3 font-semibold text-[#1E1B18]">
                      {cpn.discount_type === 'percentage'
                        ? `${cpn.discount_value}% OFF`
                        : `${currencySymbol}${cpn.discount_value} FLAT OFF`}
                      {cpn.max_discount_amount && (
                        <span className="text-[10px] text-[#78716C] block">
                          Up to {currencySymbol}{cpn.max_discount_amount}
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-[#78716C] tabular-nums">
                      {currencySymbol}{cpn.min_order_amount}
                    </td>
                    <td className="p-3 text-[#78716C]">
                      {cpn.valid_until ? new Date(cpn.valid_until).toLocaleDateString() : 'No Expiry'}
                    </td>
                    <td className="p-3 text-center font-mono tabular-nums">
                      <span className="font-bold text-[#1E1B18]">{cpn.usage_count}</span>
                      {cpn.usage_limit && <span className="text-[#A8A29E]"> / {cpn.usage_limit}</span>}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleToggleActive(cpn)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all ${
                          cpn.is_active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {cpn.is_active ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(cpn)}
                          className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1E1B18] hover:bg-[#FAF7F2]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cpn)}
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

      {/* Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#E8E2D8] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
            <h2 className="text-base font-bold text-[#1E1B18]">
              {editingCoupon ? 'Edit Coupon Code' : 'Create Promotional Coupon'}
            </h2>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="font-semibold block mb-1">Coupon Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. FESTIVE20"
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8] font-mono uppercase"
                  required
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. 20% off for weekend dining"
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Discount Type</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8] bg-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Cash Amount ({currencySymbol})</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Discount Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Min Order Value ({currencySymbol})</label>
                  <input
                    type="number"
                    value={formData.min_order_amount}
                    onChange={(e) => setFormData({ ...formData, min_order_amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8]"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Max Cap ({currencySymbol})</label>
                  <input
                    type="number"
                    value={formData.max_discount_amount}
                    onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Optional"
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8]"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Usage Limit</label>
                  <input
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="e.g. 500"
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8]"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[#E8E2D8] flex items-center justify-end gap-2">
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
                  Save Coupon
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
