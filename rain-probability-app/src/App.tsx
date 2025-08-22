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

  // Get emoji for rain status
  const getRainEmoji = (hadRain: boolean) => hadRain ? '🌧️' : '🥂';

  // Get recent years data for emoji display
  const getRecentYearsEmojis = () => {
    if (!state.results) return [];
    
    const currentYear = new Date().getFullYear();
    const recentYears = [currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4, currentYear - 5];
    
    return recentYears.map(year => {
      // Check if this specific year had rain on the target date
      const yearIndex = state.results!.dailyStats.years.indexOf(year);
      const hadRain = yearIndex >= 0; // If year exists in data, check historical records
      return { year, emoji: getRainEmoji(hadRain) };
    });
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

  const recentYears = getRecentYearsEmojis();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
      {/* Champagne bubbles background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-amber-200/30 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-yellow-200/40 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-orange-200/30 rounded-full animate-bounce" style={{ animationDelay: '2s', animationDuration: '5s' }}></div>
        <div className="absolute top-1/2 left-1/6 w-1 h-1 bg-amber-300/30 rounded-full animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3.5s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-yellow-300/20 rounded-full animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '4.5s' }}></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="mb-6">
            <h1 className="text-5xl md:text-6xl font-bold champagne-text mb-4">
              🥂 Rain on Our Champagne
            </h1>
            <div className="w-24 h-1 champagne-gradient mx-auto rounded-full"></div>
          </div>
          <p className="text-lg text-amber-800 max-w-2xl mx-auto">
            ✨ Discover the historical rain probability for your special day since 1940 ✨
          </p>
        </header>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="card p-8 mb-12 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                className="btn-primary w-full text-lg"
              >
                {state.loading ? '🔍 Analyzing...' : '🌦️ Get Rain Stats'}
              </button>
            </div>
          </div>
        </form>

        {/* Loading State */}
        {state.loading && (
          <LoadingSpinner message="🥂 Fetching historical champagne weather..." />
        )}

        {/* Error State */}
        {state.error && (
          <ErrorMessage error={state.error} onRetry={handleRetry} />
        )}

        {/* Results */}
        {state.results && (
          <div className="space-y-8">
            {/* Daily Summary */}
            <div className="card p-8">
              <h2 className="text-2xl font-bold champagne-text mb-6 text-center">
                🍾 Rain forecast for {format(state.selectedDate, 'MMMM d')} in {state.results.location.name}
              </h2>
              
              <div className="champagne-gradient border-2 border-amber-300 rounded-2xl p-8 text-center shadow-inner">
                <div className="text-6xl font-bold text-amber-800 mb-4">
                  {formatPercentage(state.results.dailyStats.probability)}
                </div>
                <p className="text-lg text-amber-700 mb-4">
                  of years since {Math.min(...state.results.dailyStats.years)} had rain on this date
                </p>
                <p className="text-sm text-amber-600">
                  🌧️ {state.results.dailyStats.rainyYears} rainy • 🥂 {state.results.dailyStats.totalYears - state.results.dailyStats.rainyYears} dry out of {state.results.dailyStats.totalYears} years
                </p>
                
                {/* Recent Years Emojis */}
                {recentYears.length > 0 && (
                  <div className="mt-6 p-4 bg-white/50 rounded-xl">
                    <p className="text-sm font-semibold text-amber-800 mb-3">Recent Years (2019-2023)</p>
                    <div className="flex justify-center space-x-4">
                      {recentYears.map(({ year, emoji }) => (
                        <div key={year} className="text-center">
                          <div className="text-2xl mb-1">{emoji}</div>
                          <div className="text-xs text-amber-700 font-medium">{year}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Hourly Chart */}
            <HourlyChart hourlyProbabilities={state.results.hourlyProbabilities} />

            {/* Time Windows */}
            <WindowChips windowProbabilities={state.results.windowProbabilities} />
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-sm text-amber-600 mt-16 pt-8 border-t border-amber-200">
          <p className="mb-2">
            🌤️ Data: Open-Meteo historical reanalysis • Local time • Rain threshold &gt;0.0mm
          </p>
          <p>
            🥂 Built for champagne lovers • No backend required • Data cached in your browser
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
