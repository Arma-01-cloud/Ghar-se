-- ============================================================================
-- GHARSEE HARDENED ROW-LEVEL SECURITY MIGRATION
-- Date: 2026-08-17
--
-- This migration replaces the permissive "USING (true)" policies applied by
-- earlier migrations with least-privilege policies that:
--   * still allow the public anon key to discover shops/products for browsing
--   * allow customers to read/write only their own profiles, addresses and orders
--   * allow shopkeepers to read/write only their own shop, products and orders
--   * allow riders to read only their own profile, related notifications, and
--     orders that have been assigned to them
--   * prevent any role from updating their own `role` column
--
-- IMPORTANT: This migration does NOT change data and does NOT drop tables.
-- It only DROPs and recreates RLS policies. Run-time behavior of the web
-- client depends on auth.uid() being non-null, which requires the production
-- deployment to switch from the custom phone+password auth to Supabase
-- Auth (auth.users). Until that switch happens, anon-key requests will
-- continue to work for public catalog reads, but writes will be denied.
-- ============================================================================

-- 1. Helper function: extract last 10 digits from a phone number
CREATE OR REPLACE FUNCTION public.last_10_digits(p TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN RIGHT(regexp_replace(COALESCE(p, ''), '\D', '', 'g'), 10);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Helper: get the auth user's role from public.profiles (NULL if not logged in)
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- 3. PROFILES
-- ============================================================================
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public write profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles select own" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insert own" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update own safe fields" ON public.profiles;

CREATE POLICY "Profiles select own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Profiles insert own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users may update safe fields of their own row, but NEVER their role.
CREATE POLICY "Profiles update own safe fields" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- ============================================================================
-- 4. CUSTOMER ADDRESSES — keyed by phone
-- ============================================================================
DROP POLICY IF EXISTS "Public read customer_addresses" ON public.customer_addresses;
DROP POLICY IF EXISTS "Public write customer_addresses" ON public.customer_addresses;

CREATE POLICY "Customer addresses select own" ON public.customer_addresses
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND phone IS NOT NULL
    AND last_10_digits(phone) = (
      SELECT last_10_digits(p.phone) FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Customer addresses insert own" ON public.customer_addresses
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND last_10_digits(phone) = (
      SELECT last_10_digits(p.phone) FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Customer addresses update own" ON public.customer_addresses
  FOR UPDATE USING (
    auth.uid() IS NOT NULL
    AND last_10_digits(phone) = (
      SELECT last_10_digits(p.phone) FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

-- ============================================================================
-- 5. SHOPS — public catalog read, owner-only write
-- ============================================================================
DROP POLICY IF EXISTS "Public read shops" ON public.shops;
DROP POLICY IF EXISTS "Public write shops" ON public.shops;

-- Anyone (including anon) can discover open shops for the catalog.
-- The client filters by status='open' & is_approved=true, so this exposes
-- only approved-open shops.
CREATE POLICY "Shops public read" ON public.shops
  FOR SELECT USING (
    is_approved = true AND (is_open = true OR status = 'open')
  );

CREATE POLICY "Shops owner read" ON public.shops
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND auth.uid() = owner_id
  );

CREATE POLICY "Shops owner insert" ON public.shops
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND auth.uid() = owner_id
  );

CREATE POLICY "Shops owner update" ON public.shops
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND auth.uid() = owner_id
  );

-- ============================================================================
-- 6. PRODUCTS — public read, owner-only write
-- ============================================================================
DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Public write products" ON public.products;

CREATE POLICY "Products public read" ON public.products
  FOR SELECT USING (
    shop_id IN (
      SELECT id FROM public.shops
      WHERE is_approved = true AND (is_open = true OR status = 'open')
    )
  );

CREATE POLICY "Products owner write" ON public.products
  FOR ALL USING (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
  );

-- ============================================================================
-- 7. RIDER PROFILES — owner-only read/write
-- ============================================================================
DROP POLICY IF EXISTS "Public read rider_profiles" ON public.rider_profiles;
DROP POLICY IF EXISTS "Public write rider_profiles" ON public.rider_profiles;

CREATE POLICY "Rider profiles self" ON public.rider_profiles
  FOR ALL USING (
    auth.uid() IS NOT NULL AND auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND auth.uid() = user_id
  );

-- ============================================================================
-- 8. ORDERS
-- ============================================================================
DROP POLICY IF EXISTS "Public read orders" ON public.orders;
DROP POLICY IF EXISTS "Public write orders" ON public.orders;

-- Customers may insert their own orders.
CREATE POLICY "Orders customer insert" ON public.orders
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Customers read only their own orders (by phone).
CREATE POLICY "Orders customer read" ON public.orders
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND last_10_digits(customer_phone) = (
      SELECT last_10_digits(p.phone) FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

-- Shopkeepers read/update only orders for their shop.
CREATE POLICY "Orders shopkeeper read" ON public.orders
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
  );

CREATE POLICY "Orders shopkeeper update" ON public.orders
  FOR UPDATE USING (
    store_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
  );

-- Riders read only orders assigned to them.
CREATE POLICY "Orders rider read" ON public.orders
  FOR SELECT USING (
    rider_id IN (
      SELECT id FROM public.rider_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Orders rider update" ON public.orders
  FOR UPDATE USING (
    rider_id IN (
      SELECT id FROM public.rider_profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 9. ORDER ITEMS — restricted to order owners
-- ============================================================================
DROP POLICY IF EXISTS "Public read order_items" ON public.order_items;
DROP POLICY IF EXISTS "Public write order_items" ON public.order_items;

CREATE POLICY "Order items customer read" ON public.order_items
  FOR SELECT USING (
    order_id IN (
      SELECT o.id FROM public.orders o
      WHERE last_10_digits(o.customer_phone) = (
        SELECT last_10_digits(p.phone) FROM public.profiles p WHERE p.id = auth.uid()
      )
    )
  );

CREATE POLICY "Order items shopkeeper read" ON public.order_items
  FOR SELECT USING (
    order_id IN (
      SELECT o.id FROM public.orders o
      WHERE o.store_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
    )
  );

CREATE POLICY "Order items rider read" ON public.order_items
  FOR SELECT USING (
    order_id IN (
      SELECT o.id FROM public.orders o
      WHERE o.rider_id IN (
        SELECT id FROM public.rider_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Order items customer insert" ON public.order_items
  FOR INSERT WITH CHECK (
    order_id IN (
      SELECT o.id FROM public.orders o
      WHERE last_10_digits(o.customer_phone) = (
        SELECT last_10_digits(p.phone) FROM public.profiles p WHERE p.id = auth.uid()
      )
    )
  );

-- ============================================================================
-- 10. RIDER NOTIFICATIONS / DELIVERY ASSIGNMENTS
-- ============================================================================
DROP POLICY IF EXISTS "Public read rider_notifications" ON public.rider_notifications;
DROP POLICY IF EXISTS "Public write rider_notifications" ON public.rider_notifications;
DROP POLICY IF EXISTS "Public read rider_delivery_assignments" ON public.rider_delivery_assignments;
DROP POLICY IF EXISTS "Public write rider_delivery_assignments" ON public.rider_delivery_assignments;

CREATE POLICY "Rider notifications self" ON public.rider_notifications
  FOR ALL USING (
    rider_id IN (
      SELECT id FROM public.rider_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    rider_id IN (
      SELECT id FROM public.rider_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Rider delivery assignments self" ON public.rider_delivery_assignments
  FOR ALL USING (
    rider_id IN (
      SELECT id FROM public.rider_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    rider_id IN (
      SELECT id FROM public.rider_profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 11. STORAGE POLICIES (defense in depth)
-- ============================================================================
-- The product/grocery image upload pipeline currently does NOT use Supabase
-- Storage — uploads are stored as compressed data-URLs in the `products`
-- row. No storage buckets are used at present, so no storage policies are
-- required. If a bucket is later added (e.g. 'product-images'), the
-- following policies are the recommended starting point:
--
--   CREATE POLICY "Public read product images" ON storage.objects
--     FOR SELECT USING (bucket_id = 'product-images');
--   CREATE POLICY "Shopkeepers upload product images" ON storage.objects
--     FOR INSERT WITH CHECK (
--       bucket_id = 'product-images'
--       AND auth.uid() IN (
--         SELECT owner_id FROM public.shops WHERE id::text = (storage.foldername(name))[1]
--       )
--     );
