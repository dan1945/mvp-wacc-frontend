import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { performanceMonitor } from '../services/PerformanceMonitor';

/**
 * Performance Provider Component
 * 
 * Manages performance monitoring across the entire application:
 * - Centralized performance monitoring state
 * - Real-time performance metrics
 * - Performance alerts and recommendations
 * - Component-level performance tracking
 * - Memory leak detection and prevention
 */

interface PerformanceContextType {
  // Performance metrics
  realTimeStats: any;
  performanceReport: any;
  recommendations: string[];
  
  // Monitoring state
  isMonitoring: boolean;
  monitoringError: Error | null;
  
  // Performance actions
  startMonitoring: () => void;
  stopMonitoring: () => void;
  generateReport: (periodMinutes?: number) => any;
  getRecommendations: () => string[];
  exportMetrics: (format?: 'json' | 'csv') => string;
  
  // Component tracking
  trackComponentRender: (componentName: string, renderTime: number, isRerender?: boolean) => void;
  trackUserInteraction: (interactionType: string, duration: number) => void;
  
  // Performance utilities
  measureOperation: <T>(name: string, operation: () => Promise<T>) => Promise<T>;
  isPerformanceGood: boolean;
  performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
}

const PerformanceContext = createContext<PerformanceContextType | null>(null);

interface PerformanceProviderProps {
  children: ReactNode;
  enableRealTimeTracking?: boolean;
  reportingIntervalMs?: number;
  alertThresholds?: {
    calculationTime: number;
    renderTime: number;
    memoryUsage: number;
  };
  onPerformanceAlert?: (alert: { type: string; message: string; severity: 'low' | 'medium' | 'high' }) => void;
}

export const PerformanceProvider: React.FC<PerformanceProviderProps> = ({
  children,
  enableRealTimeTracking = true,
  reportingIntervalMs = 30000,
  alertThresholds = {
    calculationTime: 500,
    renderTime: 100,
    memoryUsage: 0.8,
  },
  onPerformanceAlert,
}) => {
  // Performance state
  const [realTimeStats, setRealTimeStats] = useState<any>(null);
  const [performanceReport, setPerformanceReport] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [monitoringError, setMonitoringError] = useState<Error | null>(null);
  const [isPerformanceGood, setIsPerformanceGood] = useState(true);
  const [performanceGrade, setPerformanceGrade] = useState<'A' | 'B' | 'C' | 'D' | 'F'>('A');

  // Start performance monitoring
  const startMonitoring = useCallback(() => {
    try {
      performanceMonitor.startMonitoring();
      setIsMonitoring(true);
      setMonitoringError(null);
      
      console.log('🚀 Performance monitoring started');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setMonitoringError(err);
      console.error('Failed to start performance monitoring:', err);
    }
  }, []);

  // Stop performance monitoring
  const stopMonitoring = useCallback(() => {
    try {
      performanceMonitor.stopMonitoring();
      setIsMonitoring(false);
      setMonitoringError(null);
      
      console.log('🛑 Performance monitoring stopped');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setMonitoringError(err);
      console.error('Failed to stop performance monitoring:', err);
    }
  }, []);

  // Generate performance report
  const generateReport = useCallback((periodMinutes: number = 30) => {
    try {
      const report = performanceMonitor.generateReport(periodMinutes);
      setPerformanceReport(report);
      return report;
    } catch (error) {
      console.error('Failed to generate performance report:', error);
      return null;
    }
  }, []);

  // Get recommendations
  const getRecommendations = useCallback(() => {
    try {
      const recs = performanceMonitor.getRecommendations();
      setRecommendations(recs);
      return recs;
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      return [];
    }
  }, []);

  // Export metrics
  const exportMetrics = useCallback((format: 'json' | 'csv' = 'json') => {
    try {
      return performanceMonitor.exportMetrics(format);
    } catch (error) {
      console.error('Failed to export metrics:', error);
      return '';
    }
  }, []);

  // Track component render
  const trackComponentRender = useCallback((componentName: string, renderTime: number, isRerender: boolean = false) => {
    performanceMonitor.recordRenderMetrics(componentName, renderTime, isRerender);
    
    // Check for performance alerts
    if (renderTime > alertThresholds.renderTime && onPerformanceAlert) {
      onPerformanceAlert({
        type: 'render',
        message: `Component ${componentName} took ${renderTime}ms to render`,
        severity: renderTime > alertThresholds.renderTime * 2 ? 'high' : 'medium',
      });
    }
  }, [alertThresholds.renderTime, onPerformanceAlert]);

  // Track user interaction
  const trackUserInteraction = useCallback((interactionType: string, duration: number) => {
    performanceMonitor.recordMetric({
      name: 'user-interaction',
      value: duration,
      timestamp: performance.now(),
      metadata: { interactionType },
      tags: ['user-interaction', interactionType]
    });
  }, []);

  // Measure operation with automatic tracking
  const measureOperation = useCallback(async function<T>(name: string, operation: () => Promise<T>): Promise<T> {
    performanceMonitor.markStart(name);
    
    try {
      const result = await operation();
      const duration = performanceMonitor.markEnd(name);
      
      // Check for performance alerts
      if (name.includes('calculation') && duration > alertThresholds.calculationTime && onPerformanceAlert) {
        onPerformanceAlert({
          type: 'calculation',
          message: `${name} took ${duration}ms to complete`,
          severity: duration > alertThresholds.calculationTime * 2 ? 'high' : 'medium',
        });
      }
      
      return result;
    } catch (error) {
      performanceMonitor.markEnd(name);
      throw error;
    }
  }, [alertThresholds.calculationTime, onPerformanceAlert]);

  // Real-time performance tracking
  useEffect(() => {
    if (!enableRealTimeTracking || !isMonitoring) return;

    const updateStats = () => {
      try {
        const stats = performanceMonitor.getRealTimeStats();
        setRealTimeStats(stats);
        
        // Update performance grade and status
        const report = performanceMonitor.generateReport(5); // Last 5 minutes
        if (report?.summary) {
          setPerformanceGrade(report.summary.performanceGrade);
          setIsPerformanceGood(report.summary.overallScore >= 70);
          
          // Check for performance alerts
          if (report.summary.overallScore < 60 && onPerformanceAlert) {
            onPerformanceAlert({
              type: 'overall',
              message: `Overall performance score is ${report.summary.overallScore}`,
              severity: report.summary.overallScore < 40 ? 'high' : 'medium',
            });
          }
        }
        
        // Get updated recommendations
        const recs = performanceMonitor.getRecommendations();
        setRecommendations(recs);
        
      } catch (error) {
        console.warn('Failed to update performance stats:', error);
      }
    };

    const interval = setInterval(updateStats, reportingIntervalMs);
    
    // Initial update
    updateStats();
    
    return () => clearInterval(interval);
  }, [enableRealTimeTracking, isMonitoring, reportingIntervalMs, onPerformanceAlert]);

  // Memory leak detection
  useEffect(() => {
    if (!isMonitoring) return;

    const checkMemoryUsage = () => {
      const memoryInfo = (performance as any).memory;
      if (memoryInfo) {
        const usage = memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit;
        
        if (usage > alertThresholds.memoryUsage && onPerformanceAlert) {
          onPerformanceAlert({
            type: 'memory',
            message: `High memory usage detected: ${(usage * 100).toFixed(1)}%`,
            severity: usage > 0.9 ? 'high' : 'medium',
          });
        }
      }
    };

    const memoryCheckInterval = setInterval(checkMemoryUsage, 60000); // Check every minute
    
    return () => clearInterval(memoryCheckInterval);
  }, [isMonitoring, alertThresholds.memoryUsage, onPerformanceAlert]);

  // Auto-start monitoring on mount
  useEffect(() => {
    startMonitoring();
    
    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  const contextValue: PerformanceContextType = {
    // Performance metrics
    realTimeStats,
    performanceReport,
    recommendations,
    
    // Monitoring state
    isMonitoring,
    monitoringError,
    
    // Performance actions
    startMonitoring,
    stopMonitoring,
    generateReport,
    getRecommendations,
    exportMetrics,
    
    // Component tracking
    trackComponentRender,
    trackUserInteraction,
    
    // Performance utilities
    measureOperation,
    isPerformanceGood,
    performanceGrade,
  };

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  );
};

export const usePerformance = (): PerformanceContextType => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
};

/**
 * Higher-Order Component for automatic render tracking
 */
export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const ComponentWithPerformanceTracking: React.FC<P> = (props) => {
    const { trackComponentRender } = usePerformance();
    const name = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Unknown';
    
    useEffect(() => {
      const startTime = performance.now();
      
      return () => {
        const renderTime = performance.now() - startTime;
        trackComponentRender(name, renderTime);
      };
    });

    return <WrappedComponent {...props} />;
  };

  ComponentWithPerformanceTracking.displayName = `withPerformanceTracking(${componentName || WrappedComponent.displayName || WrappedComponent.name})`;
  
  return ComponentWithPerformanceTracking;
}

/**
 * React Hook for measuring component render performance
 */
export const useRenderPerformance = (componentName: string) => {
  const { trackComponentRender } = usePerformance();
  const renderStartTime = React.useRef<number>();
  const renderCount = React.useRef(0);

  // Track render start
  React.useLayoutEffect(() => {
    renderStartTime.current = performance.now();
  });

  // Track render end
  React.useEffect(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      const isRerender = renderCount.current > 0;
      
      trackComponentRender(componentName, renderTime, isRerender);
      renderCount.current += 1;
    }
  });

  return {
    renderCount: renderCount.current,
  };
};

/**
 * Performance Dashboard Component
 */
export const PerformanceDashboard: React.FC<{ 
  compact?: boolean;
  showRecommendations?: boolean; 
}> = ({ 
  compact = false,
  showRecommendations = true 
}) => {
  const {
    realTimeStats,
    recommendations,
    isMonitoring,
    performanceGrade,
    isPerformanceGood,
  } = usePerformance();

  if (!isMonitoring || !realTimeStats) {
    return null;
  }

  const gradeColor = {
    'A': '#28a745',
    'B': '#ffc107', 
    'C': '#fd7e14',
    'D': '#dc3545',
    'F': '#dc3545'
  }[performanceGrade];

  if (compact) {
    return (
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        padding: '8px 12px',
        backgroundColor: isPerformanceGood ? '#d4edda' : '#f8d7da',
        border: `1px solid ${isPerformanceGood ? '#c3e6cb' : '#f5c6cb'}`,
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 1000,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: gradeColor,
          }} />
          <span>{performanceGrade}</span>
          {realTimeStats.averageCalculationTime && (
            <span>{Math.round(realTimeStats.averageCalculationTime)}ms</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '300px',
      padding: '16px',
      backgroundColor: 'white',
      border: '1px solid #ddd',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      fontSize: '13px',
      zIndex: 1000,
    }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold' }}>
        Performance Monitor
      </h3>
      
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Grade:</span>
          <span style={{ color: gradeColor, fontWeight: 'bold' }}>{performanceGrade}</span>
        </div>
        
        {realTimeStats.averageCalculationTime && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Calc Time:</span>
            <span>{Math.round(realTimeStats.averageCalculationTime)}ms</span>
          </div>
        )}
        
        {realTimeStats.cacheHitRate !== undefined && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Cache Hit:</span>
            <span>{Math.round(realTimeStats.cacheHitRate * 100)}%</span>
          </div>
        )}
        
        {realTimeStats.memoryUsage && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Memory:</span>
            <span>{Math.round(realTimeStats.memoryUsage.usedJSHeapSize / 1024 / 1024)}MB</span>
          </div>
        )}
      </div>

      {showRecommendations && recommendations.length > 0 && (
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 'bold' }}>
            Recommendations:
          </h4>
          <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: '11px' }}>
            {recommendations.slice(0, 3).map((rec, index) => (
              <li key={index} style={{ marginBottom: '4px' }}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};