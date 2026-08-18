-- ============================================================================
-- GHARSEE DIRECT GROCERY IMAGE ORDERS & STORAGE MIGRATION
-- Migration Date: 2026-08-18
--
-- Features:
-- 1. Creates public 'grocery-orders' Supabase Storage bucket for compressed grocery images
-- 2. Sets RLS Storage policies allowing customers to upload and shopkeepers/customers to view
-- 3. Ensures 'orders' table supports direct image orders, notes, and storage paths
-- ============================================================================

-- 1. CREATE STORAGE BUCKET 'grocery-orders' IF NOT EXISTS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'grocery-orders',
  'grocery-orders',
  true,
  5242880, -- 5 MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- 2. STORAGE RLS POLICIES FOR 'grocery-orders' BUCKET
DROP POLICY IF EXISTS "Public read grocery orders images" ON storage.objects;
DROP POLICY IF EXISTS "Customers upload grocery orders images" ON storage.objects;
DROP POLICY IF EXISTS "Customers update own grocery orders images" ON storage.objects;

-- Allow public read access to uploaded grocery order images so shopkeepers can view via WhatsApp & portal
CREATE POLICY "Public read grocery orders images" ON storage.objects
  FOR SELECT USING (bucket_id = 'grocery-orders');

-- Allow authenticated and anon customers to upload compressed order images to grocery-orders bucket
CREATE POLICY "Customers upload grocery orders images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'grocery-orders'
  );

-- Allow updates/upserts within grocery-orders bucket
CREATE POLICY "Customers update own grocery orders images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'grocery-orders'
  );

-- 3. ENSURE ORDERS TABLE COLUMNS FOR IMAGE ORDER REFERENCES
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS image_path TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quantity NUMERIC DEFAULT 1;

-- 4. RE-VERIFY RLS POLICIES ON ORDERS TABLE TO ENSURE CUSTOMER INSERT FOR IMAGE ORDERS
DROP POLICY IF EXISTS "Orders customer insert image orders" ON public.orders;
CREATE POLICY "Orders customer insert image orders" ON public.orders
  FOR INSERT WITH CHECK (true);
