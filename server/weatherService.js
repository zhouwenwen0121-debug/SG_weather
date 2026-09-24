/**
 * Shared Weather Service for Singapore Weather Visualization App
 * Connects to official data.gov.sg & NEA endpoints.
 * Handles caching, upstream error recovery, and normalization.
 */

const DATA_GOV_BASE = 'https://api.data.gov.sg/v1/environment';

// In-memory cache to prevent excessive requests to official APIs
const cache = {
  weather: { data: null, expiresAt: 0 },
  rain: { data: null, expiresAt: 0 },
  haze: { data: null, expiresAt: 0 },
  health: { data: null, expiresAt: 0 },
};

const CACHE_TTL_MS = 60 * 1000; // 60 seconds cache

function getHeaders() {
  const headers = {
    'Accept': 'application/json',
    'User-Agent': 'SingaporeWeatherDashboard/1.0',
  };
  const key = process.env.DATA_GOV_SG_API_KEY || process.env.NEA_API_KEY;
  if (key) {
    headers['x-api-key'] = key;
  }
  return headers;
}

/**
 * Fetch helper with timeout and graceful error reporting
 */
async function fetchOfficial(endpoint, query = '') {
  const url = `${DATA_GOV_BASE}/${endpoint}${query ? `?${query}` : ''}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      headers: getHeaders(),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { ok: false, status: res.status, data: null };
    }
    const data = await res.json();
    return { ok: true, status: 200, data };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      ok: false,
      status: err.name === 'AbortError' ? 504 : 502,
      error: err.message,
      data: null,
    };
  }
}

/**
 * Converts wind degrees to cardinal direction
 */
function degreesToCardinal(deg) {
  if (deg === null || deg === undefined || isNaN(deg)) return null;
  const val = Math.floor((deg / 22.5) + 0.5);
  const arr = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return arr[(val % 16)];
}

/**
 * Classify rainfall intensity based on Meteorological Service Singapore (MSS) / NEA definitions:
 * - None: 0.0 mm/5min
 * - Light: 0.01 - 0.2 mm/5min (< 2.5 mm/h)
 * - Moderate: 0.21 - 0.8 mm/5min (2.5 - 10 mm/h)
 * - Heavy: > 0.8 mm/5min (> 10 mm/h)
 */
export function classifyRainfall(mm5min) {
  if (mm5min === null || mm5min === undefined || mm5min <= 0) {
    return { category: 'none', label: 'No significant rain', hourlyEquivalent: 0 };
  }
  const hourly = Math.round(mm5min * 12 * 10) / 10;
  if (mm5min <= 0.2) {
    return { category: 'light', label: 'Light rain / Drizzle', hourlyEquivalent: hourly };
  }
  if (mm5min <= 0.8) {
    return { category: 'moderate', label: 'Moderate rain / Steady showers', hourlyEquivalent: hourly };
  }
  return { category: 'heavy', label: 'Heavy rain / Downpour', hourlyEquivalent: hourly };
}

/**
 * Categorize PSI per NEA official bands
 */
export function getPsiCategory(psi) {
  if (psi === null || psi === undefined) return { category: 'Unknown', color: 'gray', level: 0 };
  if (psi <= 50) return { category: 'Good', color: 'emerald', level: 1, advisory: 'Normal outdoor activities' };
  if (psi <= 100) return { category: 'Moderate', color: 'blue', level: 2, advisory: 'Normal outdoor activities' };
  if (psi <= 200) return { category: 'Unhealthy', color: 'amber', level: 3, advisory: 'Reduce prolonged strenuous outdoor physical exertion' };
  if (psi <= 300) return { category: 'Very Unhealthy', color: 'orange', level: 4, advisory: 'Avoid prolonged strenuous outdoor physical exertion' };
  return { category: 'Hazardous', color: 'rose', level: 5, advisory: 'Minimize outdoor activity' };
}

/**
 * Categorize 1-hr PM2.5 per NEA official bands
 */
export function getPm25Band(pm25) {
  if (pm25 === null || pm25 === undefined) return { band: 'Unknown', code: 'Band 0', color: 'gray' };
  if (pm25 <= 55) return { band: 'Normal', code: 'Band I', color: 'emerald', advisory: 'Normal outdoor activities' };
  if (pm25 <= 150) return { band: 'Elevated', code: 'Band II', color: 'amber', advisory: 'Persons with heart or lung diseases should reduce strenuous outdoor activity' };
  if (pm25 <= 250) return { band: 'High', code: 'Band III', color: 'orange', advisory: 'Vulnerable persons should avoid strenuous outdoor activity' };
  return { band: 'Very High', code: 'Band IV', color: 'rose', advisory: 'Everyone should minimize outdoor activity' };
}

/**
 * 1. GET WEATHER
 */
export async function getWeatherData(forceFresh = false) {
  const now = Date.now();
  if (!forceFresh && cache.weather.data && cache.weather.expiresAt > now) {
    return { ...cache.weather.data, fromCache: true };
  }

  // Fetch observations & forecasts in parallel
  const [tempRes, rhRes, windSpeedRes, windDirRes, rainRes, forecast2hRes, forecast24hRes, forecast4dRes] = await Promise.all([
    fetchOfficial('air-temperature'),
    fetchOfficial('relative-humidity'),
    fetchOfficial('wind-speed'),
    fetchOfficial('wind-direction'),
    fetchOfficial('rainfall'),
    fetchOfficial('2-hour-weather-forecast'),
    fetchOfficial('24-hour-weather-forecast'),
    fetchOfficial('4-day-weather-forecast'),
  ]);

  const timestamp = tempRes.data?.items?.[0]?.timestamp ||
                    rainRes.data?.items?.[0]?.timestamp ||
                    new Date().toISOString();

  // Map stations
  const stationsMap = new Map();

  function ensureStation(s) {
    if (!s || !s.id) return null;
    if (!stationsMap.has(s.id)) {
      stationsMap.set(s.id, {
        id: s.id,
        name: s.name || s.id,
        latitude: s.location?.latitude ?? null,
        longitude: s.location?.longitude ?? null,
        temperature: null,
        humidity: null,
        windSpeedKnots: null,
        windSpeedKmH: null,
        windDirectionDegrees: null,
        windDirectionCardinal: null,
        rainfall: null,
        lastObserved: timestamp,
      });
    }
    return stationsMap.get(s.id);
  }

  // 1. Air Temperature
  if (tempRes.ok && tempRes.data?.metadata?.stations) {
    tempRes.data.metadata.stations.forEach(ensureStation);
    const readings = tempRes.data.items?.[0]?.readings || [];
    readings.forEach(r => {
      const s = stationsMap.get(r.station_id);
      if (s) s.temperature = typeof r.value === 'number' ? Math.round(r.value * 10) / 10 : null;
    });
  }

  // 2. Relative Humidity
  if (rhRes.ok && rhRes.data?.metadata?.stations) {
    rhRes.data.metadata.stations.forEach(ensureStation);
    const readings = rhRes.data.items?.[0]?.readings || [];
    readings.forEach(r => {
      const s = stationsMap.get(r.station_id);
      if (s) s.humidity = typeof r.value === 'number' ? Math.round(r.value) : null;
    });
  }

  // 3. Wind Speed
  if (windSpeedRes.ok && windSpeedRes.data?.metadata?.stations) {
    windSpeedRes.data.metadata.stations.forEach(ensureStation);
    const readings = windSpeedRes.data.items?.[0]?.readings || [];
    readings.forEach(r => {
      const s = stationsMap.get(r.station_id);
      if (s && typeof r.value === 'number') {
        s.windSpeedKnots = Math.round(r.value * 10) / 10;
        s.windSpeedKmH = Math.round(r.value * 1.852 * 10) / 10;
      }
    });
  }

  // 4. Wind Direction
  if (windDirRes.ok && windDirRes.data?.metadata?.stations) {
    windDirRes.data.metadata.stations.forEach(ensureStation);
    const readings = windDirRes.data.items?.[0]?.readings || [];
    readings.forEach(r => {
      const s = stationsMap.get(r.station_id);
      if (s && typeof r.value === 'number') {
        s.windDirectionDegrees = r.value;
        s.windDirectionCardinal = degreesToCardinal(r.value);
      }
    });
  }

  // 5. Rainfall (latest 5 min)
  if (rainRes.ok && rainRes.data?.metadata?.stations) {
    rainRes.data.metadata.stations.forEach(ensureStation);
    const readings = rainRes.data.items?.[0]?.readings || [];
    readings.forEach(r => {
      const s = stationsMap.get(r.station_id);
      if (s && typeof r.value === 'number') {
        s.rainfall = r.value;
      }
    });
  }

  // Compute Island-Wide Aggregations
  const stationsList = Array.from(stationsMap.values()).filter(s => s.latitude && s.longitude);
  const temps = stationsList.map(s => s.temperature).filter(t => typeof t === 'number');
  const humidities = stationsList.map(s => s.humidity).filter(h => typeof h === 'number');
  const windSpeeds = stationsList.map(s => s.windSpeedKmH).filter(w => typeof w === 'number');
  const rainStations = stationsList.filter(s => typeof s.rainfall === 'number');
  const rainingStations = rainStations.filter(s => s.rainfall > 0);

  const avg = arr => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;
  const min = arr => arr.length ? Math.min(...arr) : null;
  const max = arr => arr.length ? Math.max(...arr) : null;

  // 2-Hour Forecast Parsing (47 areas)
  let twoHourForecast = [];
  let twoHourPeriod = null;
  if (forecast2hRes.ok && forecast2hRes.data?.items?.[0]) {
    const item = forecast2hRes.data.items[0];
    twoHourPeriod = item.valid_period || null;
    const areaMap = new Map();
    (forecast2hRes.data.area_metadata || []).forEach(a => {
      areaMap.set(a.name, a.label_location);
    });
    twoHourForecast = (item.forecasts || []).map(f => {
      const loc = areaMap.get(f.area);
      const isRain = /rain|shower|thunder/i.test(f.forecast);
      return {
        area: f.area,
        latitude: loc?.latitude ?? null,
        longitude: loc?.longitude ?? null,
        forecast: f.forecast,
        isRain,
      };
    });
  }

  // 24-Hour Forecast Parsing
  let twentyFourHour = null;
  if (forecast24hRes.ok && forecast24hRes.data?.items?.[0]) {
    const item = forecast24hRes.data.items[0];
    twentyFourHour = {
      general: item.general?.forecast || null,
      temperatureHigh: item.general?.temperature?.high ?? null,
      temperatureLow: item.general?.temperature?.low ?? null,
      humidityHigh: item.general?.relative_humidity?.high ?? null,
      humidityLow: item.general?.relative_humidity?.low ?? null,
      windSpeed: item.general?.wind?.speed || null,
      windDirection: item.general?.wind?.direction || null,
      periods: item.periods || [],
    };
  }

  // 4-Day Forecast Parsing
  let fourDayForecast = [];
  if (forecast4dRes.ok && forecast4dRes.data?.items?.[0]?.forecasts) {
    fourDayForecast = forecast4dRes.data.items[0].forecasts.map(f => ({
      date: f.date,
      forecast: f.forecast,
      temperatureHigh: f.temperature?.high ?? null,
      temperatureLow: f.temperature?.low ?? null,
      humidityHigh: f.relative_humidity?.high ?? null,
      humidityLow: f.relative_humidity?.low ?? null,
      windSpeed: f.wind?.speed?.low ? `${f.wind.speed.low}-${f.wind.speed.high} km/h` : null,
      windDirection: f.wind?.direction || null,
    }));
  }

  const result = {
    updatedAt: timestamp,
    upstreamStatus: tempRes.status,
    stations: stationsList,
    summary: {
      temperatureAvg: avg(temps),
      temperatureMin: min(temps),
      temperatureMax: max(temps),
      humidityAvg: avg(humidities),
      windSpeedAvg: avg(windSpeeds),
      totalStationsReporting: stationsList.length,
      rainStationsReporting: rainStations.length,
      activeRainingStations: rainingStations.length,
      maxObservedRainfall: max(rainStations.map(s => s.rainfall)) || 0,
      generalForecast: twentyFourHour?.general || (twoHourForecast[0]?.forecast ?? 'Fair'),
    },
    forecast: {
      twoHourPeriod,
      twoHourAreas: twoHourForecast,
      twentyFourHour,
      fourDay: fourDayForecast,
    },
    source: 'National Environment Agency (NEA) / data.gov.sg',
  };

  cache.weather = { data: result, expiresAt: now + CACHE_TTL_MS };
  return result;
}

/**
 * 2. GET RAINFALL & RAIN AREAS
 */
export async function getRainData(forceFresh = false) {
  const now = Date.now();
  if (!forceFresh && cache.rain.data && cache.rain.expiresAt > now) {
    return { ...cache.rain.data, fromCache: true };
  }

  const [rainRes, forecast2hRes] = await Promise.all([
    fetchOfficial('rainfall'),
    fetchOfficial('2-hour-weather-forecast'),
  ]);

  const timestamp = rainRes.data?.items?.[0]?.timestamp || new Date().toISOString();
  const stationMetadata = rainRes.data?.metadata?.stations || [];
  const readings = rainRes.data?.items?.[0]?.readings || [];

  const metaMap = new Map();
  stationMetadata.forEach(s => metaMap.set(s.id, s));

  const stations = [];
  let maxRainfall = 0;
  let rainingCount = 0;

  readings.forEach(r => {
    const meta = metaMap.get(r.station_id);
    if (!meta || !meta.location) return;
    const val = typeof r.value === 'number' ? r.value : 0;
    if (val > 0) rainingCount++;
    if (val > maxRainfall) maxRainfall = val;

    const classification = classifyRainfall(val);

    stations.push({
      id: r.station_id,
      name: meta.name || r.station_id,
      latitude: meta.location.latitude,
      longitude: meta.location.longitude,
      rainfall: val,
      hourlyRate: classification.hourlyEquivalent,
      intensity: classification.category,
      intensityLabel: classification.label,
    });
  });

  // Parse 2-hour area rain forecasts (47 zones)
  const rainAreas = [];
  if (forecast2hRes.ok && forecast2hRes.data?.items?.[0]?.forecasts) {
    const areaMap = new Map();
    (forecast2hRes.data.area_metadata || []).forEach(a => {
      areaMap.set(a.name, a.label_location);
    });

    forecast2hRes.data.items[0].forecasts.forEach(f => {
      const isRain = /rain|shower|thunder/i.test(f.forecast);
      const loc = areaMap.get(f.area);
      let intensity = 'none';
      if (/heavy|thundery/i.test(f.forecast)) intensity = 'heavy';
      else if (/moderate/i.test(f.forecast)) intensity = 'moderate';
      else if (/light|passing/i.test(f.forecast)) intensity = 'light';

      rainAreas.push({
        area: f.area,
        latitude: loc?.latitude ?? null,
        longitude: loc?.longitude ?? null,
        forecast: f.forecast,
        isRainingNowOrExpected: isRain,
        intensity,
      });
    });
  }

  const isRaining = rainingCount > 0 || rainAreas.some(a => a.isRainingNowOrExpected);

  const result = {
    updatedAt: timestamp,
    isRaining,
    totalStationCount: stations.length,
    rainingStationCount: rainingCount,
    maxRainfall,
    intensityScale: {
      none: { range: '0.0 mm (0 mm/h)', description: 'No significant rain' },
      light: { range: '0.1 - 0.2 mm / 5-min (< 2.5 mm/h)', description: 'Light rain or drizzle' },
      moderate: { range: '0.21 - 0.8 mm / 5-min (2.5 - 10 mm/h)', description: 'Moderate rain or steady showers' },
      heavy: { range: '> 0.8 mm / 5-min (> 10 mm/h)', description: 'Heavy rain or torrential downpour' },
    },
    radarStatus: {
      available: false,
      reason: 'Direct binary rain radar tile feed requires restricted internal MSS credentials. Official high-density NEA telemetry station network (43+ rain gauges updated every 5 minutes) and 47 micro-forecast areas are utilized.',
      officialPortalUrl: 'https://www.weather.gov.sg/weather-rain-area/',
    },
    stations,
    rainAreas,
    summary: rainingCount > 0
      ? `Rain currently recorded at ${rainingCount} station${rainingCount > 1 ? 's' : ''} across Singapore (peak ${maxRainfall} mm/5-min).`
      : 'No significant rain recorded at any NEA weather telemetry station in the last 5 minutes.',
    source: 'National Environment Agency (NEA) / data.gov.sg',
  };

  cache.rain = { data: result, expiresAt: now + CACHE_TTL_MS };
  return result;
}

/**
 * 3. GET HAZE & PSI AIR QUALITY
 */
export async function getHazeData(forceFresh = false) {
  const now = Date.now();
  if (!forceFresh && cache.haze.data && cache.haze.expiresAt > now) {
    return { ...cache.haze.data, fromCache: true };
  }

  const [psiRes, pm25Res] = await Promise.all([
    fetchOfficial('psi'),
    fetchOfficial('pm25'),
  ]);

  const timestamp = psiRes.data?.items?.[0]?.timestamp || new Date().toISOString();
  const psiReadings = psiRes.data?.items?.[0]?.readings || {};
  const pm25Readings = pm25Res.data?.items?.[0]?.readings?.pm25_one_hourly || {};

  const regionMetadata = psiRes.data?.region_metadata || [
    { name: 'west', label_location: { latitude: 1.35735, longitude: 103.7 } },
    { name: 'central', label_location: { latitude: 1.35735, longitude: 103.82 } },
    { name: 'north', label_location: { latitude: 1.41803, longitude: 103.82 } },
    { name: 'south', label_location: { latitude: 1.29587, longitude: 103.82 } },
    { name: 'east', label_location: { latitude: 1.35735, longitude: 103.94 } },
  ];

  const regions = [];
  let maxPsi = 0;
  let maxPm25 = 0;

  regionMetadata.forEach(r => {
    const key = r.name.toLowerCase();
    // Exclude national reading if present in region_metadata
    if (key === 'national') return;

    const psi24 = psiReadings.psi_twenty_four_hourly?.[key] ?? null;
    const pm25OneHr = pm25Readings[key] ?? null;

    if (typeof psi24 === 'number' && psi24 > maxPsi) maxPsi = psi24;
    if (typeof pm25OneHr === 'number' && pm25OneHr > maxPm25) maxPm25 = pm25OneHr;

    const psiCat = getPsiCategory(psi24);
    const pm25Band = getPm25Band(pm25OneHr);

    regions.push({
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      latitude: r.label_location?.latitude ?? null,
      longitude: r.label_location?.longitude ?? null,
      psi: psi24,
      psiCategory: psiCat.category,
      psiColor: psiCat.color,
      psiAdvisory: psiCat.advisory,
      pm25OneHourly: pm25OneHr,
      pm25Band: pm25Band.band,
      pm25BandCode: pm25Band.code,
      pm25Color: pm25Band.color,
      pm25Advisory: pm25Band.advisory,
      subIndices: {
        pm10TwentyFourHourly: psiReadings.pm10_twenty_four_hourly?.[key] ?? null,
        pm25TwentyFourHourly: psiReadings.pm25_twenty_four_hourly?.[key] ?? null,
        o3EightHourMax: psiReadings.o3_eight_hour_max?.[key] ?? null,
        so2TwentyFourHourly: psiReadings.so2_twenty_four_hourly?.[key] ?? null,
        coEightHourMax: psiReadings.co_eight_hour_max?.[key] ?? null,
        no2OneHourMax: psiReadings.no2_one_hour_max?.[key] ?? null,
      },
    });
  });

  const overallPsiCat = getPsiCategory(maxPsi);
  const overallPm25Band = getPm25Band(maxPm25);

  // Per NEA criteria, haze advisory is triggered only when PSI exceeds 100 or PM2.5 enters elevated/high bands
  const isHazy = maxPsi > 100 || maxPm25 > 55;

  const result = {
    updatedAt: timestamp,
    overallPsi: maxPsi,
    overallCategory: overallPsiCat.category,
    overallColor: overallPsiCat.color,
    overallAdvisory: overallPsiCat.advisory,
    overallPm25: maxPm25,
    overallPm25Band: overallPm25Band.band,
    overallPm25BandCode: overallPm25Band.code,
    isHazy,
    hazeStatusText: isHazy
      ? `Air quality is ${overallPsiCat.category.toUpperCase()} (Peak PSI: ${maxPsi}, 1-hr PM2.5: ${maxPm25} µg/m³).`
      : `Air quality across Singapore is currently ${overallPsiCat.category.toUpperCase()} (PSI: ${maxPsi}, 1-hr PM2.5: ${maxPm25} µg/m³). No haze conditions detected.`,
    regions,
    scales: {
      psi: [
        { range: '0 - 50', category: 'Good', description: 'Normal outdoor activities' },
        { range: '51 - 100', category: 'Moderate', description: 'Normal outdoor activities' },
        { range: '101 - 200', category: 'Unhealthy', description: 'Reduce prolonged strenuous outdoor activity' },
        { range: '201 - 300', category: 'Very Unhealthy', description: 'Avoid prolonged strenuous outdoor activity' },
        { range: '> 300', category: 'Hazardous', description: 'Minimize all outdoor activity' },
      ],
      pm25: [
        { band: 'Band I (0 - 55 µg/m³)', label: 'Normal', description: 'Normal activities' },
        { band: 'Band II (56 - 150 µg/m³)', label: 'Elevated', description: 'Reduce strenuous outdoor exertion for vulnerable groups' },
        { band: 'Band III (151 - 250 µg/m³)', label: 'High', description: 'Avoid strenuous outdoor exertion' },
        { band: 'Band IV (> 250 µg/m³)', label: 'Very High', description: 'Minimize outdoor activity' },
      ],
    },
    source: 'National Environment Agency (NEA) / data.gov.sg',
  };

  cache.haze = { data: result, expiresAt: now + CACHE_TTL_MS };
  return result;
}

/**
 * 4. GET HEALTH STATUS & DIAGNOSTICS FUNCTION
 * Pings official NEA / data.gov.sg endpoints, measures latencies, and assesses system health
 */
const serverStartTime = Date.now();

export async function getHealthData(forceFresh = false) {
  const now = Date.now();
  if (!forceFresh && cache.health.data && now < cache.health.expiresAt) {
    return cache.health.data;
  }

  const checkTargets = [
    { name: 'Air Temperature Telemetry', endpoint: 'air-temperature' },
    { name: 'Rainfall Gauges & Rate', endpoint: 'rainfall' },
    { name: 'Relative Humidity', endpoint: 'relative-humidity' },
    { name: 'Wind Direction Vectors', endpoint: 'wind-direction' },
    { name: 'Wind Velocity', endpoint: 'wind-speed' },
    { name: '2-Hour Micro-Climate Forecast', endpoint: '2-hour-weather-forecast' },
    { name: '24-Hour Regional Outlook', endpoint: '24-hour-weather-forecast' },
    { name: '4-Day Islandwide Forecast', endpoint: '4-day-weather-forecast' },
    { name: 'Air Quality & PSI / PM2.5', endpoint: 'psi' },
  ];

  const overallStart = Date.now();

  const results = await Promise.all(
    checkTargets.map(async (target) => {
      const epStart = Date.now();
      const res = await fetchOfficial(target.endpoint);
      const latencyMs = Date.now() - epStart;
      return {
        name: target.name,
        endpoint: `/v1/environment/${target.endpoint}`,
        status: res.status,
        ok: res.ok,
        latencyMs,
        source: 'data.gov.sg / NEA',
      };
    })
  );

  const totalLatencyMs = Date.now() - overallStart;
  const okCount = results.filter((r) => r.ok).length;
  const totalCount = results.length;
  const allOk = okCount === totalCount;
  const partialOk = okCount > 0;

  const status = allOk ? 'healthy' : partialOk ? 'degraded' : 'unhealthy';
  const hasKey = Boolean(process.env.DATA_GOV_SG_API_KEY || process.env.NEA_API_KEY);

  const mem = process.memoryUsage();
  const uptimeSeconds = Math.floor((Date.now() - serverStartTime) / 1000);

  const endpointsMap = {};
  results.forEach((r) => {
    endpointsMap[r.endpoint.replace('/v1/environment/', '')] = r.status;
  });

  const healthResult = {
    status,
    keyConfigured: hasKey,
    upstreamOk: allOk || partialOk,
    upstreamStatus: allOk ? 200 : (partialOk ? 207 : 503),
    latencyMs: totalLatencyMs,
    healthyEndpointsCount: okCount,
    totalEndpointsCount: totalCount,
    service: 'Singapore NEA / data.gov.sg Weather Gateway',
    version: '1.2.0',
    uptimeSeconds,
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memoryMb: {
        rss: Math.round(mem.rss / 1024 / 1024 * 10) / 10,
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024 * 10) / 10,
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024 * 10) / 10,
      },
    },
    cacheStatus: {
      weatherCached: Boolean(cache.weather.data && Date.now() < cache.weather.expiresAt),
      rainCached: Boolean(cache.rain.data && Date.now() < cache.rain.expiresAt),
      hazeCached: Boolean(cache.haze.data && Date.now() < cache.haze.expiresAt),
    },
    endpoints: endpointsMap,
    detailedEndpoints: results,
    timestamp: new Date().toISOString(),
  };

  cache.health = {
    data: healthResult,
    expiresAt: Date.now() + 15 * 1000, // 15 seconds TTL for health cache
  };

  return healthResult;
}
