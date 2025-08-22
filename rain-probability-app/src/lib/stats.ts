import { RAIN_THRESHOLD_MM, WINDOWS } from './config';
import type { DailyData, HourlyYearResult } from './openMeteo';

export function formatMMDD(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}

export interface DailyRainResult {
  probability: number | null;
  years: number[];
  totalYears: number;
  rainyYears: number;
}

export interface TemperaturePercentiles {
  highP10: number | null;  // 10th percentile of daily highs (cooler end)
  highP90: number | null;  // 90th percentile of daily highs (warmer end)
  lowP10: number | null;   // 10th percentile of daily lows (cooler end)
  lowP90: number | null;   // 90th percentile of daily lows (warmer end)
  years: number[];
}

function calculatePercentile(values: number[], percentile: number): number | null {
  if (values.length === 0) return null;
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  
  if (Number.isInteger(index)) {
    return sorted[index];
  }
  
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export function calculateTemperaturePercentiles(
  dailyData: { daily: DailyData },
  targetDate: Date
): TemperaturePercentiles {
  const targetMMDD = formatMMDD(targetDate);
  const times = dailyData.daily?.time || [];
  const tempMax = dailyData.daily?.temperature_2m_max || [];
  const tempMin = dailyData.daily?.temperature_2m_min || [];
  
  const highs: number[] = [];
  const lows: number[] = [];
  const years: number[] = [];
  
  for (let i = 0; i < times.length; i++) {
    const date = new Date(times[i]);
    const mmdd = formatMMDD(date);
    
    if (mmdd === targetMMDD && tempMax[i] != null && tempMin[i] != null) {
      highs.push(tempMax[i]);
      lows.push(tempMin[i]);
      years.push(date.getFullYear());
    }
  }
  
  return {
    highP10: calculatePercentile(highs, 10),
    highP90: calculatePercentile(highs, 90),
    lowP10: calculatePercentile(lows, 10),
    lowP90: calculatePercentile(lows, 90),
    years
  };
}

export interface SessionTemperaturePercentiles {
  [sessionKey: string]: {
    highP10: number | null;
    highP90: number | null;
    lowP10: number | null;
    lowP90: number | null;
    years: number[];
  };
}

export function calculateSessionTemperaturePercentiles(
  hourlyData: HourlyYearResult[]
): SessionTemperaturePercentiles {
  const result: SessionTemperaturePercentiles = {};
  
  // Initialize result for each window/session
  WINDOWS.forEach(window => {
    result[window.key] = {
      highP10: null,
      highP90: null,
      lowP10: null,
      lowP90: null,
      years: []
    };
  });
  
  // For each session, collect highs and lows across all years
  WINDOWS.forEach(window => {
    const sessionHighs: number[] = [];
    const sessionLows: number[] = [];
    const sessionYears: number[] = [];
    
    hourlyData.forEach(yearData => {
      if (!yearData.hours) return;
      
      // Find temperature values for this session's hours
      const sessionTemps: number[] = [];
      
      yearData.hours.forEach(hour => {
        if (!hour.time || hour.temp === null) return;
        
        const hourOfDay = new Date(hour.time).getHours();
        
        // Check if this hour is within the session window
        if (hourOfDay >= window.start && hourOfDay < window.end) {
          sessionTemps.push(hour.temp);
        }
      });
      
      // Calculate high and low for this session in this year
      if (sessionTemps.length > 0) {
        const sessionHigh = Math.max(...sessionTemps);
        const sessionLow = Math.min(...sessionTemps);
        
        sessionHighs.push(sessionHigh);
        sessionLows.push(sessionLow);
        sessionYears.push(yearData.year);
      }
    });
    
    // Calculate percentiles for this session
    result[window.key] = {
      highP10: calculatePercentile(sessionHighs, 10),
      highP90: calculatePercentile(sessionHighs, 90),
      lowP10: calculatePercentile(sessionLows, 10),
      lowP90: calculatePercentile(sessionLows, 90),
      years: sessionYears
    };
  });
  
  return result;
}

export function calculateDailyRainProbability(
  dailyData: { daily: DailyData }, 
  targetDate: Date
): DailyRainResult {
  const targetMMDD = formatMMDD(targetDate);
  const times = dailyData.daily?.time || [];
  const rainSum = dailyData.daily?.rain_sum || [];
  const precipSum = dailyData.daily?.precipitation_sum || [];
  
  let totalYears = 0;
  let rainyYears = 0;
  const years: number[] = [];
  
  for (let i = 0; i < times.length; i++) {
    const date = new Date(times[i]);
    const dateMMDD = formatMMDD(date);
    
    if (dateMMDD !== targetMMDD) continue;
    
    const year = date.getFullYear();
    years.push(year);
    
    const rain = rainSum?.[i] ?? null;
    const precip = precipSum?.[i] ?? null;
    const value = rain ?? precip ?? 0;
    
    totalYears++;
    if (value > RAIN_THRESHOLD_MM) {
      rainyYears++;
    }
  }
  
  return {
    probability: totalYears > 0 ? rainyYears / totalYears : null,
    years: years.sort(),
    totalYears,
    rainyYears,
  };
}

export function calculateHourlyProbabilities(
  hourlyByYear: HourlyYearResult[]
): (number | null)[] {
  // Create 24 counters for each hour
  const counts = Array(24).fill(0);
  const totals = Array(24).fill(0);
  
  for (const yearData of hourlyByYear) {
    if (!yearData.hours) continue;
    
    for (const hour of yearData.hours) {
      const hourIndex = new Date(hour.time).getHours();
      const rainValue = hour.rain ?? hour.precip ?? 0;
      
      totals[hourIndex] += 1;
      if (rainValue > RAIN_THRESHOLD_MM) {
        counts[hourIndex] += 1;
      }
    }
  }
  
  return counts.map((count, i) => 
    totals[i] > 0 ? count / totals[i] : null
  );
}

export interface WindowProbabilities {
  [key: string]: {
    probability: number | null;
    label: string;
    timeRange: string;
  };
}

export function calculateWindowProbabilities(
  hourlyByYear: HourlyYearResult[]
): WindowProbabilities {
  const result: WindowProbabilities = {};
  
  for (const window of WINDOWS) {
    let totalYears = 0;
    let rainyYears = 0;
    
    for (const yearData of hourlyByYear) {
      if (!yearData.hours) continue;
      
      // Check if any hour in this window had rain
      const hadRainInWindow = yearData.hours.some(hour => {
        const hourIndex = new Date(hour.time).getHours();
        if (hourIndex < window.start || hourIndex >= window.end) return false;
        
        const rainValue = hour.rain ?? hour.precip ?? 0;
        return rainValue > RAIN_THRESHOLD_MM;
      });
      
      totalYears += 1;
      if (hadRainInWindow) {
        rainyYears += 1;
      }
    }
    
    result[window.key] = {
      probability: totalYears > 0 ? rainyYears / totalYears : null,
      label: window.label,
      timeRange: `${String(window.start).padStart(2, '0')}:00–${String(window.end).padStart(2, '0')}:00`,
    };
  }
  
  return result;
}

export function formatPercentage(probability: number | null, decimals = 0): string {
  if (probability === null) return 'N/A';
  return `${(probability * 100).toFixed(decimals)}%`;
} 