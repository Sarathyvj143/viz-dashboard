import { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';
import { withOpacity } from '../../utils/colorHelpers';
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

// Functional component for themed error fallback
function ErrorFallback({ error, errorInfo, onReset, onReload }: {
  error?: Error;
  errorInfo?: ErrorInfo;
  onReset: () => void;
  onReload: () => void;
}) {
  const { theme } = useTheme();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: theme.colors.bgPrimary }}
    >
      <div
        className="max-w-md w-full rounded-lg shadow-lg p-8"
        style={{
          backgroundColor: theme.colors.bgSecondary,
          borderColor: theme.colors.borderPrimary,
          borderWidth: '1px',
          borderStyle: 'solid',
        }}
      >
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <ExclamationTriangleIcon
              className="h-16 w-16"
              style={{ color: theme.colors.error }}
            />
          </div>
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: theme.colors.textPrimary }}
          >
            Something went wrong
          </h1>
          <p
            className="mb-6"
            style={{ color: theme.colors.textSecondary }}
          >
            We're sorry, but something unexpected happened. Please try reloading the page.
          </p>

          {/* Show error details in development */}
          {import.meta.env.DEV && error && (
            <details
              className="text-left mb-6 p-4 rounded"
              style={{
                backgroundColor: withOpacity(theme.colors.error, 15),
                borderColor: theme.colors.error,
                borderWidth: '1px',
                borderStyle: 'solid',
              }}
            >
              <summary
                className="cursor-pointer font-semibold mb-2"
                style={{ color: theme.colors.error }}
              >
                Error Details (Development Only)
              </summary>
              <div className="text-sm">
                <p
                  className="font-mono mb-2"
                  style={{ color: theme.colors.error }}
                >
                  {error.toString()}
                </p>
                {errorInfo && (
                  <pre
                    className="text-xs overflow-auto max-h-48 p-2 rounded"
                    style={{
                      backgroundColor: withOpacity(theme.colors.error, 10),
                      color: theme.colors.error,
                    }}
                  >
                    {errorInfo.componentStack}
                  </pre>
                )}
              </div>
            </details>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={onReset}
              className="px-4 py-2 rounded-md transition-opacity hover:opacity-80"
              style={{
                backgroundColor: 'transparent',
                color: theme.colors.textSecondary,
                borderColor: theme.colors.borderPrimary,
                borderWidth: '1px',
                borderStyle: 'solid',
              }}
            >
              Try Again
            </button>
            <button
              onClick={onReload}
              className="px-4 py-2 rounded-md transition-opacity hover:opacity-80"
              style={{
                backgroundColor: theme.colors.accentPrimary,
                color: theme.colors.bgPrimary,
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
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

  handleReload = (): void => {
    // Reset error state and reload the page
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.reload();
  };

  handleReset = (): void => {
    // Reset error state without reloading
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided by parent
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default themed fallback UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          onReload={this.handleReload}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
