-- Add assigned_doctor_id to episodes
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS assigned_doctor_id UUID REFERENCES staff(id) ON DELETE SET NULL;

COMMENT ON COLUMN episodes.assigned_doctor_id IS 'Optional staff doctor assigned to this episode.';
