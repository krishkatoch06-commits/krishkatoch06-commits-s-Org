import React from 'react';
import { X, Printer, CheckCircle } from 'lucide-react';
import { Order, RestaurantSettings } from '../../types/restaurant';

interface ReceiptModalProps {
  order: Order | null;
  settings: RestaurantSettings | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, settings, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const currencySymbol = settings?.currency_symbol || '₹';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-[#E8E2D8] rounded-2xl w-full max-w-md shadow-2xl p-6 relative flex flex-col max-h-[90vh]">
        
        {/* Top Actions */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1] print:hidden">
          <span className="text-xs font-bold text-[#1E1B18] uppercase tracking-wider">
            Dining Tax Receipt
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-[#1E1B18] text-white text-xs font-semibold hover:bg-black transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#78716C] hover:bg-[#F3EFEA]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div id="printable-receipt" className="py-4 overflow-y-auto flex-1 font-mono text-xs text-[#1E1B18] space-y-4">
          
          {/* Header */}
          <div className="text-center space-y-1">
            <h2 className="text-base font-bold font-serif">{settings?.name || 'Demo Restaurant'}</h2>
            <p className="text-[11px] text-[#78716C]">{settings?.address || 'Indiranagar, Bengaluru'}</p>
            <p className="text-[11px] text-[#78716C]">Phone: {settings?.phone || '+91 98765 43210'}</p>
            <p className="text-[10px] text-[#A8A29E] uppercase tracking-widest pt-1 border-t border-dashed border-[#E8E2D8]">
              OFFICIAL DINING INVOICE
            </p>
          </div>

          {/* Meta Info */}
          <div className="space-y-0.5 text-[11px] border-b border-dashed border-[#E8E2D8] pb-3">
            <div className="flex justify-between">
              <span>Order No:</span>
              <span className="font-bold">{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Table:</span>
              <span className="font-bold">{order.table_display_name}</span>
            </div>
            <div className="flex justify-between">
              <span>Date & Time:</span>
              <span>{new Date(order.created_at).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Guest:</span>
              <span>{order.customer_name} ({order.customer_phone})</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2 border-b border-dashed border-[#E8E2D8] pb-3">
            <div className="flex justify-between font-bold text-[11px] border-b border-black/10 pb-1">
              <span>Item & Description</span>
              <span>Qty x Price</span>
              <span>Amount</span>
            </div>

            {order.items.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between font-semibold">
                  <span className="truncate max-w-[170px]">{item.item_name}</span>
                  <span>{item.quantity} x {item.price}</span>
                  <span>{currencySymbol}{item.total_price}</span>
                </div>
                {item.variant_name && (
                  <div className="text-[10px] text-[#78716C] pl-2">
                    Size: {item.variant_name}
                  </div>
                )}
                {item.selected_addons && item.selected_addons.length > 0 && (
                  <div className="text-[10px] text-[#A8A29E] pl-2">
                    + {item.selected_addons.map(a => a.name).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Calculation Summary */}
          <div className="space-y-1 text-[11px] border-b border-dashed border-[#E8E2D8] pb-3">
            <div className="flex justify-between">
              <span>Items Subtotal:</span>
              <span>{currencySymbol}{order.subtotal}</span>
            </div>

            {order.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount ({order.coupon_code || 'Promo'}):</span>
                <span>-{currencySymbol}{order.discount_amount}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>GST ({settings?.tax_rate_percent || 5}%):</span>
              <span>{currencySymbol}{order.tax_amount}</span>
            </div>

            <div className="flex justify-between">
              <span>Service Charge ({settings?.service_charge_percent || 2.5}%):</span>
              <span>{currencySymbol}{order.service_charge_amount}</span>
            </div>

            <div className="flex justify-between font-bold text-sm pt-1 border-t border-black/10">
              <span>Grand Total:</span>
              <span>{currencySymbol}{order.total_amount}</span>
            </div>
          </div>

          {/* Payment Status Footer */}
          <div className="text-center pt-2 space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#FAF7F2] font-bold text-[11px] uppercase">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>{order.payment_status === 'paid' ? 'Paid at Counter' : 'Unpaid - Pay at Counter'}</span>
            </div>
            <p className="text-[10px] text-[#A8A29E] pt-2">
              Thank you for dining with us! Please visit again.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
