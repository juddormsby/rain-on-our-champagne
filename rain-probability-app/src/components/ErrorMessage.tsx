

interface ErrorMessageProps {
  error: string;
  onRetry?: () => void;
}

export function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  const copyError = () => {
    navigator.clipboard?.writeText(error);
  };

  return (
    <div className="card p-8 border-red-200 bg-gradient-to-br from-red-50 to-pink-50">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-red-800 mb-2">
            🚫 Oops! Champagne data unavailable
          </h3>
          <p className="text-red-700 mb-4 leading-relaxed">
            {error}
          </p>
          <div className="flex flex-wrap gap-3">
            {onRetry && (
              <button 
                onClick={onRetry}
                className="px-6 py-2 bg-red-100 text-red-800 rounded-lg font-medium hover:bg-red-200 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                🔄 Try Again
              </button>
            )}
            <button 
              onClick={copyError}
              className="px-6 py-2 text-red-600 hover:text-red-800 transition-colors duration-300 underline"
            >
              📋 Copy Error Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 