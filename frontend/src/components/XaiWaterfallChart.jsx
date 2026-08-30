import React from 'react';
import { CloudRain, Mountain, ShieldCheck, Activity, AlertTriangle, Layers, Sun } from 'lucide-react';

export default function XaiWaterfallChart({ isHillRoute = true, riskScore = 0.74, strategyType = 'FASTEST', activeHazard = null }) {
  const isBypass = strategyType === 'RESILIENT_BYPASS';
  const isWaterway = strategyType === 'WATERWAY_NW2';
  const isSafeRoute = riskScore <= 0.35;

  let factors = [];

  if (activeHazard) {
    // Dynamic Real-World Hazard Incident Factor Attribution (e.g. Landslide at Baramati / Jowai)
    factors = [
      {
        name: `Active On-Ground ${activeHazard.incidentType || 'Hazard'} Blockage (${activeHazard.roadSegmentName || 'Corridor Coordinate'})`,
        impact: +85,
        icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />,
        type: 'NEGATIVE',
        desc: activeHazard.description || 'Active road blockage verified by Central Command'
      },
      {
        name: 'Corridor Transit Stoppage & Congestion Delay',
        impact: +30,
        icon: <Activity className="w-3.5 h-3.5 text-rose-400" />,
        type: 'NEGATIVE',
        desc: 'Heavy vehicle queuing and clearance backlog'
      },
      {
        name: 'Disaster Relief & PWD Teams Dispatched',
        impact: -15,
        icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
        type: 'POSITIVE',
        desc: 'Clearance machinery deployed on ground'
      },
      {
        name: 'Engineered Road Foundation',
        impact: -8,
        icon: <Mountain className="w-3.5 h-3.5 text-teal-400" />,
        type: 'POSITIVE',
        desc: 'Underlying asphalt subgrade structure stable'
      },
    ];
  } else if (isBypass) {
    factors = [
      { name: 'Active Sector Blockage Bypassed', impact: -55, icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />, type: 'POSITIVE', desc: 'Diverts around active ground landslide / hazard sector' },
      { name: 'Valley Incline Stability (Low Slope < 8°)', impact: -30, icon: <Mountain className="w-3.5 h-3.5 text-teal-400" />, type: 'POSITIVE', desc: 'Avoids steep mountain failure planes' },
      { name: 'Satellite Rain Buffer (Flat Runoff)', impact: -20, icon: <CloudRain className="w-3.5 h-3.5 text-sky-400" />, type: 'POSITIVE', desc: 'Zero saturated mudslide exposure' },
      { name: 'Detour Distance Overhead (+12%)', impact: +15, icon: <Activity className="w-3.5 h-3.5 text-amber-400" />, type: 'NEGATIVE', desc: 'Additional transit buffer' },
    ];
  } else if (isWaterway) {
    factors = [
      { name: 'Zero Mountain Landslide Risk', impact: -60, icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />, type: 'POSITIVE', desc: '100% Waterway river barge navigation' },
      { name: 'Heavy Freight Low-Carbon Transit', impact: -25, icon: <Layers className="w-3.5 h-3.5 text-cyan-400" />, type: 'POSITIVE', desc: '55% lower fuel emission footprint' },
      { name: 'Transit Speed Limitation (18 km/h)', impact: +35, icon: <Activity className="w-3.5 h-3.5 text-amber-400" />, type: 'NEGATIVE', desc: 'Longer transit hours vs asphalt' },
    ];
  } else if (isSafeRoute) {
    // Universal Safe / Plains Route Factor Decomposition (e.g. Karkamb -> Pandharpur)
    factors = [
      { name: 'Nominal Satellite Weather (Dry / Low Rain < 10mm)', impact: -35, icon: <Sun className="w-3.5 h-3.5 text-emerald-400" />, type: 'POSITIVE', desc: 'Zero saturated slope softening risk' },
      { name: 'Gentle Plains Gradient (Flat Slope < 4°)', impact: -28, icon: <Mountain className="w-3.5 h-3.5 text-teal-400" />, type: 'POSITIVE', desc: 'Minimal gravitational sheer stress on roadway' },
      { name: 'Engineered Multi-Lane Asphalt Quality', impact: -20, icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />, type: 'POSITIVE', desc: 'Reinforced road bed with stable drainage' },
      { name: 'Local Intersection & Junction Flow', impact: +12, icon: <Activity className="w-3.5 h-3.5 text-amber-400" />, type: 'NEGATIVE', desc: 'Minor intersection crossing buffer' },
    ];
  } else {
    // High-Hazard Mountain Terrain Factor Decomposition (e.g. Jowai Pass, NH-06)
    factors = [
      { name: 'Satellite Rain Saturation (48h Rain > 140mm)', impact: +42, icon: <CloudRain className="w-3.5 h-3.5 text-rose-400" />, type: 'NEGATIVE', desc: 'Active cloudburst triggers slope softening' },
      { name: 'Mountain Slope Angle (28.5° High Gradient)', impact: +28, icon: <Mountain className="w-3.5 h-3.5 text-rose-400" />, type: 'NEGATIVE', desc: 'High gravity sheer stress on mountain pass' },
      { name: 'Historical Washout Frequency (9 Events)', impact: +14, icon: <Activity className="w-3.5 h-3.5 text-amber-400" />, type: 'NEGATIVE', desc: 'Repetitive seasonal mudslide zone' },
      { name: '4-Lane Asphalt Road Quality', impact: -10, icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />, type: 'POSITIVE', desc: 'Reinforced culverts and retaining walls' },
    ];
  }

  return (
    <div className="p-4 rounded-xl bg-[#050c1a] border border-[#14294a] space-y-3.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-teal-400" />
          <span>Feature Attribution & Risk Weight Breakdown (SHAP Factors)</span>
        </span>
        <span className="text-[10px] text-teal-300 font-mono font-bold bg-teal-500/20 px-2 py-0.5 rounded-full">
          AI Model Confidence: 94.2%
        </span>
      </div>

      <div className="space-y-2.5">
        {factors.map((f, idx) => {
          const isPos = f.type === 'POSITIVE';
          const widthPercent = Math.min(Math.abs(f.impact) * 1.8, 100);

          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center space-x-2">
                  {f.icon}
                  <span className="font-semibold text-slate-200">{f.name}</span>
                </div>
                <span className={`font-mono font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {f.impact > 0 ? `+${f.impact}% Risk` : `${f.impact}% Risk`}
                </span>
              </div>

              {/* Visual Factor Bar */}
              <div className="w-full bg-[#071326] h-2 rounded-full overflow-hidden flex">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isPos ? 'bg-gradient-to-r from-teal-400 to-emerald-400' : 'bg-gradient-to-r from-amber-500 to-rose-500'
                  }`}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 pl-5.5">{f.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
