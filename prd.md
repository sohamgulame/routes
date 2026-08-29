# Product Requirements Document (PRD)

## Project Title
**AURA-NER: AI-Enabled Unified Routing & Accessibility Intelligence Platform for North Eastern Region**

**Problem Statement ID:** SIH26002  
**Target Ministry:** Ministry of Development of North Eastern Region (MDoNER) / State Disaster Management Authorities (SDMAs)  
**Target Category:** Software (Smart Automation & Logistics)

---

## 1. Executive Summary & Problem Overview
The North Eastern Region (NER) of India—comprising 8 states (Assam, Arunachal Pradesh, Meghalaya, Manipur, Mizoram, Nagaland, Tripura, and Sikkim)—faces severe geographical and infrastructural logistics bottlenecks:
* **Choke Points & Hilly Terrain:** Reliance on narrow corridors (Siliguri Corridor / NH networks) with steep gradients, fragile soil strata, and chronic washouts.
* **Monsoon Disruptions:** Landslides, flash floods, and heavy cloudbursts cause prolonged road and bridge blockages, severing lifeline deliveries of medicines, food grains, fuel, and construction materials.
* **Supply Chain Spoilage:** High wastage (>35%) of regional high-value organic produce (Lakadong turmeric, organic ginger, pineapples, tea) due to untracked delays.
* **Absence of Unified Intelligence:** Fragmented district updates, no predictive rerouting, and lack of offline-capable field incident reporting tools.

**AURA-NER** is an AI-powered, GIS-integrated enterprise logistics and accessibility intelligence platform designed to provide real-time route monitoring, predictive disruption forecasting, risk-weighted dynamic multi-modal rerouting, GPS-enabled consignment tracking, crowdsourced geo-tagged incident reporting with offline sync, and centralized crisis decision dashboards.

---

## 2. Goals and Success Metrics

### 2.1 Primary Business & Operational Goals
1. **Zero Supply Choke Stoppages:** Reduce unexpected transit disruptions of essential supplies by providing predictive warnings 12–48 hours in advance.
2. **Dynamic Multi-Modal Rerouting:** Automatically calculate alternate road/rail/waterway (Brahmaputra NW-2) bypass routes when primary highways face blockages.
3. **Rapid Incident Verification:** Enable district field officials, PWD engineers, and drivers to log geotagged road damage with offline caching and instant verification.
4. **Last-Mile Perishable Protection:** Minimize perishable cargo loss through temperature and delay tracking linked with shelf-life decay predictions.

### 2.2 Key Performance Indicators (KPIs)
* **ETA Accuracy:** $\ge 90\%$ accuracy in estimated travel times under disrupted conditions.
* **Disruption Early Warning Precision:** $\ge 85\%$ True Positive rate for landslide/flood road segment hazard prediction.
* **Offline Synchronization Latency:** $< 5\text{ seconds}$ automatic sync once low-bandwidth cellular/Wi-Fi connection is restored.
* **Query Latency for GIS Spatial Layers:** $< 200\text{ ms}$ response time on PostGIS queries for district-wide route graphs.

---

## 3. Target User Personas & Core Journeys

### Persona 1: State/District Logistics & Disaster Nodal Officer (MDoNER / SDMA / PWD)
* **Goal:** Monitor regional connectivity, identify cut-off districts, track movement of medical and food convoys, and plan emergency relief corridors.
* **Key Journey:** Logs into Central Control Tower $\rightarrow$ views district status heatmaps $\rightarrow$ receives automated red alert for NH-6 landslide $\rightarrow$ approves proposed multi-modal bypass route $\rightarrow$ broadcasts emergency route notification to all transporters.

### Persona 2: Fleet Operator & Commercial Transporter
* **Goal:** Deliver critical goods, minimize vehicle turnaround time, avoid stranded convoys in landslide zones, and maintain compliance with digital e-Waybills.
* **Key Journey:** Views assigned convoy dispatch $\rightarrow$ receives live in-cab risk-aware GPS navigation with voice warnings $\rightarrow$ automatic re-route popup when rainfall crosses safety threshold.

### Persona 3: Ground Field Official / PWD Engineer / Police Officer
* **Goal:** Report broken bridges, road blockages, mudslides, or high-water levels from remote zones with zero/poor internet.
* **Key Journey:** Opens mobile app offline $\rightarrow$ snaps geo-tagged photo with auto-detected GPS coordinates $\rightarrow$ selects hazard type and road clearance status $\rightarrow$ saves locally $\rightarrow$ app auto-syncs when cell signal returns.

### Persona 4: Smallholder Farmer / Micro-Merchant / SHG Producer
* **Goal:** Ship regional agricultural produce (ginger, fruits) to main state markets at affordable shared freight costs without spoilage.
* **Key Journey:** Accesses simple vernacular mobile UI $\rightarrow$ requests micro-cargo pickup (e.g., 200 kg) $\rightarrow$ system automatically pools shipment with other local farmers into a shared cold-chain truck.

---

## 4. Functional Requirements Matrix

| ID | Module | Description | Priority |
| :--- | :--- | :--- | :--- |
| **FR-01** | **GIS Road & Bridge Accessibility Engine** | Real-time monitoring of road networks, bridges, and passes with status badges (Open, Restricted, Blocked, Critical). | P0 (Must Have) |
| **FR-02** | **Predictive Disruption Engine** | AI model computing landslide, flash flood, and washout probability per 10 km highway segment using rainfall, slope, and soil data. | P0 (Must Have) |
| **FR-03** | **Risk-Weighted Dynamic Routing** | A* / Dijkstra multi-modal pathfinding factoring in weather risk, elevation grade, bridge weight limits, and river barge links. | P0 (Must Have) |
| **FR-04** | **GPS Vehicle & Consignment Tracking** | Real-time telemetry tracking of essential goods convoys with geo-fencing, tamper alerts, and temperature monitoring for perishables. | P0 (Must Have) |
| **FR-05** | **Automated Alerting & Push Notifications** | Push, SMS, and WhatsApp alerts for route blockages, sudden weather spikes, and ETA breaches. | P0 (Must Have) |
| **FR-06** | **Field Incident Reporting (Crowdsource/PWD)** | Mobile/web module to upload geo-tagged images, hazard severity, and road clearance status with offline IndexedDB sync. | P0 (Must Have) |
| **FR-07** | **Central Control Tower Dashboard** | Unified dashboard showing district-wise connectivity indices, supply chain bottlenecks, and disaster-time emergency corridors. | P0 (Must Have) |
| **FR-08** | **Farmer Load Pooling & Marketplace** | Freight consolidation algorithm allowing rural farmers to pool small produce batches into shared freight loads. | P1 (High) |
| **FR-09** | **Explainable AI (XAI) Inspector** | Visual breakdown of why alternate routes were chosen (weather penalty vs elevation vs distance vs delay savings). | P1 (High) |
| **FR-10** | **Multilingual & Low-Bandwidth UI** | Interface supporting English, Hindi, Assamese, Bengali, and Bodo with lightweight payload optimizations. | P1 (High) |

---

## 5. Non-Functional Requirements (NFR)

* **Scalability:** Capable of handling $10,000+$ concurrent GPS telemetry streams with sub-second message ingestion.
* **Security:** Role-Based Access Control (RBAC) with Spring Security & JWT, AES-256 data encryption at rest, and TLS 1.3 in transit.
* **Offline-First Resilience:** Progressive Web App (PWA) architecture utilizing Service Workers and IndexedDB for zero-connectivity field reporting.
* **Interoperability:** Open APIs compliant with National Logistics Portal (NLP) and Open Freight Data standards (JSON/GeoJSON/REST/WebSocket).

---

## 6. Assumptions and Constraints
1. **Network Availability:** Hilly zones in NER may suffer 2G or zero network connectivity; client-side queuing is mandatory.
2. **Map Data:** Base road geometries sourced from OpenStreetMap (OSM) and Survey of India open datasets; elevation data via SRTM/ALOS 30m DEM.
3. **Weather Feed:** Live and 48-hour forecasting ingested via Open-Meteo / IMD public APIs.
