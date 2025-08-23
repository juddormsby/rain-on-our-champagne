
import { useEffect } from 'react';
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
  console.log('[HourlyChart] Component rendered with props:', {
    hourlyProbabilitiesLength: hourlyProbabilities?.length,
    hourlyProbabilities: hourlyProbabilities,
    isLoading,
    hasData,
    firstFewProbs: hourlyProbabilities?.slice(0, 5)
  });

  useEffect(() => {
    console.log('[HourlyChart] Component mounted/updated');
    console.log('[HourlyChart] Recharts components available:', {
      BarChart: !!BarChart,
      Bar: !!Bar,
      XAxis: !!XAxis,
      YAxis: !!YAxis,
      ResponsiveContainer: !!ResponsiveContainer
    });
    
    // Test if we can create a simple chart element
    try {
      const testElement = document.createElement('div');
      testElement.innerHTML = 'Chart container test';
      console.log('[HourlyChart] DOM manipulation works:', !!testElement);
    } catch (error) {
      console.error('[HourlyChart] DOM error:', error);
    }
  }, []);

  // Generate placeholder data for loading state
  const generatePlaceholderData = () => {
    console.log('[HourlyChart] Generating placeholder data');
    return Array.from({ length: 24 }, (_, hour) => ({
      hour: String(hour).padStart(2, '0'),
      probability: isLoading ? Math.random() * 20 + 10 : 0, // Random small values for loading
    }));
  };

  const data = hasData && !isLoading ? 
    hourlyProbabilities.map((prob, hour) => ({
      hour: String(hour).padStart(2, '0'),
      probability: prob ? Math.round(prob * 100) : 0,
    })) : generatePlaceholderData();

  console.log('[HourlyChart] Chart data prepared:', {
    dataLength: data?.length,
    sampleData: data?.slice(0, 3),
    condition: { hasData, isLoading }
  });

  // Common container style for debugging
  const containerStyle = {
    border: '2px solid #F59E0B',
    backgroundColor: '#FEF3C7',
    borderRadius: '8px',
    padding: '8px'
  };

  if (isLoading) {
    console.log('[HourlyChart] Rendering loading state');
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
        <div style={{ fontSize: '12px', color: '#666' }}>LOADING CHART CONTAINER</div>
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
    console.log('[HourlyChart] Rendering no data state');
    return (
      <div className="h-64 w-full flex items-center justify-center" style={containerStyle}>
        <div className="text-center">
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>NO DATA CHART CONTAINER</div>
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

  console.log('[HourlyChart] Rendering main chart with data:', data?.length, 'items');

  try {
    return (
      <div className="h-64 w-full" style={containerStyle}>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
          MAIN CHART CONTAINER - Data: {data?.length} items
        </div>
        <ResponsiveContainer width="100%" height="calc(100% - 20px)">
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
              fill="#F59E0B"
              radius={[2, 2, 0, 0]}
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
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>ERROR CHART CONTAINER</div>
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