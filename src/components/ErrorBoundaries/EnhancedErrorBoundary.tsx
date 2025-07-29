import React, { Component, ReactNode, ErrorInfo } from 'react';
import { performanceMonitor } from '../../services/PerformanceMonitor';
import { waccCalculationCache } from '../../services/CacheManager';

/**
 * Enhanced Error Boundary with Integrated Service Recovery
 * 
 * Provides comprehensive error handling for:
 * - Cache service failures
 * - Performance monitoring errors
 * - Excel integration issues
 * - Calculation engine failures
 * - Component rendering errors
 */

interface EnhancedErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorType: 'cache' | 'performance' | 'excel' | 'calculation' | 'render' | 'unknown';
  retryAttempts: number;
  isRecovering: boolean;
  recoveryActions: string[];
}

interface EnhancedErrorBoundaryProps {
  children: ReactNode;
  fallback?: (props: EnhancedErrorBoundaryState & { retry: () => void; reset: () => void }) => ReactNode;
  maxRetryAttempts?: number;
  onError?: (error: Error, errorType: string, recoveryActions: string[]) => void;
  enableAutoRecovery?: boolean;
  reportErrors?: boolean;
}

export class EnhancedErrorBoundary extends Component<EnhancedErrorBoundaryProps, EnhancedErrorBoundaryState> {
  private retryTimeout?: NodeJS.Timeout;
  
  constructor(props: EnhancedErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown',
      retryAttempts: 0,
      isRecovering: false,
      recoveryActions: [],
    };
  }

  static getDerivedStateFromError(error: Error): Partial<EnhancedErrorBoundaryState> {
    const errorType = EnhancedErrorBoundary.classifyError(error);
    const recoveryActions = EnhancedErrorBoundary.getRecoveryActions(errorType, error);
    
    return {
      hasError: true,
      error,
      errorType,
      recoveryActions,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Record error in performance monitor
    performanceMonitor.recordMetric({
      name: 'error-boundary-catch',
      value: 1,
      timestamp: performance.now(),
      metadata: {
        errorType: this.state.errorType,
        errorMessage: error.message,
        componentStack: errorInfo.componentStack,
        retryAttempts: this.state.retryAttempts,
      },
      tags: ['error', 'boundary']
    });

    // Report error if enabled
    if (this.props.reportErrors && this.props.onError) {
      this.props.onError(error, this.state.errorType, this.state.recoveryActions);
    }

    // Attempt auto-recovery if enabled
    if (this.props.enableAutoRecovery && this.state.retryAttempts < (this.props.maxRetryAttempts || 3)) {
      this.attemptRecovery();
    }

    // Log error details
    console.group('🚨 Enhanced Error Boundary Caught Error');
    console.error('Error:', error);
    console.error('Error Type:', this.state.errorType);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Recovery Actions:', this.state.recoveryActions);
    console.groupEnd();
  }

  private static classifyError(error: Error): EnhancedErrorBoundaryState['errorType'] {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Cache-related errors
    if (message.includes('cache') || stack.includes('cachemanager') || message.includes('storage')) {
      return 'cache';
    }

    // Performance monitoring errors
    if (message.includes('performance') || stack.includes('performancemonitor') || message.includes('observer')) {
      return 'performance';
    }

    // Excel integration errors
    if (message.includes('excel') || message.includes('office') || stack.includes('excel')) {
      return 'excel';
    }

    // Calculation errors
    if (message.includes('calculation') || message.includes('wacc') || stack.includes('calculationengine')) {
      return 'calculation';
    }

    // Default to render error
    return 'render';
  }

  private static getRecoveryActions(errorType: EnhancedErrorBoundaryState['errorType'], error: Error): string[] {
    const actions: string[] = [];

    switch (errorType) {
      case 'cache':
        actions.push('Clear application cache');
        actions.push('Reset cache configuration');
        actions.push('Disable caching temporarily');
        if (error.message.includes('storage')) {
          actions.push('Clear browser storage');
        }
        break;

      case 'performance':
        actions.push('Disable performance monitoring');
        actions.push('Reset performance metrics');
        actions.push('Clear performance observers');
        break;

      case 'excel':
        actions.push('Reconnect to Excel');
        actions.push('Reset Excel integration');
        actions.push('Clear Excel worksheet cache');
        if (error.message.includes('network') || error.message.includes('connection')) {
          actions.push('Check network connection');
        }
        break;

      case 'calculation':
        actions.push('Reset calculation inputs');
        actions.push('Clear calculation cache');
        actions.push('Validate input data');
        actions.push('Use default values');
        break;

      case 'render':
        actions.push('Reset component state');
        actions.push('Clear component cache');
        actions.push('Refresh page');
        break;

      default:
        actions.push('Reset application state');
        actions.push('Clear all caches');
        actions.push('Refresh page');
    }

    return actions;
  }

  private attemptRecovery = async () => {
    if (this.state.isRecovering) return;

    this.setState({ isRecovering: true });

    try {
      await this.executeRecoveryActions();
      
      // Wait a bit before retrying
      this.retryTimeout = setTimeout(() => {
        this.setState(prevState => ({
          hasError: false,
          error: null,
          errorInfo: null,
          retryAttempts: prevState.retryAttempts + 1,
          isRecovering: false,
        }));
      }, 2000);

    } catch (recoveryError) {
      console.error('Recovery failed:', recoveryError);
      this.setState({ isRecovering: false });
      
      // Record recovery failure
      performanceMonitor.recordMetric({
        name: 'error-recovery-failed',
        value: 1,
        timestamp: performance.now(),
        metadata: {
          originalError: this.state.error?.message,
          recoveryError: recoveryError instanceof Error ? recoveryError.message : String(recoveryError),
        },
        tags: ['error', 'recovery', 'failure']
      });
    }
  };

  private executeRecoveryActions = async () => {
    const { errorType } = this.state;

    switch (errorType) {
      case 'cache':
        try {
          await waccCalculationCache.clear();
          localStorage.clear();
          sessionStorage.clear();
        } catch (error) {
          console.warn('Cache clearing failed:', error);
        }
        break;

      case 'performance':
        try {
          performanceMonitor.stopMonitoring();
          // Small delay before restarting
          setTimeout(() => {
            performanceMonitor.startMonitoring();
          }, 1000);
        } catch (error) {
          console.warn('Performance monitor reset failed:', error);
        }
        break;

      case 'excel':
        // Excel recovery would need to be handled by the Excel integration layer
        console.log('Excel recovery attempted');
        break;

      case 'calculation':
        try {
          await waccCalculationCache.clear();
        } catch (error) {
          console.warn('Calculation cache clearing failed:', error);
        }
        break;

      case 'render':
        // Render recovery is handled by component remounting
        break;
    }

    // Record recovery attempt
    performanceMonitor.recordMetric({
      name: 'error-recovery-attempt',
      value: 1,
      timestamp: performance.now(),
      metadata: {
        errorType,
        retryAttempts: this.state.retryAttempts,
      },
      tags: ['error', 'recovery']
    });
  };

  private handleRetry = () => {
    this.attemptRecovery();
  };

  private handleReset = () => {
    // Clear retry timeout
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown',
      retryAttempts: 0,
      isRecovering: false,
      recoveryActions: [],
    });
  };

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback({
          ...this.state,
          retry: this.handleRetry,
          reset: this.handleReset,
        });
      }

      // Default error UI
      return (
        <ErrorFallbackComponent
          {...this.state}
          retry={this.handleRetry}
          reset={this.handleReset}
          maxRetryAttempts={this.props.maxRetryAttempts || 3}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default Error Fallback Component
 */
interface ErrorFallbackProps extends EnhancedErrorBoundaryState {
  retry: () => void;
  reset: () => void;
  maxRetryAttempts: number;
}

const ErrorFallbackComponent: React.FC<ErrorFallbackProps> = ({
  error,
  errorType,
  retryAttempts,
  isRecovering,
  recoveryActions,
  maxRetryAttempts,
  retry,
  reset,
}) => {
  const canRetry = retryAttempts < maxRetryAttempts;

  const getErrorTitle = () => {
    switch (errorType) {
      case 'cache': return 'Cache System Error';
      case 'performance': return 'Performance Monitoring Error';
      case 'excel': return 'Excel Integration Error';
      case 'calculation': return 'Calculation Engine Error';
      case 'render': return 'Component Rendering Error';
      default: return 'Application Error';
    }
  };

  const getErrorDescription = () => {
    switch (errorType) {
      case 'cache':
        return 'There was an issue with the application cache. Data may not be saved properly.';
      case 'performance':
        return 'Performance monitoring encountered an issue. Application functionality is not affected.';
      case 'excel':
        return 'Excel integration failed. You may not be able to generate or read Excel files.';
      case 'calculation':
        return 'WACC calculation failed. Please check your input data and try again.';
      case 'render':
        return 'A component failed to render properly. Some features may not be available.';
      default:
        return 'An unexpected error occurred. Please try refreshing the page.';
    }
  };

  return (
    <div style={{
      padding: '40px 20px',
      maxWidth: '600px',
      margin: '0 auto',
      textAlign: 'center',
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      border: '1px solid #d1d1d1',
      borderRadius: '8px',
      backgroundColor: '#fafafa',
    }}>
      <div style={{ fontSize: '48px', marginBottom: '20px' }}>
        {errorType === 'excel' ? '📊' : errorType === 'calculation' ? '🧮' : '🚨'}
      </div>
      
      <h2 style={{ color: '#d73502', marginBottom: '10px' }}>
        {getErrorTitle()}
      </h2>
      
      <p style={{ color: '#666', marginBottom: '20px', lineHeight: '1.5' }}>
        {getErrorDescription()}
      </p>

      {error && (
        <details style={{ textAlign: 'left', marginBottom: '20px', fontSize: '14px' }}>
          <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>
            Technical Details
          </summary>
          <pre style={{
            background: '#f5f5f5',
            padding: '10px',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '12px',
          }}>
            {error.message}
          </pre>
        </details>
      )}

      {recoveryActions.length > 0 && (
        <div style={{ textAlign: 'left', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Recovery Actions Attempted:</h3>
          <ul style={{ fontSize: '14px', color: '#666' }}>
            {recoveryActions.map((action, index) => (
              <li key={index}>{action}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {canRetry && (
          <button
            onClick={retry}
            disabled={isRecovering}
            style={{
              padding: '10px 20px',
              backgroundColor: isRecovering ? '#ccc' : '#0078d4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isRecovering ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {isRecovering ? 'Recovering...' : `Retry (${retryAttempts}/${maxRetryAttempts})`}
          </button>
        )}
        
        <button
          onClick={reset}
          style={{
            padding: '10px 20px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Reset
        </button>
        
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#d73502',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Refresh Page
        </button>
      </div>

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#999' }}>
        Error ID: {Date.now().toString(36)}-{Math.random().toString(36).substr(2, 5)}
      </div>
    </div>
  );
};

/**
 * Service-Specific Error Boundaries
 */

export const CacheErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <EnhancedErrorBoundary
    enableAutoRecovery={true}
    maxRetryAttempts={2}
    reportErrors={true}
    fallback={(props) => (
      <div style={{ padding: '20px', border: '1px solid orange', borderRadius: '4px', background: '#fff3cd' }}>
        <h3>Cache System Temporarily Unavailable</h3>
        <p>The application is running without caching. Performance may be slower.</p>
        <button onClick={props.retry} disabled={props.isRecovering}>
          {props.isRecovering ? 'Recovering...' : 'Retry Cache'}
        </button>
      </div>
    )}
  >
    {children}
  </EnhancedErrorBoundary>
);

export const PerformanceErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <EnhancedErrorBoundary
    enableAutoRecovery={true}
    maxRetryAttempts={1}
    reportErrors={false}
    fallback={(props) => (
      <div style={{ padding: '10px', background: '#e7f3ff', border: '1px solid #0078d4', borderRadius: '4px' }}>
        <small>Performance monitoring temporarily disabled due to an error.</small>
      </div>
    )}
  >
    {children}
  </EnhancedErrorBoundary>
);

export const ExcelErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <EnhancedErrorBoundary
    enableAutoRecovery={false}
    maxRetryAttempts={1}
    reportErrors={true}
    fallback={(props) => (
      <div style={{ padding: '20px', border: '1px solid #d73502', borderRadius: '4px', background: '#fdf2f2' }}>
        <h3>Excel Integration Error</h3>
        <p>Excel features are temporarily unavailable. You can still use the calculator without Excel integration.</p>
        <button onClick={props.reset}>Continue Without Excel</button>
      </div>
    )}
  >
    {children}
  </EnhancedErrorBoundary>
);

export const CalculationErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <EnhancedErrorBoundary
    enableAutoRecovery={true}
    maxRetryAttempts={3}
    reportErrors={true}
    fallback={(props) => (
      <div style={{ padding: '20px', border: '1px solid #d73502', borderRadius: '4px', background: '#fdf2f2' }}>
        <h3>Calculation Error</h3>
        <p>There was an issue calculating the WACC. Please check your inputs and try again.</p>
        <div style={{ marginTop: '10px' }}>
          <button onClick={props.retry} disabled={props.isRecovering} style={{ marginRight: '10px' }}>
            {props.isRecovering ? 'Retrying...' : 'Retry Calculation'}
          </button>
          <button onClick={props.reset}>Reset Inputs</button>
        </div>
      </div>
    )}
  >
    {children}
  </EnhancedErrorBoundary>
);