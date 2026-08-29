-- ====================================================================
-- Seed 1: Standard Base Administrators & System Roles (BCrypt hashed for 'password123')
-- ====================================================================
INSERT INTO users (id, username, password_hash, full_name, email, phone, role, state, district)
VALUES
('u-admin-1', 'admin', '$2a$10$wN31rG6uO0lHq4r2KkHweu3d2Jv8EaFfI7q2W0O1uXy4vN1O3zLmy', 'MDoNER State Admin', 'admin@mdoner.gov.in', '+919876543210', 'ROLE_ADMIN', 'Assam', 'Kamrup Metropolitan'),
('u-officer-1', 'disaster_nodal', '$2a$10$wN31rG6uO0lHq4r2KkHweu3d2Jv8EaFfI7q2W0O1uXy4vN1O3zLmy', 'SDMA Nodal Officer Meghalaya', 'nodal@meghalaya.gov.in', '+919876543211', 'ROLE_DISASTER_OFFICER', 'Meghalaya', 'East Khasi Hills'),
('u-transporter-1', 'driver_ramesh', '$2a$10$wN31rG6uO0lHq4r2KkHweu3d2Jv8EaFfI7q2W0O1uXy4vN1O3zLmy', 'Ramesh Sharma (Fleet Lead)', 'ramesh@nertrans.com', '+919876543212', 'ROLE_TRANSPORTER', 'Assam', 'Cachar'),
('u-field-1', 'pwd_inspector', '$2a$10$wN31rG6uO0lHq4r2KkHweu3d2Jv8EaFfI7q2W0O1uXy4vN1O3zLmy', 'Inspector Tashi Dorjee', 'tashi@pwd.gov.in', '+919876543213', 'ROLE_FIELD_ENGINEER', 'Sikkim', 'East Sikkim')
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- Seed 2: NER Key Districts & Headquarters Coordinates (GIS Topology Master Data)
-- ====================================================================
INSERT INTO districts (id, name, state, hq_latitude, hq_longitude, connectivity_status, criticality_score)
VALUES
('dist-guwahati', 'Kamrup Metropolitan (Guwahati)', 'Assam', 26.1445, 91.7362, 'NORMAL', 0.05),
('dist-shillong', 'East Khasi Hills (Shillong)', 'Meghalaya', 25.5788, 91.8933, 'NORMAL', 0.15),
('dist-jowai', 'West Jaintia Hills (Jowai)', 'Meghalaya', 25.4526, 92.2037, 'RESTRICTED', 0.65),
('dist-silchar', 'Cachar (Silchar)', 'Assam', 24.8333, 92.7789, 'NORMAL', 0.20),
('dist-dimapur', 'Dimapur', 'Nagaland', 25.9068, 93.7271, 'NORMAL', 0.10),
('dist-kohima', 'Kohima', 'Nagaland', 25.6751, 94.1086, 'RESTRICTED', 0.55),
('dist-imphal', 'Imphal West', 'Manipur', 24.8170, 93.9368, 'NORMAL', 0.25),
('dist-agartala', 'West Tripura (Agartala)', 'Tripura', 23.8315, 91.2868, 'NORMAL', 0.10),
('dist-gangtok', 'East Sikkim (Gangtok)', 'Sikkim', 27.3389, 88.6065, 'RESTRICTED', 0.60),
('dist-itangar', 'Papum Pare (Itanagar)', 'Arunachal Pradesh', 27.0844, 93.6053, 'NORMAL', 0.30)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- Seed 3: Highway Road Segments (LineStrings in SRID 4326 - Base Physical GIS Graph)
-- ====================================================================
INSERT INTO road_segments (id, highway_code, segment_name, start_hub, end_hub, segment_geom, length_km, elevation_avg_m, slope_angle_deg, historical_landslide_count, bridge_count, current_status, current_risk_score, disruption_reason)
VALUES
-- NH-06: Guwahati to Shillong
('seg-nh06-1', 'NH-06', 'Guwahati to Nongpoh', 'Guwahati', 'Nongpoh', ST_GeomFromText('LINESTRING(91.7362 26.1445, 91.8785 25.9012)', 4326), 48.5, 450.0, 12.0, 2, 3, 'OPEN', 0.15, 'Clear road conditions'),
-- NH-06: Nongpoh to Shillong
('seg-nh06-2', 'NH-06', 'Nongpoh to Shillong', 'Nongpoh', 'Shillong', ST_GeomFromText('LINESTRING(91.8785 25.9012, 91.8933 25.5788)', 4326), 51.0, 1490.0, 22.0, 4, 2, 'OPEN', 0.25, 'Moderate fog observed'),
-- NH-06: Shillong to Jowai (High Landslide Prone)
('seg-nh06-3', 'NH-06', 'Shillong to Jowai', 'Shillong', 'Jowai', ST_GeomFromText('LINESTRING(91.8933 25.5788, 92.2037 25.4526)', 4326), 64.0, 1380.0, 28.5, 9, 4, 'CAUTION', 0.72, 'Heavy monsoon rainfall and saturated slope'),
-- NH-06: Jowai to Silchar
('seg-nh06-4', 'NH-06', 'Jowai to Silchar', 'Jowai', 'Silchar', ST_GeomFromText('LINESTRING(92.2037 25.4526, 92.7789 24.8333)', 4326), 135.0, 620.0, 18.0, 6, 8, 'OPEN', 0.35, 'Normal flow with light showers'),

-- NH-29: Dabaka to Dimapur
('seg-nh29-1', 'NH-29', 'Dabaka to Dimapur', 'Dabaka', 'Dimapur', ST_GeomFromText('LINESTRING(92.8667 25.8833, 93.7271 25.9068)', 4326), 92.0, 260.0, 8.0, 1, 5, 'OPEN', 0.10, 'Clear traffic'),
-- NH-29: Dimapur to Kohima (Critical Hill Section)
('seg-nh29-2', 'NH-29', 'Dimapur to Kohima', 'Dimapur', 'Kohima', ST_GeomFromText('LINESTRING(93.7271 25.9068, 94.1086 25.6751)', 4326), 74.0, 1440.0, 26.0, 11, 3, 'CAUTION', 0.68, 'Slight rockfall near Phesama'),

-- NH-10: Siliguri to Gangtok (Teesta Valley Corridor)
('seg-nh10-1', 'NH-10', 'Siliguri to Rangpo', 'Siliguri', 'Rangpo', ST_GeomFromText('LINESTRING(88.4312 26.7271, 88.5283 27.1764)', 4326), 75.0, 320.0, 24.0, 8, 6, 'CAUTION', 0.58, 'Teesta river water level high'),
('seg-nh10-2', 'NH-10', 'Rangpo to Gangtok', 'Rangpo', 'Gangtok', ST_GeomFromText('LINESTRING(88.5283 27.1764, 88.6065 27.3389)', 4326), 39.0, 1650.0, 25.0, 5, 2, 'OPEN', 0.30, 'Normal movement'),

-- Brahmaputra National Waterway-2 (River Barge Route)
('seg-nw2-1', 'NW-2', 'Pandu Port (Guwahati) to Dhubri River Port', 'Pandu Port', 'Dhubri Port', ST_GeomFromText('LINESTRING(91.6883 26.1782, 89.9744 26.0205)', 4326), 260.0, 45.0, 0.0, 0, 0, 'OPEN', 0.05, 'Waterway clear and navigable for cargo barges')
ON CONFLICT (id) DO NOTHING;
