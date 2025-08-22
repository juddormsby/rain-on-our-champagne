

interface ErrorMessageProps {
  error: string;
  onRetry?: () => void;
}

export function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  const copyError = () => {
    navigator.clipboard?.writeText(error);
  };

  return (
    <div className="card p-6 border-red-200 bg-red-50">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Failed to fetch weather data
          </h3>
          <p className="text-sm text-red-700 mt-1">
            {error}
          </p>
          <div className="flex space-x-3 mt-3">
            {onRetry && (
              <button 
                onClick={onRetry}
                className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition-colors"
              >
                Try Again
              </button>
            )}
            <button 
              onClick={copyError}
              className="text-sm text-red-600 hover:text-red-800 transition-colors"
            >
              Copy Error
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 