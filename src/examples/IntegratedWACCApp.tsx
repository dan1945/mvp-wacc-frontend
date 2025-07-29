import React from 'react';
import { OptimizedWACCDataProvider } from '../contexts/OptimizedWACCContext';
import { PerformanceProvider, PerformanceDashboard } from '../providers/PerformanceProvider';
import { 
  EnhancedErrorBoundary, 
  CacheErrorBoundary, 
  PerformanceErrorBoundary, 
  ExcelErrorBoundary, 
  CalculationErrorBoundary 
} from '../components/ErrorBoundaries/EnhancedErrorBoundary';
import { OptimizedWACCCalculator } from '../components/Optimized/OptimizedWACCComponents';
import { WACCResult } from '../types/wacc';

/**
 * Integrated WACC Application Example
 * 
 * Demonstrates complete integration of all enhanced services:
 * - OptimizedWACCContext for state management
 * - PerformanceProvider for monitoring
 * - Enhanced error boundaries for service recovery
 * - Optimized components with React.memo
 * - Cache management with warming strategies
 * - Excel integration with platform detection
 */

interface IntegratedWACCAppProps {
  enablePerformanceDashboard?: boolean;
  enableAutoCalculation?: boolean;
  initialData?: any;
  onError?: (error: Error, context: string) => void;
}

export const IntegratedWACCApp: React.FC<IntegratedWACCAppProps> = ({
  enablePerformanceDashboard = true,
  enableAutoCalculation = true,
  initialData,
  onError,
}) => {
  const handlePerformanceAlert = (alert: { type: string; message: string; severity: 'low' | 'medium' | 'high' }) => {
    console.warn(`Performance Alert [${alert.severity}]:`, alert.message);
    
    if (onError && alert.severity === 'high') {
      onError(new Error(`Performance issue: ${alert.message}`), 'performance');
    }
  };

  const handleWACCResultChange = (result: WACCResult | null) => {
    // Handle result changes - could be used for analytics, logging, etc.
    if (result) {
      console.log('WACC calculated:', {
        wacc: result.weightedAverageCostOfCapital,
        calculationTime: result.performanceMetrics.calculationTime,
        timestamp: result.calculationTimestamp,
      });
    }
  };

  return (
    <EnhancedErrorBoundary
      enableAutoRecovery={true}
      maxRetryAttempts={3}
      reportErrors={true}
      onError={(error, errorType, recoveryActions) => {
        console.error('App Error:', { error, errorType, recoveryActions });
        if (onError) {
          onError(error, errorType);
        }
      }}
    >
      <PerformanceProvider
        enableRealTimeTracking={true}
        reportingIntervalMs={30000}
        alertThresholds={{
          calculationTime: 300,
          renderTime: 50,
          memoryUsage: 0.8,
        }}
        onPerformanceAlert={handlePerformanceAlert}
      >
        <PerformanceErrorBoundary>
          <OptimizedWACCDataProvider
            initialData={initialData}
            autoSyncWithExcel={true}
            enableCaching={true}
            enablePerformanceMonitoring={true}
          >
            <CacheErrorBoundary>
              <div style={{
                minHeight: '100vh',
                backgroundColor: '#f8f9fa',
                fontFamily: 'Segoe UI, system-ui, sans-serif',
              }}>
                {/* Header */}
                <header style={{
                  backgroundColor: '#1f4e79',
                  color: 'white',
                  padding: '20px',
                  textAlign: 'center',
                }}>
                  <h1 style={{ margin: 0, fontSize: '28px' }}>
                    Enhanced WACC Calculator
                  </h1>
                  <p style={{ 
                    margin: '8px 0 0 0', 
                    opacity: 0.9,
                    fontSize: '14px',
                  }}>
                    With integrated caching, performance monitoring, and Excel integration
                  </p>
                </header>

                {/* Main Content */}
                <main style={{
                  padding: '40px 20px',
                  maxWidth: '1200px',
                  margin: '0 auto',
                }}>
                  <ExcelErrorBoundary>
                    <CalculationErrorBoundary>
                      <OptimizedWACCCalculator
                        initialData={initialData}
                        onResultChange={handleWACCResultChange}
                        data-testid="integrated-wacc-calculator"
                      />
                    </CalculationErrorBoundary>
                  </ExcelErrorBoundary>
                </main>

                {/* Performance Dashboard */}
                {enablePerformanceDashboard && (
                  <PerformanceDashboard 
                    compact={false}
                    showRecommendations={true}
                  />
                )}

                {/* Footer */}
                <footer style={{
                  backgroundColor: '#666',
                  color: 'white',
                  padding: '20px',
                  textAlign: 'center',
                  marginTop: '40px',
                }}>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    Enhanced WACC Calculator with Performance Monitoring
                  </div>
                  <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '4px' }}>
                    Built with React, TypeScript, and optimized for Office.js integration
                  </div>
                </footer>

                {/* Global CSS for animations and transitions */}
                <style>{`
                  * {
                    box-sizing: border-box;
                  }
                  
                  body {
                    margin: 0;
                    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                  }
                  
                  button {
                    transition: all 0.2s ease;
                  }
                  
                  button:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                  }
                  
                  input:focus {
                    outline: none;
                    border-color: #0078d4;
                    box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.2);
                  }
                  
                  .fade-in {
                    animation: fadeIn 0.3s ease-in;
                  }
                  
                  @keyframes fadeIn {
                    from {
                      opacity: 0;
                      transform: translateY(10px);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }
                `}</style>
              </div>
            </CacheErrorBoundary>
          </OptimizedWACCDataProvider>
        </PerformanceErrorBoundary>
      </PerformanceProvider>
    </EnhancedErrorBoundary>
  );
};

/**
 * Minimal Integration Example for Testing
 */
export const MinimalIntegratedWACCApp: React.FC = () => {
  return (
    <PerformanceProvider enableRealTimeTracking={false}>
      <OptimizedWACCDataProvider
        enableCaching={true}
        enablePerformanceMonitoring={false}
      >
        <CacheErrorBoundary>
          <div style={{ padding: '20px' }}>
            <OptimizedWACCCalculator />
            <PerformanceDashboard compact={true} />
          </div>
        </CacheErrorBoundary>
      </OptimizedWACCDataProvider>
    </PerformanceProvider>
  );
};

/**
 * Development Integration Example with All Features
 */
export const DevelopmentIntegratedWACCApp: React.FC = () => {
  const handleAppError = (error: Error, context: string) => {
    // In development, log detailed error information
    console.group(`🚨 App Error in ${context}`);
    console.error('Error object:', error);
    console.error('Stack trace:', error.stack);
    console.error('Context:', context);
    console.groupEnd();
    
    // Could also send to error tracking service
    // errorTrackingService.captureException(error, { context });
  };

  return (
    <IntegratedWACCApp
      enablePerformanceDashboard={true}
      enableAutoCalculation={true}
      onError={handleAppError}
    />
  );
};

/**
 * Production Integration Example with Error Reporting
 */
export const ProductionIntegratedWACCApp: React.FC = () => {
  const handleAppError = (error: Error, context: string) => {
    // In production, report errors but don't expose details to user
    console.error('Production error:', error.message);
    
    // Report to error tracking service
    // errorTrackingService.captureException(error, {
    //   context,
    //   user: getCurrentUser(),
    //   environment: 'production',
    // });
    
    // Show user-friendly error message
    // notificationService.showError('An unexpected error occurred. Please try again.');
  };

  return (
    <IntegratedWACCApp
      enablePerformanceDashboard={false} // Disable in production UI
      enableAutoCalculation={true}
      onError={handleAppError}
    />
  );
};

export default IntegratedWACCApp;