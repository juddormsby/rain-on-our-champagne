

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Pouring champagne data...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        {/* Main spinner with champagne theme */}
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-200 border-t-amber-600"></div>
        {/* Inner sparkle */}
        <div className="absolute inset-2 animate-pulse rounded-full bg-gradient-to-br from-amber-100 to-yellow-100"></div>
        {/* Central champagne bottle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl animate-pulse">🍾</span>
        </div>
      </div>
      <p className="text-amber-800 mt-6 text-center font-medium text-lg">{message}</p>
      <div className="flex space-x-2 mt-4">
        <span className="text-lg animate-bounce" style={{ animationDelay: '0s' }}>🍾</span>
        <span className="text-lg animate-bounce" style={{ animationDelay: '0.2s' }}>🥂</span>
        <span className="text-lg animate-bounce" style={{ animationDelay: '0.4s' }}>🍾</span>
      </div>
    </div>
  );
} 