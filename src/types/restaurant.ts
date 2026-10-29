export type UserRole = 'admin' | 'manager' | 'kitchen';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface RestaurantSettings {
  id: string;
  name: string;
  tagline: string;
  description: string;
  logo_url: string;
  hero_image_url: string;
  phone: string;
  email: string;
  address: string;
  opening_time: string;
  closing_time: string;
  currency: string;
  currency_symbol: string;
  timezone: string;
  tax_rate_percent: number;
  service_charge_percent: number;
  default_prep_time_minutes: number;
  pay_at_counter_instructions: string;
  order_acceptance_enabled: boolean;
  website_primary_color: string;
  social_links: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  terms_notice: string;
  privacy_notice: string;
  cancellation_policy: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  display_order: number;
  is_active: boolean;
  item_count?: number;
}

export interface MenuItemVariant {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
  is_available: boolean;
  display_order: number;
}

export interface MenuItemAddon {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
  is_available: boolean;
  display_order: number;
}

export interface MenuItem {
  id: string;
  category_id: string;
  category_name?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image_url: string;
  is_veg: boolean;
  is_available: boolean;
  is_featured: boolean;
  prep_time_minutes: number;
  display_order: number;
  variants: MenuItemVariant[];
  addons: MenuItemAddon[];
  created_at: string;
}

export interface RestaurantTable {
  id: string;
  table_number: string;
  display_name: string;
  capacity: number;
  is_active: boolean;
  qr_code_identifier: string;
  active_order_count?: number;
  created_at: string;
}

export type OrderStatus = 'new' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'rejected' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';
export type PaymentMethod = 'pay_at_counter' | 'cash' | 'upi' | 'card';

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name: string;
  variant_name?: string;
  price: number;
  quantity: number;
  total_price: number;
  selected_addons: {
    name: string;
    price: number;
  }[];
  special_instructions?: string;
}

export interface OrderStatusHistoryItem {
  id: string;
  order_id: string;
  previous_status: OrderStatus | null;
  new_status: OrderStatus;
  changed_by: string;
  change_notes?: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  table_id: string;
  table_number: string;
  table_display_name: string;
  customer_name: string;
  customer_phone: string;
  order_notes?: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  subtotal: number;
  discount_amount: number;
  coupon_code?: string;
  tax_amount: number;
  service_charge_amount: number;
  total_amount: number;
  estimated_prep_minutes: number;
  rejection_reason?: string;
  cancellation_reason?: string;
  items: OrderItem[];
  status_history: OrderStatusHistoryItem[];
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number;
  is_active: boolean;
  valid_from: string;
  valid_until?: string;
  usage_limit?: number;
  usage_count: number;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  before_state?: any;
  after_state?: any;
  ip_address?: string;
  created_at: string;
}

export interface CartItem {
  cart_id: string;
  menu_item: MenuItem;
  selected_variant?: MenuItemVariant;
  selected_addons: MenuItemAddon[];
  quantity: number;
  special_instructions?: string;
  calculated_unit_price: number;
}

export interface CreateOrderPayload {
  table_id: string;
  customer_name: string;
  customer_phone: string;
  order_notes?: string;
  coupon_code?: string;
  idempotency_key?: string;
  items: {
    menu_item_id: string;
    variant_id?: string;
    addon_ids?: string[];
    quantity: number;
    special_instructions?: string;
  }[];
}
