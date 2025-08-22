import pLimit from 'p-limit';
import { DEFAULT_CONCURRENCY, DEFAULT_START_YEAR } from './config';
import { cachedFetch } from './cache';

const BASE_URL = 'https://archive-api.open-meteo.com/v1/archive';
const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  name: string;
  country: string;
  admin1?: string;
  country_code: string;
}

export interface DailyData {
  time: string[];
  precipitation_sum: number[];
  rain_sum: number[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  temperature_2m_mean?: number[];
}

export interface HourlyData {
  time: string[];
  rain: number[];
  precipitation: number[];
}

export interface HourlyYearResult {
  year: number;
  hours: Array<{
    time: string;
    rain: number | null;
    precip: number | null;
  }> | null;
}

export async function geocodeCity(query: string, country?: string): Promise<GeocodingResult[]> {
  const url = new URL(GEOCODE_URL);
  url.searchParams.set('name', query);
  url.searchParams.set('count', '5');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  
  try {
    const response = await cachedFetch(url.toString(), { 
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }
    
    const data = await response.json();
    const results = (data.results || []) as GeocodingResult[];
    
    if (results.length === 0) {
      return [];
    }
    
    // Sort by country match if provided
    if (country) {
      return results.sort((a, b) => {
        const aMatch = a.country_code === country.toUpperCase() ? 1 : 0;
        const bMatch = b.country_code === country.toUpperCase() ? 1 : 0;
        return bMatch - aMatch;
      });
    }
    
    return results;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

export async function fetchDaily(
  lat: number, 
  lon: number, 
  startDate = `${DEFAULT_START_YEAR}-01-01`, 
  endDate?: string
): Promise<{ daily: DailyData }> {
  const url = new URL(BASE_URL);
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('start_date', startDate);
  url.searchParams.set('end_date', endDate || new Date().toISOString().slice(0, 10));
  url.searchParams.set('daily', 'precipitation_sum,rain_sum,temperature_2m_max,temperature_2m_min,temperature_2m_mean');
  url.searchParams.set('temperature_unit', 'celsius');
  url.searchParams.set('timezone', 'auto');
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    const response = await cachedFetch(url.toString(), { 
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Daily data fetch failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

function createHourlyUrl(lat: number, lon: number, year: number, month: number, day: number): string {
  const url = new URL(BASE_URL);
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  url.searchParams.set('start_date', dateStr);
  url.searchParams.set('end_date', dateStr);
  url.searchParams.set('hourly', 'rain,precipitation,temperature_2m,apparent_temperature,dew_point_2m');
  url.searchParams.set('temperature_unit', 'celsius');
  url.searchParams.set('timezone', 'auto');
  
  return url.toString();
}

export async function fetchHourlyForYears(
  lat: number,
  lon: number,
  month: number,
  day: number,
  years: number[],
  concurrency = DEFAULT_CONCURRENCY
): Promise<HourlyYearResult[]> {
  const limit = pLimit(concurrency);
  
  const tasks = years.map(year => 
    limit(async (): Promise<HourlyYearResult> => {
      try {
        const url = createHourlyUrl(lat, lon, year, month, day);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await cachedFetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          return { year, hours: null };
        }
        
        const data = await response.json();
        const hourly = data.hourly as HourlyData;
        
        if (!hourly?.time) {
          return { year, hours: null };
        }
        
        const hours = hourly.time.map((time, i) => ({
          time,
          rain: hourly.rain?.[i] ?? null,
          precip: hourly.precipitation?.[i] ?? null,
        }));
        
        return { year, hours };
      } catch (error) {
        console.warn(`Failed to fetch hourly data for ${year}:`, error);
        return { year, hours: null };
      }
    })
  );
  
  return Promise.all(tasks);
} 