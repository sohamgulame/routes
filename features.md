# Detailed Feature Matrix & Specifications (Features.md)

## Project Title: AURA-NER (SIH26002)
**AI-Based Smart Logistics and Accessibility Intelligence Platform for North Eastern Region**

---

## 1. Feature Breakdown by Problem Statement Clauses

### Feature 1: Real-Time Road, Bridge & Transport Accessibility Monitoring
* **Clause ID:** `REQ-A`
* **Target Audience:** State Disaster Management (SDMA), PWD Highway Engineers, Traffic Police, Transporters.
* **Capabilities:**
  * Interactive 2D/3D GIS Map displaying all major North-East National Highways (NH-06, NH-27, NH-29, NH-10, NH-102, etc.) and state corridors.
  * Color-coded road segment status badges:
    * 🟢 **OPEN:** Normal flow, no hazard detected.
    * 🟡 **CAUTION / RESTRICTED:** High rain/fog, speed limit restricted, heavy vehicles diverted.
    * 🔴 **BLOCKED / IMPASSABLE:** Active landslide, washed-out bridge, submerged road.
  * Real-time bridge health indicator: Weight capacity limits, scour/flood clearance height, structural alert flags.

---

### Feature 2: AI-Powered Route Disruption & Hazard Predictor
* **Clause ID:** `REQ-B`
* **Target Audience:** Logistics Dispatchers, Emergency Response Coordinators.
* **Capabilities:**
  * Continuous weather assimilation (Open-Meteo & IMD API) checking 24h/48h accumulated precipitation.
  * Machine Learning inference (XGBoost) computing the failure probability of every 10 km highway segment.
  * Landslide & Flash Flood Warning Index (0.0 to 1.0) updated every 30 minutes.
  * Preemptive Alert Window: Disruption warning dispatched **12 to 48 hours before physical failure**, enabling early convoy holding or rerouting.

---

### Feature 3: Risk-Weighted Dynamic Multi-Modal Routing & Delay Estimator
* **Clause ID:** `REQ-C`
* **Target Audience:** Convoy Planners, Truck Drivers, Supply Chain Coordinators.
* **Capabilities:**
  * Generates 3 distinct route strategies for any origin-destination pair in NER:
    1. ⚡ **Fastest Route:** Direct highway (if risk is below threshold).
    2. 🛡️ **Most Resilient (Risk-Averse) Route:** Automatically detours around high-hazard segments.
    3. 🚢 **Multi-Modal Route (Road + River NW-2 / Rail):** Integrates Brahmaputra river ports (Pandu, Dhubri, Silghat) and rail transshipment hubs for heavy freight.
  * Dynamic Delay Calculation: Accurately estimates stoppage delays (in hours) based on gradient, truck load, and weather severity.

---

### Feature 4: GPS Tracking of Essential Commodities & Perishables
* **Clause ID:** `REQ-D`
* **Target Audience:** District Magistrates, Health Officers (Medicines), Food & Civil Supplies.
* **Capabilities:**
  * Live tracking of registered supply vehicles carrying:
    * 💊 **Emergency Medicines & Vaccines** (Cold-chain sensitive)
    * 🌾 **Food Grains (PDS / FCI Supplies)**
    * ⛽ **Fuel & Petroleum Tankers**
    * 🏗️ **Infrastructure & Construction Materials**
    * 🍍 **High-Value Agricultural Produce** (Ginger, Turmeric, Fruits)
  * Real-time Telemetry: Displays GPS speed, heading, route adherence, and temperature sensor reading for refrigerated trucks (reefers).
  * Geo-fencing & Deviation Alerts: Triggers an alert if a supply convoy deviates from the approved safe route or halts unexpectedly in a hazard zone.

---

### Feature 5: Automated Multi-Channel Alert & Broadcast Engine
* **Clause ID:** `REQ-E`
* **Target Audience:** Drivers, Village Heads (Gram Pradhans), Local Authorities, Transporters.
* **Capabilities:**
  * Instant automated dispatch of critical alerts via:
    * **Web/App In-App Push Notifications** (Live WebSocket)
    * **SMS Gateway (Fast2SMS / Twilio)** for basic feature phones in remote hills
    * **Automated WhatsApp Business Bot** for drivers and logistics managers
  * Geo-Targeted Broadcasts: Automatically sends warnings only to drivers currently within a 50 km radius of an active hazard corridor.

---

### Feature 6: Field-Level Geo-Tagged Incident Reporting & Crowdsourcing
* **Clause ID:** `REQ-F`
* **Target Audience:** PWD Engineers, Border Roads Organisation (BRO) staff, Police, Local Citizens.
* **Capabilities:**
  * Mobile-friendly quick report form:
    * Auto-detected GPS coordinates & elevation.
    * Incident category: Landslide, Flash Flood, Bridge Collapse, Road Cavity, Tree Fall.
    * Severity level: Minor, Partial Blockage, Total Stoppage.
    * Live camera capture with metadata verification (prevents fake/old photo uploads).
  * Two-Tier Verification Flow: Reports submitted by certified PWD/Police officials instantly mark the road as "BLOCKED"; citizen reports enter a fast-track review queue.

---

### Feature 7: Centralized Crisis & Accessibility Control Tower Dashboards
* **Clause ID:** `REQ-G`
* **Target Audience:** Chief Ministers' Offices, MDoNER Executives, District Collectors.
* **Capabilities:**
  * **District-Wise Connectivity Index:** Heatmap of all 120+ NER districts scored from 100% (Fully Connected) to 0% (Completely Isolated).
  * **Supply Bottleneck Analytics:** Highlights critical districts facing impending medicine/food shortages due to transit stoppages.
  * **Disaster-Time Emergency Green Corridors:** 1-click generation of prioritized lanes for emergency ambulances and disaster response vehicles.
  * **Executive Export:** Generates PDF Situation Reports (SitReps) for daily government disaster reviews.

---

### Feature 8: Offline-First Synchronization & Multilingual Accessibility
* **Clause ID:** `REQ-H`
* **Target Audience:** Rural Field Workers, Non-English Speaking Drivers.
* **Capabilities:**
  * **PWA Offline Resilience:** Field workers can create, capture, and save incident reports with zero cellular connection; data is stored securely in browser IndexedDB and syncs automatically when network returns.
  * **Vernacular Language Support:** Complete UI translation and voice-assisted navigation in **English, Hindi, Assamese (অসমীয়া), Bengali (বাংলা), and Bodo**.

---

## 2. Differentiating "Winning" Value-Add Features

| Feature Name | Value Proposition |
| :--- | :--- |
| **XAI Route Decision Inspector** | Visual breakdown (SHAP values & waterfall charts) explaining the exact mathematical justification for route detours. |
| **Farmer Load Pooling Marketplace** | Consolidates small rural agricultural batches (e.g., 100 kg ginger) into shared pickup trucks, reducing freight costs by 45%. |
| **Perishable Freshness Decay Monitor** | Time-Temperature Index (TTI) algorithm estimating shelf-life loss during transit delays. |
| **1-Click Digital e-Waybill Generator** | Generates official QR-coded digital transit manifests compliant with GST & transport regulations. |
