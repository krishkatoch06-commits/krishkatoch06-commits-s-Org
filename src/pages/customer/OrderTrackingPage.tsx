import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, ChefHat, Bell, Utensils, AlertTriangle, ArrowLeft, RefreshCw, MapPin } from 'lucide-react';
import { Order, OrderStatus } from '../../types/restaurant';
import { api } from '../../lib/api';

interface OrderTrackingPageProps {
  orderId: string;
  onNavigate: (path: string) => void;
}

const STATUS_STEPS: { key: OrderStatus; label: string; desc: string }[] = [
  { key: 'new', label: 'Order Received', desc: 'Sent to the kitchen system' },
  { key: 'accepted', label: 'Accepted by Line', desc: 'Chef acknowledged order' },
  { key: 'preparing', label: 'Cooking & Preparation', desc: 'Dishes are on the stoves & tandoor' },
  { key: 'ready', label: 'Hot & Ready', desc: 'Plated for your table' },
  { key: 'completed', label: 'Completed', desc: 'Served & closed' }
];

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({ orderId, onNavigate }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const loadOrder = async () => {
    try {
      const data = await api.getOrder(orderId);
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Order not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();

    // Subscribe to live SSE updates
    const unsubscribe = api.subscribeToRealtime((event, data) => {
      if ((event === 'order_status_updated' || event === 'order_payment_updated') && data.id === orderId) {
        setOrder(data);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [orderId]);

  // Elapsed timer tick
  useEffect(() => {
    if (!order) return;
    const orderCreatedAt = new Date(order.created_at).getTime();

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((Date.now() - orderCreatedAt) / 1000));
      setElapsedSeconds(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [order]);

  if (loading) {
    return (
      <div className="py-24 text-center max-w-md mx-auto px-4">
        <div className="w-8 h-8 border-2 border-[#E05A47] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-[#78716C]">Retrieving your live dining order...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-serif font-bold text-[#1E1B18]">Order Not Found</h2>
        <p className="text-xs text-[#78716C]">{error || 'Could not locate this order id.'}</p>
        <button
          onClick={() => onNavigate('/menu')}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#E05A47] text-white hover:bg-[#cb4f3e]"
        >
          Return to Menu
        </button>
      </div>
    );
  }

  const isTerminalFailed = ['rejected', 'cancelled'].includes(order.status);
  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === order.status);

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    return `${mins}m ${remainingSec.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D8]">
        <button
          onClick={() => onNavigate('/menu')}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#78716C] hover:text-[#1E1B18] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Order More Dishes</span>
        </button>

        <button
          onClick={loadOrder}
          title="Refresh status"
          className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1E1B18] hover:bg-[#F3EFEA] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Hero Status Banner */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-8 text-center space-y-3 relative overflow-hidden shadow-xs">
        
        {/* Table & Order Number Kickers */}
        <div className="flex items-center justify-center gap-2 text-xs text-[#78716C]">
          <span className="font-mono font-bold text-[#1E1B18]">{order.order_number}</span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1 font-semibold text-[#1E1B18]">
            <MapPin className="w-3.5 h-3.5 text-[#E05A47]" />
            {order.table_display_name}
          </span>
        </div>

        {/* Dynamic Status Title */}
        {isTerminalFailed ? (
          <div className="space-y-2">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-red-700 capitalize">
              Order {order.status}
            </h1>
            <p className="text-xs text-red-600 max-w-md mx-auto">
              Reason: {order.rejection_reason || order.cancellation_reason || 'Order could not be fulfilled.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto transition-all ${
              order.status === 'ready'
                ? 'bg-emerald-100 text-emerald-700 animate-bounce'
                : 'bg-[#E05A47]/10 text-[#E05A47]'
            }`}>
              {order.status === 'ready' ? <Bell className="w-7 h-7" /> : <ChefHat className="w-7 h-7" />}
            </div>

            <h1 className="text-2xl font-serif font-bold text-[#1E1B18]">
              {order.status === 'new' && 'Order Placed & Sent to Kitchen'}
              {order.status === 'accepted' && 'Chef Accepted Your Order'}
              {order.status === 'preparing' && 'Simmering & Baking in Progress'}
              {order.status === 'ready' && 'Your Dishes are Hot & Ready!'}
              {order.status === 'completed' && 'Order Fulfilled & Served'}
            </h1>

            <p className="text-xs text-[#78716C] max-w-sm mx-auto">
              {order.status === 'ready'
                ? 'Server is bringing dishes to your table now.'
                : `Estimated preparation time: ~${order.estimated_prep_minutes} minutes`}
            </p>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#E8E2D8] text-xs font-mono text-[#78716C] mt-2">
              <Clock className="w-3.5 h-3.5 text-[#E05A47]" />
              <span>Elapsed: {formatElapsed(elapsedSeconds)}</span>
            </div>
          </div>
        )}

      </div>

      {/* Interactive Progress Steps */}
      {!isTerminalFailed && (
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-8 space-y-6">
          <h2 className="text-xs font-bold text-[#1E1B18] uppercase tracking-wider">
            Live Kitchen Workflow
          </h2>

          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E8E2D8]">
            {STATUS_STEPS.map((step, idx) => {
              const isPast = currentStepIndex > idx;
              const isCurrent = currentStepIndex === idx;

              return (
                <div key={step.key} className="relative flex items-start gap-4">
                  
                  {/* Step icon circle */}
                  <div className={`absolute -left-6 sm:-left-8 top-0 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    isPast
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-[#E05A47] text-white ring-4 ring-[#E05A47]/20'
                      : 'bg-[#F0EBE1] text-[#A8A29E]'
                  }`}>
                    {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>

                  <div>
                    <span className={`text-xs font-bold block ${
                      isCurrent ? 'text-[#E05A47]' : isPast ? 'text-[#1E1B18]' : 'text-[#A8A29E]'
                    }`}>
                      {step.label}
                    </span>
                    <span className="text-[11px] text-[#78716C] block mt-0.5">
                      {step.desc}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Itemized Order Receipt Snapshot */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
          <h2 className="text-xs font-bold text-[#1E1B18] uppercase tracking-wider flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5 text-[#E05A47]" />
            <span>Ordered Dishes</span>
          </h2>
          <span className="text-xs text-[#78716C]">
            Customer: {order.customer_name}
          </span>
        </div>

        <div className="divide-y divide-[#F0EBE1]">
          {order.items.map((item, idx) => (
            <div key={idx} className="py-2.5 flex items-start justify-between text-xs">
              <div>
                <span className="font-semibold text-[#1E1B18]">
                  {item.quantity}x {item.item_name}
                </span>
                {item.variant_name && (
                  <span className="text-[11px] text-[#78716C] block">
                    {item.variant_name}
                  </span>
                )}
                {item.selected_addons && item.selected_addons.length > 0 && (
                  <span className="text-[11px] text-[#A8A29E] block">
                    Add-ons: {item.selected_addons.map(a => a.name).join(', ')}
                  </span>
                )}
                {item.special_instructions && (
                  <span className="text-[10px] text-[#A8A29E] italic block">
                    &quot;{item.special_instructions}&quot;
                  </span>
                )}
              </div>
              <span className="font-mono tabular-nums text-[#1E1B18]">
                ₹{item.total_price}
              </span>
            </div>
          ))}
        </div>

        {/* Bill Summary */}
        <div className="pt-3 border-t border-[#F0EBE1] space-y-1.5 text-xs text-[#78716C]">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-mono tabular-nums">₹{order.subtotal}</span>
          </div>

          {order.discount_amount > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Discount ({order.coupon_code || 'Promo'})</span>
              <span className="font-mono tabular-nums">-₹{order.discount_amount}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>Taxes & GST</span>
            <span className="font-mono tabular-nums">₹{order.tax_amount}</span>
          </div>

          <div className="flex justify-between">
            <span>Service Charge</span>
            <span className="font-mono tabular-nums">₹{order.service_charge_amount}</span>
          </div>

          <div className="pt-2 border-t border-[#F0EBE1] flex justify-between text-sm font-bold text-[#1E1B18]">
            <span>Total Payable</span>
            <span className="font-mono tabular-nums text-[#E05A47]">₹{order.total_amount}</span>
          </div>
        </div>

        {/* Counter Payment Callout */}
        <div className="p-3 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs flex items-center justify-between">
          <div>
            <span className="font-semibold text-[#1E1B18] block">Payment: Pay at Counter</span>
            <span className="text-[11px] text-[#78716C]">Status: {order.payment_status.toUpperCase()}</span>
          </div>
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
            {order.payment_status === 'paid' ? 'Paid' : 'Unpaid at Counter'}
          </span>
        </div>

      </div>

    </div>
  );
};
