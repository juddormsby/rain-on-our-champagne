import { useState, useEffect } from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Pouring champagne data...' }: LoadingSpinnerProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        switch (prev) {
          case '': return '.';
          case '.': return '..';
          case '..': return '...';
          case '...': return '';
          default: return '.';
        }
      });
    }, 500); // Change every 500ms

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        {/* Main spinner with champagne theme */}
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-200 border-t-amber-600"></div>
        {/* Inner sparkle */}
        <div className="absolute inset-2 animate-pulse rounded-full bg-gradient-to-br from-amber-100 to-yellow-100"></div>
      </div>
      <p className="text-amber-800 mt-6 text-center font-medium text-lg">{message}</p>
      <div className="flex items-center justify-center mt-4 h-6">
        <span className="text-2xl font-bold text-amber-600 min-w-[3ch] text-center">
          {dots}
        </span>
      </div>
    </div>
  );
} 