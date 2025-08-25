import { useState, useEffect } from 'react';

interface WeatherHistoryProps {
  dailyData: {
    daily: {
      time: string[];
      temperature_2m_max?: number[];
      temperature_2m_min?: number[];
      weather_code?: number[];
    };
  } | null;
  isLoading: boolean;
  targetDate: Date;
}

function formatMMDD(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}

interface YearWeather {
  year: number;
  weathercode: number;
  high: number;
  low: number;
}

// WMO Weather codes to emoji mapping
const weatherCodeToEmoji = (code: number): string => {
  if (code >= 0 && code <= 3) return '☀️';      // Clear to partly cloudy
  if (code >= 45 && code <= 48) return '🌫️';   // Foggy
  if (code >= 51 && code <= 55) return '🌦️';   // Drizzle
  if (code >= 56 && code <= 57) return '🌨️';   // Freezing drizzle
  if (code >= 61 && code <= 65) return '🌧️';   // Rain
  if (code >= 66 && code <= 67) return '🌨️';   // Freezing rain
  if (code >= 71 && code <= 75) return '🌨️';   // Snow
  if (code >= 77 && code <= 77) return '🌨️';   // Snow grains
  if (code >= 80 && code <= 82) return '🌧️';   // Rain showers
  if (code >= 85 && code <= 86) return '🌨️';   // Snow showers
  if (code >= 95 && code <= 95) return '⛈️';   // Thunderstorm
  if (code >= 96 && code <= 99) return '⛈️';   // Thunderstorm with hail
  return '❓'; // Unknown code
};

export function WeatherHistory({ dailyData, isLoading, targetDate }: WeatherHistoryProps) {
  const [yearlyWeather, setYearlyWeather] = useState<YearWeather[]>([]);

  useEffect(() => {
    if (!dailyData || !dailyData.daily || !dailyData.daily.time || !dailyData.daily.temperature_2m_max || !dailyData.daily.temperature_2m_min || !dailyData.daily.weather_code) {
      return;
    }

    // Get the last 5 years of data
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 4, currentYear - 3, currentYear - 2, currentYear - 1, currentYear];
    
    const weatherData: YearWeather[] = [];
    
    console.log('[WeatherHistory] Processing years:', years);
    console.log('[WeatherHistory] Daily data available:', {
      timeLength: dailyData.daily.time?.length,
      tempMaxLength: dailyData.daily.temperature_2m_max?.length,
      tempMinLength: dailyData.daily.temperature_2m_min?.length,
      weatherCodeLength: dailyData.daily.weather_code?.length
    });
    
    // Find data for the specific target date across all years
    const targetMMDD = formatMMDD(targetDate);
    
    for (let i = 0; i < dailyData.daily.time.length; i++) {
      const date = new Date(dailyData.daily.time[i]);
      const dateMMDD = formatMMDD(date);
      
      if (dateMMDD === targetMMDD) {
        const year = date.getFullYear();
        
        // Only include years from our target list
        if (years.includes(year) && dailyData.daily.weather_code && dailyData.daily.temperature_2m_max && dailyData.daily.temperature_2m_min) {
          const weathercode = dailyData.daily.weather_code[i];
          const high = dailyData.daily.temperature_2m_max[i];
          const low = dailyData.daily.temperature_2m_min[i];
          
          console.log(`[WeatherHistory] Year ${year}: weather=${weathercode}, high=${high}, low=${low}`);
          
          if (weathercode !== undefined && high !== undefined && low !== undefined) {
            weatherData.push({
              year,
              weathercode,
              high: Math.round(high),
              low: Math.round(low)
            });
          }
        }
      }
    }
    
    console.log('[WeatherHistory] Final weather data:', weatherData);

    setYearlyWeather(weatherData);
  }, [dailyData, targetDate]);

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

  if (yearlyWeather.length === 0) {
    return null;
  }

  return (
    <div className="weather-history-container">
      <div className="weather-history-title">
        Last 5 years:
      </div>
      <div className="weather-history-row">
        {yearlyWeather.map((yearData) => (
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