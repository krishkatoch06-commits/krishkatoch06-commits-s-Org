import React, { useState } from 'react';
import { ArrowLeft, Trash2, Plus, Minus, Tag, Check, AlertCircle, ShoppingBag, ShieldCheck, MapPin } from 'lucide-react';
import { useCart } from '../../lib/cart';
import { api } from '../../lib/api';

interface CartPageProps {
  onNavigate: (path: string) => void;
  onOpenTableModal: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onNavigate, onOpenTableModal }) => {
  const {
    items,
    selectedTable,
    removeItem,
    updateQuantity,
    clearCart,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    orderNotes,
    setOrderNotes,
    appliedCoupon,
    applyCouponCode,
    removeCoupon,
    couponError,
    subtotal,
    discount,
    tax,
    serviceCharge,
    total,
    settings
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const currencySymbol = settings?.currency_symbol || '₹';

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    try {
      await applyCouponCode(couponInput.trim());
      setCouponInput('');
    } catch {
      // Error handled in useCart
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handlePlaceOrder = async () => {
    setOrderError(null);

    // 1. Validate Table
    if (!selectedTable) {
      setOrderError('Please select your dining table before placing the order.');
      onOpenTableModal();
      return;
    }

    // 2. Validate Customer Details
    if (!customerName.trim()) {
      setOrderError('Please enter your name so we can address your order.');
      return;
    }

    if (!customerPhone.trim() || customerPhone.trim().length < 8) {
      setOrderError('Please provide a valid contact number for dining verification.');
      return;
    }

    // 3. Validate Cart
    if (items.length === 0) {
      setOrderError('Your cart is empty. Add delicious items from the menu first!');
      return;
    }

    setIsSubmitting(true);
    try {
      const idempotencyKey = `ord-req-${selectedTable.id}-${Date.now()}`;
      const payload = {
        table_id: selectedTable.id,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        order_notes: orderNotes.trim(),
        coupon_code: appliedCoupon?.code,
        idempotency_key: idempotencyKey,
        items: items.map(item => ({
          menu_item_id: item.menu_item.id,
          variant_id: item.selected_variant?.id,
          addon_ids: item.selected_addons.map(a => a.id),
          quantity: item.quantity,
          special_instructions: item.special_instructions
        }))
      };

      const order = await api.createOrder(payload);
      clearCart();
      onNavigate(`/order/${order.id}`);
    } catch (err: any) {
      setOrderError(err.message || 'Failed to place order. Please review your selections.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-[#EFE9DF] text-[#78716C] flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#1E1B18]">Your Dining Plate is Empty</h2>
        <p className="text-xs text-[#78716C] mt-1.5 max-w-sm mx-auto">
          Explore our handcrafted dishes and clay-oven specialties to start your dining order.
        </p>
        <button
          onClick={() => onNavigate('/menu')}
          className="mt-6 px-6 py-2.5 rounded-xl bg-[#E05A47] hover:bg-[#cb4f3e] text-white text-xs font-bold transition-all shadow-xs"
        >
          Browse Dining Menu
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D8]">
        <button
          onClick={() => onNavigate('/menu')}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#78716C] hover:text-[#1E1B18] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Menu</span>
        </button>
        <h1 className="text-lg font-serif font-bold text-[#1E1B18]">Your Dining Order</h1>
        <button
          onClick={clearCart}
          className="text-xs text-[#A8A29E] hover:text-red-600 transition-colors"
        >
          Clear All
        </button>
      </div>

      {orderError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{orderError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Items list & Table selection */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Table Card */}
          <div className="p-4 bg-white border border-[#E8E2D8] rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E05A47]/10 text-[#E05A47] flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold text-[#78716C] tracking-wider block">
                  Current Seating
                </span>
                <span className="text-sm font-bold text-[#1E1B18]">
                  {selectedTable ? selectedTable.display_name : 'No Table Selected'}
                </span>
              </div>
            </div>

            <button
              onClick={onOpenTableModal}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-[#E8E2D8] bg-[#FAF7F2] hover:bg-[#F3EFEA] text-[#1E1B18] transition-all"
            >
              {selectedTable ? 'Change Table' : 'Select Table'}
            </button>
          </div>

          {/* Itemized Order List */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden divide-y divide-[#F0EBE1]">
            {items.map(item => (
              <div key={item.cart_id} className="p-4 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center justify-center w-4 h-4 rounded-xs border ${
                      item.menu_item.is_veg ? 'border-emerald-500 bg-white' : 'border-red-600 bg-white'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${item.menu_item.is_veg ? 'bg-emerald-600' : 'bg-red-600'}`} />
                    </span>
                    <h3 className="text-sm font-bold text-[#1E1B18]">{item.menu_item.name}</h3>
                  </div>

                  {item.selected_variant && (
                    <span className="text-xs text-[#78716C] block mt-0.5">
                      Portion: {item.selected_variant.name}
                    </span>
                  )}

                  {item.selected_addons.length > 0 && (
                    <div className="text-[11px] text-[#78716C] mt-1 space-y-0.5">
                      {item.selected_addons.map(a => (
                        <div key={a.id} className="flex items-center gap-1">
                          <span>+ {a.name} ({currencySymbol}{a.price})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {item.special_instructions && (
                    <span className="text-[11px] text-[#A8A29E] italic block mt-1">
                      Note: &quot;{item.special_instructions}&quot;
                    </span>
                  )}

                  <div className="mt-2 text-xs font-mono font-semibold text-[#1E1B18]">
                    {currencySymbol}{item.calculated_unit_price} each
                  </div>
                </div>

                {/* Right controls: Stepper & Remove */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center border border-[#E8E2D8] rounded-lg bg-[#FAF7F2] p-0.5">
                    <button
                      onClick={() => updateQuantity(item.cart_id, -1)}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-[#44403C] hover:bg-white transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center text-xs font-bold font-mono tabular-nums text-[#1E1B18]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.cart_id, 1)}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-[#44403C] hover:bg-white transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="text-xs font-mono font-bold tabular-nums text-[#1E1B18]">
                    {currencySymbol}{item.calculated_unit_price * item.quantity}
                  </span>

                  <button
                    onClick={() => removeItem(item.cart_id)}
                    className="text-[#A8A29E] hover:text-red-600 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Dining Details Form */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 sm:p-5 space-y-4">
            <h3 className="text-xs font-bold text-[#1E1B18] uppercase tracking-wider">
              Guest Dining Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-[#78716C] block mb-1">
                  Your Full Name <span className="text-[#E05A47]">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Ananya Mehra"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#E8E2D8] focus:outline-none focus:border-[#E05A47]"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#78716C] block mb-1">
                  Contact Phone Number <span className="text-[#E05A47]">*</span>
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#E8E2D8] focus:outline-none focus:border-[#E05A47]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#78716C] block mb-1">
                General Kitchen Notes / Allergy Warnings
              </label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="e.g. Table prefers everything served hot together, peanut allergy, extra napkins..."
                rows={2}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#E8E2D8] focus:outline-none focus:border-[#E05A47]"
              />
            </div>
          </div>

        </div>

        {/* Right Column: Coupon, Breakdown & Checkout */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Coupon Box */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 sm:p-5 space-y-3">
            <label className="text-xs font-bold text-[#1E1B18] uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#E05A47]" />
              <span>Offers & Promotions</span>
            </label>

            {appliedCoupon ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-bold">{appliedCoupon.code} applied!</span>
                    <span className="block text-[11px] text-emerald-700">{appliedCoupon.description}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="text-[11px] text-red-600 hover:underline font-semibold"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="e.g. WELCOME10, FLAT100"
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-[#E8E2D8] focus:outline-none focus:border-[#E05A47]"
                />
                <button
                  type="submit"
                  disabled={applyingCoupon || !couponInput.trim()}
                  className="px-3.5 py-2 text-xs font-bold bg-[#1E1B18] text-white rounded-xl hover:bg-black transition-colors disabled:opacity-40"
                >
                  {applyingCoupon ? 'Checking...' : 'Apply'}
                </button>
              </form>
            )}

            {couponError && (
              <p className="text-[11px] text-red-600">{couponError}</p>
            )}
          </div>

          {/* Bill Summary */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-[#1E1B18] uppercase tracking-wider pb-3 border-b border-[#F0EBE1]">
              Order Pricing Breakdown
            </h3>

            <div className="space-y-2 text-xs text-[#78716C]">
              <div className="flex justify-between">
                <span>Food & Drink Subtotal</span>
                <span className="font-mono tabular-nums text-[#1E1B18]">{currencySymbol}{subtotal}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Promotion Discount</span>
                  <span className="font-mono tabular-nums">-{currencySymbol}{discount}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Taxes & GST ({settings?.tax_rate_percent || 5}%)</span>
                <span className="font-mono tabular-nums text-[#1E1B18]">{currencySymbol}{tax}</span>
              </div>

              <div className="flex justify-between">
                <span>Restaurant Service ({settings?.service_charge_percent || 2.5}%)</span>
                <span className="font-mono tabular-nums text-[#1E1B18]">{currencySymbol}{serviceCharge}</span>
              </div>

              <div className="pt-3 border-t border-[#F0EBE1] flex justify-between text-base font-bold text-[#1E1B18]">
                <span>Total Payable</span>
                <span className="font-mono tabular-nums text-[#E05A47] text-lg">
                  {currencySymbol}{total}
                </span>
              </div>
            </div>

            {/* Pay at Counter Instruction Banner */}
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] text-xs space-y-1">
              <span className="font-bold text-[#1E1B18] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Payment Method: Pay at Counter
              </span>
              <p className="text-[11px] text-[#78716C] leading-relaxed">
                {settings?.pay_at_counter_instructions || 'Please show your order number at the payment counter after dining.'}
              </p>
            </div>

            {/* Authoritative Order Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-[#E05A47] hover:bg-[#cf4e3b] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting to Kitchen...</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Confirm Order · {currencySymbol}{total}</span>
                </>
              )}
            </button>

            <p className="text-[10px] text-center text-[#A8A29E]">
              Prices are authoritatively computed and validated by our server.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
};
