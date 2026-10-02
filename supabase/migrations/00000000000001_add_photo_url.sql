-- Migration to add photo_url column to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS photo_url TEXT;
