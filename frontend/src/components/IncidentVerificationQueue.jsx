import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, Check, X, RefreshCw, MapPin, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function IncidentVerificationQueue({ onIncidentResolved }) {
  const { toast } = useToast();
  const [queueTab, setQueueTab] = useState('active_hazards'); // 'active_hazards' | 'pending'
  const [pendingIncidents, setPendingIncidents] = useState([]);
  const [recentHazards, setRecentHazards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(null);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const [pendingRes, recentRes] = await Promise.allSettled([
        api.getPendingIncidents(),
        api.getRecentIncidents(),
      ]);

      if (pendingRes.status === 'fulfilled' && Array.isArray(pendingRes.value.data)) {
        setPendingIncidents(pendingRes.value.data);
      }
      if (recentRes.status === 'fulfilled' && Array.isArray(recentRes.value.data)) {
        setRecentHazards(recentRes.value.data);
      }
    } catch (e) {
      console.error('Error fetching incident queues:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status) => {
    setActionInProgress(id);
    try {
      let notes = 'Updated by Disaster Management Officer.';
      if (status === 'VERIFIED') notes = 'Approved by Disaster Management Officer. Corridor marked BLOCKED on GIS Map.';
      if (status === 'REJECTED') notes = 'Dismissed upon field inspection.';
      if (status === 'RESOLVED') notes = 'Road debris cleared and corridor restored to OPEN transit by PWD crews.';

      // Optimistically update UI
      setRecentHazards((prev) =>
        prev.map((inc) => (inc.id === id ? { ...inc, verificationStatus: status } : inc))
      );
      setPendingIncidents((prev) => prev.filter((inc) => inc.id !== id));

      await api.verifyIncident(id, status, notes);

      if (status === 'RESOLVED') {
        toast.success('Road blockage cleared! Corridor restored to NORMAL transit.', 'Hazard Resolved');
      } else if (status === 'VERIFIED') {
        toast.warning('Hazard verified and published on GIS Control Tower map.', 'Hazard Approved');
      } else {
        toast.info('Hazard submission dismissed.', 'Report Rejected');
      }

      await fetchIncidents();
      onIncidentResolved?.();
    } catch (e) {
      console.error('Error updating incident status:', e);
      toast.error('Failed to update incident status. Ensure you have Officer permissions.', 'Action Failed');
      await fetchIncidents();
    } finally {
      setActionInProgress(null);
    }
  };

  const activeVerifiedHazards = (recentHazards || []).filter(
    (h) => h && (h.verificationStatus === 'VERIFIED' || h.verificationStatus === 'ACTIVE')
  );

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 border border-[#14294a]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-rose-950/50 text-rose-400 border border-rose-800/40">
              <ShieldCheck className="w-5 h-5 font-bold" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">Disaster Incident Verification & Clearance Queue</h2>
              <p className="text-xs text-slate-400">Review crowdsourced hazard reports and mark cleared mountain passes</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* View Switcher Tabs */}
            <div className="bg-[#050c1a] p-1 rounded-xl border border-[#14294a] flex space-x-1">
              <button
                onClick={() => setQueueTab('active_hazards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  queueTab === 'active_hazards'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Active Road Hazards ({activeVerifiedHazards.length})
              </button>
              <button
                onClick={() => setQueueTab('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  queueTab === 'pending'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Pending Citizen Queue ({pendingIncidents.length})
              </button>
            </div>

            <button
              onClick={fetchIncidents}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#050c1a] hover:bg-[#0a1828] text-xs font-semibold text-slate-300 border border-[#14294a] transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Active Verified Hazards (with Mark Cleared / Resolved button) */}
        {queueTab === 'active_hazards' && (
          <div>
            {activeVerifiedHazards.length === 0 ? (
              <div className="p-16 text-center text-slate-400 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
                </div>
                <h3 className="font-bold text-white text-base">No Active Road Disruptions</h3>
                <p className="text-xs text-slate-400">All regional highway transit corridors across the North Eastern Region are OPEN.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#14294a] text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="pb-3 px-3">Hazard Type</th>
                      <th className="pb-3 px-3">Corridor Location</th>
                      <th className="pb-3 px-3">Severity</th>
                      <th className="pb-3 px-3">Reporter & Verifier</th>
                      <th className="pb-3 px-3">On-Ground Details</th>
                      <th className="pb-3 px-3 text-right">Clearance Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#14294a]/60">
                    {activeVerifiedHazards.map((inc) => (
                      <tr key={inc.id} className="hover:bg-[#0a1828]/60 transition">
                        <td className="py-4 px-3">
                          <span className="font-bold text-rose-400 font-mono flex items-center gap-1.5">
                            <span>⚠️</span> {inc.incidentType || 'LANDSLIDE'}
                          </span>
                        </td>

                        <td className="py-4 px-3">
                          <div className="font-semibold text-slate-200">{inc.roadSegmentName || 'Corridor Coordinate'}</div>
                          <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                            {Number(inc.latitude || 25.45).toFixed(4)}°N, {Number(inc.longitude || 92.20).toFixed(4)}°E
                          </div>
                        </td>

                        <td className="py-4 px-3">
                          <span className={`px-2.5 py-0.5 rounded font-bold text-[10px] uppercase ${
                            inc.severity === 'CRITICAL' 
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse' 
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {inc.severity || 'CRITICAL'}
                          </span>
                        </td>

                        <td className="py-4 px-3">
                          <div className="text-white font-medium">{inc.reporterName || 'Admin / PWD Engineer'}</div>
                          <div className="text-emerald-400 text-[10px] font-semibold mt-0.5">🛡️ Active on GIS Map</div>
                        </td>

                        <td className="py-4 px-3 max-w-xs">
                          <p className="text-slate-300 truncate">{inc.description || 'Active road blockage reported.'}</p>
                          {inc.photoUrl && (
                            <span className="text-[10px] text-teal-400 font-semibold block mt-0.5">📷 Ground photo attached</span>
                          )}
                        </td>

                        <td className="py-4 px-3 text-right">
                          <button
                            onClick={() => handleAction(inc.id, 'RESOLVED')}
                            disabled={actionInProgress === inc.id}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 font-bold rounded-xl text-xs transition shadow-md"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Mark Cleared / Resolved</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Pending Citizen Review Submissions */}
        {queueTab === 'pending' && (
          <div>
            {pendingIncidents.length === 0 ? (
              <div className="p-16 text-center text-slate-400 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
                <h3 className="font-bold text-white text-base">All Submissions Reviewed</h3>
                <p className="text-xs text-slate-400">No pending crowd-sourced hazard submissions waiting in the database queue.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#14294a] text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="pb-3 px-3">Hazard Type</th>
                      <th className="pb-3 px-3">Location & Segment</th>
                      <th className="pb-3 px-3">Severity</th>
                      <th className="pb-3 px-3">Reporter</th>
                      <th className="pb-3 px-3">Ground Description</th>
                      <th className="pb-3 px-3 text-right">Officer Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#14294a]/60">
                    {pendingIncidents.map((inc) => {
                      const isCluster = inc.description && inc.description.includes('CROWD CLUSTER ALERT');
                      const cleanDesc = inc.description ? inc.description.replace(/\[🚨 CROWD CLUSTER ALERT:.*?\]/g, '').trim() : 'Ground hazard reported.';

                      return (
                        <tr key={inc.id} className={`transition ${isCluster ? 'bg-rose-950/30 border-l-4 border-l-rose-500 hover:bg-rose-950/40' : 'hover:bg-[#0a1828]/60'}`}>
                          <td className="py-4 px-3">
                            <span className="font-bold text-white font-mono flex items-center gap-1.5">
                              <span>⚠️</span> {inc.incidentType}
                            </span>
                            {isCluster && (
                              <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-600 text-white shadow-sm animate-pulse">
                                <span>🚨</span> 3+ Crowd Reports
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-3">
                            <div className="font-semibold text-slate-200">{inc.roadSegmentName || 'Corridor Coordinate'}</div>
                            <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                              {Number(inc.latitude || 25.45).toFixed(4)}°N, {Number(inc.longitude || 92.20).toFixed(4)}°E
                            </div>
                          </td>

                          <td className="py-4 px-3">
                            <span className={`px-2.5 py-0.5 rounded font-bold text-[10px] ${
                              inc.severity === 'CRITICAL' || isCluster
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {isCluster ? 'URGENT CLUSTER' : inc.severity}
                            </span>
                          </td>

                          <td className="py-4 px-3">
                            <div className="text-white font-medium">{inc.reporterName || 'Citizen Reporter'}</div>
                            <div className="text-slate-400 text-[10px] uppercase">{inc.reporterRole || 'PUBLIC'}</div>
                          </td>

                          <td className="py-4 px-3 max-w-xs">
                            <p className="text-slate-300 truncate" title={cleanDesc}>{cleanDesc}</p>
                            {inc.photoUrl && (
                              <a
                                href={inc.photoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-teal-400 hover:underline font-semibold flex items-center gap-1 mt-1"
                              >
                                <span>📷</span>
                                <span>View Ground Photo Proof</span>
                              </a>
                            )}
                          </td>

                          <td className="py-4 px-3 text-right space-x-2">
                            <button
                              onClick={() => handleAction(inc.id, 'VERIFIED')}
                              disabled={actionInProgress === inc.id}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 font-bold rounded-lg text-xs transition"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve & Block</span>
                            </button>
                            <button
                              onClick={() => handleAction(inc.id, 'REJECTED')}
                              disabled={actionInProgress === inc.id}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-[#050c1a] hover:bg-[#101f36] text-slate-400 hover:text-rose-400 border border-[#14294a] rounded-lg text-xs transition"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Dismiss</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
