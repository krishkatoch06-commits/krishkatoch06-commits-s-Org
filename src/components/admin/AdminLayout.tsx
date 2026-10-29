import React, { useState } from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  QrCode,
  Users,
  Tag,
  BarChart3,
  Settings,
  History,
  Menu,
  X,
  ChefHat,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useCart } from '../../lib/cart';

interface AdminLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { path: '/admin', label: 'Dashboard Overview', icon: LayoutDashboard },
  { path: '/admin/menu', label: 'Menu & Categories', icon: UtensilsCrossed },
  { path: '/admin/orders', label: 'Order Management', icon: ShoppingBag },
  { path: '/admin/tables', label: 'Tables & Common QR', icon: QrCode },
  { path: '/admin/promotions', label: 'Discounts & Coupons', icon: Tag },
  { path: '/admin/reports', label: 'Sales Reports & Analytics', icon: BarChart3 },
  { path: '/admin/staff', label: 'Staff & Permissions', icon: Users },
  { path: '/admin/settings', label: 'Restaurant Settings', icon: Settings },
  { path: '/admin/audit-logs', label: 'Protected Audit Logs', icon: History }
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ currentPath, onNavigate, children }) => {
  const { user, logout, isAdmin, isManager } = useAuth();
  const { settings } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Access control guard
  if (!user || (!isAdmin && !isManager)) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <X className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-serif font-bold text-[#1E1B18]">Restricted Administrative Access</h2>
          <p className="text-xs text-[#78716C] leading-relaxed">
            The Super Admin Dashboard requires Owner or Manager privileges. Kitchen staff accounts are limited to the Kitchen Display System.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => onNavigate('/login')}
              className="w-full py-2.5 rounded-xl bg-[#E05A47] text-white text-xs font-bold hover:bg-[#cb4f3e] transition-colors"
            >
              Sign In with Admin Account
            </button>
            <button
              onClick={() => onNavigate('/kitchen')}
              className="w-full py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] text-xs font-semibold text-[#1E1B18] hover:bg-[#F3EFEA]"
            >
              Go to Kitchen Display
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EE] flex flex-col md:flex-row">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-[#1E1B18] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#E05A47] flex items-center justify-center font-bold text-xs">
            SA
          </div>
          <span className="font-serif font-bold text-sm">Super Admin</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg bg-white/10 text-white"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`fixed md:sticky top-0 z-30 h-screen w-64 bg-[#1E1B18] text-white flex flex-col justify-between transition-transform duration-200 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div>
          {/* Brand header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#E05A47] block">
                ADMIN CONSOLE
              </span>
              <h2 className="text-base font-serif font-bold text-white truncate max-w-[170px]">
                {settings?.name || 'Demo Restaurant'}
              </h2>
            </div>
            <button
              onClick={() => onNavigate('/menu')}
              title="Open Public Menu"
              className="p-1.5 rounded-lg bg-white/10 text-[#D6CEC1] hover:text-white transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation links */}
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => {
                    onNavigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                    isActive
                      ? 'bg-[#E05A47] text-white shadow-xs'
                      : 'text-[#A8A29E] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Logged in profile */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#E05A47] text-white flex items-center justify-center font-bold text-xs uppercase">
              {user.full_name[0]}
            </div>
            <div className="flex-1 truncate">
              <span className="text-xs font-bold text-white block truncate">
                {user.full_name}
              </span>
              <span className="text-[10px] text-[#E05A47] font-semibold uppercase tracking-wider block">
                {user.role} Privilege
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onNavigate('/kitchen')}
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Kitchen</span>
            </button>
            <button
              onClick={logout}
              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-red-600/30 text-[#D6CEC1] hover:text-white text-[11px] font-semibold transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>

    </div>
  );
};
