import React, { useState } from 'react';
import { Truck, Thermometer, Download, Plus, Trash2, CheckCircle, AlertCircle, Navigation } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import CreateConvoyModal from './CreateConvoyModal';

export default function ConvoyTracker({ convoys = [], onConvoyAdded, onConvoyDeleted, onViewOnMap }) {
  const { isTransporter, isAdmin } = useAuth();
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleDownloadEwaybill = (convoyId) => {
    toast.info('Generating verified e-Waybill manifest PDF...', 'e-Waybill Export');
    window.open(api.downloadEwaybill(convoyId), '_blank');
  };

  const handleDeleteConvoy = async (convoyId, vehicleNumber) => {
    if (!window.confirm(`Are you sure you want to remove convoy [${vehicleNumber}] from the live tracking fleet?`)) {
      return;
    }

    setDeletingId(convoyId);
    try {
      await api.deleteConvoy(convoyId);
      toast.warning(`Convoy [${vehicleNumber}] removed from live fleet.`, 'Convoy Cancelled');
      onConvoyDeleted?.(convoyId);
    } catch (err) {
      console.error('Error deleting convoy:', err);
      toast.error('Failed to delete convoy. Transporter or Admin role required.', 'Authorization Error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCompleteTrip = async (convoyId) => {
    try {
      await api.completeConvoy(convoyId);
      toast.success('Convoy marked as successfully DELIVERED.', 'Trip Completed');
      onConvoyDeleted?.(convoyId);
    } catch (err) {
      console.error('Error completing convoy trip:', err);
      toast.error('Failed to update convoy delivery status.', 'Error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 border border-[#14294a]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              <Truck className="w-5 h-5 font-bold" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">Essential Fleet Telemetry</h2>
              <p className="text-xs text-slate-400">Real-time GPS coordinates, cold-chain sensor telemetry & verified e-Waybill manifests</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {(isTransporter || isAdmin) && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-400 via-emerald-400 to-emerald-500 hover:opacity-95 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Dispatch Convoy</span>
              </button>
            )}

            <span className="px-3 py-1.5 bg-[#050c1a] border border-[#14294a] text-emerald-400 text-xs font-bold font-mono rounded-xl shadow-inner">
              {convoys.length} LIVE
            </span>
          </div>
        </div>

        {convoys.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#050c1a] border border-[#14294a] flex items-center justify-center mx-auto text-emerald-400 shadow-xl">
              <Truck className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-white text-base">No Active Convoys In Transit</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              All essential commodities vehicles are currently at depots. Dispatch a new convoy to stream live GPS and cold-chain telemetry.
            </p>
            {(isTransporter || isAdmin) && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 mt-2 rounded-xl bg-[#0f2347] hover:bg-[#153266] text-teal-300 border border-[#234b82] font-semibold text-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Dispatch First Convoy</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#14294a] text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3 px-3">Vehicle</th>
                  <th className="pb-3 px-3">Cargo Type</th>
                  <th className="pb-3 px-3">Route Corridor</th>
                  <th className="pb-3 px-3">Live Coordinates</th>
                  <th className="pb-3 px-3">Cold-Chain</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#14294a]/60">
                {convoys.map((convoy) => {
                  const convoyId = convoy.id || convoy.convoyId;
                  const isMeds = convoy.commodityType === 'MEDICINES';
                  const isPerishable = convoy.commodityType === 'PERISHABLE_AGRI';
                  const isFuel = convoy.commodityType === 'FUEL';

                  const rawLat = Number(convoy.currentLatitude ?? convoy.latitude ?? 26.1445);
                  const rawLng = Number(convoy.currentLongitude ?? convoy.longitude ?? 91.7362);
                  const lat = !isNaN(rawLat) ? rawLat : 26.1445;
                  const lng = !isNaN(rawLng) ? rawLng : 91.7362;
                  const temp = Number(convoy.temperatureCelsius ?? 4.0);
                  const speed = Number(convoy.speedKmh ?? 48);

                  return (
                    <tr key={convoyId} className="hover:bg-[#0a1828]/60 transition">
                      <td className="py-4 px-3">
                        <div className="font-mono font-bold text-white text-xs">{convoy.vehicleNumber || 'VEH-000'}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">{convoy.driverName || 'Lead Driver'}</div>
                      </td>

                      <td className="py-4 px-3">
                        <span className={`px-2.5 py-0.5 rounded font-bold text-[10px] uppercase ${
                          isMeds 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : isPerishable
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : isFuel
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        }`}>
                          {convoy.commodityType || 'GENERAL'}
                        </span>
                      </td>

                      <td className="py-4 px-3">
                        <div className="text-slate-200 font-semibold">{convoy.originCity || 'Origin'} → {convoy.destinationCity || 'Destination'}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">{convoy.activeRouteSummary || 'NH Corridor'}</div>
                      </td>

                      <td className="py-4 px-3">
                        <div className="font-mono text-slate-300 text-xs">
                          {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
                        </div>
                        <div className="text-slate-400 text-[11px] mt-0.5">{!isNaN(speed) ? speed : 48} km/h</div>
                      </td>

                      <td className="py-4 px-3">
                        <div className="flex items-center space-x-1.5 font-mono">
                          <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                          <span className={(!isNaN(temp) && temp < 8.0) ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                            {!isNaN(temp) ? temp.toFixed(1) : '4.0'}°C
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-3">
                        <span className={`px-2.5 py-0.5 rounded font-bold text-[10px] uppercase ${
                          convoy.status === 'DELAYED'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                            : convoy.status === 'DELIVERED'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {convoy.status === 'DELAYED' ? '⚠️ DELAYED' : (convoy.status || 'IN_TRANSIT')}
                        </span>
                      </td>

                      <td className="py-4 px-3 text-right">
                        <div className="inline-flex items-center space-x-2">
                          <button
                            onClick={() => onViewOnMap?.(convoy)}
                            title="Focus & View on GIS Control Tower Map"
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-[#032742] hover:bg-[#0284c7] text-sky-300 hover:text-white rounded-lg text-xs font-semibold border border-sky-500/40 transition shadow-sm"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          <button
                            onClick={() => handleDownloadEwaybill(convoyId)}
                            title="Download e-Waybill Manifest PDF"
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-[#050c1a] hover:bg-[#0f2347] rounded-lg text-xs font-semibold text-slate-300 border border-[#14294a] transition shadow-sm"
                          >
                            <Download className="w-3.5 h-3.5 text-teal-400" />
                            <span>PDF</span>
                          </button>

                          {(isTransporter || isAdmin) && (
                            <>
                              <button
                                onClick={() => handleCompleteTrip(convoyId)}
                                title="Mark Convoy Delivery Complete"
                                className="p-1.5 bg-[#050c1a] hover:bg-emerald-950/60 rounded-lg text-emerald-400 border border-[#14294a] hover:border-emerald-500/40 transition shadow-sm"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteConvoy(convoyId, convoy.vehicleNumber)}
                                disabled={deletingId === convoyId}
                                title="Delete / Cancel Convoy"
                                className="p-1.5 bg-[#050c1a] hover:bg-rose-950/60 rounded-lg text-rose-400 border border-[#14294a] hover:border-rose-500/40 transition shadow-sm"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateConvoyModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onConvoyCreated={(newConvoy) => {
            onConvoyAdded?.(newConvoy);
          }}
        />
      )}
    </div>
  );
}
