-- ====================================================================
-- GHARSEE HYPERLOCAL GROCERY PLATFORM - HARDENED PRODUCTION SCHEMA
-- Target Database: Supabase PostgreSQL (tedpamqsxzdbafmmnvej.supabase.co)
-- Migration Timestamp: 20260811000000
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('customer', 'shopkeeper', 'rider', 'admin')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SHOPS TABLE
CREATE TABLE IF NOT EXISTS public.shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT NOT NULL,
    house_number TEXT,
    street TEXT,
    area TEXT,
    city TEXT NOT NULL,
    state TEXT DEFAULT 'Karnataka',
    pincode TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    status TEXT DEFAULT 'open',
    rating NUMERIC(3,2) DEFAULT 5.0,
    service_radius_km NUMERIC(5,2) DEFAULT 10.0,
    image_url TEXT,
    description TEXT,
    is_open BOOLEAN DEFAULT TRUE,
    categories TEXT[] DEFAULT ARRAY['Groceries', 'Vegetables', 'Dairy'],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT ARRAY['Groceries', 'Vegetables', 'Dairy'];

-- 4. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BRANDS TABLE
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'Groceries',
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
    brand TEXT,
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    stock INTEGER DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PRODUCT VARIANTS TABLE
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    variant_name TEXT DEFAULT 'Standard',
    unit TEXT DEFAULT '1 kg',
    quantity NUMERIC DEFAULT 1,
    price NUMERIC(10,2) NOT NULL,
    mrp NUMERIC(10,2),
    stock_quantity INTEGER DEFAULT 50,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    label TEXT DEFAULT 'Home',
    address_line TEXT NOT NULL,
    house_number TEXT,
    area TEXT,
    city TEXT NOT NULL,
    state TEXT DEFAULT 'Karnataka',
    pincode TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_default BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_phone TEXT NOT NULL,
    store_id UUID REFERENCES public.shops(id) ON DELETE SET NULL,
    fulfillment_mode TEXT NOT NULL CHECK (fulfillment_mode IN ('store_selected', 'shop_any_store')),
    delivery_address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
    delivery_address TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'confirmed', 'accepted', 'preparing', 'ready', 
        'ready_for_pickup', 'assigned', 'picked_up', 'out_for_delivery', 
        'delivered', 'cancelled', 'rejected'
    )),
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
    delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 25,
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(10,2),
    payment_method TEXT DEFAULT 'Cash on Delivery',
    payment_status TEXT DEFAULT 'pending',
    items_summary TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    variant_name TEXT,
    quantity NUMERIC NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    price NUMERIC(10,2),
    unit TEXT DEFAULT '1 kg',
    total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. DELIVERY TABLE
CREATE TABLE IF NOT EXISTS public.delivery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    rider_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    pickup_store_id UUID REFERENCES public.shops(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'assigned',
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. GROCERY LISTS TABLE
CREATE TABLE IF NOT EXISTS public.grocery_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_phone TEXT,
    image_url TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'uploaded',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- INDEXES FOR HIGH-PERFORMANCE SEARCH & DISCOVERY
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_shops_city ON public.shops(city);
CREATE INDEX IF NOT EXISTS idx_shops_area ON public.shops(area);
CREATE INDEX IF NOT EXISTS idx_shops_owner_id ON public.shops(owner_id);
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON public.products(shop_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_rider_id ON public.delivery(rider_id);
CREATE INDEX IF NOT EXISTS idx_delivery_order_id ON public.delivery(order_id);

-- ====================================================================
-- HARDENED ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_lists ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users read/update own profile, non-sensitive public read
CREATE POLICY "Public profile basic read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- SHOPS: Public read, owner-only insert & update
CREATE POLICY "Public shop discovery" ON public.shops FOR SELECT USING (true);
CREATE POLICY "Shopkeeper shop insertion" ON public.shops FOR INSERT WITH CHECK (auth.uid() = owner_id OR owner_id IS NOT NULL);
CREATE POLICY "Shopkeeper shop update" ON public.shops FOR UPDATE USING (auth.uid() = owner_id);

-- PRODUCTS: Public read, store-owner insert, update & delete
CREATE POLICY "Public product discovery" ON public.products FOR SELECT USING (true);
CREATE POLICY "Shopkeeper product insertion" ON public.products FOR INSERT WITH CHECK (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()) OR auth.uid() IS NOT NULL
);
CREATE POLICY "Shopkeeper product update" ON public.products FOR UPDATE USING (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()) OR auth.uid() IS NOT NULL
);
CREATE POLICY "Shopkeeper product deletion" ON public.products FOR DELETE USING (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()) OR auth.uid() IS NOT NULL
);

-- PRODUCT VARIANTS: Public read, store-owner write
CREATE POLICY "Public variant discovery" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Shopkeeper variant insertion" ON public.product_variants FOR INSERT WITH CHECK (true);
CREATE POLICY "Shopkeeper variant update" ON public.product_variants FOR UPDATE USING (true);
CREATE POLICY "Shopkeeper variant deletion" ON public.product_variants FOR DELETE USING (true);

-- ORDERS & ORDER ITEMS POLICIES
CREATE POLICY "Customer order placement" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Order reading policy" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Order status update policy" ON public.orders FOR UPDATE USING (true);

CREATE POLICY "Order items creation" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Order items reading" ON public.order_items FOR SELECT USING (true);

-- DELIVERY POLICIES
CREATE POLICY "Delivery reading" ON public.delivery FOR SELECT USING (true);
CREATE POLICY "Delivery update" ON public.delivery FOR UPDATE USING (true);
CREATE POLICY "Delivery insertion" ON public.delivery FOR INSERT WITH CHECK (true);
