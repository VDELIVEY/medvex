-- ============================================================================
-- MedQR Production-Ready Initial Schema
-- Run this in the Supabase SQL Editor (New query → Paste → Run)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Extensions
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 2. Enums
-- ----------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'doctor', 'receptionist', 'cashier', 'lab', 'pharmacy');

CREATE TYPE episode_status AS ENUM (
  'created',
  'paid_consultation',
  'in_consultation',
  'waiting_lab',
  'lab_results_ready',
  'waiting_pharmacy_payment',
  'prescription_ready',
  'completed',
  'cancelled'
);

CREATE TYPE test_status AS ENUM ('pending', 'paid', 'in_progress', 'completed', 'cancelled');

CREATE TYPE payment_method AS ENUM ('cash', 'mobile', 'card', 'insurance', 'waived');
CREATE TYPE payment_type AS ENUM ('consultation', 'lab', 'pharmacy', 'other');

CREATE TYPE blood_type AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown');

CREATE TYPE gender AS ENUM ('Male', 'Female', 'Other');

CREATE TYPE audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- ----------------------------------------------------------------------------
-- 3. Core Tables
-- ----------------------------------------------------------------------------

-- Institutions (must be created before profiles because profiles FKs to it)
CREATE TABLE institutions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  owner TEXT NOT NULL,
  license_number TEXT,
  services TEXT[] DEFAULT '{}',
  portal_key TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE institutions IS 'Healthcare institutions registered on the platform.';

-- Profiles extending Supabase auth.users
-- Only users who sign up via Supabase Auth get a row here (e.g. superadmins).
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'superadmin',
  phone TEXT,
  email TEXT,
  institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE profiles IS 'Extends Supabase Auth for platform users (superadmins, future institution admins via SSO).';
COMMENT ON COLUMN profiles.role IS 'Supabase Auth user role. Staff use the staff/staff_credentials tables instead.';

-- Staff members (doctors, receptionists, cashiers, lab, pharmacy)
CREATE TABLE staff (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  age INT NOT NULL CONSTRAINT chk_staff_age CHECK (age >= 18 AND age <= 100),
  gender gender NOT NULL,
  occupation user_role NOT NULL,
  doctor_services TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  -- Optional link to Supabase Auth for future SSO migration
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE staff IS 'Staff members belonging to an institution.';
COMMENT ON COLUMN staff.user_id IS 'Optional Supabase Auth UUID for future unified authentication.';

-- Staff credentials for custom portal login (bcrypt hashed)
CREATE TABLE staff_credentials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE staff_credentials IS 'Username/password store for staff portal login. Passwords must be hashed with bcrypt (cost factor 12+).';

-- Patients / Citizens
CREATE TABLE patients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  qr_code TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  age INT NOT NULL CONSTRAINT chk_patient_age CHECK (age >= 0 AND age <= 150),
  gender gender NOT NULL,
  blood_type blood_type DEFAULT 'Unknown',
  underlying_conditions TEXT,
  medical_history TEXT,
  allergies TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE patients IS 'Registered citizens / patients with unique QR codes.';

-- Episodes (patient visits)
CREATE TABLE episodes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  episode_code TEXT UNIQUE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE NOT NULL,
  status episode_status DEFAULT 'created',
  receptionist_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE episodes IS 'A single patient visit/episode at an institution.';

-- Diagnoses
CREATE TABLE diagnoses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  notes TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE diagnoses IS 'Doctor diagnoses linked to an episode.';

-- Test Requests & Results
CREATE TABLE test_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  test_type TEXT NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  results TEXT,
  lab_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  status test_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE test_requests IS 'Laboratory test requests and results.';

-- Prescriptions
CREATE TABLE prescriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  medication TEXT NOT NULL,
  dosage TEXT NOT NULL,
  instructions TEXT,
  paid BOOLEAN DEFAULT FALSE,
  dispensed BOOLEAN DEFAULT FALSE,
  pharmacy_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE prescriptions IS 'Medication prescriptions linked to an episode.';

-- Payments
CREATE TABLE payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CONSTRAINT chk_payment_amount CHECK (amount >= 0),
  method payment_method NOT NULL,
  type payment_type NOT NULL,
  cashier_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  receipt_number TEXT UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE payments IS 'Financial transactions for episodes.';

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action audit_action NOT NULL,
  old_data JSONB,
  new_data JSONB,
  performed_by UUID,
  performed_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE audit_logs IS 'Immutable audit trail for data changes.';

-- ----------------------------------------------------------------------------
-- 4. Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_patients_qr_code ON patients(qr_code);
CREATE INDEX idx_episodes_patient_id ON episodes(patient_id);
CREATE INDEX idx_episodes_institution_id ON episodes(institution_id);
CREATE INDEX idx_episodes_status ON episodes(status);
CREATE INDEX idx_episodes_episode_code ON episodes(episode_code);
CREATE INDEX idx_diagnoses_episode_id ON diagnoses(episode_id);
CREATE INDEX idx_test_requests_episode_id ON test_requests(episode_id);
CREATE INDEX idx_prescriptions_episode_id ON prescriptions(episode_id);
CREATE INDEX idx_payments_episode_id ON payments(episode_id);
CREATE INDEX idx_staff_institution_id ON staff(institution_id);
CREATE INDEX idx_staff_user_id ON staff(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_staff_credentials_username ON staff_credentials(username);
CREATE INDEX idx_staff_credentials_staff_id ON staff_credentials(staff_id);
CREATE INDEX idx_institutions_portal_key ON institutions(portal_key);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_performed_at ON audit_logs(performed_at DESC);

-- ----------------------------------------------------------------------------
-- 5. Trigger Functions
-- ----------------------------------------------------------------------------

-- Auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-create profile on new Supabase Auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'New'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'superadmin')::user_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit logging trigger
CREATE OR REPLACE FUNCTION public.audit_trigger_fn()
RETURNS TRIGGER AS $$
DECLARE
  _old_data JSONB;
  _new_data JSONB;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    _old_data = to_jsonb(OLD);
    _new_data = to_jsonb(NEW);
    -- Skip if nothing actually changed
    IF _old_data = _new_data THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    _old_data = to_jsonb(OLD);
    _new_data = NULL;
  ELSIF TG_OP = 'INSERT' THEN
    _old_data = NULL;
    _new_data = to_jsonb(NEW);
  END IF;

  INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, performed_by)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP::audit_action,
    _old_data,
    _new_data,
    auth.uid()
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 6. Attach Triggers
-- ----------------------------------------------------------------------------

-- updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_institutions_updated_at BEFORE UPDATE ON institutions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_credentials_updated_at BEFORE UPDATE ON staff_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_episodes_updated_at BEFORE UPDATE ON episodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diagnoses_updated_at BEFORE UPDATE ON diagnoses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_requests_updated_at BEFORE UPDATE ON test_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Audit triggers (skip audit_logs to avoid recursion)
CREATE TRIGGER audit_institutions AFTER INSERT OR UPDATE OR DELETE ON institutions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER audit_staff AFTER INSERT OR UPDATE OR DELETE ON staff
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER audit_staff_credentials AFTER INSERT OR UPDATE OR DELETE ON staff_credentials
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER audit_patients AFTER INSERT OR UPDATE OR DELETE ON patients
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER audit_episodes AFTER INSERT OR UPDATE OR DELETE ON episodes
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER audit_diagnoses AFTER INSERT OR UPDATE OR DELETE ON diagnoses
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER audit_test_requests AFTER INSERT OR UPDATE OR DELETE ON test_requests
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER audit_prescriptions AFTER INSERT OR UPDATE OR DELETE ON prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER audit_profiles AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- ----------------------------------------------------------------------------
-- 7. Row Level Security (RLS)
-- ----------------------------------------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is a superadmin via profiles
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles policies
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (auth.uid() = id OR public.is_superadmin());

CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_superadmin()) WITH CHECK (auth.uid() = id OR public.is_superadmin());

-- Institutions policies
CREATE POLICY institutions_select_authenticated ON institutions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY institutions_manage_superadmin ON institutions
  FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Staff policies
CREATE POLICY staff_select_authenticated ON staff
  FOR SELECT TO authenticated USING (true);

CREATE POLICY staff_manage_superadmin ON staff
  FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Staff credentials policies (superadmin only; API routes use service role)
CREATE POLICY staff_creds_superadmin ON staff_credentials
  FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Patients policies
CREATE POLICY patients_select_authenticated ON patients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY patients_manage_superadmin ON patients
  FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Episodes policies
CREATE POLICY episodes_select_authenticated ON episodes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY episodes_manage_superadmin ON episodes
  FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Diagnoses policies
CREATE POLICY diagnoses_select_authenticated ON diagnoses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY diagnoses_manage_superadmin ON diagnoses
  FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Test requests policies
CREATE POLICY tests_select_authenticated ON test_requests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY tests_manage_superadmin ON test_requests
  FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Prescriptions policies
CREATE POLICY prescriptions_select_authenticated ON prescriptions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY prescriptions_manage_superadmin ON prescriptions
  FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Payments policies
CREATE POLICY payments_select_authenticated ON payments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY payments_manage_superadmin ON payments
  FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Audit logs policies (read-only for superadmin; API routes use service role)
CREATE POLICY audit_logs_select_superadmin ON audit_logs
  FOR SELECT TO authenticated USING (public.is_superadmin());

-- ============================================================================
-- 8. Notes
-- ============================================================================
-- 
-- SERVICE ROLE:
--   Next.js API routes use the Supabase Service Role Key, which bypasses RLS
--   by design. Therefore API routes do NOT need explicit RLS policies.
--   The open "FOR ALL USING (true)" policies have been removed to prevent
--   accidental exposure if the anon key is used directly from the client.
--
-- STAFF AUTH:
--   Staff currently authenticate via the custom staff_credentials table
--   (username + bcrypt hash) through API routes. If you migrate staff to
--   Supabase Auth, populate staff.user_id and create a profiles row for them.
--
-- AUDIT:
--   All data mutations on core tables are automatically logged to audit_logs.
--   performed_by will be NULL for service-role API calls; track the actor
--   at the application layer if required.
--
-- PROFILE CREATION:
--   When a new user signs up via Supabase Auth, a profiles row is created
--   automatically by the on_auth_user_created trigger.
--
-- ============================================================================

