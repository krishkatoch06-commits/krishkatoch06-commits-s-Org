import React, { useEffect, useState } from 'react';
import { Download, BarChart2, TrendingUp, DollarSign, PieChart, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { api } from '../../lib/api';
import { useCart } from '../../lib/cart';

export const AdminReportsPage: React.FC = () => {
  const { settings } = useCart();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const currencySymbol = settings?.currency_symbol || '₹';

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportCSV = () => {
    window.location.href = '/api/reports/export-csv';
  };

  if (loading || !data) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-[#E05A47] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-[#78716C]">Compiling operational & financial database reports...</p>
      </div>
    );
  }

  const { metrics, status_breakdown, best_selling_dishes, category_performance, recent_orders } = data;

  const cancelledOrders = recent_orders.filter((o: any) => ['cancelled', 'rejected'].includes(o.status));

  return (
    <div className="space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D8]">
        <div>
          <span className="text-[11px] uppercase font-bold tracking-wider text-[#E05A47] block">
            Financial & Operational Intelligence
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#1E1B18]">Audited Sales & Kitchen Reports</h1>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 rounded-xl bg-[#1E1B18] text-white text-xs font-bold hover:bg-black transition-colors flex items-center gap-2 shadow-xs self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Download All Orders CSV</span>
        </button>
      </div>

      {/* Financial Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white border border-[#E8E2D8] rounded-2xl">
          <span className="text-[11px] text-[#78716C] block">Gross Orders Total</span>
          <span className="text-lg font-mono font-bold text-[#1E1B18] mt-1 block">
            {currencySymbol}{metrics.gross_sales}
          </span>
        </div>

        <div className="p-4 bg-white border border-[#E8E2D8] rounded-2xl">
          <span className="text-[11px] text-[#78716C] block">Discounts & Offers</span>
          <span className="text-lg font-mono font-bold text-emerald-700 mt-1 block">
            -{currencySymbol}{metrics.total_discounts}
          </span>
        </div>

        <div className="p-4 bg-white border border-[#E8E2D8] rounded-2xl">
          <span className="text-[11px] text-[#78716C] block">Total GST (5%)</span>
          <span className="text-lg font-mono font-bold text-[#1E1B18] mt-1 block">
            {currencySymbol}{metrics.total_taxes}
          </span>
        </div>

        <div className="p-4 bg-white border border-[#E8E2D8] rounded-2xl">
          <span className="text-[11px] text-[#78716C] block">Service Charge</span>
          <span className="text-lg font-mono font-bold text-[#1E1B18] mt-1 block">
            {currencySymbol}{metrics.total_service_charges}
          </span>
        </div>

        <div className="p-4 bg-white border border-[#E8E2D8] rounded-2xl">
          <span className="text-[11px] text-[#78716C] block">Net Realized Revenue</span>
          <span className="text-lg font-mono font-bold text-[#E05A47] mt-1 block">
            {currencySymbol}{metrics.net_sales}
          </span>
        </div>

        <div className="p-4 bg-white border border-[#E8E2D8] rounded-2xl">
          <span className="text-[11px] text-[#78716C] block">Avg Order Value</span>
          <span className="text-lg font-mono font-bold text-[#1E1B18] mt-1 block">
            {currencySymbol}{metrics.average_order_value}
          </span>
        </div>
      </div>

      {/* Two Column Layout: Categories & Order Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Performance */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-[#1E1B18] uppercase tracking-wider flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[#E05A47]" />
            <span>Category Performance Breakdown</span>
          </h2>

          <div className="space-y-3 pt-2">
            {category_performance.map((cat: any, idx: number) => {
              const totalRev = metrics.gross_sales || 1;
              const percent = Math.round((cat.revenue / totalRev) * 100);

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#1E1B18]">{cat.category_name}</span>
                    <span className="font-mono tabular-nums text-[#78716C]">
                      {currencySymbol}{cat.revenue} ({cat.order_count} items)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#FAF7F2] overflow-hidden">
                    <div
                      className="h-full bg-[#E05A47] rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-[#1E1B18] uppercase tracking-wider flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#E05A47]" />
            <span>Kitchen Workflow Status Distribution</span>
          </h2>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[#78716C] block">Completed & Served</span>
              <span className="font-mono font-bold text-lg text-slate-900 mt-0.5 block">
                {status_breakdown.completed || 0}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-emerald-800 block">Ready to Serve</span>
              <span className="font-mono font-bold text-lg text-emerald-700 mt-0.5 block">
                {status_breakdown.ready || 0}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-amber-800 block">In Preparation</span>
              <span className="font-mono font-bold text-lg text-amber-700 mt-0.5 block">
                {status_breakdown.preparing || 0}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-rose-800 block">New Incoming</span>
              <span className="font-mono font-bold text-lg text-rose-700 mt-0.5 block">
                {status_breakdown.new || 0}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-red-50 border border-red-200">
              <span className="text-red-800 block">Cancelled Orders</span>
              <span className="font-mono font-bold text-lg text-red-700 mt-0.5 block">
                {status_breakdown.cancelled || 0}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-red-50 border border-red-200">
              <span className="text-red-800 block">Rejected by Kitchen</span>
              <span className="font-mono font-bold text-lg text-red-700 mt-0.5 block">
                {status_breakdown.rejected || 0}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Cancellation & Rejection Audit Report */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-xs font-bold text-[#1E1B18] uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span>Cancellation & Rejection Incident Report</span>
        </h2>

        {cancelledOrders.length === 0 ? (
          <p className="text-xs text-[#78716C] py-2">
            No orders have been cancelled or rejected in the recent dining period.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#E8E2D8] bg-[#FAF7F2] text-[#78716C] font-semibold">
                  <th className="p-2.5">Order</th>
                  <th className="p-2.5">Table</th>
                  <th className="p-2.5">Guest</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Recorded Reason</th>
                  <th className="p-2.5 text-right">Lost Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE1]">
                {cancelledOrders.map((o: any) => (
                  <tr key={o.id}>
                    <td className="p-2.5 font-mono font-bold">{o.order_number}</td>
                    <td className="p-2.5">{o.table_display_name}</td>
                    <td className="p-2.5">{o.customer_name}</td>
                    <td className="p-2.5 font-bold uppercase text-red-600">{o.status}</td>
                    <td className="p-2.5 text-red-700 italic">
                      &quot;{o.rejection_reason || o.cancellation_reason || 'No reason provided'}&quot;
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-[#1E1B18]">
                      {currencySymbol}{o.total_amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
