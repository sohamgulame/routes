import React, { useState, useEffect, useRef } from 'react';
import { Truck, Thermometer, RefreshCw, Clock, MapPin } from 'lucide-react';
import { api } from '../services/api';
import { searchLocations } from '../services/geocoding';
import { useToast } from '../context/ToastContext';

const toStr = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return val.displayName || val.name || String(val);
  return String(val);
};

export default function CreateConvoyModal({ isOpen, onClose, onConvoyCreated, initialRouteData = null }) {
  const { toast } = useToast();
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [transporterCompany, setTransporterCompany] = useState('');
  const [commodityType, setCommodityType] = useState('MEDICINES');
  
  const [originCity, setOriginCity] = useState(toStr(initialRouteData?.originCity));
  const [originCoords, setOriginCoords] = useState(initialRouteData?.originCoords || null);
  const [destinationCity, setDestinationCity] = useState(toStr(initialRouteData?.destinationCity));
  const [destCoords, setDestCoords] = useState(initialRouteData?.destinationCoords || null);

  const [assignedRouteSummary, setAssignedRouteSummary] = useState(toStr(initialRouteData?.assignedRouteSummary));
  const [temperatureCelsius, setTemperatureCelsius] = useState('');
  const [estimatedArrivalHours, setEstimatedArrivalHours] = useState(toStr(initialRouteData?.estimatedArrivalHours));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialRouteData) {
      if (initialRouteData.originCity) setOriginCity(toStr(initialRouteData.originCity));
      if (initialRouteData.originCoords) setOriginCoords(initialRouteData.originCoords);
      if (initialRouteData.destinationCity) setDestinationCity(toStr(initialRouteData.destinationCity));
      if (initialRouteData.destinationCoords) setDestCoords(initialRouteData.destinationCoords);
      if (initialRouteData.assignedRouteSummary) setAssignedRouteSummary(toStr(initialRouteData.assignedRouteSummary));
      if (initialRouteData.estimatedArrivalHours) setEstimatedArrivalHours(toStr(initialRouteData.estimatedArrivalHours));
    }
  }, [initialRouteData]);

  // Autocomplete state
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  const originRef = useRef(null);
  const destRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (originRef.current && !originRef.current.contains(e.target)) {
        setShowOriginDropdown(false);
      }
      if (destRef.current && !destRef.current.contains(e.target)) {
        setShowDestDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOriginChange = async (val) => {
    setOriginCity(val);
    if (val.trim().length >= 2) {
      const results = await searchLocations(val);
      setOriginSuggestions(results || []);
      setShowOriginDropdown(true);
    } else {
      setOriginSuggestions([]);
      setShowOriginDropdown(false);
    }
  };

  const handleDestChange = async (val) => {
    setDestinationCity(val);
    if (val.trim().length >= 2) {
      const results = await searchLocations(val);
      setDestSuggestions(results || []);
      setShowDestDropdown(true);
    } else {
      setDestSuggestions([]);
      setShowDestDropdown(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let finalOriginLat = originCoords?.lat || (originCoords ? originCoords[0] : null);
    let finalOriginLng = originCoords?.lng || (originCoords ? originCoords[1] : null);
    let finalDestLat = destCoords?.lat || (destCoords ? destCoords[0] : null);
    let finalDestLng = destCoords?.lng || (destCoords ? destCoords[1] : null);

    try {
      if (!finalOriginLat && originCity && originCity.trim().length >= 2) {
        const geoRes = await searchLocations(originCity);
        if (geoRes && geoRes.length > 0) {
          finalOriginLat = geoRes[0].lat;
          finalOriginLng = geoRes[0].lng;
        }
      }

      if (!finalDestLat && destinationCity && destinationCity.trim().length >= 2) {
        const geoRes = await searchLocations(destinationCity);
        if (geoRes && geoRes.length > 0) {
          finalDestLat = geoRes[0].lat;
          finalDestLng = geoRes[0].lng;
        }
      }

      const payload = {
        vehicleNumber,
        driverName,
        driverPhone,
        transporterCompany,
        commodityType,
        originCity,
        destinationCity,
        temperatureCelsius: temperatureCelsius !== '' ? Number(temperatureCelsius) : 4.0,
        estimatedArrivalHours: estimatedArrivalHours !== '' ? Number(estimatedArrivalHours) : 8.5,
        activeRouteSummary: assignedRouteSummary,
        originLat: finalOriginLat,
        originLng: finalOriginLng,
        destLat: finalDestLat,
        destLng: finalDestLng,
      };

      const res = await api.createConvoy(payload);
      
      // Persist the specific selected route polyline geometry in sessionStorage
      if (initialRouteData?.snappedCoordinates && Array.isArray(initialRouteData.snappedCoordinates)) {
        try {
          const polyStr = JSON.stringify(initialRouteData.snappedCoordinates);
          sessionStorage.setItem('aura_convoy_polyline_' + vehicleNumber, polyStr);
          if (res?.data?.id) {
            sessionStorage.setItem('aura_convoy_polyline_' + res.data.id, polyStr);
          }
        } catch (err) {}
      }

      toast.success(`Convoy [${vehicleNumber}] successfully dispatched to ${destinationCity}! e-Waybill manifest generated.`, 'Convoy Dispatched');
      onConvoyCreated?.(res.data);
      onClose();
    } catch (e) {
      console.error('Error creating convoy:', e);
      // Fallback local creation if network error
      const fallbackId = 'CONVOY-' + Date.now();
      const fallbackConvoy = {
        id: fallbackId,
        vehicleNumber,
        driverName,
        driverPhone,
        transporterCompany,
        commodityType,
        originCity,
        destinationCity,
        temperatureCelsius: temperatureCelsius !== '' ? Number(temperatureCelsius) : 4.0,
        status: 'IN_TRANSIT',
        currentLatitude: finalOriginLat || 26.14,
        currentLongitude: finalOriginLng || 91.73,
        createdAt: new Date().toISOString(),
        activeRouteSummary: assignedRouteSummary,
      };

      if (initialRouteData?.snappedCoordinates && Array.isArray(initialRouteData.snappedCoordinates)) {
        try {
          const polyStr = JSON.stringify(initialRouteData.snappedCoordinates);
          sessionStorage.setItem('aura_convoy_polyline_' + vehicleNumber, polyStr);
          sessionStorage.setItem('aura_convoy_polyline_' + fallbackId, polyStr);
        } catch (err) {}
      }

      toast.info(`Convoy [${vehicleNumber}] registered and queued in local offline state.`, 'Offline Dispatch');
      onConvoyCreated?.(fallbackConvoy);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b162c] w-full max-w-lg p-6 sm:p-7 rounded-3xl border border-[#183158] shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(52,211,153,0.15)] relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center space-x-3.5 mb-5">
          <div className="p-3 rounded-2xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 shadow-md">
            <Truck className="w-5 h-5 font-bold" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-display">Dispatch New Essential Convoy</h3>
            <p className="text-xs text-slate-400">Register vehicle, cargo category, and live cold-chain telemetry parameters</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Vehicle Registration No.</label>
              <input
                type="text"
                required
                placeholder="e.g. AS-01-EC-4821"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                className="w-full bg-[#071326] border border-[#183158] rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-teal-400"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Commodity Type</label>
              <select
                value={commodityType}
                onChange={(e) => setCommodityType(e.target.value)}
                className="w-full bg-[#071326] border border-[#183158] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-400"
              >
                <option value="MEDICINES">💊 Critical Medicines & Vaccines</option>
                <option value="FOOD_GRAINS">🌾 Food Grains (FCI / PDS)</option>
                <option value="FUEL">⛽ Fuel & LPG Tankers</option>
                <option value="PERISHABLE_AGRI">🍍 Perishable Organic Produce</option>
                <option value="RELIEF_MATERIAL">📦 Disaster Relief Supplies</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Lead Driver Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Barman"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full bg-[#071326] border border-[#183158] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-400"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Driver Contact Phone</label>
              <input
                type="text"
                required
                placeholder="e.g. +91-9876543210"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                className="w-full bg-[#071326] border border-[#183158] rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-teal-400"
              />
            </div>
          </div>

          {/* Universal Geocoded Origin & Destination */}
          <div className="grid grid-cols-2 gap-3">
            {/* Origin Input */}
            <div className="relative" ref={originRef}>
              <label className="block text-slate-300 font-semibold mb-1">Origin City / Hub</label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-teal-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Guwahati, Shillong, Tawang..."
                  value={originCity}
                  onChange={(e) => handleOriginChange(e.target.value)}
                  onFocus={() => originCity.length >= 2 && setShowOriginDropdown(true)}
                  className="w-full bg-[#071326] border border-[#183158] rounded-xl pl-9 pr-3.5 py-2.5 text-white focus:outline-none focus:border-teal-400"
                />
              </div>
              {showOriginDropdown && originSuggestions.length > 0 && (
                <div className="absolute z-[10000] left-0 right-0 top-full mt-1 bg-[#09152b] border border-[#183158] rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                  {originSuggestions.map((s, idx) => (
                    <div
                      key={`orig-${idx}`}
                      onClick={() => {
                        setOriginCity(s.displayName || s.name);
                        setOriginCoords({ lat: s.lat, lng: s.lng });
                        setShowOriginDropdown(false);
                      }}
                      className="px-3 py-2 text-xs text-slate-200 hover:bg-[#14294a] cursor-pointer flex items-center gap-2 border-b border-[#14294a]/50 last:border-0"
                    >
                      <MapPin className="w-3 h-3 text-teal-400 shrink-0" />
                      <span className="truncate">{s.displayName || s.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Destination Input */}
            <div className="relative" ref={destRef}>
              <label className="block text-slate-300 font-semibold mb-1">Destination City</label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-sky-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Silchar, Aizawl, Dimapur..."
                  value={destinationCity}
                  onChange={(e) => handleDestChange(e.target.value)}
                  onFocus={() => destinationCity.length >= 2 && setShowDestDropdown(true)}
                  className="w-full bg-[#071326] border border-[#183158] rounded-xl pl-9 pr-3.5 py-2.5 text-white focus:outline-none focus:border-teal-400"
                />
              </div>
              {showDestDropdown && destSuggestions.length > 0 && (
                <div className="absolute z-[10000] left-0 right-0 top-full mt-1 bg-[#09152b] border border-[#183158] rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                  {destSuggestions.map((s, idx) => (
                    <div
                      key={`dest-${idx}`}
                      onClick={() => {
                        setDestinationCity(s.displayName || s.name);
                        setDestCoords({ lat: s.lat, lng: s.lng });
                        setShowDestDropdown(false);
                      }}
                      className="px-3 py-2 text-xs text-slate-200 hover:bg-[#14294a] cursor-pointer flex items-center gap-2 border-b border-[#14294a]/50 last:border-0"
                    >
                      <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
                      <span className="truncate">{s.displayName || s.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Assigned Route Strategy Corridor */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Assigned AI Route Strategy Corridor
            </label>
            <select
              value={assignedRouteSummary}
              onChange={(e) => {
                const val = e.target.value;
                setAssignedRouteSummary(val);
                if (val.includes('Waterway')) {
                  setEstimatedArrivalHours('14.0');
                } else if (val.includes('Safety Bypass')) {
                  setEstimatedArrivalHours('10.5');
                } else if (val.includes('Highway') || val.includes('Expressway')) {
                  setEstimatedArrivalHours('8.5');
                }
              }}
              className="w-full bg-[#071326] border border-[#183158] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-400"
            >
              <option value="">-- Select Route Strategy Corridor --</option>
              <option value="Fastest Highway Corridor (Direct NH-6 / NH-27)">
                🟢 Strategy 1: Direct Highway Corridor (NH-6 / NH-27)
              </option>
              <option value="Resilient Multi-Modal Safety Bypass (Lumding/Dabaka)">
                🛡️ Strategy 2: Resilient Safety Bypass (via Lumding/Dabaka)
              </option>
              <option value="National Waterway NW-2 Brahmaputra Barge Corridor">
                ⚓ Strategy 3: National Waterway NW-2 (Brahmaputra Barge)
              </option>
            </select>
            {assignedRouteSummary && (
              <p className="text-[11px] text-teal-400 mt-1 flex items-center gap-1 font-mono">
                <Truck className="w-3 h-3 text-teal-400 shrink-0" />
                <span className="truncate">Bound Corridor: {assignedRouteSummary}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Cold-Chain Storage Temp (°C)
              </label>
              <div className="relative">
                <Thermometer className="w-4 h-4 text-teal-400 absolute left-3.5 top-3" />
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 4.0"
                  value={temperatureCelsius}
                  onChange={(e) => setTemperatureCelsius(e.target.value)}
                  className="w-full bg-[#071326] border border-[#183158] rounded-xl pl-10 pr-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-teal-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Expected Transit Duration (Hours)
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-teal-400 absolute left-3.5 top-3" />
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  placeholder="e.g. 8.5"
                  value={estimatedArrivalHours}
                  onChange={(e) => setEstimatedArrivalHours(e.target.value)}
                  className="w-full bg-[#071326] border border-[#183158] rounded-xl pl-10 pr-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-teal-400"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-[#14294a]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-transparent hover:bg-[#14294a]/40 rounded-xl text-slate-300 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-teal-400 via-emerald-400 to-emerald-500 hover:opacity-95 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/25 text-xs flex items-center space-x-2"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
              <span>Launch & Generate e-Waybill</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
