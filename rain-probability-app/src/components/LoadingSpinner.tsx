

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        {/* Main spinner */}
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-200 border-t-amber-600"></div>
        {/* Inner sparkle */}
        <div className="absolute inset-2 animate-pulse rounded-full bg-gradient-to-br from-amber-100 to-yellow-100"></div>
      </div>
      <p className="text-amber-800 mt-6 text-center font-medium text-lg">{message}</p>
      <div className="flex space-x-1 mt-4">
        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
  );
} 