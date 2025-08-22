import { useState, useEffect } from 'react';

interface AIChickenProps {
  weatherData: {
    location: string;
    date: string;
    session: string;
    sessionTime: string;
    rainProbability: number;
    tempLow: number | null;
    tempHigh: number | null;
    totalYears: number;
    rainyYears: number;
  } | null;
  isVisible: boolean;
}

interface ChickenResponse {
  recommendation: string;
  timestamp: string;
  fallback?: boolean;
  model?: string;
  weatherContext?: any;
  error?: string;
}

export function AIChicken({ weatherData, isVisible }: AIChickenProps) {
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAutoFetched, setHasAutoFetched] = useState(false);

  const getChickenAdvice = async (isAutomatic = false) => {
    if (!weatherData) {
      console.log('[AI Chicken] No weather data available');
      return;
    }

    console.log('[AI Chicken] Starting advice request:', { isAutomatic, weatherData });
    setIsLoading(true);
    setError(null);

    try {
      console.log('[AI Chicken] Calling Netlify function...');
      const response = await fetch('/.netlify/functions/ai-chicken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ weatherData }),
      });

      console.log('[AI Chicken] Function response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AI Chicken] Function error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data: ChickenResponse = await response.json();
      console.log('[AI Chicken] Function response data:', data);
      
      setRecommendation(data.recommendation);
      
      if (data.fallback) {
        console.warn('[AI Chicken] Received fallback response:', data.error);
      }
    } catch (err) {
      console.error('[AI Chicken] Request failed:', err);
      setError('Bawk bawk! The chicken is having technical difficulties 🐔');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch when weather data becomes available
  useEffect(() => {
    if (weatherData && isVisible && !hasAutoFetched && !isLoading) {
      console.log('[AI Chicken] Auto-fetching chicken advice for new weather data');
      setHasAutoFetched(true);
      getChickenAdvice(true);
    }
  }, [weatherData, isVisible, hasAutoFetched, isLoading]);

  // Reset auto-fetch flag when weather data changes
  useEffect(() => {
    if (weatherData) {
      setHasAutoFetched(false);
      setRecommendation(null);
      setError(null);
    }
  }, [weatherData?.location, weatherData?.date, weatherData?.session]);

  if (!isVisible || !weatherData) {
    return null;
  }

  return (
    <div className="ai-chicken-container">
      <div className="ai-chicken-card">
        {/* Chicken Header */}
        <div className="chicken-header">
          <div className="chicken-avatar">🐔</div>
          <div className="chicken-info">
            <h3 style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: '18px',
              color: 'var(--accent-orange)',
              margin: '0 0 4px 0'
            }}>
              Poultry's Champagne Wisdom
            </h3>
            <p style={{ 
              fontFamily: 'var(--font-body)', 
              fontSize: '12px',
              color: 'var(--ink-muted)',
              margin: 0
            }}>
              Intelligent chicken • Champagne expert
            </p>
          </div>
          <button 
            onClick={() => getChickenAdvice(false)}
            disabled={isLoading}
            className="chicken-button"
            style={{
              background: isLoading ? 'var(--line)' : 'var(--accent-amber)',
              color: isLoading ? 'var(--ink-muted)' : 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontFamily: 'var(--font-body)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {isLoading ? '🍾 Sipping...' : '🐔 Ask Again'}
          </button>
        </div>

        {/* Chicken Recommendation */}
        {recommendation && (
          <div className="chicken-tweet" style={{
            background: 'var(--bg-cream)',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            padding: '16px',
            marginTop: '16px',
            fontFamily: 'var(--font-body)',
            fontSize: '16px',
            lineHeight: '1.5',
            color: 'var(--ink)'
          }}>
            "{recommendation}"
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="chicken-loading" style={{
            textAlign: 'center',
            padding: '20px',
            color: 'var(--ink-muted)',
            fontFamily: 'var(--font-body)',
            fontSize: '14px'
          }}>
            <div className="loading-spinner" style={{ margin: '0 auto 12px' }}></div>
            Poultry is sipping champagne and pondering the weather... 🍾
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="chicken-error" style={{
            background: '#FFF5F5',
            border: '1px solid #FED7D7',
            borderRadius: '8px',
            padding: '12px',
            marginTop: '16px',
            color: '#C53030',
            fontSize: '14px',
            fontFamily: 'var(--font-body)'
          }}>
            {error}
            <button 
              onClick={() => getChickenAdvice(false)}
              style={{
                marginLeft: '8px',
                background: 'none',
                border: 'none',
                color: '#C53030',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Weather Summary for Context */}
        <div className="weather-context" style={{
          marginTop: '16px',
          padding: '12px',
          background: 'var(--paper)',
          borderRadius: '8px',
          fontSize: '12px',
          color: 'var(--ink-muted)',
          fontFamily: 'var(--font-body)'
        }}>
          <strong>Context:</strong> {weatherData.rainProbability}% chance of rain • {weatherData.tempLow}°C-{weatherData.tempHigh}°C • {weatherData.session} session in {weatherData.location}
        </div>
      </div>
    </div>
  );
} 