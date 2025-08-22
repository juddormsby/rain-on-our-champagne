import { useState } from 'react';
import { HourlyChart } from './components/HourlyChart';
import { CircularProgress } from './components/CircularProgress';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { calculateDailyRainProbability, calculateHourlyProbabilities, calculateWindowProbabilities, calculateTemperaturePercentiles, calculateSessionTemperaturePercentiles } from './lib/stats';
import { geocodeCity, fetchHourlyForYears, fetchDaily } from './lib/openMeteo';
import { WINDOWS, RAIN_THRESHOLD_MM } from './lib/config';
import type { WindowProbabilities, TemperaturePercentiles, SessionTemperaturePercentiles } from './lib/stats';

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
  temperaturePercentiles: TemperaturePercentiles | null;
  sessionTemperaturePercentiles: SessionTemperaturePercentiles | null;
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
    temperaturePercentiles: null,
    sessionTemperaturePercentiles: null,
  });

  const getCurrentPeriodData = () => {
    return state.windowProbabilities[state.selectedPeriod];
  };

  const getCurrentPeriodLabel = () => {
    const period = WINDOWS.find(w => w.key === state.selectedPeriod);
    return period ? period.label.toLowerCase() : 'session';
  };

  const formatTemperatureRange = (p10: number | null, p90: number | null): string => {
    if (p10 === null || p90 === null) return '—';
    return `${Math.round(p10)}°C – ${Math.round(p90)}°C`;
  };

  const openAboutPage = () => {
    const aboutContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>About - Rain on Our Champagne</title>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
        <style>
          :root {
            --bg-cream: #F6EBDD;
            --paper: #F3E7D8;
            --ink: #2E2A28;
            --ink-muted: #6E625B;
            --accent-orange: #C8681E;
            --line: #E7D7C4;
            --font-display: "Cinzel", Georgia, serif;
            --font-body: "Inter", system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
          }
          
          body {
            margin: 0;
            font-family: var(--font-body);
            background: var(--bg-cream);
            color: var(--ink);
            line-height: 1.6;
          }
          
          .about-container {
            min-height: 100vh;
            padding: 32px;
          }
          
          .about-content {
            max-width: 800px;
            margin: 0 auto;
            background: var(--paper);
            border: 1px solid var(--line);
            border-radius: 16px;
            padding: 48px;
            box-shadow: 0 6px 18px rgba(46,42,40,.08);
          }
          
          h1 {
            font-family: var(--font-display);
            font-size: 48px;
            font-weight: 700;
            color: var(--ink);
            margin-bottom: 32px;
            text-align: center;
            letter-spacing: 0.02em;
          }
          
          h2 {
            font-family: var(--font-display);
            font-size: 28px;
            font-weight: 500;
            color: var(--accent-orange);
            margin: 32px 0 16px 0;
            letter-spacing: 0.02em;
          }
          
          p {
            font-size: 16px;
            margin-bottom: 16px;
          }
          
          ul {
            margin: 16px 0;
            padding-left: 24px;
          }
          
          li {
            margin-bottom: 8px;
            font-size: 16px;
          }
          
          a {
            color: var(--accent-orange);
            text-decoration: none;
          }
          
          a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="about-container">
          <div class="about-content">
            <h1>About</h1>
            
            <p>This app is part of champagne running's commitment to champagne.</p>
            
            <p>It shows the chance of rain and typical temperature ranges (80% probability temp is within range) for any day and champagne session – morning, noon, afternoon, or evening.</p>
            
            <p>We cover the entire world.</p>
            
            <h2>What can you use it for?</h2>
            
            <p>To inform you about the likelihood it will rain on your champagne.</p>
            
            <p>Obviously.</p>
            
            <p>Other questions it may help answer include</p>
            <ul>
              <li>How hot will it be for the Alpe D'huez Triathlon (main event is morning of August 31)?</li>
              <li>What weather should I expect when hiking in ZZZ on July 15?</li>
              <li>Will it rain on my wedding? [link to youtube video].</li>
            </ul>
            
            <h2>How it works</h2>
            
            <p>Poultry looks at historical climate data for every year between 1940 and 2024.</p>
            
            <p>Probabilities reflect these long-term(-ish) averages. For example, in London it rained on 35 out of 47 times (60%) during evening champagne sessions in the post 1940 September 19th period since 1940.</p>
            
            <p>Temperature falls in the range shown historically 80% of the time. i.e. the high for London on 19th September has fallen between ZZZ (10th percentile) and YYY (90th percentile) since 1940.</p>
            
            <p>Data is ERA5-reanalysis via open-meteo API (thanks to both).</p>
            
            <h2>Poultry who?</h2>
            
            <p>Poultry is an intelligent chicken that has opinions on champagne, running, and other matters.</p>
            
            <p>Some people have claimed he is merely an artificially intelligent chicken, but Poultry knows the truth.</p>
            
            <p>Champagne running and Poultry take no responsibility for any champagne relating decisions – or decisions on any matter - based on the data shown in this app.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const newWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
    if (newWindow) {
      newWindow.document.write(aboutContent);
      newWindow.document.close();
    }
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
      const tempPercentiles = calculateTemperaturePercentiles(dailyData, targetDate);

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
      const sessionTempPercentiles = calculateSessionTemperaturePercentiles(hourlyData);

      setState(prev => ({
        ...prev,
        hourlyData: hourlyProbs,
        windowProbabilities: windowProbs,
        dailyProbability: (dailyStats.probability || 0) * 100,
        temperaturePercentiles: tempPercentiles,
        sessionTemperaturePercentiles: sessionTempPercentiles,
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
        <button 
          onClick={openAboutPage}
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
        </button>
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
                  {state.temperaturePercentiles && (
                    <div style={{ 
                      position: 'absolute',
                      top: '50%',
                      left: 'calc(50% + 120px)',
                      transform: 'translateY(-50%)',
                      fontFamily: 'var(--font-body)', 
                      fontSize: '14px', 
                      color: 'var(--ink-muted)',
                      textAlign: 'left',
                      whiteSpace: 'nowrap'
                    }}>
                      H: {formatTemperatureRange(state.temperaturePercentiles.highP10, state.temperaturePercentiles.highP90)}
                      <br />
                      L: {formatTemperatureRange(state.temperaturePercentiles.lowP10, state.temperaturePercentiles.lowP90)}
                    </div>
                  )}
                </div>
                <div className="card">
                  <CircularProgress
                    percentage={currentPeriod ? (currentPeriod.probability || 0) * 100 : 0}
                    label={`Rain during ${getCurrentPeriodLabel()} session`}
                    size={200}
                  />
                  {state.sessionTemperaturePercentiles && state.sessionTemperaturePercentiles[state.selectedPeriod] && (
                    <div style={{ 
                      position: 'absolute',
                      top: '50%',
                      left: 'calc(50% + 120px)',
                      transform: 'translateY(-50%)',
                      fontFamily: 'var(--font-body)', 
                      fontSize: '14px', 
                      color: 'var(--ink-muted)',
                      textAlign: 'left',
                      whiteSpace: 'nowrap'
                    }}>
                      H: {formatTemperatureRange(
                        state.sessionTemperaturePercentiles[state.selectedPeriod].highP10, 
                        state.sessionTemperaturePercentiles[state.selectedPeriod].highP90
                      )}
                      <br />
                      L: {formatTemperatureRange(
                        state.sessionTemperaturePercentiles[state.selectedPeriod].lowP10, 
                        state.sessionTemperaturePercentiles[state.selectedPeriod].lowP90
                      )}
                    </div>
                  )}
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
