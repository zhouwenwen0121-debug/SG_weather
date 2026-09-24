import React from 'react';
import { MapPin, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { WeatherStation, RainStation } from '../types/weather';

export interface LocationItem {
  id: string;
  name: string;
  temperature: number | null;
  rainfall: number | null;
  intensityLabel?: string;
  sector?: string;
  isPopular?: boolean;
}

interface LocationSelectorProps {
  locations: LocationItem[];
  selectedLocationId: string | null;
  onSelectLocation: (id: string) => void;
  className?: string;
  showPills?: boolean;
}

export const POPULAR_LOCATIONS = [
  { id: 'S108', label: 'Marina Bay' },
  { id: 'S24', label: 'Changi Airport' },
  { id: 'S60', label: 'Sentosa' },
  { id: 'S111', label: 'Orchard / Newton' },
  { id: 'S109', label: 'Ang Mo Kio' },
  { id: 'S44', label: 'Jurong West' },
  { id: 'S104', label: 'Woodlands' },
  { id: 'S117', label: 'Clementi' },
  { id: 'S107', label: 'Bedok / ECP' },
  { id: 'S106', label: 'Pulau Ubin' },
];

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  locations,
  selectedLocationId,
  onSelectLocation,
  className = '',
  showPills = true,
}) => {
  const currentIndex = locations.findIndex((l) => l.id === selectedLocationId);

  const handlePrev = () => {
    if (locations.length === 0) return;
    const nextIdx = currentIndex <= 0 ? locations.length - 1 : currentIndex - 1;
    onSelectLocation(locations[nextIdx].id);
  };

  const handleNext = () => {
    if (locations.length === 0) return;
    const nextIdx = currentIndex >= locations.length - 1 ? 0 : currentIndex + 1;
    onSelectLocation(locations[nextIdx].id);
  };

  const popularIds = new Set(POPULAR_LOCATIONS.map((p) => p.id));
  const popularList = locations.filter((l) => popularIds.has(l.id));
  const otherList = locations.filter((l) => !popularIds.has(l.id));

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Primary Dropdown Control with Prev/Next Navigation */}
      <div className="flex items-center gap-1.5 w-full">
        {/* Map Pin Icon Badge */}
        <div className="flex items-center gap-1.5 px-2 py-1.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-500/30 rounded-xl text-blue-600 dark:text-blue-400 font-bold text-xs shrink-0">
          <MapPin className="w-3.5 h-3.5 text-blue-500" />
          <span className="hidden sm:inline">SG Location:</span>
        </div>

        {/* Previous Button */}
        <button
          onClick={handlePrev}
          title="Previous Singapore location"
          className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Drop Down List of Singapore Locations */}
        <div className="relative flex-1 min-w-0">
          <select
            value={selectedLocationId || ''}
            onChange={(e) => onSelectLocation(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border-2 border-blue-500/40 hover:border-blue-500 dark:border-blue-500/40 dark:hover:border-blue-400 text-slate-900 dark:text-white font-bold text-xs sm:text-sm rounded-xl px-3 py-1.5 pr-8 truncate transition-all shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            {popularList.length > 0 && (
              <optgroup label="🌟 Major Singapore Hubs & Districts">
                {popularList.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    📍 {loc.name} {loc.temperature !== null ? `(${loc.temperature}°C)` : ''} {loc.rainfall && loc.rainfall > 0 ? `• 🌧️ ${loc.rainfall}mm` : '• ☀️'}
                  </option>
                ))}
              </optgroup>
            )}

            <optgroup label="📡 All Singapore Weather & Rain Stations">
              {otherList.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} {loc.temperature !== null ? `(${loc.temperature}°C)` : ''} {loc.rainfall && loc.rainfall > 0 ? `• 🌧️ ${loc.rainfall}mm` : ''}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          title="Next Singapore location"
          className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Location Pills Bar */}
      {showPills && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0 mr-0.5">
            Quick Pick:
          </span>

          {POPULAR_LOCATIONS.map((p) => {
            const isSelected = selectedLocationId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectLocation(p.id)}
                className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] whitespace-nowrap transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-500 shadow-xs shadow-blue-500/30 ring-1 ring-blue-400'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
