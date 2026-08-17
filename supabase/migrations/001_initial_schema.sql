-- ============================================================
-- GHARSEE — SUPABASE INITIAL DATABASE SCHEMA
-- ============================================================

-- 1. PROFILES TABLE (Linked to Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'shopkeeper', 'rider', 'admin')),
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automatic Profile Creation Trigger on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, role, full_name, phone)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'phone'
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. STORES TABLE
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    image TEXT,
    rating NUMERIC(3,1) DEFAULT 4.8,
    reviews_count INTEGER DEFAULT 150,
    is_open BOOLEAN DEFAULT TRUE,
    opening_time TEXT DEFAULT '07:00 AM',
    closing_time TEXT DEFAULT '10:00 PM',
    address TEXT NOT NULL,
    delivery_radius TEXT DEFAULT '3.5 km',
    min_order TEXT DEFAULT '₹100',
    estimated_delivery_time TEXT DEFAULT '15-25 min',
    categories TEXT[] DEFAULT ARRAY['Groceries', 'Dairy & Eggs', 'Rice & Grains', 'Cooking Essentials'],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    brand TEXT,
    category TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    discount NUMERIC(5,2) DEFAULT 0,
    unit TEXT DEFAULT '1 kg',
    stock INTEGER DEFAULT 20,
    min_threshold INTEGER DEFAULT 10,
    status TEXT DEFAULT 'In Stock',
    image TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CUSTOMER ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'Home',
    address_line TEXT NOT NULL,
    city TEXT DEFAULT 'Bengaluru',
    pincode TEXT,
    is_default BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. FAVORITE STORES TABLE
CREATE TABLE IF NOT EXISTS public.favorite_stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, store_id)
);

-- 6. GROCERY LISTS TABLE
CREATE TABLE IF NOT EXISTS public.grocery_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'My Grocery List',
    source TEXT DEFAULT 'manual',
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. GROCERY LIST ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.grocery_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID REFERENCES public.grocery_lists(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    brand TEXT,
    quantity NUMERIC(8,2) DEFAULT 1,
    unit TEXT DEFAULT 'kg',
    description TEXT,
    matched_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    rider_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    delivery_fee NUMERIC(10,2) DEFAULT 0,
    discount NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) NOT NULL,
    payment_status TEXT DEFAULT 'Paid Online (UPI)',
    payment_type TEXT DEFAULT 'PREPAID',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed', 'rejected')),
    rejection_reason TEXT,
    delivery_address TEXT NOT NULL,
    delivery_otp TEXT DEFAULT '4820',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    brand TEXT,
    unit TEXT,
    price NUMERIC(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    subtotal NUMERIC(10,2) NOT NULL
);

-- 10. RIDER DELIVERIES TABLE
CREATE TABLE IF NOT EXISTS public.rider_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
    rider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'assigned',
    earnings NUMERIC(10,2) DEFAULT 82,
    distance_km TEXT DEFAULT '3.4 km',
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- 11. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Public Store & Product Reading
CREATE POLICY "Public stores reading" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Public products reading" ON public.products FOR SELECT USING (true);

-- User Profiles Policy
CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Customer Addresses & Favorites Policy
CREATE POLICY "Users read own addresses" ON public.customer_addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own addresses" ON public.customer_addresses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own favorites" ON public.favorite_stores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own favorites" ON public.favorite_stores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own favorites" ON public.favorite_stores FOR DELETE USING (auth.uid() = user_id);

-- Orders Policy
CREATE POLICY "Public orders select" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public orders insert" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public orders update" ON public.orders FOR UPDATE USING (true);

CREATE POLICY "Public order_items select" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Public order_items insert" ON public.order_items FOR INSERT WITH CHECK (true);

-- ============================================================
-- INITIAL SEED DATA (Stores & Products)
-- ============================================================

INSERT INTO public.stores (id, name, description, image, rating, reviews_count, is_open, address, delivery_radius, estimated_delivery_time)
VALUES
('00000000-0000-0000-0000-000000000001', 'Sri Lakshmi Stores', 'Your trusted local neighborhood grocery store with daily fresh stock.', '/images/store_lakshmi.jpg', 4.8, 324, true, '100 Feet Road, Indiranagar, Bengaluru', '3.5 km', '15-25 min'),
('00000000-0000-0000-0000-000000000002', 'FreshMart Grocery', 'Farm fresh vegetables, fruits and dairy delivered fast.', '/images/store_freshmart.jpg', 4.7, 218, true, 'HAL 2nd Stage, Indiranagar, Bengaluru', '2.5 km', '12-20 min'),
('00000000-0000-0000-0000-000000000003', 'Green Basket Organic', '100% certified organic grains, cold pressed oils and pulses.', '/images/cat_veg_fruits.jpg', 4.9, 180, true, 'Koramangala 4th Block, Bengaluru', '4.0 km', '20-30 min')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (id, store_id, name, brand, category, price, discount, unit, stock, min_threshold, status, image, description)
VALUES
('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Daawat Rozana Super Basmati Rice', 'Daawat', 'Rice & Grains', 249.00, 17, '1 kg', 24, 10, 'In Stock', '/images/cat_rice_grains.jpg', 'Aromatic aged long-grain basmati rice.'),
('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'Aashirvaad Shudh Chakki Atta', 'Aashirvaad', 'Rice & Grains', 285.00, 11, '5 kg', 18, 10, 'In Stock', '/images/cat_rice_grains.jpg', '100% pure whole wheat flour processed with traditional chakki.'),
('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'Fortune Sunlite Refined Sunflower Oil', 'Fortune', 'Cooking Essentials', 155.00, 14, '1 L', 4, 10, 'Low Stock', '/images/cat_cooking_oil.jpg', 'Light, healthy refined sunflower oil enriched with vitamins A & D.'),
('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000001', 'Amul Taaza Toned Milk', 'Amul', 'Dairy & Eggs', 54.00, 4, '1 L', 35, 15, 'In Stock', '/images/cat_dairy.jpg', 'Pasteurized toned milk with optimum fat content.'),
('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000001', 'Farm Fresh Red Tomatoes', 'Local Farm', 'Fruits & Vegetables', 45.00, 25, '1 kg', 42, 15, 'In Stock', '/images/cat_veg_fruits.jpg', 'Vine-ripened, firm red tomatoes sourced daily.')
ON CONFLICT (id) DO NOTHING;
