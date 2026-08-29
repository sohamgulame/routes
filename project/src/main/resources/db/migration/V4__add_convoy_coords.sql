-- ====================================================================
-- Migration V4: Add Origin and Destination Geocoded Coordinates to Convoys
-- ====================================================================

ALTER TABLE convoys ADD COLUMN IF NOT EXISTS origin_latitude DOUBLE PRECISION;
ALTER TABLE convoys ADD COLUMN IF NOT EXISTS origin_longitude DOUBLE PRECISION;
ALTER TABLE convoys ADD COLUMN IF NOT EXISTS dest_latitude DOUBLE PRECISION;
ALTER TABLE convoys ADD COLUMN IF NOT EXISTS dest_longitude DOUBLE PRECISION;
