-- ====================================================================
-- Migration V6: Add Missing Entity Columns for ETA Monitoring & Traffic Congestion
-- ====================================================================

-- 1. Convoy ETA threshold monitoring columns
ALTER TABLE convoys ADD COLUMN IF NOT EXISTS estimated_arrival_time TIMESTAMP;
ALTER TABLE convoys ADD COLUMN IF NOT EXISTS eta_exceeded_alert_sent BOOLEAN DEFAULT FALSE;

-- 2. Road segment traffic congestion index
ALTER TABLE road_segments ADD COLUMN IF NOT EXISTS traffic_congestion_index DOUBLE PRECISION DEFAULT 0.0;
