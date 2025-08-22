
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts';

interface HourlyChartProps {
  hourlyProbabilities: (number | null)[];
}

export function HourlyChart({ hourlyProbabilities }: HourlyChartProps) {
  const data = hourlyProbabilities.map((prob, hour) => ({
    hour: String(hour).padStart(2, '0'),
    probability: prob ? Math.round(prob * 100) : 0,
  }));

  return (
    <div className="h-64 w-full">
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
            fill="#F59E0B"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
} 