/**
 * Error Boundary Integration Tests
 * Tests error recovery mechanisms and service integration
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { 
  EnhancedErrorBoundary,
  CacheErrorBoundary,
  PerformanceErrorBoundary,
  ExcelErrorBoundary,
  CalculationErrorBoundary 
} from '../ErrorBoundaries/EnhancedErrorBoundary';
import { performanceMonitor } from '../../services/PerformanceMonitor';
import { waccCalculationCache } from '../../services/CacheManager';

// Test components that can throw errors
const ThrowError: React.FC<{ errorType?: string; errorMessage?: string }> = ({ 
  errorType = 'generic', 
  errorMessage = 'Test error' 
}) => {
  React.useEffect(() => {
    const error = new Error(errorMessage);
    error.stack = `Error: ${errorMessage}\n    at ${errorType}Component`;
    throw error;
  }, [errorMessage, errorType]);
  
  return <div>This should not render</div>;
};

const AsyncThrowError: React.FC<{ delay?: number }> = ({ delay = 100 }) => {
  const [shouldThrow, setShouldThrow] = React.useState(false);
  
  React.useEffect(() => {
    setTimeout(() => setShouldThrow(true), delay);
  }, [delay]);
  
  if (shouldThrow) {
    throw new Error('Async test error');
  }
  
  return <div>Loading...</div>;
};

const ConditionalError: React.FC<{ throwError: boolean }> = ({ throwError }) => {
  if (throwError) {
    throw new Error('Conditional test error');
  }
  
  return <div data-testid="no-error">No error occurred</div>;
};

describe('Error Boundary Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performanceMonitor.startMonitoring();
  });

  afterEach(() => {
    performanceMonitor.stopMonitoring();
  });

  describe('Enhanced Error Boundary', () => {
    test('should catch and classify cache errors', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const metricsSpy = jest.spyOn(performanceMonitor, 'recordMetric');
      
      render(
        <EnhancedErrorBoundary enableAutoRecovery={true} reportErrors={true}>
          <ThrowError errorType="cache" errorMessage="Cache storage failed" />
        </EnhancedErrorBoundary>
      );
      
      // Should show error UI
      await waitFor(() => {
        expect(screen.getByText(/Cache System Error/)).toBeInTheDocument();
      });
      
      // Should record error metrics
      expect(metricsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'error-boundary-catch',
          metadata: expect.objectContaining({
            errorType: 'cache'
          })
        })
      );
      
      errorSpy.mockRestore();
    });

    test('should catch and classify performance errors', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <EnhancedErrorBoundary enableAutoRecovery={true}>
          <ThrowError errorType="performance" errorMessage="Performance observer failed" />
        </EnhancedErrorBoundary>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/Performance Monitoring Error/)).toBeInTheDocument();
      });
      
      errorSpy.mockRestore();
    });

    test('should catch and classify Excel errors', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <EnhancedErrorBoundary enableAutoRecovery={false}>
          <ThrowError errorType="excel" errorMessage="Excel API connection failed" />
        </EnhancedErrorBoundary>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/Excel Integration Error/)).toBeInTheDocument();
      });
      
      errorSpy.mockRestore();
    });

    test('should catch and classify calculation errors', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <EnhancedErrorBoundary enableAutoRecovery={true}>
          <ThrowError errorType="calculation" errorMessage="WACC calculation failed" />
        </EnhancedErrorBoundary>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/Calculation Engine Error/)).toBeInTheDocument();
      });
      
      errorSpy.mockRestore();
    });

    test('should provide appropriate recovery actions', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <EnhancedErrorBoundary enableAutoRecovery={false}>
          <ThrowError errorType="cache" errorMessage="Cache storage quota exceeded" />
        </EnhancedErrorBoundary>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/Clear application cache/)).toBeInTheDocument();
        expect(screen.getByText(/Clear browser storage/)).toBeInTheDocument();
      });
      
      errorSpy.mockRestore();
    });

    test('should handle retry functionality', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      let attemptCount = 0;
      
      const RetryableError: React.FC = () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Retryable error');
        }
        return <div data-testid="success">Success after retry</div>;
      };
      
      const user = userEvent.setup();
      render(
        <EnhancedErrorBoundary enableAutoRecovery={false} maxRetryAttempts={3}>
          <RetryableError />
        </EnhancedErrorBoundary>
      );
      
      // Should show error initially
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
      
      // Click retry
      await user.click(screen.getByRole('button', { name: /retry/i }));
      
      // Should show error again (second attempt)
      await waitFor(() => {
        expect(screen.getByText(/1\/3/)).toBeInTheDocument();
      });
      
      // Click retry again
      await user.click(screen.getByRole('button', { name: /retry/i }));
      
      // Should succeed on third attempt
      await waitFor(() => {
        expect(screen.getByTestId('success')).toBeInTheDocument();
      });
      
      errorSpy.mockRestore();
    });

    test('should handle reset functionality', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const user = userEvent.setup();
      const { rerender } = render(
        <EnhancedErrorBoundary enableAutoRecovery={false}>
          <ThrowError errorMessage="Test error for reset" />
        </EnhancedErrorBoundary>
      );
      
      // Should show error
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
      });
      
      // Click reset
      await user.click(screen.getByRole('button', { name: /reset/i }));
      
      // Re-render with non-error component
      rerender(
        <EnhancedErrorBoundary enableAutoRecovery={false}>
          <div data-testid="no-error">No error</div>
        </EnhancedErrorBoundary>
      );
      
      // Should show normal content
      await waitFor(() => {
        expect(screen.getByTestId('no-error')).toBeInTheDocument();
      });
      
      errorSpy.mockRestore();
    });
  });

  describe('Specialized Error Boundaries', () => {
    test('CacheErrorBoundary should handle cache-specific errors', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const cacheClearSpy = jest.spyOn(waccCalculationCache, 'clear').mockResolvedValue();
      
      render(
        <CacheErrorBoundary>
          <ThrowError errorType="cache" errorMessage="Cache write failed" />
        </CacheErrorBoundary>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/Cache System Temporarily Unavailable/)).toBeInTheDocument();
      });
      
      // Should attempt cache recovery
      await waitFor(() => {
        expect(cacheClearSpy).toHaveBeenCalled();
      });
      
      errorSpy.mockRestore();
      cacheClearSpy.mockRestore();
    });

    test('PerformanceErrorBoundary should handle performance errors gracefully', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const stopMonitoringSpy = jest.spyOn(performanceMonitor, 'stopMonitoring');
      const startMonitoringSpy = jest.spyOn(performanceMonitor, 'startMonitoring');
      
      render(
        <PerformanceErrorBoundary>
          <ThrowError errorType="performance" errorMessage="Observer initialization failed" />
        </PerformanceErrorBoundary>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/Performance monitoring temporarily disabled/)).toBeInTheDocument();
      });
      
      // Should attempt to restart monitoring
      await waitFor(() => {
        expect(stopMonitoringSpy).toHaveBeenCalled();
      }, { timeout: 2000 });
      
      errorSpy.mockRestore();
    });

    test('ExcelErrorBoundary should handle Excel integration errors', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const user = userEvent.setup();
      render(
        <ExcelErrorBoundary>
          <ThrowError errorType="excel" errorMessage="Excel API unavailable" />
        </ExcelErrorBoundary>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/Excel Integration Error/)).toBeInTheDocument();
        expect(screen.getByText(/Continue Without Excel/)).toBeInTheDocument();
      });
      
      // Should allow continuing without Excel
      await user.click(screen.getByText(/Continue Without Excel/));
      
      errorSpy.mockRestore();
    });

    test('CalculationErrorBoundary should handle calculation errors with retry', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const user = userEvent.setup();
      render(
        <CalculationErrorBoundary>
          <ThrowError errorType="calculation" errorMessage="Invalid input data" />
        </CalculationErrorBoundary>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/Calculation Error/)).toBeInTheDocument();
        expect(screen.getByText(/Retry Calculation/)).toBeInTheDocument();
        expect(screen.getByText(/Reset Inputs/)).toBeInTheDocument();
      });
      
      errorSpy.mockRestore();
    });
  });

  describe('Error Recovery Integration', () => {
    test('should integrate with cache clearing for cache errors', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const cacheClearSpy = jest.spyOn(waccCalculationCache, 'clear').mockResolvedValue();
      const localStorageClearSpy = jest.spyOn(Storage.prototype, 'clear');
      
      render(
        <EnhancedErrorBoundary enableAutoRecovery={true} maxRetryAttempts={1}>
          <ThrowError errorType="cache" errorMessage="LocalStorage quota exceeded" />
        </EnhancedErrorBoundary>
      );
      
      // Should automatically attempt recovery
      await waitFor(() => {
        expect(cacheClearSpy).toHaveBeenCalled();
        expect(localStorageClearSpy).toHaveBeenCalled();
      }, { timeout: 3000 });
      
      errorSpy.mockRestore();
      cacheClearSpy.mockRestore();
      localStorageClearSpy.mockRestore();
    });

    test('should integrate with performance monitor restart', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const stopSpy = jest.spyOn(performanceMonitor, 'stopMonitoring');
      const startSpy = jest.spyOn(performanceMonitor, 'startMonitoring');
      
      render(
        <EnhancedErrorBoundary enableAutoRecovery={true} maxRetryAttempts={1}>
          <ThrowError errorType="performance" errorMessage="PerformanceObserver not supported" />
        </EnhancedErrorBoundary>
      );
      
      // Should attempt performance monitor restart
      await waitFor(() => {
        expect(stopSpy).toHaveBeenCalled();
      }, { timeout: 3000 });
      
      errorSpy.mockRestore();
    });

    test('should record recovery attempts in performance metrics', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const metricsSpy = jest.spyOn(performanceMonitor, 'recordMetric');
      
      render(
        <EnhancedErrorBoundary enableAutoRecovery={true} maxRetryAttempts={1}>
          <ThrowError errorType="render" errorMessage="Component rendering failed" />
        </EnhancedErrorBoundary>
      );
      
      // Should record recovery attempt
      await waitFor(() => {
        expect(metricsSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'error-recovery-attempt',
            metadata: expect.objectContaining({
              errorType: 'render'
            })
          })
        );
      }, { timeout: 3000 });
      
      errorSpy.mockRestore();
    });
  });

  describe('Error Boundary Performance', () => {
    test('should not significantly impact render performance', async () => {
      const NormalComponent: React.FC = () => (
        <div data-testid="normal">Normal component</div>
      );
      
      // Measure render time without error boundary
      const startTimeWithout = performance.now();
      const { unmount: unmount1 } = render(<NormalComponent />);
      const timeWithout = performance.now() - startTimeWithout;
      unmount1();
      
      // Measure render time with error boundary
      const startTimeWith = performance.now();
      const { unmount: unmount2 } = render(
        <EnhancedErrorBoundary>
          <NormalComponent />
        </EnhancedErrorBoundary>
      );
      const timeWith = performance.now() - startTimeWith;
      unmount2();
      
      // Error boundary should not add significant overhead
      const overhead = timeWith - timeWithout;
      expect(overhead).toBeLessThan(50); // Less than 50ms overhead
    });

    test('should handle multiple concurrent errors', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const MultipleErrors: React.FC = () => {
        React.useLayoutEffect(() => {
          setTimeout(() => {
            throw new Error('First error');
          }, 10);
          
          setTimeout(() => {
            throw new Error('Second error');
          }, 20);
        }, []);
        
        return <div>Multiple errors component</div>;
      };
      
      render(
        <EnhancedErrorBoundary enableAutoRecovery={false}>
          <MultipleErrors />
        </EnhancedErrorBoundary>
      );
      
      // Should handle the first error gracefully
      await waitFor(() => {
        expect(screen.getByText(/Application Error/)).toBeInTheDocument();
      });
      
      errorSpy.mockRestore();
    });

    test('should clean up resources properly', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const { unmount } = render(
        <EnhancedErrorBoundary enableAutoRecovery={true}>
          <ThrowError errorMessage="Test cleanup error" />
        </EnhancedErrorBoundary>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/Application Error/)).toBeInTheDocument();
      });
      
      // Unmounting should not cause additional errors
      expect(() => unmount()).not.toThrow();
      
      errorSpy.mockRestore();
    });
  });

  describe('Custom Error Handling', () => {
    test('should support custom fallback components', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const CustomFallback: React.FC<any> = ({ error, retry, reset }) => (
        <div data-testid="custom-fallback">
          <h1>Custom Error Handler</h1>
          <p>Error: {error?.message}</p>
          <button onClick={retry}>Custom Retry</button>
          <button onClick={reset}>Custom Reset</button>
        </div>
      );
      
      render(
        <EnhancedErrorBoundary fallback={CustomFallback}>
          <ThrowError errorMessage="Custom fallback test" />
        </EnhancedErrorBoundary>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
        expect(screen.getByText(/Custom Error Handler/)).toBeInTheDocument();
        expect(screen.getByText(/Custom Retry/)).toBeInTheDocument();
      });
      
      errorSpy.mockRestore();
    });

    test('should support custom error reporting', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const customErrorHandler = jest.fn();
      
      render(
        <EnhancedErrorBoundary 
          onError={customErrorHandler}
          reportErrors={true}
          enableAutoRecovery={false}
        >
          <ThrowError errorMessage="Custom reporting test" />
        </EnhancedErrorBoundary>
      );
      
      await waitFor(() => {
        expect(customErrorHandler).toHaveBeenCalledWith(
          expect.any(Error),
          expect.any(String),
          expect.any(Array)
        );
      });
      
      errorSpy.mockRestore();
    });
  });
});