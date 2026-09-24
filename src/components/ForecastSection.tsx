import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  Search,
  Sun,
  CloudRain,
  CloudSun,
  CloudLightning,
  Droplets,
  Thermometer,
  Wind,
  Info,
} from 'lucide-react';
import { TwoHourAreaForecast, TwentyFourHourForecast, FourDayForecastItem } from '../types/weather';

interface ForecastSectionProps {
  twoHourAreas: TwoHourAreaForecast[];
  twoHourPeriod: { start: string; end: string; text: string } | null;
  twentyFourHour: TwentyFourHourForecast | null;
  fourDay: FourDayForecastItem[];
}

export const ForecastSection: React.FC<ForecastSectionProps> = ({
  twoHourAreas,
  twoHourPeriod,
  twentyFourHour,
  fourDay,
}) => {
  const [areaSearch, setAreaSearch] = useState('');
  const [filterRainOnly, setFilterRainOnly] = useState(false);

  const filteredAreas = twoHourAreas.filter((a) => {
    const match = a.area.toLowerCase().includes(areaSearch.toLowerCase());
    if (!match) return false;
    if (filterRainOnly) return a.isRain;
    return true;
  });

  const getForecastIcon = (fc: string) => {
    const text = fc.toLowerCase();
    if (text.includes('thunder')) return <CloudLightning className="w-5 h-5 text-amber-400" />;
    if (text.includes('rain') || text.includes('shower')) return <CloudRain className="w-5 h-5 text-blue-400" />;
    if (text.includes('cloud')) return <CloudSun className="w-5 h-5 text-sky-400" />;
    return <Sun className="w-5 h-5 text-amber-400" />;
  };

  return (
    <section id="forecast-section" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <CalendarDays className="w-5 h-5" />
            </span>
            What’s next?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Official NEA meteorological forecasts across micro-zones and multi-day outlooks
          </p>
        </div>

        {/* Clear Distinction Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          <Info className="w-3.5 h-3.5" />
          <span>Forward Predictions (Distinct from sensor observations)</span>
        </div>
      </div>

      {/* 24-Hour Island Outlook Card */}
      {twentyFourHour && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Official NEA 24-Hour Singapore Outlook
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white mt-1 flex items-center gap-2">
                {getForecastIcon(twentyFourHour.general || 'Fair')}
                <span>{twentyFourHour.general || 'Fair'}</span>
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Expected Temp</span>
                  <span className="font-bold text-white">
                    {twentyFourHour.temperatureLow ?? '--'}° - {twentyFourHour.temperatureHigh ?? '--'}°C
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-2">
                <Droplets className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Expected Humidity</span>
                  <span className="font-bold text-white">
                    {twentyFourHour.humidityLow ?? '--'}% - {twentyFourHour.humidityHigh ?? '--'}%
                  </span>
                </div>
              </div>

              {twentyFourHour.windSpeed && (
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-2">
                  <Wind className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Expected Wind</span>
                    <span className="font-bold text-white">
                      {twentyFourHour.windSpeed.low}-{twentyFourHour.windSpeed.high} km/h {twentyFourHour.windDirection ?? ''}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Regional 24-Hr Breakdown if available */}
          {twentyFourHour.periods && twentyFourHour.periods.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 block">Regional Outlook by Time Period:</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {twentyFourHour.periods.map((period, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <span className="font-bold text-blue-400 block mb-2">{period.time.text}</span>
                    <div className="grid grid-cols-2 gap-1.5 text-slate-300">
                      {Object.entries(period.regions).map(([reg, fc]) => (
                        <div key={reg} className="flex justify-between bg-slate-800/80 px-2 py-1 rounded">
                          <span className="capitalize text-slate-400">{reg}:</span>
                          <span className="font-medium text-white truncate max-w-[90px]">{fc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4-Day Extended Outlook */}
      {fourDay.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-400" />
            4-Day Extended Singapore Outlook
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {fourDay.map((item, idx) => {
              const dateObj = new Date(item.date);
              const dayName = isNaN(dateObj.getTime())
                ? `Day ${idx + 1}`
                : dateObj.toLocaleDateString('en-SG', { weekday: 'short', month: 'short', day: 'numeric' });

              return (
                <div
                  key={item.date}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        {dayName}
                      </span>
                      {getForecastIcon(item.forecast)}
                    </div>
                    <h4 className="text-sm font-semibold text-slate-200 leading-snug min-h-[38px]">
                      {item.forecast}
                    </h4>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Temperature</span>
                      <span className="font-bold text-white">
                        {item.temperatureLow}° - {item.temperatureHigh}°C
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Humidity</span>
                      <span className="font-semibold text-cyan-300">
                        {item.humidityLow}% - {item.humidityHigh}%
                      </span>
                    </div>
                    {item.windSpeed && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Wind</span>
                        <span className="font-medium text-emerald-300">{item.windSpeed}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2-Hour Micro-Area Forecasts (47 Planning Zones) */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                2-Hour Micro-Forecast Across 47 Singapore Planning Areas
              </h3>
              {twoHourPeriod && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
                  Valid: {twoHourPeriod.text || `${twoHourPeriod.start} - ${twoHourPeriod.end}`}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Micro-climate predictions for town councils and urban districts
            </p>
          </div>

          {/* Search & Rain filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search area (e.g. Bedok)..."
                value={areaSearch}
                onChange={(e) => setAreaSearch(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 w-44"
              />
            </div>
            <button
              onClick={() => setFilterRainOnly(!filterRainOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                filterRainOnly
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              Rain Only
            </button>
          </div>
        </div>

        {/* 47 Areas Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-80 overflow-y-auto pr-1">
          {filteredAreas.map((item) => (
            <div
              key={item.area}
              className={`p-2.5 rounded-xl border flex flex-col justify-between transition-colors ${
                item.isRain
                  ? 'bg-blue-950/40 border-blue-500/50 text-blue-200'
                  : 'bg-slate-800/50 border-slate-700/60 text-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="text-xs font-semibold text-white truncate max-w-[85px]">
                  {item.area}
                </span>
                {getForecastIcon(item.forecast)}
              </div>
              <span className={`text-[10px] mt-1.5 font-medium ${item.isRain ? 'text-blue-300 font-bold' : 'text-slate-400'}`}>
                {item.forecast}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
