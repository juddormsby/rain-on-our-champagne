 

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts';

interface HourlyChartProps {
  hourlyProbabilities: (number | null)[];
  isLoading?: boolean;
  hasData?: boolean;
}

export function HourlyChart({ hourlyProbabilities, isLoading = false, hasData = true }: HourlyChartProps) {

  // Generate placeholder data for loading state
  const generatePlaceholderData = () => {
    return Array.from({ length: 24 }, (_, hour) => ({
      hour: String(hour).padStart(2, '0'),
      probability: isLoading ? Math.random() * 20 + 10 : 0, // Random small values for loading
    }));
  };

  const data = hasData && !isLoading ? 
    hourlyProbabilities.map((prob, hour) => {
      // Convert decimal probability to percentage (0-100 range)
      const percentage = prob ? Math.round(prob * 100) : 0;
      return {
        hour: String(hour).padStart(2, '0'),
        probability: percentage,
      };
    }) : generatePlaceholderData();



  // Clean container style
  const containerStyle = {
    backgroundColor: 'var(--paper)',
    borderRadius: '16px',
    padding: '24px'
  };

  if (isLoading) {
    return (
      <div className="h-64 w-full relative" style={containerStyle}>
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600 min-w-[3ch] text-center mb-2">
              ...
            </div>
            <div style={{ 
              fontFamily: 'var(--font-body)', 
              fontSize: '14px', 
              color: 'var(--ink-muted)' 
            }}>
              Uncorking hourly data... 🍾
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <XAxis 
              dataKey="hour"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              interval={1}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              domain={[0, 100]}
            />
            <Bar 
              dataKey="probability" 
              fill="var(--line)"
              radius={[2, 2, 0, 0]}
              opacity={0.3}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="h-64 w-full flex items-center justify-center" style={containerStyle}>
        <div className="text-center">
          <div style={{ 
            fontFamily: 'var(--font-body)', 
            fontSize: '16px', 
            color: 'var(--ink-muted)',
            marginBottom: '8px'
          }}>
            No hourly data available
          </div>
          <div style={{ 
            fontFamily: 'var(--font-body)', 
            fontSize: '14px', 
            color: 'var(--ink-muted)' 
          }}>
            Try searching for a different location or date
          </div>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className="h-64 w-full" style={containerStyle}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <XAxis 
              dataKey="hour"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              interval={1}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              domain={[0, 'dataMax + 5']}
              tickFormatter={(value) => `${value}%`}
            />
            <Bar 
              dataKey="probability" 
              fill="var(--accent-orange)"
              radius={[2, 2, 0, 0]}
              minPointSize={3}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  } catch (error) {
    console.error('[HourlyChart] Error rendering chart:', error);
    return (
      <div className="h-64 w-full flex items-center justify-center" style={containerStyle}>
        <div className="text-center">
          <div style={{ 
            fontFamily: 'var(--font-body)', 
            fontSize: '16px', 
            color: 'var(--accent-orange)',
            marginBottom: '8px'
          }}>
            Chart Error
          </div>
          <div style={{ 
            fontFamily: 'var(--font-body)', 
            fontSize: '14px', 
            color: 'var(--ink-muted)' 
          }}>
            {error instanceof Error ? error.message : 'Unknown error rendering chart'}
          </div>
        </div>
      </div>
    );
  }
} 