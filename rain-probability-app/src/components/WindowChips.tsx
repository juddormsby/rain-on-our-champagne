
import { formatPercentage } from '../lib/stats';
import type { WindowProbabilities } from '../lib/stats';

interface WindowChipsProps {
  windowProbabilities: WindowProbabilities;
}

export function WindowChips({ windowProbabilities }: WindowChipsProps) {
  const windows = Object.values(windowProbabilities);

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Time Window Probabilities
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {windows.map((window) => (
          <div
            key={window.label}
            className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 text-center"
          >
            <div className="text-lg font-bold text-blue-900">
              {formatPercentage(window.probability)}
            </div>
            <div className="text-sm font-medium text-blue-800 mt-1">
              {window.label}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              {window.timeRange}
            </div>
          </div>
        ))}
      </div>
      
      <p className="text-xs text-gray-500 mt-4">
        Probability of any rain during each 3-hour window
      </p>
    </div>
  );
} 