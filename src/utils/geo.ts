/**
 * Singapore Geographic Projections & Map Coordinates
 *
 * Covers mainland Singapore and offshore islands:
 * Longitude: 103.59° E to 104.05° E
 * Latitude: 1.19° N to 1.48° N
 */

export const SVG_WIDTH = 800;
export const SVG_HEIGHT = 480;

export const LON_MIN = 103.59;
export const LON_MAX = 104.05;
export const LAT_MIN = 1.19;
export const LAT_MAX = 1.48;

/**
 * Projects a Singapore WGS84 coordinate (lat, lon) to SVG canvas coordinates
 */
export function projectGeoToSvg(lat: number, lon: number): { x: number; y: number } {
  const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * SVG_WIDTH;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * SVG_HEIGHT;
  return {
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10,
  };
}

/**
 * Singapore Mainland Coastline Path (SVG coordinates)
 */
export const MAINLAND_PATH =
  'M 60.9 331 L 43.5 281.4 L 69.6 240 L 95.7 198.6 L 139.1 149 L 173.9 99.3 L 208.7 66.2 L 234.8 53 L 260.9 57.9 L 295.7 41.4 L 321.7 46.3 L 339.1 49.7 L 365.2 41.4 L 408.7 24.8 L 452.2 33.1 L 495.7 82.8 L 513 99.3 L 547.8 91 L 573.9 99.3 L 591.3 132.4 L 634.8 157.2 L 687 140.7 L 721.7 157.2 L 713 231.7 L 678.3 273.1 L 626.1 289.7 L 556.5 297.9 L 504.3 306.2 L 469.6 331 L 460.9 355.9 L 426.1 360.8 L 391.3 355.9 L 356.5 339.3 L 313 322.8 L 269.6 306.2 L 226.1 297.9 L 156.5 297.9 L 104.3 314.5 L 60.9 331 Z';

/**
 * Offshore Islands Paths
 */
export const ISLANDS_PATHS = [
  {
    name: 'Sentosa',
    d: 'M 391.3 367.4 L 417.4 372.4 L 438.3 384 L 426.1 393.9 L 396.5 387.3 L 382.6 377.4 Z',
  },
  {
    name: 'Jurong Island',
    d: 'M 147.8 327.7 L 200 317.8 L 234.8 339.3 L 226.1 372.4 L 182.6 380.7 L 147.8 355.9 Z',
  },
  {
    name: 'Pulau Ubin',
    d: 'M 600 112.6 L 652.2 96 L 687 107.6 L 669.6 129.1 L 617.4 124.1 Z',
  },
  {
    name: 'Pulau Tekong',
    d: 'M 739.1 107.6 L 800 91 L 826.1 124.1 L 808.7 157.2 L 747.8 149 Z',
  },
  {
    name: 'Southern Islands',
    d: 'M 443.5 427 L 478.3 422.1 L 469.6 438.6 L 448.7 443.6 Z',
  },
];

/**
 * Singapore Water Reservoirs Paths (Visual geographic landmarks)
 */
export const RESERVOIRS = [
  {
    name: 'Central Catchment / MacRitchie & Peirce',
    d: 'M 380 180 Q 420 170 440 190 Q 430 215 395 210 Q 370 200 380 180 Z',
  },
  {
    name: 'Upper Seletar Reservoir',
    d: 'M 350 135 Q 380 130 385 150 Q 365 160 345 150 Z',
  },
  {
    name: 'Jurong Lake',
    d: 'M 220 230 Q 235 225 240 250 Q 225 260 218 245 Z',
  },
  {
    name: 'Marina Reservoir',
    d: 'M 455 330 Q 470 325 480 340 Q 465 350 455 330 Z',
  },
];

/**
 * 5 Singapore Official Administrative Regions boundaries for Haze/PSI
 */
export const REGION_BOUNDARIES = [
  {
    id: 'north',
    name: 'North Region',
    labelX: 400,
    labelY: 90,
  },
  {
    id: 'south',
    name: 'South Region',
    labelX: 430,
    labelY: 340,
  },
  {
    id: 'east',
    name: 'East Region',
    labelX: 630,
    labelY: 220,
  },
  {
    id: 'west',
    name: 'West Region',
    labelX: 200,
    labelY: 220,
  },
  {
    id: 'central',
    name: 'Central Region',
    labelX: 420,
    labelY: 230,
  },
];

/**
 * Time formatting helpers
 */
export function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Data pending';
  try {
    const updated = new Date(dateString).getTime();
    if (isNaN(updated)) return 'Recently';
    const now = Date.now();
    const diffSec = Math.floor((now - updated) / 1000);

    if (diffSec < 45) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin === 1) return '1 minute ago';
    if (diffMin < 60) return `${diffMin} minutes ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    return new Date(dateString).toLocaleDateString('en-SG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Recently';
  }
}

export function formatTimeSGT(dateString: string | null): string {
  if (!dateString) return '--:--';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleTimeString('en-SG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Singapore',
    });
  } catch {
    return dateString;
  }
}
