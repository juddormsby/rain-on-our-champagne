export const WINDOWS = [
  { key: 'morning', label: 'Morning', start: 9, end: 12 },
  { key: 'noon', label: 'Noon', start: 12, end: 15 },
  { key: 'afternoon', label: 'Afternoon', start: 15, end: 18 },
  { key: 'evening', label: 'Evening', start: 18, end: 21 },
];

export const RAIN_THRESHOLD_MM = 0.2;
export const DEFAULT_START_YEAR = 1940;
export const DEFAULT_CONCURRENCY = 8; // Balanced for speed vs rate limits
export const CACHE_TTL_DAYS = 30; 