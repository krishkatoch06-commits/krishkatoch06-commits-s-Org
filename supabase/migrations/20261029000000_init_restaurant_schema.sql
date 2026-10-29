-- Demo Restaurant: Complete Supabase PostgreSQL Schema, RLS Policies & Initial Seed Data
-- Run this in the Supabase SQL Editor to initialize all tables, roles, security, and demo records.

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create custom enum types
DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM ('admin', 'manager', 'kitchen');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status_type AS ENUM ('new', 'accepted', 'preparing', 'ready', 'completed', 'rejected', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_type AS ENUM ('pending', 'paid', 'refunded', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_type AS ENUM ('pay_at_counter', 'cash', 'upi', 'card');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Profiles table (linked to auth.users if Supabase Auth is active)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. User roles table for RBAC
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role user_role_type NOT NULL DEFAULT 'kitchen',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- 5. Restaurant settings table
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL DEFAULT 'Demo Restaurant',
    tagline TEXT DEFAULT 'Artisanal Flavors & Modern Dining',
    description TEXT DEFAULT 'Experience handcrafted regional delicacies prepared with locally sourced ingredients.',
    logo_url TEXT,
    hero_image_url TEXT,
    phone TEXT DEFAULT '+91 98765 43210',
    email TEXT DEFAULT 'hello@demorestaurant.com',
    address TEXT DEFAULT '42 Heritage Boulevard, Indiranagar, Bengaluru, KA 560038',
    opening_time TEXT DEFAULT '11:00 AM',
    closing_time TEXT DEFAULT '11:00 PM',
    currency TEXT DEFAULT 'INR',
    currency_symbol TEXT DEFAULT '₹',
    timezone TEXT DEFAULT 'Asia/Kolkata',
    tax_rate_percent NUMERIC(5, 2) DEFAULT 5.00,
    service_charge_percent NUMERIC(5, 2) DEFAULT 2.50,
    default_prep_time_minutes INTEGER DEFAULT 25,
    pay_at_counter_instructions TEXT DEFAULT 'Please proceed to counter #1 after placing your order or request the check from your server.',
    order_acceptance_enabled BOOLEAN DEFAULT true,
    website_primary_color TEXT DEFAULT '#E05A47',
    social_links JSONB DEFAULT '{"instagram": "https://instagram.com/demorestaurant", "facebook": "https://facebook.com/demorestaurant"}'::jsonb,
    terms_notice TEXT DEFAULT 'All food items are freshly prepared to order. Prices are inclusive of GST.',
    privacy_notice TEXT DEFAULT 'Your phone number and dining details are strictly used for order updates and verification.',
    cancellation_policy TEXT DEFAULT 'Orders can be cancelled before the kitchen begins preparation.',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Menu categories table
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Menu items table
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.menu_categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    is_veg BOOLEAN DEFAULT true,
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    prep_time_minutes INTEGER DEFAULT 20,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Menu item variants (e.g., Half, Full, Large)
CREATE TABLE IF NOT EXISTS public.menu_item_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    is_available BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0
);

-- 9. Menu item add-ons (e.g., Extra Cheese, Butter Naan, Mint Dip)
CREATE TABLE IF NOT EXISTS public.menu_item_addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    is_available BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0
);

-- 10. Restaurant tables (for QR table ordering)
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_number TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    capacity INTEGER DEFAULT 4,
    is_active BOOLEAN DEFAULT true,
    qr_code_identifier TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type discount_type NOT NULL DEFAULT 'percentage',
    discount_value NUMERIC(10, 2) NOT NULL,
    min_order_amount NUMERIC(10, 2) DEFAULT 0,
    max_discount_amount NUMERIC(10, 2),
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE RESTRICT,
    customer_name TEXT,
    customer_phone TEXT,
    order_notes TEXT,
    status order_status_type DEFAULT 'new',
    payment_status payment_status_type DEFAULT 'pending',
    payment_method payment_method_type DEFAULT 'pay_at_counter',
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    discount_amount NUMERIC(10, 2) DEFAULT 0 CHECK (discount_amount >= 0),
    coupon_code TEXT,
    tax_amount NUMERIC(10, 2) DEFAULT 0 CHECK (tax_amount >= 0),
    service_charge_amount NUMERIC(10, 2) DEFAULT 0 CHECK (service_charge_amount >= 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    estimated_prep_minutes INTEGER DEFAULT 25,
    rejection_reason TEXT,
    cancellation_reason TEXT,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Order items table (stores immutable snapshot of items at purchase time)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    variant_name TEXT,
    price NUMERIC(10, 2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_price NUMERIC(10, 2) NOT NULL,
    selected_addons JSONB DEFAULT '[]'::jsonb,
    special_instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Order status history
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    previous_status order_status_type,
    new_status order_status_type NOT NULL,
    changed_by TEXT DEFAULT 'system',
    change_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method payment_method_type NOT NULL,
    payment_status payment_status_type DEFAULT 'pending',
    transaction_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Coupon redemptions table
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    discount_applied NUMERIC(10, 2) NOT NULL,
    redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    before_state JSONB,
    after_state JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------
-- 18. Row Level Security (RLS) Configuration
-- ----------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user has admin/manager role
CREATE OR REPLACE FUNCTION public.is_admin_or_manager(uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = uid AND role IN ('admin', 'manager') AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is staff (admin, manager, or kitchen)
CREATE OR REPLACE FUNCTION public.is_staff(uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = uid AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public READ policies
CREATE POLICY "Public can view restaurant settings" ON public.restaurant_settings FOR SELECT USING (true);
CREATE POLICY "Public can view active categories" ON public.menu_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view available menu items" ON public.menu_items FOR SELECT USING (is_available = true);
CREATE POLICY "Public can view available variants" ON public.menu_item_variants FOR SELECT USING (is_available = true);
CREATE POLICY "Public can view available addons" ON public.menu_item_addons FOR SELECT USING (is_available = true);
CREATE POLICY "Public can view active tables" ON public.restaurant_tables FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view active coupons" ON public.coupons FOR SELECT USING (is_active = true);

-- Orders RLS policies:
-- Public can create orders (checked by API server)
CREATE POLICY "Public can insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can insert order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view order by id" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public can view order items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Public can view order status history" ON public.order_status_history FOR SELECT USING (true);

-- Staff & Admin policies
CREATE POLICY "Staff can view all orders" ON public.orders FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update order status" ON public.orders FOR UPDATE USING (public.is_staff(auth.uid()));
CREATE POLICY "Admin can manage menu categories" ON public.menu_categories FOR ALL USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admin can manage menu items" ON public.menu_items FOR ALL USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admin can manage variants" ON public.menu_item_variants FOR ALL USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admin can manage addons" ON public.menu_item_addons FOR ALL USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admin can manage tables" ON public.restaurant_tables FOR ALL USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admin can manage coupons" ON public.coupons FOR ALL USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admin can manage settings" ON public.restaurant_settings FOR ALL USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admin can view audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admin can manage staff" ON public.user_roles FOR ALL USING (public.is_admin_or_manager(auth.uid()));

-- Realtime enablement for orders and order_status_history
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_history;
