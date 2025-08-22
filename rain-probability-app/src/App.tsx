import React, { useState } from 'react';
import { format } from 'date-fns';
import { CityPicker } from './components/CityPicker';
import { DatePicker } from './components/DatePicker';
import { HourlyChart } from './components/HourlyChart';
import { WindowChips } from './components/WindowChips';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { geocodeCity, fetchDaily, fetchHourlyForYears } from './lib/openMeteo';
import { 
  calculateDailyRainProbability, 
  calculateHourlyProbabilities, 
  calculateWindowProbabilities,
  formatPercentage 
} from './lib/stats';
import type { GeocodingResult } from './lib/openMeteo';
import type { DailyRainResult, WindowProbabilities } from './lib/stats';

interface AppState {
  city: string;
  country: string;
  selectedDate: Date;
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
    selectedDate: new Date('2024-09-19'), // Default to September 19th
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
      // Step 1: Geocode the city
      const location = await geocodeCity(
        state.city.trim(), 
        state.country.trim() || undefined
      );

      // Step 2: Fetch daily data for full range
      const dailyData = await fetchDaily(location.latitude, location.longitude);
      
      // Step 3: Calculate daily rain probability
      const dailyStats = calculateDailyRainProbability(dailyData, state.selectedDate);
      
      if (dailyStats.years.length === 0) {
        throw new Error('No historical data available for this location and date');
      }

      // Step 4: Fetch hourly data for each year
      const hourlyData = await fetchHourlyForYears(
        location.latitude,
        location.longitude,
        state.selectedDate.getMonth() + 1,
        state.selectedDate.getDate(),
        dailyStats.years
      );

      // Step 5: Calculate hourly and window probabilities
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

  const handleRetry = () => {
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Rain on Our Champagne
          </h1>
          <p className="text-gray-600">
            Historical rain probability for any city and date since 1940
          </p>
        </header>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CityPicker
              city={state.city}
              country={state.country}
              onCityChange={(city) => updateState({ city })}
              onCountryChange={(country) => updateState({ country })}
              disabled={state.loading}
            />
            
            <DatePicker
              selectedDate={state.selectedDate}
              onDateChange={(date) => updateState({ selectedDate: date })}
              disabled={state.loading}
            />
            
            <div className="flex items-end">
              <button
                type="submit"
                disabled={state.loading || !state.city.trim()}
                className="btn-primary w-full"
              >
                {state.loading ? 'Analyzing...' : 'Get Rain Stats'}
              </button>
            </div>
          </div>
        </form>

        {/* Loading State */}
        {state.loading && (
          <LoadingSpinner message="Fetching historical weather data..." />
        )}

        {/* Error State */}
        {state.error && (
          <ErrorMessage error={state.error} onRetry={handleRetry} />
        )}

        {/* Results */}
        {state.results && (
          <div className="space-y-6">
            {/* Daily Summary */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Rain on {format(state.selectedDate, 'MMMM d')} in {state.results.location.name}
              </h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <div className="text-4xl font-bold text-blue-900 mb-2">
                  {formatPercentage(state.results.dailyStats.probability)}
                </div>
                <p className="text-blue-800">
                  of years since {Math.min(...state.results.dailyStats.years)} had rain on this date
                </p>
                <p className="text-sm text-blue-600 mt-2">
                  {state.results.dailyStats.rainyYears} out of {state.results.dailyStats.totalYears} years
                </p>
              </div>
            </div>

            {/* Hourly Chart */}
            <HourlyChart hourlyProbabilities={state.results.hourlyProbabilities} />

            {/* Time Windows */}
            <WindowChips windowProbabilities={state.results.windowProbabilities} />
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-xs text-gray-500 mt-12 pt-8 border-t border-gray-200">
          <p>
            Data: Open-Meteo historical reanalysis • Local time • Rain threshold &gt;0.0mm
          </p>
          <p className="mt-1">
            Built for Netlify • No backend required • Data cached in your browser
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
