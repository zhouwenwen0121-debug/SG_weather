import React, { useMemo } from 'react';
import {
  X,
  Thermometer,
  CloudRain,
  Droplets,
  Wind,
  Compass,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Calendar,
  CloudSun,
  Sun,
  CloudLightning,
  Activity,
  Layers,
} from 'lucide-react';
import {
  WeatherStation,
  RainStation,
  HazeRegion,
  TwoHourAreaForecast,
  TwentyFourHourForecast,
  FourDayForecastItem,
} from '../types/weather';
import { formatTimeSGT } from '../utils/geo';
import { useTheme } from '../context/ThemeContext';

interface LocationDetailPanelProps {
  selectedStationId: string | null;
  onSelectStation: (id: string | null) => void;
  weatherStations: WeatherStation[];
  rainStations: RainStation[];
  hazeRegions: HazeRegion[];
  twoHourAreas: TwoHourAreaForecast[];
  twentyFourHour: TwentyFourHourForecast | null;
  fourDay: FourDayForecastItem[];
  onClose: () => void;
}

export const LocationDetailPanel: React.FC<LocationDetailPanelProps> = ({
  selectedStationId,
  onSelectStation,
  weatherStations,
  rainStations,
  hazeRegions,
  twoHourAreas,
  twentyFourHour,
  fourDay,
  onClose,
}) => {
  const { isDark } = useTheme();

  // Unified stations list
  const combinedStations = useMemo(() => {
    const rainMap = new Map<string, RainStation>();
    rainStations.forEach((r) => rainMap.set(r.id, r));

    const map = new Map<string, any>();

    weatherStations.forEach((w) => {
      const rain = rainMap.get(w.id);
      map.set(w.id, {
        ...w,
        rainfall: rain ? rain.rainfall : (w.rainfall ?? 0),
        hourlyRate: rain ? rain.hourlyRate : (w.rainfall ? w.rainfall * 12 : 0),
        intensity: rain ? rain.intensity : (w.rainfall && w.rainfall > 0 ? 'light' : 'none'),
        intensityLabel: rain ? rain.intensityLabel : (w.rainfall && w.rainfall > 0 ? 'Light' : 'No Rain'),
      });
    });

    rainStations.forEach((r) => {
      if (!map.has(r.id)) {
        map.set(r.id, {
          id: r.id,
          name: r.name,
          latitude: r.latitude,
          longitude: r.longitude,
          temperature: null,
          humidity: null,
          windSpeedKmH: null,
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
  }, [weatherStations, rainStations]);

  // Find currently active station
  const activeStationIndex = useMemo(() => {
    if (!selectedStationId) return -1;
    return combinedStations.findIndex((s) => s.id === selectedStationId);
  }, [selectedStationId, combinedStations]);

  const currentStation = activeStationIndex >= 0 ? combinedStations[activeStationIndex] : null;

  // Toggle prev/next station
  const handlePrevStation = () => {
    if (combinedStations.length === 0) return;
    const nextIdx = activeStationIndex <= 0 ? combinedStations.length - 1 : activeStationIndex - 1;
    onSelectStation(combinedStations[nextIdx].id);
  };

  const handleNextStation = () => {
    if (combinedStations.length === 0) return;
    const nextIdx = activeStationIndex >= combinedStations.length - 1 ? 0 : activeStationIndex + 1;
    onSelectStation(combinedStations[nextIdx].id);
  };

  // Find nearest planning area 2-hour forecast
  const matchedForecastArea = useMemo(() => {
    if (!currentStation || !currentStation.latitude || !currentStation.longitude) return null;
    let closest: TwoHourAreaForecast | null = null;
    let minDistance = Infinity;

    for (const area of twoHourAreas) {
      if (area.latitude && area.longitude) {
        const dLat = area.latitude - currentStation.latitude;
        const dLon = area.longitude - currentStation.longitude;
        const dist = dLat * dLat + dLon * dLon;
        if (dist < minDistance) {
          minDistance = dist;
          closest = area;
        }
      }
    }
    return closest;
  }, [currentStation, twoHourAreas]);

  // Find corresponding Haze region based on coordinates
  const matchedHazeRegion = useMemo(() => {
    if (!currentStation || !currentStation.latitude || !currentStation.longitude) {
      return hazeRegions.find((r) => r.id === 'central') || hazeRegions[0] || null;
    }
    const lat = currentStation.latitude;
    const lon = currentStation.longitude;

    if (lat < 1.30) return hazeRegions.find((r) => r.id === 'south') || null;
    if (lat > 1.39) return hazeRegions.find((r) => r.id === 'north') || null;
    if (lon > 103.90) return hazeRegions.find((r) => r.id === 'east') || null;
    if (lon < 103.75) return hazeRegions.find((r) => r.id === 'west') || null;
    return hazeRegions.find((r) => r.id === 'central') || null;
  }, [currentStation, hazeRegions]);

  const getForecastIcon = (fc: string | undefined) => {
    if (!fc) return <Sun className="w-5 h-5 text-amber-500" />;
    const text = fc.toLowerCase();
    if (text.includes('thunder')) return <CloudLightning className="w-5 h-5 text-amber-500" />;
    if (text.includes('rain') || text.includes('shower')) return <CloudRain className="w-5 h-5 text-blue-500" />;
    if (text.includes('cloud')) return <CloudSun className="w-5 h-5 text-sky-500" />;
    return <Sun className="w-5 h-5 text-amber-500" />;
  };

  // If no station is selected, show islandwide overview
  if (!currentStation) {
    return (
      <div className="h-full flex flex-col justify-between p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-l border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 overflow-y-auto no-scrollbar shadow-2xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <MapPin className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Location Explorer</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Click any marker or select a location</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-500/30 text-xs">
            <span className="font-bold text-blue-900 dark:text-blue-200 block mb-1">
              Select Any Location From Map
            </span>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
              Tap or click any telemetry pin on the Singapore map to inspect real-time rainfall, temperature, wind velocity, local 2-hour forecast, and air quality.
            </p>
          </div>

          {/* Quick Location Pills */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
              Popular Singapore Locations
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {combinedStations.slice(0, 10).map((st) => (
                <button
                  key={st.id}
                  onClick={() => onSelectStation(st.id)}
                  className="p-2 rounded-xl text-left border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer flex flex-col justify-between"
                >
                  <span className="font-semibold text-slate-900 dark:text-white truncate text-xs">{st.name}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {st.temperature !== null ? `${st.temperature}°C` : `${st.rainfall ?? 0}mm rain`}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Island 24-Hour Summary */}
          {twentyFourHour && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                Singapore 24-Hr Outlook
              </span>
              <p className="text-slate-700 dark:text-slate-300 font-semibold">{twentyFourHour.general}</p>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700/40">
                <span>Temp: {twentyFourHour.temperatureLow}° - {twentyFourHour.temperatureHigh}°C</span>
                <span>RH: {twentyFourHour.humidityLow}% - {twentyFourHour.humidityHigh}%</span>
              </div>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 text-center">
          Monitoring {combinedStations.length} official NEA telemetry stations
        </div>
      </div>
    );
  }

  const isRaining = typeof currentStation.rainfall === 'number' && currentStation.rainfall > 0;

  return (
    <div className="h-full flex flex-col justify-between p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-l border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 overflow-y-auto no-scrollbar shadow-2xl transition-colors">
      <div className="space-y-4">
        {/* Header with Navigation Controls */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-500/20">
                STATION {currentStation.id}
              </span>
              {isRaining && (
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-500/20 px-1.5 py-0.5 rounded animate-pulse">
                  Rain Active
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 leading-snug">
              {currentStation.name}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {currentStation.latitude?.toFixed(4)}° N, {currentStation.longitude?.toFixed(4)}° E
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevStation}
              title="Previous location"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextStation}
              title="Next location"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Close panel"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Location Switcher Dropdown */}
        <div>
          <select
            value={currentStation.id}
            onChange={(e) => onSelectStation(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
          >
            {combinedStations.map((st) => (
              <option key={st.id} value={st.id} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                {st.name} ({st.id}) {st.rainfall > 0 ? `• ${st.rainfall}mm rain` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Main Telemetry Badges */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Temperature */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-amber-500" /> Temperature
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                {currentStation.temperature !== null ? `${currentStation.temperature}` : '--'}
              </span>
              <span className="text-xs font-bold text-amber-500">°C</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              RH: {currentStation.humidity ? `${currentStation.humidity}%` : '--'}
            </span>
          </div>

          {/* Rainfall */}
          <div className={`p-3 rounded-xl border ${
            isRaining
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-500/50'
              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/50'
          }`}>
            <span className="text-slate-500 dark:text-slate-400 text-[10px] flex items-center gap-1">
              <CloudRain className="w-3.5 h-3.5 text-blue-500" /> 5-Min Rainfall
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                {currentStation.rainfall !== null ? `${currentStation.rainfall}` : '0.0'}
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">mm</span>
            </div>
            <span className={`text-[10px] font-bold mt-0.5 block ${isRaining ? 'text-blue-700 dark:text-blue-300' : 'text-slate-400'}`}>
              {currentStation.intensityLabel || (isRaining ? 'Light Rain' : 'Dry')}
            </span>
          </div>

          {/* Relative Humidity */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Relative Humidity
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                {currentStation.humidity !== null ? `${currentStation.humidity}` : '--'}
              </span>
              <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">%</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Moisture Index
            </span>
          </div>

          {/* Wind Flow */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> Wind Velocity
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-extrabold text-slate-900 dark:text-white truncate">
                {currentStation.windSpeedKmH !== null ? `${currentStation.windSpeedKmH}` : '0'}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">km/h</span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 block truncate">
              {currentStation.windDirectionCardinal ? `${currentStation.windDirectionCardinal} (${currentStation.windDirectionDegrees}°)` : 'Calm'}
            </span>
          </div>
        </div>

        {/* Local Micro-Forecast for this location */}
        {matchedForecastArea && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 text-xs">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] block mb-1">
              Nearest Micro-Climate Zone: <strong className="text-slate-900 dark:text-white">{matchedForecastArea.area}</strong>
            </span>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2">
                {getForecastIcon(matchedForecastArea.forecast)}
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {matchedForecastArea.forecast}
                </span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                matchedForecastArea.isRain
                  ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30'
                  : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
              }`}>
                {matchedForecastArea.isRain ? 'Rain Expected' : 'Dry Forecast'}
              </span>
            </div>
          </div>
        )}

        {/* Local Air Quality (PSI) for this sector */}
        {matchedHazeRegion && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-slate-500 dark:text-slate-400 text-[10px] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                Air Quality ({matchedHazeRegion.name.toUpperCase()} REGION)
              </span>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                PSI {matchedHazeRegion.psi ?? '--'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700/40 text-[11px]">
              <span className="text-slate-600 dark:text-slate-400">1-Hr PM2.5:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {matchedHazeRegion.pm25OneHourly ? `${matchedHazeRegion.pm25OneHourly} µg/m³ (${matchedHazeRegion.pm25Band})` : 'Normal'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Observation Time & Telemetry Footer */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatTimeSGT(currentStation.lastObserved)} SGT
        </span>
        <button
          onClick={() => onSelectStation(null)}
          className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
        >
          View Islandwide
        </button>
      </div>
    </div>
  );
};
