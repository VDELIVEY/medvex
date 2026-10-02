-- ============================================================================
-- Phase 4: Patient Security PIN & Scan Notifications
-- Run this in the Supabase SQL Editor
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Add contact and security fields to patients
-- ----------------------------------------------------------------------------
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS security_pin_hash TEXT;

COMMENT ON COLUMN patients.phone IS 'Patient contact phone number for SMS notifications.';
COMMENT ON COLUMN patients.email IS 'Patient email address for email notifications.';
COMMENT ON COLUMN patients.security_pin_hash IS 'Bcrypt hash of the 4-digit patient security PIN.';

-- ----------------------------------------------------------------------------
-- 2. Scan notifications log
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scan_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  episode_id UUID REFERENCES episodes(id) ON DELETE SET NULL,
  scanned_by UUID REFERENCES staff(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL DEFAULT 'qr_scan_access',
  channel TEXT NOT NULL DEFAULT 'sms,email',
  recipient_phone TEXT,
  recipient_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'partial')),
  provider_response JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE scan_notifications IS 'Audit log and dispatch record for patient QR scan notifications.';

-- ----------------------------------------------------------------------------
-- 3. Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_scan_notifications_patient_id ON scan_notifications(patient_id);
CREATE INDEX IF NOT EXISTS idx_scan_notifications_episode_id ON scan_notifications(episode_id);
CREATE INDEX IF NOT EXISTS idx_scan_notifications_status ON scan_notifications(status);
CREATE INDEX IF NOT EXISTS idx_scan_notifications_created_at ON scan_notifications(created_at DESC);

-- ----------------------------------------------------------------------------
-- 4. Trigger for updated_at
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_scan_notifications_updated_at'
      AND tgrelid = 'scan_notifications'::regclass
  ) THEN
    CREATE TRIGGER update_scan_notifications_updated_at
      BEFORE UPDATE ON scan_notifications
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 5. RLS
-- ----------------------------------------------------------------------------
ALTER TABLE scan_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY scan_notifications_select_authenticated ON scan_notifications
  FOR SELECT TO authenticated USING (true);

CREATE POLICY scan_notifications_manage_superadmin ON scan_notifications
  FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());
