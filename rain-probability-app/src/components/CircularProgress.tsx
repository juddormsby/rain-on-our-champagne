interface CircularProgressProps {
  percentage: number;
  label: string;
  size?: number;
  isLoading?: boolean;
  hasData?: boolean;
}

export function CircularProgress({ percentage, label, size = 200, isLoading = false, hasData = true }: CircularProgressProps) {
  const radius = size / 2 - 20;
  const circumference = Math.PI * radius; // Half circle
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Show loading or no-data state
  const showPlaceholder = isLoading || !hasData;
  const displayValue = isLoading ? '...' : hasData ? `${Math.round(percentage)}%` : '—';

  return (
    <div className="gauge-container" style={{ width: size, height: size * 0.6 + 60 }}>
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
            <linearGradient id="loadingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--line)" />
              <stop offset="100%" stopColor="var(--ink-muted)" />
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
          
          {/* Progress or Loading animation */}
          <path
            d={`M 20 ${size * 0.6 - 20} A ${radius} ${radius} 0 0 1 ${size - 20} ${size * 0.6 - 20}`}
            fill="none"
            stroke={showPlaceholder ? "url(#loadingGradient)" : "url(#gaugeGradient)"}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={showPlaceholder ? circumference * 0.7 : strokeDashoffset}
            className={`gauge-progress ${isLoading ? 'loading' : ''}`}
            style={{
              opacity: showPlaceholder ? 0.3 : 1,
              transition: 'stroke-dashoffset 0.5s ease, opacity 0.3s ease'
            }}
          />
        </svg>
        
        <div className="gauge-text">
          <div className="gauge-label">{label}</div>
          <div className="gauge-value" style={{ 
            opacity: showPlaceholder ? 0.5 : 1,
            color: isLoading ? 'var(--ink-muted)' : 'var(--ink)'
          }}>
            {displayValue}
          </div>
        </div>
      </div>
    </div>
  );
} 