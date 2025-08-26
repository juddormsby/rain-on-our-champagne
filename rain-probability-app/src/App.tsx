import { useState } from 'react';
import { Link } from 'react-router-dom';

import { CircularProgress } from './components/CircularProgress';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { AIChicken } from './components/AIChicken';
import { WeatherHistory } from './components/WeatherHistory';
import { SessionWeatherHistory } from './components/SessionWeatherHistory';
import { calculateDailyRainProbability, calculateWindowProbabilities, calculateTemperaturePercentiles, calculateSessionTemperaturePercentiles, calculateSunTimes } from './lib/stats';
import { geocodeCity, fetchDaily, fetchHourlyForYears } from './lib/openMeteo';
import { WINDOWS, RAIN_THRESHOLD_MM } from './lib/config';
import type { WindowProbabilities, TemperaturePercentiles, SessionTemperaturePercentiles, SunTimesResult } from './lib/stats';
import type { GeocodingResult, DailyData, HourlyYearResult } from './lib/openMeteo';

interface AppState {
  city: string;
  country: string;
  selectedDay: string;
  selectedMonth: string;
  selectedSession: string;
  geoResults: GeocodingResult[];
  isLoading: boolean;
  error: string | null;
  showCoordinateInput: boolean;
  latitude: string;
  longitude: string;
  rainProbability: number;
  sessionProbability: number;
  windowProbabilities: WindowProbabilities;
  hasData: boolean;
  hasDailyData: boolean; // New flag for partial data display
  selectedLocation: string;
  temperaturePercentiles: TemperaturePercentiles | null;
  sessionTemperaturePercentiles: SessionTemperaturePercentiles | null;
  dailyData: { daily: DailyData } | null;
  hourlyData: HourlyYearResult[];
  sunTimes: SunTimesResult | null;
}

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

function App() {
  const [state, setState] = useState<AppState>({
    city: 'London',
    country: 'United Kingdom',
    latitude: '',
    longitude: '',
    showCoordinateInput: false,
    selectedDay: '19',
    selectedMonth: '09',
    selectedSession: 'afternoon',
    geoResults: [],
    isLoading: false,
    hasData: false,
    hasDailyData: false,
    error: null,
    windowProbabilities: {},
    rainProbability: 0,
    sessionProbability: 0,
    selectedLocation: '',
    temperaturePercentiles: null,
    sessionTemperaturePercentiles: null,
    dailyData: null,
    hourlyData: [],
    sunTimes: null,
  });

  const getCurrentPeriodData = () => {
    return state.windowProbabilities[state.selectedSession];
  };

  const getCurrentPeriodLabel = () => {
    const period = WINDOWS.find(w => w.key === state.selectedSession);
    return period ? period.label.toLowerCase() : 'session';
  };

  const getAIChickenData = () => {
    if (!state.hasData || !state.temperaturePercentiles || !state.sessionTemperaturePercentiles) {
      return null;
    }

    const sessionTempData = state.sessionTemperaturePercentiles[state.selectedSession];
    const currentPeriod = getCurrentPeriodData();
    const period = WINDOWS.find(w => w.key === state.selectedSession);
    const totalYears = state.temperaturePercentiles.years.length;
    const rainProbability = currentPeriod ? (currentPeriod.probability || 0) * 100 : 0;

    // Get historical weather data for the session
    const historicalWeather: Array<{
      year: number;
      weather: string;
      high: number;
      low: number;
    }> = [];
    if (state.hourlyData && state.hourlyData.length > 0) {
      const years = [2020, 2021, 2022, 2023, 2024];
      years.forEach(year => {
        const yearData = state.hourlyData.find(data => data.year === year);
        if (yearData && yearData.hours) {
          const sessionHours = yearData.hours.filter(hour => {
            const hourIndex = new Date(hour.time).getHours();
            return hourIndex >= (period?.start || 0) && hourIndex < (period?.end || 24);
          });
          
          if (sessionHours.length > 0) {
            const firstHourWeatherCode = sessionHours[0].weathercode;
            const sessionTemps = sessionHours.map(h => h.temp).filter(t => t !== null) as number[];
            
            if (firstHourWeatherCode !== null && sessionTemps.length > 0) {
              // Convert weather code to emoji (same logic as in SessionWeatherHistory)
              let weatherEmoji = '❓';
              if (firstHourWeatherCode >= 0 && firstHourWeatherCode <= 3) weatherEmoji = '☀️';
              else if (firstHourWeatherCode >= 45 && firstHourWeatherCode <= 48) weatherEmoji = '🌫️';
              else if (firstHourWeatherCode >= 51 && firstHourWeatherCode <= 55) weatherEmoji = '🌦️';
              else if (firstHourWeatherCode >= 56 && firstHourWeatherCode <= 57) weatherEmoji = '🌨️';
              else if (firstHourWeatherCode >= 61 && firstHourWeatherCode <= 65) weatherEmoji = '🌧️';
              else if (firstHourWeatherCode >= 66 && firstHourWeatherCode <= 67) weatherEmoji = '🌨️';
              else if (firstHourWeatherCode >= 71 && firstHourWeatherCode <= 75) weatherEmoji = '🌨️';
              else if (firstHourWeatherCode === 77) weatherEmoji = '🌨️';
              else if (firstHourWeatherCode >= 80 && firstHourWeatherCode <= 82) weatherEmoji = '🌧️';
              else if (firstHourWeatherCode >= 85 && firstHourWeatherCode <= 86) weatherEmoji = '🌨️';
              else if (firstHourWeatherCode === 95) weatherEmoji = '⛈️';
              else if (firstHourWeatherCode >= 96 && firstHourWeatherCode <= 99) weatherEmoji = '⛈️';
              else if (firstHourWeatherCode >= 4 && firstHourWeatherCode <= 44) weatherEmoji = '☁️';
              else if (firstHourWeatherCode >= 58 && firstHourWeatherCode <= 60) weatherEmoji = '🌧️';
              else if (firstHourWeatherCode >= 68 && firstHourWeatherCode <= 70) weatherEmoji = '🌨️';
              else if (firstHourWeatherCode >= 76 && firstHourWeatherCode <= 76) weatherEmoji = '🌨️';
              else if (firstHourWeatherCode >= 83 && firstHourWeatherCode <= 84) weatherEmoji = '🌧️';
              else if (firstHourWeatherCode >= 87 && firstHourWeatherCode <= 94) weatherEmoji = '🌨️';
              
              historicalWeather.push({
                year,
                weather: weatherEmoji,
                high: Math.round(Math.max(...sessionTemps)),
                low: Math.round(Math.min(...sessionTemps))
              });
            }
          }
        }
      });
    }

    return {
      location: `${state.city}, ${state.country}`,
      date: `${state.selectedMonth}/${state.selectedDay}`,
      session: period?.label || 'session',
      sessionTime: `${period?.start || ''}:00-${period?.end || ''}:00`,
      rainProbability: Math.round(rainProbability),
      tempLow: sessionTempData?.lowP10 ? Math.round(sessionTempData.lowP10) : null,
      tempHigh: sessionTempData?.highP90 ? Math.round(sessionTempData.highP90) : null,
      totalYears: totalYears,
      rainyYears: Math.round((rainProbability / 100) * totalYears),
      sunrise: state.sunTimes?.sunrise ? formatTime(state.sunTimes.sunrise) : null,
      sunset: state.sunTimes?.sunset ? formatTime(state.sunTimes.sunset) : null,
      historicalWeather,
    };
  };

  const formatTemperatureRange = (p10: number | null, p90: number | null): string => {
    if (p10 === null || p90 === null) return '—';
    return `${Math.round(p10)}°C – ${Math.round(p90)}°C`;
  };

  const formatTime = (timeString: string | null): string => {
    if (!timeString) return '—';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: false 
      });
    } catch {
      return '—';
    }
  };

  const fetchRainData = async (retryCount = 0) => {
    let latitude: number, longitude: number;

    console.log(`[RainApp] Starting data fetch (attempt ${retryCount + 1})`);

    // If coordinate inputs are filled, use them
    if (state.latitude.trim() && state.longitude.trim()) {
      const lat = parseFloat(state.latitude);
      const lon = parseFloat(state.longitude);
      
      if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        setState(prev => ({ ...prev, error: 'Please enter valid coordinates (latitude: -90 to 90, longitude: -180 to 180)' }));
        return;
      }
      
      latitude = lat;
      longitude = lon;
      console.log(`[RainApp] Using manual coordinates: ${latitude}, ${longitude}`);
    } else {
      // Try city search first
      if (!state.city.trim()) {
        setState(prev => ({ ...prev, error: 'Please enter a city name' }));
        return;
      }

      try {
        console.log(`[RainApp] Geocoding city: ${state.city}, ${state.country}`);
        const locations = await geocodeCity(state.city, state.country);
        if (locations.length === 0) {
          setState(prev => ({ 
            ...prev, 
            error: 'City not found. Please check the spelling or enter coordinates below.', 
            showCoordinateInput: true 
          }));
          return;
        }
        const location = locations[0];
        latitude = location.latitude;
        longitude = location.longitude;
        console.log(`[RainApp] Geocoded to: ${latitude}, ${longitude}`);
      } catch (geoError) {
        console.error('[RainApp] Geocoding error:', geoError);
        setState(prev => ({ 
          ...prev, 
          error: 'City search failed. Please try using coordinates below.', 
          showCoordinateInput: true 
        }));
        return;
      }
    }

    // Set loading but preserve existing data initially
    setState(prev => ({ ...prev, isLoading: true, error: null, showCoordinateInput: false }));

    try {
      const targetDate = new Date(2024, parseInt(state.selectedMonth) - 1, parseInt(state.selectedDay));
      console.log(`[RainApp] Target date: ${targetDate.toISOString().slice(0, 10)}`);

      // Get daily data for rain probability calculation
      console.log('[RainApp] Fetching daily data...');
      const dailyData = await fetchDaily(latitude, longitude);
      console.log(`[RainApp] Daily data received, time entries: ${dailyData.daily?.time?.length || 0}`);
      
      const dailyStats = calculateDailyRainProbability(dailyData, targetDate);
      console.log(`[RainApp] Daily stats: ${dailyStats.totalYears} years, ${dailyStats.rainyYears} rainy, probability: ${dailyStats.probability}`);
      
      const tempPercentiles = calculateTemperaturePercentiles(dailyData, targetDate);
      console.log(`[RainApp] Temperature percentiles calculated for ${tempPercentiles.years.length} years`);
      
      const sunTimes = calculateSunTimes(dailyData, targetDate);
      console.log(`[RainApp] Sun times calculated: sunrise ${sunTimes.sunrise}, sunset ${sunTimes.sunset}`);

      // Validate daily data before proceeding
      if (dailyStats.totalYears === 0) {
        throw new Error('No historical data available for this date and location');
      }

      // Update state with daily data immediately for early painting
      setState(prev => ({
        ...prev,
        rainProbability: dailyStats.probability || 0,
        temperaturePercentiles: tempPercentiles,
        sunTimes: sunTimes,
        dailyData: dailyData,
        selectedLocation: `${state.city}, ${state.country}`,
        hasDailyData: true
      }));

      // Get hourly data for session calculations
      console.log(`[RainApp] Fetching hourly data for ${dailyStats.years.length} years...`);
      const hourlyData = await fetchHourlyForYears(
        latitude,
        longitude,
        targetDate.getMonth() + 1,
        targetDate.getDate(),
        dailyStats.years
      );

      // Validate hourly data
      const validHourlyYears = hourlyData.filter(year => year.hours !== null).length;
      console.log(`[RainApp] Hourly data received for ${validHourlyYears}/${hourlyData.length} years`);
      
      if (validHourlyYears === 0) {
        console.warn('[RainApp] No valid hourly data received, using daily data only');
      }

      const windowProbs = calculateWindowProbabilities(hourlyData);
      const sessionTempPercentiles = calculateSessionTemperaturePercentiles(hourlyData);
      const currentPeriod = windowProbs[state.selectedSession];

      console.log('[RainApp] All calculations completed successfully');

      setState(prev => ({
        ...prev,
        windowProbabilities: windowProbs,
        rainProbability: (dailyStats.probability || 0) * 100,
        sessionProbability: (currentPeriod ? (currentPeriod.probability || 0) * 100 : 0),
        temperaturePercentiles: tempPercentiles,
        sessionTemperaturePercentiles: sessionTempPercentiles,
        sunTimes: sunTimes,
        hourlyData: hourlyData,
        isLoading: false,
        hasData: true,
        hasDailyData: true,
        selectedLocation: `${state.city}, ${state.country}`,
      }));

    } catch (error) {
      console.error('[RainApp] Error during data fetch:', error);
      
      // Check if it's a rate limit error (429)
      const isRateLimited = error instanceof Error && error.message.includes('429');
      const isTimeout = error instanceof Error && (error.message.includes('timeout') || error.message.includes('AbortError'));
      
      if ((isRateLimited || isTimeout) && retryCount < 2) {
        const delayMs = isRateLimited ? 5000 + (retryCount * 2000) : 1000; // Longer delay for rate limits
        console.log(`[RainApp] ${isRateLimited ? 'Rate limited' : 'Timeout'}, retrying in ${delayMs}ms...`);
        
        setState(prev => ({
          ...prev,
          error: `${isRateLimited ? 'API rate limit reached' : 'Request timed out'}, retrying in ${Math.ceil(delayMs/1000)} seconds...`,
          isLoading: true
        }));
        
        setTimeout(() => {
          fetchRainData(retryCount + 1);
        }, delayMs);
        return;
      }
      
      // Format error message for user
      let userError = 'An unexpected error occurred';
      if (error instanceof Error) {
        if (error.message.includes('429')) {
          userError = 'API rate limit exceeded. Please wait a few minutes before trying again, or try using an incognito/private browser window.';
        } else if (error.message.includes('timeout') || error.message.includes('AbortError')) {
          userError = 'Request timed out. Please check your internet connection and try again.';
        } else if (error.message.includes('No historical data')) {
          userError = error.message;
        } else {
          userError = `Weather data fetch failed: ${error.message}`;
        }
      }
      
      setState(prev => ({
        ...prev,
        error: userError,
        isLoading: false
      }));
    }
  };

  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
      {/* Header */}
      <div className="logo-container">
        <svg className="logo-svg" viewBox="0 0 288 205" xmlns="http://www.w3.org/2000/svg">
          <image
            width="288"
            height="205"
            preserveAspectRatio="none"
            href="/people-logo.svg"
          />
        </svg>
        <h1 className="app-title">WILL IT RAIN ON OUR CHAMPAGNE?</h1>
        <Link
          to="/about"
          className="about-button"
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            background: 'transparent',
            border: '1px solid var(--accent-orange)',
            color: 'var(--accent-orange)',
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            fontWeight: '500',
            padding: '8px 16px',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent-orange)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--accent-orange)';
          }}
        >
          About
        </Link>
      </div>

      {/* Controls */}
      <div className="controls-grid">
        <div>
          <label htmlFor="city" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>City</label>
          <input
            id="city"
            type="text"
            value={state.city}
            onChange={(e) => setState(prev => ({ ...prev, city: e.target.value }))}
            className="input-field"
            style={{ width: '100%' }}
            placeholder="Enter city name"
          />
        </div>
        
        <div>
          <label htmlFor="country" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Country</label>
          <input
            id="country"
            type="text"
            value={state.country}
            onChange={(e) => setState(prev => ({ ...prev, country: e.target.value }))}
            className="input-field"
            style={{ width: '100%' }}
            placeholder="Enter country"
          />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
          <div>
            <label htmlFor="day" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Day</label>
            <input
              id="day"
              type="number"
              min="1"
              max="31"
              value={state.selectedDay}
              onChange={(e) => setState(prev => ({ ...prev, selectedDay: e.target.value }))}
              className="input-field"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label htmlFor="month" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Month</label>
            <select
              id="month"
              value={state.selectedMonth}
              onChange={(e) => setState(prev => ({ ...prev, selectedMonth: e.target.value }))}
              className="select-field"
              style={{ width: '100%' }}
            >
              {MONTHS.map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
      <div>
          <label htmlFor="session" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Session</label>
          <select
            id="session"
            value={state.selectedSession}
            onChange={(e) => setState(prev => ({ ...prev, selectedSession: e.target.value }))}
            className="select-field"
            style={{ width: '100%' }}
          >
            {WINDOWS.map(window => (
              <option key={window.key} value={window.key}>
                {window.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Go Button */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <button 
          onClick={() => fetchRainData()}
          disabled={state.isLoading || !state.city.trim()}
          className="button-primary"
          style={{ fontSize: '16px', padding: '0 32px' }}
        >
          {state.isLoading ? 'Uncorking weather data... 🍾' : 'Check Rain Probability'}
        </button>
      </div>

      {state.error && <ErrorMessage error={state.error} />}

      {/* Coordinate fallback inputs - only show when city search fails */}
      {state.showCoordinateInput && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ 
            background: 'var(--paper)', 
            border: '1px solid var(--line)', 
            borderRadius: '12px', 
            padding: '24px',
            boxShadow: '0 4px 12px rgba(46,42,40,.06)'
          }}>
            <h3 style={{ 
              marginTop: '0', 
              marginBottom: '16px', 
              fontFamily: 'var(--font-display)', 
              fontSize: '18px',
              color: 'var(--accent-orange)' 
            }}>
              Try using coordinates instead
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label htmlFor="latitude" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Latitude (-90 to 90)
                </label>
                <input
                  id="latitude"
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  value={state.latitude}
                  onChange={(e) => setState(prev => ({ ...prev, latitude: e.target.value }))}
                  className="input-field"
                  style={{ width: '100%' }}
                  placeholder="e.g. 51.5074"
                />
              </div>
              
              <div>
                <label htmlFor="longitude" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Longitude (-180 to 180)
                </label>
                <input
                  id="longitude"
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  value={state.longitude}
                  onChange={(e) => setState(prev => ({ ...prev, longitude: e.target.value }))}
                  className="input-field"
                  style={{ width: '100%' }}
                  placeholder="e.g. -0.1278"
                />
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button 
                onClick={() => fetchRainData()}
                disabled={state.isLoading || !state.latitude.trim() || !state.longitude.trim()}
                className="button-primary"
                style={{ fontSize: '14px', padding: '8px 24px' }}
              >
                                  {state.isLoading ? 'Uncorking weather data... 🍾' : 'Try Coordinates'}
              </button>
            </div>
          </div>
        </div>
      )}

      {state.isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* Show results as soon as we have daily data */}
          {state.hasDailyData && (
            <>
              {/* Gauges */}
              <div className="gauges-grid">
                <div className="card gauge-card">
                  <div className="gauge-section">
                    <CircularProgress
                      percentage={state.rainProbability}
                      label="Rain on the day"
                      size={200}
                      isLoading={false}
                      hasData={state.hasDailyData}
                    />
                  </div>
                  {state.temperaturePercentiles && (
                    <div className="temperature-section">
                      <div className="temperature-row">
                        <span className="temperature-label">H:</span>
                        <span className="temperature-range">
                          {formatTemperatureRange(state.temperaturePercentiles.highP10, state.temperaturePercentiles.highP90)}
                        </span>
                      </div>
                      <div className="temperature-row">
                        <span className="temperature-label">L:</span>
                        <span className="temperature-range">
                          {formatTemperatureRange(state.temperaturePercentiles.lowP10, state.temperaturePercentiles.lowP90)}
                        </span>
                      </div>
                      
                                             {/* Weather History - Historical patterns for this date */}
                       <WeatherHistory 
                         key={`weather-history-${state.selectedMonth}-${state.selectedDay}`}
                         dailyData={state.dailyData}
                         isLoading={state.isLoading}
                         targetDate={new Date(2024, parseInt(state.selectedMonth) - 1, parseInt(state.selectedDay))}
                       />
                       
                       {/* Sun Times - underneath weather history */}
                       {state.sunTimes && (
                         <div className="sun-times-section">
                           <div className="sun-times-row">
                             <div className="sun-time-item">
                               <span className="sun-time-icon">🌅</span>
                               <span className="sun-time-value">{formatTime(state.sunTimes.sunrise)}</span>
                             </div>
                             <div className="sun-time-item">
                               <span className="sun-time-icon">🌇</span>
                               <span className="sun-time-value">{formatTime(state.sunTimes.sunset)}</span>
                             </div>
                           </div>
                         </div>
                       )}
                    </div>
                  )}
                </div>
                <div className="card gauge-card">
                  <div className="gauge-section">
                    <CircularProgress
                      percentage={state.sessionProbability}
                      label={`Rain during ${getCurrentPeriodLabel()} session`}
                      size={200}
                      isLoading={state.isLoading}
                      hasData={state.hasData}
                    />
                  </div>
                  {state.sessionTemperaturePercentiles && state.sessionTemperaturePercentiles[state.selectedSession] && (
                    <div className="temperature-section">
                      <div className="temperature-row">
                        <span className="temperature-label">H:</span>
                        <span className="temperature-range">
                          {formatTemperatureRange(
                            state.sessionTemperaturePercentiles[state.selectedSession].highP10, 
                            state.sessionTemperaturePercentiles[state.selectedSession].highP90
                          )}
                        </span>
                      </div>
                      <div className="temperature-row">
                        <span className="temperature-label">L:</span>
                        <span className="temperature-range">
                          {formatTemperatureRange(
                            state.sessionTemperaturePercentiles[state.selectedSession].lowP10, 
                            state.sessionTemperaturePercentiles[state.selectedSession].lowP90
                          )}
                        </span>
                      </div>
                      
                      {/* Session Weather History - Historical patterns for this session */}
                      <SessionWeatherHistory 
                        key={`session-weather-history-${state.selectedMonth}-${state.selectedDay}-${state.selectedSession}`}
                        hourlyData={state.hourlyData}
                        isLoading={state.isLoading}
                        selectedSession={state.selectedSession}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Session Tabs */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '32px' }}>
                {WINDOWS.map(window => (
                  <button
                    key={window.key}
                    onClick={() => setState(prev => ({ ...prev, selectedSession: window.key }))}
                    className={`session-chip ${state.selectedSession === window.key ? 'active' : ''}`}
                  >
                    {window.label}
                  </button>
                ))}
              </div>

              {/* Summary Grid */}
              <div className="summary-grid">
                {WINDOWS.map(window => {
                  const windowData = state.windowProbabilities[window.key];
                  return (
                    <div key={window.key} className="card" style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontFamily: 'var(--font-body)', 
                        fontSize: '14px', 
                        fontWeight: '500',
                        color: 'var(--ink-muted)',
                        marginBottom: '8px'
                      }}>
                        {window.label}
                      </div>
                      <div style={{ 
                        fontFamily: 'var(--font-display)', 
                        fontSize: '24px', 
                        fontWeight: '700',
                        color: windowData?.probability && windowData.probability > 0.3 ? 'var(--accent-orange)' : 'var(--bottle-green)'
                      }}>
                        {windowData ? Math.round((windowData.probability || 0) * 100) : 0}%
                      </div>
                      {windowData && (
                        <div style={{ 
                          fontSize: '12px', 
                          color: 'var(--ink-muted)',
                          marginTop: '4px'
                        }}>
                          {windowData.timeRange}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* AI Chicken */}
              <AIChicken 
                weatherData={getAIChickenData()}
                isVisible={state.hasData && !state.isLoading}
              />

              {/* Footnote */}
              <div className="footnote">
                Data: Open-Meteo historical reanalysis (local time, rain &gt; {RAIN_THRESHOLD_MM} mm).
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;
