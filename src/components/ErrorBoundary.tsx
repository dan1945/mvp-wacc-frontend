import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Card,
  CardHeader,
  CardPreview,
  Text,
  Button,
  MessageBar,
  tokens
} from '@fluentui/react-components';
import { ErrorCircle24Filled, ArrowClockwise24Regular, ChevronDown24Regular } from '@fluentui/react-icons';

interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component for WACC Calculator
 * 
 * Features:
 * - Graceful error handling with recovery options
 * - Detailed error information for development
 * - User-friendly error messages for production
 * - Accessibility compliant error reporting
 * - Integration with external error tracking
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });

    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call external error handler if provided
    this.props.onError?.(error, errorInfo);

    // In production, you might want to send this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry, ApplicationInsights, etc.
      // errorTrackingService.captureException(error, { extra: errorInfo });
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error} 
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          fallbackMessage={this.props.fallbackMessage}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onRetry: () => void;
  fallbackMessage?: string;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  errorInfo, 
  onRetry, 
  fallbackMessage 
}) => {
  const [showDetails, setShowDetails] = React.useState(false);

  const errorMessage = fallbackMessage || 
    error?.message || 
    'An unexpected error occurred in the WACC Calculator';

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div 
      className="h-screen flex items-center justify-center p-4 bg-gray-50"
      role="alert"
      aria-labelledby="error-title"
      aria-describedby="error-description"
    >
      <Card className="max-w-2xl w-full">
        <CardHeader
          header={
            <div className="flex items-center space-x-3">
              <ErrorCircle24Filled 
                style={{ 
                  fontSize: '32px', 
                  color: tokens.colorPaletteRedForeground1 
                }}
                aria-hidden="true"
              />
              <div>
                <Text 
                  variant="xLarge" 
                  weight="semibold"
                  id="error-title"
                  className="text-red-600"
                >
                  Something went wrong
                </Text>
                <Text 
                  variant="medium" 
                  color="secondary"
                  id="error-description"
                >
                  The WACC Calculator encountered an unexpected error
                </Text>
              </div>
            </div>
          }
        />
        
        <CardPreview>
          <div className="space-y-4">
            {/* Error Message */}
            <MessageBar 
              intent="error"
              role="alert"
              aria-live="assertive"
            >
              <div>
                <Text weight="semibold">Error Details:</Text>
                <Text className="block mt-1">{errorMessage}</Text>
              </div>
            </MessageBar>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                appearance="primary"
                size="large"
                icon={<ArrowClockwise24Regular />}
                onClick={onRetry}
                aria-label="Retry the operation that caused the error"
              >
                Try Again
              </Button>

              <Button
                appearance="secondary"
                size="large"
                onClick={() => window.location.reload()}
                aria-label="Reload the entire application"
              >
                Reload Page
              </Button>

              {isDevelopment && (
                <Button
                  appearance="subtle"
                  size="large"
                  icon={
                    <ChevronDown24Regular 
                      style={{ 
                        transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                      }}
                    />
                  }
                  onClick={() => setShowDetails(!showDetails)}
                  aria-expanded={showDetails}
                  aria-controls="error-details"
                >
                  {showDetails ? 'Hide' : 'Show'} Technical Details
                </Button>
              )}
            </div>

            {/* Technical Details (Development Only) */}
            {isDevelopment && showDetails && (error || errorInfo) && (
              <details 
                id="error-details"
                className="bg-gray-100 border border-gray-300 rounded-md p-4"
                open
              >
                <summary className="font-medium text-gray-700 cursor-pointer mb-2">
                  Technical Error Information
                </summary>
                
                <div className="space-y-3 text-sm font-mono">
                  {error && (
                    <div>
                      <Text weight="semibold" className="text-red-600">
                        Error:
                      </Text>
                      <pre className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-red-800 overflow-auto">
                        {error.name}: {error.message}
                      </pre>
                    </div>
                  )}

                  {error?.stack && (
                    <div>
                      <Text weight="semibold" className="text-red-600">
                        Stack Trace:
                      </Text>
                      <pre className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-red-800 overflow-auto text-xs">
                        {error.stack}
                      </pre>
                    </div>
                  )}

                  {errorInfo?.componentStack && (
                    <div>
                      <Text weight="semibold" className="text-red-600">
                        Component Stack:
                      </Text>
                      <pre className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-red-800 overflow-auto text-xs">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Help Text */}
            <div className="text-center">
              <Text variant="small" color="secondary">
                If this problem persists, please{' '}
                {isDevelopment ? (
                  'check the console for more details'
                ) : (
                  'contact support with the error details above'
                )}.
              </Text>
            </div>

            {/* Recovery Suggestions */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <Text weight="semibold" className="text-blue-800 block mb-2">
                Suggested Recovery Steps:
              </Text>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Try refreshing the page</li>
                <li>Clear your browser cache and cookies</li>
                <li>Check your internet connection</li>
                <li>Close and reopen Excel if using the add-in</li>
                {isDevelopment && (
                  <li>Check the browser console for additional error details</li>
                )}
              </ul>
            </div>
          </div>
        </CardPreview>
      </Card>
    </div>
  );
};

export default ErrorBoundary;