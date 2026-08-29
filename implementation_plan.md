# AURA-NER Feature Audit: PRD vs Actual Codebase

Comprehensive comparison of every requirement from [prd.md](file:///d:/CODES/SPRING%20BOOT/SIHNEW/prd.md) and [features.md](file:///d:/CODES/SPRING%20BOOT/SIHNEW/features.md) against what is actually implemented.

---

## ✅ FULLY IMPLEMENTED (7 Features)

### FR-01: GIS Road & Bridge Accessibility Engine (P0)
| Requirement | Status | Implementation |
|:---|:---|:---|
| Interactive GIS Map with all NER highways | ✅ | [GisMap.jsx](file:///d:/CODES/SPRING%20BOOT/SIHNEW/frontend/src/components/GisMap.jsx) — Leaflet with NH-06, NH-29, NH-10, NW-2 |
| Color-coded status badges (🟢 OPEN, 🟡 CAUTION, 🔴 BLOCKED) | ✅ | Dynamic line colors based on `currentStatus` and `currentRiskScore` |
| Road segments with PostGIS geometries | ✅ | [RoadSegment.java](file:///d:/CODES/SPRING%20BOOT/SIHNEW/project/src/main/java/com/Project1/project/entity/RoadSegment.java) with `LineString` SRID 4326 |
| Street / Satellite / Topo layer switching | ✅ | OSM, Esri Satellite, OpenTopoMap tile layers |

---

### FR-03: Risk-Weighted Dynamic Multi-Modal Routing (P0)
| Requirement | Status | Implementation |
|:---|:---|:---|
| 3 route strategies (Fastest, Resilient, Waterway) | ✅ | [RoutingService.java](file:///d:/CODES/SPRING%20BOOT/SIHNEW/project/src/main/java/com/Project1/project/service/RoutingService.java) — Options A, B, C |
| Road + Rail + River NW-2 multi-modal | ✅ | Lumding-Badarpur Rail + Brahmaputra Waterway options |
| Risk-aware scoring from live weather | ✅ | Uses `nh06Risk` from DB + Weather to adjust delays |
| Frontend route planner UI | ✅ | [RoutePlanner.jsx](file:///d:/CODES/SPRING%20BOOT/SIHNEW/frontend/src/components/RoutePlanner.jsx) |

---

### FR-04: GPS Vehicle & Consignment Tracking (P0)
| Requirement | Status | Implementation |
|:---|:---|:---|
| Live GPS tracking of supply vehicles | ✅ | [ConvoyService.java](file:///d:/CODES/SPRING%20BOOT/SIHNEW/project/src/main/java/com/Project1/project/service/ConvoyService.java) + WebSocket STOMP |
| Commodity types (Medicines, Food, Fuel, Agri) | ✅ | `commodityType` enum in [Convoy.java](file:///d:/CODES/SPRING%20BOOT/SIHNEW/project/src/main/java/com/Project1/project/entity/Convoy.java) |
| Temperature sensor cold-chain monitoring | ✅ | `temperatureCelsius` field tracked and displayed |
| Convoy dispatch from UI | ✅ | [CreateConvoyModal.jsx](file:///d:/CODES/SPRING%20BOOT/SIHNEW/frontend/src/components/CreateConvoyModal.jsx) |
| Real-time map markers for moving trucks | ✅ | Convoy markers in GisMap with live coordinates |
| e-Waybill PDF generation | ✅ | [EwayBillPdfService.java](file:///d:/CODES/SPRING%20BOOT/SIHNEW/project/src/main/java/com/Project1/project/service/EwayBillPdfService.java) + [EwayBillController.java](file:///d:/CODES/SPRING%20BOOT/SIHNEW/project/src/main/java/com/Project1/project/controller/EwayBillController.java) |

---

### FR-06: Field Incident Reporting (P0)
| Requirement | Status | Implementation |
|:---|:---|:---|
| Geo-tagged incident report form | ✅ | [FieldIncidentModal.jsx](file:///d:/CODES/SPRING%20BOOT/SIHNEW/frontend/src/components/FieldIncidentModal.jsx) |
| Auto-detected GPS coordinates | ✅ | Browser Geolocation API in modal |
| Incident types (Landslide, Flood, Bridge, etc.) | ✅ | Dropdown with all categories |
| Severity levels (Minor, Partial, Critical) | ✅ | 3-tier severity |
| 2-Tier Verification (Officials=auto-verified, Citizens=pending queue) | ✅ | [IncidentReportService.java](file:///d:/CODES/SPRING%20BOOT/SIHNEW/project/src/main/java/com/Project1/project/service/IncidentReportService.java) lines 65-66 |
| Verified incidents auto-update road segment status to BLOCKED | ✅ | Lines 89-94 — sets `currentStatus=BLOCKED` + `riskScore=0.95` |
| Batch sync endpoint for offline queued reports | ✅ | `/api/v1/incidents/batch-sync` endpoint |
| Verification queue UI for officers | ✅ | [IncidentVerificationQueue.jsx](file:///d:/CODES/SPRING%20BOOT/SIHNEW/frontend/src/components/IncidentVerificationQueue.jsx) |

---

### FR-07: Central Control Tower Dashboard (P0)
| Requirement | Status | Implementation |
|:---|:---|:---|
| Unified dashboard with stat cards | ✅ | [App.jsx](file:///d:/CODES/SPRING%20BOOT/SIHNEW/frontend/src/App.jsx) — 4 executive stat cards |
| Live convoy count + road status + district connectivity | ✅ | Dynamic cards bound to live state |
| Role-based sidebar navigation | ✅ | Admin/Officer/Transporter/Engineer see different tabs |

---

### NFR: Security — JWT RBAC (P0)
| Requirement | Status | Implementation |
|:---|:---|:---|
| JWT authentication | ✅ | [JwtUtils.java](file:///d:/CODES/SPRING%20BOOT/SIHNEW/project/src/main/java/com/Project1/project/security/JwtUtils.java) HMAC-SHA256 |
| Spring Security filter chain | ✅ | [SecurityConfig.java](file:///d:/CODES/SPRING%20BOOT/SIHNEW/project/src/main/java/com/Project1/project/security/SecurityConfig.java) |
| Role-based access control (4 roles) | ✅ | ADMIN, DISASTER_OFFICER, TRANSPORTER, FIELD_ENGINEER |
| Departmental secret codes for privileged registration | ✅ | [AuthService.java](file:///d:/CODES/SPRING%20BOOT/SIHNEW/project/src/main/java/com/Project1/project/service/AuthService.java) + [LoginModal.jsx](file:///d:/CODES/SPRING%20BOOT/SIHNEW/frontend/src/components/LoginModal.jsx) |

---

### FR-02: Predictive Disruption Engine (P0)  — Partial
| Requirement | Status | Implementation |
|:---|:---|:---|
| Live weather assimilation (Open-Meteo API) | ✅ | [WeatherIntegrationService.java](file:///d:/CODES/SPRING%20BOOT/SIHNEW/project/src/main/java/com/Project1/project/service/WeatherIntegrationService.java) — real precipitation, soil moisture, temperature |
| Periodic risk recalculation every 5 min | ✅ | `@Scheduled(fixedRate=300000)` in [RoadSegmentService.java](file:///d:/CODES/SPRING%20BOOT/SIHNEW/project/src/main/java/com/Project1/project/service/RoadSegmentService.java) |
| AI/ML inference via Python microservice | ⚠️ Partial | [AiServiceClient.java](file:///d:/CODES/SPRING%20BOOT/SIHNEW/project/src/main/java/com/Project1/project/service/AiServiceClient.java) calls `http://localhost:8000` but **Python AI service not included in repo** |

---

## ❌ NOT IMPLEMENTED (8 Features)

### FR-05: Automated Multi-Channel Alerting (P0) — ❌ MISSING
| Requirement | Status | What's Missing |
|:---|:---|:---|
| SMS alerts (Fast2SMS / Twilio) | ❌ | No SMS gateway service class |
| WhatsApp Business Bot alerts | ❌ | No WhatsApp API integration |
| Geo-targeted broadcasts (50km radius) | ❌ | No spatial proximity push logic |
| Push notifications | ⚠️ Partial | Only in-app WebSocket alerts via STOMP (no native push) |

> [!WARNING]
> This is a **P0 (Must Have)** requirement. WebSocket provides in-app alerts, but the PRD explicitly requires SMS + WhatsApp for drivers in remote hills with basic phones.

---

### FR-08: Farmer Load Pooling & Marketplace (P1) — ❌ MISSING
| Requirement | Status | What's Missing |
|:---|:---|:---|
| Freight consolidation algorithm | ❌ | No pooling service or entity |
| Farmer produce batch registration | ❌ | No farmer-facing UI or API |
| Shared cold-chain truck allocation | ❌ | No matching algorithm |
| Vernacular mobile-first farmer UI | ❌ | No farmer persona view |

---

### FR-09: Explainable AI (XAI) Inspector (P1) — ⚠️ PARTIAL
| Requirement | Status | What's Missing |
|:---|:---|:---|
| XAI text justification in route cards | ✅ | `xaiDecision` field in RoutingService |
| SHAP values & waterfall charts | ❌ | No visual SHAP breakdown or chart component |
| Mathematical weight breakdown | ❌ | Only text explanation, no numeric factor visualization |

---

### FR-10: Multilingual & Low-Bandwidth UI (P1) — ⚠️ PARTIAL
| Requirement | Status | What's Missing |
|:---|:---|:---|
| Language selector (EN/HI/AS/BN) | ✅ | Dropdown in header of App.jsx |
| Actual translated strings/i18n system | ❌ | Selector exists but **no translation files or i18n library** — all text remains English-only |
| Voice-assisted navigation | ❌ | Not implemented |
| Bodo language support | ❌ | Not in selector |

---

### Feature 8: Offline-First PWA & IndexedDB Sync — ❌ MISSING
| Requirement | Status | What's Missing |
|:---|:---|:---|
| Service Worker registration | ❌ | No `sw.js` or `vite-plugin-pwa` |
| PWA manifest.json | ❌ | No web app manifest |
| IndexedDB offline incident caching | ❌ | No IndexedDB usage in frontend |
| Auto-sync when network returns | ❌ | Backend has `/batch-sync` endpoint but **no frontend offline queue** |

> [!WARNING]
> This is critical for NER field workers in zero-connectivity zones. The batch-sync API exists but the client-side offline engine does not.

---

### Feature 4: Geo-Fencing & Deviation Alerts — ❌ MISSING
| Requirement | Status | What's Missing |
|:---|:---|:---|
| Route adherence monitoring | ❌ | No geo-fence polygon comparison |
| Deviation alert trigger | ❌ | No spatial deviation detection |
| Hazard zone halt detection | ❌ | No stopped-in-danger-zone logic |

---

### Feature 7: District Connectivity Heatmap — ❌ MISSING
| Requirement | Status | What's Missing |
|:---|:---|:---|
| District-wise connectivity index heatmap | ❌ | `criticality_score` exists in DB but no heatmap visualization |
| Supply bottleneck analytics | ❌ | No shortage prediction dashboard |
| Emergency Green Corridors (1-click) | ❌ | No priority lane generator |
| Executive PDF Situation Report (SitRep) | ❌ | Only e-Waybill PDF exists, no SitRep generator |

---

### Differentiator: Perishable Freshness Decay Monitor — ⚠️ PARTIAL
| Requirement | Status | What's Missing |
|:---|:---|:---|
| `freshnessDecayIndex` field in convoy entity | ✅ | Field exists in DB & DTO |
| Time-Temperature Index (TTI) algorithm | ❌ | No actual decay calculation logic — field is static |
| Visual shelf-life remaining indicator | ❌ | Not shown in convoy tracker UI |

---

## Summary Scorecard

| Priority | Total | ✅ Done | ⚠️ Partial | ❌ Missing |
|:---|:---|:---|:---|:---|
| **P0 (Must Have)** | 7 | 5 | 1 | 1 |
| **P1 (High)** | 3 | 0 | 2 | 1 |
| **Differentiators** | 4 | 1 | 1 | 2 |
| **NFR** | 4 | 2 | 1 | 1 |
| **TOTAL** | **18** | **8** | **5** | **5** |

---

## Recommended Priority Order for Missing Features

1. 🔴 **FR-05: SMS + WhatsApp Alerts** (P0 — required for remote hill drivers)
2. 🔴 **Offline PWA + IndexedDB** (P0-equivalent — critical for field workers with no network)
3. 🟡 **District Connectivity Heatmap + SitRep PDF** (P0 — FR-07 partial gap)
4. 🟡 **XAI Visual Charts (SHAP waterfall)** (P1)
5. 🟡 **Multilingual i18n** (P1 — selector exists, need translation files)
6. 🟠 **Geo-Fencing & Route Deviation** (Feature 4)
7. 🟠 **Perishable TTI Decay Algorithm** (Differentiator)
8. 🔵 **Farmer Load Pooling Marketplace** (P1 — separate module)
