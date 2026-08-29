# 📋 AURA-NER: Master Production & Enhancement Plan (`remaning.md`)

> **Project:** SIH26002 — MDoNER Smart Logistics & Road Hazard Intelligence Platform  
> **Status Tracker:** Use this interactive roadmap to track, execute, and verify each remaining task step-by-step.

---

## 🎯 Execution Roadmap Overview

```
┌────────────────────────────────────────┐
│ Phase 1: Core Demo & Data Persistence  │ ──> GPS Movement, DB Entity Columns, Toast Feedback
└──────────────────┬─────────────────────┘
                   │
┌──────────────────▼─────────────────────┐
│ Phase 2: Production Hardening & Docker │ ──> Multi-Stage Dockerfiles, Global Exception Handling, CORS
└──────────────────┬─────────────────────┘
                   │
┌──────────────────▼─────────────────────┐
│ Phase 3: AI Microservice & Testing     │ ──> FastAPI XGBoost Engine, Unit & Integration Tests
└──────────────────┬─────────────────────┘
                   │
┌──────────────────▼─────────────────────┐
│ Phase 4: Enterprise Scale & Polish     │ ──> Audit Logs, Rate Limiting, SMS/Push, CI/CD Pipeline
└────────────────────────────────────────┘
```

---

## 🚀 Phase 1: High-Impact Demo & Data Persistence (Immediate Priority)

- [x] **Task 1.1: Convoy Origin/Destination Coordinates DB Persistence**
  - **Goal:** Save `origin_lat`, `origin_lng`, `dest_lat`, `dest_lng` into the PostgreSQL `convoys` table so convoy routes survive backend restarts without recalculation.
  - **Files Modified:**
    - `project/src/main/java/com/Project1/project/entity/Convoy.java` (Added coordinate columns & getters/setters)
    - `project/src/main/resources/db/migration/V4__add_convoy_coords.sql` (Flyway migration script created)
    - `project/src/main/java/com/Project1/project/service/ConvoyService.java` (Mapped entity to/from DTO)
  - **Status:** ✅ Complete & Verified (`mvnw compile` BUILD SUCCESS).

---

- [x] **Task 1.2: Real-Time GPS Convoy Movement & Selected Road Highlighting with Live Traffic**
  - **Goal:** Enable live dynamic movement where convoy truck markers visibly advance along their assigned OSRM route on the GIS map, with the **selected road corridor prominently highlighted (glowing 3D border)** and segmented by **real-time traffic flow (🟢 Free Flow, 🟡 Moderate, 🔴 Heavy Hazard)**.
  - **Files Created/Modified:**
    - `project/src/main/java/com/Project1/project/service/ConvoySimulationService.java` (Added scheduled 5s telemetry loop & live vector movement)
    - `project/src/main/java/com/Project1/project/repository/ConvoyRepository.java` (Updated active convoys query)
    - `frontend/src/components/GisMap.jsx` (Added 3D glowing polyline underlay, Google Maps style traffic color segmentation, interactive click-to-focus on truck markers, and floating Active Corridor Navigation HUD)
  - **Status:** ✅ Complete & Verified (`npm run build` SUCCESS).

---

- [x] **Task 1.3: User-Friendly Toast Notifications & Loading States**
  - **Goal:** Replace raw alerts/silent failures with sleek, modern UI toast notifications (e.g. using `lucide-react` + animated toast banner) for:
    - Successful convoy dispatch
    - Duplicate vehicle number validation warning
    - Offline incident queued in IndexedDB
    - Emergency broadcast sent
  - **Files Created/Modified:**
    - `frontend/src/context/ToastContext.jsx` (Created ToastProvider & useToast hook)
    - `frontend/src/App.jsx` (Wrapped with ToastProvider and added WebSocket alert toasts)
    - `frontend/src/components/CreateConvoyModal.jsx` (Added dispatch success and error toasts)
    - `frontend/src/components/ConvoyTracker.jsx` (Added PDF export, trip completion, and cancellation toasts)
    - `frontend/src/components/FieldIncidentModal.jsx` (Added online upload & offline queue toasts)
    - `frontend/src/components/RoutePlanner.jsx` (Added route calculation & option selection toasts)
  - **Status:** ✅ Complete & Verified.

---

## 🛡️ Phase 2: Production Hardening, Security & Infrastructure

- [x] **Task 2.1: Global Backend Error Handling (`@ControllerAdvice`)**
  - **Goal:** Prevent raw database 500 error traces (like duplicate vehicle plate constraint violations) and return structured JSON responses (`409 Conflict`, `400 Bad Request`, `404 Not Found`, `422 Unprocessable Entity`).
  - **Files Created/Modified:**
    - `project/src/main/java/com/Project1/project/exception/GlobalExceptionHandler.java`
    - `project/src/main/java/com/Project1/project/exception/ResourceNotFoundException.java`
    - `project/src/main/java/com/Project1/project/dto/ErrorResponse.java`
  - **Status:** ✅ Complete & Verified (`mvnw compile` BUILD SUCCESS).

---

- [ ] **Task 2.2: Multi-Stage Production Dockerfiles**
  - **Goal:** Build lean, production-ready container images for both Spring Boot backend (Eclipse Temurin JRE 17) and React Vite frontend (Nginx Alpine).
  - **Files to Create:**
    - `project/Dockerfile` (Multi-stage Maven build → JRE 17 runner)
    - `frontend/Dockerfile` (Node.js build → Nginx static server)
    - `frontend/nginx.conf` (SPA routing fallback to `index.html` + API reverse proxy)
  - **Verification:** Run `docker-compose -f docker-compose.prod.yml up --build` and verify the full stack runs seamlessly on port 80.

---

- [ ] **Task 2.3: Security & Secrets Hardening**
  - **Goal:** Remove hardcoded credentials, restrict CORS origins to production domains, and enforce environment-variable-driven secrets.
  - **Files to Modify:**
    - `project/src/main/resources/application.properties`
    - `project/src/main/java/com/Project1/project/security/SecurityConfig.java`
  - **Verification:** App securely boots using `.env` values without exposing default passwords.

---

## 🧠 Phase 3: AI Microservice & Automated Testing

- [x] **Task 3.1: Python FastAPI XGBoost AI Hazard Microservice**
  - **Goal:** Deploy a dedicated Python microservice running the trained XGBoost model for landslide & flood hazard inference, connected to `AiServiceClient.java`.
  - **Files Created/Modified:**
    - `ai-service/app/ml_model.py` (XGBoost ML Pipeline + SHAP explainability decomposition)
    - `ai-service/app/main.py` (FastAPI endpoints `/api/predict-risk`, `/api/predict-risk-batch`, `/api/decay-estimate`, `/health`)
    - `ai-service/test_ai_service.py` (Automated FastAPI validation test suite)
    - `ai-service/Dockerfile` (Production container definition for Python 3.11-slim)
    - `project/src/main/java/com/Project1/project/service/AiServiceClient.java` (Spring Boot WebClient integration)
    - `project/src/main/java/com/Project1/project/service/RoadSegmentService.java` (Scheduled corridor risk re-evaluation)
  - **Status:** ✅ Complete & Verified.

---

- [ ] **Task 3.2: Automated Unit & Integration Test Suite**
  - **Goal:** Implement comprehensive test coverage across core critical services for SIH jury validation.
  - **Files to Create:**
    - `project/src/test/java/com/Project1/project/service/ConvoyServiceTest.java`
    - `project/src/test/java/com/Project1/project/service/RoutingServiceTest.java`
    - `project/src/test/java/com/Project1/project/service/AuthServiceTest.java`
    - `project/src/test/java/com/Project1/project/controller/ConvoyControllerTest.java`
  - **Verification:** Run `.\mvnw.cmd test` and verify 100% tests pass cleanly.

---

## 🏢 Phase 4: Enterprise Scale, Government Compliance & Polish

- [ ] **Task 4.1: Audit Logging for Government Accountability**
  - **Goal:** Automatically record all administrative actions (convoy created, incident verified/rejected, emergency alert broadcast) in an `audit_logs` table.
  - **Files to Create/Modify:**
    - `project/src/main/java/com/Project1/project/entity/AuditLog.java`
    - `project/src/main/java/com/Project1/project/aspect/AuditLogAspect.java` (AOP interceptor)
  - **Verification:** Action history is visible to MDoNER State Command Admins.

---

- [ ] **Task 4.2: Server-Side Pagination & Search Filtering**
  - **Goal:** Support high-throughput fleet operations with server-side `Pageable` queries on fleet tables and incident queues.
  - **Files to Modify:**
    - `project/src/main/java/com/Project1/project/controller/ConvoyController.java`
    - `frontend/src/components/ConvoyTracker.jsx`
  - **Verification:** Smoothly browse through hundreds of convoys with pagination controls.

---

- [ ] **Task 4.3: Real SMS & WhatsApp Gateway Integration**
  - **Goal:** Connect `AlertNotificationService.java` to live Twilio / Gupshup / Fast2SMS API to deliver real emergency SMS to driver phone numbers.
  - **Files to Modify:**
    - `project/src/main/java/com/Project1/project/service/AlertNotificationService.java`
  - **Verification:** Triggering an alert sends an actual test SMS to driver phones within the 50km hazard zone.

---

- [ ] **Task 4.4: CI/CD Automated Deployment Pipeline**
  - **Goal:** Set up GitHub Actions workflow for automated Maven test validation, Docker build, and container registry publishing.
  - **Files to Create:**
    - `.github/workflows/ci-cd.yml`
  - **Verification:** Pushing to `main` triggers automated build, test execution, and container packaging.

---

## 📌 How to Proceed

When you are ready to start solving:
1. Simply tell me: **"Let's start Task 1.1"** (or any specific task number).
2. We will implement, test, and check off each task systematically until AURA-NER is 100% production and competition ready!
