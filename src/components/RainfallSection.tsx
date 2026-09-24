import React from 'react';
import {
  CloudRain,
  AlertCircle,
  ExternalLink,
  Droplets,
  MapPin,
  CheckCircle2,
  Clock,
  Radio,
} from 'lucide-react';
import { RainResponse } from '../types/weather';
import { formatTimeSGT } from '../utils/geo';

interface RainfallSectionProps {
  rainData: RainResponse | null;
  onFocusStation: (stationId: string) => void;
}

export const RainfallSection: React.FC<RainfallSectionProps> = ({
  rainData,
  onFocusStation,
}) => {
  if (!rainData) {
    return (
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-center text-slate-400">
        <Radio className="w-8 h-8 text-blue-400 animate-pulse mx-auto mb-2" />
        <p>Loading official Singapore rainfall observations...</p>
      </div>
    );
  }

  const { isRaining, rainingStationCount, totalStationCount, maxRainfall, stations, rainAreas, updatedAt } = rainData;

  // Filter stations with rain or sort by rainfall descending
  const sortedStations = [...stations].sort((a, b) => b.rainfall - a.rainfall);
  const activeStations = sortedStations.filter((s) => s.rainfall > 0);
  const displayStations = activeStations.length > 0 ? activeStations : sortedStations.slice(0, 8);

  // Micro areas forecasting rain
  const activeForecastAreas = rainAreas.filter((a) => a.isRainingNowOrExpected);

  return (
    <section id="rain-section" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <CloudRain className="w-5 h-5" />
            </span>
            Where is it raining?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time precipitation telemetry from {totalStationCount} official NEA rain gauge stations across Singapore
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Observed at {formatTimeSGT(updatedAt)} SGT</span>
        </div>
      </div>

      {/* Main Situation Banner */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
          isRaining && activeStations.length > 0
            ? 'bg-blue-950/40 border-blue-500/40 text-blue-200'
            : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
        }`}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`p-2.5 rounded-xl border mt-0.5 ${
              isRaining && activeStations.length > 0
                ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
            }`}
          >
            {isRaining && activeStations.length > 0 ? (
              <CloudRain className="w-6 h-6 animate-bounce" />
            ) : (
              <CheckCircle2 className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              {isRaining && activeStations.length > 0
                ? `Active Rainfall Detected (${activeStations.length} Station${activeStations.length > 1 ? 's' : ''})`
                : 'Dry Across Singapore'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              {isRaining && activeStations.length > 0
                ? `Precipitation recorded peaking at ${maxRainfall} mm/5-min (${(maxRainfall * 12).toFixed(1)} mm/h). Check active stations below.`
                : 'No significant rain recorded at any official NEA weather telemetry station in the last 5 minutes.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs shrink-0 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <div>
            <span className="text-slate-400 block text-[10px]">Raining Stations</span>
            <span className="text-base font-bold text-white">
              {rainingStationCount} / {totalStationCount}
            </span>
          </div>
          <div className="w-px h-7 bg-slate-800" />
          <div>
            <span className="text-slate-400 block text-[10px]">Peak 5-Min Rate</span>
            <span className="text-base font-bold text-blue-400">
              {maxRainfall} mm
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Intensity Scale & Stations Observation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Documented NEA/MSS Rainfall Classification */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Droplets className="w-4 h-4 text-blue-400" />
              NEA MSS Rainfall Intensity Scale
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Official thresholds defined by Meteorological Service Singapore (MSS) for 5-minute telemetry and hourly rain rates:
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span className="font-semibold text-white">No Significant Rain</span>
                </div>
                <span className="font-mono text-slate-300">0.0 mm/5m (0 mm/h)</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
                  <span className="font-semibold text-white">Light Rain</span>
                </div>
                <span className="font-mono text-cyan-300">&le; 0.2 mm/5m (&lt; 2.5 mm/h)</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  <span className="font-semibold text-white">Moderate Rain</span>
                </div>
                <span className="font-mono text-blue-300">0.3 - 0.8 mm/5m (2.5 - 10 mm/h)</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-pink-500"></span>
                  <span className="font-semibold text-white">Heavy Rain</span>
                </div>
                <span className="font-mono text-pink-300">&gt; 0.8 mm/5m (&gt; 10 mm/h)</span>
              </div>
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-blue-950/20 border border-blue-800/30 text-[11px] text-slate-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span>
              Values represent precipitation accumulated over the latest 5 minutes reported by automated tipping-bucket gauges.
            </span>
          </div>
        </div>

        {/* Center & Right: Live Telemetry Gauges Table */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                {activeStations.length > 0 ? 'Active Rain Gauge Telemetry' : 'Representative Rain Gauge Readings'}
              </h3>
              <span className="text-[11px] text-slate-400">
                {activeStations.length > 0 ? `${activeStations.length} reporting rain` : 'All 43 stations 0.0 mm'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {displayStations.map((station) => {
                const hasRain = station.rainfall > 0;
                return (
                  <div
                    key={station.id}
                    onClick={() => onFocusStation(station.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer hover:border-blue-500/60 hover:bg-slate-800/80 ${
                      hasRain
                        ? 'bg-blue-950/30 border-blue-500/40 text-blue-200'
                        : 'bg-slate-800/40 border-slate-700/50 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1 rounded">
                          {station.id}
                        </span>
                        <h4 className="text-xs font-semibold text-white truncate max-w-[140px]">
                          {station.name}
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {station.latitude?.toFixed(3)}°N, {station.longitude?.toFixed(3)}°E
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-extrabold text-white">
                        {station.rainfall.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">mm</span>
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-medium inline-block mt-0.5 ${
                          station.intensity === 'heavy'
                            ? 'bg-pink-500/20 text-pink-300'
                            : station.intensity === 'moderate'
                            ? 'bg-blue-500/20 text-blue-300'
                            : station.intensity === 'light'
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'bg-slate-700/50 text-slate-400'
                        }`}
                      >
                        {station.intensityLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Micro Forecast Areas Alert (if any expected rain) */}
          {activeForecastAreas.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
              <span className="font-bold text-white block mb-1">
                2-Hour Rain Forecast Watch ({activeForecastAreas.length} Areas):
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {activeForecastAreas.slice(0, 10).map((a) => (
                  <span
                    key={a.area}
                    className="px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[11px]"
                  >
                    {a.area}: {a.forecast}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Official NEA MSS Rain Radar Info Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/20 to-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            Official Meteorological Service Singapore (MSS) Rain Radar
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            While direct raw binary raster feeds require internal MSS authentication, this dashboard monitors the 43+ telemetry rain gauges and micro-forecast zones across Singapore. To view the raw Doppler radar imagery, visit the official MSS portal.
          </p>
        </div>
        <a
          href="https://www.weather.gov.sg/weather-rain-area/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:text-white text-xs font-medium transition-all shrink-0 cursor-pointer"
        >
          <span>Open MSS Rain Area Portal</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </section>
  );
};
