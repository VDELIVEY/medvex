-- Add chief_complaint to episodes
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS chief_complaint TEXT;

COMMENT ON COLUMN episodes.chief_complaint IS 'Patient chief complaint / reason for visit.';
