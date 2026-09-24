import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Header } from './components/Header';
import { SingaporeMap } from './components/SingaporeMap';
import { LocationOverview } from './components/LocationOverview';
import { AttributionModal } from './components/AttributionModal';
import { ApiHealthModal } from './components/ApiHealthModal';
import {
  WeatherResponse,
  RainResponse,
  HazeResponse,
  HealthResponse,
  WeatherStation,
  RainStation,
} from './types/weather';
import { AlertTriangle, RefreshCw, MapPin, Map as MapIcon } from 'lucide-react';
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

  // Default to Marina Barrage (City / Downtown), or will fallback to first available
  const [selectedStationId, setSelectedStationId] = useState<string>('S108');

  // Mobile view tab toggle: 'intel' (all location info) vs 'map' (Singapore map)
  const [mobileTab, setMobileTab] = useState<'intel' | 'map'>('intel');

  // Attribution and Health modal state
  const [isAttributionOpen, setIsAttributionOpen] = useState<boolean>(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState<boolean>(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(false);

  // Auto-refresh interval ref
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const runHealthCheck = useCallback(async (forceFresh = true) => {
    setIsCheckingHealth(true);
    try {
      const res = await fetch(`/api/health?refresh=${forceFresh}`);
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
      }
    } catch (err) {
      console.error('Failed to run health check', err);
    } finally {
      setIsCheckingHealth(false);
    }
  }, []);

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

  // Combine weather stations with rain data for unified Singapore locations
  const combinedStations = useMemo(() => {
    const weatherList = weatherData?.stations ?? [];
    const rainList = rainData?.stations ?? [];

    const rainMap = new Map<string, RainStation>();
    rainList.forEach((r) => rainMap.set(r.id, r));

    const map = new Map<string, any>();

    // 1. Weather stations
    weatherList.forEach((w) => {
      if (w.latitude && w.longitude) {
        const rain = rainMap.get(w.id);
        map.set(w.id, {
          ...w,
          rainfall: rain ? rain.rainfall : (w.rainfall ?? 0),
          hourlyRate: rain ? rain.hourlyRate : (w.rainfall ? w.rainfall * 12 : 0),
          intensity: rain ? rain.intensity : (w.rainfall && w.rainfall > 0 ? 'light' : 'none'),
          intensityLabel: rain ? rain.intensityLabel : (w.rainfall && w.rainfall > 0 ? 'Light Rain' : 'Dry / Clear'),
        });
      }
    });

    // 2. Rain stations not already included
    rainList.forEach((r) => {
      if (!map.has(r.id) && r.latitude && r.longitude) {
        map.set(r.id, {
          id: r.id,
          name: r.name,
          latitude: r.latitude,
          longitude: r.longitude,
          temperature: null,
          humidity: null,
          windSpeedKmH: null,
          windSpeedKnots: null,
          windDirectionDegrees: null,
          windDirectionCardinal: null,
          rainfall: r.rainfall,
          hourlyRate: r.hourlyRate,
          intensity: r.intensity,
          intensityLabel: r.intensityLabel,
          lastObserved: new Date().toISOString(),
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [weatherData, rainData]);

  // Auto-verify selectedStationId exists, else fallback to S108 or first available
  useEffect(() => {
    if (combinedStations.length > 0) {
      const exists = combinedStations.some((s) => s.id === selectedStationId);
      if (!exists) {
        const fallback = combinedStations.find((s) => s.id === 'S108') || combinedStations[0];
        setSelectedStationId(fallback.id);
      }
    }
  }, [combinedStations, selectedStationId]);

  const handleSelectStation = (stationId: string | null) => {
    if (stationId) {
      setSelectedStationId(stationId);
    }
  };

  const selectedStationName = useMemo(() => {
    const match = combinedStations.find((s) => s.id === selectedStationId);
    return match ? match.name : 'Singapore';
  }, [combinedStations, selectedStationId]);

  const latestUpdatedAt =
    weatherData?.updatedAt || rainData?.updatedAt || hazeData?.updatedAt || null;

  return (
    <div
      className={`h-screen max-h-screen overflow-hidden flex flex-col font-sans transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      {/* Top Header */}
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
        selectedStationName={selectedStationName}
        onOpenAttribution={() => setIsAttributionOpen(true)}
        onOpenHealth={() => {
          setIsHealthModalOpen(true);
          runHealthCheck(true);
        }}
      />

      {/* Mobile Screen Segmented Tab Switcher (Visible on small screens) */}
      <div className="lg:hidden flex items-center justify-center p-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full max-w-sm">
          <button
            onClick={() => setMobileTab('intel')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mobileTab === 'intel'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Location Info ({selectedStationName.slice(0, 14)})</span>
          </button>
          <button
            onClick={() => setMobileTab('map')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mobileTab === 'map'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Singapore Map</span>
          </button>
        </div>
      </div>

      {/* Main Single-Page Unified Layout */}
      <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="absolute top-2 left-4 right-4 z-50 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 flex items-center justify-between gap-3 text-xs shadow-md backdrop-blur-md">
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

        {/* Column 1: Complete Location Weather Telemetry & Dropdown List */}
        <div
          className={`w-full lg:w-[480px] xl:w-[540px] 2xl:w-[580px] h-full shrink-0 flex flex-col overflow-hidden ${
            mobileTab === 'intel' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <LocationOverview
            selectedStationId={selectedStationId}
            onSelectStation={handleSelectStation}
            combinedStations={combinedStations}
            hazeRegions={hazeData?.regions ?? []}
            twoHourAreas={weatherData?.forecast?.twoHourAreas ?? []}
            twentyFourHour={weatherData?.forecast?.twentyFourHour ?? null}
            fourDay={weatherData?.forecast?.fourDay ?? []}
          />
        </div>

        {/* Column 2: Live Interactive Singapore Map */}
        <div
          className={`flex-1 h-full w-full relative overflow-hidden flex flex-col ${
            mobileTab === 'map' ? 'flex' : 'hidden lg:flex'
          }`}
        >
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
      </div>

      {/* Official Singapore Open Data License Modal */}
      <AttributionModal
        isOpen={isAttributionOpen}
        onClose={() => setIsAttributionOpen(false)}
      />

      {/* API Health Check Diagnostic Modal */}
      <ApiHealthModal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        health={healthData}
        onRunHealthCheck={() => runHealthCheck(true)}
        isLoading={isCheckingHealth}
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
