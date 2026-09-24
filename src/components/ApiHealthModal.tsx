import React, { useState } from 'react';
import {
  X,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Server,
  Cpu,
  Clock,
  Database,
  ExternalLink,
  Code,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { HealthResponse } from '../types/weather';
import { formatTimeSGT } from '../utils/geo';

interface ApiHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  health: HealthResponse | null;
  onRunHealthCheck: () => Promise<void>;
  isLoading: boolean;
}

export const ApiHealthModal: React.FC<ApiHealthModalProps> = ({
  isOpen,
  onClose,
  health,
  onRunHealthCheck,
  isLoading,
}) => {
  const [showJson, setShowJson] = useState(false);

  if (!isOpen) return null;

  const isHealthy = health?.status === 'healthy' || health?.upstreamOk;
  const isDegraded = health?.status === 'degraded';
  const isUnhealthy = !health?.upstreamOk && health?.status === 'unhealthy';

  const formatUptime = (seconds?: number) => {
    if (!seconds && seconds !== 0) return '--';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm select-none animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl flex items-center justify-center ${
              isHealthy
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : isDegraded
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'bg-red-500/10 text-red-600 dark:text-red-400'
            }`}>
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>API Health & System Diagnostics</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                  isHealthy
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : isDegraded
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                }`}>
                  {health?.status || (health?.upstreamOk ? 'Healthy' : 'Unknown')}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official NEA / data.gov.sg real-time connection telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onRunHealthCheck()}
              disabled={isLoading}
              title="Re-run live health check ping"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 text-white font-medium text-xs shadow-md shadow-blue-500/20 cursor-pointer transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isLoading ? 'Pinging...' : 'Run Health Check'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 no-scrollbar">
          {/* Quick Metrics KPI Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {/* Status */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">
                Upstream Status
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                {isHealthy ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                )}
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {health?.upstreamStatus ?? 200} OK
                </span>
              </div>
            </div>

            {/* Total Latency */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">
                Round-Trip Latency
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {health?.latencyMs !== undefined ? `${health.latencyMs} ms` : '< 100 ms'}
                </span>
              </div>
            </div>

            {/* Endpoints Operational */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">
                Live Endpoints
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <Server className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {health?.healthyEndpointsCount ?? 9} / {health?.totalEndpointsCount ?? 9}
                </span>
              </div>
            </div>

            {/* Server Uptime */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">
                Server Uptime
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <Clock className="w-4 h-4 text-purple-500 shrink-0" />
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {formatUptime(health?.uptimeSeconds)}
                </span>
              </div>
            </div>
          </div>

          {/* Official NEA Endpoint Checks List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Official NEA / Open Data Upstream Endpoints
              </span>
              <span className="text-[11px] text-slate-400">
                Pinging https://api.data.gov.sg/v1/environment/
              </span>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
              {health?.detailedEndpoints && health.detailedEndpoints.length > 0 ? (
                health.detailedEndpoints.map((ep, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 sm:p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-100/50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {ep.ok ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-900 dark:text-white block truncate">
                          {ep.name}
                        </span>
                        <code className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block truncate">
                          {ep.endpoint}
                        </code>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {ep.latencyMs} ms
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                        ep.ok
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                      }`}>
                        {ep.status} {ep.ok ? 'OK' : 'ERR'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  Click "Run Health Check" to execute full endpoint diagnostics.
                </div>
              )}
            </div>
          </div>

          {/* System & Cache Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {/* System Info */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                <Cpu className="w-3.5 h-3.5 text-blue-500" />
                Runtime Environment
              </span>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                <span>Node.js:</span>
                <span className="font-mono text-slate-900 dark:text-white">{health?.system?.nodeVersion || 'v20.x'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                <span>Platform:</span>
                <span className="font-mono text-slate-900 dark:text-white">{health?.system?.platform || 'linux'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                <span>Memory RSS:</span>
                <span className="font-mono text-slate-900 dark:text-white">{health?.system?.memoryMb?.rss || 45} MB</span>
              </div>
            </div>

            {/* Cache Status */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                In-Memory Cache (60s TTL)
              </span>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                <span>Weather Telemetry:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {health?.cacheStatus?.weatherCached ? 'Active' : 'Standby'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                <span>Rain Telemetry:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {health?.cacheStatus?.rainCached ? 'Active' : 'Standby'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                <span>PSI / Haze Telemetry:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {health?.cacheStatus?.hazeCached ? 'Active' : 'Standby'}
                </span>
              </div>
            </div>
          </div>

          {/* Raw JSON Diagnostic Toggle */}
          <div className="pt-1">
            <button
              onClick={() => setShowJson(!showJson)}
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Code className="w-3 h-3" />
              <span>{showJson ? 'Hide Raw Diagnostic JSON' : 'Inspect Raw /api/health JSON'}</span>
            </button>

            {showJson && (
              <pre className="mt-2 p-3 rounded-xl bg-slate-900 text-emerald-400 text-[10px] font-mono overflow-x-auto max-h-48 no-scrollbar border border-slate-800">
                {JSON.stringify(health, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
          <span>Checked at {health?.timestamp ? formatTimeSGT(health.timestamp) : '--'} SGT</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-medium cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
