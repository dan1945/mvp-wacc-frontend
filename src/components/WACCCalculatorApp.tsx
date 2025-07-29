import React, { useState, useCallback, useEffect } from 'react';
import { 
  FluentProvider, 
  webLightTheme, 
  webDarkTheme,
  tokens,
  Text
} from '@fluentui/react-components';
import { WACCCalculator } from './WACCCalculator';
import { ErrorBoundary } from './ErrorBoundary';
import { AuthenticationProvider } from '../contexts/AuthContext';
import { WACCDataProvider } from '../contexts/WACCDataContext';
import { OptimizedWACCProvider } from '../contexts/OptimizedWACCContext';
import { AccessibilityProvider } from '../contexts/AccessibilityContext';
import { WACCInputData, WACCCalculatorAppProps } from '@types/wacc';
import '../styles/globals.css';

/**
 * Main WACC Calculator Application Component
 * 
 * Features:
 * - Fluent UI v9 theme integration with Office host theme detection
 * - Comprehensive error boundary with recovery
 * - Accessibility context for WCAG 2.1 AA compliance
 * - Responsive design optimized for Office taskpane dimensions
 * - Hot module replacement support for development
 */
export const WACCCalculatorApp: React.FC<WACCCalculatorAppProps> = ({ 
  hostTheme = 'light',
  initialData,
  onError 
}) => {
  // Theme management with Office host integration
  const [selectedTheme, setSelectedTheme] = useState(
    hostTheme === 'dark' ? webDarkTheme : webLightTheme
  );

  // Application state
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<Error | null>(null);
  const [performanceMode, setPerformanceMode] = useState<'development' | 'production'>(
    process.env.NODE_ENV === 'production' ? 'production' : 'development'
  );

  // Respond to Office host theme changes
  useEffect(() => {
    const handleHostThemeChange = (args: any): void => {
      const newTheme = args.hostTheme === 'dark' ? webDarkTheme : webLightTheme;
      setSelectedTheme(newTheme);
    };

    // Listen for Office theme changes if available
    if (typeof Office !== 'undefined' && Office.onThemeChanged) {
      Office.onThemeChanged.add(handleHostThemeChange);
      return () => Office.onThemeChanged.remove(handleHostThemeChange);
    }
  }, []);

  // Initialize Office Add-in
  useEffect(() => {
    const initializeOffice = async (): Promise<void> => {
      try {
        if (typeof Office !== 'undefined') {
          await new Promise<void>((resolve) => {
            Office.onReady(() => {
              resolve();
            });
          });
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Office:', error);
        setInitializationError(error as Error);
        setIsInitialized(true); // Continue without Office integration
      }
    };

    initializeOffice();
  }, []);

  // Application-level error handler
  const handleApplicationError = useCallback((error: Error, errorInfo?: any): void => {
    console.error('WACC Calculator Application Error:', error, errorInfo);
    
    // Report to external error tracking if configured
    onError?.(error);
    
    // Could integrate with application monitoring service here
    if (process.env.NODE_ENV === 'production') {
      // Production error reporting
      // Example: Sentry, ApplicationInsights, etc.
    }
  }, [onError]);

  // Loading state while initializing
  if (!isInitialized) {
    return (
      <FluentProvider theme={selectedTheme}>
        <div 
          className="h-screen flex flex-col items-center justify-center bg-white font-office" 
          role="application" 
          aria-label="WACC Calculator Loading"
        >
          <div className="text-center">
            <div className="loading-shimmer w-12 h-12 rounded-full mx-auto mb-4"></div>
            <Text variant="large" weight="semibold">
              Initializing WACC Calculator...
            </Text>
            <Text variant="medium" color="secondary" className="mt-2">
              Setting up your workspace
            </Text>
          </div>
        </div>
      </FluentProvider>
    );
  }

  // Initialization error state
  if (initializationError) {
    return (
      <FluentProvider theme={selectedTheme}>
        <div 
          className="h-screen flex flex-col items-center justify-center bg-white font-office p-4" 
          role="application" 
          aria-label="WACC Calculator Error"
        >
          <div className="text-center max-w-md">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <Text variant="xLarge" weight="bold" className="mb-2">
              Initialization Failed
            </Text>
            <Text variant="medium" color="secondary" className="mb-4">
              The WACC Calculator could not initialize properly. 
              {initializationError.message && ` Error: ${initializationError.message}`}
            </Text>
            <button
              className="wacc-button-primary bg-office-blue text-white"
              onClick={() => window.location.reload()}
              aria-label="Reload application"
            >
              Reload Application
            </button>
          </div>
        </div>
      </FluentProvider>
    );
  }

  return (
    <FluentProvider theme={selectedTheme}>
      <ErrorBoundary onError={handleApplicationError}>
        <AuthenticationProvider>
          <OptimizedWACCProvider 
            initialData={initialData}
            enableDebugMode={performanceMode === 'development'}
          >
            <WACCDataProvider initialData={initialData}>
              <AccessibilityProvider>
                <div 
                  className={`
                    h-screen flex flex-col bg-white font-office motion-safe:scroll-smooth
                    ${selectedTheme === webDarkTheme ? 'dark' : ''}
                  `}
                  role="application" 
                  aria-label="WACC Calculator"
                  data-theme={hostTheme}
                  data-performance-mode={performanceMode}
                >
                  {/* Main Content Area */}
                  <main className="flex-1 overflow-auto">
                    <div className="task-pane-container">
                      <div className="scrollable-content p-4">
                        <WACCCalculator />
                      </div>
                    </div>
                  </main>

                  {/* Enhanced Footer with performance and status info */}
                  <footer 
                    className="border-t border-gray-200 px-4 py-2 bg-gray-50"
                    role="contentinfo"
                    aria-label="Application footer with status information"
                  >
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span>WACC Calculator v1.0</span>
                        {performanceMode === 'development' && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                            Debug Mode
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4">
                        <span 
                          aria-label={`Office integration status: ${typeof Office !== 'undefined' ? 'Connected' : 'Offline'}`}
                        >
                          Office: {typeof Office !== 'undefined' ? 'Connected' : 'Offline'}
                        </span>
                        <span 
                          aria-label={`Theme: ${hostTheme}`}
                        >
                          Theme: {hostTheme}
                        </span>
                      </div>
                    </div>
                  </footer>
                </div>
              </AccessibilityProvider>
            </WACCDataProvider>
          </OptimizedWACCProvider>
        </AuthenticationProvider>
      </ErrorBoundary>
    </FluentProvider>
  );
};

export default WACCCalculatorApp;