import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Info,
  ChevronDown,
  ChevronUp,
  Clock,
  Activity,
} from 'lucide-react';
import { HazeResponse } from '../types/weather';
import { formatTimeSGT } from '../utils/geo';

interface HazeSectionProps {
  hazeData: HazeResponse | null;
}

export const HazeSection: React.FC<HazeSectionProps> = ({ hazeData }) => {
  const [showSubIndices, setShowSubIndices] = useState(false);

  if (!hazeData) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 shadow-md">
        <Activity className="w-8 h-8 text-purple-500 dark:text-purple-400 animate-pulse mx-auto mb-2" />
        <p>Loading official Singapore PSI and air quality data...</p>
      </div>
    );
  }

  const { overallPsi, overallCategory, overallAdvisory, overallPm25, overallPm25Band, isHazy, hazeStatusText, regions, scales, updatedAt } = hazeData;

  const getPsiBg = (psi: number | null) => {
    if (!psi) return 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300';
    if (psi <= 50) return 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-200';
    if (psi <= 100) return 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-500/40 text-blue-900 dark:text-blue-200';
    if (psi <= 200) return 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-500/40 text-amber-900 dark:text-amber-200';
    if (psi <= 300) return 'bg-orange-50/70 dark:bg-orange-950/40 border-orange-200 dark:border-orange-500/40 text-orange-900 dark:text-orange-200';
    return 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-500/40 text-rose-900 dark:text-rose-200';
  };

  const getPsiBadge = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'good':
        return 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
      case 'moderate':
        return 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30';
      case 'unhealthy':
        return 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30';
      case 'very unhealthy':
        return 'bg-orange-500/10 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30';
      case 'hazardous':
        return 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600';
    }
  };

  return (
    <section id="haze-section" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <ShieldCheck className="w-5 h-5" />
            </span>
            Air quality across Singapore
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Official 24-hour Pollutant Standards Index (PSI) and 1-hour PM2.5 concentrations by region
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>Observed at {formatTimeSGT(updatedAt)} SGT</span>
        </div>
      </div>

      {/* Main Air Quality Status Banner */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all shadow-sm ${
          isHazy
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-500/40 text-amber-900 dark:text-amber-200'
            : 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
        }`}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`p-2.5 rounded-xl border mt-0.5 ${
              isHazy
                ? 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/40 text-amber-600 dark:text-amber-300'
                : 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
            }`}
          >
            {isHazy ? (
              <ShieldAlert className="w-6 h-6 text-amber-500 dark:text-amber-400" />
            ) : (
              <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Singapore Air Quality: {overallCategory.toUpperCase()}
              </h3>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getPsiBadge(overallCategory)}`}>
                PSI {overallPsi}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-1">
              {overallAdvisory} • 1-Hour PM2.5: <strong className="text-slate-900 dark:text-white font-bold">{overallPm25} µg/m³</strong> ({overallPm25Band})
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {hazeStatusText}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs shrink-0 bg-white/90 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Peak 24-Hr PSI</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">{overallPsi}</span>
          </div>
          <div className="w-px h-7 bg-slate-200 dark:bg-slate-800" />
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Peak 1-Hr PM2.5</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{overallPm25} <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">µg/m³</span></span>
          </div>
        </div>
      </div>

      {/* 5 Official Singapore Regions Grid */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center justify-between">
          <span>Official Regional Readings (5 Singapore Sectors)</span>
          <button
            onClick={() => setShowSubIndices(!showSubIndices)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 flex items-center gap-1 font-semibold cursor-pointer"
          >
            <span>{showSubIndices ? 'Hide' : 'Show'} Sub-Pollutants (PM10, O3, NO2, SO2, CO)</span>
            {showSubIndices ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {regions.map((region) => (
            <div
              key={region.id}
              className={`p-4 rounded-2xl border transition-all shadow-xs ${getPsiBg(region.psi)}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {region.name}
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                      {region.psi ?? '--'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">PSI</span>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getPsiBadge(region.psiCategory)}`}>
                  {region.psiCategory}
                </span>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/50 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">1-Hr PM2.5</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {region.pm25OneHourly ? `${region.pm25OneHourly} µg/m³` : '--'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Band</span>
                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold text-[11px]">
                    {region.pm25BandCode} ({region.pm25Band})
                  </span>
                </div>
              </div>

              {/* Sub-indices if toggled */}
              {showSubIndices && (
                <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/50 space-y-1 text-[10px] text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">24-Hr PM10</span>
                    <span className="font-mono font-semibold">{region.subIndices.pm10TwentyFourHourly ?? '--'} µg/m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">8-Hr Ozone (O3)</span>
                    <span className="font-mono font-semibold">{region.subIndices.o3EightHourMax ?? '--'} µg/m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">1-Hr NO2</span>
                    <span className="font-mono font-semibold">{region.subIndices.no2OneHourMax ?? '--'} µg/m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">24-Hr SO2</span>
                    <span className="font-mono font-semibold">{region.subIndices.so2TwentyFourHourly ?? '--'} µg/m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">8-Hr CO</span>
                    <span className="font-mono font-semibold">{region.subIndices.coEightHourMax ?? '--'} mg/m³</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Official NEA Scale Guides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PSI Scale */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-md text-xs transition-colors">
          <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            Official NEA 24-Hour PSI Scale
          </h4>
          <div className="space-y-1.5">
            {scales.psi.map((item) => (
              <div key={item.range} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{item.range}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${getPsiBadge(item.category)}`}>
                    {item.category}
                  </span>
                </div>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-[180px]">{item.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PM2.5 Scale */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-md text-xs transition-colors">
          <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            NEA 1-Hour PM2.5 Concentration Bands
          </h4>
          <div className="space-y-1.5">
            {scales.pm25.map((item) => (
              <div key={item.band} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">{item.band}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-300 font-bold">
                    {item.label}
                  </span>
                </div>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-[180px]">{item.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
