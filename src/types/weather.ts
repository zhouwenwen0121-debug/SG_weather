/**
 * Type definitions for Singapore Weather Dashboard
 */

export interface WeatherStation {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  temperature: number | null; // °C
  humidity: number | null; // %
  windSpeedKnots: number | null;
  windSpeedKmH: number | null;
  windDirectionDegrees: number | null;
  windDirectionCardinal: string | null;
  rainfall: number | null; // mm in last 5 minutes
  lastObserved: string;
}

export interface WeatherSummary {
  temperatureAvg: number | null;
  temperatureMin: number | null;
  temperatureMax: number | null;
  humidityAvg: number | null;
  windSpeedAvg: number | null;
  totalStationsReporting: number;
  rainStationsReporting: number;
  activeRainingStations: number;
  maxObservedRainfall: number;
  generalForecast: string;
}

export interface TwoHourAreaForecast {
  area: string;
  latitude: number | null;
  longitude: number | null;
  forecast: string;
  isRain: boolean;
}

export interface TwentyFourHourForecast {
  general: string | null;
  temperatureHigh: number | null;
  temperatureLow: number | null;
  humidityHigh: number | null;
  humidityLow: number | null;
  windSpeed: { low: number; high: number } | null;
  windDirection: string | null;
  periods: Array<{
    time: { start: string; end: string; text: string };
    regions: Record<string, string>;
  }>;
}

export interface FourDayForecastItem {
  date: string;
  forecast: string;
  temperatureHigh: number | null;
  temperatureLow: number | null;
  humidityHigh: number | null;
  humidityLow: number | null;
  windSpeed: string | null;
  windDirection: string | null;
}

export interface WeatherResponse {
  updatedAt: string;
  upstreamStatus: number;
  stations: WeatherStation[];
  summary: WeatherSummary;
  forecast: {
    twoHourPeriod: { start: string; end: string; text: string } | null;
    twoHourAreas: TwoHourAreaForecast[];
    twentyFourHour: TwentyFourHourForecast | null;
    fourDay: FourDayForecastItem[];
  };
  source: string;
  fromCache?: boolean;
}

export interface RainStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  rainfall: number;
  hourlyRate: number;
  intensity: 'none' | 'light' | 'moderate' | 'heavy';
  intensityLabel: string;
}

export interface RainArea {
  area: string;
  latitude: number | null;
  longitude: number | null;
  forecast: string;
  isRainingNowOrExpected: boolean;
  intensity: 'none' | 'light' | 'moderate' | 'heavy';
}

export interface RainResponse {
  updatedAt: string;
  isRaining: boolean;
  totalStationCount: number;
  rainingStationCount: number;
  maxRainfall: number;
  intensityScale: Record<string, { range: string; description: string }>;
  radarStatus: {
    available: boolean;
    reason: string;
    officialPortalUrl: string;
  };
  stations: RainStation[];
  rainAreas: RainArea[];
  summary: string;
  source: string;
  fromCache?: boolean;
}

export interface HazeRegion {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  psi: number | null;
  psiCategory: string;
  psiColor: string;
  psiAdvisory: string;
  pm25OneHourly: number | null;
  pm25Band: string;
  pm25BandCode: string;
  pm25Color: string;
  pm25Advisory: string;
  subIndices: {
    pm10TwentyFourHourly: number | null;
    pm25TwentyFourHourly: number | null;
    o3EightHourMax: number | null;
    so2TwentyFourHourly: number | null;
    coEightHourMax: number | null;
    no2OneHourMax: number | null;
  };
}

export interface HazeResponse {
  updatedAt: string;
  overallPsi: number;
  overallCategory: string;
  overallColor: string;
  overallAdvisory: string;
  overallPm25: number;
  overallPm25Band: string;
  overallPm25BandCode: string;
  isHazy: boolean;
  hazeStatusText: string;
  regions: HazeRegion[];
  scales: {
    psi: Array<{ range: string; category: string; description: string }>;
    pm25: Array<{ band: string; label: string; description: string }>;
  };
  source: string;
  fromCache?: boolean;
}

export interface HealthResponse {
  keyConfigured: boolean;
  upstreamOk: boolean;
  upstreamStatus: number;
  endpoints: {
    airTemperature?: number;
    rainfall?: number;
    psi?: number;
  };
  service: string;
  timestamp: string;
}
