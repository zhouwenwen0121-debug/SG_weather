import React, { useState, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CloudRain,
  Thermometer,
  Wind,
  ShieldAlert,
  Info,
  Compass,
  MapPin,
  X,
  Search,
  Check,
} from 'lucide-react';
import {
  projectGeoToSvg,
  MAINLAND_PATH,
  ISLANDS_PATHS,
  RESERVOIRS,
  SVG_WIDTH,
  SVG_HEIGHT,
  formatTimeSGT,
} from '../utils/geo';
import { WeatherStation, RainStation, HazeRegion, TwoHourAreaForecast } from '../types/weather';
import { useTheme } from '../context/ThemeContext';

interface SingaporeMapProps {
  weatherStations: WeatherStation[];
  rainStations: RainStation[];
  hazeRegions: HazeRegion[];
  twoHourAreas: TwoHourAreaForecast[];
  selectedStationId: string | null;
  onSelectStation: (stationId: string | null) => void;
  isRaining: boolean;
}

export type MapLayer = 'rain' | 'temperature' | 'haze' | 'wind';

// Key Singapore locations for the top quick-toggle bar
const POPULAR_LOCATIONS = [
  { id: 'S108', label: 'Marina Barrage' },
  { id: 'S24', label: 'Changi' },
  { id: 'S60', label: 'Sentosa' },
  { id: 'S109', label: 'Ang Mo Kio' },
  { id: 'S44', label: 'Jurong West' },
  { id: 'S104', label: 'Woodlands' },
  { id: 'S117', label: 'Clementi' },
  { id: 'S111', label: 'Newton/Orchard' },
  { id: 'S106', label: 'Pulau Ubin' },
  { id: 'S43', label: 'Tai Seng' },
];

export const SingaporeMap: React.FC<SingaporeMapProps> = ({
  weatherStations,
  rainStations,
  hazeRegions,
  twoHourAreas,
  selectedStationId,
  onSelectStation,
  isRaining,
}) => {
  const { isDark } = useTheme();
  const [activeLayer, setActiveLayer] = useState<MapLayer>('rain');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredStation, setHoveredStation] = useState<any | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Combine weather stations with rain data for unified map markers
  const combinedStations = useMemo(() => {
    const rainMap = new Map<string, RainStation>();
    rainStations.forEach((r) => rainMap.set(r.id, r));

    const map = new Map<string, any>();

    // 1. Add weather stations
    weatherStations.forEach((w) => {
      if (w.latitude && w.longitude) {
        const rain = rainMap.get(w.id);
        map.set(w.id, {
          ...w,
          rainfall: rain ? rain.rainfall : (w.rainfall ?? 0),
          hourlyRate: rain ? rain.hourlyRate : (w.rainfall ? w.rainfall * 12 : 0),
          intensity: rain ? rain.intensity : (w.rainfall && w.rainfall > 0 ? 'light' : 'none'),
        });
      }
    });

    // 2. Add rain stations
    rainStations.forEach((r) => {
      if (!map.has(r.id) && r.latitude && r.longitude) {
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
          lastObserved: new Date().toISOString(),
        });
      }
    });

    return Array.from(map.values());
  }, [weatherStations, rainStations]);

  // Selected station
  const activeStation = useMemo(() => {
    if (!selectedStationId) return null;
    return combinedStations.find((s) => s.id === selectedStationId) || null;
  }, [selectedStationId, combinedStations]);

  // Rainfall color mapping
  const getRainMarkerColor = (intensity: string, rainfall: number) => {
    if (intensity === 'heavy' || rainfall > 0.8) return { fill: '#ec4899', stroke: '#be185d', ring: 'rgba(236,72,153,0.4)' };
    if (intensity === 'moderate' || rainfall > 0.2) return { fill: '#3b82f6', stroke: '#1d4ed8', ring: 'rgba(59,130,246,0.4)' };
    if (intensity === 'light' || rainfall > 0) return { fill: '#06b6d4', stroke: '#0891b2', ring: 'rgba(6,182,212,0.3)' };
    return { fill: '#10b981', stroke: '#059669', ring: 'rgba(16,185,129,0.15)' };
  };

  // Temperature color mapping
  const getTempColor = (temp: number | null) => {
    if (temp === null) return '#64748b';
    if (temp >= 32) return '#ef4444';
    if (temp >= 30) return '#f97316';
    if (temp >= 28) return '#eab308';
    if (temp >= 26) return '#10b981';
    return '#06b6d4';
  };

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => {
      const next = Math.min(Math.max(prev + delta, 0.9), 2.5);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleToggleStation = (stationId: string) => {
    if (selectedStationId === stationId) {
      onSelectStation(null);
    } else {
      onSelectStation(stationId);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-white dark:bg-slate-950 overflow-hidden select-none transition-colors">
      {/* Top Map Toolbar: Layers, Quick Location Toggle Bar, Zoom */}
      <div className="z-20 p-2.5 sm:p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 space-y-2 shrink-0 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Layer Selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
            <button
              onClick={() => setActiveLayer('rain')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeLayer === 'rain'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" />
              <span>Rain</span>
              {isRaining && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              )}
            </button>

            <button
              onClick={() => setActiveLayer('temperature')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeLayer === 'temperature'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Thermometer className="w-3.5 h-3.5" />
              <span>Temp</span>
            </button>

            <button
              onClick={() => setActiveLayer('haze')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeLayer === 'haze'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>PSI</span>
            </button>

            <button
              onClick={() => setActiveLayer('wind')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeLayer === 'wind'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Wind className="w-3.5 h-3.5" />
              <span>Wind</span>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
            <button
              onClick={() => handleZoom(0.25)}
              title="Zoom in"
              className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleZoom(-0.25)}
              title="Zoom out"
              className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              title="Reset Singapore view"
              className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Location Toggle Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 text-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-blue-500" />
            Toggle Location:
          </span>

          {POPULAR_LOCATIONS.map((loc) => {
            const isSelected = selectedStationId === loc.id;
            return (
              <button
                key={loc.id}
                onClick={() => handleToggleStation(loc.id)}
                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-500/30'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {loc.label}
              </button>
            );
          })}

          {selectedStationId && (
            <button
              onClick={() => onSelectStation(null)}
              className="px-2 py-1 rounded-lg text-[11px] font-medium text-slate-400 hover:text-slate-700 dark:hover:text-white underline cursor-pointer shrink-0 ml-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main SVG Visualization Canvas filling remaining flex height */}
      <div className="flex-1 w-full relative flex items-center justify-center bg-gradient-to-b from-sky-50 via-slate-50 to-blue-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-300 ease-out"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
          }}
        >
          <defs>
            {/* Singapore Mainland Gradients */}
            <linearGradient id="mainlandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              {isDark ? (
                <>
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="50%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#1e293b" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="50%" stopColor="#f8fafc" />
                  <stop offset="100%" stopColor="#f1f5f9" />
                </>
              )}
            </linearGradient>

            {/* Glowing filter for active rain stations */}
            <filter id="rainGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Water body pattern */}
            <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              {isDark ? (
                <>
                  <stop offset="0%" stopColor="#090d16" />
                  <stop offset="100%" stopColor="#020617" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#e0f2fe" />
                  <stop offset="100%" stopColor="#bae6fd" />
                </>
              )}
            </linearGradient>
          </defs>

          {/* Background Ocean / Singapore Straits */}
          <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#waterGradient)" />

          {/* Coordinate grid lines */}
          <g stroke={isDark ? '#334155' : '#94a3b8'} strokeWidth="0.5" strokeDasharray="3 3" opacity={isDark ? '0.35' : '0.45'}>
            <line x1="200" y1="0" x2="200" y2={SVG_HEIGHT} />
            <line x1="400" y1="0" x2="400" y2={SVG_HEIGHT} />
            <line x1="600" y1="0" x2="600" y2={SVG_HEIGHT} />
            <line x1="0" y1="120" x2={SVG_WIDTH} y2="120" />
            <line x1="0" y1="240" x2={SVG_WIDTH} y2="240" />
            <line x1="0" y1="360" x2={SVG_WIDTH} y2="360" />
          </g>

          {/* Regional Boundaries */}
          <g opacity="0.4" stroke={isDark ? '#475569' : '#64748b'} strokeWidth="1" strokeDasharray="2 4">
            <path d="M 330 50 Q 340 180 320 280 Q 300 320 270 330" fill="none" />
            <path d="M 520 80 Q 510 180 520 260 Q 530 300 500 330" fill="none" />
            <path d="M 320 180 Q 430 180 515 185" fill="none" />
          </g>

          {/* Singapore Mainland */}
          <path
            d={MAINLAND_PATH}
            fill="url(#mainlandGradient)"
            stroke={isDark ? '#38bdf8' : '#0284c7'}
            strokeWidth="1.6"
            strokeLinejoin="round"
            className={isDark ? 'filter drop-shadow-[0_4px_12px_rgba(56,189,248,0.15)]' : 'filter drop-shadow-[0_3px_8px_rgba(2,132,199,0.15)]'}
          />

          {/* Offshore Islands */}
          {ISLANDS_PATHS.map((island) => (
            <path
              key={island.name}
              d={island.d}
              fill={isDark ? '#1e293b' : '#f8fafc'}
              stroke={isDark ? '#38bdf8' : '#0284c7'}
              strokeWidth="1.2"
              strokeLinejoin="round"
              className={isDark ? 'hover:fill-slate-700 transition-colors' : 'hover:fill-slate-200 transition-colors'}
            >
              <title>{island.name}</title>
            </path>
          ))}

          {/* Reservoirs & Water Bodies */}
          {RESERVOIRS.map((res) => (
            <path
              key={res.name}
              d={res.d}
              fill={isDark ? '#0284c7' : '#38bdf8'}
              fillOpacity={isDark ? '0.4' : '0.6'}
              stroke={isDark ? '#0ea5e9' : '#0284c7'}
              strokeWidth="0.8"
            >
              <title>{res.name}</title>
            </path>
          ))}

          {/* Regional Planning Labels */}
          <g fontSize="10" fontWeight="600" fill={isDark ? '#64748b' : '#475569'} letterSpacing="1">
            <text x="375" y="85" textAnchor="middle">NORTH</text>
            <text x="210" y="210" textAnchor="middle">WEST</text>
            <text x="425" y="215" textAnchor="middle">CENTRAL</text>
            <text x="640" y="210" textAnchor="middle">EAST</text>
            <text x="440" y="340" textAnchor="middle">SOUTH</text>
          </g>

          {/* LAYER 1: RAIN */}
          {activeLayer === 'rain' && (
            <>
              {/* Rain forecast micro-areas */}
              {twoHourAreas.map((area) => {
                if (!area.latitude || !area.longitude) return null;
                const pt = projectGeoToSvg(area.latitude, area.longitude);
                if (area.isRain) {
                  return (
                    <g key={`area-rain-${area.area}`} className="animate-pulse">
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="18"
                        fill="rgba(59,130,246,0.25)"
                        stroke="#3b82f6"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                      />
                      <text
                        x={pt.x}
                        y={pt.y - 12}
                        fontSize="8"
                        fill={isDark ? '#93c5fd' : '#1d4ed8'}
                        textAnchor="middle"
                        fontWeight="700"
                      >
                        {area.forecast}
                      </text>
                    </g>
                  );
                }
                return null;
              })}

              {/* Rain Telemetry Station Markers */}
              {combinedStations.map((station) => {
                const pt = projectGeoToSvg(station.latitude, station.longitude);
                const colors = getRainMarkerColor(station.intensity, station.rainfall);
                const hasRain = station.rainfall > 0;
                const isSelected = selectedStationId === station.id;

                return (
                  <g
                    key={`rain-${station.id}`}
                    className="cursor-pointer transition-transform hover:scale-125"
                    onClick={() => handleToggleStation(station.id)}
                    onMouseEnter={() => setHoveredStation(station)}
                    onMouseLeave={() => setHoveredStation(null)}
                  >
                    {/* Targeting reticle if selected */}
                    {isSelected && (
                      <g className="animate-spin-slow">
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="16"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                        />
                      </g>
                    )}

                    {/* Pulsing ring for rain stations */}
                    {hasRain && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={10 + station.rainfall * 6}
                        fill={colors.ring}
                        className="animate-ping"
                      />
                    )}

                    {/* Outer Ring */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? 8 : hasRain ? 6 : 4.5}
                      fill={isSelected ? '#3b82f6' : colors.fill}
                      stroke={isSelected ? '#ffffff' : colors.stroke}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      filter={hasRain ? 'url(#rainGlow)' : undefined}
                    />

                    {/* Small center dot */}
                    <circle cx={pt.x} cy={pt.y} r={1.5} fill="#ffffff" />

                    {/* Station Name & Reading Badge */}
                    {(hasRain || isSelected) && (
                      <g>
                        <rect
                          x={pt.x - 34}
                          y={pt.y - 22}
                          width="68"
                          height="16"
                          rx="4"
                          fill={isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)'}
                          stroke={isSelected ? '#3b82f6' : colors.stroke}
                          strokeWidth={isSelected ? 1.5 : 0.8}
                          className="filter drop-shadow-sm"
                        />
                        <text
                          x={pt.x}
                          y={pt.y - 11}
                          fontSize="8"
                          fontWeight="700"
                          fill={isDark ? '#ffffff' : '#0f172a'}
                          textAnchor="middle"
                        >
                          {station.name.slice(0, 9)}: {station.rainfall > 0 ? `${station.rainfall}mm` : '0mm'}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </>
          )}

          {/* LAYER 2: TEMPERATURE */}
          {activeLayer === 'temperature' && (
            <g>
              {combinedStations.map((station) => {
                if (station.temperature === null) return null;
                const pt = projectGeoToSvg(station.latitude, station.longitude);
                const color = getTempColor(station.temperature);
                const isSelected = selectedStationId === station.id;

                return (
                  <g
                    key={`temp-${station.id}`}
                    className="cursor-pointer transition-transform hover:scale-125"
                    onClick={() => handleToggleStation(station.id)}
                    onMouseEnter={() => setHoveredStation(station)}
                    onMouseLeave={() => setHoveredStation(null)}
                  >
                    {isSelected && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="18"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2"
                        strokeDasharray="3 3"
                        className="animate-spin-slow"
                      />
                    )}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? 15 : 11}
                      fill={color}
                      fillOpacity={isDark ? '0.85' : '0.92'}
                      stroke={isSelected ? '#ffffff' : isDark ? '#0f172a' : '#ffffff'}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      className="filter drop-shadow-md"
                    />
                    <text
                      x={pt.x}
                      y={pt.y + 3.5}
                      fontSize="9"
                      fontWeight="700"
                      fill="#ffffff"
                      textAnchor="middle"
                    >
                      {station.temperature}°
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* LAYER 3: HAZE & PSI */}
          {activeLayer === 'haze' && (
            <g>
              {hazeRegions.map((region) => {
                if (!region.latitude || !region.longitude) return null;
                const pt = projectGeoToSvg(region.latitude, region.longitude);

                const psi = region.psi ?? 0;
                let bgFill = '#10b981';
                let borderColor = '#059669';
                if (psi > 100) {
                  bgFill = '#f59e0b';
                  borderColor = '#d97706';
                } else if (psi > 50) {
                  bgFill = '#3b82f6';
                  borderColor = '#2563eb';
                }

                return (
                  <g key={`haze-${region.id}`} className="transition-all hover:scale-110">
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="32"
                      fill={bgFill}
                      fillOpacity="0.2"
                      stroke={borderColor}
                      strokeWidth="1.5"
                    />
                    <rect
                      x={pt.x - 35}
                      y={pt.y - 20}
                      width="70"
                      height="40"
                      rx="8"
                      fill={isDark ? '#0f172a' : '#ffffff'}
                      stroke={borderColor}
                      strokeWidth="1.5"
                      className="filter drop-shadow-lg"
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 6}
                      fontSize="9"
                      fontWeight="700"
                      fill={isDark ? '#94a3b8' : '#475569'}
                      textAnchor="middle"
                    >
                      {region.name.toUpperCase()}
                    </text>
                    <text
                      x={pt.x}
                      y={pt.y + 11}
                      fontSize="12"
                      fontWeight="800"
                      fill={isDark ? '#ffffff' : '#0f172a'}
                      textAnchor="middle"
                    >
                      PSI {region.psi ?? '--'}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* LAYER 4: WIND VECTORS */}
          {activeLayer === 'wind' && (
            <g>
              {combinedStations.map((station) => {
                if (station.windSpeedKmH === null || station.windDirectionDegrees === null) return null;
                const pt = projectGeoToSvg(station.latitude, station.longitude);
                const rot = station.windDirectionDegrees;
                const isSelected = selectedStationId === station.id;

                return (
                  <g
                    key={`wind-${station.id}`}
                    className="cursor-pointer transition-transform hover:scale-125"
                    onClick={() => handleToggleStation(station.id)}
                    onMouseEnter={() => setHoveredStation(station)}
                    onMouseLeave={() => setHoveredStation(null)}
                  >
                    <g transform={`translate(${pt.x}, ${pt.y}) rotate(${rot})`}>
                      <line x1="0" y1="8" x2="0" y2="-12" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                      <polygon points="0,-16 -4,-9 4,-9" fill="#10b981" />
                    </g>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      fill={isDark ? '#0f172a' : '#ffffff'}
                      stroke="#10b981"
                      strokeWidth="1"
                    />
                    <rect
                      x={pt.x - 18}
                      y={pt.y + 8}
                      width="36"
                      height="12"
                      rx="3"
                      fill={isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.92)'}
                      stroke="#10b981"
                      strokeWidth="0.5"
                    />
                    <text
                      x={pt.x}
                      y={pt.y + 17}
                      fontSize="7"
                      fontWeight="700"
                      fill={isDark ? '#ffffff' : '#0f172a'}
                      textAnchor="middle"
                    >
                      {station.windSpeedKmH} km/h
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </svg>

        {/* Quick Location Tap Reminder Pill */}
        <div className="absolute bottom-3 left-3 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 shadow-sm flex items-center gap-1.5 pointer-events-none">
          <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>Click any marker on the map to toggle its weather details</span>
        </div>
      </div>
    </div>
  );
};
