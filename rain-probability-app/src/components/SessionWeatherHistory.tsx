import { useState, useEffect } from 'react';
import { WINDOWS } from '../lib/config';
import type { HourlyYearResult } from '../lib/openMeteo';

interface SessionWeatherHistoryProps {
  hourlyData: HourlyYearResult[];
  isLoading: boolean;
  selectedSession: string;
}

interface SessionYearWeather {
  year: number;
  weathercode: number;
  high: number;
  low: number;
}

// WMO Weather codes to emoji mapping (same as WeatherHistory)
const weatherCodeToEmoji = (code: number): string => {
  if (code >= 0 && code <= 3) return '☀️';      // Clear to partly cloudy
  if (code >= 45 && code <= 48) return '🌫️';   // Foggy
  if (code >= 51 && code <= 55) return '🌦️';   // Drizzle
  if (code >= 56 && code <= 57) return '🌨️';   // Freezing drizzle
  if (code >= 61 && code <= 65) return '🌧️';   // Rain
  if (code >= 66 && code <= 67) return '🌨️';   // Freezing rain
  if (code >= 71 && code <= 75) return '🌨️';   // Snow
  if (code === 77) return '🌨️';                // Snow grains
  if (code >= 80 && code <= 82) return '🌧️';   // Rain showers
  if (code >= 85 && code <= 86) return '🌨️';   // Snow showers
  if (code === 95) return '⛈️';                // Thunderstorm
  if (code >= 96 && code <= 99) return '⛈️';   // Thunderstorm with hail
  
  // Handle missing ranges for completeness
  if (code >= 4 && code <= 44) return '☁️';    // Various cloudy conditions
  if (code >= 58 && code <= 60) return '🌧️';   // Light rain variations
  if (code >= 68 && code <= 70) return '🌨️';   // Rain/snow mix
  if (code >= 76 && code <= 76) return '🌨️';   // Snow variations
  if (code >= 83 && code <= 84) return '🌧️';   // Heavy showers
  if (code >= 87 && code <= 94) return '🌨️';   // Snow/hail showers
  
  return '❓'; // Unknown code
};

export function SessionWeatherHistory({ hourlyData, isLoading, selectedSession }: SessionWeatherHistoryProps) {
  const [yearlySessionWeather, setYearlySessionWeather] = useState<SessionYearWeather[]>([]);

  useEffect(() => {
    if (!hourlyData || hourlyData.length === 0) {
      return;
    }

    // Get the session window details
    const sessionWindow = WINDOWS.find(w => w.key === selectedSession);
    if (!sessionWindow) {
      return;
    }

    // Get data for 2020-2024
    const years = [2020, 2021, 2022, 2023, 2024];
    const sessionWeatherData: SessionYearWeather[] = [];
    
    console.log(`[SessionWeatherHistory] Processing session: ${selectedSession} (${sessionWindow.start}:00-${sessionWindow.end}:00)`);
    console.log('[SessionWeatherHistory] Processing years:', years);
    
    // Process each year's hourly data
    years.forEach(year => {
      const yearData = hourlyData.find(data => data.year === year);
      
      if (yearData && yearData.hours) {
        // Filter hours for this session
        const sessionHours = yearData.hours.filter(hour => {
          const hourIndex = new Date(hour.time).getHours();
          return hourIndex >= sessionWindow.start && hourIndex < sessionWindow.end;
        });
        
        if (sessionHours.length > 0) {
          // Get weather code from first hour of session
          const firstHour = sessionHours[0];
          const weathercode = firstHour.weathercode;
          
          // Calculate high/low temperatures for this session
          const temperatures = sessionHours
            .map(hour => hour.temp)
            .filter(temp => temp !== null) as number[];
          
          if (temperatures.length > 0 && weathercode !== null) {
            const high = Math.max(...temperatures);
            const low = Math.min(...temperatures);
            
            console.log(`[SessionWeatherHistory] Year ${year}: weather=${weathercode}, high=${Math.round(high)}, low=${Math.round(low)}`);
            
            sessionWeatherData.push({
              year,
              weathercode,
              high: Math.round(high),
              low: Math.round(low)
            });
          }
        }
      }
    });
    
    console.log('[SessionWeatherHistory] Final session weather data:', sessionWeatherData);
    setYearlySessionWeather(sessionWeatherData);
  }, [hourlyData, selectedSession]);

  if (isLoading) {
    return (
      <div className="weather-history-container">
        <div className="weather-history-title">Last 5 years: Loading...</div>
        <div className="weather-history-row">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="weather-entry loading">
              <div className="weather-icon">...</div>
              <div className="weather-temps">--° --°</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (yearlySessionWeather.length === 0) {
    return null;
  }

  return (
    <div className="weather-history-container">
      <div className="weather-history-title">
        Last 5 years:
      </div>
      <div className="weather-history-row">
        {yearlySessionWeather.map((yearData) => (
          <div key={yearData.year} className="weather-entry">
            <div className="weather-icon">
              {weatherCodeToEmoji(yearData.weathercode)}
            </div>
            <div className="weather-temps">
              {yearData.high}° {yearData.low}°
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
