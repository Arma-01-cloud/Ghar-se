-- ============================================================================
-- GHARSEE SHOPS & RIDERS APPROVAL SCHEMA HARDENING MIGRATION
-- Date: 2026-08-20
-- ============================================================================

-- Safely add is_approved column to shops table if missing
ALTER TABLE IF EXISTS public.shops ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE;

-- Safely add is_approved & status columns to rider_profiles table if missing
ALTER TABLE IF EXISTS public.rider_profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE;
ALTER TABLE IF EXISTS public.rider_profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Allow admin & public read/write updates for operational status
DROP POLICY IF EXISTS "Shops status update" ON public.shops;
CREATE POLICY "Shops status update" ON public.shops
  FOR UPDATE USING (true)
  WITH CHECK (true);
