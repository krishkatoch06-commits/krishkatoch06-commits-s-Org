import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, MenuItem, MenuItemVariant, MenuItemAddon, RestaurantTable, RestaurantSettings } from '../types/restaurant';
import { api } from './api';

interface CartContextType {
  items: CartItem[];
  selectedTable: RestaurantTable | null;
  setSelectedTable: (table: RestaurantTable | null) => void;
  addItem: (item: MenuItem, variant?: MenuItemVariant, addons?: MenuItemAddon[], quantity?: number, instructions?: string) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, delta: number) => void;
  clearCart: () => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  orderNotes: string;
  setOrderNotes: (notes: string) => void;
  appliedCoupon: { code: string; discount_amount: number; description: string } | null;
  applyCouponCode: (code: string) => Promise<void>;
  removeCoupon: () => void;
  couponError: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  serviceCharge: number;
  total: number;
  totalItemsCount: number;
  settings: RestaurantSettings | null;
  refreshSettings: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('demo_restaurant_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(() => {
    try {
      const saved = localStorage.getItem('demo_restaurant_table');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [customerName, setCustomerName] = useState(() => localStorage.getItem('demo_cust_name') || '');
  const [customerPhone, setCustomerPhone] = useState(() => localStorage.getItem('demo_cust_phone') || '');
  const [orderNotes, setOrderNotes] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_amount: number; description: string } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);

  // Load restaurant settings for tax and service charge rates
  const refreshSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings', err);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  // Save cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem('demo_restaurant_cart', JSON.stringify(items));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [items]);

  useEffect(() => {
    try {
      if (selectedTable) {
        localStorage.setItem('demo_restaurant_table', JSON.stringify(selectedTable));
      } else {
        localStorage.removeItem('demo_restaurant_table');
      }
    } catch {}
  }, [selectedTable]);

  useEffect(() => {
    try {
      localStorage.setItem('demo_cust_name', customerName);
      localStorage.setItem('demo_cust_phone', customerPhone);
    } catch {}
  }, [customerName, customerPhone]);

  const addItem = (
    item: MenuItem,
    variant?: MenuItemVariant,
    addons: MenuItemAddon[] = [],
    quantity: number = 1,
    instructions?: string
  ) => {
    const unitPrice = (variant ? variant.price : item.price) +
      addons.reduce((sum, a) => sum + a.price, 0);

    const cartId = `${item.id}-${variant?.id || 'base'}-${addons.map(a => a.id).sort().join('_')}-${instructions || ''}`;

    setItems(prev => {
      const existingIdx = prev.findIndex(i => i.cart_id === cartId);
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].quantity += quantity;
        return next;
      }
      return [
        ...prev,
        {
          cart_id: cartId,
          menu_item: item,
          selected_variant: variant,
          selected_addons: addons,
          quantity,
          special_instructions: instructions,
          calculated_unit_price: unitPrice
        }
      ];
    });
  };

  const removeItem = (cartId: string) => {
    setItems(prev => prev.filter(i => i.cart_id !== cartId));
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setItems(prev =>
      prev
        .map(i => {
          if (i.cart_id === cartId) {
            const nextQty = i.quantity + delta;
            return nextQty > 0 ? { ...i, quantity: nextQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setOrderNotes('');
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (item.calculated_unit_price * item.quantity), 0);
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const applyCouponCode = async (code: string) => {
    setCouponError(null);
    try {
      const result = await api.validateCoupon(code, subtotal);
      setAppliedCoupon(result);
    } catch (err: any) {
      setCouponError(err.message || 'Invalid coupon');
      setAppliedCoupon(null);
      throw err;
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const discount = appliedCoupon ? Math.min(appliedCoupon.discount_amount, subtotal) : 0;
  const taxableAmount = Math.max(0, subtotal - discount);
  const taxRate = settings ? settings.tax_rate_percent : 5.0;
  const serviceRate = settings ? settings.service_charge_percent : 2.5;

  const tax = Math.round((taxableAmount * taxRate) / 100 * 100) / 100;
  const serviceCharge = Math.round((taxableAmount * serviceRate) / 100 * 100) / 100;
  const total = Math.round((taxableAmount + tax + serviceCharge) * 100) / 100;

  return (
    <CartContext.Provider
      value={{
        items,
        selectedTable,
        setSelectedTable,
        addItem,
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
        totalItemsCount,
        settings,
        refreshSettings
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
