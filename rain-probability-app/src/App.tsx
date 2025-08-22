import React, { useState } from 'react';
import { format } from 'date-fns';
import { CircularProgress } from './components/CircularProgress';
import { HourlyChart } from './components/HourlyChart';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { geocodeCity, fetchDaily, fetchHourlyForYears } from './lib/openMeteo';
import { 
  calculateDailyRainProbability, 
  calculateHourlyProbabilities, 
  calculateWindowProbabilities
} from './lib/stats';
import type { GeocodingResult } from './lib/openMeteo';
import type { DailyRainResult, WindowProbabilities } from './lib/stats';

interface AppState {
  city: string;
  country: string;
  selectedDate: Date;
  selectedPeriod: 'morning' | 'noon' | 'afternoon' | 'evening';
  loading: boolean;
  error: string | null;
  results: {
    location: GeocodingResult;
    dailyStats: DailyRainResult;
    hourlyProbabilities: (number | null)[];
    windowProbabilities: WindowProbabilities;
  } | null;
}

function App() {
  const [state, setState] = useState<AppState>({
    city: 'London',
    country: 'GB',
    selectedDate: new Date('2024-09-19'),
    selectedPeriod: 'afternoon',
    loading: false,
    error: null,
    results: null,
  });

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.city.trim()) {
      updateState({ error: 'Please enter a city name' });
      return;
    }

    updateState({ loading: true, error: null, results: null });

    try {
      const location = await geocodeCity(
        state.city.trim(), 
        state.country.trim() || undefined
      );

      const dailyData = await fetchDaily(location.latitude, location.longitude);
      const dailyStats = calculateDailyRainProbability(dailyData, state.selectedDate);
      
      if (dailyStats.years.length === 0) {
        throw new Error('No historical data available for this location and date');
      }

      const hourlyData = await fetchHourlyForYears(
        location.latitude,
        location.longitude,
        state.selectedDate.getMonth() + 1,
        state.selectedDate.getDate(),
        dailyStats.years
      );

      const hourlyProbabilities = calculateHourlyProbabilities(hourlyData);
      const windowProbabilities = calculateWindowProbabilities(hourlyData);

      updateState({
        loading: false,
        results: {
          location,
          dailyStats,
          hourlyProbabilities,
          windowProbabilities,
        },
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      updateState({
        loading: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    }
  };

  const getCurrentPeriodData = () => {
    if (!state.results) return { probability: 0, label: 'No data' };
    
    const windowData = state.results.windowProbabilities[state.selectedPeriod];
    return {
      probability: Math.round((windowData?.probability || 0) * 100),
      label: `Rain in ${windowData?.label || state.selectedPeriod}`
    };
  };

  const handleRetry = () => {
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const periodData = getCurrentPeriodData();
  const overallProbability = state.results ? Math.round((state.results.dailyStats.probability || 0) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header with Logo */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            {/* Logo - champagne celebration silhouette */}
            <div className="w-48 h-24 relative">
              <svg viewBox="0 0 200 100" className="w-full h-full">
                {/* Champagne bottle */}
                <path d="M60 70 L60 20 Q60 15 65 15 L75 15 Q80 15 80 20 L80 70 Q80 75 75 75 L65 75 Q60 75 60 70" fill="#8B4513"/>
                {/* Cork */}
                <rect x="62" y="10" width="16" height="8" fill="#DEB887"/>
                {/* Bubbles */}
                <circle cx="85" cy="25" r="2" fill="#FFD700"/>
                <circle cx="90" cy="30" r="1.5" fill="#FFD700"/>
                <circle cx="95" cy="35" r="1" fill="#FFD700"/>
                
                {/* People silhouettes */}
                {/* Person 1 */}
                <circle cx="110" cy="25" r="8" fill="#8B4513"/>
                <rect x="105" y="33" width="10" height="20" fill="#228B22"/>
                <rect x="103" y="53" width="6" height="15" fill="#000080"/>
                <rect x="111" y="53" width="6" height="15" fill="#000080"/>
                <rect x="108" y="32" width="4" height="12" fill="#DEB887"/>
                
                {/* Person 2 */}
                <circle cx="140" cy="25" r="8" fill="#8B4513"/>
                <path d="M130 33 L150 33 L148 53 L132 53 Z" fill="#8B0000"/>
                <rect x="133" y="53" width="6" height="15" fill="#000080"/>
                <rect x="141" y="53" width="6" height="15" fill="#000080"/>
                <rect x="138" y="32" width="4" height="12" fill="#DEB887"/>
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">RAIN ON OUR CHAMPAGNE</h1>
        </header>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* City Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="City"
                value={state.city}
                onChange={(e) => updateState({ city: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                disabled={state.loading}
              />
              <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2">
                🔍
              </button>
            </div>

            {/* Country Dropdown */}
            <select 
              value={state.country}
              onChange={(e) => updateState({ country: e.target.value })}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              disabled={state.loading}
            >
              <option value="">Country</option>
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="FR">France</option>
              <option value="DE">Germany</option>
              <option value="IT">Italy</option>
              <option value="ES">Spain</option>
              <option value="AU">Australia</option>
              <option value="CA">Canada</option>
            </select>

            {/* Date Input */}
            <input
              type="date"
              value={format(state.selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => {
                if (e.target.value) {
                  updateState({ selectedDate: new Date(e.target.value) });
                }
              }}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              disabled={state.loading}
            />

            {/* Period Selector */}
            <select
              value={state.selectedPeriod}
              onChange={(e) => updateState({ selectedPeriod: e.target.value as any })}
              className="px-4 py-3 bg-orange-500 text-white rounded-lg font-medium focus:ring-2 focus:ring-orange-600 outline-none"
              disabled={state.loading}
            >
              <option value="morning">Morning</option>
              <option value="noon">Noon</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>
          </div>
        </form>

        {/* Loading State */}
        {state.loading && (
          <LoadingSpinner message="Fetching weather data..." />
        )}

        {/* Error State */}
        {state.error && (
          <ErrorMessage error={state.error} onRetry={handleRetry} />
        )}

        {/* Results */}
        {state.results && (
          <div className="space-y-8">
            
            {/* Period Tabs */}
            <div className="flex justify-center space-x-4">
              {['morning', 'noon', 'afternoon', 'evening'].map((period) => (
                <button
                  key={period}
                  onClick={() => updateState({ selectedPeriod: period as any })}
                  className={`px-6 py-2 rounded-lg font-medium capitalize transition-colors ${
                    state.selectedPeriod === period
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

            {/* Circular Progress Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              <CircularProgress
                percentage={overallProbability}
                label="Rain on"
              />
              <CircularProgress
                percentage={periodData.probability}
                label={periodData.label}
              />
            </div>

            {/* Hourly Chart */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Hourly chance of rain</h3>
              <HourlyChart hourlyProbabilities={state.results.hourlyProbabilities} />
            </div>

            {/* Period Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(state.results.windowProbabilities).map(([key, data]) => (
                <div
                  key={key}
                  className={`p-4 rounded-lg text-center ${
                    key === state.selectedPeriod ? 'bg-orange-500 text-white' : 'bg-gray-100'
                  }`}
                >
                  <div className="text-lg font-bold">
                    {Math.round((data.probability || 0) * 100)}%
                  </div>
                  <div className="text-sm capitalize">{data.label}</div>
                </div>
              ))}
            </div>

            {/* Data Source */}
            <div className="text-center text-sm text-gray-500">
              Data: Open-Meteo historical reanalysis
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
