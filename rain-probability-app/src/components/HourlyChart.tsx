
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
    hourNum: hour,
    probability: prob ? prob * 100 : 0,
    rawProb: prob,
    displayText: formatPercentage(prob),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const hourRange = `${label} - ${String((data.hourNum + 1) % 24).padStart(2, '0')}:00`;
      return (
        <div className="glass-effect p-4 border border-amber-200">
          <p className="font-semibold text-amber-900 mb-1">{hourRange}</p>
          <p className="text-amber-700">
            🌧️ Rain probability: <span className="font-bold">{data.displayText}</span>
          </p>
          <p className="text-xs text-amber-600 mt-1">
            {data.rawProb ? '🥂 Perfect for champagne!' : '☔ Might need an umbrella'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card p-8">
      <h3 className="text-2xl font-bold champagne-text mb-6 text-center">
        🕒 Hourly Rain Probability
      </h3>
      
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F3E8B7" />
            <XAxis 
              dataKey="hour"
              tick={{ fontSize: 12, fill: '#92400e' }}
              interval={1}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#92400e' }}
              label={{ 
                value: 'Rain Probability (%)', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: '#92400e' }
              }}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="probability" 
              fill="url(#rainGradient)"
              radius={[4, 4, 0, 0]}
              strokeWidth={1}
              stroke="#D97706"
            />
            <defs>
              <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="50%" stopColor="#0EA5E9" />
                <stop offset="100%" stopColor="#0284C7" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <p className="text-sm text-amber-600 mt-6 text-center bg-amber-50 p-3 rounded-xl">
        🍾 Percentage of years with rain (&gt;0.0mm) in each hour across all available data
      </p>
    </div>
  );
} 