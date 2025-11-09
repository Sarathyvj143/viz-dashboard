import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Error Boundary component to catch and handle React component errors
 * Prevents the entire app from crashing when a component throws an error
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details using logger utility
    logger.error('ErrorBoundary caught an error:', { error, errorInfo });

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // In production, you could log to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReload = () => {
    // Reset error state and reload the page
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.reload();
  };

  handleReset = () => {
    // Reset error state without reloading
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided by parent
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600 mb-6">
                We're sorry, but something unexpected happened. Please try reloading the page.
              </p>

              {/* Show error details in development */}
              {import.meta.env.DEV && this.state.error && (
                <details className="text-left mb-6 p-4 bg-red-50 rounded border border-red-200">
                  <summary className="cursor-pointer font-semibold text-red-800 mb-2">
                    Error Details (Development Only)
                  </summary>
                  <div className="text-sm">
                    <p className="font-mono text-red-900 mb-2">
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo && (
                      <pre className="text-xs text-red-800 overflow-auto max-h-48 p-2 bg-red-100 rounded">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              <div className="flex gap-3 justify-center">
                <button
                  onClick={this.handleReset}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={this.handleReload}
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
