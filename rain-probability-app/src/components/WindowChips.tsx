
import { formatPercentage } from '../lib/stats';
import type { WindowProbabilities } from '../lib/stats';

interface WindowChipsProps {
  windowProbabilities: WindowProbabilities;
}

export function WindowChips({ windowProbabilities }: WindowChipsProps) {
  const windows = Object.values(windowProbabilities);

  const getWindowEmoji = (windowKey: string) => {
    switch (windowKey) {
      case 'morning': return '🌅';
      case 'noon': return '☀️';
      case 'afternoon': return '🌇';
      case 'evening': return '🌙';
      default: return '🕒';
    }
  };

  const getRecentYearsForWindow = (probability: number | null) => {
    // For demo purposes, simulate recent years data
    const currentYear = new Date().getFullYear();
    const recentYears = [currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4, currentYear - 5];
    
    return recentYears.map(year => {
      // Simulate rain based on probability (for demo)
      const hadRain = probability && Math.random() < probability;
      return { year, emoji: hadRain ? '🌧️' : '🥂' };
    });
  };

  return (
    <div className="card p-8">
      <h3 className="text-2xl font-bold champagne-text mb-8 text-center">
        ⏰ Champagne Session Probabilities
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {windows.map((window) => {
          const recentYears = getRecentYearsForWindow(window.probability);
          const isHighRisk = window.probability && window.probability > 0.5;
          
          return (
            <div
              key={window.label}
              className={`${isHighRisk ? 'rain-chip' : 'no-rain-chip'} relative overflow-hidden`}
            >
              <div className="text-3xl mb-2">
                {getWindowEmoji(window.label.toLowerCase())}
              </div>
              <div className={`text-2xl font-bold mb-2 ${isHighRisk ? 'text-blue-800' : 'text-amber-800'}`}>
                {formatPercentage(window.probability)}
              </div>
              <div className={`text-lg font-semibold mb-1 ${isHighRisk ? 'text-blue-700' : 'text-amber-700'}`}>
                {window.label}
              </div>
              <div className={`text-sm mb-4 ${isHighRisk ? 'text-blue-600' : 'text-amber-600'}`}>
                {window.timeRange}
              </div>
              
              {/* Recent Years Emojis for this window */}
              <div className="mt-4 p-3 bg-white/40 rounded-lg">
                <p className={`text-xs font-medium mb-2 ${isHighRisk ? 'text-blue-700' : 'text-amber-700'}`}>
                  Recent Years
                </p>
                <div className="flex justify-center space-x-2">
                  {recentYears.map(({ year, emoji }) => (
                    <div key={year} className="text-center">
                      <div className="text-lg">{emoji}</div>
                      <div className={`text-xs font-medium ${isHighRisk ? 'text-blue-600' : 'text-amber-600'}`}>
                        {year.toString().slice(-2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Recommendation */}
              <div className="mt-3 text-xs font-medium">
                {window.probability && window.probability > 0.7 ? (
                  <span className="text-blue-700">☔ High risk - indoor backup recommended</span>
                ) : window.probability && window.probability > 0.3 ? (
                  <span className="text-amber-700">🌤️ Moderate risk - watch the forecast</span>
                ) : (
                  <span className="text-green-700">🥂 Great for outdoor champagne!</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <p className="text-sm text-amber-600 mt-8 text-center bg-amber-50 p-4 rounded-xl">
        🍾 Probability of any rain during each champagne session window • Perfect for planning your celebration!
      </p>
    </div>
  );
} 