import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Printer,
  Eye,
  CheckCircle,
  XCircle,
  DollarSign,
  AlertCircle,
  Clock,
  MapPin,
  Calendar
} from 'lucide-react';
import { Order, OrderStatus, PaymentStatus, PaymentMethod } from '../../types/restaurant';
import { api } from '../../lib/api';
import { useCart } from '../../lib/cart';
import { useAuth } from '../../lib/auth';
import { ReceiptModal } from '../../components/admin/ReceiptModal';

export const AdminOrdersPage: React.FC = () => {
  const { settings } = useCart();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Order for Full Detail Drawer / Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // Cancellation State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const currencySymbol = settings?.currency_symbol || '₹';

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await api.getOrders({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        payment_status: paymentFilter !== 'all' ? paymentFilter : undefined,
        search: searchQuery.trim() || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined
      });
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();

    // Subscribe to realtime updates
    const unsubscribe = api.subscribeToRealtime((event, data) => {
      if (event === 'order_created') {
        setOrders(prev => [data, ...prev.filter(o => o.id !== data.id)]);
      } else if (event === 'order_status_updated' || event === 'order_payment_updated') {
        setOrders(prev => prev.map(o => o.id === data.id ? data : o));
        if (selectedOrder?.id === data.id) setSelectedOrder(data);
      }
    });

    return () => unsubscribe();
  }, [statusFilter, paymentFilter, startDate, endDate]);

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setActionError(null);
    try {
      const updated = await api.updateOrderStatus(orderId, {
        status: nextStatus,
        changed_by: user ? `${user.full_name} (${user.role})` : 'Admin'
      });
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      if (selectedOrder?.id === orderId) setSelectedOrder(updated);
    } catch (err: any) {
      setActionError(err.message || 'Status update failed');
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedOrder || !cancellationReason.trim()) return;
    setActionError(null);
    try {
      const updated = await api.updateOrderStatus(selectedOrder.id, {
        status: 'cancelled',
        cancellation_reason: cancellationReason.trim(),
        changed_by: user ? `${user.full_name} (${user.role})` : 'Admin'
      });
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updated : o));
      setSelectedOrder(updated);
      setIsCancelModalOpen(false);
      setCancellationReason('');
    } catch (err: any) {
      setActionError(err.message || 'Cancellation failed');
    }
  };

  const handleMarkPayment = async (orderId: string, paymentStatus: PaymentStatus, method: PaymentMethod = 'pay_at_counter') => {
    try {
      const updated = await api.updateOrderPayment(orderId, {
        payment_status: paymentStatus,
        payment_method: method,
        acting_user_name: user?.full_name
      });
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      if (selectedOrder?.id === orderId) setSelectedOrder(updated);
    } catch (err: any) {
      alert(err.message || 'Payment update failed');
    }
  };

  const handleExportCSV = () => {
    window.location.href = '/api/reports/export-csv';
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D8]">
        <div>
          <span className="text-[11px] uppercase font-bold tracking-wider text-[#E05A47] block">
            Front-of-House & Cashier
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#1E1B18]">Order Management & Receipts</h1>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 rounded-xl bg-white border border-[#E8E2D8] hover:bg-[#FAF7F2] text-xs font-semibold text-[#1E1B18] transition-colors flex items-center gap-2 shadow-xs self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-[#E05A47]" />
          <span>Export Orders to CSV</span>
        </button>
      </div>

      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A8A29E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Order #, Table, Guest..."
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#E8E2D8] focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E8E2D8] bg-white focus:outline-none"
          >
            <option value="all">All Kitchen Statuses</option>
            <option value="new">New Incoming</option>
            <option value="accepted">Accepted</option>
            <option value="preparing">In Preparation</option>
            <option value="ready">Ready to Serve</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E8E2D8] bg-white focus:outline-none"
          >
            <option value="all">All Payment States</option>
            <option value="pending">Pending (Unpaid)</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
          </select>

          {/* Start Date */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E8E2D8] bg-white focus:outline-none text-[#78716C]"
          />

          {/* End Date */}
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E8E2D8] bg-white focus:outline-none text-[#78716C]"
          />

        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center text-xs text-[#78716C]">Loading dining orders...</div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#78716C]">No orders found for the selected criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#E8E2D8] bg-[#FAF7F2] text-[#78716C] font-semibold">
                  <th className="p-3">Order Number</th>
                  <th className="p-3">Table</th>
                  <th className="p-3">Time</th>
                  <th className="p-3">Guest</th>
                  <th className="p-3">Items Summary</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Payment</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE1]">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#1E1B18]">{order.order_number}</td>
                    <td className="p-3 font-semibold text-[#1E1B18]">{order.table_display_name}</td>
                    <td className="p-3 text-[11px] text-[#78716C] whitespace-nowrap">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3 text-[#78716C]">
                      <span className="block font-medium text-[#1E1B18]">{order.customer_name}</span>
                      <span className="text-[10px] text-[#A8A29E]">{order.customer_phone}</span>
                    </td>
                    <td className="p-3 text-[11px] text-[#78716C] max-w-xs truncate">
                      {order.items.map(i => `${i.quantity}x ${i.item_name}`).join(', ')}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        order.status === 'completed'
                          ? 'bg-slate-100 text-slate-800'
                          : order.status === 'ready'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'preparing'
                          ? 'bg-amber-100 text-amber-800'
                          : order.status === 'new'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleMarkPayment(
                          order.id,
                          order.payment_status === 'paid' ? 'pending' : 'paid',
                          order.payment_method
                        )}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all ${
                          order.payment_status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        }`}
                        title="Click to toggle payment collected"
                      >
                        {order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                      </button>
                    </td>
                    <td className="p-3 text-right font-mono font-bold tabular-nums text-[#1E1B18]">
                      {currencySymbol}{order.total_amount}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1E1B18] hover:bg-[#FAF7F2]"
                          title="View Order Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setReceiptOrder(order)}
                          className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1E1B18] hover:bg-[#FAF7F2]"
                          title="Print Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
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

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#E8E2D8] rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl p-6 text-xs space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <div>
                <span className="font-mono text-sm font-bold text-[#1E1B18] block">{selectedOrder.order_number}</span>
                <span className="text-xs text-[#78716C]">{selectedOrder.table_display_name} · {new Date(selectedOrder.created_at).toLocaleString()}</span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg text-[#78716C] hover:bg-[#FAF7F2]"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#1E1B18]">Current Status:</span>
                <span className="font-bold uppercase px-2 py-0.5 rounded-md bg-[#1E1B18] text-white text-[10px]">
                  {selectedOrder.status}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {selectedOrder.status === 'new' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'accepted')}
                    className="px-2.5 py-1 rounded-md bg-blue-600 text-white font-bold"
                  >
                    Accept
                  </button>
                )}
                {selectedOrder.status === 'accepted' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'preparing')}
                    className="px-2.5 py-1 rounded-md bg-amber-600 text-white font-bold"
                  >
                    Preparing
                  </button>
                )}
                {selectedOrder.status === 'preparing' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'ready')}
                    className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-bold"
                  >
                    Ready
                  </button>
                )}
                {selectedOrder.status === 'ready' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                    className="px-2.5 py-1 rounded-md bg-slate-800 text-white font-bold"
                  >
                    Complete
                  </button>
                )}
                {!['completed', 'cancelled', 'rejected'].includes(selectedOrder.status) && (
                  <button
                    onClick={() => {
                      setIsCancelModalOpen(true);
                      setCancellationReason('');
                    }}
                    className="px-2.5 py-1 rounded-md bg-red-100 text-red-700 font-bold hover:bg-red-200"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="overflow-y-auto flex-1 space-y-2 border border-[#E8E2D8] rounded-xl p-3">
              <span className="font-bold uppercase text-[11px] text-[#78716C] block pb-1 border-b border-[#F0EBE1]">
                Dishes in Order
              </span>
              {selectedOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between py-1.5 border-b border-[#F0EBE1] last:border-0">
                  <div>
                    <span className="font-semibold text-[#1E1B18]">{item.quantity}× {item.item_name}</span>
                    {item.variant_name && <span className="text-[11px] text-[#78716C] block">Size: {item.variant_name}</span>}
                    {item.selected_addons?.length > 0 && (
                      <span className="text-[10px] text-[#A8A29E] block">
                        Add-ons: {item.selected_addons.map(a => a.name).join(', ')}
                      </span>
                    )}
                    {item.special_instructions && (
                      <span className="text-[10px] italic text-[#A8A29E] block">
                        Note: &quot;{item.special_instructions}&quot;
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-bold tabular-nums text-[#1E1B18]">
                    {currencySymbol}{item.total_price}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals & Payment Settlement */}
            <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E2D8] space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono">{currencySymbol}{selectedOrder.subtotal}</span>
              </div>
              {selectedOrder.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span className="font-mono">-{currencySymbol}{selectedOrder.discount_amount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST:</span>
                <span className="font-mono">{currencySymbol}{selectedOrder.tax_amount}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-[#E8E2D8]">
                <span>Total Amount:</span>
                <span className="font-mono text-[#E05A47]">{currencySymbol}{selectedOrder.total_amount}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setReceiptOrder(selectedOrder)}
                className="px-3.5 py-2 rounded-xl border border-[#E8E2D8] text-xs font-semibold hover:bg-[#FAF7F2] flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Thermal Receipt</span>
              </button>

              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl bg-[#1E1B18] text-white font-bold"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Cancel Order with Reason Modal */}
      {isCancelModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8E2D8] space-y-4 text-xs">
            <h3 className="text-base font-bold text-red-600">Cancel Order {selectedOrder.order_number}</h3>
            <p className="text-[#78716C]">
              Cancelling this order will mark it void. State a clear operational reason for the audit trail:
            </p>

            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="e.g. Guest left premises, duplicate test order, kitchen unable to prepare..."
              rows={3}
              className="w-full p-2.5 rounded-xl border border-[#E8E2D8] focus:outline-none focus:border-red-500"
              required
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#FAF7F2] font-semibold text-[#1E1B18]"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={!cancellationReason.trim()}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      <ReceiptModal
        order={receiptOrder}
        settings={settings}
        isOpen={Boolean(receiptOrder)}
        onClose={() => setReceiptOrder(null)}
      />

    </div>
  );
};
