-- ============================================================================
-- GHARSEE COMPLETE DATABASE REDESIGN MIGRATION
-- Supports Customer, Shopkeeper, and Rider Roles & Workflows
-- ============================================================================

-- 1. DROP OLD TABLES SAFELY IF THEY EXIST
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS rider_profiles CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS shops CASCADE;
DROP TABLE IF EXISTS customer_addresses CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. ENABLE EXTENSIONS FOR UUID & CRYPTO
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 3. PROFILES TABLE (AUTHENTICATED USERS)
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'shopkeeper', 'rider')),
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CUSTOMER ADDRESSES TABLE (KEYED BY MOBILE PHONE NUMBER)
CREATE TABLE customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  full_name TEXT,
  flat TEXT,
  street TEXT,
  city TEXT NOT NULL DEFAULT 'Bengaluru',
  pincode TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  address_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SHOPS TABLE (STORE PARTNERS)
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  locality TEXT NOT NULL DEFAULT 'Indiranagar',
  city TEXT NOT NULL DEFAULT 'Bengaluru',
  state TEXT NOT NULL DEFAULT 'Karnataka',
  pincode TEXT,
  latitude NUMERIC(10,7) DEFAULT 12.9784,
  longitude NUMERIC(10,7) DEFAULT 77.6408,
  image_url TEXT DEFAULT '/images/store_lakshmi.jpg',
  rating NUMERIC(3,2) DEFAULT 4.80,
  is_open BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'open',
  categories TEXT[] DEFAULT ARRAY['Groceries', 'Dairy', 'Vegetables', 'Rice & Grains'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PRODUCTS TABLE (STORE INVENTORY ITEMS)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Groceries',
  price NUMERIC(10,2) NOT NULL,
  mrp NUMERIC(10,2),
  unit TEXT NOT NULL DEFAULT '1 kg',
  stock INT NOT NULL DEFAULT 50,
  min_threshold INT DEFAULT 5,
  image_url TEXT DEFAULT '/images/cat_veg_fruits.jpg',
  description TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RIDER PROFILES TABLE (DELIVERY PARTNER VEHICLE DETAILS)
CREATE TABLE rider_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'scooter' CHECK (vehicle_type IN ('scooter', 'motorcycle', 'ev', 'bicycle')),
  vehicle_number TEXT NOT NULL,
  driving_license TEXT NOT NULL,
  delivery_city TEXT NOT NULL DEFAULT 'Bengaluru',
  is_online BOOLEAN DEFAULT TRUE,
  current_latitude NUMERIC(10,7),
  current_longitude NUMERIC(10,7),
  total_deliveries INT DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 4.90,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ORDERS TABLE (CUSTOMER ORDERS & FULFILLMENT PIPELINE)
CREATE TABLE orders (
  id TEXT PRIMARY KEY DEFAULT ('GK-' || floor(10000 + random() * 90000)::text),
  fulfillment_mode TEXT DEFAULT 'store_selected',
  store_id UUID REFERENCES shops(id) ON DELETE SET NULL,
  store_name TEXT DEFAULT 'Local Grocery Store',
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  rider_id UUID REFERENCES rider_profiles(id) ON DELETE SET NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'Cash on Delivery',
  payment_status TEXT DEFAULT 'Paid',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'accepted', 'preparing', 'ready', 'picked_up', 'out_for_delivery', 'completed', 'rejected'
  )),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 10. CREATE PERMISSIVE RLS POLICIES FOR CUSTOMER & PARTNER APPS
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public write profiles" ON profiles FOR ALL USING (true);

CREATE POLICY "Public read customer_addresses" ON customer_addresses FOR SELECT USING (true);
CREATE POLICY "Public write customer_addresses" ON customer_addresses FOR ALL USING (true);

CREATE POLICY "Public read shops" ON shops FOR SELECT USING (true);
CREATE POLICY "Public write shops" ON shops FOR ALL USING (true);

CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public write products" ON products FOR ALL USING (true);

CREATE POLICY "Public read rider_profiles" ON rider_profiles FOR SELECT USING (true);
CREATE POLICY "Public write rider_profiles" ON rider_profiles FOR ALL USING (true);

CREATE POLICY "Public read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Public write orders" ON orders FOR ALL USING (true);

-- 11. INDEXES FOR HIGH-PERFORMANCE SEARCHES
CREATE INDEX idx_shops_city ON shops(city);
CREATE INDEX idx_products_shop_id ON products(shop_id);
CREATE INDEX idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_rider_profiles_phone ON rider_profiles(phone);
