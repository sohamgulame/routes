import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, MapPin, Camera, CheckCircle2, UploadCloud, ArrowRight, WifiOff, HardDrive, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { saveOfflineIncident } from '../services/indexedDb';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { searchLocations, reverseGeocode } from '../services/geocoding';

export default function FieldIncidentModal({ onClose, onIncidentAdded }) {
  const { currentUser, isFieldEngineer } = useAuth();
  const { toast } = useToast();
  const [incidentType, setIncidentType] = useState('LANDSLIDE');
  const [severity, setSeverity] = useState('CRITICAL');
  const [latitude, setLatitude] = useState(25.4526);
  const [longitude, setLongitude] = useState(92.2037);
  const [roadSegmentName, setRoadSegmentName] = useState('');
  const [isResolvingRoad, setIsResolvingRoad] = useState(false);
  const [description, setDescription] = useState('');
  const [photoBase64, setPhotoBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [submissionState, setSubmissionState] = useState(null); // null | 'ONLINE_SUCCESS' | 'OFFLINE_QUEUED'

  // Location Autocomplete State
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationRef = useRef(null);

  const detectLiveGps = () => {
    if (!('geolocation' in navigator)) {
      toast.warning('Geolocation is not supported by your browser.', 'GPS Unavailable');
      return;
    }

    setGpsDetecting(true);
    const successCallback = async (pos) => {
      if (pos.coords.latitude && pos.coords.longitude) {
        const liveLat = Math.round(pos.coords.latitude * 10000) / 10000;
        const liveLng = Math.round(pos.coords.longitude * 10000) / 10000;
        setLatitude(liveLat);
        setLongitude(liveLng);

        try {
          const detectedRoad = await reverseGeocode(liveLat, liveLng);
          if (detectedRoad) {
            setRoadSegmentName(detectedRoad);
            toast.success(`Live Road: ${detectedRoad} (${liveLat}°N, ${liveLng}°E)`, 'Location & Road Detected');
          } else {
            toast.success(`Live GPS acquired: ${liveLat}°N, ${liveLng}°E`, 'Location Detected');
          }
        } catch (e) {
          toast.success(`Live GPS acquired: ${liveLat}°N, ${liveLng}°E`, 'Location Detected');
        }
      }
      setGpsDetecting(false);
    };

    const errorCallback = (err) => {
      console.warn('High accuracy GPS failed, falling back to network triangulation:', err.message);
      // Fallback: standard network triangulation (enableHighAccuracy: false)
      navigator.geolocation.getCurrentPosition(
        successCallback,
        (fallbackErr) => {
          console.warn('Network geolocation unavailable:', fallbackErr.message);
          toast.info('Location permission was dismissed. Please enter coordinates or type location name.', 'GPS Notice');
          setGpsDetecting(false);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    };

    navigator.geolocation.getCurrentPosition(
      successCallback,
      errorCallback,
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  };

  useEffect(() => {
    detectLiveGps();
  }, []);

  // Automatic Road / Corridor Name Resolution when Latitude or Longitude changes
  useEffect(() => {
    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);

    if (!isNaN(latNum) && !isNaN(lngNum) && latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180) {
      setIsResolvingRoad(true);
      const timer = setTimeout(async () => {
        try {
          const resolvedRoad = await reverseGeocode(latNum, lngNum);
          if (resolvedRoad && !resolvedRoad.includes('°N')) {
            setRoadSegmentName(resolvedRoad);
          }
        } catch (e) {
          console.warn('Coordinate reverse-geocoding debounce error:', e);
        } finally {
          setIsResolvingRoad(false);
        }
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [latitude, longitude]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (locationRef.current && !locationRef.current.contains(e.target)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocationInputChange = async (val) => {
    setRoadSegmentName(val);
    if (val.trim().length >= 2) {
      try {
        const results = await searchLocations(val);
        setLocationSuggestions(results || []);
        setShowLocationDropdown(true);
      } catch (e) {
        setLocationSuggestions([]);
      }
    } else {
      setLocationSuggestions([]);
      setShowLocationDropdown(false);
    }
  };

  const handleSelectLocation = (loc) => {
    setRoadSegmentName(loc.name);
    setLatitude(Math.round(loc.lat * 10000) / 10000);
    setLongitude(Math.round(loc.lng * 10000) / 10000);
    setShowLocationDropdown(false);
    toast.info(`Snapped coordinates to ${loc.name} (${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)})`, 'Location Selected');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      incidentType,
      severity,
      latitude: Number(latitude),
      longitude: Number(longitude),
      roadSegmentName,
      description,
      isAutoVerified: isFieldEngineer,
      photoUrl: photoBase64,
      reporterRole: currentUser?.role || 'ROLE_CITIZEN',
      reporterName: currentUser?.fullName || currentUser?.username || 'Field User',
    };

    // Check if device is offline (Zero Connectivity Hill Zone)
    if (!navigator.onLine) {
      try {
        await saveOfflineIncident(payload);
        setSubmissionState('OFFLINE_QUEUED');
        toast.info('Zero connectivity detected. Hazard stored in offline queue and will auto-sync.', 'Offline Queued');
        setTimeout(() => {
          onIncidentAdded?.();
          onClose();
        }, 2200);
      } catch (err) {
        console.error('Error saving to IndexedDB:', err);
        toast.error('Failed to save offline incident to local database.', 'Storage Error');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Attempt Online API Transmission
    try {
      await api.reportIncident(payload);
      setSubmissionState('ONLINE_SUCCESS');
      toast.success(`Hazard [${incidentType}] transmitted and verified on GIS Control Tower!`, 'Hazard Published');
      setTimeout(() => {
        onIncidentAdded?.();
        onClose();
      }, 1400);
    } catch (err) {
      console.warn('Network transmission failed, falling back to offline IndexedDB queue:', err);
      try {
        await saveOfflineIncident(payload);
        setSubmissionState('OFFLINE_QUEUED');
        toast.info('Network failed. Saved to local offline database for auto-sync.', 'Offline Fallback');
        setTimeout(() => {
          onIncidentAdded?.();
          onClose();
        }, 2200);
      } catch (e) {
        toast.error('Failed to save offline incident report.', 'Error');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#0b162c] w-full max-w-lg p-6 sm:p-7 rounded-3xl border border-rose-900/50 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(244,63,94,0.15)] relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center space-x-3.5 mb-5">
          <div className="p-3 rounded-2xl bg-rose-950/60 text-rose-400 border border-rose-800/50 shadow-md">
            <ShieldAlert className="w-5 h-5 font-bold" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-display">Field Hazard & Road Blockage Report</h3>
            <p className="text-xs text-slate-400">PWD Engineers, Police & Crowdsourced Reporting (Offline-Capable PWA)</p>
          </div>
        </div>

        {submissionState === 'ONLINE_SUCCESS' ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="font-bold text-white text-base">Report Submitted & Live!</h4>
            <p className="text-xs text-slate-300">The highway risk graph and control tower have been updated in real-time.</p>
          </div>
        ) : submissionState === 'OFFLINE_QUEUED' ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
              <HardDrive className="w-6 h-6 animate-pulse" />
            </div>
            <h4 className="font-bold text-amber-400 text-base">Saved to Offline IndexedDB Queue!</h4>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              Zero cellular connectivity detected. Your report, coordinates, and photo are safely stored in browser offline memory and will <strong>auto-sync when connection returns</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Hazard Category</label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value)}
                  className="w-full bg-[#071326] border border-[#183158] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-400"
                >
                  <option value="LANDSLIDE">⚠️ Mountain Landslide</option>
                  <option value="ROCKFALL">🪨 Sudden Rockfall</option>
                  <option value="ROAD_CAVED_IN">💥 Road Cavity / Scour</option>
                  <option value="BRIDGE_SUBMERGED">🌊 Bridge Submerged / Flood</option>
                  <option value="TREE_FALL">🌲 Fallen Trees / High Wind</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Severity Level</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full bg-[#071326] border border-[#183158] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-400"
                >
                  <option value="CRITICAL">🔴 CRITICAL (Complete Blockage)</option>
                  <option value="HIGH">🟠 HIGH (One-Way Restricted)</option>
                  <option value="MODERATE">🟡 MODERATE (Caution Required)</option>
                </select>
              </div>
            </div>

            {/* Corridor / Mountain Pass Location Search */}
            <div className="relative" ref={locationRef}>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-slate-300 font-semibold">Corridor / Location Name</label>
                {isResolvingRoad && (
                  <span className="text-[10px] text-teal-400 font-semibold flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    <span>Auto-resolving road...</span>
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                placeholder="Type highway pass or city (e.g. Shillong, Jowai, Guwahati, Pune)..."
                value={roadSegmentName}
                onChange={(e) => handleLocationInputChange(e.target.value)}
                onFocus={() => {
                  if (locationSuggestions.length > 0) setShowLocationDropdown(true);
                }}
                className="w-full bg-[#071326] border border-[#183158] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-400"
              />

              {showLocationDropdown && locationSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-[#09152a] border border-[#1b3a6b] rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                  {locationSuggestions.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectLocation(item)}
                      className="px-3 py-2 hover:bg-[#12284c] cursor-pointer text-slate-200 border-b border-[#14294a]/40 last:border-0 flex items-center justify-between"
                    >
                      <span className="font-semibold text-xs text-white">{item.name}</span>
                      <span className="text-[10px] text-teal-400 font-mono">
                        {item.lat.toFixed(2)}°, {item.lng.toFixed(2)}°
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Coordinates Section with Live GPS Detection */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-slate-300 font-semibold">Incident Coordinates</label>
                <button
                  type="button"
                  onClick={detectLiveGps}
                  disabled={gpsDetecting}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-sky-950/70 hover:bg-sky-900/80 text-sky-300 border border-sky-500/50 rounded-lg text-[11px] font-bold transition shadow-sm"
                >
                  <MapPin className={`w-3.5 h-3.5 text-sky-400 ${gpsDetecting ? 'animate-bounce' : ''}`} />
                  <span>{gpsDetecting ? 'Detecting GPS...' : '📍 Detect Live GPS Location'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1 font-mono">Latitude (°N)</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full bg-[#071326] border border-[#183158] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1 font-mono">Longitude (°E)</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full bg-[#071326] border border-[#183158] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Upload Ground Photo (Optional)</label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full bg-[#071326] border border-[#183158] rounded-xl p-2 text-slate-400 text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#14294a] file:text-teal-300 hover:file:bg-[#1d3d6e]"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">On-Ground Situation Details</label>
              <textarea
                rows="2"
                required
                placeholder="Describe the hazard, blockage extent, or weather conditions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#071326] border border-[#183158] rounded-xl p-3 text-white focus:outline-none focus:border-teal-400 resize-none"
              />
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
                className="px-6 py-2.5 bg-gradient-to-r from-rose-500 via-rose-600 to-red-600 hover:opacity-95 text-white font-bold rounded-xl shadow-lg shadow-rose-600/30 text-xs flex items-center space-x-2"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                <span>Transmit Report</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
