import React, { useState, useMemo } from 'react';
import {
  Radio,
  Search,
  Thermometer,
  CloudRain,
  Droplets,
  Wind,
  MapPin,
  ArrowUpDown,
} from 'lucide-react';
import { WeatherStation } from '../types/weather';
import { formatTimeSGT } from '../utils/geo';

interface WeatherStationsListProps {
  stations: WeatherStation[];
  onSelectStation: (stationId: string) => void;
  selectedStationId: string | null;
}

type FilterType = 'all' | 'temp' | 'rain' | 'wind';
type SortType = 'name' | 'temp-desc' | 'temp-asc' | 'rain-desc' | 'wind-desc';

export const WeatherStationsList: React.FC<WeatherStationsListProps> = ({
  stations,
  onSelectStation,
  selectedStationId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('temp-desc');

  const filteredAndSorted = useMemo(() => {
    let result = stations.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;

      if (activeFilter === 'temp') return typeof s.temperature === 'number';
      if (activeFilter === 'rain') return typeof s.rainfall === 'number' && s.rainfall > 0;
      if (activeFilter === 'wind') return typeof s.windSpeedKmH === 'number';
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'temp-desc') return (b.temperature ?? -99) - (a.temperature ?? -99);
      if (sortBy === 'temp-asc') return (a.temperature ?? 99) - (b.temperature ?? 99);
      if (sortBy === 'rain-desc') return (b.rainfall ?? -1) - (a.rainfall ?? -1);
      if (sortBy === 'wind-desc') return (b.windSpeedKmH ?? -1) - (a.windSpeedKmH ?? -1);
      return 0;
    });

    return result;
  }, [stations, searchQuery, activeFilter, sortBy]);

  return (
    <section id="stations-section" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Radio className="w-5 h-5" />
            </span>
            Live observations
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time telemetry observations across {stations.length} official Singapore meteorological stations
          </p>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Showing <strong className="text-slate-900 dark:text-white font-bold">{filteredAndSorted.length}</strong> stations
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md transition-colors">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search station name or ID (e.g. Changi, Sentosa, S109, Jurong)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 no-scrollbar text-xs">
          {[
            { id: 'all', label: 'All Stations' },
            { id: 'temp', label: 'Temperature' },
            { id: 'rain', label: 'Active Rain' },
            { id: 'wind', label: 'Wind Sensors' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as FilterType)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeFilter === f.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            className="bg-transparent text-slate-900 dark:text-white focus:outline-none cursor-pointer text-xs font-medium"
          >
            <option value="temp-desc" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Highest Temp</option>
            <option value="temp-asc" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Lowest Temp</option>
            <option value="rain-desc" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Highest Rain</option>
            <option value="wind-desc" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Strongest Wind</option>
            <option value="name" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Station Name</option>
          </select>
        </div>
      </div>

      {/* Stations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {filteredAndSorted.map((station) => {
          const isSelected = selectedStationId === station.id;
          const hasRain = typeof station.rainfall === 'number' && station.rainfall > 0;

          return (
            <div
              key={station.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between shadow-xs ${
                isSelected
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-md shadow-blue-500/20 ring-1 ring-blue-500'
                  : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-850'
              }`}
            >
              <div>
                {/* Station Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-500/20">
                        {station.id}
                      </span>
                      {hasRain && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-300 font-bold animate-pulse">
                          Raining
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1 leading-snug">
                      {station.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {station.latitude?.toFixed(4)}° N, {station.longitude?.toFixed(4)}° E
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      onSelectStation(station.id);
                      const mapEl = document.getElementById('map-top');
                      if (mapEl) mapEl.scrollIntoView({ behavior: 'smooth' });
                    }}
                    title="View and focus on map"
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-white hover:bg-blue-600 dark:hover:bg-blue-600 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-4 h-4" />
                  </button>
                </div>

                {/* Sensor Values Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Temperature */}
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-amber-500 dark:text-amber-400" /> Temperature
                    </span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                      {station.temperature !== null ? `${station.temperature}°C` : '--'}
                    </span>
                  </div>

                  {/* Relative Humidity */}
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> Humidity
                    </span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                      {station.humidity !== null ? `${station.humidity}%` : '--'}
                    </span>
                  </div>

                  {/* Rainfall */}
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] flex items-center gap-1">
                      <CloudRain className="w-3 h-3 text-blue-500 dark:text-blue-400" /> 5-Min Rain
                    </span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                      {typeof station.rainfall === 'number' ? `${station.rainfall} mm` : '0.0 mm'}
                    </span>
                  </div>

                  {/* Wind */}
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] flex items-center gap-1">
                      <Wind className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> Wind Flow
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white mt-1 block truncate">
                      {station.windSpeedKmH !== null
                        ? `${station.windSpeedKmH} km/h ${station.windDirectionCardinal ?? ''}`
                        : 'Calm'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Observed: {formatTimeSGT(station.lastObserved)} SGT</span>
                <button
                  onClick={() => {
                    onSelectStation(station.id);
                    const mapEl = document.getElementById('map-top');
                    if (mapEl) mapEl.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-semibold cursor-pointer"
                >
                  Locate &rarr;
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
