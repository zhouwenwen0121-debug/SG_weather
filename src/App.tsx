import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Header } from './components/Header';
import { SingaporeMap } from './components/SingaporeMap';
import { LocationDetailPanel } from './components/LocationDetailPanel';
import { AttributionModal } from './components/AttributionModal';
import { WeatherResponse, RainResponse, HazeResponse, HealthResponse } from './types/weather';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ThemeProvider, useTheme } from './context/ThemeContext';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes auto-refresh

function Dashboard() {
  const { isDark } = useTheme();
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [rainData, setRainData] = useState<RainResponse | null>(null);
  const [hazeData, setHazeData] = useState<HazeResponse | null>(null);
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected station ID for the location toggle panel
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  // Whether location info panel is open (defaults to true for immediate location discovery, toggleable)
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true);

  // Attribution modal state
  const [isAttributionOpen, setIsAttributionOpen] = useState<boolean>(false);

  // Auto-refresh interval ref
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAllData = useCallback(async (forceFresh = false) => {
    setIsLoading(true);
    setErrorMessage(null);

    const query = forceFresh ? '?refresh=true' : '';

    try {
      const [wRes, rRes, hRes, healthRes] = await Promise.allSettled([
        fetch(`/api/weather${query}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/rain${query}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/haze${query}`).then((r) => (r.ok ? r.json() : null)),
        fetch('/api/health').then((r) => (r.ok ? r.json() : null)),
      ]);

      let hasSuccess = false;

      if (wRes.status === 'fulfilled' && wRes.value) {
        setWeatherData(wRes.value);
        hasSuccess = true;
      }
      if (rRes.status === 'fulfilled' && rRes.value) {
        setRainData(rRes.value);
        hasSuccess = true;
      }
      if (hRes.status === 'fulfilled' && hRes.value) {
        setHazeData(hRes.value);
        hasSuccess = true;
      }
      if (healthRes.status === 'fulfilled' && healthRes.value) {
        setHealthData(healthRes.value);
      }

      if (!hasSuccess) {
        setErrorMessage('Unable to retrieve official Singapore weather data. Please check connection.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network failure';
      setErrorMessage(`Failed to fetch weather telemetry: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and 5-min polling
  useEffect(() => {
    fetchAllData();

    autoRefreshTimerRef.current = setInterval(() => {
      fetchAllData(true);
    }, REFRESH_INTERVAL_MS);

    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
      }
    };
  }, [fetchAllData]);

  // Handle station selection toggle from map
  const handleSelectStation = (stationId: string | null) => {
    setSelectedStationId(stationId);
    if (stationId) {
      setIsPanelOpen(true);
    }
  };

  const selectedStationName = useMemo(() => {
    if (!selectedStationId) return null;
    const w = weatherData?.stations.find((s) => s.id === selectedStationId);
    if (w) return w.name;
    const r = rainData?.stations.find((s) => s.id === selectedStationId);
    if (r) return r.name;
    return null;
  }, [selectedStationId, weatherData, rainData]);

  const latestUpdatedAt =
    weatherData?.updatedAt || rainData?.updatedAt || hazeData?.updatedAt || null;

  return (
    <div
      className={`h-screen max-h-screen overflow-hidden flex flex-col font-sans transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      {/* Top Header with live metrics & toggles */}
      <Header
        updatedAt={latestUpdatedAt}
        isLoading={isLoading}
        onRefresh={() => fetchAllData(true)}
        health={healthData}
        summary={weatherData?.summary ?? null}
        haze={hazeData}
        isRaining={rainData?.isRaining ?? false}
        rainingStationCount={rainData?.rainingStationCount ?? 0}
        maxRainfall={rainData?.maxRainfall ?? 0}
        isPanelOpen={isPanelOpen}
        onTogglePanel={() => setIsPanelOpen(!isPanelOpen)}
        selectedStationName={selectedStationName}
        onOpenAttribution={() => setIsAttributionOpen(true)}
      />

      {/* Main Single-Viewport Map & Location Info Layout (Zero Page Scroll) */}
      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="absolute top-2 left-4 right-4 z-40 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 flex items-center justify-between gap-3 text-xs shadow-md backdrop-blur-md">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => fetchAllData(true)}
              className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        )}

        {/* Central Map Canvas - occupies all available space */}
        <div className="flex-1 h-full w-full relative overflow-hidden flex flex-col">
          <SingaporeMap
            weatherStations={weatherData?.stations ?? []}
            rainStations={rainData?.stations ?? []}
            hazeRegions={hazeData?.regions ?? []}
            twoHourAreas={weatherData?.forecast?.twoHourAreas ?? []}
            selectedStationId={selectedStationId}
            onSelectStation={handleSelectStation}
            isRaining={rainData?.isRaining ?? false}
          />
        </div>

        {/* Location Info Panel / Drawer toggled from the map */}
        {isPanelOpen && (
          <div className="absolute md:relative bottom-0 right-0 left-0 md:left-auto w-full md:w-80 lg:w-96 max-h-[70vh] md:max-h-full h-auto md:h-full z-30 transition-all animate-in slide-in-from-right duration-200 shrink-0">
            <LocationDetailPanel
              selectedStationId={selectedStationId}
              onSelectStation={handleSelectStation}
              weatherStations={weatherData?.stations ?? []}
              rainStations={rainData?.stations ?? []}
              hazeRegions={hazeData?.regions ?? []}
              twoHourAreas={weatherData?.forecast?.twoHourAreas ?? []}
              twentyFourHour={weatherData?.forecast?.twentyFourHour ?? null}
              fourDay={weatherData?.forecast?.fourDay ?? []}
              onClose={() => setIsPanelOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Official Singapore Open Data License Modal */}
      <AttributionModal
        isOpen={isAttributionOpen}
        onClose={() => setIsAttributionOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Dashboard />
    </ThemeProvider>
  );
}
