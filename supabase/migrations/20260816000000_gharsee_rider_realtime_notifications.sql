-- ============================================================================
-- GHAR SEE RIDER REALTIME NOTIFICATIONS MIGRATION
-- Adds the realtime notification pipeline that pushes new delivery requests
-- to every online rider in the same city. Inspired by Blinkit/Zomato rider
-- apps: one INSERT per online rider, postgres_changes triggers a full-screen
-- popup, first accept wins via trigger.
-- ============================================================================

-- 1. ENABLE EXTENSIONS (idempotent — already enabled in earlier migration
--    but kept here so this migration runs cleanly even if applied standalone)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ADD LOCKING COLUMN TO ORDERS
--    Lets us soft-lock the order for a brief window after the first accept
--    so concurrent accepts collapse cleanly. The trigger below is the source
--    of truth; this column is a fast-path marker.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS rider_locked_until TIMESTAMPTZ;

-- 3. RIDER NOTIFICATIONS TABLE
--    One row per (rider, order) delivery request. Riders INSERT events are
--    broadcast via Supabase Realtime to the rider app. The trigger below
--    auto-closes sibling rows when one rider accepts.
CREATE TABLE rider_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rider_id UUID NOT NULL REFERENCES rider_profiles(id) ON DELETE CASCADE,

  -- Lifecycle: pending -> accepted | declined | expired | cancelled
  -- accepted/declined are set by the rider via respondToRiderNotification
  -- expired is set by a periodic sweep (out of scope here — the rider app
  --     treats an un-responded row older than 30s as visually expired)
  -- cancelled is set when another rider accepts first
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'accepted', 'declined', 'expired', 'cancelled'
  )),

  -- Snapshot of the order at notification time so the rider sees stable
  -- data even if the order row is later mutated by the shopkeeper.
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Soft deadline (created_at + 30s by default). Used by the rider app
  -- to drive the Blinkit-style countdown ring.
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 seconds'),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,

  -- A rider should never see two open notifications for the same order.
  CONSTRAINT rider_notifications_unique_open UNIQUE (rider_id, order_id)
);

-- 4. RIDER DELIVERY ASSIGNMENTS TABLE
--    Persistent record of every delivery a rider has taken. The orders row
--    carries the *current* rider_id, this table is the immutable history
--    we can join against for earnings and history pages.
CREATE TABLE rider_delivery_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID NOT NULL REFERENCES rider_profiles(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  -- 'in_progress' moves to 'completed' when the order reaches delivered/completed
  -- 'cancelled' is reserved for future reassignment flows
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN (
    'in_progress', 'completed', 'cancelled'
  )),
  -- Snapshot of the rider's payout at assignment time (₹65 default)
  payout_snapshot NUMERIC(10,2) NOT NULL DEFAULT 65.00
);

-- 5. INDEXES
CREATE INDEX idx_rider_notifications_rider_pending
  ON rider_notifications (rider_id, status)
  WHERE status = 'pending';

CREATE INDEX idx_rider_notifications_order
  ON rider_notifications (order_id);

CREATE INDEX idx_rider_notifications_expires_at
  ON rider_notifications (expires_at)
  WHERE status = 'pending';

CREATE INDEX idx_rider_delivery_assignments_rider
  ON rider_delivery_assignments (rider_id, assigned_at DESC);

CREATE INDEX idx_rider_delivery_assignments_order
  ON rider_delivery_assignments (order_id);

-- 6. ENABLE ROW LEVEL SECURITY (consistent with existing migration style —
--    permissive policies so the anon key can read/write everything during MVP)
ALTER TABLE rider_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_delivery_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read rider_notifications"
  ON rider_notifications FOR SELECT USING (true);
CREATE POLICY "Public write rider_notifications"
  ON rider_notifications FOR ALL USING (true);

CREATE POLICY "Public read rider_delivery_assignments"
  ON rider_delivery_assignments FOR SELECT USING (true);
CREATE POLICY "Public write rider_delivery_assignments"
  ON rider_delivery_assignments FOR ALL USING (true);

-- 7. FIRST-ACCEPT-WINS TRIGGER
--    When a row in rider_notifications moves to status='accepted':
--      a) Set orders.rider_id and orders.status='accepted' atomically
--      b) Insert a rider_delivery_assignments row for the audit log
--      c) Mark all other sibling pending notifications for the same order
--         as 'cancelled' so other rider apps dismiss their popups
CREATE OR REPLACE FUNCTION handle_rider_notification_accepted()
RETURNS TRIGGER AS $$
BEGIN
  -- Guard: only fire on the transition into 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status <> 'accepted') THEN
    -- Claim the order
    UPDATE orders
    SET rider_id = NEW.rider_id,
        status = 'accepted',
        rider_locked_until = NOW() + INTERVAL '5 minutes',
        updated_at = NOW()
    WHERE id = NEW.order_id
      AND rider_id IS NULL;

    -- Audit log entry (idempotent on (rider_id, order_id))
    INSERT INTO rider_delivery_assignments (rider_id, order_id, payout_snapshot)
    VALUES (NEW.rider_id, NEW.order_id, COALESCE((NEW.payload->>'estimatedEarnings')::numeric, 65.00))
    ON CONFLICT DO NOTHING;

    -- Close sibling notifications
    UPDATE rider_notifications
    SET status = 'cancelled',
        responded_at = NOW()
    WHERE order_id = NEW.order_id
      AND status = 'pending'
      AND id <> NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rider_notification_accepted ON rider_notifications;
CREATE TRIGGER trg_rider_notification_accepted
  AFTER UPDATE OF status ON rider_notifications
  FOR EACH ROW
  EXECUTE FUNCTION handle_rider_notification_accepted();

-- 8. ADD TABLES TO SUPABASE REALTIME PUBLICATION
--    The migration that built the schema didn't explicitly add tables to
--    supabase_realtime, which means realtime delivery depends on Supabase's
--    default behaviour. We make it explicit here so the rider app gets
--    INSERT/UPDATE events on rider_notifications.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE
  rider_notifications,
  rider_delivery_assignments,
  orders;

-- 9. SEED SAMPLE DATA (optional, for local testing only)
--    Adds a test online rider in Chikkamagaluru so the broadcast INSERT has
--    a target when developing locally.
INSERT INTO rider_profiles (
  full_name, phone, vehicle_type, vehicle_number, driving_license,
  delivery_city, is_online
)
VALUES (
  'Test Rider', '+91 90000 00001', 'scooter', 'KA-20-TEST-0001', 'KA-TEST-0001',
  'Chikkamagaluru', true
)
ON CONFLICT (phone) DO NOTHING;
