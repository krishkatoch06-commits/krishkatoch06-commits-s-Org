/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider } from './lib/auth';
import { CartProvider } from './lib/cart';
import { Navbar } from './components/common/Navbar';
import { TableSelectorModal } from './components/customer/TableSelectorModal';
import { QRModal } from './components/customer/QRModal';
import { MenuPage } from './pages/customer/MenuPage';
import { CartPage } from './pages/customer/CartPage';
import { OrderTrackingPage } from './pages/customer/OrderTrackingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { KitchenPage } from './pages/kitchen/KitchenPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminMenuPage } from './pages/admin/AdminMenuPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminTablesPage } from './pages/admin/AdminTablesPage';
import { AdminPromotionsPage } from './pages/admin/AdminPromotionsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminStaffPage } from './pages/admin/AdminStaffPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      return path === '/' ? '/menu' : path;
    }
    return '/menu';
  });

  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // Sync browser history
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      setCurrentPath(path === '/' ? '/menu' : path);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route matcher
  const renderRoute = () => {
    // Customer Routes
    if (currentPath === '/menu' || currentPath === '/') {
      return (
        <MenuPage
          onNavigate={navigate}
          onOpenTableModal={() => setIsTableModalOpen(true)}
          onOpenQRModal={() => setIsQRModalOpen(true)}
        />
      );
    }

    if (currentPath === '/cart') {
      return (
        <CartPage
          onNavigate={navigate}
          onOpenTableModal={() => setIsTableModalOpen(true)}
        />
      );
    }

    if (currentPath.startsWith('/order/')) {
      const orderId = currentPath.replace('/order/', '');
      return <OrderTrackingPage orderId={orderId} onNavigate={navigate} />;
    }

    // Auth Route
    if (currentPath === '/login') {
      return <LoginPage onNavigate={navigate} />;
    }

    // Kitchen Route
    if (currentPath === '/kitchen') {
      return <KitchenPage />;
    }

    // Admin Routes
    if (currentPath.startsWith('/admin')) {
      let adminContent = <AdminOverviewPage onNavigate={navigate} />;

      if (currentPath === '/admin/menu') {
        adminContent = <AdminMenuPage />;
      } else if (currentPath === '/admin/orders') {
        adminContent = <AdminOrdersPage />;
      } else if (currentPath === '/admin/tables') {
        adminContent = <AdminTablesPage />;
      } else if (currentPath === '/admin/promotions') {
        adminContent = <AdminPromotionsPage />;
      } else if (currentPath === '/admin/reports') {
        adminContent = <AdminReportsPage />;
      } else if (currentPath === '/admin/staff') {
        adminContent = <AdminStaffPage />;
      } else if (currentPath === '/admin/settings') {
        adminContent = <AdminSettingsPage />;
      } else if (currentPath === '/admin/audit-logs') {
        adminContent = <AdminAuditLogsPage />;
      }

      return (
        <AdminLayout currentPath={currentPath} onNavigate={navigate}>
          {adminContent}
        </AdminLayout>
      );
    }

    // Fallback to /menu
    return (
      <MenuPage
        onNavigate={navigate}
        onOpenTableModal={() => setIsTableModalOpen(true)}
        onOpenQRModal={() => setIsQRModalOpen(true)}
      />
    );
  };

  const isAdminRoute = currentPath.startsWith('/admin');

  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#1E1B18]">
          {/* Top Navbar rendered for non-admin pages */}
          {!isAdminRoute && (
            <Navbar
              currentPath={currentPath}
              onNavigate={navigate}
              onOpenTableModal={() => setIsTableModalOpen(true)}
              onOpenQRModal={() => setIsQRModalOpen(true)}
            />
          )}

          {/* Main Route Content */}
          <div className="flex-1">
            {renderRoute()}
          </div>

          {/* Global Table Selector Modal */}
          <TableSelectorModal
            isOpen={isTableModalOpen}
            onClose={() => setIsTableModalOpen(false)}
          />

          {/* Interactive QR Code Order Modal */}
          <QRModal
            isOpen={isQRModalOpen}
            onClose={() => setIsQRModalOpen(false)}
            onSelectTableAndOrder={(table) => {
              setIsQRModalOpen(false);
              navigate('/menu');
            }}
          />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}
