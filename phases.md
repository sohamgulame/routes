# Detailed Micro-Phases & Development Roadmap (Phases.md)

## Project Title: AURA-NER (SIH26002)
**AI-Enabled Smart Logistics and Accessibility Intelligence Platform for North Eastern Region**

---

## Roadmap Architecture: 12 Granular Execution Phases

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   PHASE 0    │──►│   PHASE 1    │──►│   PHASE 2    │──►│   PHASE 3    │
│  Scaffolding │   │  PostGIS DB  │   │  AI Engine   │   │  Spring Core │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
       │                                                        │
       ▼                                                        ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   PHASE 4    │──►│   PHASE 5    │──►│   PHASE 6    │──►│   PHASE 7    │
│  Route Engine│   │  WebSockets  │   │ Incident PWA │   │  Frontend UI │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
       │                                                        │
       ▼                                                        ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   PHASE 8    │──►│   PHASE 9    │──►│   PHASE 10   │──►│   PHASE 11/12│
│  GIS Control │   │ XAI Planner  │   │ Multilingual │   │  Demo Polish │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
```

---

## Phase 0: Workspace & Multi-Service Repository Scaffolding
* **Objective:** Establish the modular monorepo structure, environment variables, and Docker container orchestration.
* **Tasks:**
  * **0.1 Directory Layout:** Create `project/` (Spring Boot), `ai-service/` (FastAPI), `frontend/` (React + Vite), `docker/`, and `data/seeds/`.
  * **0.2 Docker Compose Configuration:** Define services in `docker-compose.yml`:
    * `postgres-postgis` (PostgreSQL 16 with PostGIS on port `5432`).
    * `redis-cache` (Redis 7 Alpine on port `6379`).
    * `minio-storage` (MinIO Object Storage on ports `9000` / `9001`).
  * **0.3 Environment Configuration:** Setup `.env.example` with database credentials, JWT secrets, and Open-Meteo API URLs.
* **Checkpoint / Deliverable:** `docker-compose up` runs PostgreSQL (with PostGIS), Redis, and MinIO with all health checks passing.

---

## Phase 1: Database Initialization & PostGIS Spatial Ingestion
* **Objective:** Build the spatial relational database schema and seed real North-Eastern road geometries, districts, and river ports.
* **Tasks:**
  * **1.1 Flyway Database Migrations:** Create `V1__init_schema.sql` defining `districts`, `road_segments`, `incident_reports`, `convoys`, `consignments`, and `gps_telemetry_logs`.
  * **1.2 District GeoJSON Ingestion:** Seed boundaries for all 8 NER states (Assam, Meghalaya, Arunachal Pradesh, Nagaland, Manipur, Mizoram, Tripura, Sikkim) with initial connectivity indices.
  * **1.3 Highway Network Seeding:** Seed segmented geometries (`LineString`) for key highways:
    * **NH-06:** Guwahati $\to$ Shillong $\to$ Jowai $\to$ Silchar.
    * **NH-27:** Guwahati $\to$ Bongaigaon $\to$ Siliguri.
    * **NH-29:** Dabaka $\to$ Dimapur $\to$ Kohima.
    * **NH-10:** Siliguri $\to$ Gangtok.
    * **NW-2 Waterway Nodes:** Pandu Port, Dhubri Port, Silghat Port, Neamati Port.
  * **1.4 Spatial Indices & Validation:** Add PostGIS spatial GIST indices (`CREATE INDEX idx_road_geom ON road_segments USING GIST(segment_geom);`) and verify with sample ST_Distance and ST_Intersects queries.
* **Checkpoint / Deliverable:** Database queries return valid GeoJSON for highway corridors across NER.

---

## Phase 2: AI Microservice - Hazard Prediction & Explainability Engine
* **Objective:** Develop the standalone Python FastAPI service for landslide/flood risk prediction and SHAP explainability.
* **Tasks:**
  * **2.1 Environment Setup:** Setup Python 3.11 with `fastapi`, `uvicorn`, `xgboost`, `shap`, `pandas`, `scikit-learn`, `requests`.
  * **2.2 Dataset Generation & Training:** Build a training pipeline combining historical rainfall, slope angle, elevation, and soil saturation; train an `XGBClassifier` with ROC-AUC $> 0.88$.
  * **2.3 SHAP Explainability Module:** Implement `shap.TreeExplainer` to extract top 3 risk factors per road segment.
  * **2.4 Weather API Integration:** Create async weather fetcher using Open-Meteo API for real-time and 48-hour rainfall forecasts.
  * **2.5 Perishable Decay Model:** Implement Arrhenius shelf-life decay formula estimating perishable produce loss over time and ambient temperature.
  * **2.6 FastAPI Endpoints:**
    * `POST /api/predict-risk` (Single / Batch segment risk scoring).
    * `POST /api/explain-decision` (Returns SHAP feature weights & human-readable summary).
    * `POST /api/decay-estimate` (Returns estimated shelf-life hours remaining).
* **Checkpoint / Deliverable:** Swagger docs live at `http://localhost:8000/docs`; endpoints return valid risk scores and SHAP explanations in $< 50\text{ ms}$.

---

## Phase 3: Spring Boot Core - Security, Domain Entities & CRUD Services
* **Objective:** Implement core domain models, role-based security, and business services in Spring Boot.
* **Tasks:**
  * **3.1 Hibernate Spatial Entities:** Create JPA entities (`District`, `RoadSegment`, `Convoy`, `Consignment`, `IncidentReport`) mapped to PostGIS geometries.
  * **3.2 Security & Authentication:** Implement Spring Security 6 with JWT token generation and 4 roles:
    * `ROLE_ADMIN` (Central MDoNER / SDMA).
    * `ROLE_DISASTER_OFFICER` (District Disaster Authority).
    * `ROLE_TRANSPORTER` (Fleet Owner / Driver).
    * `ROLE_FIELD_ENGINEER` (PWD / Police / Field Inspector).
  * **3.3 DTO & Validation Layer:** Create immutable record DTOs with `@Valid` annotations for all payloads.
  * **3.4 AI Microservice Client:** Implement non-blocking `WebClient` service calling FastAPI endpoints with fallback error resilience.
* **Checkpoint / Deliverable:** Secured CRUD REST APIs for convoys and road segments verified with automated tests.

---

## Phase 4: Spring Boot Core - Risk-Weighted Routing & Multi-Modal Engine
* **Objective:** Implement dynamic, risk-aware routing in Java using real-time hazard edge weights.
* **Tasks:**
  * **4.1 Graph Construction:** Build in-memory road network graph representing NER highway intersections and waterway ports.
  * **4.2 Risk-Weighted Pathfinding Algorithm:** Implement custom A* / Dijkstra algorithm where edge weight $W_e$ dynamically incorporates distance, AI failure probability, slope, and weather penalty.
  * **4.3 Multi-Modal Route Generator:**
    * Generates 3 parallel options: **Fastest Route**, **Risk-Resilient Highway Bypass**, and **Multi-Modal Waterway (NW-2 River Barge + Road)**.
  * **4.4 Dynamic Delay Estimator:** Calculate accurate transit times and stoppage delays based on gradient, truck tonnage, and weather severity.
* **Checkpoint / Deliverable:** `POST /api/v1/routes/calculate` returns 3 multi-modal route options with turn-by-turn steps, risk ratings, and delay estimates.

---

## Phase 5: Real-Time Telemetry & WebSocket Push Engine
* **Objective:** Stream real-time vehicle GPS positions and broadcast instant hazard alerts to connected clients.
* **Tasks:**
  * **5.1 WebSocket STOMP Broker:** Configure Spring WebSocket with SockJS and STOMP message endpoints (`/ws-telemetry`).
  * **5.2 GPS Ingestion & Redis Caching:** Create `POST /api/v1/telemetry/ping` to cache the latest coordinates in Redis and log history to PostgreSQL.
  * **5.3 Automated Telemetry Simulator:** Create a Java/Python background simulator streaming live coordinates along active NER routes to test the system.
  * **5.4 Geo-Fencing & Stoppage Detector:** Trigger automated warning when a vehicle stops for $> 30\text{ mins}$ in a high-risk zone or deviates from the assigned corridor.
* **Checkpoint / Deliverable:** Real-time coordinates stream smoothly over `/topic/convoys/live` with $< 100\text{ ms}$ latency.

---

## Phase 6: Crowdsourced Field Incident Reporting & PWA Offline Sync
* **Objective:** Enable field officials to upload geo-tagged incident reports with offline synchronization.
* **Tasks:**
  * **6.1 Incident Upload Service:** Multi-part file upload saving photos to MinIO and geo-metadata to PostgreSQL.
  * **6.2 Incident Verification Lifecycle:** Implement state machine: `PENDING` $\to$ `VERIFIED` $\to$ `RESOLVED`. Verified reports instantly update the affected road segment status to `BLOCKED`.
  * **6.3 Batch Sync API:** Create `POST /api/v1/incidents/batch-sync` accepting an array of offline-created reports from field PWAs.
  * **6.4 Dynamic Network Recalculation:** Trigger routing graph edge invalidation whenever a road is marked `BLOCKED`.
* **Checkpoint / Deliverable:** Submitting a verified landslide report immediately blocks the road on the map and triggers route recalculation.

---

## Phase 7: Frontend - Design System & Master Layout
* **Objective:** Build a premium, high-impact glassmorphic user interface using React + Vite.
* **Tasks:**
  * **7.1 React + Vite Setup:** Configure React 18 with Vite, React Router 6, Tailwind CSS, Lucide-React icons, and custom glassmorphism components.
  * **7.2 Glassmorphic Theme:** Implement sleek dark/light theme tailored for disaster control rooms (Navy/Slate palette with Emerald, Amber, and Crimson status indicators).
  * **7.3 Global State & API Clients:** Setup Zustand store for session/map state and Axios / TanStack Query for backend REST calls.
  * **7.4 WebSocket STOMP Client:** Integrate `@stomp/stompjs` and `sockjs-client` for real-time live map updates.
* **Checkpoint / Deliverable:** Clean, responsive master dashboard layout with role-based navigation sidebar.

---

## Phase 8: Frontend - GIS Logistics Control Tower & Interactive Maps
* **Objective:** Create the main 2D/3D visual map of the North Eastern Region.
* **Tasks:**
  * **8.1 Mapbox GL / Leaflet Core:** Render interactive map focused on the 8 NER states with custom topography styling.
  * **8.2 Highway Status Overlay:** Render color-coded highway lines (Green = Open, Yellow = Caution, Red = Blocked).
  * **8.3 Moving Fleet Layer:** Render animated vehicle markers carrying essential commodities (medicines, fuel, food) with popup status cards.
  * **8.4 3D Terrain & Elevation Cross-Section:** Display synchronized elevation profile showing slope grade and hazard zones along the route.
  * **8.5 District Connectivity Heatmap:** Display state-wide district cards showing connectivity percentages.
* **Checkpoint / Deliverable:** Fully interactive GIS control room map running at smooth 60fps.

---

## Phase 9: Frontend - Route Planner & Explainable AI (XAI) Dashboard
* **Objective:** Build the route recommendation and transparency UI.
* **Tasks:**
  * **9.1 Origin-Destination Form:** Auto-completing search for NER cities, towns, and border checkposts.
  * **9.2 Multi-Modal Route Comparison Cards:** Display side-by-side cards for Fastest, Resilient, and Waterway routes with ETA, cost, and risk score.
  * **9.3 XAI Decision Inspector Widget:**
    * Horizontal SHAP waterfall bar chart displaying feature contributions.
    * Plain-English natural language justification card explaining why a bypass was chosen.
  * **9.4 Perishable Shelf-Life Gauge:** Visual gauge indicating remaining crop freshness and temperature telemetry.
* **Checkpoint / Deliverable:** Selecting origin/destination renders 3 distinct routes with interactive XAI explanation panels.

---

## Phase 10: Frontend - Field Reporting PWA (Offline-First) & Multilingual Support
* **Objective:** Build the field reporting mobile screen with offline queuing and language localization.
* **Tasks:**
  * **10.1 PWA Service Worker & IndexedDB:** Implement offline asset caching and an IndexedDB queue for unsynced incident reports.
  * **10.2 Geo-Tagged Camera Form:** Mobile-friendly form capturing camera photo, auto-filling GPS coordinates, and selecting hazard category.
  * **10.3 Background Sync Status Indicator:** Visual connectivity badge ("Online - Synced" vs "Offline - 2 Reports Queued") that automatically uploads when internet returns.
  * **10.4 Multilingual Support (i18n):** Language toggle for **English, Hindi, Assamese (অসমীয়া), Bengali (বাংলা), and Bodo**.
* **Checkpoint / Deliverable:** Disconnecting Wi-Fi, filing an incident, and reconnecting demonstrates flawless automatic background sync.

---

## Phase 11: Value-Added Modules & Official Document Generation
* **Objective:** Implement regional value-add features that boost hackathon scoring.
* **Tasks:**
  * **11.1 Farmer Load Pooling Marketplace:** UI for rural farmers to submit small batches (e.g., 100 kg ginger) and view shared pickup truck consolidation.
  * **11.2 Digital e-Waybill PDF Generator:** OpenPDF backend integration generating formatted, QR-coded government transit manifests with 1-click download.
  * **11.3 Multi-Channel Alert Simulation:** Notification panel showing simulated SMS and WhatsApp alerts dispatched to drivers.
* **Checkpoint / Deliverable:** 1-click download of official e-Waybill PDF and functional load pooling calculator.

---

## Phase 12: Live Hackathon "Disruption Controller" & Pitch Polish
* **Objective:** Build the live demo injection widget and rehearse the winning pitch flow.
* **Tasks:**
  * **12.1 "Disruption Simulation Controller" Widget:** Floating admin panel with 1-click buttons:
    * 🌧️ *"Trigger 160mm Cloudburst on NH-06 near Jowai"*.
    * 🏔️ *"Simulate Landslide Blockage on NH-29 Kohima"*.
    * 🌊 *"Trigger Brahmaputra River Surge at Pandu Port"*.
  * **12.2 Instant Visual Cascade:** Ensure clicking a simulation button immediately turns the road Red, fires a WebSocket alert, pops up an SMS notification, and reroutes moving trucks in real-time.
  * **12.3 Performance & Error Hardening:** Ensure zero console errors, smooth mobile responsiveness, and $< 200\text{ ms}$ API response times.
  * **12.4 Demo Script & Rehearsal:** Finalize the 3-minute jury presentation script and backup offline video recording.
* **Checkpoint / Deliverable:** Flawless live hackathon demonstration capable of captivating MDoNER evaluators.
