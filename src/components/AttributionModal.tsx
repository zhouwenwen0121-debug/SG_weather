import React from 'react';
import { X, ExternalLink, ShieldCheck, Radio, RefreshCw } from 'lucide-react';

interface AttributionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AttributionModal: React.FC<AttributionModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-800 dark:text-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            <span>Official Government Data Attribution</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
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
          . This application is an independent open-access visualization dashboard and is not affiliated with, sponsored by, or endorsed by the National Environment Agency or the Government of Singapore.
        </p>

        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-500" />
            Telemetry Observational Streams
          </div>
          <ul className="space-y-1 text-[11px] list-disc list-inside text-slate-500 dark:text-slate-400">
            <li>Automated 5-min tipping-bucket rainfall gauges (43+ stations)</li>
            <li>Real-time air surface temperature & relative humidity</li>
            <li>Anemometer wind speed (km/h & knots) & cardinal direction vectors</li>
            <li>24-hr Pollutant Standards Index (PSI) & 1-hr PM2.5 bands</li>
            <li>2-hour micro-climate forecast predictions across 47 planning zones</li>
          </ul>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <RefreshCw className="w-3 h-3 text-blue-500" /> Auto-refreshes every 5 mins
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
