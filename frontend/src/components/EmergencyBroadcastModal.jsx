import React, { useState } from 'react';
import { 
  Radio, 
  X, 
  MessageSquare, 
  Send, 
  ShieldAlert, 
  CheckCircle2, 
  PhoneCall, 
  Smartphone, 
  Sliders, 
  Flame,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';

const PRESET_HAZARD_ZONES = [
  {
    highwayCode: 'NH-06',
    location: 'Jowai Pass (Km 120-135)',
    type: 'LANDSLIDE',
    lat: 25.4526,
    lng: 92.2037,
    bypass: 'Dabaka-Lumding Valley Highway',
    defaultMsg: 'Active heavy mudslide reported. Highway impassable for multi-axle trucks. Divert immediately via Lumding.',
  },
  {
    highwayCode: 'NH-29',
    location: 'Chumukedima Rockfall Gorge',
    type: 'ROCKFALL',
    lat: 25.8150,
    lng: 93.7750,
    bypass: 'Piphema Foothills Bypass',
    defaultMsg: 'Boulders blocking left carriageway. 15 km holding zone enforced. High delay expected.',
  },
  {
    highwayCode: 'NH-10',
    location: 'Teesta Valley / 29th Mile',
    type: 'FLASH_FLOOD',
    lat: 26.9350,
    lng: 88.4550,
    bypass: 'Lava-Algarah Mountain Ridge',
    defaultMsg: 'Teesta river water level crossed critical bridge clearance. Heavy commercial vehicles halted.',
  },
];

export default function EmergencyBroadcastModal({ isOpen, onClose, onBroadcastSuccess }) {
  const [selectedZone, setSelectedZone] = useState(PRESET_HAZARD_ZONES[0]);
  const [message, setMessage] = useState(PRESET_HAZARD_ZONES[0].defaultMsg);
  const [radiusKm, setRadiusKm] = useState(50);
  const [bypass, setBypass] = useState(PRESET_HAZARD_ZONES[0].bypass);
  const [channels, setChannels] = useState(['SMS', 'WHATSAPP', 'PUSH']);
  const [loading, setLoading] = useState(false);
  const [dispatchResult, setDispatchResult] = useState(null);

  if (!isOpen) return null;

  const handleZoneChange = (zone) => {
    setSelectedZone(zone);
    setMessage(zone.defaultMsg);
    setBypass(zone.bypass);
  };

  const toggleChannel = (ch) => {
    setChannels((prev) => 
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (channels.length === 0) {
      alert('Please select at least one dispatch channel (SMS, WhatsApp, or Push).');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        highwayCode: selectedZone.highwayCode,
        hazardLocation: selectedZone.location,
        hazardType: selectedZone.type,
        message: message,
        recommendedBypass: bypass,
        targetRadiusKm: parseFloat(radiusKm),
        hazardLatitude: selectedZone.lat,
        hazardLongitude: selectedZone.lng,
        channels: channels,
      };

      const res = await api.broadcastAlert(payload);
      setDispatchResult(res.data);
      onBroadcastSuccess?.(res.data);
    } catch (err) {
      console.error('Error dispatching emergency broadcast:', err);
      alert('Failed to dispatch broadcast. Ensure you have Disaster Officer authorization.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#081328] border border-[#1b365d] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#14294a] bg-[#061024]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Multi-Channel Emergency Broadcast Engine</h3>
              <p className="text-xs text-slate-400">Geo-targeted SMS, WhatsApp & Push alerts for drivers within 50 km</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {dispatchResult ? (
          <div className="p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">Emergency Broadcast Successfully Dispatched!</h4>
            
            <div className="grid grid-cols-3 gap-3 text-left">
              <div className="p-3 bg-[#050c1a] border border-[#14294a] rounded-xl text-center">
                <div className="text-xl font-bold text-emerald-400">{dispatchResult.smsDeliveredCount}</div>
                <div className="text-[11px] text-slate-400 uppercase mt-0.5">SMS Delivered</div>
              </div>
              <div className="p-3 bg-[#050c1a] border border-[#14294a] rounded-xl text-center">
                <div className="text-xl font-bold text-teal-400">{dispatchResult.whatsappDeliveredCount}</div>
                <div className="text-[11px] text-slate-400 uppercase mt-0.5">WhatsApp Sent</div>
              </div>
              <div className="p-3 bg-[#050c1a] border border-[#14294a] rounded-xl text-center">
                <div className="text-xl font-bold text-sky-400">{dispatchResult.pushBroadcastCount}</div>
                <div className="text-[11px] text-slate-400 uppercase mt-0.5">Web Push Active</div>
              </div>
            </div>

            <div className="p-3 bg-[#050c1a] border border-[#14294a] rounded-xl text-left text-xs space-y-1">
              <div><strong className="text-slate-300">Broadcast ID:</strong> <span className="font-mono text-emerald-400">{dispatchResult.alertId}</span></div>
              <div><strong className="text-slate-300">Targeted Highway:</strong> {dispatchResult.highwayCode} ({dispatchResult.hazardType})</div>
              <div><strong className="text-slate-300">Recommended Detour:</strong> <span className="text-teal-300 font-semibold">{dispatchResult.recommendedBypass}</span></div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition mt-4"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleBroadcast} className="p-6 space-y-5">
            {/* 1. Hazard Zone Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                1. Select Target Hazard Corridor
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {PRESET_HAZARD_ZONES.map((zone) => (
                  <div
                    key={zone.highwayCode}
                    onClick={() => handleZoneChange(zone)}
                    className={`cursor-pointer p-3 rounded-xl border transition text-xs ${
                      selectedZone.highwayCode === zone.highwayCode
                        ? 'bg-[#0e2448] border-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                        : 'bg-[#050c1a] border-[#14294a] text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-rose-400">{zone.highwayCode}</span>
                      <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono">
                        {zone.type}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-slate-300 text-[11px]">{zone.location}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Dispatch Channels */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                2. Select Dispatch Channels
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div
                  onClick={() => toggleChannel('SMS')}
                  className={`cursor-pointer p-3 rounded-xl border transition text-xs flex items-center space-x-2.5 ${
                    channels.includes('SMS')
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-[#050c1a] border-[#14294a] text-slate-400'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div>SMS Gateway</div>
                    <div className="text-[10px] text-slate-400 font-normal">Feature phones</div>
                  </div>
                </div>

                <div
                  onClick={() => toggleChannel('WHATSAPP')}
                  className={`cursor-pointer p-3 rounded-xl border transition text-xs flex items-center space-x-2.5 ${
                    channels.includes('WHATSAPP')
                      ? 'bg-teal-950/40 border-teal-500 text-teal-300 font-bold'
                      : 'bg-[#050c1a] border-[#14294a] text-slate-400'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-teal-400" />
                  <div>
                    <div>WhatsApp Bot</div>
                    <div className="text-[10px] text-slate-400 font-normal">Fleet Drivers</div>
                  </div>
                </div>

                <div
                  onClick={() => toggleChannel('PUSH')}
                  className={`cursor-pointer p-3 rounded-xl border transition text-xs flex items-center space-x-2.5 ${
                    channels.includes('PUSH')
                      ? 'bg-sky-950/40 border-sky-500 text-sky-300 font-bold'
                      : 'bg-[#050c1a] border-[#14294a] text-slate-400'
                  }`}
                >
                  <Radio className="w-4 h-4 text-sky-400" />
                  <div>
                    <div>Web Push</div>
                    <div className="text-[10px] text-slate-400 font-normal">Command centers</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Geo-Targeted Radius Slider */}
            <div>
              <div className="flex justify-between items-center mb-1.5 text-xs">
                <span className="font-semibold text-slate-300 uppercase">3. Geo-Fenced Alert Radius:</span>
                <span className="font-mono font-bold text-teal-400">{radiusKm} km</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={radiusKm}
                onChange={(e) => setRadiusKm(e.target.value)}
                className="w-full h-1.5 bg-[#050c1a] rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>10 km (Local Hill)</span>
                <span>50 km (Standard Corridor)</span>
                <span>100 km (Inter-State)</span>
              </div>
            </div>

            {/* 4. Message & Bypass */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Advisory Message (Sent to Drivers)
                </label>
                <textarea
                  rows="2"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-[#050c1a] border border-[#14294a] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-teal-400 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Recommended Bypass Corridor
                </label>
                <input
                  type="text"
                  value={bypass}
                  onChange={(e) => setBypass(e.target.value)}
                  className="w-full bg-[#050c1a] border border-[#14294a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                />
              </div>
            </div>

            {/* Submit Dispatch Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/25 transition flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span>Dispatching Telephony Gateways...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Broadcast Emergency Alert to {radiusKm} km Radius</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
