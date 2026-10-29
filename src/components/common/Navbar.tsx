import React from 'react';
import { ShoppingBag, ChefHat, ShieldCheck, LogIn, LogOut, UtensilsCrossed, QrCode } from 'lucide-react';
import { useCart } from '../../lib/cart';
import { useAuth } from '../../lib/auth';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenTableModal?: () => void;
  onOpenQRModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate, onOpenTableModal, onOpenQRModal }) => {
  const { totalItemsCount, selectedTable, settings } = useCart();
  const { user, logout, isStaff } = useAuth();

  const isCustomerPage = ['/menu', '/cart'].includes(currentPath) || currentPath.startsWith('/order/');

  return (
    <header className="sticky top-0 z-40 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#E8E2D8] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single text wordmark in display face */}
        <button
          onClick={() => onNavigate('/menu')}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <div className="w-9 h-9 rounded-lg bg-[#E05A47] text-white flex items-center justify-center shadow-xs group-hover:bg-[#cb4f3e] transition-colors">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-serif font-bold tracking-tight text-[#1E1B18] block leading-none">
              {settings?.name || 'Demo Restaurant'}
            </span>
            <span className="text-[11px] text-[#78716C] tracking-wide block mt-0.5">
              Fine Dining & QR Service
            </span>
          </div>
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#78716C]">
          <button
            onClick={() => onNavigate('/menu')}
            className={`whitespace-nowrap transition-colors hover:text-[#1E1B18] ${
              currentPath === '/menu' ? 'text-[#E05A47] font-semibold' : ''
            }`}
          >
            Dining Menu
          </button>
          
          <button
            onClick={() => onNavigate('/kitchen')}
            className={`flex items-center gap-1.5 whitespace-nowrap transition-colors hover:text-[#1E1B18] ${
              currentPath === '/kitchen' ? 'text-[#E05A47] font-semibold' : ''
            }`}
          >
            <ChefHat className="w-4 h-4" />
            Kitchen Display
          </button>

          <button
            onClick={() => onNavigate('/admin')}
            className={`flex items-center gap-1.5 whitespace-nowrap transition-colors hover:text-[#1E1B18] ${
              currentPath.startsWith('/admin') ? 'text-[#E05A47] font-semibold' : ''
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Super Admin
          </button>
        </nav>

        {/* Zone 3: Primary Action / Cart / Staff indicator */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Scan QR Button */}
          {isCustomerPage && onOpenQRModal && (
            <button
              onClick={onOpenQRModal}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#E05A47]/40 bg-[#E05A47]/5 text-[#E05A47] hover:bg-[#E05A47]/10 transition-all flex items-center gap-1.5 shadow-xs whitespace-nowrap"
              title="View or Scan Table QR Code"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Order via QR</span>
            </button>
          )}

          {/* Table Indicator for customer */}
          {isCustomerPage && onOpenTableModal && (
            <button
              onClick={onOpenTableModal}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#E8E2D8] bg-white text-[#44403C] hover:border-[#D6CEC1] transition-all flex items-center gap-1.5 whitespace-nowrap"
            >
              <span className="w-2 h-2 rounded-full bg-[#E05A47]"></span>
              <span>{selectedTable ? `Table ${selectedTable.table_number}` : 'Select Table'}</span>
            </button>
          )}

          {/* Cart Button */}
          {isCustomerPage && (
            <button
              onClick={() => onNavigate('/cart')}
              className="relative px-3.5 py-2 text-xs font-semibold text-white bg-[#E05A47] hover:bg-[#cf4e3b] rounded-lg transition-all flex items-center gap-2 shadow-xs whitespace-nowrap"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart</span>
              {totalItemsCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold bg-white text-[#E05A47] rounded-full">
                  {totalItemsCount}
                </span>
              )}
            </button>
          )}

          {/* Staff Profile / Quick Login */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-[#E8E2D8]">
              <div className="hidden sm:block text-right">
                <span className="block text-xs font-semibold text-[#1E1B18] truncate max-w-[120px]">
                  {user.full_name.split(' ')[0]}
                </span>
                <span className="block text-[10px] uppercase font-bold text-[#E05A47]">
                  {user.role}
                </span>
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 text-[#78716C] hover:text-[#E05A47] hover:bg-[#F3EFEA] rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('/login')}
              className="text-xs font-medium px-3 py-2 text-[#44403C] hover:text-[#1E1B18] hover:bg-[#F3EFEA] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Staff Sign In</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
