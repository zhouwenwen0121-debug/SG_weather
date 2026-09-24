import React from 'react';
import {
  CloudRain,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Sun,
  Moon,
  Info,
  MapPin,
  Thermometer,
  ShieldCheck,
} from 'lucide-react';
import { formatRelativeTime, formatTimeSGT } from '../utils/geo';
import { HealthResponse, WeatherSummary, HazeResponse } from '../types/weather';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  updatedAt: string | null;
  isLoading: boolean;
  onRefresh: () => void;
  health: HealthResponse | null;
  summary: WeatherSummary | null;
  haze: HazeResponse | null;
  isRaining: boolean;
  rainingStationCount: number;
  maxRainfall: number;
  selectedStationName: string | null;
  onOpenAttribution: () => void;
  onOpenHealth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  updatedAt,
  isLoading,
  onRefresh,
  health,
  summary,
  haze,
  isRaining,
  rainingStationCount,
  maxRainfall,
  selectedStationName,
  onOpenAttribution,
  onOpenHealth,
}) => {
  const { toggleTheme, isDark } = useTheme();

  const isHealthy = health?.status === 'healthy' || (health?.upstreamOk && health?.status !== 'degraded');
  const isDegraded = health?.status === 'degraded';

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-40 transition-colors shadow-xs shrink-0 select-none">
      <div className="w-full px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          {/* Brand & Live status */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20 ring-1 ring-white/20 shrink-0">
              <CloudRain className="w-5 h-5 animate-pulse" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>SG Weather</span>
                  <span className="text-[10px] sm:text-xs px-1.5 py-0.2 rounded-full bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 dark:border-red-500/30 font-bold">
                    LIVE
                  </span>
                </h1>
              </div>
              <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[260px]">
                Official NEA / data.gov.sg telemetry
              </p>
            </div>
          </div>

          {/* Islandwide HUD Quick Status Badges */}
          <div className="hidden md:flex items-center gap-2 text-xs">
            {/* Condition & Avg Temp */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300">
              <Thermometer className="w-3.5 h-3.5 text-amber-500" />
              <span>Island Avg:</span>
              <strong className="text-slate-900 dark:text-white font-bold">
                {summary?.temperatureAvg !== null ? `${summary?.temperatureAvg}°C` : '--'}
              </strong>
            </div>

            {/* Rain Status */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border ${
              isRaining
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-500/40 text-blue-900 dark:text-blue-200'
                : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
            }`}>
              <CloudRain className={`w-3.5 h-3.5 ${isRaining ? 'text-blue-500 animate-bounce' : 'text-slate-400'}`} />
              <strong className="font-bold">
                {isRaining ? `${rainingStationCount} Stns Raining (${maxRainfall}mm)` : 'Dry Islandwide'}
              </strong>
            </div>

            {/* Air Quality (PSI) */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>PSI:</span>
              <strong className="text-slate-900 dark:text-white font-bold">
                {haze?.overallPsi ?? '--'} ({haze?.overallCategory || 'Good'})
              </strong>
            </div>
          </div>

          {/* Right Action Controls: Active Location Tag, Health Check, Dark/Bright Mode, Refresh & Info */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
            {/* Active Selected Location Display Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 font-bold max-w-[140px] sm:max-w-[180px] truncate shadow-xs">
              <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="truncate">{selectedStationName || 'Singapore'}</span>
            </div>

            {/* API Health Check Diagnostic Button */}
            <button
              onClick={onOpenHealth}
              title={`API Health: ${health?.status || (health?.upstreamOk ? 'Healthy' : 'Unknown')} (${health?.latencyMs !== undefined ? `${health.latencyMs}ms` : 'Click to inspect'})`}
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer transition-all shadow-xs"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isHealthy ? 'bg-emerald-400' : isDegraded ? 'bg-amber-400' : 'bg-red-400'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  isHealthy ? 'bg-emerald-500' : isDegraded ? 'bg-amber-500' : 'bg-red-500'
                }`}></span>
              </span>
              <span className="hidden sm:inline">Health Check</span>
              <span className="sm:hidden">Health</span>
            </button>

            {/* Bright / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to Bright theme' : 'Switch to Dark theme'}
              title={isDark ? 'Switch to Bright theme' : 'Switch to Dark theme'}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl border transition-all cursor-pointer bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-200 active:scale-95 shadow-xs"
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline font-semibold">Bright</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden sm:inline font-semibold">Dark</span>
                </>
              )}
            </button>

            {/* Manual Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title={`Last updated ${formatRelativeTime(updatedAt)} (${formatTimeSGT(updatedAt)} SGT)`}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 text-white font-medium shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isLoading ? 'Syncing...' : 'Refresh'}</span>
            </button>

            {/* Official Attribution Info Button */}
            <button
              onClick={onOpenAttribution}
              title="Official Singapore Government Data Attribution"
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
