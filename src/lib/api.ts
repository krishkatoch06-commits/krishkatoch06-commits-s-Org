import {
  RestaurantSettings,
  MenuCategory,
  MenuItem,
  RestaurantTable,
  Order,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  Coupon,
  AuditLog,
  UserProfile,
  CreateOrderPayload
} from '../types/restaurant';

const API_BASE = '/api';

class ApiClient {
  private getAuthHeader(): Record<string, string> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('demo_restaurant_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeader(),
      ...(options.headers || {})
    };

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const json = await res.json();
    if (!res.ok || json.success === false) {
      throw new Error(json.error || 'Server request failed');
    }

    return json.data !== undefined ? json.data : json;
  }

  // Restaurant Settings
  async getSettings(): Promise<RestaurantSettings> {
    return this.request<RestaurantSettings>('/settings');
  }

  async updateSettings(data: Partial<RestaurantSettings>, actingUserName?: string): Promise<RestaurantSettings> {
    return this.request<RestaurantSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify({ ...data, _acting_user_name: actingUserName })
    });
  }

  // Tables
  async getTables(activeOnly = false): Promise<RestaurantTable[]> {
    return this.request<RestaurantTable[]>(`/tables?active_only=${activeOnly}`);
  }

  async createTable(data: Partial<RestaurantTable>, actingUserName?: string): Promise<RestaurantTable> {
    return this.request<RestaurantTable>('/tables', {
      method: 'POST',
      body: JSON.stringify({ ...data, _acting_user_name: actingUserName })
    });
  }

  async updateTable(id: string, data: Partial<RestaurantTable>, actingUserName?: string): Promise<RestaurantTable> {
    return this.request<RestaurantTable>(`/tables/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, _acting_user_name: actingUserName })
    });
  }

  async deleteTable(id: string, actingUserName?: string): Promise<RestaurantTable> {
    return this.request<RestaurantTable>(`/tables/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ _acting_user_name: actingUserName })
    });
  }

  // Categories
  async getCategories(activeOnly = false): Promise<MenuCategory[]> {
    return this.request<MenuCategory[]>(`/menu/categories?active_only=${activeOnly}`);
  }

  async createCategory(data: Partial<MenuCategory>, actingUserName?: string): Promise<MenuCategory> {
    return this.request<MenuCategory>('/menu/categories', {
      method: 'POST',
      body: JSON.stringify({ ...data, _acting_user_name: actingUserName })
    });
  }

  async updateCategory(id: string, data: Partial<MenuCategory>, actingUserName?: string): Promise<MenuCategory> {
    return this.request<MenuCategory>(`/menu/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, _acting_user_name: actingUserName })
    });
  }

  async deleteCategory(id: string, actingUserName?: string): Promise<MenuCategory> {
    return this.request<MenuCategory>(`/menu/categories/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ _acting_user_name: actingUserName })
    });
  }

  // Menu Items
  async getMenuItems(availableOnly = false, categoryId?: string): Promise<MenuItem[]> {
    let url = `/menu/items?available_only=${availableOnly}`;
    if (categoryId) url += `&category_id=${categoryId}`;
    return this.request<MenuItem[]>(url);
  }

  async createMenuItem(data: any, actingUserName?: string): Promise<MenuItem> {
    return this.request<MenuItem>('/menu/items', {
      method: 'POST',
      body: JSON.stringify({ ...data, _acting_user_name: actingUserName })
    });
  }

  async updateMenuItem(id: string, data: any, actingUserName?: string): Promise<MenuItem> {
    return this.request<MenuItem>(`/menu/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, _acting_user_name: actingUserName })
    });
  }

  async deleteMenuItem(id: string, actingUserName?: string): Promise<MenuItem> {
    return this.request<MenuItem>(`/menu/items/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ _acting_user_name: actingUserName })
    });
  }

  async bulkToggleItemsAvailability(itemIds: string[], isAvailable: boolean): Promise<any> {
    return this.request('/menu/items/bulk-toggle', {
      method: 'POST',
      body: JSON.stringify({ item_ids: itemIds, is_available: isAvailable })
    });
  }

  // Coupons
  async getCoupons(activeOnly = false): Promise<Coupon[]> {
    return this.request<Coupon[]>(`/coupons?active_only=${activeOnly}`);
  }

  async createCoupon(data: Partial<Coupon>, actingUserName?: string): Promise<Coupon> {
    return this.request<Coupon>('/coupons', {
      method: 'POST',
      body: JSON.stringify({ ...data, _acting_user_name: actingUserName })
    });
  }

  async updateCoupon(id: string, data: Partial<Coupon>, actingUserName?: string): Promise<Coupon> {
    return this.request<Coupon>(`/coupons/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, _acting_user_name: actingUserName })
    });
  }

  async deleteCoupon(id: string): Promise<Coupon> {
    return this.request<Coupon>(`/coupons/${id}`, {
      method: 'DELETE'
    });
  }

  async validateCoupon(code: string, subtotal: number): Promise<{ code: string; discount_amount: number; description: string }> {
    return this.request<{ code: string; discount_amount: number; description: string }>('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal })
    });
  }

  // Orders
  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    return this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async getOrder(id: string): Promise<Order> {
    return this.request<Order>(`/orders/${id}`);
  }

  async getOrders(params: {
    status?: string;
    table_id?: string;
    payment_status?: string;
    search?: string;
    start_date?: string;
    end_date?: string;
  } = {}): Promise<Order[]> {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.table_id) query.set('table_id', params.table_id);
    if (params.payment_status) query.set('payment_status', params.payment_status);
    if (params.search) query.set('search', params.search);
    if (params.start_date) query.set('start_date', params.start_date);
    if (params.end_date) query.set('end_date', params.end_date);

    return this.request<Order[]>(`/orders?${query.toString()}`);
  }

  async updateOrderStatus(id: string, data: {
    status: OrderStatus;
    rejection_reason?: string;
    cancellation_reason?: string;
    changed_by?: string;
    notes?: string;
  }): Promise<Order> {
    return this.request<Order>(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async updateOrderPayment(id: string, data: {
    payment_status?: PaymentStatus;
    payment_method?: PaymentMethod;
    discount_adjustment?: number;
    acting_user_name?: string;
  }): Promise<Order> {
    return this.request<Order>(`/orders/${id}/payment`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, _acting_user_name: data.acting_user_name })
    });
  }

  // Analytics & Reports
  async getAnalytics(): Promise<any> {
    return this.request<any>('/reports/analytics');
  }

  // Staff
  async getStaff(): Promise<UserProfile[]> {
    return this.request<UserProfile[]>('/staff');
  }

  async createStaff(data: Partial<UserProfile>, actingUserName?: string): Promise<UserProfile> {
    return this.request<UserProfile>('/staff', {
      method: 'POST',
      body: JSON.stringify({ ...data, _acting_user_name: actingUserName })
    });
  }

  async updateStaff(id: string, data: Partial<UserProfile>, actingUserName?: string): Promise<UserProfile> {
    return this.request<UserProfile>(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, _acting_user_name: actingUserName })
    });
  }

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    return this.request<AuditLog[]>('/audit-logs');
  }

  // Auth Login
  async login(credentials: { email?: string; password?: string; demo_role?: string }): Promise<{ user: UserProfile; token: string }> {
    return this.request<{ user: UserProfile; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  // Supabase Status
  async getSupabaseStatus(): Promise<any> {
    return this.request<any>('/supabase/status');
  }

  // Realtime SSE event listener
  subscribeToRealtime(onEvent: (event: string, data: any) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const eventSource = new EventSource('/api/realtime/orders');

    const handleOrderCreated = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        onEvent('order_created', data);
      } catch (err) {
        console.error('SSE JSON error', err);
      }
    };

    const handleOrderStatusUpdated = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        onEvent('order_status_updated', data);
      } catch (err) {
        console.error('SSE JSON error', err);
      }
    };

    const handleSettingsUpdated = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        onEvent('settings_updated', data);
      } catch (err) {
        console.error('SSE JSON error', err);
      }
    };

    eventSource.addEventListener('order_created', handleOrderCreated);
    eventSource.addEventListener('order_status_updated', handleOrderStatusUpdated);
    eventSource.addEventListener('settings_updated', handleSettingsUpdated);

    return () => {
      eventSource.removeEventListener('order_created', handleOrderCreated);
      eventSource.removeEventListener('order_status_updated', handleOrderStatusUpdated);
      eventSource.removeEventListener('settings_updated', handleSettingsUpdated);
      eventSource.close();
    };
  }
}

export const api = new ApiClient();
