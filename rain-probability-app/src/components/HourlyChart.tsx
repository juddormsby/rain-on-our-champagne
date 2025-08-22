
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatPercentage } from '../lib/stats';

interface HourlyChartProps {
  hourlyProbabilities: (number | null)[];
}

export function HourlyChart({ hourlyProbabilities }: HourlyChartProps) {
  const data = hourlyProbabilities.map((prob, hour) => ({
    hour: `${String(hour).padStart(2, '0')}:00`,
    probability: prob ? prob * 100 : null,
    displayText: formatPercentage(prob),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          <p className="text-blue-600">
            Rain probability: {data.displayText}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Hourly Rain Probability
      </h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="hour"
              tick={{ fontSize: 12 }}
              interval={2}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ value: '%', angle: -90, position: 'insideLeft' }}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="probability" 
              fill="#3B82F6"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <p className="text-xs text-gray-500 mt-4">
        Percentage of years with rain (&gt;0.0mm) in each hour across all available data
      </p>
    </div>
  );
} 