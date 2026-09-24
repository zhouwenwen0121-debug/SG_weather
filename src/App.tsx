import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { SingaporeMap } from './components/SingaporeMap';
import { WeatherSummaryCards } from './components/WeatherSummaryCards';
import { RainfallSection } from './components/RainfallSection';
import { HazeSection } from './components/HazeSection';
import { WeatherStationsList } from './components/WeatherStationsList';
import { ForecastSection } from './components/ForecastSection';
import { Footer } from './components/Footer';
import { WeatherResponse, RainResponse, HazeResponse, HealthResponse } from './types/weather';
import { AlertTriangle, RefreshCw, Radio } from 'lucide-react';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export default function App() {
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [rainData, setRainData] = useState<RainResponse | null>(null);
  const [hazeData, setHazeData] = useState<HazeResponse | null>(null);
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  // Interval timer ref for 5-minute auto-refresh
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
        setErrorMessage('Unable to retrieve official Singapore weather data. Please check connection and try again.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network failure';
      setErrorMessage(`Failed to fetch weather telemetry: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load & 5-minute automated polling
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

  // Handle station selection & scroll to map
  const handleSelectStation = (stationId: string | null) => {
    setSelectedStationId(stationId);
  };

  const handleFocusStation = (stationId: string) => {
    setSelectedStationId(stationId);
    const mapElement = document.getElementById('map-top');
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const latestUpdatedAt =
    weatherData?.updatedAt || rainData?.updatedAt || hazeData?.updatedAt || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <Header
        updatedAt={latestUpdatedAt}
        isLoading={isLoading}
        onRefresh={() => fetchAllData(true)}
        health={healthData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Error Alert if any */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-center justify-between gap-3 text-xs sm:text-sm animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => fetchAllData(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )}

        {/* 1. Weather Summary Metrics */}
        {(activeTab === 'all' || activeTab === 'forecast') && (
          <WeatherSummaryCards
            summary={weatherData?.summary ?? null}
            haze={hazeData}
            isRaining={rainData?.isRaining ?? false}
            rainingStationCount={rainData?.rainingStationCount ?? 0}
            totalStationCount={rainData?.totalStationCount ?? 0}
            maxRainfall={rainData?.maxRainfall ?? 0}
          />
        )}

        {/* 2. Main Interactive Singapore Weather Map */}
        {(activeTab === 'all' || activeTab === 'rain') && (
          <div id="map-top" className="scroll-mt-24 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  Singapore Weather & Rain Radar Map
                </h2>
                <p className="text-xs text-slate-400">
                  Interactive real-time spatial telemetry: rain gauges, temperatures, wind velocity & air quality
                </p>
              </div>
            </div>

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
        )}

        {/* 3. Rainfall Section */}
        {(activeTab === 'all' || activeTab === 'rain') && (
          <div className="pt-2">
            <RainfallSection
              rainData={rainData}
              onFocusStation={handleFocusStation}
            />
          </div>
        )}

        {/* 4. Haze & PSI Air Quality Section */}
        {(activeTab === 'all' || activeTab === 'haze') && (
          <div className="pt-2">
            <HazeSection hazeData={hazeData} />
          </div>
        )}

        {/* 5. Weather Stations List */}
        {(activeTab === 'all' || activeTab === 'stations') && (
          <div className="pt-2">
            <WeatherStationsList
              stations={weatherData?.stations ?? []}
              onSelectStation={handleFocusStation}
              selectedStationId={selectedStationId}
            />
          </div>
        )}

        {/* 6. Forecast Section */}
        {(activeTab === 'all' || activeTab === 'forecast') && (
          <div className="pt-2">
            <ForecastSection
              twoHourAreas={weatherData?.forecast?.twoHourAreas ?? []}
              twoHourPeriod={weatherData?.forecast?.twoHourPeriod ?? null}
              twentyFourHour={weatherData?.forecast?.twentyFourHour ?? null}
              fourDay={weatherData?.forecast?.fourDay ?? []}
            />
          </div>
        )}
      </main>

      {/* Footer & Official Attribution */}
      <Footer />
    </div>
  );
}
