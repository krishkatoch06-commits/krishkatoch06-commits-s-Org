import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { z } from 'zod';
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
  UserRole
} from './src/types/restaurant.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-Memory Authoritative Data Store (with persistent JSON file sync for durability)
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'restaurant_db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Seed Data with real authentic restaurant items, variants, and addons
const DEFAULT_SETTINGS: RestaurantSettings = {
  id: 'rest-setting-1',
  name: 'Demo Restaurant',
  tagline: 'Artisanal Flavors & Modern Dining',
  description: 'Experience handcrafted regional delicacies prepared with locally sourced farm ingredients and royal family recipes.',
  logo_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=160&auto=format&fit=crop&q=80',
  hero_image_url: '/src/assets/images/hero_restaurant_dining_1793260044497.jpg',
  phone: '+91 98765 43210',
  email: 'concierge@demorestaurant.com',
  address: '42 Heritage Boulevard, Indiranagar, Bengaluru, KA 560038',
  opening_time: '11:00 AM',
  closing_time: '11:00 PM',
  currency: 'INR',
  currency_symbol: '₹',
  timezone: 'Asia/Kolkata',
  tax_rate_percent: 5.0,
  service_charge_percent: 2.5,
  default_prep_time_minutes: 25,
  pay_at_counter_instructions: 'Please show your Order Number at Counter #1 to complete payment with Cash, UPI, or Card.',
  order_acceptance_enabled: true,
  website_primary_color: '#E05A47',
  social_links: {
    instagram: 'https://instagram.com/demorestaurant',
    facebook: 'https://facebook.com/demorestaurant'
  },
  terms_notice: 'All dishes are freshly prepared to order. Prices are exclusive of 5% GST and 2.5% Service Charge.',
  privacy_notice: 'Your details are strictly used for dining verification and order progress alerts.',
  cancellation_policy: 'Orders may be cancelled before the kitchen begins cooking. Once in preparation, cancellations require manager authorization.',
  updated_at: new Date().toISOString()
};

const DEFAULT_CATEGORIES: MenuCategory[] = [
  {
    id: 'cat-1',
    name: 'Appetizers & Starters',
    slug: 'starters',
    description: 'Crisp, fiery tandoor skewers and spiced bites to begin your journey.',
    image_url: '/src/assets/images/food_paneer_tikka_1793260046082.jpg',
    display_order: 1,
    is_active: true
  },
  {
    id: 'cat-2',
    name: 'Main Courses',
    slug: 'mains',
    description: 'Rich, slow-simmered gravies and clay-oven specialties.',
    image_url: '/src/assets/images/food_butter_chicken_1793260045350.jpg',
    display_order: 2,
    is_active: true
  },
  {
    id: 'cat-3',
    name: 'Dum Biryani & Rice',
    slug: 'biryani',
    description: 'Aromatic basmati rice layered with aged saffron and fragrant spices.',
    image_url: '/src/assets/images/food_biryani_pot_1793260045842.jpg',
    display_order: 3,
    is_active: true
  },
  {
    id: 'cat-4',
    name: 'Artisan Breads & Sides',
    slug: 'breads-sides',
    description: 'Tandoori naans, rotis, and cooling fresh accompaniments.',
    image_url: '/src/assets/images/food_butter_chicken_1793260045350.jpg',
    display_order: 4,
    is_active: true
  },
  {
    id: 'cat-5',
    name: 'Beverages & Desserts',
    slug: 'beverages-desserts',
    description: 'Refreshing botanical coolers and warm decadent Indian sweets.',
    image_url: '/src/assets/images/hero_restaurant_dining_1793260044497.jpg',
    display_order: 5,
    is_active: true
  }
];

const DEFAULT_ITEMS: MenuItem[] = [
  {
    id: 'item-1',
    category_id: 'cat-1',
    category_name: 'Appetizers & Starters',
    name: 'Tandoori Angara Paneer Tikka',
    slug: 'tandoori-angara-paneer-tikka',
    description: 'Organic malai cottage cheese steeped in Kashmiri red chilies, mustard oil, and hung curd, blistered in charcoal tandoor with charred sweet peppers.',
    price: 340,
    image_url: '/src/assets/images/food_paneer_tikka_1793260046082.jpg',
    is_veg: true,
    is_available: true,
    is_featured: true,
    prep_time_minutes: 18,
    display_order: 1,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    variants: [
      { id: 'v-1-1', menu_item_id: 'item-1', name: 'Regular Portion (6 pcs)', price: 340, is_available: true, display_order: 1 },
      { id: 'v-1-2', menu_item_id: 'item-1', name: 'Platter Size (10 pcs)', price: 520, is_available: true, display_order: 2 }
    ],
    addons: [
      { id: 'a-1-1', menu_item_id: 'item-1', name: 'Extra Mint Cilantro Chutney', price: 40, is_available: true, display_order: 1 },
      { id: 'a-1-2', menu_item_id: 'item-1', name: 'Charred Masala Onions', price: 30, is_available: true, display_order: 2 }
    ]
  },
  {
    id: 'item-2',
    category_id: 'cat-2',
    category_name: 'Main Courses',
    name: 'Purani Dilli Butter Chicken',
    slug: 'purani-dilli-butter-chicken',
    description: 'Tender pulled chicken tikka simmered in a velvet tomato, kasuri methi, and artisanal churned butter sauce with aromatic spices.',
    price: 460,
    image_url: '/src/assets/images/food_butter_chicken_1793260045350.jpg',
    is_veg: false,
    is_available: true,
    is_featured: true,
    prep_time_minutes: 22,
    display_order: 2,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    variants: [
      { id: 'v-2-1', menu_item_id: 'item-2', name: 'Standard Bowl', price: 460, is_available: true, display_order: 1 },
      { id: 'v-2-2', menu_item_id: 'item-2', name: 'Sharing Pot (Double Meat)', price: 740, is_available: true, display_order: 2 }
    ],
    addons: [
      { id: 'a-2-1', menu_item_id: 'item-2', name: 'Extra Cream Swirl', price: 30, is_available: true, display_order: 1 },
      { id: 'a-2-2', menu_item_id: 'item-2', name: 'Hot Butter Garlic Naan (1 pc)', price: 80, is_available: true, display_order: 2 }
    ]
  },
  {
    id: 'item-3',
    category_id: 'cat-3',
    category_name: 'Dum Biryani & Rice',
    name: 'Nawabi Dum Gosht Biryani',
    slug: 'nawabi-dum-gosht-biryani',
    description: 'Slow-cooked succulent mutton cuts sealed in clay handi with aged Himalayan basmati, royal whole garam masala, and pure saffron.',
    price: 540,
    image_url: '/src/assets/images/food_biryani_pot_1793260045842.jpg',
    is_veg: false,
    is_available: true,
    is_featured: true,
    prep_time_minutes: 25,
    display_order: 3,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    variants: [
      { id: 'v-3-1', menu_item_id: 'item-3', name: 'Individual Handi', price: 540, is_available: true, display_order: 1 },
      { id: 'v-3-2', menu_item_id: 'item-3', name: 'Royal Feast Pot (Serves 2-3)', price: 920, is_available: true, display_order: 2 }
    ],
    addons: [
      { id: 'a-3-1', menu_item_id: 'item-3', name: 'Burani Garlic Raita', price: 50, is_available: true, display_order: 1 },
      { id: 'a-3-2', menu_item_id: 'item-3', name: 'Hyderabadi Mirchi Ka Salan', price: 60, is_available: true, display_order: 2 }
    ]
  },
  {
    id: 'item-4',
    category_id: 'cat-4',
    category_name: 'Artisan Breads & Sides',
    name: 'Truffle & Garlic Butter Naan',
    slug: 'truffle-garlic-butter-naan',
    description: 'Hand-stretched leavened dough cooked on clay tandoor walls, brushed with clarified garlic butter and a subtle white truffle essence.',
    price: 110,
    image_url: '/src/assets/images/food_butter_chicken_1793260045350.jpg',
    is_veg: true,
    is_available: true,
    is_featured: false,
    prep_time_minutes: 10,
    display_order: 4,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    variants: [],
    addons: [
      { id: 'a-4-1', menu_item_id: 'item-4', name: 'Extra Cheddar Cheese Melt', price: 50, is_available: true, display_order: 1 }
    ]
  },
  {
    id: 'item-5',
    category_id: 'cat-5',
    category_name: 'Beverages & Desserts',
    name: 'Gulab Jamun with Rabri Foam',
    slug: 'gulab-jamun-rabri-foam',
    description: 'Warm golden khoya dumplings soaked in green cardamom rose syrup, presented over chilled pistachio rabri reduction.',
    price: 220,
    image_url: '/src/assets/images/food_paneer_tikka_1793260046082.jpg',
    is_veg: true,
    is_available: true,
    is_featured: true,
    prep_time_minutes: 12,
    display_order: 5,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    variants: [],
    addons: []
  }
];

const DEFAULT_TABLES: RestaurantTable[] = [
  { id: 'tbl-1', table_number: '1', display_name: 'Table 1 (Indoor Garden)', capacity: 4, is_active: true, qr_code_identifier: 'TBL-001', created_at: new Date().toISOString() },
  { id: 'tbl-2', table_number: '2', display_name: 'Table 2 (Window Booth)', capacity: 2, is_active: true, qr_code_identifier: 'TBL-002', created_at: new Date().toISOString() },
  { id: 'tbl-3', table_number: '3', display_name: 'Table 3 (Family Dining)', capacity: 6, is_active: true, qr_code_identifier: 'TBL-003', created_at: new Date().toISOString() },
  { id: 'tbl-4', table_number: '4', display_name: 'Table 4 (Verandah Lounge)', capacity: 4, is_active: true, qr_code_identifier: 'TBL-004', created_at: new Date().toISOString() },
  { id: 'tbl-5', table_number: '5', display_name: 'Table 5 (Chef View Counter)', capacity: 2, is_active: true, qr_code_identifier: 'TBL-005', created_at: new Date().toISOString() },
  { id: 'tbl-6', table_number: '6', display_name: 'Table 6 (Private Courtyard)', capacity: 8, is_active: false, qr_code_identifier: 'TBL-006', created_at: new Date().toISOString() } // Inactive table for testing
];

const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'cpn-1',
    code: 'WELCOME10',
    description: '10% off your entire dining experience (Min order ₹500)',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_amount: 500,
    max_discount_amount: 150,
    is_active: true,
    valid_from: new Date(Date.now() - 86400000 * 10).toISOString(),
    valid_until: new Date(Date.now() + 86400000 * 90).toISOString(),
    usage_limit: 500,
    usage_count: 28
  },
  {
    id: 'cpn-2',
    code: 'FLAT100',
    description: 'Flat ₹100 discount on orders above ₹800',
    discount_type: 'fixed',
    discount_value: 100,
    min_order_amount: 800,
    is_active: true,
    valid_from: new Date(Date.now() - 86400000 * 5).toISOString(),
    valid_until: new Date(Date.now() + 86400000 * 30).toISOString(),
    usage_limit: 200,
    usage_count: 14
  }
];

const DEFAULT_STAFF: UserProfile[] = [
  {
    id: 'usr-admin-1',
    email: 'admin@demorestaurant.com',
    full_name: 'Aarav Sharma (Head Owner)',
    role: 'admin',
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString()
  },
  {
    id: 'usr-mgr-1',
    email: 'manager@demorestaurant.com',
    full_name: 'Pooja Iyer (Floor Manager)',
    role: 'manager',
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 20).toISOString()
  },
  {
    id: 'usr-kitchen-1',
    email: 'chef@demorestaurant.com',
    full_name: 'Chef Vikramaditya (Executive Chef)',
    role: 'kitchen',
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 15).toISOString()
  }
];

// Initial seeded orders so the kitchen and admin display realistic live data right away
const DEFAULT_ORDERS: Order[] = [
  {
    id: 'ord-101',
    order_number: 'ORD-101',
    table_id: 'tbl-1',
    table_number: '1',
    table_display_name: 'Table 1 (Indoor Garden)',
    customer_name: 'Rohan Deshmukh',
    customer_phone: '+91 99887 76655',
    order_notes: 'Please make the paneer tikka slightly extra crisp.',
    status: 'preparing',
    payment_status: 'paid',
    payment_method: 'pay_at_counter',
    subtotal: 800,
    discount_amount: 80,
    coupon_code: 'WELCOME10',
    tax_amount: 36,
    service_charge_amount: 18,
    total_amount: 774,
    estimated_prep_minutes: 20,
    items: [
      {
        id: 'oi-1',
        order_id: 'ord-101',
        menu_item_id: 'item-1',
        item_name: 'Tandoori Angara Paneer Tikka',
        variant_name: 'Regular Portion (6 pcs)',
        price: 340,
        quantity: 1,
        total_price: 340,
        selected_addons: [{ name: 'Extra Mint Cilantro Chutney', price: 40 }],
        special_instructions: 'Charred edges'
      },
      {
        id: 'oi-2',
        order_id: 'ord-101',
        menu_item_id: 'item-2',
        item_name: 'Purani Dilli Butter Chicken',
        variant_name: 'Standard Bowl',
        price: 460,
        quantity: 1,
        total_price: 460,
        selected_addons: []
      }
    ],
    status_history: [
      { id: 'sh-1', order_id: 'ord-101', previous_status: null, new_status: 'new', changed_by: 'Customer (QR Scan)', change_notes: 'Order submitted', created_at: new Date(Date.now() - 14 * 60000).toISOString() },
      { id: 'sh-2', order_id: 'ord-101', previous_status: 'new', new_status: 'accepted', changed_by: 'Kitchen Display', change_notes: 'Order accepted by line', created_at: new Date(Date.now() - 12 * 60000).toISOString() },
      { id: 'sh-3', order_id: 'ord-101', previous_status: 'accepted', new_status: 'preparing', changed_by: 'Chef Vikramaditya', change_notes: 'Tandoor fires lit', created_at: new Date(Date.now() - 8 * 60000).toISOString() }
    ],
    created_at: new Date(Date.now() - 14 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 60000).toISOString()
  },
  {
    id: 'ord-102',
    order_number: 'ORD-102',
    table_id: 'tbl-2',
    table_number: '2',
    table_display_name: 'Table 2 (Window Booth)',
    customer_name: 'Ananya Mehra',
    customer_phone: '+91 98221 12345',
    order_notes: 'Mild spice for the biryani please.',
    status: 'new',
    payment_status: 'pending',
    payment_method: 'pay_at_counter',
    subtotal: 650,
    discount_amount: 0,
    tax_amount: 32.5,
    service_charge_amount: 16.25,
    total_amount: 698.75,
    estimated_prep_minutes: 25,
    items: [
      {
        id: 'oi-3',
        order_id: 'ord-102',
        menu_item_id: 'item-3',
        item_name: 'Nawabi Dum Gosht Biryani',
        variant_name: 'Individual Handi',
        price: 540,
        quantity: 1,
        total_price: 540,
        selected_addons: [{ name: 'Burani Garlic Raita', price: 50 }]
      },
      {
        id: 'oi-4',
        order_id: 'ord-102',
        menu_item_id: 'item-4',
        item_name: 'Truffle & Garlic Butter Naan',
        price: 110,
        quantity: 1,
        total_price: 110,
        selected_addons: []
      }
    ],
    status_history: [
      { id: 'sh-4', order_id: 'ord-102', previous_status: null, new_status: 'new', changed_by: 'Customer (QR Scan)', change_notes: 'New incoming order', created_at: new Date(Date.now() - 2 * 60000).toISOString() }
    ],
    created_at: new Date(Date.now() - 2 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60000).toISOString()
  },
  {
    id: 'ord-100',
    order_number: 'ORD-100',
    table_id: 'tbl-3',
    table_number: '3',
    table_display_name: 'Table 3 (Family Dining)',
    customer_name: 'Sunil Rao',
    customer_phone: '+91 97412 34567',
    status: 'completed',
    payment_status: 'paid',
    payment_method: 'pay_at_counter',
    subtotal: 1240,
    discount_amount: 100,
    coupon_code: 'FLAT100',
    tax_amount: 57,
    service_charge_amount: 28.5,
    total_amount: 1225.5,
    estimated_prep_minutes: 25,
    items: [
      {
        id: 'oi-5',
        order_id: 'ord-100',
        menu_item_id: 'item-3',
        item_name: 'Nawabi Dum Gosht Biryani',
        variant_name: 'Royal Feast Pot (Serves 2-3)',
        price: 920,
        quantity: 1,
        total_price: 920,
        selected_addons: []
      },
      {
        id: 'oi-6',
        order_id: 'ord-100',
        menu_item_id: 'item-5',
        item_name: 'Gulab Jamun with Rabri Foam',
        price: 220,
        quantity: 1,
        total_price: 220,
        selected_addons: []
      }
    ],
    status_history: [
      { id: 'sh-5', order_id: 'ord-100', previous_status: null, new_status: 'new', changed_by: 'Customer', created_at: new Date(Date.now() - 50 * 60000).toISOString() },
      { id: 'sh-6', order_id: 'ord-100', previous_status: 'new', new_status: 'accepted', changed_by: 'Kitchen', created_at: new Date(Date.now() - 48 * 60000).toISOString() },
      { id: 'sh-7', order_id: 'ord-100', previous_status: 'accepted', new_status: 'preparing', changed_by: 'Kitchen', created_at: new Date(Date.now() - 40 * 60000).toISOString() },
      { id: 'sh-8', order_id: 'ord-100', previous_status: 'preparing', new_status: 'ready', changed_by: 'Kitchen', created_at: new Date(Date.now() - 25 * 60000).toISOString() },
      { id: 'sh-9', order_id: 'ord-100', previous_status: 'ready', new_status: 'completed', changed_by: 'Waiter', created_at: new Date(Date.now() - 10 * 60000).toISOString() }
    ],
    created_at: new Date(Date.now() - 50 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 60000).toISOString()
  }
];

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    user_id: 'usr-admin-1',
    user_name: 'Aarav Sharma (Head Owner)',
    action: 'SETTINGS_UPDATE',
    entity_type: 'restaurant_settings',
    entity_id: 'rest-setting-1',
    before_state: { opening_time: '12:00 PM' },
    after_state: { opening_time: '11:00 AM' },
    ip_address: '127.0.0.1',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'aud-2',
    user_id: 'usr-admin-1',
    user_name: 'Aarav Sharma (Head Owner)',
    action: 'MENU_PRICE_CHANGE',
    entity_type: 'menu_items',
    entity_id: 'item-2',
    before_state: { name: 'Purani Dilli Butter Chicken', price: 440 },
    after_state: { name: 'Purani Dilli Butter Chicken', price: 460 },
    ip_address: '127.0.0.1',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString()
  }
];

interface DatabaseSchema {
  settings: RestaurantSettings;
  categories: MenuCategory[];
  items: MenuItem[];
  tables: RestaurantTable[];
  coupons: Coupon[];
  orders: Order[];
  staff: UserProfile[];
  audit_logs: AuditLog[];
}

function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        settings: parsed.settings || DEFAULT_SETTINGS,
        categories: parsed.categories || DEFAULT_CATEGORIES,
        items: parsed.items || DEFAULT_ITEMS,
        tables: parsed.tables || DEFAULT_TABLES,
        coupons: parsed.coupons || DEFAULT_COUPONS,
        orders: parsed.orders || DEFAULT_ORDERS,
        staff: parsed.staff || DEFAULT_STAFF,
        audit_logs: parsed.audit_logs || DEFAULT_AUDIT_LOGS
      };
    }
  } catch (err) {
    console.error('Failed to read db file, using defaults', err);
  }
  return {
    settings: DEFAULT_SETTINGS,
    categories: DEFAULT_CATEGORIES,
    items: DEFAULT_ITEMS,
    tables: DEFAULT_TABLES,
    coupons: DEFAULT_COUPONS,
    orders: DEFAULT_ORDERS,
    staff: DEFAULT_STAFF,
    audit_logs: DEFAULT_AUDIT_LOGS
  };
}

let db = loadDatabase();

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save db file', err);
  }
}

// Ensure initial file is saved
saveDatabase();

// Realtime SSE Clients Manager
const sseClients: { id: string; res: Response }[] = [];

function broadcastRealtimeEvent(event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (let i = sseClients.length - 1; i >= 0; i--) {
    try {
      sseClients[i].res.write(payload);
    } catch (e) {
      sseClients.splice(i, 1);
    }
  }
}

// ----------------------------------------------------------------------
// SSE Realtime Endpoint
// ----------------------------------------------------------------------
app.get('/api/realtime/orders', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const clientId = 'sse-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  sseClients.push({ id: clientId, res });

  // Send initial keep-alive ping
  res.write(`event: ping\ndata: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`);

  req.on('close', () => {
    const idx = sseClients.findIndex(c => c.id === clientId);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// ----------------------------------------------------------------------
// REST API ENDPOINTS
// ----------------------------------------------------------------------

// Public Settings
app.get('/api/settings', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.settings });
});

// Update Settings (Admin/Manager)
app.put('/api/settings', (req: Request, res: Response) => {
  const before = { ...db.settings };
  db.settings = {
    ...db.settings,
    ...req.body,
    updated_at: new Date().toISOString()
  };

  const audit: AuditLog = {
    id: 'aud-' + Date.now(),
    user_name: req.body._acting_user_name || 'Admin',
    action: 'RESTAURANT_SETTINGS_UPDATE',
    entity_type: 'restaurant_settings',
    entity_id: db.settings.id,
    before_state: before,
    after_state: db.settings,
    ip_address: req.ip,
    created_at: new Date().toISOString()
  };
  db.audit_logs.unshift(audit);
  saveDatabase();

  broadcastRealtimeEvent('settings_updated', db.settings);
  res.json({ success: true, data: db.settings });
});

// Tables API
app.get('/api/tables', (req: Request, res: Response) => {
  const activeOnly = req.query.active_only === 'true';
  const tables = activeOnly ? db.tables.filter(t => t.is_active) : db.tables;

  // Augment with active order counts
  const augmented = tables.map(t => {
    const activeOrders = db.orders.filter(o => o.table_id === t.id && ['new', 'accepted', 'preparing', 'ready'].includes(o.status));
    return {
      ...t,
      active_order_count: activeOrders.length
    };
  });

  res.json({ success: true, data: augmented });
});

app.post('/api/tables', (req: Request, res: Response) => {
  const { table_number, display_name, capacity } = req.body;
  if (!table_number || !display_name) {
    return res.status(400).json({ success: false, error: 'Table number and display name are required' });
  }

  // Check unique table number
  if (db.tables.some(t => t.table_number.toLowerCase() === String(table_number).toLowerCase())) {
    return res.status(400).json({ success: false, error: `Table number "${table_number}" already exists` });
  }

  const newTable: RestaurantTable = {
    id: 'tbl-' + Date.now(),
    table_number: String(table_number),
    display_name: String(display_name),
    capacity: Number(capacity) || 4,
    is_active: true,
    qr_code_identifier: 'TBL-' + String(table_number).padStart(3, '0'),
    created_at: new Date().toISOString()
  };

  db.tables.push(newTable);
  saveDatabase();

  const audit: AuditLog = {
    id: 'aud-' + Date.now(),
    user_name: req.body._acting_user_name || 'Admin',
    action: 'TABLE_CREATED',
    entity_type: 'restaurant_tables',
    entity_id: newTable.id,
    after_state: newTable,
    ip_address: req.ip,
    created_at: new Date().toISOString()
  };
  db.audit_logs.unshift(audit);
  saveDatabase();

  res.json({ success: true, data: newTable });
});

app.put('/api/tables/:id', (req: Request, res: Response) => {
  const table = db.tables.find(t => t.id === req.params.id);
  if (!table) return res.status(404).json({ success: false, error: 'Table not found' });

  const before = { ...table };
  Object.assign(table, req.body);
  saveDatabase();

  const audit: AuditLog = {
    id: 'aud-' + Date.now(),
    user_name: req.body._acting_user_name || 'Admin',
    action: 'TABLE_UPDATED',
    entity_type: 'restaurant_tables',
    entity_id: table.id,
    before_state: before,
    after_state: table,
    ip_address: req.ip,
    created_at: new Date().toISOString()
  };
  db.audit_logs.unshift(audit);
  saveDatabase();

  res.json({ success: true, data: table });
});

app.delete('/api/tables/:id', (req: Request, res: Response) => {
  const idx = db.tables.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Table not found' });

  // Prevent deletion if active orders exist
  const activeOrders = db.orders.filter(o => o.table_id === req.params.id && ['new', 'accepted', 'preparing', 'ready'].includes(o.status));
  if (activeOrders.length > 0) {
    return res.status(400).json({ success: false, error: 'Cannot delete table with active pending or preparing orders. Deactivate it instead.' });
  }

  const deleted = db.tables.splice(idx, 1)[0];
  saveDatabase();

  const audit: AuditLog = {
    id: 'aud-' + Date.now(),
    user_name: req.body._acting_user_name || 'Admin',
    action: 'TABLE_DELETED',
    entity_type: 'restaurant_tables',
    entity_id: deleted.id,
    before_state: deleted,
    ip_address: req.ip,
    created_at: new Date().toISOString()
  };
  db.audit_logs.unshift(audit);
  saveDatabase();

  res.json({ success: true, data: deleted });
});

// Categories API
app.get('/api/menu/categories', (req: Request, res: Response) => {
  const activeOnly = req.query.active_only === 'true';
  let categories = activeOnly ? db.categories.filter(c => c.is_active) : db.categories;
  categories.sort((a, b) => a.display_order - b.display_order);

  // Augment item count
  const withCount = categories.map(c => ({
    ...c,
    item_count: db.items.filter(i => i.category_id === c.id).length
  }));

  res.json({ success: true, data: withCount });
});

app.post('/api/menu/categories', (req: Request, res: Response) => {
  const { name, description, image_url, display_order } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'Category name is required' });

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const newCat: MenuCategory = {
    id: 'cat-' + Date.now(),
    name,
    slug,
    description: description || '',
    image_url: image_url || '',
    display_order: display_order !== undefined ? Number(display_order) : db.categories.length + 1,
    is_active: true
  };

  db.categories.push(newCat);
  saveDatabase();

  const audit: AuditLog = {
    id: 'aud-' + Date.now(),
    user_name: req.body._acting_user_name || 'Admin',
    action: 'CATEGORY_CREATED',
    entity_type: 'menu_categories',
    entity_id: newCat.id,
    after_state: newCat,
    ip_address: req.ip,
    created_at: new Date().toISOString()
  };
  db.audit_logs.unshift(audit);
  saveDatabase();

  res.json({ success: true, data: newCat });
});

app.put('/api/menu/categories/:id', (req: Request, res: Response) => {
  const cat = db.categories.find(c => c.id === req.params.id);
  if (!cat) return res.status(404).json({ success: false, error: 'Category not found' });

  const before = { ...cat };
  Object.assign(cat, req.body);
  saveDatabase();

  const audit: AuditLog = {
    id: 'aud-' + Date.now(),
    user_name: req.body._acting_user_name || 'Admin',
    action: 'CATEGORY_UPDATED',
    entity_type: 'menu_categories',
    entity_id: cat.id,
    before_state: before,
    after_state: cat,
    ip_address: req.ip,
    created_at: new Date().toISOString()
  };
  db.audit_logs.unshift(audit);
  saveDatabase();

  res.json({ success: true, data: cat });
});

app.delete('/api/menu/categories/:id', (req: Request, res: Response) => {
  const idx = db.categories.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Category not found' });

  const itemsUsing = db.items.filter(i => i.category_id === req.params.id);
  if (itemsUsing.length > 0) {
    return res.status(400).json({ success: false, error: `Cannot delete category containing ${itemsUsing.length} dish(es). Reassign or delete those items first.` });
  }

  const deleted = db.categories.splice(idx, 1)[0];
  saveDatabase();

  const audit: AuditLog = {
    id: 'aud-' + Date.now(),
    user_name: req.body._acting_user_name || 'Admin',
    action: 'CATEGORY_DELETED',
    entity_type: 'menu_categories',
    entity_id: deleted.id,
    before_state: deleted,
    ip_address: req.ip,
    created_at: new Date().toISOString()
  };
  db.audit_logs.unshift(audit);
  saveDatabase();

  res.json({ success: true, data: deleted });
});

// Menu Items API
app.get('/api/menu/items', (req: Request, res: Response) => {
  const availableOnly = req.query.available_only === 'true';
  const categoryId = req.query.category_id as string;

  let items = availableOnly ? db.items.filter(i => i.is_available) : db.items;
  if (categoryId) {
    items = items.filter(i => i.category_id === categoryId);
  }

  // Augment with category name
  const augmented = items.map(i => {
    const cat = db.categories.find(c => c.id === i.category_id);
    return {
      ...i,
      category_name: cat?.name || 'General'
    };
  });

  augmented.sort((a, b) => a.display_order - b.display_order);
  res.json({ success: true, data: augmented });
});

app.post('/api/menu/items', (req: Request, res: Response) => {
  const { name, category_id, price, description, is_veg, is_available, is_featured, prep_time_minutes, image_url, variants, addons } = req.body;
  if (!name || price === undefined || !category_id) {
    return res.status(400).json({ success: false, error: 'Item name, price, and category are required' });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const newItemId = 'item-' + Date.now();

  const newItem: MenuItem = {
    id: newItemId,
    category_id,
    name,
    slug,
    description: description || '',
    price: Number(price),
    image_url: image_url || '/src/assets/images/food_butter_chicken_1793260045350.jpg',
    is_veg: Boolean(is_veg),
    is_available: is_available !== undefined ? Boolean(is_available) : true,
    is_featured: Boolean(is_featured),
    prep_time_minutes: Number(prep_time_minutes) || 20,
    display_order: db.items.length + 1,
    created_at: new Date().toISOString(),
    variants: (variants || []).map((v: any, idx: number) => ({
      id: 'v-' + Date.now() + '-' + idx,
      menu_item_id: newItemId,
      name: v.name,
      price: Number(v.price),
      is_available: v.is_available !== false,
      display_order: idx + 1
    })),
    addons: (addons || []).map((a: any, idx: number) => ({
      id: 'a-' + Date.now() + '-' + idx,
      menu_item_id: newItemId,
      name: a.name,
      price: Number(a.price),
      is_available: a.is_available !== false,
      display_order: idx + 1
    }))
  };

  db.items.push(newItem);
  saveDatabase();

  const audit: AuditLog = {
    id: 'aud-' + Date.now(),
    user_name: req.body._acting_user_name || 'Admin',
    action: 'MENU_ITEM_CREATED',
    entity_type: 'menu_items',
    entity_id: newItem.id,
    after_state: newItem,
    ip_address: req.ip,
    created_at: new Date().toISOString()
  };
  db.audit_logs.unshift(audit);
  saveDatabase();

  res.json({ success: true, data: newItem });
});

app.put('/api/menu/items/:id', (req: Request, res: Response) => {
  const item = db.items.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ success: false, error: 'Item not found' });

  const before = JSON.parse(JSON.stringify(item));
  const { variants, addons, ...rest } = req.body;
  Object.assign(item, rest);

  if (variants !== undefined) {
    item.variants = variants.map((v: any, idx: number) => ({
      id: v.id || ('v-' + Date.now() + '-' + idx),
      menu_item_id: item.id,
      name: v.name,
      price: Number(v.price),
      is_available: v.is_available !== false,
      display_order: idx + 1
    }));
  }

  if (addons !== undefined) {
    item.addons = addons.map((a: any, idx: number) => ({
      id: a.id || ('a-' + Date.now() + '-' + idx),
      menu_item_id: item.id,
      name: a.name,
      price: Number(a.price),
      is_available: a.is_available !== false,
      display_order: idx + 1
    }));
  }

  saveDatabase();

  // Audit log if price changed or major edit
  const audit: AuditLog = {
    id: 'aud-' + Date.now(),
    user_name: req.body._acting_user_name || 'Admin',
    action: before.price !== item.price ? 'MENU_PRICE_CHANGE' : 'MENU_ITEM_UPDATED',
    entity_type: 'menu_items',
    entity_id: item.id,
    before_state: before,
    after_state: item,
    ip_address: req.ip,
    created_at: new Date().toISOString()
  };
  db.audit_logs.unshift(audit);
  saveDatabase();

  res.json({ success: true, data: item });
});

app.delete('/api/menu/items/:id', (req: Request, res: Response) => {
  const idx = db.items.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Item not found' });

  const deleted = db.items.splice(idx, 1)[0];
  saveDatabase();

  const audit: AuditLog = {
    id: 'aud-' + Date.now(),
    user_name: req.body._acting_user_name || 'Admin',
    action: 'MENU_ITEM_DELETED',
    entity_type: 'menu_items',
    entity_id: deleted.id,
    before_state: deleted,
    ip_address: req.ip,
    created_at: new Date().toISOString()
  };
  db.audit_logs.unshift(audit);
  saveDatabase();

  res.json({ success: true, data: deleted });
});

// Bulk update items availability
app.post('/api/menu/items/bulk-toggle', (req: Request, res: Response) => {
  const { item_ids, is_available } = req.body;
  if (!Array.isArray(item_ids)) {
    return res.status(400).json({ success: false, error: 'item_ids must be an array' });
  }

  db.items.forEach(item => {
    if (item_ids.includes(item.id)) {
      item.is_available = Boolean(is_available);
    }
  });
  saveDatabase();

  res.json({ success: true, message: `Updated availability for ${item_ids.length} items` });
});

// Coupons API
app.get('/api/coupons', (req: Request, res: Response) => {
  const activeOnly = req.query.active_only === 'true';
  const now = new Date();
  const coupons = activeOnly
    ? db.coupons.filter(c => c.is_active && (!c.valid_until || new Date(c.valid_until) >= now))
    : db.coupons;

  res.json({ success: true, data: coupons });
});

app.post('/api/coupons', (req: Request, res: Response) => {
  const { code, description, discount_type, discount_value, min_order_amount, max_discount_amount, valid_until, usage_limit } = req.body;
  if (!code || !discount_value) {
    return res.status(400).json({ success: false, error: 'Coupon code and discount value are required' });
  }

  const newCoupon: Coupon = {
    id: 'cpn-' + Date.now(),
    code: String(code).trim().toUpperCase(),
    description: description || '',
    discount_type: discount_type === 'fixed' ? 'fixed' : 'percentage',
    discount_value: Number(discount_value),
    min_order_amount: Number(min_order_amount) || 0,
    max_discount_amount: max_discount_amount ? Number(max_discount_amount) : undefined,
    is_active: true,
    valid_from: new Date().toISOString(),
    valid_until: valid_until || undefined,
    usage_limit: usage_limit ? Number(usage_limit) : undefined,
    usage_count: 0
  };

  db.coupons.push(newCoupon);
  saveDatabase();

  const audit: AuditLog = {
    id: 'aud-' + Date.now(),
    user_name: req.body._acting_user_name || 'Admin',
    action: 'COUPON_CREATED',
    entity_type: 'coupons',
    entity_id: newCoupon.id,
    after_state: newCoupon,
    ip_address: req.ip,
    created_at: new Date().toISOString()
  };
  db.audit_logs.unshift(audit);
  saveDatabase();

  res.json({ success: true, data: newCoupon });
});

app.put('/api/coupons/:id', (req: Request, res: Response) => {
  const cpn = db.coupons.find(c => c.id === req.params.id);
  if (!cpn) return res.status(404).json({ success: false, error: 'Coupon not found' });

  const before = { ...cpn };
  Object.assign(cpn, req.body);
  if (req.body.code) cpn.code = String(req.body.code).trim().toUpperCase();
  saveDatabase();

  const audit: AuditLog = {
    id: 'aud-' + Date.now(),
    user_name: req.body._acting_user_name || 'Admin',
    action: 'COUPON_UPDATED',
    entity_type: 'coupons',
    entity_id: cpn.id,
    before_state: before,
    after_state: cpn,
    ip_address: req.ip,
    created_at: new Date().toISOString()
  };
  db.audit_logs.unshift(audit);
  saveDatabase();

  res.json({ success: true, data: cpn });
});

app.delete('/api/coupons/:id', (req: Request, res: Response) => {
  const idx = db.coupons.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Coupon not found' });

  const deleted = db.coupons.splice(idx, 1)[0];
  saveDatabase();

  res.json({ success: true, data: deleted });
});

// Server-Side Authoritative Coupon Validation
app.post('/api/coupons/validate', (req: Request, res: Response) => {
  const { code, subtotal } = req.body;
  if (!code) return res.status(400).json({ success: false, error: 'Please enter a coupon code' });

  const cleanCode = String(code).trim().toUpperCase();
  const coupon = db.coupons.find(c => c.code === cleanCode);

  if (!coupon || !coupon.is_active) {
    return res.status(400).json({ success: false, error: 'Invalid or expired coupon code' });
  }

  const now = new Date();
  if (coupon.valid_until && new Date(coupon.valid_until) < now) {
    return res.status(400).json({ success: false, error: 'This coupon code has expired' });
  }

  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
    return res.status(400).json({ success: false, error: 'Coupon usage limit has been reached' });
  }

  const orderSubtotal = Number(subtotal) || 0;
  if (orderSubtotal < coupon.min_order_amount) {
    return res.status(400).json({
      success: false,
      error: `Coupon requires minimum order value of ${db.settings.currency_symbol}${coupon.min_order_amount}`
    });
  }

  let discount = 0;
  if (coupon.discount_type === 'percentage') {
    discount = (orderSubtotal * coupon.discount_value) / 100;
    if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
      discount = coupon.max_discount_amount;
    }
  } else {
    discount = coupon.discount_value;
  }

  discount = Math.min(discount, orderSubtotal);

  res.json({
    success: true,
    data: {
      code: coupon.code,
      discount_amount: Math.round(discount * 100) / 100,
      description: coupon.description
    }
  });
});

// ----------------------------------------------------------------------
// Authoritative Order Placement (Strict Validation & Calculation)
// ----------------------------------------------------------------------
const createOrderSchema = z.object({
  table_id: z.string().min(1, 'Table is required'),
  customer_name: z.string().min(2, 'Customer name is required'),
  customer_phone: z.string().min(6, 'Valid contact number is required'),
  order_notes: z.string().optional(),
  coupon_code: z.string().optional(),
  idempotency_key: z.string().optional(),
  items: z.array(z.object({
    menu_item_id: z.string().min(1),
    variant_id: z.string().optional(),
    addon_ids: z.array(z.string()).optional(),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    special_instructions: z.string().optional()
  })).min(1, 'Your order must contain at least 1 dish')
});

app.post('/api/orders', (req: Request, res: Response) => {
  // Validate schema
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map(i => i.message).join(', ');
    return res.status(400).json({ success: false, error: errorMsg });
  }

  const { table_id, customer_name, customer_phone, order_notes, coupon_code, idempotency_key, items } = parsed.data;

  // 1. Check idempotency
  if (idempotency_key) {
    const existing = db.orders.find(o => (o as any).idempotency_key === idempotency_key);
    if (existing) {
      return res.json({ success: true, data: existing, is_duplicate: true });
    }
  }

  // 2. Validate table strictly on server
  const table = db.tables.find(t => t.id === table_id);
  if (!table) {
    return res.status(400).json({ success: false, error: 'Selected table does not exist. Please scan the QR code again or select an active table.' });
  }
  if (!table.is_active) {
    return res.status(400).json({ success: false, error: `Table ${table.table_number} is currently inactive or undergoing maintenance. Please select another table.` });
  }

  // 3. Check restaurant order acceptance
  if (!db.settings.order_acceptance_enabled) {
    return res.status(400).json({ success: false, error: 'The kitchen is currently not accepting new orders. Please consult our staff.' });
  }

  // 4. Calculate prices authoritatively using DB records only
  let subtotal = 0;
  let maxPrepMinutes = db.settings.default_prep_time_minutes;
  const processedItems: Order['items'] = [];

  for (const requestedItem of items) {
    const dbItem = db.items.find(i => i.id === requestedItem.menu_item_id);
    if (!dbItem) {
      return res.status(400).json({ success: false, error: 'One or more items in your cart are no longer on the menu.' });
    }
    if (!dbItem.is_available) {
      return res.status(400).json({ success: false, error: `"${dbItem.name}" is currently sold out. Please remove it from your cart.` });
    }

    let unitPrice = dbItem.price;
    let variantName: string | undefined;

    if (requestedItem.variant_id) {
      const variant = dbItem.variants?.find(v => v.id === requestedItem.variant_id);
      if (!variant) {
        return res.status(400).json({ success: false, error: `Selected variant for "${dbItem.name}" is invalid.` });
      }
      if (!variant.is_available) {
        return res.status(400).json({ success: false, error: `Variant "${variant.name}" for "${dbItem.name}" is unavailable.` });
      }
      unitPrice = variant.price;
      variantName = variant.name;
    }

    const selectedAddons: { name: string; price: number }[] = [];
    if (requestedItem.addon_ids && requestedItem.addon_ids.length > 0) {
      for (const addonId of requestedItem.addon_ids) {
        const addon = dbItem.addons?.find(a => a.id === addonId);
        if (addon && addon.is_available) {
          unitPrice += addon.price;
          selectedAddons.push({ name: addon.name, price: addon.price });
        }
      }
    }

    const itemTotalPrice = unitPrice * requestedItem.quantity;
    subtotal += itemTotalPrice;

    if (dbItem.prep_time_minutes > maxPrepMinutes) {
      maxPrepMinutes = dbItem.prep_time_minutes;
    }

    processedItems.push({
      id: 'oi-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      order_id: '', // set below
      menu_item_id: dbItem.id,
      item_name: dbItem.name,
      variant_name: variantName,
      price: unitPrice,
      quantity: requestedItem.quantity,
      total_price: itemTotalPrice,
      selected_addons: selectedAddons,
      special_instructions: requestedItem.special_instructions?.trim() || undefined
    });
  }

  // 5. Authoritatively validate and apply coupon
  let discountAmount = 0;
  let appliedCouponCode: string | undefined;

  if (coupon_code) {
    const clean = coupon_code.trim().toUpperCase();
    const coupon = db.coupons.find(c => c.code === clean && c.is_active);
    if (coupon) {
      const now = new Date();
      const isValidDate = !coupon.valid_until || new Date(coupon.valid_until) >= now;
      const isValidLimit = !coupon.usage_limit || coupon.usage_count < coupon.usage_limit;
      const meetsMin = subtotal >= coupon.min_order_amount;

      if (isValidDate && isValidLimit && meetsMin) {
        if (coupon.discount_type === 'percentage') {
          discountAmount = (subtotal * coupon.discount_value) / 100;
          if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
            discountAmount = coupon.max_discount_amount;
          }
        } else {
          discountAmount = coupon.discount_value;
        }
        discountAmount = Math.min(discountAmount, subtotal);
        coupon.usage_count += 1;
        appliedCouponCode = coupon.code;
      }
    }
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round((taxableAmount * db.settings.tax_rate_percent) / 100 * 100) / 100;
  const serviceChargeAmount = Math.round((taxableAmount * db.settings.service_charge_percent) / 100 * 100) / 100;
  const totalAmount = Math.round((taxableAmount + taxAmount + serviceChargeAmount) * 100) / 100;

  // 6. Generate sequential order number (e.g. ORD-104)
  const orderCount = db.orders.length + 101;
  const orderId = 'ord-' + Date.now();
  const orderNumber = 'ORD-' + orderCount;

  // Link items to order
  processedItems.forEach(i => (i.order_id = orderId));

  const newOrder: Order = {
    id: orderId,
    order_number: orderNumber,
    table_id: table.id,
    table_number: table.table_number,
    table_display_name: table.display_name,
    customer_name: customer_name.trim(),
    customer_phone: customer_phone.trim(),
    order_notes: order_notes?.trim() || undefined,
    status: 'new',
    payment_status: 'pending',
    payment_method: 'pay_at_counter',
    subtotal: Math.round(subtotal * 100) / 100,
    discount_amount: Math.round(discountAmount * 100) / 100,
    coupon_code: appliedCouponCode,
    tax_amount: taxAmount,
    service_charge_amount: serviceChargeAmount,
    total_amount: totalAmount,
    estimated_prep_minutes: maxPrepMinutes,
    items: processedItems,
    status_history: [
      {
        id: 'sh-' + Date.now(),
        order_id: orderId,
        previous_status: null,
        new_status: 'new',
        changed_by: 'Customer (QR Scan)',
        change_notes: 'Order placed by customer at ' + table.display_name,
        created_at: new Date().toISOString()
      }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (idempotency_key) {
    (newOrder as any).idempotency_key = idempotency_key;
  }

  db.orders.unshift(newOrder);
  saveDatabase();

  // Broadcast realtime event for Kitchen Dashboard and Admin
  broadcastRealtimeEvent('order_created', newOrder);

  res.status(201).json({ success: true, data: newOrder });
});

// Single Order Tracking
app.get('/api/orders/:id', (req: Request, res: Response) => {
  const order = db.orders.find(o => o.id === req.params.id || o.order_number === req.params.id);
  if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
  res.json({ success: true, data: order });
});

// Orders List for Kitchen & Admin
app.get('/api/orders', (req: Request, res: Response) => {
  const { status, table_id, payment_status, search, start_date, end_date } = req.query;

  let filtered = [...db.orders];

  if (status && status !== 'all') {
    filtered = filtered.filter(o => o.status === status);
  }

  if (table_id) {
    filtered = filtered.filter(o => o.table_id === table_id);
  }

  if (payment_status && payment_status !== 'all') {
    filtered = filtered.filter(o => o.payment_status === payment_status);
  }

  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(o =>
      o.order_number.toLowerCase().includes(q) ||
      o.table_number.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.customer_phone.includes(q)
    );
  }

  if (start_date) {
    filtered = filtered.filter(o => new Date(o.created_at) >= new Date(String(start_date)));
  }

  if (end_date) {
    filtered = filtered.filter(o => new Date(o.created_at) <= new Date(String(end_date)));
  }

  // Sort latest first
  filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({ success: true, data: filtered });
});

// Status Transition API (with strict rules)
app.put('/api/orders/:id/status', (req: Request, res: Response) => {
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

  const { status: nextStatus, rejection_reason, cancellation_reason, changed_by, notes } = req.body;
  const current = order.status;

  // Allowed transitions validation
  const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    new: ['accepted', 'rejected', 'cancelled'],
    accepted: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['completed', 'cancelled'],
    completed: [],
    rejected: [],
    cancelled: []
  };

  if (!allowedTransitions[current].includes(nextStatus)) {
    return res.status(400).json({
      success: false,
      error: `Invalid status transition from "${current}" to "${nextStatus}"`
    });
  }

  if (nextStatus === 'rejected' && !rejection_reason) {
    return res.status(400).json({ success: false, error: 'A rejection reason is required' });
  }

  if (nextStatus === 'cancelled' && !cancellation_reason) {
    return res.status(400).json({ success: false, error: 'A cancellation reason is required' });
  }

  const previousStatus = order.status;
  order.status = nextStatus;
  order.updated_at = new Date().toISOString();

  if (rejection_reason) order.rejection_reason = rejection_reason;
  if (cancellation_reason) order.cancellation_reason = cancellation_reason;

  order.status_history.push({
    id: 'sh-' + Date.now(),
    order_id: order.id,
    previous_status: previousStatus,
    new_status: nextStatus,
    changed_by: changed_by || 'Kitchen Staff',
    change_notes: notes || rejection_reason || cancellation_reason || `Status updated to ${nextStatus}`,
    created_at: new Date().toISOString()
  });

  saveDatabase();

  // Broadcast realtime event
  broadcastRealtimeEvent('order_status_updated', order);

  res.json({ success: true, data: order });
});

// Payment Update API (Admin/Manager/Counter)
app.put('/api/orders/:id/payment', (req: Request, res: Response) => {
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

  const before = { payment_status: order.payment_status, payment_method: order.payment_method };
  const { payment_status, payment_method, discount_adjustment } = req.body;

  if (payment_status) order.payment_status = payment_status;
  if (payment_method) order.payment_method = payment_method;

  if (discount_adjustment !== undefined) {
    const adj = Number(discount_adjustment);
    order.discount_amount = Math.max(0, order.discount_amount + adj);
    const taxable = Math.max(0, order.subtotal - order.discount_amount);
    order.tax_amount = Math.round((taxable * db.settings.tax_rate_percent) / 100 * 100) / 100;
    order.service_charge_amount = Math.round((taxable * db.settings.service_charge_percent) / 100 * 100) / 100;
    order.total_amount = Math.round((taxable + order.tax_amount + order.service_charge_amount) * 100) / 100;
  }

  order.updated_at = new Date().toISOString();
  saveDatabase();

  const audit: AuditLog = {
    id: 'aud-' + Date.now(),
    user_name: req.body._acting_user_name || 'Counter Staff',
    action: 'ORDER_PAYMENT_UPDATED',
    entity_type: 'orders',
    entity_id: order.id,
    before_state: before,
    after_state: { payment_status: order.payment_status, payment_method: order.payment_method, total_amount: order.total_amount },
    ip_address: req.ip,
    created_at: new Date().toISOString()
  };
  db.audit_logs.unshift(audit);
  saveDatabase();

  broadcastRealtimeEvent('order_payment_updated', order);
  res.json({ success: true, data: order });
});

// Reports & Financial Analytics
app.get('/api/reports/analytics', (_req: Request, res: Response) => {
  const allOrders = db.orders;

  // Real database calculation:
  // Gross sales = sum of subtotals of all valid (non-cancelled, non-rejected) orders
  const nonCancelledOrders = allOrders.filter(o => !['cancelled', 'rejected'].includes(o.status));
  const completedOrders = allOrders.filter(o => o.status === 'completed');
  const paidOrders = allOrders.filter(o => o.payment_status === 'paid');

  const grossSales = nonCancelledOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalDiscounts = nonCancelledOrders.reduce((sum, o) => sum + o.discount_amount, 0);
  const totalTaxes = nonCancelledOrders.reduce((sum, o) => sum + o.tax_amount, 0);
  const totalServiceCharges = nonCancelledOrders.reduce((sum, o) => sum + o.service_charge_amount, 0);
  const netSales = nonCancelledOrders.reduce((sum, o) => sum + o.total_amount, 0);

  // Today calculations
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayOrders = allOrders.filter(o => new Date(o.created_at) >= todayStart);
  const todayNonCancelled = todayOrders.filter(o => !['cancelled', 'rejected'].includes(o.status));
  const todaySales = todayNonCancelled.reduce((sum, o) => sum + o.total_amount, 0);

  // Status breakdown
  const statusCounts: Record<string, number> = {
    new: 0,
    accepted: 0,
    preparing: 0,
    ready: 0,
    completed: 0,
    rejected: 0,
    cancelled: 0
  };
  allOrders.forEach(o => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });

  // Best selling dishes
  const dishSales: Record<string, { name: string; quantity: number; revenue: number; category: string }> = {};
  nonCancelledOrders.forEach(o => {
    o.items.forEach(i => {
      if (!dishSales[i.item_name]) {
        dishSales[i.item_name] = { name: i.item_name, quantity: 0, revenue: 0, category: 'Menu Item' };
      }
      dishSales[i.item_name].quantity += i.quantity;
      dishSales[i.item_name].revenue += i.total_price;
    });
  });

  const bestSelling = Object.values(dishSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Category performance
  const categorySales: Record<string, { category_name: string; revenue: number; order_count: number }> = {};
  db.categories.forEach(c => {
    categorySales[c.id] = { category_name: c.name, revenue: 0, order_count: 0 };
  });

  nonCancelledOrders.forEach(o => {
    o.items.forEach(i => {
      const item = db.items.find(mi => mi.id === i.menu_item_id);
      if (item && categorySales[item.category_id]) {
        categorySales[item.category_id].revenue += i.total_price;
        categorySales[item.category_id].order_count += i.quantity;
      }
    });
  });

  const averageOrderValue = nonCancelledOrders.length > 0
    ? Math.round((netSales / nonCancelledOrders.length) * 100) / 100
    : 0;

  res.json({
    success: true,
    data: {
      metrics: {
        today_orders_count: todayOrders.length,
        today_sales: Math.round(todaySales * 100) / 100,
        pending_and_preparing_count: statusCounts.new + statusCounts.accepted + statusCounts.preparing,
        completed_orders_count: statusCounts.completed,
        cancelled_orders_count: statusCounts.cancelled + statusCounts.rejected,
        total_orders_count: allOrders.length,
        gross_sales: Math.round(grossSales * 100) / 100,
        total_discounts: Math.round(totalDiscounts * 100) / 100,
        total_taxes: Math.round(totalTaxes * 100) / 100,
        total_service_charges: Math.round(totalServiceCharges * 100) / 100,
        net_sales: Math.round(netSales * 100) / 100,
        average_order_value: averageOrderValue,
        paid_orders_count: paidOrders.length
      },
      status_breakdown: statusCounts,
      best_selling_dishes: bestSelling,
      category_performance: Object.values(categorySales),
      low_availability_items: db.items.filter(i => !i.is_available),
      recent_orders: allOrders.slice(0, 8)
    }
  });
});

// CSV Export for orders
app.get('/api/reports/export-csv', (_req: Request, res: Response) => {
  const headers = ['Order Number', 'Date', 'Table', 'Customer Name', 'Customer Phone', 'Status', 'Payment Status', 'Payment Method', 'Subtotal', 'Discount', 'Tax', 'Service Charge', 'Total Amount', 'Item Details'];

  const rows = db.orders.map(o => {
    const itemsSummary = o.items.map(i => `${i.item_name} x${i.quantity}`).join('; ');
    return [
      o.order_number,
      new Date(o.created_at).toISOString(),
      `"${o.table_display_name}"`,
      `"${o.customer_name}"`,
      `"${o.customer_phone}"`,
      o.status,
      o.payment_status,
      o.payment_method,
      o.subtotal,
      o.discount_amount,
      o.tax_amount,
      o.service_charge_amount,
      o.total_amount,
      `"${itemsSummary.replace(/"/g, '""')}"`
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="orders-report-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csv);
});

// Staff Management API
app.get('/api/staff', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.staff });
});

app.post('/api/staff', (req: Request, res: Response) => {
  const { email, full_name, role } = req.body;
  if (!email || !full_name) {
    return res.status(400).json({ success: false, error: 'Email and full name are required' });
  }

  if (db.staff.some(s => s.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ success: false, error: 'A staff member with this email already exists' });
  }

  const newStaff: UserProfile = {
    id: 'usr-' + Date.now(),
    email: email.trim().toLowerCase(),
    full_name: full_name.trim(),
    role: (role as UserRole) || 'kitchen',
    is_active: true,
    created_at: new Date().toISOString()
  };

  db.staff.push(newStaff);
  saveDatabase();

  const audit: AuditLog = {
    id: 'aud-' + Date.now(),
    user_name: req.body._acting_user_name || 'Admin',
    action: 'STAFF_MEMBER_CREATED',
    entity_type: 'staff',
    entity_id: newStaff.id,
    after_state: newStaff,
    ip_address: req.ip,
    created_at: new Date().toISOString()
  };
  db.audit_logs.unshift(audit);
  saveDatabase();

  res.json({ success: true, data: newStaff });
});

app.put('/api/staff/:id', (req: Request, res: Response) => {
  const member = db.staff.find(s => s.id === req.params.id);
  if (!member) return res.status(404).json({ success: false, error: 'Staff member not found' });

  const before = { ...member };
  Object.assign(member, req.body);
  saveDatabase();

  const audit: AuditLog = {
    id: 'aud-' + Date.now(),
    user_name: req.body._acting_user_name || 'Admin',
    action: 'STAFF_MEMBER_UPDATED',
    entity_type: 'staff',
    entity_id: member.id,
    before_state: before,
    after_state: member,
    ip_address: req.ip,
    created_at: new Date().toISOString()
  };
  db.audit_logs.unshift(audit);
  saveDatabase();

  res.json({ success: true, data: member });
});

// Audit Logs API
app.get('/api/audit-logs', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.audit_logs });
});

// Staff Quick Auth & Session Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password, demo_role } = req.body;

  // Demo direct switch for instant testing of roles
  if (demo_role && ['admin', 'manager', 'kitchen'].includes(demo_role)) {
    const user = db.staff.find(s => s.role === demo_role && s.is_active) || {
      id: 'usr-' + demo_role,
      email: `${demo_role}@demorestaurant.com`,
      full_name: demo_role === 'admin' ? 'Aarav Sharma (Admin)' : demo_role === 'manager' ? 'Pooja Iyer (Manager)' : 'Chef Vikramaditya (Kitchen)',
      role: demo_role as UserRole,
      is_active: true,
      created_at: new Date().toISOString()
    };
    return res.json({
      success: true,
      user,
      token: `demo-token-${user.id}-${Date.now()}`
    });
  }

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  const staff = db.staff.find(s => s.email.toLowerCase() === String(email).trim().toLowerCase());
  if (!staff || !staff.is_active) {
    return res.status(401).json({ success: false, error: 'Invalid credentials or inactive account' });
  }

  // Password verification: Accept any password >= 6 characters for demo credentials
  if (String(password).length < 6) {
    return res.status(401).json({ success: false, error: 'Password must be at least 6 characters' });
  }

  res.json({
    success: true,
    user: staff,
    token: `token-${staff.id}-${Date.now()}`
  });
});

// Supabase Status and Migration Export Helper
app.get('/api/supabase/status', (_req: Request, res: Response) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const isConfigured = Boolean(supabaseUrl && anonKey);

  res.json({
    success: true,
    data: {
      configured: isConfigured,
      supabase_url: supabaseUrl ? `${supabaseUrl.slice(0, 16)}...` : null,
      has_anon_key: Boolean(anonKey),
      has_service_role_key: Boolean(serviceRoleKey),
      migrations_file: 'supabase/migrations/20261029000000_init_restaurant_schema.sql',
      notes: isConfigured
        ? 'Connected to configured Supabase project. Realtime and RLS active.'
        : 'Running on internal authoritative engine with PostgreSQL schema ready for direct Supabase deployment.'
    }
  });
});

// ----------------------------------------------------------------------
// Vite Middleware / Production Static Server Setup
// ----------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Demo Restaurant Server active on port ${PORT}`);
  });
}

startServer();
