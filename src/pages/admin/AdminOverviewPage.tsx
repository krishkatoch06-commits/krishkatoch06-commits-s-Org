import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Flame,
  RefreshCw
} from 'lucide-react';
import { api } from '../../lib/api';
import { useCart } from '../../lib/cart';
import { ReceiptModal } from '../../components/admin/ReceiptModal';
import { Order } from '../../types/restaurant';

interface AdminOverviewProps {
  onNavigate: (path: string) => void;
}

export const AdminOverviewPage: React.FC<AdminOverviewProps> = ({ onNavigate }) => {
  const { settings } = useCart();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  const currencySymbol = settings?.currency_symbol || '₹';

  const loadAnalytics = async () => {
    try {
      const res = await api.getAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();

    // Refresh every 30s
    const timer = setInterval(loadAnalytics, 30000);
    return () => clearInterval(timer);
  }, []);

  if (loading || !data) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-[#E05A47] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-[#78716C]">Calculating real sales & order records...</p>
      </div>
    );
  }

  const { metrics, best_selling_dishes, category_performance, low_availability_items, recent_orders } = data;

  return (
    <div className="space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D8]">
        <div>
          <span className="text-[11px] uppercase font-bold tracking-wider text-[#E05A47] block">
            Executive Operations
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#1E1B18]">Restaurant Performance Dashboard</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAnalytics}
            className="px-3 py-1.5 rounded-xl border border-[#E8E2D8] bg-white text-xs font-semibold text-[#1E1B18] hover:bg-[#FAF7F2] transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => onNavigate('/admin/reports')}
            className="px-4 py-1.5 rounded-xl bg-[#1E1B18] text-white text-xs font-bold hover:bg-black transition-colors"
          >
            Detailed Reports
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Today's Sales */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#78716C]">
            <span>Today&apos;s Net Sales</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-mono font-bold tabular-nums text-[#1E1B18]">
            {currencySymbol}{metrics.today_sales}
          </div>
          <div className="text-[11px] text-[#78716C] flex items-center gap-1">
            <span>Gross Sales: {currencySymbol}{metrics.gross_sales}</span>
          </div>
        </div>

        {/* Today's Orders */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#78716C]">
            <span>Today&apos;s Orders Placed</span>
            <ShoppingBag className="w-4 h-4 text-[#E05A47]" />
          </div>
          <div className="text-2xl font-mono font-bold tabular-nums text-[#1E1B18]">
            {metrics.today_orders_count}
          </div>
          <div className="text-[11px] text-[#78716C]">
            {metrics.completed_orders_count} completed · {metrics.paid_orders_count} settled
          </div>
        </div>

        {/* Active In Kitchen */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#78716C]">
            <span>Active in Kitchen</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-mono font-bold tabular-nums text-amber-700">
            {metrics.pending_and_preparing_count}
          </div>
          <div className="text-[11px] text-[#78716C]">
            New, accepted & cooking orders
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#78716C]">
            <span>Average Order Value</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-mono font-bold tabular-nums text-[#1E1B18]">
            {currencySymbol}{metrics.average_order_value}
          </div>
          <div className="text-[11px] text-[#78716C]">
            Per active dining ticket
          </div>
        </div>

      </div>

      {/* Financial Breakdown Card (Net vs Discounts vs Taxes) */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-xs font-bold text-[#1E1B18] uppercase tracking-wider">
          Audited Sales Reconciliation
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-2 text-center">
          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8]">
            <span className="text-[11px] text-[#78716C] block">Gross Subtotal</span>
            <span className="font-mono font-bold text-sm text-[#1E1B18] mt-1 block">
              {currencySymbol}{metrics.gross_sales}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-[11px] text-emerald-800 block">Promotions Given</span>
            <span className="font-mono font-bold text-sm text-emerald-700 mt-1 block">
              -{currencySymbol}{metrics.total_discounts}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8]">
            <span className="text-[11px] text-[#78716C] block">GST Collected</span>
            <span className="font-mono font-bold text-sm text-[#1E1B18] mt-1 block">
              {currencySymbol}{metrics.total_taxes}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8]">
            <span className="text-[11px] text-[#78716C] block">Service Charge</span>
            <span className="font-mono font-bold text-sm text-[#1E1B18] mt-1 block">
              {currencySymbol}{metrics.total_service_charges}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#1E1B18] text-white">
            <span className="text-[11px] text-[#A8A29E] block">Net Realized Revenue</span>
            <span className="font-mono font-bold text-sm text-white mt-1 block">
              {currencySymbol}{metrics.net_sales}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Best-Sellers & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Best Selling Dishes */}
        <div className="lg:col-span-7 bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
            <h2 className="text-xs font-bold text-[#1E1B18] uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-[#E05A47]" />
              <span>Best-Selling Dishes</span>
            </h2>
            <button
              onClick={() => onNavigate('/admin/menu')}
              className="text-xs font-semibold text-[#E05A47] hover:underline flex items-center gap-1"
            >
              <span>Manage Menu</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-[#F0EBE1]">
            {best_selling_dishes.length === 0 ? (
              <p className="text-xs text-[#78716C] py-4 text-center">No orders recorded yet</p>
            ) : (
              best_selling_dishes.map((dish: any, idx: number) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-[#FAF7F2] font-mono font-bold text-[#78716C] flex items-center justify-center text-xs">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-[#1E1B18] block">{dish.name}</span>
                      <span className="text-[11px] text-[#78716C]">{dish.quantity} portions ordered</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold tabular-nums text-[#1E1B18]">
                    {currencySymbol}{dish.revenue}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Availability / Sold Out Alerts */}
        <div className="lg:col-span-5 bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
            <h2 className="text-xs font-bold text-[#1E1B18] uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Availability Status</span>
            </h2>
          </div>

          {low_availability_items.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>All dishes are currently available and active on the menu.</span>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="text-xs text-[#78716C]">
                {low_availability_items.length} dishes are currently marked SOLD OUT:
              </span>
              <div className="space-y-1.5">
                {low_availability_items.map((item: any) => (
                  <div key={item.id} className="p-2.5 rounded-xl border border-red-200 bg-red-50 text-xs flex items-center justify-between">
                    <span className="font-semibold text-red-900">{item.name}</span>
                    <button
                      onClick={() => onNavigate('/admin/menu')}
                      className="text-[11px] font-bold text-red-700 hover:underline"
                    >
                      Enable
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={() => onNavigate('/admin/tables')}
              className="w-full py-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] text-xs font-semibold text-[#1E1B18] hover:bg-[#F3EFEA] transition-colors"
            >
              Generate Restaurant QR Stand
            </button>
          </div>
        </div>

      </div>

      {/* Recent Orders Feed */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
          <h2 className="text-xs font-bold text-[#1E1B18] uppercase tracking-wider">
            Live Order Activity Feed
          </h2>
          <button
            onClick={() => onNavigate('/admin/orders')}
            className="text-xs font-semibold text-[#E05A47] hover:underline"
          >
            View All Orders
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#E8E2D8] text-[#78716C] font-semibold">
                <th className="py-2.5">Order</th>
                <th className="py-2.5">Table</th>
                <th className="py-2.5">Guest</th>
                <th className="py-2.5">Status</th>
                <th className="py-2.5">Payment</th>
                <th className="py-2.5 text-right">Total</th>
                <th className="py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBE1]">
              {recent_orders.map((order: Order) => (
                <tr key={order.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                  <td className="py-3 font-mono font-bold text-[#1E1B18]">{order.order_number}</td>
                  <td className="py-3 font-semibold text-[#1E1B18]">{order.table_display_name}</td>
                  <td className="py-3 text-[#78716C]">{order.customer_name}</td>
                  <td className="py-3">
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
                  <td className="py-3">
                    <span className={`text-[11px] font-semibold ${
                      order.payment_status === 'paid' ? 'text-emerald-700' : 'text-amber-700'
                    }`}>
                      {order.payment_status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 text-right font-mono font-bold tabular-nums text-[#1E1B18]">
                    {currencySymbol}{order.total_amount}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => setReceiptOrder(order)}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[#FAF7F2] border border-[#E8E2D8] hover:bg-white text-[#1E1B18]"
                    >
                      Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ReceiptModal
        order={receiptOrder}
        settings={settings}
        isOpen={Boolean(receiptOrder)}
        onClose={() => setReceiptOrder(null)}
      />

    </div>
  );
};
