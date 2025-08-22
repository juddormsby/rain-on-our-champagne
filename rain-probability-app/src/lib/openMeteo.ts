import pLimit from 'p-limit';
import { DEFAULT_START_YEAR } from './config';
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
  temperature_2m?: number[];
  apparent_temperature?: number[];
  dew_point_2m?: number[];
}

export interface HourlyYearResult {
  year: number;
  hours: Array<{
    time: string;
    rain: number | null;
    precip: number | null;
    temp: number | null;
    apparentTemp: number | null;
    dewPoint: number | null;
  }> | null;
}

export async function geocodeCity(query: string, country?: string): Promise<GeocodingResult[]> {
  const url = new URL(GEOCODE_URL);
  url.searchParams.set('name', query);
  url.searchParams.set('count', '5');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');
  
  console.log(`[OpenMeteo] Geocoding request: ${query}, ${country || 'no country'}`);
  console.log(`[OpenMeteo] Geocoding URL: ${url.toString()}`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  
  try {
    const startTime = Date.now();
    const response = await cachedFetch(url.toString(), { 
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    
    const duration = Date.now() - startTime;
    console.log(`[OpenMeteo] Geocoding response: ${response.status} in ${duration}ms`);
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }
    
    const data = await response.json();
    const results = (data.results || []) as GeocodingResult[];
    
    console.log(`[OpenMeteo] Geocoding found ${results.length} results`);
    if (results.length > 0) {
      console.log(`[OpenMeteo] First result: ${results[0].name}, ${results[0].country} (${results[0].latitude}, ${results[0].longitude})`);
    }
    
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
    console.error('[OpenMeteo] Geocoding error:', error);
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
  
  console.log(`[OpenMeteo] Fetching daily data for lat: ${lat}, lon: ${lon}, startDate: ${startDate}, endDate: ${endDate || 'current'}`);
  console.log(`[OpenMeteo] Daily data URL: ${url.toString()}`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    const startTime = Date.now();
    const response = await cachedFetch(url.toString(), { 
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    
    const duration = Date.now() - startTime;
    console.log(`[OpenMeteo] Daily data response: ${response.status} in ${duration}ms`);
    
    if (!response.ok) {
      throw new Error(`Daily data fetch failed: ${response.status}`);
    }
    
    const data = await response.json();
    const dailyDataCount = data.daily?.time?.length || 0;
    console.log(`[OpenMeteo] Daily data received: ${dailyDataCount} days`);
    if (dailyDataCount > 0) {
      console.log(`[OpenMeteo] Daily data range: ${data.daily.time[0]} to ${data.daily.time[dailyDataCount - 1]}`);
    }
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('[OpenMeteo] Daily data error:', error);
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
  concurrency = 3 // Reduced from DEFAULT_CONCURRENCY to be more conservative
): Promise<HourlyYearResult[]> {
  // Sort years to prioritize recent data and spread requests over time
  const sortedYears = [...years].sort((a, b) => b - a); // Most recent first
  const limit = pLimit(concurrency);
  
  console.log(`[OpenMeteo] Fetching hourly data for lat: ${lat}, lon: ${lon}, month: ${month}, day: ${day}, years: ${sortedYears.length} years (concurrency: ${concurrency})`);
  
  const tasks = sortedYears.map((year, index) => 
    limit(async (): Promise<HourlyYearResult> => {
      // Add progressive delay between requests to avoid overwhelming the API
      const delay = index * 100; // 100ms delay between each request
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount <= maxRetries) {
        try {
          const url = createHourlyUrl(lat, lon, year, month, day);
          console.log(`[OpenMeteo] Fetching hourly data for year: ${year} (attempt ${retryCount + 1}/${maxRetries + 1})`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased timeout
          
          const startTime = Date.now();
          const response = await cachedFetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          
          const duration = Date.now() - startTime;
          console.log(`[OpenMeteo] Hourly data response for year ${year}: ${response.status} in ${duration}ms`);
          
          if (response.status === 429) {
            // Rate limited - implement exponential backoff
            const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10 seconds
            console.warn(`[OpenMeteo] Rate limited for year ${year}, retrying in ${backoffTime}ms (attempt ${retryCount + 1}/${maxRetries + 1})`);
            
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, backoffTime));
              retryCount++;
              continue;
            } else {
              console.error(`[OpenMeteo] Max retries reached for year ${year}, skipping`);
              return { year, hours: null };
            }
          }
          
          if (!response.ok) {
            console.warn(`[OpenMeteo] Failed to fetch hourly data for ${year}: ${response.status}`);
            return { year, hours: null };
          }
          
          const data = await response.json();
          const hourly = data.hourly as HourlyData;
          
          if (!hourly?.time) {
            console.warn(`[OpenMeteo] No hourly data found for ${year}`);
            return { year, hours: null };
          }
          
          console.log(`[OpenMeteo] Successfully fetched hourly data for ${year}: ${hourly.time.length} hours`);
          
          const hours = hourly.time.map((time, i) => ({
            time,
            rain: hourly.rain?.[i] ?? null,
            precip: hourly.precipitation?.[i] ?? null,
            temp: hourly.temperature_2m?.[i] ?? null,
            apparentTemp: hourly.apparent_temperature?.[i] ?? null,
            dewPoint: hourly.dew_point_2m?.[i] ?? null,
          }));
          
          return { year, hours };
          
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            console.warn(`[OpenMeteo] Request timeout for year ${year}, retrying...`);
          } else {
            console.warn(`[OpenMeteo] Request error for year ${year}:`, error);
          }
          
          if (retryCount < maxRetries) {
            const backoffTime = 1000 * Math.pow(2, retryCount); // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            retryCount++;
          } else {
            console.warn(`[OpenMeteo] Max retries reached for year ${year} due to error:`, error);
            return { year, hours: null };
          }
        }
      }
      
      return { year, hours: null };
    })
  );
  
  const results = await Promise.all(tasks);
  const successfulYears = results.filter(result => result.hours !== null).length;
  console.log(`[OpenMeteo] Hourly data fetch completed: ${successfulYears}/${results.length} years successful`);
  return results;
} 