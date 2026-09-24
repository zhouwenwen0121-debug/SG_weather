import React, { useMemo } from 'react';
import {
  Thermometer,
  CloudRain,
  Droplets,
  Wind,
  Compass,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Calendar,
  CloudSun,
  Sun,
  CloudLightning,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Eye,
  CheckCircle2,
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
import { LocationSelector, LocationItem } from './LocationSelector';

interface LocationOverviewProps {
  selectedStationId: string | null;
  onSelectStation: (id: string) => void;
  combinedStations: any[];
  hazeRegions: HazeRegion[];
  twoHourAreas: TwoHourAreaForecast[];
  twentyFourHour: TwentyFourHourForecast | null;
  fourDay: FourDayForecastItem[];
}

export const LocationOverview: React.FC<LocationOverviewProps> = ({
  selectedStationId,
  onSelectStation,
  combinedStations,
  hazeRegions,
  twoHourAreas,
  twentyFourHour,
  fourDay,
}) => {
  const { isDark } = useTheme();

  // Find active station or fallback to first station
  const currentStation = useMemo(() => {
    if (combinedStations.length === 0) return null;
    const found = combinedStations.find((s) => s.id === selectedStationId);
    return found || combinedStations[0];
  }, [selectedStationId, combinedStations]);

  // Formatted location list for the dropdown
  const locationItems: LocationItem[] = useMemo(() => {
    return combinedStations.map((s) => ({
      id: s.id,
      name: s.name,
      temperature: s.temperature,
      rainfall: s.rainfall,
      intensityLabel: s.intensityLabel,
    }));
  }, [combinedStations]);

  // Nearest 2-Hour forecast micro-area
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

  // Determine geographic sector & matching Haze/PSI region
  const sectorInfo = useMemo(() => {
    if (!currentStation || !currentStation.latitude || !currentStation.longitude) {
      const defaultReg = hazeRegions.find((r) => r.id === 'central') || hazeRegions[0];
      return { sectorName: 'Central Sector', haze: defaultReg };
    }
    const lat = currentStation.latitude;
    const lon = currentStation.longitude;

    if (lat < 1.30) {
      return { sectorName: 'South Sector (Harbour / Islands)', haze: hazeRegions.find((r) => r.id === 'south') };
    }
    if (lat > 1.39) {
      return { sectorName: 'North Sector (Woodlands / Sembawang)', haze: hazeRegions.find((r) => r.id === 'north') };
    }
    if (lon > 103.90) {
      return { sectorName: 'East Sector (Changi / Bedok / Pasir Ris)', haze: hazeRegions.find((r) => r.id === 'east') };
    }
    if (lon < 103.75) {
      return { sectorName: 'West Sector (Jurong / Tuas / Clementi)', haze: hazeRegions.find((r) => r.id === 'west') };
    }
    return { sectorName: 'Central Sector (City / Ang Mo Kio)', haze: hazeRegions.find((r) => r.id === 'central') };
  }, [currentStation, hazeRegions]);

  // Calculate Feels-Like (Humidex / Apparent temperature)
  const feelsLike = useMemo(() => {
    if (!currentStation || currentStation.temperature === null) return null;
    const T = currentStation.temperature;
    const RH = currentStation.humidity ?? 75; // default 75% for SG
    // Vapor pressure e (hPa)
    const e = (RH / 100) * 6.105 * Math.exp((17.27 * T) / (237.7 + T));
    const fl = T + (5 / 9) * (e - 10);
    return Math.round(fl * 10) / 10;
  }, [currentStation]);

  // Forecast icon generator
  const getForecastIcon = (fc: string | undefined, size = 'w-5 h-5') => {
    if (!fc) return <Sun className={`${size} text-amber-500`} />;
    const text = fc.toLowerCase();
    if (text.includes('thunder')) return <CloudLightning className={`${size} text-amber-500`} />;
    if (text.includes('rain') || text.includes('shower')) return <CloudRain className={`${size} text-blue-500`} />;
    if (text.includes('cloud')) return <CloudSun className={`${size} text-sky-500`} />;
    return <Sun className={`${size} text-amber-500`} />;
  };

  // Wind force description
  const getWindDescription = (kmh: number | null) => {
    if (kmh === null || kmh === 0) return 'Calm';
    if (kmh <= 5) return 'Light Air';
    if (kmh <= 11) return 'Light Breeze';
    if (kmh <= 19) return 'Gentle Breeze';
    if (kmh <= 28) return 'Moderate Breeze';
    if (kmh <= 38) return 'Fresh Breeze';
    return 'Strong Wind';
  };

  // Humidity comfort
  const getHumidityComfort = (rh: number | null) => {
    if (rh === null) return 'Typical';
    if (rh < 60) return 'Dry (for SG)';
    if (rh <= 75) return 'Comfortable';
    if (rh <= 85) return 'Humid';
    return 'Very Humid';
  };

  if (!currentStation) return null;

  const isRaining = typeof currentStation.rainfall === 'number' && currentStation.rainfall > 0;
  const psiVal = sectorInfo.haze?.psi ?? 35;
  const pm25Val = sectorInfo.haze?.pm25OneHourly ?? 12;
  const psiCategory = sectorInfo.haze?.psiCategory || 'Good';

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 overflow-y-auto no-scrollbar select-none transition-colors">
      {/* 1. TOP CONTROL: Prominent Singapore Location Dropdown */}
      <div className="p-3 sm:p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 space-y-2">
        <LocationSelector
          locations={locationItems}
          selectedLocationId={currentStation.id}
          onSelectLocation={onSelectStation}
          showPills={true}
        />
      </div>

      <div className="p-3 sm:p-4 space-y-3.5">
        {/* 2. HERO LOCATION CARD: Name, Station ID, Micro-Climate Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white shadow-lg shadow-blue-500/15 relative overflow-hidden">
          {/* Subtle background radar circles */}
          <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />

          <div className="flex items-start justify-between gap-2 relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-md text-white border border-white/20">
                  NEA {currentStation.id}
                </span>
                <span className="text-xs text-blue-100 font-medium">
                  {sectorInfo.sectorName}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black mt-1 tracking-tight">
                {currentStation.name}
              </h2>
              <p className="text-[11px] text-blue-200 mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-cyan-300" />
                <span>{currentStation.latitude?.toFixed(4)}°N, {currentStation.longitude?.toFixed(4)}°E</span>
                <span>•</span>
                <span>Observed {formatTimeSGT(currentStation.lastObserved)} SGT</span>
              </p>
            </div>

            {/* Weather Condition Badge */}
            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-center shrink-0">
              {getForecastIcon(matchedForecastArea?.forecast, 'w-7 h-7 mx-auto')}
              <span className="text-[11px] font-bold block mt-1 leading-tight max-w-[80px]">
                {matchedForecastArea?.forecast || 'Fair Weather'}
              </span>
            </div>
          </div>

          {/* Primary Temperature & Feels Like */}
          <div className="mt-4 pt-3 border-t border-white/15 flex items-baseline justify-between relative z-10">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black tracking-tight">
                {currentStation.temperature !== null ? `${currentStation.temperature}` : '--'}
              </span>
              <span className="text-xl font-bold text-amber-300">°C</span>
              {feelsLike !== null && (
                <span className="text-xs text-blue-100 ml-1">
                  Feels like <strong className="text-white font-bold">{feelsLike}°C</strong>
                </span>
              )}
            </div>

            {/* Daily range if available */}
            {twentyFourHour?.temperatureLow && twentyFourHour?.temperatureHigh && (
              <div className="text-right text-[11px] text-blue-100">
                <span>Today's Range:</span>
                <p className="font-bold text-white text-xs">
                  {twentyFourHour.temperatureLow}° - {twentyFourHour.temperatureHigh}°C
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 3. FOUR CORE TELEMETRY GAUGES (Rainfall, Relative Humidity, Wind, PSI) */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
            Real-Time Location Telemetry
          </span>

          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {/* Gauge 1: 5-Minute Rainfall */}
            <div className={`p-3 rounded-2xl border transition-all ${
              isRaining
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-500 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60'
            }`}>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 font-semibold">
                  <CloudRain className={`w-3.5 h-3.5 ${isRaining ? 'text-blue-500 animate-bounce' : 'text-slate-400'}`} />
                  Rainfall (5-min)
                </span>
                {isRaining && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500 text-white animate-pulse">
                    Active
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-1 mt-1.5">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {currentStation.rainfall !== null ? `${currentStation.rainfall}` : '0.0'}
                </span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">mm</span>
              </div>

              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className={`font-bold ${isRaining ? 'text-blue-600 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}>
                  {currentStation.intensityLabel || (isRaining ? 'Light Showers' : 'Dry / Clear')}
                </span>
                <span className="text-[10px] text-slate-400">
                  Rate: {currentStation.hourlyRate ? `${currentStation.hourlyRate} mm/h` : '0 mm/h'}
                </span>
              </div>
            </div>

            {/* Gauge 2: Relative Humidity */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 font-semibold">
                  <Droplets className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  Relative Humidity
                </span>
              </div>

              <div className="flex items-baseline gap-1 mt-1.5">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {currentStation.humidity !== null ? `${currentStation.humidity}` : '--'}
                </span>
                <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">%</span>
              </div>

              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                  {getHumidityComfort(currentStation.humidity)}
                </span>
                <span className="text-[10px] text-slate-400">Tropical Band</span>
              </div>
            </div>

            {/* Gauge 3: Wind Velocity & Cardinal Compass */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 font-semibold">
                  <Wind className="w-3.5 h-3.5 text-emerald-500" />
                  Wind Velocity
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {currentStation.windSpeedKnots !== null ? `${currentStation.windSpeedKnots} kts` : ''}
                </span>
              </div>

              <div className="flex items-baseline gap-1 mt-1.5">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {currentStation.windSpeedKmH !== null ? `${currentStation.windSpeedKmH}` : '0'}
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">km/h</span>
              </div>

              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <Compass className="w-3 h-3" />
                  {currentStation.windDirectionCardinal ? `${currentStation.windDirectionCardinal} (${currentStation.windDirectionDegrees}°)` : 'Variable'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {getWindDescription(currentStation.windSpeedKmH)}
                </span>
              </div>
            </div>

            {/* Gauge 4: Air Quality & Haze (PSI + PM2.5) */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Air Quality (PSI)
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {psiCategory}
                </span>
              </div>

              <div className="flex items-baseline gap-1 mt-1.5">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {psiVal}
                </span>
                <span className="text-xs font-bold text-slate-400">24-hr PSI</span>
              </div>

              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  PM2.5: <strong className="text-slate-900 dark:text-white">{pm25Val} µg/m³</strong>
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  Normal Outdoor
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. OFFICIAL 2-HOUR MICRO-CLIMATE FORECAST */}
        {matchedForecastArea && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                2-Hour Micro-Climate ({matchedForecastArea.area})
              </span>
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                Official NEA Area Forecast
              </span>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50">
                {getForecastIcon(matchedForecastArea.forecast, 'w-6 h-6')}
              </div>
              <div className="flex-1">
                <span className="font-bold text-sm text-slate-900 dark:text-white block">
                  {matchedForecastArea.forecast}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Valid for immediate 2-hour window across {matchedForecastArea.area} planning area.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 5. 24-HOUR REGIONAL OUTLOOK (Morning, Afternoon, Night) */}
        {twentyFourHour && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                24-Hour Regional Outlook
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {twentyFourHour.windDirection ? `Wind: ${twentyFourHour.windDirection}` : ''}
              </span>
            </div>

            <p className="text-slate-700 dark:text-slate-300 font-semibold text-xs leading-relaxed">
              {twentyFourHour.general}
            </p>

            {/* Time periods if available */}
            {twentyFourHour.periods && twentyFourHour.periods.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1">
                {twentyFourHour.periods.map((period, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/50 text-[11px]"
                  >
                    <span className="font-bold text-slate-500 dark:text-slate-400 block text-[10px]">
                      {period.time.text}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block truncate">
                      {period.regions[sectorInfo.sectorName.split(' ')[0].toLowerCase()] ||
                       period.regions.central ||
                       'Fair'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6. 4-DAY EXTENDED OUTLOOK */}
        {fourDay && fourDay.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-2.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              Singapore 4-Day Extended Outlook
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {fourDay.slice(0, 4).map((day, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/50 text-center flex flex-col items-center justify-between"
                >
                  <span className="font-bold text-slate-500 dark:text-slate-400 text-[10px]">
                    {day.date}
                  </span>
                  <div className="my-1.5">
                    {getForecastIcon(day.forecast, 'w-6 h-6 mx-auto')}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-900 dark:text-white truncate max-w-full">
                    {day.forecast}
                  </span>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {day.temperatureLow}° - {day.temperatureHigh}°C
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
