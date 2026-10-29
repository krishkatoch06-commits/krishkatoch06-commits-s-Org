import React, { useEffect, useState, useMemo } from 'react';
import {
  Volume2,
  VolumeX,
  Search,
  Clock,
  CheckCircle,
  Play,
  Check,
  XCircle,
  AlertTriangle,
  RefreshCw,
  UtensilsCrossed,
  Filter
} from 'lucide-react';
import { Order, OrderStatus } from '../../types/restaurant';
import { api } from '../../lib/api';
import { sound } from '../../lib/sound';
import { useAuth } from '../../lib/auth';

const COLUMNS: { key: OrderStatus; label: string; bg: string; border: string; badge: string }[] = [
  { key: 'new', label: 'New Incoming', bg: 'bg-rose-50/50', border: 'border-rose-200', badge: 'bg-rose-500 text-white' },
  { key: 'accepted', label: 'Accepted', bg: 'bg-blue-50/50', border: 'border-blue-200', badge: 'bg-blue-600 text-white' },
  { key: 'preparing', label: 'In Preparation', bg: 'bg-amber-50/50', border: 'border-amber-200', badge: 'bg-amber-600 text-white' },
  { key: 'ready', label: 'Ready to Serve', bg: 'bg-emerald-50/50', border: 'border-emerald-200', badge: 'bg-emerald-600 text-white' },
  { key: 'completed', label: 'Completed', bg: 'bg-slate-50/50', border: 'border-slate-200', badge: 'bg-slate-600 text-white' }
];

export const KitchenPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState<string>('active'); // 'active' or 'all' or column key

  // Reject / Cancel Modal State
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders for kitchen', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();

    // Subscribe to SSE realtime events
    const unsubscribe = api.subscribeToRealtime((event, data) => {
      if (event === 'order_created') {
        setOrders(prev => [data, ...prev.filter(o => o.id !== data.id)]);
        if (soundEnabled) {
          sound.playOrderChime();
        }
      } else if (event === 'order_status_updated') {
        setOrders(prev => prev.map(o => (o.id === data.id ? data : o)));
      }
    });

    // Periodic elapsed timer updater every 30 seconds
    const interval = setInterval(() => {
      setOrders(prev => [...prev]);
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [soundEnabled]);

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setActionError(null);
    try {
      await api.updateOrderStatus(orderId, {
        status: nextStatus,
        changed_by: user ? `${user.full_name} (${user.role})` : 'Kitchen Staff'
      });
      loadOrders();
    } catch (err: any) {
      setActionError(err.message || 'Status transition failed');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingOrder || !rejectReason.trim()) return;
    setActionError(null);
    try {
      await api.updateOrderStatus(rejectingOrder.id, {
        status: 'rejected',
        rejection_reason: rejectReason.trim(),
        changed_by: user ? `${user.full_name} (${user.role})` : 'Kitchen Staff'
      });
      setRejectingOrder(null);
      setRejectReason('');
      loadOrders();
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject order');
    }
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNo = o.order_number.toLowerCase().includes(q);
        const matchesTable = o.table_number.toLowerCase().includes(q) || o.table_display_name.toLowerCase().includes(q);
        if (!matchesNo && !matchesTable) return false;
      }

      if (activeTabFilter === 'active') {
        return ['new', 'accepted', 'preparing', 'ready'].includes(o.status);
      }
      if (activeTabFilter !== 'all') {
        return o.status === activeTabFilter;
      }
      return true;
    });
  }, [orders, searchQuery, activeTabFilter]);

  // Elapsed minutes helper
  const getElapsedMinutes = (createdAt: string) => {
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  };

  return (
    <div className="min-h-screen bg-[#F7F4EE] flex flex-col">
      
      {/* Kitchen Sub-Header / Control Bar */}
      <div className="bg-[#1E1B18] text-white px-4 sm:px-6 py-3.5 border-b border-black flex flex-wrap items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#E05A47] flex items-center justify-center font-bold">
            <UtensilsCrossed className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              <span>Kitchen Display System (KDS)</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                LIVE REALTIME
              </span>
            </h1>
            <span className="text-[11px] text-[#A8A29E]">
              Orders update automatically as customers order from tables
            </span>
          </div>
        </div>

        {/* Controls: Search, Sound Toggle, Refresh */}
        <div className="flex items-center gap-3">
          
          {/* Search Table or Order # */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A8A29E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search table or order #..."
              className="text-xs pl-8 pr-3 py-1.5 rounded-lg bg-white/10 text-white placeholder:text-[#A8A29E] border border-white/15 focus:outline-none focus:border-[#E05A47]"
            />
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) sound.playOrderChime();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              soundEnabled
                ? 'bg-[#E05A47] border-[#E05A47] text-white'
                : 'bg-white/10 border-white/15 text-[#A8A29E] hover:text-white'
            }`}
            title="Audio notification chime for new orders"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Chime ON' : 'Chime Muted'}</span>
          </button>

          <button
            onClick={loadOrders}
            className="p-1.5 rounded-lg bg-white/10 border border-white/15 text-[#A8A29E] hover:text-white transition-colors"
            title="Refresh order state"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

      </div>

      {actionError && (
        <div className="bg-red-500 text-white text-xs px-4 py-2 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="font-bold underline text-[11px]">Dismiss</button>
        </div>
      )}

      {/* Filter Tabs for Kitchen Display */}
      <div className="bg-white border-b border-[#E8E2D8] px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex items-center gap-1.5 text-xs">
          <Filter className="w-3.5 h-3.5 text-[#78716C] mr-1" />
          <button
            onClick={() => setActiveTabFilter('active')}
            className={`px-3 py-1 rounded-md font-semibold transition-colors ${
              activeTabFilter === 'active' ? 'bg-[#1E1B18] text-white' : 'text-[#78716C] hover:text-[#1E1B18]'
            }`}
          >
            Active Orders ({orders.filter(o => ['new', 'accepted', 'preparing', 'ready'].includes(o.status)).length})
          </button>
          <button
            onClick={() => setActiveTabFilter('all')}
            className={`px-3 py-1 rounded-md font-semibold transition-colors ${
              activeTabFilter === 'all' ? 'bg-[#1E1B18] text-white' : 'text-[#78716C] hover:text-[#1E1B18]'
            }`}
          >
            All Today ({orders.length})
          </button>
          {COLUMNS.map(col => {
            const count = orders.filter(o => o.status === col.key).length;
            return (
              <button
                key={col.key}
                onClick={() => setActiveTabFilter(col.key)}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  activeTabFilter === col.key ? 'bg-[#1E1B18] text-white' : 'text-[#78716C] hover:text-[#1E1B18]'
                }`}
              >
                {col.label} ({count})
              </button>
            );
          })}
        </div>

        <span className="text-[11px] text-[#78716C] whitespace-nowrap">
          Delayed threshold: &gt;20 mins
        </span>
      </div>

      {/* Kanban Board Grid */}
      <div className="flex-1 p-4 sm:p-6 overflow-x-auto">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-2 border-[#E05A47] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-[#78716C]">Loading active kitchen stations...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 min-w-[1100px] items-start">
            {COLUMNS.map(col => {
              const columnOrders = filteredOrders.filter(o => o.status === col.key);

              return (
                <div
                  key={col.key}
                  className={`rounded-2xl border ${col.border} ${col.bg} p-3 flex flex-col min-h-[500px] shadow-xs`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E8E2D8]">
                    <span className="text-xs font-bold text-[#1E1B18] uppercase tracking-wider">
                      {col.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${col.badge}`}>
                      {columnOrders.length}
                    </span>
                  </div>

                  {/* Order Cards Stack */}
                  <div className="space-y-3 flex-1">
                    {columnOrders.length === 0 ? (
                      <div className="py-12 text-center text-xs text-[#A8A29E] italic">
                        No orders in this station
                      </div>
                    ) : (
                      columnOrders.map(order => {
                        const elapsedMins = getElapsedMinutes(order.created_at);
                        const isDelayed = elapsedMins >= 20 && ['new', 'accepted', 'preparing'].includes(order.status);
                        const isNewArrival = order.status === 'new' && elapsedMins < 5;

                        return (
                          <div
                            key={order.id}
                            className={`bg-white rounded-xl border p-4 shadow-xs space-y-3 transition-all ${
                              isDelayed
                                ? 'border-red-400 ring-2 ring-red-300'
                                : isNewArrival
                                ? 'border-rose-400 ring-2 ring-rose-200 animate-pulse'
                                : 'border-[#E8E2D8]'
                            }`}
                          >
                            {/* Card Top: Order # & Table badge */}
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="font-mono text-sm font-bold text-[#1E1B18] block">
                                  {order.order_number}
                                </span>
                                <span className="text-xs font-bold text-[#E05A47]">
                                  {order.table_display_name}
                                </span>
                              </div>

                              <div className="text-right">
                                <span className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
                                  isDelayed ? 'bg-red-100 text-red-700' : 'bg-[#FAF7F2] text-[#78716C]'
                                }`}>
                                  <Clock className="w-3 h-3" />
                                  <span>{elapsedMins}m ago</span>
                                </span>
                                {isDelayed && (
                                  <span className="block text-[10px] text-red-600 font-bold uppercase tracking-wider mt-0.5">
                                    DELAYED
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Customer & General Note */}
                            {order.order_notes && (
                              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-tight">
                                <span className="font-bold">Table Note:</span> {order.order_notes}
                              </div>
                            )}

                            {/* Items List */}
                            <div className="border-t border-[#F0EBE1] pt-2 space-y-2">
                              {order.items.map((item, i) => (
                                <div key={i} className="text-xs">
                                  <div className="flex items-baseline justify-between font-semibold text-[#1E1B18]">
                                    <span>
                                      <span className="w-5 inline-block text-[#E05A47] font-bold font-mono">
                                        {item.quantity}×
                                      </span>
                                      {item.item_name}
                                    </span>
                                  </div>

                                  {item.variant_name && (
                                    <span className="text-[11px] text-[#78716C] pl-5 block">
                                      Size: {item.variant_name}
                                    </span>
                                  )}

                                  {item.selected_addons && item.selected_addons.length > 0 && (
                                    <span className="text-[10px] text-[#A8A29E] pl-5 block">
                                      + {item.selected_addons.map(a => a.name).join(', ')}
                                    </span>
                                  )}

                                  {item.special_instructions && (
                                    <span className="text-[10px] font-medium text-amber-800 bg-amber-50 rounded px-1.5 py-0.5 ml-5 mt-0.5 inline-block">
                                      &quot;{item.special_instructions}&quot;
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Card Footer Actions */}
                            <div className="pt-2 border-t border-[#F0EBE1] flex items-center justify-between gap-2">
                              {/* Rejection / Cancel button for early states */}
                              {['new', 'accepted'].includes(order.status) && (
                                <button
                                  onClick={() => {
                                    setRejectingOrder(order);
                                    setRejectReason('');
                                  }}
                                  className="text-[11px] font-semibold text-red-600 hover:text-red-800 p-1 rounded"
                                >
                                  Reject
                                </button>
                              )}

                              <div className="flex-1 flex justify-end gap-1.5">
                                {order.status === 'new' && (
                                  <button
                                    onClick={() => handleUpdateStatus(order.id, 'accepted')}
                                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Accept</span>
                                  </button>
                                )}

                                {order.status === 'accepted' && (
                                  <button
                                    onClick={() => handleUpdateStatus(order.id, 'preparing')}
                                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center gap-1"
                                  >
                                    <Play className="w-3.5 h-3.5" />
                                    <span>Start Cooking</span>
                                  </button>
                                )}

                                {order.status === 'preparing' && (
                                  <button
                                    onClick={() => handleUpdateStatus(order.id, 'ready')}
                                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>Mark Ready</span>
                                  </button>
                                )}

                                {order.status === 'ready' && (
                                  <button
                                    onClick={() => handleUpdateStatus(order.id, 'completed')}
                                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-900 text-white transition-colors flex items-center gap-1"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Served / Done</span>
                                  </button>
                                )}

                                {order.status === 'completed' && (
                                  <span className="text-[11px] text-[#A8A29E] font-medium">
                                    Served to Table
                                  </span>
                                )}
                              </div>
                            </div>

                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Order Reason Modal */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-[#E8E2D8]">
            <div className="flex items-center gap-2.5 text-red-600">
              <XCircle className="w-5 h-5" />
              <h3 className="text-base font-bold text-[#1E1B18]">Reject Order {rejectingOrder.order_number}</h3>
            </div>
            
            <p className="text-xs text-[#78716C]">
              Specify the reason why this order cannot be fulfilled (e.g. ingredient out of stock, kitchen closing, gas maintenance). This reason will be recorded and shown to the customer.
            </p>

            <div>
              <label className="text-[11px] font-semibold text-[#1E1B18] block mb-1">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Tandoori paneer stock depleted for tonight..."
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-[#E8E2D8] focus:outline-none focus:border-red-500"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingOrder(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#FAF7F2] text-[#1E1B18] hover:bg-[#F3EFEA]"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
