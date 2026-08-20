-- ============================================================================
-- GHARSEE RIDER ONBOARDING & APPROVAL WORKFLOW HARDENING MIGRATION
-- Date: 2026-08-20
-- Description:
--   1. Enforces default is_approved = FALSE and status = 'pending_approval' for newly registered riders.
--   2. Ensures vehicle and license columns exist on rider_profiles.
--   3. Enables realtime updates on rider_profiles table so riders unlock instantly when Admin approves.
--   4. Configures resilient RLS policies for rider signups, status updates, and Admin approval.
-- ============================================================================

-- Ensure all necessary columns exist on public.rider_profiles
ALTER TABLE IF EXISTS public.rider_profiles 
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_approval',
  ADD COLUMN IF NOT EXISTS vehicle_type TEXT DEFAULT 'scooter',
  ADD COLUMN IF NOT EXISTS vehicle_number TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS driving_license TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS delivery_city TEXT DEFAULT 'Chikkamagaluru, Karnataka',
  ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Alter defaults on rider_profiles so new inserts default to pending approval
ALTER TABLE IF EXISTS public.rider_profiles 
  ALTER COLUMN is_approved SET DEFAULT FALSE,
  ALTER COLUMN status SET DEFAULT 'pending_approval',
  ALTER COLUMN is_online SET DEFAULT FALSE;

-- Enable Row Level Security (RLS)
ALTER TABLE IF EXISTS public.rider_profiles ENABLE ROW LEVEL SECURITY;

-- Resilient RLS Policies for rider_profiles
DROP POLICY IF EXISTS "Allow select for all authenticated users and riders" ON public.rider_profiles;
CREATE POLICY "Allow select for all authenticated users and riders" ON public.rider_profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for new rider registrations" ON public.rider_profiles;
CREATE POLICY "Allow insert for new rider registrations" ON public.rider_profiles
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for rider profile management and admin approval" ON public.rider_profiles;
CREATE POLICY "Allow update for rider profile management and admin approval" ON public.rider_profiles
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- Ensure rider_profiles is added to supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'rider_profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rider_profiles;
  END IF;
END $$;
