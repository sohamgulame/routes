-- Enable PostGIS Extension if not already active
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Users & Roles
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    role VARCHAR(30) NOT NULL, -- ROLE_ADMIN, ROLE_DISASTER_OFFICER, ROLE_TRANSPORTER, ROLE_FIELD_ENGINEER
    state VARCHAR(50),
    district VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. NER Districts & Territorial Boundaries
CREATE TABLE IF NOT EXISTS districts (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL, -- Assam, Meghalaya, Arunachal Pradesh, Nagaland, Manipur, Mizoram, Tripura, Sikkim
    hq_latitude DOUBLE PRECISION NOT NULL,
    hq_longitude DOUBLE PRECISION NOT NULL,
    boundary_geom GEOMETRY(MultiPolygon, 4326),
    connectivity_status VARCHAR(20) DEFAULT 'NORMAL', -- NORMAL, RESTRICTED, SEVERED
    criticality_score DOUBLE PRECISION DEFAULT 0.0,
    active_incidents_count INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Highway & Corridor Road Segments
CREATE TABLE IF NOT EXISTS road_segments (
    id VARCHAR(36) PRIMARY KEY,
    highway_code VARCHAR(50) NOT NULL, -- NH-06, NH-27, NH-29, NH-10, NW-2
    segment_name VARCHAR(150) NOT NULL,
    start_hub VARCHAR(100) NOT NULL,
    end_hub VARCHAR(100) NOT NULL,
    segment_geom GEOMETRY(LineString, 4326) NOT NULL,
    length_km DOUBLE PRECISION NOT NULL,
    elevation_avg_m DOUBLE PRECISION DEFAULT 500.0,
    slope_angle_deg DOUBLE PRECISION DEFAULT 10.0,
    historical_landslide_count INT DEFAULT 0,
    bridge_count INT DEFAULT 0,
    max_weight_limit_tons DOUBLE PRECISION DEFAULT 40.0,
    current_status VARCHAR(20) DEFAULT 'OPEN', -- OPEN, CAUTION, BLOCKED, FLOODED
    current_risk_score DOUBLE PRECISION DEFAULT 0.0, -- 0.0 to 1.0 (from AI)
    disruption_reason TEXT,
    last_risk_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Spatial index on road geometries
CREATE INDEX IF NOT EXISTS idx_road_segments_geom ON road_segments USING GIST(segment_geom);

-- 4. Crowdsourced & Official Incident Reports
CREATE TABLE IF NOT EXISTS incident_reports (
    id VARCHAR(36) PRIMARY KEY,
    reporter_id VARCHAR(36) REFERENCES users(id),
    reporter_name VARCHAR(100),
    reporter_role VARCHAR(30),
    road_segment_id VARCHAR(36) REFERENCES road_segments(id),
    incident_type VARCHAR(50) NOT NULL, -- LANDSLIDE, FLASH_FLOOD, BRIDGE_DAMAGE, ROAD_CAVED_IN, HEAVY_SNOW
    severity VARCHAR(20) NOT NULL, -- LOW, MODERATE, HIGH, CRITICAL
    location_geom GEOMETRY(Point, 4326) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    photo_url VARCHAR(500),
    description TEXT,
    verification_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, VERIFIED, REJECTED, RESOLVED
    verified_by VARCHAR(100),
    synced_from_offline BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_incidents_geom ON incident_reports USING GIST(location_geom);

-- 5. Essential Goods Convoys & Logistics Movement
CREATE TABLE IF NOT EXISTS convoys (
    id VARCHAR(36) PRIMARY KEY,
    vehicle_number VARCHAR(30) UNIQUE NOT NULL,
    driver_name VARCHAR(100) NOT NULL,
    driver_phone VARCHAR(20) NOT NULL,
    transporter_company VARCHAR(100),
    commodity_type VARCHAR(50) NOT NULL, -- MEDICINES, FOOD_GRAINS, FUEL, PERISHABLE_AGRI, RELIEF_MATERIAL
    origin_city VARCHAR(100) NOT NULL,
    destination_city VARCHAR(100) NOT NULL,
    status VARCHAR(30) DEFAULT 'IN_TRANSIT', -- PLANNED, IN_TRANSIT, DELAYED, REROUTED, DELIVERED
    current_latitude DOUBLE PRECISION,
    current_longitude DOUBLE PRECISION,
    current_location GEOMETRY(Point, 4326),
    temperature_celsius DOUBLE PRECISION DEFAULT 4.0, -- For cold-chain
    freshness_decay_index DOUBLE PRECISION DEFAULT 1.0, -- 1.0 = 100% Fresh
    active_route_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. GPS Telemetry Logs
CREATE TABLE IF NOT EXISTS gps_telemetry_logs (
    id BIGSERIAL PRIMARY KEY,
    convoy_id VARCHAR(36) REFERENCES convoys(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    speed_kmh DOUBLE PRECISION DEFAULT 0.0,
    heading_deg DOUBLE PRECISION DEFAULT 0.0,
    altitude_m DOUBLE PRECISION DEFAULT 0.0,
    temperature_celsius DOUBLE PRECISION,
    recorded_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gps_convoy_time ON gps_telemetry_logs(convoy_id, recorded_at DESC);
