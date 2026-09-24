import React from 'react';
import { CloudRain, RefreshCw, Radio, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { formatRelativeTime, formatTimeSGT } from '../utils/geo';
import { HealthResponse } from '../types/weather';

interface HeaderProps {
  updatedAt: string | null;
  isLoading: boolean;
  onRefresh: () => void;
  health: HealthResponse | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  updatedAt,
  isLoading,
  onRefresh,
  health,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-4">
          {/* Brand & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 ring-1 ring-white/20">
              <CloudRain className="w-6 h-6 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Singapore Weather
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-medium">
                    SG Live
                  </span>
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                Live weather observations, rain radar & air quality from NEA / data.gov.sg
              </p>
            </div>
          </div>

          {/* Controls: Status, Last Updated & Refresh */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
            {/* NEA Upstream Health Status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
              {health?.upstreamOk ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-medium text-slate-200">NEA Telemetry Online</span>
                </>
              ) : health ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-medium text-amber-300">Gov API Degraded ({health.upstreamStatus})</span>
                </>
              ) : (
                <>
                  <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                  <span className="text-slate-300">Connecting...</span>
                </>
              )}
            </div>

            {/* Last Updated Display */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
              <span>Updated: <strong className="text-white font-semibold">{formatRelativeTime(updatedAt)}</strong> ({formatTimeSGT(updatedAt)} SGT)</span>
            </div>

            {/* Manual Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh live NEA telemetry data"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 text-white font-medium shadow-md shadow-blue-600/30 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Fetching...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto pb-3 pt-1 border-t border-slate-800/60 no-scrollbar text-xs sm:text-sm">
          {[
            { id: 'all', label: 'Overview & Map' },
            { id: 'rain', label: 'Rain Areas & Radar' },
            { id: 'haze', label: 'Haze & Air Quality (PSI)' },
            { id: 'stations', label: 'Weather Stations' },
            { id: 'forecast', label: 'Forecast (2-Hr & 4-Day)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};
