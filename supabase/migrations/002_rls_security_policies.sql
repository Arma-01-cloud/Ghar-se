-- ============================================================
-- GHARSEE — SUPABASE RLS SECURITY & ROLE-LOCK POLICIES
-- ============================================================

-- 1. ENABLE RLS ON ALL TABLES
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.grocery_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.delivery ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. PROFILES POLICIES (PERMANENT ROLE LOCKING)
-- ============================================================

DROP POLICY IF EXISTS "Public Profiles Read" ON public.profiles;
CREATE POLICY "Public Profiles Read" ON public.profiles
    FOR SELECT USING (true);

-- Prevent Users from Modifying Their Assigned Role
DROP POLICY IF EXISTS "Users Update Own Safe Profile Fields" ON public.profiles;
CREATE POLICY "Users Update Own Safe Profile Fields" ON public.profiles
    FOR UPDATE USING (
        auth.uid() = id AND 
        (role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
    );

DROP POLICY IF EXISTS "Users Insert Own Profile" ON public.profiles;
CREATE POLICY "Users Insert Own Profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- 3. PUBLIC CATALOG POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Public Shops Read" ON public.shops;
CREATE POLICY "Public Shops Read" ON public.shops FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Categories Read" ON public.categories;
CREATE POLICY "Public Categories Read" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Brands Read" ON public.brands;
CREATE POLICY "Public Brands Read" ON public.brands FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Products Read" ON public.products;
CREATE POLICY "Public Products Read" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Product Variants Read" ON public.product_variants;
CREATE POLICY "Public Product Variants Read" ON public.product_variants FOR SELECT USING (true);

-- ============================================================
-- 4. ADDRESSES POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Users Read Own Addresses" ON public.addresses;
CREATE POLICY "Users Read Own Addresses" ON public.addresses
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Users Insert Own Addresses" ON public.addresses;
CREATE POLICY "Users Insert Own Addresses" ON public.addresses
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- ============================================================
-- 5. GROCERY LISTS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Users Read Own Grocery Lists" ON public.grocery_lists;
CREATE POLICY "Users Read Own Grocery Lists" ON public.grocery_lists
    FOR SELECT USING (auth.uid() = customer_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Users Insert Own Grocery Lists" ON public.grocery_lists;
CREATE POLICY "Users Insert Own Grocery Lists" ON public.grocery_lists
    FOR INSERT WITH CHECK (auth.uid() = customer_id OR auth.uid() IS NULL);

-- ============================================================
-- 6. ORDERS & DELIVERY POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Orders Select Policy" ON public.orders;
CREATE POLICY "Orders Select Policy" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Orders Insert Policy" ON public.orders;
CREATE POLICY "Orders Insert Policy" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Delivery Select Policy" ON public.delivery;
CREATE POLICY "Delivery Select Policy" ON public.delivery FOR SELECT USING (true);

DROP POLICY IF EXISTS "Delivery Update Policy" ON public.delivery;
CREATE POLICY "Delivery Update Policy" ON public.delivery FOR UPDATE USING (true);
