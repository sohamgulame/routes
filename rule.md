# Engineering Standards & Agent Rules (Rule.md)

## Project Title: AURA-NER (SIH26002)
**AI-Based Smart Logistics and Accessibility Intelligence Platform for North Eastern Region**

---

## 1. Core Architectural Rules

1. **Decoupled 3-Tier Rule:**
   * **Spring Boot (Java 21)** is the single source of truth for business logic, persistence (PostgreSQL/PostGIS), authentication (Spring Security), and WebSocket client push.
   * **FastAPI (Python 3.11)** is strictly an AI/ML inference microservice. It must NOT connect directly to the primary database; all data is passed via JSON payloads from Spring Boot.
   * **Frontend (React 18 + Vite SPA)** communicates only with the Spring Boot API Gateway.

2. **Spatial Data Integrity (PostGIS):**
   * All coordinates must follow the **WGS 84 (SRID 4326)** standard: `(longitude, latitude)` in GeoJSON and Point geometries.
   * Never store GPS coordinates as raw unindexed strings; use `org.locationtech.jts.geom.Point` and `LineString` in JPA entities with spatial indices.

3. **Offline-First Rule for Field Modules:**
   * Any data submitted from field/driver screens must succeed even if `navigator.onLine == false`.
   * Cache unsynced records in IndexedDB and queue a background sync request.

---

## 2. Backend & Spring Boot Coding Standards

1. **DTO Pattern Mandatory:**
   * Never expose database JPA entities directly in `@RestController` response entities. Always convert to/from strongly typed DTOs (Data Transfer Objects) using record classes or MapStruct/Lombok.
2. **Asynchronous & Non-Blocking Streams:**
   * External weather API calls (Open-Meteo) and AI microservice requests must use non-blocking `WebClient` or Java 21 Virtual Threads (`Executors.newVirtualThreadPerTaskExecutor()`).
3. **Structured Error Handling:**
   * All API errors must return a standardized JSON structure with HTTP status codes:
     ```json
     {
       "timestamp": "2026-08-27T19:50:00Z",
       "status": 404,
       "error": "RESOURCE_NOT_FOUND",
       "message": "Road segment NH-06-KM120 not found.",
       "path": "/api/v1/routes/evaluate"
     }
     ```
4. **Clean Code & Layering:**
   * Controller $\rightarrow$ Service Interface $\rightarrow$ Service Implementation $\rightarrow$ Repository Layer. Maintain 100% separation of concerns.

---

## 3. Frontend & UI/UX Standards

1. **Rich Aesthetics & WOW Factor (Critical SIH Rule):**
   * Modern dark/light glassmorphic UI using Tailwind CSS, high-contrast status colors (Emerald Green, Amber, Coral Red, Indigo).
   * Do **NOT** use browser alert popups or raw unstyled tables. Use curated components with smooth micro-animations.
2. **No Raw JSON in UI:**
   * Every metric, risk probability, and SHAP value must be presented as a visual badge, radar chart, gauge, or human-readable explanation card.
3. **Map Performance:**
   * Vector tile rendering (Mapbox GL or Leaflet canvas rendering) to ensure smooth 60fps panning over complex North-Eastern mountainous road geometry.

---

## 4. AI & Python Microservice Rules

1. **Low Latency Constraint:**
   * Any inference request (`/api/predict-risk`) must return within $< 50\text{ ms}$ for single segments and $< 300\text{ ms}$ for batch route graphs.
2. **Explainability Mandatory:**
   * Never return a bare prediction probability without accompanying SHAP feature importance scores and a human-readable reason string.
3. **Defensive Fallback:**
   * If live weather API fails or times out, the service must gracefully fallback to historical baseline seasonal averages without throwing a 500 error.

---

## 5. Git & Collaboration Rules

* Keep commit messages conventional: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `perf:`.
* Maintain Docker Compose compatibility: All services must spin up with a single `docker-compose up --build` command.
