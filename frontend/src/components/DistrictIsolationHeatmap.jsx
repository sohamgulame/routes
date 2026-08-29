import React, { useState } from 'react';
import { 
  Building2, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Filter, 
  Activity, 
  MapPin, 
  Layers,
  FileText
} from 'lucide-react';
import { api } from '../services/api';

const NER_STATES = ['ALL', 'Assam', 'Meghalaya', 'Nagaland', 'Sikkim', 'Arunachal Pradesh', 'Manipur', 'Mizoram', 'Tripura'];

export default function DistrictIsolationHeatmap({ districts = [] }) {
  const [selectedState, setSelectedState] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Fallback enriched data if backend has base seeds
  const enrichedDistricts = districts.length > 0 ? districts : [
    { id: 'dist-guwahati', name: 'Kamrup Metropolitan (Guwahati)', state: 'Assam', connectivityStatus: 'NORMAL', criticalityScore: 0.05, hqLatitude: 26.1445, hqLongitude: 91.7362 },
    { id: 'dist-shillong', name: 'East Khasi Hills (Shillong)', state: 'Meghalaya', connectivityStatus: 'NORMAL', criticalityScore: 0.15, hqLatitude: 25.5788, hqLongitude: 91.8933 },
    { id: 'dist-jowai', name: 'West Jaintia Hills (Jowai)', state: 'Meghalaya', connectivityStatus: 'ISOLATED', criticalityScore: 0.85, hqLatitude: 25.4526, hqLongitude: 92.2037 },
    { id: 'dist-silchar', name: 'Cachar (Silchar)', state: 'Assam', connectivityStatus: 'NORMAL', criticalityScore: 0.20, hqLatitude: 24.8333, hqLongitude: 92.7789 },
    { id: 'dist-dimapur', name: 'Dimapur', state: 'Nagaland', connectivityStatus: 'NORMAL', criticalityScore: 0.10, hqLatitude: 25.9068, hqLongitude: 93.7271 },
    { id: 'dist-kohima', name: 'Kohima', state: 'Nagaland', connectivityStatus: 'RESTRICTED', criticalityScore: 0.65, hqLatitude: 25.6751, hqLongitude: 94.1086 },
    { id: 'dist-imphal', name: 'Imphal West', state: 'Manipur', connectivityStatus: 'NORMAL', criticalityScore: 0.25, hqLatitude: 24.8170, hqLongitude: 93.9368 },
    { id: 'dist-agartala', name: 'West Tripura (Agartala)', state: 'Tripura', connectivityStatus: 'NORMAL', criticalityScore: 0.10, hqLatitude: 23.8315, hqLongitude: 91.2868 },
    { id: 'dist-gangtok', name: 'East Sikkim (Gangtok)', state: 'Sikkim', connectivityStatus: 'RESTRICTED', criticalityScore: 0.60, hqLatitude: 27.3389, hqLongitude: 88.6065 },
    { id: 'dist-itangar', name: 'Papum Pare (Itanagar)', state: 'Arunachal Pradesh', connectivityStatus: 'NORMAL', criticalityScore: 0.30, hqLatitude: 27.0844, hqLongitude: 93.6053 },
  ];

  const filteredDistricts = enrichedDistricts.filter((d) => {
    const matchesState = selectedState === 'ALL' || d.state === selectedState;
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.state.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesState && matchesSearch;
  });

  const isolatedCount = enrichedDistricts.filter(d => d.connectivityStatus === 'ISOLATED').length;
  const restrictedCount = enrichedDistricts.filter(d => d.connectivityStatus === 'RESTRICTED').length;
  const normalCount = enrichedDistricts.filter(d => d.connectivityStatus === 'NORMAL' || !d.connectivityStatus).length;

  const handleDownloadSitRep = () => {
    window.open(api.downloadSitRepPdf(), '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Executive Header Card with Download Button */}
      <div className="glass-panel p-6 border border-[#14294a]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-400 to-blue-500 text-slate-950 shadow-md">
              <Building2 className="w-5 h-5 font-bold" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">District Connectivity & Isolation Heatmap</h2>
              <p className="text-xs text-slate-400">8 North-Eastern states real-time supply chain accessibility index & SitRep reporting</p>
            </div>
          </div>

          <button
            onClick={handleDownloadSitRep}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-400 via-emerald-400 to-emerald-500 hover:opacity-95 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Download Daily SitRep PDF</span>
          </button>
        </div>

        {/* Aggregate Status Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-6">
          <div className="p-3.5 bg-[#050c1a] border border-[#14294a] rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Districts</span>
            <div className="text-xl font-bold text-white mt-0.5">{enrichedDistricts.length} Regions</div>
            <span className="text-[11px] text-sky-400 font-medium">100% GIS Synchronized</span>
          </div>

          <div className="p-3.5 bg-[#050c1a] border border-emerald-900/40 rounded-xl border-l-4 border-l-emerald-400">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Normal Connectivity</span>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">{normalCount} Districts</div>
            <span className="text-[11px] text-slate-400">High-speed transit open</span>
          </div>

          <div className="p-3.5 bg-[#050c1a] border border-amber-900/40 rounded-xl border-l-4 border-l-amber-400">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Restricted Access</span>
            <div className="text-xl font-bold text-amber-400 mt-0.5">{restrictedCount} Districts</div>
            <span className="text-[11px] text-slate-400">Single-lane / Heavy rain</span>
          </div>

          <div className="p-3.5 bg-[#050c1a] border border-rose-900/40 rounded-xl border-l-4 border-l-rose-500">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Isolated Regions</span>
            <div className="text-xl font-bold text-rose-400 mt-0.5">{isolatedCount} Critical</div>
            <span className="text-[11px] text-rose-300 font-medium">Bypass corridors active</span>
          </div>
        </div>

        {/* State & Status Filter Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-5 mt-5 border-t border-[#14294a]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 uppercase mr-1">Filter State:</span>
            {NER_STATES.map((st) => (
              <button
                key={st}
                onClick={() => setSelectedState(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedState === st
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-400 shadow-sm'
                    : 'bg-[#050c1a] text-slate-400 border border-[#14294a] hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Real-Time District Search Input */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search district or hub..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#050c1a] border border-[#14294a] focus:border-sky-400 text-xs text-white placeholder-slate-500 outline-none transition"
            />
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* District Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDistricts.map((dist) => {
          const isIsolated = dist.connectivityStatus === 'ISOLATED' || dist.criticalityScore >= 0.7;
          const isRestricted = dist.connectivityStatus === 'RESTRICTED' || (dist.criticalityScore >= 0.4 && dist.criticalityScore < 0.7);
          const scorePercent = Math.round((dist.criticalityScore || 0.15) * 100);

          return (
            <div
              key={dist.id}
              className={`p-5 rounded-2xl border transition-all duration-200 ${
                isIsolated
                  ? 'bg-[#18080d] border-rose-600/60 shadow-lg shadow-rose-900/20'
                  : isRestricted
                  ? 'bg-[#181206] border-amber-600/50'
                  : 'bg-[#081328] border-[#14294a] hover:border-slate-500'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white text-sm">{dist.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{dist.state}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  isIsolated
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : isRestricted
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {isIsolated ? '🔴 ISOLATED' : isRestricted ? '🟡 RESTRICTED' : '🟢 NORMAL'}
                </span>
              </div>

              {/* Vulnerability Criticality Progress Bar */}
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Vulnerability Index:</span>
                  <span className={`font-mono font-bold ${isIsolated ? 'text-rose-400' : isRestricted ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {scorePercent}%
                  </span>
                </div>
                <div className="w-full bg-[#050c1a] rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isIsolated ? 'bg-rose-500' : isRestricted ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${scorePercent}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#14294a] flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Coordinates:</span>
                <span className="text-slate-300">{dist.hqLatitude?.toFixed(2)}°N, {dist.hqLongitude?.toFixed(2)}°E</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
