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
  console.log('[HourlyChart] Rendered with:', {
    isLoading,
    hasData,
    probsLength: hourlyProbabilities?.length,
    firstFewProbs: hourlyProbabilities?.slice(0, 5)
  });

  if (isLoading) {
    return (
      <div className="h-64 w-full flex items-center justify-center bg-white rounded-lg">
        <div>Loading chart...</div>
      </div>
    );
  }

  if (!hasData || !hourlyProbabilities || hourlyProbabilities.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center bg-white rounded-lg">
        <div>No chart data available</div>
      </div>
    );
  }

  // Convert decimal probabilities to percentages and create chart data
  const data = hourlyProbabilities.map((prob, hour) => ({
    hour: String(hour).padStart(2, '0'),
    probability: prob ? Math.round(prob * 100) : 0,
  }));

  console.log('[HourlyChart] Chart data:', {
    dataLength: data.length,
    sampleData: data.slice(0, 3),
    maxProb: Math.max(...data.map(d => d.probability))
  });

  return (
    <div className="h-64 w-full bg-white rounded-lg p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis 
            dataKey="hour"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${value}%`}
          />
          <Bar 
            dataKey="probability" 
            fill="#C8681E"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
} 