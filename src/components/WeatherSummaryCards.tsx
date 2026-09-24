import React from 'react';
import {
  Thermometer,
  CloudRain,
  Droplets,
  ShieldCheck,
  ShieldAlert,
  Sun,
  CloudLightning,
  CloudSun,
} from 'lucide-react';
import { WeatherSummary, HazeResponse } from '../types/weather';

interface WeatherSummaryCardsProps {
  summary: WeatherSummary | null;
  haze: HazeResponse | null;
  isRaining: boolean;
  rainingStationCount: number;
  totalStationCount: number;
  maxRainfall: number;
}

export const WeatherSummaryCards: React.FC<WeatherSummaryCardsProps> = ({
  summary,
  haze,
  isRaining,
  rainingStationCount,
  totalStationCount,
  maxRainfall,
}) => {
  const getConditionIcon = (condition: string | undefined) => {
    if (!condition) return <Sun className="w-8 h-8 text-amber-500" />;
    const c = condition.toLowerCase();
    if (c.includes('thunder')) return <CloudLightning className="w-8 h-8 text-amber-500" />;
    if (c.includes('rain') || c.includes('shower')) return <CloudRain className="w-8 h-8 text-blue-500" />;
    if (c.includes('cloud')) return <CloudSun className="w-8 h-8 text-sky-500" />;
    return <Sun className="w-8 h-8 text-amber-500" />;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
      {/* 1. Overall Forecast Condition */}
      <div className="col-span-2 md:col-span-1 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-md shadow-slate-100 dark:shadow-lg relative overflow-hidden flex flex-col justify-between transition-colors">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Current Condition
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-snug">
              {summary?.generalForecast || 'Fair (Day)'}
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-inner">
            {getConditionIcon(summary?.generalForecast)}
          </div>
        </div>
        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2 flex items-center justify-between">
          <span>NEA 24-Hr General Forecast</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Islandwide</span>
        </div>
      </div>

      {/* 2. Temperature Card */}
      <div className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-md shadow-slate-100 dark:shadow-lg flex flex-col justify-between transition-colors">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Temperature
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {summary?.temperatureAvg ?? '--'}
              </span>
              <span className="text-lg font-bold text-amber-500 dark:text-amber-400">°C</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
            <Thermometer className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2 flex items-center justify-between">
          <span>Island Range:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {summary?.temperatureMin ?? '--'}° - {summary?.temperatureMax ?? '--'}°C
          </span>
        </div>
      </div>

      {/* 3. Rainfall Card */}
      <div className={`bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800/90 rounded-2xl p-4 border shadow-md shadow-slate-100 dark:shadow-lg flex flex-col justify-between transition-colors ${
        isRaining
          ? 'border-blue-400 dark:border-blue-500/50 shadow-blue-500/10'
          : 'border-slate-200 dark:border-slate-700/80'
      }`}>
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Rainfall (5-min)
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {maxRainfall > 0 ? `${maxRainfall}` : '0.0'}
              </span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">mm</span>
            </div>
          </div>
          <div className={`p-2.5 rounded-xl border ${
            isRaining
              ? 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-400 dark:border-blue-500/40 text-blue-600 dark:text-blue-400 animate-pulse'
              : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-400'
          }`}>
            <CloudRain className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2 flex items-center justify-between">
          <span>Status:</span>
          <span className={`font-semibold ${isRaining ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {rainingStationCount > 0
              ? `${rainingStationCount}/${totalStationCount} stations raining`
              : 'Dry across SG'}
          </span>
        </div>
      </div>

      {/* 4. Relative Humidity Card */}
      <div className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-md shadow-slate-100 dark:shadow-lg flex flex-col justify-between transition-colors">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Relative Humidity
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {summary?.humidityAvg ?? '--'}
              </span>
              <span className="text-lg font-bold text-cyan-600 dark:text-cyan-400">%</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
            <Droplets className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2 flex items-center justify-between">
          <span>Wind Avg:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {summary?.windSpeedAvg ? `${summary.windSpeedAvg} km/h` : 'Calm'}
          </span>
        </div>
      </div>

      {/* 5. Air Quality (PSI & PM2.5) Card */}
      <div className="col-span-2 md:col-span-1 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-md shadow-slate-100 dark:shadow-lg flex flex-col justify-between transition-colors">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Air Quality (PSI)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {haze?.overallPsi ?? '--'}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                haze?.overallPsi && haze.overallPsi > 100
                  ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
              }`}>
                {haze?.overallCategory || 'Good'}
              </span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            {haze?.isHazy ? (
              <ShieldAlert className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
        </div>
        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2 flex items-center justify-between">
          <span>1-Hr PM2.5:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {haze?.overallPm25 ? `${haze.overallPm25} µg/m³ (${haze.overallPm25Band})` : 'Normal'}
          </span>
        </div>
      </div>
    </div>
  );
};
