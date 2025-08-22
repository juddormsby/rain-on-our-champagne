export interface GeocodingResult {
  latitude: number;
  longitude: number;
  name: string;
  country: string;
  admin1?: string;
}

export interface HourlyData {
  hour: number;
  probability: number;
}

export interface WindowProbability {
  key: string;
  label: string;
  probability: number;
  timeRange: string;
}

export interface DailyRainResult {
  probability: number;
  totalYears: number;
  rainyYears: number;
  years: number[];
} 