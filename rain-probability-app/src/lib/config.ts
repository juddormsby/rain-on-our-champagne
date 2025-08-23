export const WINDOWS = [
  { key: 'morning', label: 'Morning', start: 9, end: 12 },
  { key: 'noon', label: 'Noon', start: 12, end: 15 },
  { key: 'afternoon', label: 'Afternoon', start: 15, end: 18 },
  { key: 'evening', label: 'Evening', start: 18, end: 21 },
];

export const RAIN_THRESHOLD_MM = 0.2;
export const DEFAULT_START_YEAR = 1940;
export const CACHE_TTL_DAYS = 30;

// API Configuration
export const DEFAULT_CONCURRENCY = 12; // Aggressive for maximum speed
export const DAILY_TIMEOUT_MS = 10000; // 10 seconds for daily requests
export const HOURLY_TIMEOUT_MS = 8000; // 8 seconds for hourly requests
export const MAX_RETRIES = 2; // Number of retries for failed requests
export const RATE_LIMIT_BACKOFF_BASE_MS = 500; // Base backoff time for rate limits
export const RATE_LIMIT_BACKOFF_MULTIPLIER = 1000; // Multiplier for rate limit backoff 