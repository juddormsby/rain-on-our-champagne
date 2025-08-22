import { useState } from 'react';
import { HourlyChart } from './components/HourlyChart';
import { CircularProgress } from './components/CircularProgress';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { calculateDailyRainProbability, calculateHourlyProbabilities, calculateWindowProbabilities } from './lib/stats';
import { geocodeCity, fetchHourlyForYears, fetchDaily } from './lib/openMeteo';
import { WINDOWS } from './lib/config';
import type { WindowProbabilities } from './lib/stats';

interface AppState {
  city: string;
  country: string;
  selectedDay: string;
  selectedMonth: string;
  selectedPeriod: string;
  isLoading: boolean;
  error: string | null;
  hourlyData: (number | null)[];
  windowProbabilities: WindowProbabilities;
  dailyProbability: number;
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
    selectedDay: '19',
    selectedMonth: '09',
    selectedPeriod: 'afternoon',
    isLoading: false,
    error: null,
    hourlyData: [],
    windowProbabilities: {},
    dailyProbability: 0,
  });

  const getCurrentPeriodData = () => {
    return state.windowProbabilities[state.selectedPeriod];
  };

  const getCurrentPeriodLabel = () => {
    const period = WINDOWS.find(w => w.key === state.selectedPeriod);
    return period ? period.label.toLowerCase() : 'session';
  };

  const fetchRainData = async () => {
    if (!state.city.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter a city name' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const locations = await geocodeCity(state.city, state.country);
      if (locations.length === 0) {
        throw new Error('City not found. Please check the spelling and try again.');
      }

      const location = locations[0];
      const targetDate = new Date(2024, parseInt(state.selectedMonth) - 1, parseInt(state.selectedDay));

      // Get daily data for rain probability calculation
      const dailyData = await fetchDaily(location.latitude, location.longitude);
      const dailyStats = calculateDailyRainProbability(dailyData, targetDate);

      // Get hourly data for the specific date
      const hourlyData = await fetchHourlyForYears(
        location.latitude,
        location.longitude,
        targetDate.getMonth() + 1,
        targetDate.getDate(),
        dailyStats.years
      );

      const hourlyProbs = calculateHourlyProbabilities(hourlyData);
      const windowProbs = calculateWindowProbabilities(hourlyData);

      setState(prev => ({
        ...prev,
        hourlyData: hourlyProbs,
        windowProbabilities: windowProbs,
        dailyProbability: (dailyStats.probability || 0) * 100,
        isLoading: false
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        isLoading: false
      }));
    }
  };

  const currentPeriod = getCurrentPeriodData();

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
            value={state.selectedPeriod}
            onChange={(e) => setState(prev => ({ ...prev, selectedPeriod: e.target.value }))}
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
          onClick={fetchRainData}
          disabled={state.isLoading || !state.city.trim()}
          className="button-primary"
          style={{ fontSize: '16px', padding: '0 32px' }}
        >
          {state.isLoading ? 'Checking weather...' : 'Check Rain Probability'}
        </button>
      </div>

      {state.error && <ErrorMessage error={state.error} />}

      {state.isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* Only show results if we have data */}
          {state.hourlyData.length > 0 && (
            <>
              {/* Gauges */}
              <div className="gauges-grid">
                <div className="card">
                  <CircularProgress
                    percentage={state.dailyProbability}
                    label="Rain on the day"
                    size={200}
                  />
                </div>
                <div className="card">
                  <CircularProgress
                    percentage={currentPeriod ? (currentPeriod.probability || 0) * 100 : 0}
                    label={`Rain during ${getCurrentPeriodLabel()} session`}
                    size={200}
                  />
                </div>
              </div>

              {/* Session Tabs */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '32px' }}>
                {WINDOWS.map(window => (
                  <button
                    key={window.key}
                    onClick={() => setState(prev => ({ ...prev, selectedPeriod: window.key }))}
                    className={`session-chip ${state.selectedPeriod === window.key ? 'active' : ''}`}
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

              {/* Chart */}
              <div className="chart-container">
                <h3 className="chart-title">Hourly chance of rain</h3>
                <HourlyChart hourlyProbabilities={state.hourlyData} />
              </div>

              {/* Footnote */}
              <div className="footnote">
                Data: Open-Meteo historical reanalysis (local time, rain &gt; 0.0 mm).
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;
