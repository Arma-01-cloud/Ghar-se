-- ============================================================================
-- GHAR SEE COMPLETE DATABASE REDESIGN MIGRATION
-- Supports Customer, Shopkeeper, and Rider Roles, Vehicle Details,
-- Item Replacement Choices, Delivery Address Snapshots, and Timestamps.
-- ============================================================================

-- 1. DROP OBSOLETE TABLES SAFELY
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS rider_profiles CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS shops CASCADE;
DROP TABLE IF EXISTS customer_addresses CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 3. PROFILES TABLE (ALL USER ACCOUNTS)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'shopkeeper', 'rider')),
  full_name TEXT NOT NULL DEFAULT 'GharSe User',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CUSTOMER ADDRESSES TABLE (KEYED BY MOBILE PHONE NUMBER)
CREATE TABLE customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL REFERENCES profiles(phone) ON DELETE CASCADE,
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
  rating NUMERIC(3,2) DEFAULT 4.90,
  is_open BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'open',
  categories TEXT[] DEFAULT ARRAY['Groceries', 'Dairy', 'Vegetables', 'Rice & Grains'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PRODUCTS TABLE (STORE INVENTORY)
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

-- 7. RIDER PROFILES TABLE (RIDER ACCOUNT & VEHICLE DETAILS)
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

-- 8. ORDERS TABLE (ORDER FULFILLMENT LIFECYCLE)
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
    'pending', 'accepted', 'preparing', 'ready', 'picked_up', 'out_for_delivery', 'completed', 'delivered', 'rejected'
  )),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ORDER ITEMS TABLE (LINE ITEMS WITH REPLACEMENT PREFERENCES)
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT '1 kg',
  replacement_preference TEXT DEFAULT 'replace_brand' CHECK (replacement_preference IN ('replace_brand', 'cancel_item')),
  availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'unavailable', 'replaced')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 11. PERMISSIVE RLS POLICIES FOR WEB CLIENT READ/WRITE ACCESS
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

CREATE POLICY "Public read order_items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Public write order_items" ON order_items FOR ALL USING (true);

-- 12. PERFORMANCE INDEXES
CREATE INDEX idx_customer_addresses_phone ON customer_addresses(phone);
CREATE INDEX idx_shops_city ON shops(city);
CREATE INDEX idx_products_shop_id ON products(shop_id);
CREATE INDEX idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_rider_id ON orders(rider_id);
CREATE INDEX idx_rider_profiles_phone ON rider_profiles(phone);

-- 13. SEED SAMPLE DATA FOR TESTING
INSERT INTO shops (id, name, phone, address, locality, city, state, pincode, image_url, rating, is_open, categories)
VALUES 
  ('a1111111-1111-1111-1111-111111111111', 'Sri Lakshmi Stores', '+919876543210', '100 Feet Road, Indiranagar', 'Indiranagar', 'Bengaluru', 'Karnataka', '560038', '/images/store_lakshmi.jpg', 4.90, true, ARRAY['Groceries', 'Dairy', 'Vegetables', 'Rice & Grains']),
  ('b2222222-2222-2222-2222-222222222222', 'Fresh Mart Supermarket', '+919876588990', 'MG Road, Indiranagar', 'Indiranagar', 'Bengaluru', 'Karnataka', '560038', '/images/store_freshmart.jpg', 4.80, true, ARRAY['Groceries', 'Fruits & Veggies', 'Organic', 'Snacks'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (shop_id, name, category, price, mrp, unit, stock, image_url, description)
VALUES 
  ('a1111111-1111-1111-1111-111111111111', 'Aashirvaad Whole Wheat Atta', 'Rice & Grains', 285.00, 310.00, '5 kg', 50, '/images/cat_rice_grains.jpg', '100% pure whole wheat flour'),
  ('a1111111-1111-1111-1111-111111111111', 'Nandini Pure Toned Milk', 'Dairy', 24.00, 26.00, '500 ml', 60, '/images/cat_dairy.jpg', 'Fresh pasteurized milk'),
  ('b2222222-2222-2222-2222-222222222222', 'Organic Tomatoes', 'Vegetables', 32.00, 40.00, '1 kg', 40, '/images/cat_veg_fruits.jpg', 'Farm fresh red tomatoes');
