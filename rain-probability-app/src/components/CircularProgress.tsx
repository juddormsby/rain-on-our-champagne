interface CircularProgressProps {
  percentage: number;
  label: string;
  size?: number;
}

export function CircularProgress({ percentage, label, size = 200 }: CircularProgressProps) {
  const radius = size / 2 - 20;
  const circumference = Math.PI * radius; // Half circle
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="gauge-container" style={{ width: size, height: size * 0.6 + 80 }}>
      <div style={{ position: 'relative', width: size, height: size * 0.6 }}>
        <svg
          className="gauge-svg"
          width={size}
          height={size * 0.6}
          viewBox={`0 0 ${size} ${size * 0.6}`}
        >
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--accent-amber)" />
              <stop offset="100%" stopColor="var(--accent-orange)" />
            </linearGradient>
          </defs>
          
          {/* Track */}
          <path
            d={`M 20 ${size * 0.6 - 20} A ${radius} ${radius} 0 0 1 ${size - 20} ${size * 0.6 - 20}`}
            fill="none"
            stroke="#EADACA"
            strokeWidth="8"
            strokeLinecap="round"
          />
          
          {/* Progress */}
          <path
            d={`M 20 ${size * 0.6 - 20} A ${radius} ${radius} 0 0 1 ${size - 20} ${size * 0.6 - 20}`}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="gauge-progress"
          />
        </svg>
        
        <div className="gauge-text">
          <div className="gauge-label">{label}</div>
          <div className="gauge-value">{Math.round(percentage)}%</div>
        </div>
      </div>
    </div>
  );
} 