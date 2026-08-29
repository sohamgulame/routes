-- Migration V5: Alter photo_url column to TEXT to accommodate Base64 field images
ALTER TABLE incident_reports ALTER COLUMN photo_url TYPE TEXT;
