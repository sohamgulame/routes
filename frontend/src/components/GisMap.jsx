import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, Tooltip, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import { Info, X, ShieldAlert, Navigation, MapPin, Truck } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchOsrmRoadGeometry, calculateMultiWaypointRoute, snapToNearestHighway } from '../services/osrm';
import { searchLocations } from '../services/geocoding';

// Fix default leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons using emojis & CSS glow
const createCustomIcon = (color, type) => {
  return L.divIcon({
    className: 'custom-map-icon',
    html: `
      <div style="
        background: ${color}; 
        width: 32px; 
        height: 32px; 
        border-radius: 50%; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        box-shadow: 0 0 14px ${color}; 
        border: 2px solid white;
      ">
        <span style="font-size: 16px; color: white; font-weight: bold;">
          ${type === 'TRUCK' ? '🚚' : type === 'PORT' ? '⚓' : type === 'START' ? '🟢' : type === 'END' ? '🏁' : '⚠️'}
        </span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

function MapViewController({
  center = [25.85, 92.4],
  zoom = 7,
  selectedRoute,
  customRouteCoords,
  originCoords,
  destinationCoords,
  focusedTruckCoords,
  isAutoFollowing,
  onUserDrag,
  focusedConvoyId,
  mapFocusTarget,
}) {
  const map = useMap();
  const initializedRef = useRef(false);

  // Dynamic camera fly-to on explicit target selection (e.g. Pandu Port NW-2 or Hazard pins)
  useEffect(() => {
    try {
      if (mapFocusTarget && mapFocusTarget.coords && map && map.getContainer() && map.getContainer().offsetParent !== null) {
        map.flyTo(mapFocusTarget.coords, mapFocusTarget.zoom || 12, { duration: 1.5 });
        map.invalidateSize();
      }
    } catch (e) {}
  }, [mapFocusTarget, map]);

  // Invalidate Leaflet canvas size on mount and on visibility change to prevent gray tile areas
  useEffect(() => {
    const handleResize = () => {
      try {
        if (map && map.getContainer() && map.getContainer().offsetParent !== null) {
          map.invalidateSize();
        }
      } catch (e) {}
    };

    handleResize();
    const t1 = setTimeout(handleResize, 100);
    const t2 = setTimeout(handleResize, 400);

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  // Detect user drag on the map to pause auto-following
  useMapEvents({
    dragstart: () => {
      onUserDrag?.();
    },
  });

  // Default initial centering when no convoy is active
  useEffect(() => {
    try {
      if (map && map.getContainer() && map.getContainer().offsetParent !== null) {
        if (!focusedTruckCoords && !customRouteCoords) {
          map.setView(center, zoom);
          map.invalidateSize();
        }
      }
    } catch (e) {}
  }, [map, center, zoom, focusedTruckCoords, customRouteCoords]);

  // Fly directly to vehicle when selected/viewed
  useEffect(() => {
    try {
      if (map && map.getContainer() && map.getContainer().offsetParent !== null) {
        if (focusedConvoyId && focusedTruckCoords) {
          map.flyTo(focusedTruckCoords, 13, { duration: 1.2 });
          map.invalidateSize();
        } else if (customRouteCoords && customRouteCoords.length > 1 && !focusedTruckCoords) {
          map.fitBounds(L.latLngBounds(customRouteCoords), { padding: [50, 50], maxZoom: 12 });
          map.invalidateSize();
        } else if (originCoords && destinationCoords && !focusedTruckCoords) {
          map.fitBounds(L.latLngBounds([originCoords, destinationCoords]), { padding: [60, 60], maxZoom: 12 });
          map.invalidateSize();
        }
      }
    } catch (e) {}
  }, [focusedConvoyId, focusedTruckCoords, map]);

  // Real-time camera auto-follow: pan smoothly with moving vehicle (only if map is visible)
  useEffect(() => {
    try {
      if (isAutoFollowing && focusedTruckCoords && map && map.getContainer() && map.getContainer().offsetParent !== null) {
        map.panTo(focusedTruckCoords, { animate: true, duration: 1.5 });
      }
    } catch (e) {}
  }, [focusedTruckCoords, isAutoFollowing, map]);

  return null;
}

export default function GisMap({
  convoys = [],
  focusedConvoyId = null,
  roadSegments = [],
  incidents = [],
  selectedRoute = null,
  customRouteCoords = null,
  originCoords = null,
  destinationCoords = null,
  originLabel = 'Origin',
  destinationLabel = 'Destination',
  showAllCorridors = false,
  onMapClick = null,
  mapFocusTarget = null,
}) {
  const center = [25.85, 92.4];
  const [mapLayer, setMapLayer] = useState('osm');
  const [showTraffic, setShowTraffic] = useState(true);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [osrmRouteCoords, setOsrmRouteCoords] = useState([]);

  const tileUrls = {
    osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    topo: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  };

  // Determine active route coordinates dynamically for all dispatched convoys
  const [convoyRoutes, setConvoyRoutes] = useState({});

  useEffect(() => {
    if (convoys && convoys.length > 0) {
      convoys.forEach(async (c) => {
        const cId = c.id || c.convoyId;
        if (!cId || convoyRoutes[cId]) return;

        // 1. Check if specific selected route polyline was stored in sessionStorage
        let customPolyline = null;
        try {
          const stored = sessionStorage.getItem('aura_convoy_polyline_' + cId) ||
            (c.vehicleNumber ? sessionStorage.getItem('aura_convoy_polyline_' + c.vehicleNumber) : null);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 1) {
              customPolyline = parsed;
            }
          }
        } catch (e) {}

        if (customPolyline) {
          setConvoyRoutes((prev) => ({
            ...prev,
            [cId]: {
              polyline: customPolyline,
              startCoords: customPolyline[0],
              endCoords: customPolyline[customPolyline.length - 1],
              originCity: c.originCity,
              destinationCity: c.destinationCity,
              vehicleNumber: c.vehicleNumber,
              routeSummary: c.activeRouteSummary,
            }
          }));
          return;
        }

        // 2. Otherwise calculate dynamically based on coordinates and route summary
        let startLat = c.originLat || c.currentLatitude || c.latitude;
        let startLng = c.originLng || c.currentLongitude || c.longitude;
        let endLat = c.destLat;
        let endLng = c.destLng;

        if ((!startLat || !startLng) && c.originCity) {
          try {
            const geo = await searchLocations(c.originCity);
            if (geo && geo.length > 0) {
              startLat = geo[0].lat;
              startLng = geo[0].lng;
            }
          } catch (e) {
            console.warn('Dynamic geocoding error for origin:', e);
          }
        }

        if ((!endLat || !endLng) && c.destinationCity) {
          try {
            const geo = await searchLocations(c.destinationCity);
            if (geo && geo.length > 0) {
              endLat = geo[0].lat;
              endLng = geo[0].lng;
            }
          } catch (e) {
            console.warn('Dynamic geocoding error for destination:', e);
          }
        }

        if (startLat && startLng && endLat && endLng) {
          try {
            const routeSum = (c.activeRouteSummary || '').toLowerCase();
            let roadCoords = null;

            const midLat = (startLat + endLat) / 2;
            const midLng = (startLng + endLng) / 2;
            const dLat = endLat - startLat;
            const dLng = endLng - startLng;
            const distDeg = Math.sqrt(dLat * dLat + dLng * dLng) || 0.05;
            const scaleDeg = 0.08;

            if (routeSum.includes('northern') || routeSum.includes('bypass') || routeSum.includes('parallel')) {
              // Northern / Left flank
              const rawLeft = [midLat + (-dLng / distDeg) * scaleDeg, midLng + (dLat / distDeg) * scaleDeg];
              const snappedLeft = await snapToNearestHighway(rawLeft[0], rawLeft[1]);
              const resOsrm = await calculateMultiWaypointRoute([[startLat, startLng], snappedLeft, [endLat, endLng]]);
              roadCoords = resOsrm?.coordinates;
            } else if (routeSum.includes('southern') || routeSum.includes('arterial') || routeSum.includes('expressway')) {
              // Southern / Right flank
              const rawRight = [midLat + (dLng / distDeg) * scaleDeg, midLng + (-dLat / distDeg) * scaleDeg];
              const snappedRight = await snapToNearestHighway(rawRight[0], rawRight[1]);
              const resOsrm = await calculateMultiWaypointRoute([[startLat, startLng], snappedRight, [endLat, endLng]]);
              roadCoords = resOsrm?.coordinates;
            }

            if (!roadCoords || roadCoords.length === 0) {
              roadCoords = await fetchOsrmRoadGeometry([startLat, startLng], [endLat, endLng]);
            }

            if (roadCoords && roadCoords.length > 0) {
              setConvoyRoutes((prev) => ({
                ...prev,
                [cId]: {
                  polyline: roadCoords,
                  startCoords: [startLat, startLng],
                  endCoords: [endLat, endLng],
                  originCity: c.originCity,
                  destinationCity: c.destinationCity,
                  vehicleNumber: c.vehicleNumber,
                  routeSummary: c.activeRouteSummary,
                }
              }));
            }
          } catch (e) {
            console.warn('OSRM road geometry fetch error:', e);
          }
        }
      });
    }
  }, [convoys]);

  // Helper: Find closest road coordinate index to vehicle live coordinates
  const findClosestRoadIndex = (polyline, currLat, currLng) => {
    if (!polyline || polyline.length === 0 || !currLat || !currLng) return 0;
    let bestIdx = 0;
    let minDistance = Infinity;
    for (let i = 0; i < polyline.length; i++) {
      const [lat, lng] = polyline[i];
      const dist = Math.pow(lat - currLat, 2) + Math.pow(lng - currLng, 2);
      if (dist < minDistance) {
        minDistance = dist;
        bestIdx = i;
      }
    }
    return bestIdx;
  };

  // Selected Convoy state for single focused convoy view
  const [selectedConvoyId, setSelectedConvoyId] = useState(null);

  // Dynamic road-snapped vehicle animation along OSRM asphalt polyline with sessionStorage persistence
  const [convoyStepIndices, setConvoyStepIndices] = useState(() => {
    try {
      const saved = sessionStorage.getItem('aura_convoy_step_indices');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Sync step indices with live GPS coordinates on initial load so progress is never lost across tab changes
  useEffect(() => {
    if (convoys && convoys.length > 0 && Object.keys(convoyRoutes).length > 0) {
      setConvoyStepIndices((prev) => {
        let changed = false;
        const updated = { ...prev };

        convoys.forEach((c) => {
          const cId = c.id || c.convoyId;
          const rData = convoyRoutes[cId];
          if (rData && rData.polyline && rData.polyline.length > 0) {
            // Only initialize on initial registration
            if (updated[cId] === undefined) {
              const currLat = c.currentLatitude || c.latitude;
              const currLng = c.currentLongitude || c.longitude;
              const liveIdx = findClosestRoadIndex(rData.polyline, currLat, currLng);
              updated[cId] = liveIdx;
              changed = true;
            }
          }
        });

        if (changed) {
          try {
            sessionStorage.setItem('aura_convoy_step_indices', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        }
        return prev;
      });
    }
  }, [convoys, convoyRoutes]);

  useEffect(() => {
    const interval = setInterval(() => {
      setConvoyStepIndices((prev) => {
        let changed = false;
        const next = { ...prev };
        Object.entries(convoyRoutes).forEach(([cId, rData]) => {
          if (rData && rData.polyline && rData.polyline.length > 1) {
            const currIdx = next[cId] || 0;
            // Advance by proportional steps along asphalt route coordinates
            const stepIncrement = Math.max(1, Math.floor(rData.polyline.length / 100));
            const nextIdx = (currIdx + stepIncrement < rData.polyline.length)
              ? currIdx + stepIncrement
              : rData.polyline.length - 1;
            if (nextIdx !== currIdx) {
              next[cId] = nextIdx;
              changed = true;
            }
          }
        });
        if (changed) {
          try {
            sessionStorage.setItem('aura_convoy_step_indices', JSON.stringify(next));
          } catch (e) {}
        }
        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [convoyRoutes]);

  // Sync selected convoy with focusedConvoyId or default to latest active convoy
  useEffect(() => {
    if (focusedConvoyId) {
      setSelectedConvoyId(focusedConvoyId);
    } else if (convoys && convoys.length > 0) {
      const active = convoys.find((c) => c.status !== 'DELIVERED') || convoys[0];
      setSelectedConvoyId(active.id || active.convoyId);
    }
  }, [focusedConvoyId, convoys]);

  // Helper: Find closest hazard distance to a coordinate for real-time traffic segmentation
  const getTrafficStatusAtCoord = (lat, lng) => {
    for (const hazard of roadSegments) {
      const hLat = hazard.latitude || 25.4526;
      const hLng = hazard.longitude || 92.2037;
      const dist = Math.sqrt(Math.pow(lat - hLat, 2) + Math.pow(lng - hLng, 2));

      // If near a known hazard / congestion zone (~18km radius)
      if (dist < 0.18) {
        if (hazard.currentStatus === 'BLOCKED' || hazard.currentRiskScore > 0.7) {
          return { color: '#ef4444', label: '🔴 Heavy Congestion / Hazard (15 km/h)', level: 'HEAVY' };
        }
        return { color: '#f59e0b', label: '🟡 Moderate Traffic Delay (32 km/h)', level: 'MODERATE' };
      }
    }
    return { color: '#10b981', label: '🟢 Free Flowing Traffic (55 km/h)', level: 'FREE' };
  };

  const getTrafficChunks = (coords) => {
    if (!coords || coords.length < 2) return [];
    const chunks = [];
    let currentChunk = [coords[0]];
    let currentStatus = getTrafficStatusAtCoord(coords[0][0], coords[0][1]);

    for (let i = 1; i < coords.length; i++) {
      const pt = coords[i];
      const status = getTrafficStatusAtCoord(pt[0], pt[1]);

      if (status.level === currentStatus.level) {
        currentChunk.push(pt);
      } else {
        currentChunk.push(pt); // overlap 1 point for continuous line
        chunks.push({ points: currentChunk, status: currentStatus });
        currentChunk = [pt];
        currentStatus = status;
      }
    }
    if (currentChunk.length > 0) {
      chunks.push({ points: currentChunk, status: currentStatus });
    }
    return chunks;
  };

  const selectedPolyline = (selectedConvoyId && convoyRoutes[selectedConvoyId]?.polyline) || (Object.values(convoyRoutes)[0]?.polyline) || null;
  const activeRoutePolyline = customRouteCoords || osrmRouteCoords || selectedPolyline;
  const focusedConvoy = convoys.find((c) => (c.id || c.convoyId) === selectedConvoyId) || (convoys.length > 0 ? convoys[0] : null);

  const [isAutoFollowing, setIsAutoFollowing] = useState(true);

  // When focused convoy changes, re-engage auto-following mode
  useEffect(() => {
    if (focusedConvoyId) {
      setIsAutoFollowing(true);
    }
  }, [focusedConvoyId]);

  // Compute live coordinates of the focused truck
  let focusedTruckCoords = null;
  if (focusedConvoy) {
    const convoyKey = focusedConvoy.convoyId || focusedConvoy.id;
    const rData = convoyRoutes[convoyKey];
    if (rData && rData.polyline && rData.polyline.length > 0) {
      const stepIdx = convoyStepIndices[convoyKey] || 0;
      focusedTruckCoords = rData.polyline[stepIdx] || rData.polyline[0];
    } else if (focusedConvoy.latitude || focusedConvoy.currentLatitude) {
      focusedTruckCoords = [
        focusedConvoy.latitude || focusedConvoy.currentLatitude,
        focusedConvoy.longitude || focusedConvoy.currentLongitude
      ];
    }
  }

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden bg-[#081328] border border-[#14294a] shadow-2xl">
      {/* Floating Active Convoy Navigation HUD (Top-Left) */}
      {focusedConvoy && (
        <div className="absolute top-3 left-3 z-[500] bg-[#061024]/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-sky-500/40 text-xs shadow-2xl flex items-center space-x-3.5 pointer-events-auto animate-in fade-in duration-200">
          <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-xs">{focusedConvoy.vehicleNumber}</span>
              <span className="px-1.5 py-0.2 rounded font-bold text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                {focusedConvoy.commodityType}
              </span>
              <span className="text-slate-400 text-[10px]">({focusedConvoy.driverName || 'Lead Driver'})</span>
            </div>
            <div className="text-sky-300 font-semibold text-[11px] mt-0.5 flex items-center gap-1.5">
              <span>🛣️ {focusedConvoy.originCity} → {focusedConvoy.destinationCity}</span>
              <span className="text-slate-400 font-normal">|</span>
              <span className="text-emerald-400 font-bold">{focusedConvoy.speedKmh || 52} km/h</span>
              <span className="text-slate-400 font-normal">|</span>
              <span className="text-cyan-300 font-bold">{focusedConvoy.temperatureCelsius || 4.0}°C</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Re-Center Button when user manually dragged map away */}
      {!isAutoFollowing && focusedTruckCoords && focusedConvoy && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
          <button
            onClick={() => {
              setIsAutoFollowing(true);
            }}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#061024]/95 hover:bg-sky-950/80 text-sky-300 hover:text-white font-bold text-xs shadow-2xl border border-sky-500/50 hover:border-sky-400 transition backdrop-blur-md"
          >
            <span>🎯</span>
            <span>Re-center on Vehicle ({focusedConvoy.vehicleNumber})</span>
          </button>
        </div>
      )}

      {/* Map Layer Switcher & Traffic Toggle (Top-Right) */}
      <div className="absolute top-3 right-3 z-[500] flex space-x-1.5 bg-[#061024]/90 backdrop-blur-md p-1.5 rounded-xl border border-[#14294a] pointer-events-auto shadow-xl">
        <button
          onClick={() => setShowTraffic(!showTraffic)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 border ${showTraffic
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
              : 'bg-transparent text-slate-400 border-transparent hover:text-white'
            }`}
          title="Toggle Real-Time Corridor Traffic Flow Layer"
        >
          <span className={showTraffic ? 'animate-pulse' : ''}>🚦</span>
          <span>Live Traffic {showTraffic ? 'ON' : 'OFF'}</span>
        </button>

        <div className="w-[1px] bg-[#14294a] my-1" />

        <button
          onClick={() => setMapLayer('osm')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${mapLayer === 'osm' ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
            }`}
        >
          <span>🗺️ Street</span>
        </button>
        <button
          onClick={() => setMapLayer('satellite')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${mapLayer === 'satellite' ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
            }`}
        >
          <span>🛰️ Satellite</span>
        </button>
        <button
          onClick={() => setMapLayer('topo')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${mapLayer === 'topo' ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
            }`}
        >
          <span>🏔️ Topo</span>
        </button>
      </div>

      <MapContainer
        center={center}
        zoom={7}
        minZoom={3}
        maxZoom={19}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <MapViewController
          center={center}
          zoom={7}
          selectedRoute={selectedRoute}
          customRouteCoords={activeRoutePolyline}
          originCoords={originCoords}
          destinationCoords={destinationCoords}
          focusedTruckCoords={focusedTruckCoords}
          isAutoFollowing={isAutoFollowing}
          onUserDrag={() => setIsAutoFollowing(false)}
          focusedConvoyId={selectedConvoyId}
          mapFocusTarget={mapFocusTarget}
        />
        <ZoomControl position="bottomleft" />

        <TileLayer
          key={mapLayer}
          url={tileUrls[mapLayer]}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | TomTom Live Traffic & OSRM Routing'
          maxZoom={19}
        />

        {/* TomTom Official Real-Time Satellite Traffic Flow Heatmap Overlay */}
        {showTraffic && (
          <TileLayer
            url="https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=6rZ5FVNhVl1RKi5TjGZTjw3CgqNxcAxK"
            opacity={0.75}
            maxZoom={19}
            zIndex={400}
          />
        )}

        {/* ON-DEMAND SELECTED ROUTE: Google Maps-Style Traffic-Coded Road Polyline (Only rendered when no convoy is currently active/focused to prevent duplicates) */}
        {!focusedConvoy && activeRoutePolyline && activeRoutePolyline.length > 1 && (() => {
          if (!showTraffic) {
            return (
              <Polyline
                positions={activeRoutePolyline}
                pathOptions={{
                  color: '#0284c7',
                  weight: 6,
                  opacity: 0.95,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              >
                <Tooltip sticky>
                  <div className="p-1.5 text-xs font-sans">
                    <strong className="text-sky-800 font-bold">✅ Universal AI Route:</strong>
                    <p className="text-slate-700 font-semibold mt-0.5">{originLabel} → {destinationLabel}</p>
                    <p className="text-slate-500 text-[11px]">Exact OpenStreetMap asphalt path</p>
                  </div>
                </Tooltip>
              </Polyline>
            );
          }

          // Helper: Find closest hazard distance to a coordinate
          const getTrafficStatusAtCoord = (lat, lng) => {
            for (const hazard of roadSegments) {
              const hLat = hazard.latitude || 25.4526;
              const hLng = hazard.longitude || 92.2037;
              const dist = Math.sqrt(Math.pow(lat - hLat, 2) + Math.pow(lng - hLng, 2));

              // If near a known hazard / high congestion zone (~18km radius)
              if (dist < 0.18) {
                if (hazard.currentStatus === 'BLOCKED' || hazard.currentRiskScore > 0.7) {
                  return { color: '#ef4444', label: '🔴 Heavy Congestion / Hazard (15 km/h)', level: 'HEAVY' };
                }
                return { color: '#f59e0b', label: '🟡 Moderate Traffic Delay (32 km/h)', level: 'MODERATE' };
              }
            }
            return { color: '#10b981', label: '🟢 Free Flowing Traffic (55 km/h)', level: 'FREE' };
          };

          // Split route into color-coded traffic chunks
          const chunks = [];
          let currentChunk = [activeRoutePolyline[0]];
          let currentStatus = getTrafficStatusAtCoord(activeRoutePolyline[0][0], activeRoutePolyline[0][1]);

          for (let i = 1; i < activeRoutePolyline.length; i++) {
            const pt = activeRoutePolyline[i];
            const status = getTrafficStatusAtCoord(pt[0], pt[1]);

            if (status.level === currentStatus.level) {
              currentChunk.push(pt);
            } else {
              currentChunk.push(pt); // overlap 1 point for seamless polyline join
              chunks.push({ points: currentChunk, status: currentStatus });
              currentChunk = [pt];
              currentStatus = status;
            }
          }
          if (currentChunk.length > 0) {
            chunks.push({ points: currentChunk, status: currentStatus });
          }

          return (
            <>
              {/* Route Base Dark Casing (Like Google Maps) */}
              <Polyline
                positions={activeRoutePolyline}
                pathOptions={{
                  color: '#082f49',
                  weight: 8,
                  opacity: 0.85,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />

              {/* Traffic Color-Coded Segments */}
              {chunks.map((chunk, idx) => (
                <Polyline
                  key={`traffic-seg-${idx}`}
                  positions={chunk.points}
                  pathOptions={{
                    color: chunk.status.color,
                    weight: 5,
                    opacity: 0.95,
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                >
                  <Tooltip sticky>
                    <div className="p-1.5 text-xs font-sans">
                      <strong className="text-slate-900 font-bold">{chunk.status.label}</strong>
                      <p className="text-slate-600 mt-0.5">{originLabel} → {destinationLabel}</p>
                      <p className="text-slate-400 text-[10px]">Real-time TomTom & OSRM speed tracking</p>
                    </div>
                  </Tooltip>
                </Polyline>
              ))}
            </>
          );
        })()}

        {/* Origin Pin */}
        {originCoords && (
          <Marker position={originCoords} icon={createCustomIcon('#10b981', 'START')}>
            <Popup>
              <div className="p-1 text-xs font-sans">
                <strong className="text-emerald-800">🟢 Start Point:</strong>
                <p className="text-slate-800 font-bold mt-0.5">{originLabel}</p>
                <p className="text-slate-500 text-[11px]">{originCoords[0].toFixed(4)}°N, {originCoords[1].toFixed(4)}°E</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Pin */}
        {destinationCoords && (
          <Marker position={destinationCoords} icon={createCustomIcon('#38bdf8', 'END')}>
            <Popup>
              <div className="p-1 text-xs font-sans">
                <strong className="text-sky-800">🏁 Destination:</strong>
                <p className="text-slate-800 font-bold mt-0.5">{destinationLabel}</p>
                <p className="text-slate-500 text-[11px]">{destinationCoords[0].toFixed(4)}°N, {destinationCoords[1].toFixed(4)}°E</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Inland Ports (Only displayed when viewing an active Brahmaputra Waterway route) */}
        {selectedRoute?.strategyType === 'WATERWAY_NW2' && (
          <>
            <Marker position={[26.1782, 91.6883]} icon={createCustomIcon('#06b6d4', 'PORT')}>
              <Popup>
                <div className="p-2 text-xs font-sans">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1">
                    <span>⚓</span> Pandu River Port (Guwahati)
                  </h4>
                  <p className="text-slate-600 mt-1">National Waterway-2 Inland Waterways Terminal</p>
                  <p className="text-emerald-700 font-semibold mt-0.5">Status: Operational for River Barges</p>
                </div>
              </Popup>
            </Marker>

            <Marker position={[26.0205, 89.9744]} icon={createCustomIcon('#06b6d4', 'PORT')}>
              <Popup>
                <div className="p-2 text-xs font-sans">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1">
                    <span>⚓</span> Dhubri River Port
                  </h4>
                  <p className="text-slate-600 mt-1">Western NER Waterway Terminal</p>
                  <p className="text-emerald-700 font-semibold mt-0.5">Status: Open</p>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* Render Glowing Traffic-Segmented Road Polyline & Pins for the Selected/Focused Convoy */}
        {selectedConvoyId && convoyRoutes[selectedConvoyId] && (() => {
          const rData = convoyRoutes[selectedConvoyId];
          const trafficChunks = getTrafficChunks(rData.polyline);

          return (
            <React.Fragment key={`focused-route-${selectedConvoyId}`}>
              {/* Elevated 3D Road Base Underlay */}
              <Polyline
                positions={rData.polyline}
                pathOptions={{
                  color: '#0369a1',
                  weight: 9,
                  opacity: 0.85,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />

              {/* Real-Time Traffic Color-Coded Segments (Green, Amber, Red) */}
              {trafficChunks.map((chunk, idx) => (
                <Polyline
                  key={`convoy-${selectedConvoyId}-chunk-${idx}`}
                  positions={chunk.points}
                  pathOptions={{
                    color: chunk.status.color,
                    weight: 5,
                    opacity: 0.95,
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                >
                  <Tooltip sticky>
                    <div className="p-1.5 text-xs font-sans">
                      <strong className="text-emerald-700 font-bold">🚚 Active Convoy Corridor</strong>
                      <p className="text-slate-800 font-bold">{rData.originCity} → {rData.destinationCity}</p>
                      <p className="text-slate-600 text-[10px]">Vehicle: {rData.vehicleNumber}</p>
                      <p className="text-slate-500 text-[10px] font-semibold mt-0.5">{chunk.status.label}</p>
                    </div>
                  </Tooltip>
                </Polyline>
              ))}

              {/* Start Origin Hub Pin */}
              {rData.startCoords && (
                <Marker position={rData.startCoords} icon={createCustomIcon('#10b981', 'START')}>
                  <Popup>
                    <div className="p-1.5 text-xs font-sans">
                      <strong className="text-emerald-800 font-bold">🟢 Origin Hub:</strong>
                      <p className="text-slate-800 font-bold mt-0.5">{rData.originCity}</p>
                      <p className="text-slate-500 text-[10px]">Assigned Vehicle: {rData.vehicleNumber}</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Destination Hub Pin */}
              {rData.endCoords && (
                <Marker position={rData.endCoords} icon={createCustomIcon('#38bdf8', 'END')}>
                  <Popup>
                    <div className="p-1.5 text-xs font-sans">
                      <strong className="text-sky-800 font-bold">🏁 Destination Hub:</strong>
                      <p className="text-slate-800 font-bold mt-0.5">{rData.destinationCity}</p>
                      <p className="text-slate-500 text-[10px]">Assigned Vehicle: {rData.vehicleNumber}</p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </React.Fragment>
          );
        })()}

        {/* Live Moving Truck Marker for the Focused Convoy */}
        {focusedConvoy && (() => {
          const convoyKey = focusedConvoy.convoyId || focusedConvoy.id;
          const rData = convoyRoutes[convoyKey];
          let lat, lng;

          if (rData && rData.polyline && rData.polyline.length > 0) {
            const stepIdx = convoyStepIndices[convoyKey] || 0;
            const roadPoint = rData.polyline[stepIdx] || rData.polyline[0];
            lat = roadPoint[0];
            lng = roadPoint[1];
          } else {
            lat = focusedConvoy.latitude || focusedConvoy.currentLatitude || 26.14;
            lng = focusedConvoy.longitude || focusedConvoy.currentLongitude || 91.73;
          }

          const isMeds = focusedConvoy.commodityType === 'MEDICINES';
          const iconColor = isMeds ? '#10b981' : '#f59e0b';

          return (
            <Marker
              key={convoyKey}
              position={[lat, lng]}
              icon={createCustomIcon(iconColor, 'TRUCK')}
            >
              <Popup>
                <div className="p-2 text-xs font-sans min-w-[200px]">
                  <div className="flex justify-between items-center border-b pb-1 mb-1">
                    <strong className="text-slate-900">{focusedConvoy.vehicleNumber}</strong>
                    <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${isMeds ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {focusedConvoy.commodityType}
                    </span>
                  </div>
                  <p className="text-slate-700"><strong>Driver:</strong> {focusedConvoy.driverName || 'Lead Driver'}</p>
                  <p className="text-slate-700"><strong>Route:</strong> {focusedConvoy.originCity} → {focusedConvoy.destinationCity}</p>
                  <p className="text-slate-700"><strong>Speed:</strong> {focusedConvoy.speedKmh || 45} km/h</p>
                  <p className="text-slate-700">
                    <strong>Cold-Chain Temp:</strong> <span className="font-bold text-emerald-700">{focusedConvoy.temperatureCelsius}°C</span>
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })()}

        {/* Real-time Field Hazard Markers (Landslides, Floods, Blockages) */}
        {incidents && incidents.filter((inc) => inc.verificationStatus !== 'RESOLVED' && inc.verificationStatus !== 'REJECTED').map((inc) => {
          const lat = Number(inc.latitude);
          const lng = Number(inc.longitude);
          if (isNaN(lat) || isNaN(lng)) return null;

          const isCritical = inc.severity === 'CRITICAL';
          const isVerified = inc.verificationStatus === 'VERIFIED';

          const hazardIcon = L.divIcon({
            className: 'custom-hazard-marker',
            html: `
              <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px;">
                <div style="position: absolute; inset: 0; border-radius: 9999px; background: ${isCritical ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)'}; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                <div style="width: 28px; height: 28px; border-radius: 9999px; background: ${isCritical ? '#7f1d1d' : '#78350f'}; border: 2px solid ${isCritical ? '#ef4444' : '#f59e0b'}; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.8); z-index: 10;">
                  ⚠️
                </div>
              </div>
            `,
            iconSize: [34, 34],
            iconAnchor: [17, 17],
            popupAnchor: [0, -17],
          });

          return (
            <Marker key={inc.id || `${lat}-${lng}`} position={[lat, lng]} icon={hazardIcon}>
              <Popup>
                <div className="p-2 text-xs font-sans min-w-[220px] max-w-[280px]">
                  <div className="flex justify-between items-center border-b pb-1 mb-1.5">
                    <strong className="text-rose-700 font-bold flex items-center gap-1">
                      <span>⚠️</span> {inc.incidentType || 'ROAD HAZARD'}
                    </strong>
                    <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] uppercase ${isCritical ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                      {inc.severity}
                    </span>
                  </div>

                  <p className="text-slate-800 font-semibold mb-1">
                    {inc.roadSegmentName || 'Corridor Coordinate'}
                  </p>

                  <p className="text-slate-600 text-[11px] mb-1.5 leading-relaxed">
                    {inc.description || 'Ground hazard reported. Transit delay expected.'}
                  </p>

                  {inc.photoUrl && (
                    <div className="my-1.5 rounded-lg overflow-hidden border border-slate-300 max-h-32">
                      <img src={inc.photoUrl} alt="Ground proof" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="pt-1.5 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500">
                    <span>{isVerified ? '🛡️ Verified' : '⏳ Pending Review'}</span>
                    <span className="font-mono">{lat.toFixed(3)}°N, {lng.toFixed(3)}°E</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Active Route Traffic Condition Bar (Bottom-Left) */}
      {showTraffic && activeRoutePolyline && activeRoutePolyline.length > 0 && (
        <div className="absolute bottom-4 left-4 z-[500] bg-[#061024]/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-[#14294a] text-xs shadow-2xl flex items-center space-x-3 pointer-events-auto animate-in fade-in duration-200">
          <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
            <span>🚦</span>
            <span>Live Route Traffic:</span>
          </span>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-emerald-400 font-semibold text-[11px]">Fast</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-amber-400 font-semibold text-[11px]">Moderate</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span className="text-rose-400 font-semibold text-[11px]">Hazard / Heavy</span>
          </div>
        </div>
      )}

      {/* Collapsible Map Legend */}
      <div className="absolute bottom-4 right-4 z-[500] pointer-events-auto">
        {isLegendOpen ? (
          <div className="bg-[#061024]/95 backdrop-blur-md p-3.5 rounded-2xl border border-[#14294a] text-xs space-y-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150 min-w-[220px]">
            <div className="flex justify-between items-center pb-1.5 border-b border-[#14294a]">
              <span className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-sky-400" />
                <span>Map Legend</span>
              </span>
              <button
                onClick={() => setIsLegendOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 pt-0.5">
              {activeRoutePolyline && (
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-1.5 rounded bg-emerald-500"></span>
                  <span className="text-emerald-300 font-bold">OSRM Real Highway Line</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <span className="w-3 h-1.5 rounded bg-rose-500"></span>
                <span className="text-slate-300">Hazard / Blockage</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-1.5 rounded bg-cyan-500"></span>
                <span className="text-slate-300">Waterway Port</span>
              </div>
              <div className="flex items-center space-x-2 pt-1.5 border-t border-[#14294a]">
                <span className="text-sky-400 font-bold">🚚 Dispatched Fleet ({convoys.length})</span>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsLegendOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#061024]/90 backdrop-blur-md border border-[#14294a] text-xs font-bold text-slate-200 hover:text-white hover:border-sky-400 shadow-xl transition"
          >
            <Info className="w-4 h-4 text-sky-400" />
            <span>Map Legend</span>
          </button>
        )}
      </div>
    </div>
  );
}
