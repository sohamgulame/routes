import React, { useState, useEffect } from 'react';
import {
  Layers,
  Navigation,
  Truck,
  ShieldAlert,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Globe,
  FileCheck2,
  Radio,
  Building2,
  Wifi,
  WifiOff,
  Download
} from 'lucide-react';

import GisMap from './components/GisMap';
import RoutePlanner from './components/RoutePlanner';
import ConvoyTracker from './components/ConvoyTracker';
import DistrictIsolationHeatmap from './components/DistrictIsolationHeatmap';
import FieldIncidentModal from './components/FieldIncidentModal';
import EmergencyBroadcastModal from './components/EmergencyBroadcastModal';
import IncidentVerificationQueue from './components/IncidentVerificationQueue';
import CreateConvoyModal from './components/CreateConvoyModal';
import RoleSwitcher from './components/RoleSwitcher';
import LoginModal from './components/LoginModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { api } from './services/api';
import wsService from './services/websocket';
import { getQueuedIncidents, removeSyncedIncidents } from './services/indexedDb';
import { getTranslation } from './services/translations';

function MainApp() {
  const { currentUser, isAdmin, isDisasterOfficer, isTransporter, isFieldEngineer } = useAuth();
  const { toast } = useToast();

  // Set default active tab based on role
  const [activeTab, setActiveTab] = useState('control_tower');
  const [convoys, setConvoys] = useState([]);
  const [focusedConvoyId, setFocusedConvoyId] = useState(null);
  const [roadSegments, setRoadSegments] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [savedRoutePlan, setSavedRoutePlan] = useState(null);
  const [dispatchInitialRoute, setDispatchInitialRoute] = useState(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [language, setLanguage] = useState('EN');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncedOfflineCount, setSyncedOfflineCount] = useState(0);
  const [mapFocusTarget, setMapFocusTarget] = useState(null);

  // Switch default tab automatically when role changes
  useEffect(() => {
    if (isFieldEngineer) {
      setActiveTab('control_tower');
    } else if (isDisasterOfficer && !isAdmin) {
      setActiveTab('incident_queue');
    } else if (isTransporter && !isAdmin) {
      setActiveTab('convoys');
    } else {
      setActiveTab('control_tower');
    }
  }, [currentUser?.role]);

  // Offline / Online Network Listener & IndexedDB Background Auto-Sync
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      try {
        const queued = await getQueuedIncidents();
        if (queued && queued.length > 0) {
          const res = await api.batchSyncIncidents(queued);
          const syncedList = Array.isArray(res.data) ? res.data : (res.data?.incidents || []);
          const count = syncedList.length || (res.data?.syncedCount ?? queued.length);

          // Clear synced items from local IndexedDB so they don't get re-submitted on every reload
          await removeSyncedIncidents(queued.map((q) => q.clientOfflineId));

          if (count > 0) {
            setSyncedOfflineCount(count);
            toast.success(`Synced ${count} offline incident report(s) with Central GIS Command.`, 'Offline Auto-Sync');
            fetchInitialData();
            setTimeout(() => setSyncedOfflineCount(0), 4000);
          }
        }
      } catch (e) {
        console.warn('Auto-sync error:', e);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Network disconnected. Offline caching and IndexedDB queue activated.', 'Zero Connectivity');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on load
    handleOnline();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initial Data Fetch & WebSocket Connection (100% Live)
  useEffect(() => {
    fetchInitialData();
    wsService.connect();

    // Listen for live convoy telemetry updates
    const unsubscribeConvoy = wsService.onConvoyUpdate((incomingConvoy) => {
      setConvoys((prev) => {
        const index = prev.findIndex((c) => (c.id || c.convoyId) === incomingConvoy.convoyId);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...incomingConvoy };
          return updated;
        }
        return [incomingConvoy, ...prev];
      });
    });

    // Listen for live disaster alerts
    const unsubscribeAlert = wsService.onDisruptionAlert((incomingAlert) => {
      setActiveAlert(incomingAlert);
      toast.warning(incomingAlert.description || 'Hazard reported on transit corridor!', `DISASTER ALERT [${incomingAlert.highwayCode || 'CRITICAL'}]`);
    });

    return () => {
      unsubscribeConvoy();
      unsubscribeAlert();
      wsService.disconnect();
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      const [convoysRes, segmentsRes, districtsRes, incidentsRes] = await Promise.allSettled([
        api.getActiveConvoys(),
        api.getRoadSegments(),
        api.getDistricts(),
        api.getRecentIncidents(),
      ]);

      if (convoysRes.status === 'fulfilled' && Array.isArray(convoysRes.value.data)) {
        setConvoys(convoysRes.value.data);
      } else {
        setConvoys([]);
      }

      if (segmentsRes.status === 'fulfilled' && Array.isArray(segmentsRes.value.data)) {
        setRoadSegments(segmentsRes.value.data);
      }
      if (districtsRes.status === 'fulfilled' && Array.isArray(districtsRes.value.data)) {
        setDistricts(districtsRes.value.data);
      }
      if (incidentsRes.status === 'fulfilled' && Array.isArray(incidentsRes.value.data)) {
        setIncidents(incidentsRes.value.data);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const t = (key) => getTranslation(language, key);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#050c1a] text-slate-100 font-sans selection:bg-teal-400 selection:text-slate-950">
      {/* Top Navigation Bar with z-[9000] */}
      <header className="flex-shrink-0 z-[9000] relative bg-[#081328] border-b border-[#14294a] px-6 py-3 flex items-center justify-between shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-teal-400 via-emerald-400 to-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25">
            <Activity className="w-5 h-5 font-extrabold stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-white tracking-tight font-display">AURA-NER</h1>
              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-sky-500/15 text-sky-300 border border-sky-400/30 rounded-full uppercase tracking-wider font-mono">
                {currentUser ? currentUser.role.replace('ROLE_', '') : 'GUEST'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              AI Multi-Modal Logistics & Road Hazard Intelligence • MDoNER (SIH26002)
            </p>
          </div>
        </div>

        {/* Action Controls & Profile Bar */}
        <div className="flex items-center space-x-3">
          {/* Network Status Pill */}
          <div className={`hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${isOnline ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40' : 'bg-rose-950/40 text-rose-300 border-rose-800/40'
            }`}>
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-rose-400 animate-pulse" />}
            <span className="text-[11px]">{isOnline ? t('liveTelemetry') : 'OFFLINE MODE (PWA)'}</span>
          </div>

          {/* Emergency Broadcast Button (Disaster Officer & Admin) */}
          {(isAdmin || isDisasterOfficer) && (
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:opacity-90 text-white text-xs font-bold shadow-lg shadow-rose-600/25 transition animate-pulse"
            >
              <Radio className="w-4 h-4" />
              <span>{t('broadcastAlert')}</span>
            </button>
          )}

          {/* Incident Report Button */}
          <button
            onClick={() => setShowIncidentModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:opacity-90 text-white text-xs font-bold shadow-lg shadow-red-600/20 transition"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{isFieldEngineer ? t('fieldReportVerified') : t('fieldReport')}</span>
          </button>

          {/* User Profile / Auth Sign In */}
          <RoleSwitcher onOpenLoginModal={() => setShowLoginModal(true)} />

          {/* Multilingual Selector */}
          <div className="hidden sm:flex items-center space-x-1 bg-[#0a1828] px-2.5 py-1.5 rounded-xl border border-[#162e4c] text-xs text-slate-300">
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer font-medium text-[11px]"
            >
              <option value="EN" className="bg-[#061024] text-white">EN (English)</option>
              <option value="HI" className="bg-[#061024] text-white">HI (हिंदी)</option>
              <option value="AS" className="bg-[#061024] text-white">AS (অসমীয়া)</option>
              <option value="BN" className="bg-[#061024] text-white">BN (বাংলা)</option>
            </select>
          </div>
        </div>
      </header>

      {/* Offline Batch Sync Notification Pill */}
      {syncedOfflineCount > 0 && (
        <div className="bg-emerald-950/90 border-b border-emerald-600 text-emerald-200 px-6 py-2 text-xs flex items-center justify-between animate-in slide-in-from-top duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Successfully synced <strong>{syncedOfflineCount} offline incident reports</strong> from IndexedDB queue to cloud database!</span>
          </div>
        </div>
      )}

      {/* Emergency Alert Banner with z-[8999] */}
      {activeAlert && (
        <div className="flex-shrink-0 z-[8999] relative bg-[#2d0b13] border-b border-[#581423] px-6 py-2.5 flex items-center justify-between text-xs text-slate-200 shadow-lg animate-in slide-in-from-top duration-200">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse flex-shrink-0" />
            <span>
              <strong className="text-white font-bold">EMERGENCY ALERT ({activeAlert.highwayCode}):</strong> {activeAlert.description} — Recommended Bypass: <strong className="text-amber-400 font-bold">{activeAlert.recommendedBypass}</strong>
            </span>
          </div>
          <button
            onClick={() => setActiveAlert(null)}
            className="text-xs text-rose-400 hover:text-white font-bold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Split-Screen Container (Zero global page scroll) */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative z-0">
        {/* Left Sidebar Pane: Independent Vertical Scroll */}
        <aside className="w-full lg:w-64 h-full overflow-y-auto shrink-0 bg-[#050c1a] border-r border-[#112340] p-4 flex flex-col space-y-2">
          {/* 1. GIS Control Tower */}
          <button
            onClick={() => {
              setActiveTab('control_tower');
              if (!selectedRoute?.isConvoyBound) {
                setSelectedRoute(null);
              }
            }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-xs transition-all duration-150 ${activeTab === 'control_tower'
              ? 'bg-sky-950/50 border border-sky-500/60 text-sky-300 font-bold shadow-[0_0_15px_rgba(56,189,248,0.15)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
          >
            <Layers className="w-4 h-4 text-sky-400" />
            <span>{t('controlTower')}</span>
          </button>

          {/* 2. Incident Verification Queue (Admin & Disaster Officer) */}
          {(isAdmin || isDisasterOfficer) && (
            <button
              onClick={() => setActiveTab('incident_queue')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-xs transition-all duration-150 ${activeTab === 'incident_queue'
                ? 'bg-rose-950/50 border border-rose-500/60 text-rose-300 font-bold shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
            >
              <FileCheck2 className="w-4 h-4 text-rose-400" />
              <span>{t('incidentQueue')}</span>
            </button>
          )}

          {/* 3. Multi-Modal Routing */}
          {(!isFieldEngineer || isAdmin) && (
            <button
              onClick={() => setActiveTab('route_planner')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-xs transition-all duration-150 ${activeTab === 'route_planner'
                ? 'bg-sky-950/50 border border-sky-500/60 text-sky-300 font-bold shadow-[0_0_15px_rgba(56,189,248,0.15)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
            >
              <Navigation className="w-4 h-4 text-sky-400" />
              <span>{t('routePlanner')}</span>
            </button>
          )}

          {/* 4. Essential Fleet Tracker */}
          {(isAdmin || isTransporter) && (
            <button
              onClick={() => setActiveTab('convoys')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-xs transition-all duration-150 ${activeTab === 'convoys'
                ? 'bg-sky-950/50 border border-sky-500/60 text-sky-300 font-bold shadow-[0_0_15px_rgba(56,189,248,0.15)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
            >
              <Truck className="w-4 h-4 text-sky-400" />
              <span>{t('fleetTracker')}</span>
            </button>
          )}

          {/* 5. District Isolation Heatmap & SitRep */}
          <button
            onClick={() => setActiveTab('district_heatmap')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-xs transition-all duration-150 ${activeTab === 'district_heatmap'
              ? 'bg-sky-950/50 border border-sky-500/60 text-sky-300 font-bold shadow-[0_0_15px_rgba(56,189,248,0.15)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
          >
            <Building2 className="w-4 h-4 text-sky-400" />
            <span>{t('districtHeatmap')}</span>
          </button>
        </aside>

        {/* Right Main Content Pane: Independent Vertical Scroll */}
        <main className="flex-1 h-full overflow-y-auto p-6 space-y-6 bg-[#050c1a]">
          {activeTab === 'control_tower' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Real-Time Telemetry KPI Strip (Interactive Command Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Active Convoys Card -> Jumps to Fleet Tracker */}
                <div
                  onClick={() => setActiveTab('convoys')}
                  className="group cursor-pointer bg-[#081328] p-4 rounded-2xl border border-[#14294a] shadow-lg border-l-4 border-l-emerald-400 flex items-center justify-between hover:border-emerald-400/80 hover:scale-[1.01] hover:bg-[#0a1832] transition-all"
                  title="Click to open Fleet Tracker"
                >
                  <div>
                    <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider flex items-center gap-1">
                      <span>{t('activeConvoys')}</span>
                      <span className="text-emerald-400 opacity-0 group-hover:opacity-100 transition text-[10px]">➔</span>
                    </p>
                    <h3 className="text-2xl font-bold text-white mt-1 font-display">
                      {convoys.length} {convoys.length === 1 ? 'Convoy' : 'Convoys'}
                    </h3>
                    <p className="text-xs text-emerald-400 mt-0.5 font-medium group-hover:underline">
                      {convoys.length > 0 ? '100% Live GPS Stream • Open Fleet ➔' : 'Ready for Dispatch • Open Fleet ➔'}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:scale-110 transition">
                    <Truck className="w-6 h-6" />
                  </div>
                </div>

                {/* 2. National Waterway-2 Card -> Focuses GIS Map on Pandu Port */}
                <div
                  onClick={() => {
                    setMapFocusTarget({ coords: [26.1782, 91.6883], zoom: 13, ts: Date.now() });
                    toast.info('Focusing GIS camera on Pandu Port & Brahmaputra NW-2 River Terminal', 'Waterway Active');
                  }}
                  className="group cursor-pointer bg-[#081328] p-4 rounded-2xl border border-[#14294a] shadow-lg border-l-4 border-l-cyan-400 flex items-center justify-between hover:border-cyan-400/80 hover:scale-[1.01] hover:bg-[#0a1832] transition-all"
                  title="Click to focus GIS camera on Pandu Port"
                >
                  <div>
                    <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider flex items-center gap-1">
                      <span>{t('waterwayStatus')}</span>
                      <span className="text-cyan-400 opacity-0 group-hover:opacity-100 transition text-[10px]">➔</span>
                    </p>
                    <h3 className="text-2xl font-bold text-white mt-1 font-display">Pandu Port</h3>
                    <p className="text-xs text-cyan-400 mt-0.5 font-medium group-hover:underline">
                      Brahmaputra Navigable • Focus Port ➔
                    </p>
                  </div>
                  <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-500/20 group-hover:scale-110 transition">
                    <Activity className="w-6 h-6" />
                  </div>
                </div>

                {/* 3. Hazard Warning Feed Card -> Jumps to Incident Queue */}
                {(() => {
                  const activeHazardsCount = incidents.filter((i) => i.verificationStatus === 'VERIFIED' || i.verificationStatus === 'ACTIVE').length;
                  const hasDisruption = activeHazardsCount > 0;

                  return (
                    <div
                      onClick={() => setActiveTab('incident_queue')}
                      className={`group cursor-pointer bg-[#081328] p-4 rounded-2xl border border-[#14294a] shadow-lg border-l-4 flex items-center justify-between hover:scale-[1.01] hover:bg-[#0a1832] transition-all ${hasDisruption
                          ? 'border-l-rose-500 hover:border-rose-500/80'
                          : 'border-l-emerald-400 hover:border-emerald-400/80'
                        }`}
                      title="Click to open Incident Review & Hazard Queue"
                    >
                      <div>
                        <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider flex items-center gap-1">
                          <span>{t('hazardAlerts')}</span>
                          <span className={`${hasDisruption ? 'text-rose-400' : 'text-emerald-400'} opacity-0 group-hover:opacity-100 transition text-[10px]`}>➔</span>
                        </p>
                        <h3 className="text-2xl font-bold text-white mt-1 font-display">
                          {hasDisruption ? `${activeHazardsCount} Active` : 'All Clear (0)'}
                        </h3>
                        <p className={`text-xs mt-0.5 font-medium group-hover:underline ${hasDisruption ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {hasDisruption ? 'Disruptions Reported • Review Hazards ➔' : 'All Corridors Open • View Queue ➔'}
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl border transition group-hover:scale-110 ${hasDisruption
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 group-hover:bg-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:bg-emerald-500/20'
                        }`}>
                        {hasDisruption ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                      </div>
                    </div>
                  );
                })()}

                {/* 4. Monitored Districts Card -> Jumps to District Heatmap */}
                <div
                  onClick={() => setActiveTab('district_heatmap')}
                  className="group cursor-pointer bg-[#081328] p-4 rounded-2xl border border-[#14294a] shadow-lg border-l-4 border-l-sky-400 flex items-center justify-between hover:border-sky-400/80 hover:scale-[1.01] hover:bg-[#0a1832] transition-all"
                  title="Click to open District Isolation Heatmap"
                >
                  <div>
                    <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider flex items-center gap-1">
                      <span>{t('monitoredDistricts')}</span>
                      <span className="text-sky-400 opacity-0 group-hover:opacity-100 transition text-[10px]">➔</span>
                    </p>
                    <h3 className="text-2xl font-bold text-white mt-1 font-display">
                      {districts.length || 10} Districts
                    </h3>
                    <p className="text-xs text-sky-400 mt-0.5 font-medium group-hover:underline">
                      NER Corridors Active • View Heatmap ➔
                    </p>
                  </div>
                  <div className="p-3 bg-sky-500/10 rounded-xl text-sky-400 border border-sky-500/20 group-hover:bg-sky-500/20 group-hover:scale-110 transition">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* GIS Interactive Map */}
              <GisMap
                convoys={convoys}
                focusedConvoyId={focusedConvoyId}
                roadSegments={roadSegments}
                incidents={incidents}
                selectedRoute={selectedRoute}
                customRouteCoords={selectedRoute?.snappedCoordinates}
                originCoords={selectedRoute?.originCoords}
                destinationCoords={selectedRoute?.destinationCoords}
                originLabel={selectedRoute?.originLabel}
                destinationLabel={selectedRoute?.destinationLabel}
                mapFocusTarget={mapFocusTarget}
              />
            </div>
          )}

          {activeTab === 'incident_queue' && (
            <IncidentVerificationQueue
              onIncidentResolved={() => {
                fetchInitialData();
              }}
            />
          )}

          {activeTab === 'route_planner' && (
            <RoutePlanner
              roadSegments={roadSegments}
              savedRoutePlan={savedRoutePlan}
              onSaveRoutePlan={(plan) => setSavedRoutePlan(plan)}
              onRouteSelected={(route) => {
                setSelectedRoute(route);
              }}
              onNavigateToControlTower={() => {
                setActiveTab('control_tower');
              }}
              onDispatchViaRoute={(routeData) => {
                setDispatchInitialRoute(routeData);
                setShowDispatchModal(true);
              }}
            />
          )}

          {activeTab === 'convoys' && (
            <ConvoyTracker
              convoys={convoys}
              onConvoyAdded={(newConvoy) => {
                setConvoys((prev) => [newConvoy, ...prev]);
                setFocusedConvoyId(newConvoy.id || newConvoy.convoyId);
              }}
              onConvoyDeleted={(deletedId) => {
                setConvoys((prev) => prev.filter((c) => (c.id || c.convoyId) !== deletedId));
              }}
              onViewOnMap={(convoy) => {
                setFocusedConvoyId(convoy.id || convoy.convoyId);
                setSelectedRoute(null);
                setActiveTab('control_tower');
              }}
            />
          )}

          {activeTab === 'district_heatmap' && (
            <DistrictIsolationHeatmap districts={districts} />
          )}
        </main>
      </div>

      {/* Dispatch Convoy Modal via Route Planner */}
      {showDispatchModal && (
        <CreateConvoyModal
          isOpen={true}
          initialRouteData={dispatchInitialRoute}
          onClose={() => {
            setShowDispatchModal(false);
            setDispatchInitialRoute(null);
          }}
          onConvoyCreated={(newConvoy) => {
            setConvoys((prev) => [newConvoy, ...prev]);
            setFocusedConvoyId(newConvoy.id || newConvoy.convoyId);
            setSelectedRoute(null);
            setActiveTab('control_tower');
          }}
        />
      )}

      {/* Field Incident Modal with z-[9999] */}
      {showIncidentModal && (
        <FieldIncidentModal
          onClose={() => setShowIncidentModal(false)}
          onIncidentAdded={() => fetchInitialData()}
        />
      )}

      {/* Emergency Broadcast Modal with z-[9999] */}
      {showBroadcastModal && (
        <EmergencyBroadcastModal
          isOpen={showBroadcastModal}
          onClose={() => setShowBroadcastModal(false)}
          onBroadcastSuccess={(broadcastData) => {
            setActiveAlert({
              highwayCode: broadcastData.highwayCode,
              description: broadcastData.message,
              recommendedBypass: broadcastData.recommendedBypass,
            });
          }}
        />
      )}

      {/* Official Login Modal with z-[9999] */}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </AuthProvider>
  );
}
