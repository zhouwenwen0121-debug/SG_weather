import React from 'react';
import { ExternalLink, ShieldCheck, RefreshCw, Radio } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Main Attribution Notice */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs transition-colors">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-200 font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span>Official Government Data Attribution & Notice</span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            Contains information from the <strong>National Environment Agency (NEA)</strong> and <strong>data.gov.sg</strong>, accessed under the terms of the{' '}
            <a
              href="https://data.gov.sg/open-data-licence"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-semibold"
            >
              Singapore Open Data Licence
              <ExternalLink className="w-3 h-3" />
            </a>
            . This is an independent open-access project and is not affiliated with, sponsored by, or endorsed by the National Environment Agency or the Government of Singapore.
          </p>
        </div>

        {/* Technical Data Sources & Refresh Interval Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-200 dark:border-slate-900">
          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-2 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Real-Time Telemetry Datasets
            </h4>
            <ul className="space-y-1 text-slate-600 dark:text-slate-400">
              <li>• Automated 5-min Rainfall Gauges (43+ stations)</li>
              <li>• Surface Air Temperature Telemetry</li>
              <li>• Relative Humidity & Dew Point Sensors</li>
              <li>• Anemometer Wind Velocity & Compass Vectors</li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              Air Quality & Environment
            </h4>
            <ul className="space-y-1 text-slate-600 dark:text-slate-400">
              <li>• 24-Hour Pollutant Standards Index (PSI)</li>
              <li>• 1-Hour PM2.5 Regional Concentration Bands</li>
              <li>• 6 Core Ambient Pollutant Sub-Indices</li>
              <li>• Regional Planning Boundaries (N, S, E, W, C)</li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-2 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Update Cycle & Reliability
            </h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Data refreshes automatically approximately every 5 minutes in synchronization with official NEA telemetry release cycles. Intelligent server-side caching prevents upstream rate throttling.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <a
                href="https://www.nea.gov.sg"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-[11px] font-medium"
              >
                NEA Portal <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <a
                href="https://www.weather.gov.sg"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-[11px] font-medium"
              >
                MSS Singapore <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <a
                href="https://data.gov.sg"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-[11px] font-medium"
              >
                data.gov.sg <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright notice */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-900 text-center text-slate-500 dark:text-slate-400 text-[11px]">
          Singapore Weather & Rain Radar Visualization Dashboard • Built with official open government APIs
        </div>
      </div>
    </footer>
  );
};
