-- Add date_of_birth column to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS dob DATE;

-- Backfill dob from age where possible (approximate: Jan 1 of birth year)
-- This is a best-effort backfill for existing rows.
UPDATE patients
SET dob = (
  make_date(
    EXTRACT(YEAR FROM NOW())::int - age,
    1,
    1
  )
)
WHERE dob IS NULL AND age > 0;

COMMENT ON COLUMN patients.dob IS 'Citizen date of birth in YYYY-MM-DD format. Age remains stored for quick computation.';