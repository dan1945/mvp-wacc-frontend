/**
 * Performance Monitoring Framework
 * Comprehensive metrics collection and reporting for WACC Calculator
 */

// Performance metric types
interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
  tags?: string[];
}

interface PerformanceReport {
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    calculation: CalculationMetrics;
    rendering: RenderingMetrics;
    caching: CachingMetrics;
    memory: MemoryMetrics;
    network: NetworkMetrics;
    userInteraction: UserInteractionMetrics;
  };
  summary: PerformanceSummary;
}

interface CalculationMetrics {
  averageCalculationTime: number;
  medianCalculationTime: number;
  p95CalculationTime: number;
  totalCalculations: number;
  cacheHitRate: number;
  errorRate: number;
  inputValidationTime: number;
}

interface RenderingMetrics {
  averageRenderTime: number;
  componentRerenders: Record<string, number>;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  frameDrop: number;
}

interface CachingMetrics {
  hitRate: number;
  missRate: number;
  evictionRate: number;
  averageAccessTime: number;
  cacheSize: number;
  memoryUsage: number;
}

interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  heapUtilization: number;
  gcPauses: number[];
}

interface NetworkMetrics {
  excelApiCallTime: number;
  apiErrorRate: number;
  totalApiCalls: number;
  averageResponseSize: number;
}

interface UserInteractionMetrics {
  inputLatency: number;
  buttonClickResponseTime: number;
  scrollPerformance: number;
  accessibilityIssues: number;
}

interface PerformanceSummary {
  overallScore: number; // 0-100
  bottlenecks: string[];
  recommendations: string[];
  performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
}

// Benchmark thresholds (based on industry standards)
const PERFORMANCE_THRESHOLDS = {
  calculation: {
    excellent: 50,   // < 50ms
    good: 100,       // < 100ms
    acceptable: 200, // < 200ms
    poor: 500,       // < 500ms
  },
  rendering: {
    excellent: 16,   // < 16ms (60fps)
    good: 33,        // < 33ms (30fps)
    acceptable: 100, // < 100ms
    poor: 300,       // < 300ms
  },
  caching: {
    hitRateExcellent: 0.95,  // > 95%
    hitRateGood: 0.85,       // > 85%
    hitRateAcceptable: 0.70, // > 70%
  },
  memory: {
    heapUtilizationWarning: 0.8,  // > 80%
    heapUtilizationCritical: 0.95, // > 95%
  }
} as const;

/**
 * Core Performance Monitor
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private startTimes: Map<string, number> = new Map();
  private isCollecting = false;
  private reportInterval?: NodeJS.Timeout;
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isCollecting) return;
    
    this.isCollecting = true;
    this.setupWebVitalsObservers();
    this.setupMemoryMonitoring();
    this.setupUserTimingObserver();
    this.startPeriodicReporting();
    
    console.log('Performance monitoring started');
  }
  
  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    this.isCollecting = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
    }
    
    console.log('Performance monitoring stopped');
  }
  
  /**
   * Mark the start of a performance measurement
   */
  markStart(name: string, metadata?: Record<string, any>): void {
    const timestamp = performance.now();
    this.startTimes.set(name, timestamp);
    
    // Also use User Timing API for better browser dev tools integration
    performance.mark(`${name}-start`);
    
    this.recordMetric({
      name: `${name}-start`,
      value: timestamp,
      timestamp,
      metadata,
      tags: ['timing', 'start']
    });
  }
  
  /**
   * Mark the end of a performance measurement
   */
  markEnd(name: string, metadata?: Record<string, any>): number {
    const endTime = performance.now();
    const startTime = this.startTimes.get(name);
    
    if (startTime === undefined) {
      console.warn(`No start time found for metric: ${name}`);
      return 0;
    }
    
    const duration = endTime - startTime;
    
    // Use User Timing API
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    this.recordMetric({
      name,
      value: duration,
      timestamp: endTime,
      metadata: { ...metadata, startTime, endTime },
      tags: ['timing', 'duration']
    });
    
    this.startTimes.delete(name);
    return duration;
  }
  
  /**
   * Record a custom metric
   */
  recordMetric(metric: PerformanceMetric): void {
    if (!this.isCollecting) return;
    
    this.metrics.push(metric);
    
    // Prevent memory leaks by limiting metrics history
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-5000);
    }
  }
  
  /**
   * Record WACC calculation performance
   */
  recordCalculationMetrics(
    calculationTime: number,
    cacheHit: boolean,
    inputSize: number,
    errorOccurred: boolean = false
  ): void {
    this.recordMetric({
      name: 'wacc-calculation',
      value: calculationTime,
      timestamp: performance.now(),
      metadata: {
        cacheHit,
        inputSize,
        errorOccurred,
      },
      tags: ['calculation', 'wacc']
    });
  }
  
  /**
   * Record component render performance
   */
  recordRenderMetrics(componentName: string, renderTime: number, rerender: boolean = false): void {
    this.recordMetric({
      name: 'component-render',
      value: renderTime,
      timestamp: performance.now(),
      metadata: {
        componentName,
        rerender,
      },
      tags: ['rendering', 'component']
    });
  }
  
  /**
   * Record Excel API performance
   */
  recordExcelApiMetrics(operation: string, duration: number, success: boolean, dataSize?: number): void {
    this.recordMetric({
      name: 'excel-api',
      value: duration,
      timestamp: performance.now(),
      metadata: {
        operation,
        success,
        dataSize,
      },
      tags: ['excel', 'api']
    });
  }
  
  /**
   * Record cache performance
   */
  recordCacheMetrics(operation: 'hit' | 'miss' | 'set' | 'evict', duration: number, size?: number): void {
    this.recordMetric({
      name: 'cache-operation',
      value: duration,
      timestamp: performance.now(),
      metadata: {
        operation,
        size,
      },
      tags: ['cache']
    });
  }
  
  /**
   * Generate comprehensive performance report
   */
  generateReport(periodMinutes: number = 30): PerformanceReport {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - periodMinutes * 60 * 1000);
    
    const periodMetrics = this.metrics.filter(
      m => m.timestamp >= startTime.getTime() && m.timestamp <= endTime.getTime()
    );
    
    return {
      period: { start: startTime, end: endTime },
      metrics: {
        calculation: this.calculateCalculationMetrics(periodMetrics),
        rendering: this.calculateRenderingMetrics(periodMetrics),
        caching: this.calculateCachingMetrics(periodMetrics),
        memory: this.calculateMemoryMetrics(),
        network: this.calculateNetworkMetrics(periodMetrics),
        userInteraction: this.calculateUserInteractionMetrics(periodMetrics),
      },
      summary: this.generateSummary(periodMetrics),
    };
  }
  
  /**
   * Get real-time performance statistics
   */
  getRealTimeStats(): Record<string, any> {
    const recentMetrics = this.metrics.filter(
      m => performance.now() - m.timestamp < 60000 // Last minute
    );
    
    return {
      activeMetrics: recentMetrics.length,
      averageCalculationTime: this.calculateAverage(
        recentMetrics.filter(m => m.name === 'wacc-calculation').map(m => m.value)
      ),
      cacheHitRate: this.calculateCacheHitRate(recentMetrics),
      memoryUsage: this.getCurrentMemoryUsage(),
      timestamp: new Date().toISOString(),
    };
  }
  
  /**
   * Export metrics for external analysis
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['timestamp', 'name', 'value', 'metadata', 'tags'];
      const rows = this.metrics.map(m => [
        new Date(m.timestamp).toISOString(),
        m.name,
        m.value.toString(),
        JSON.stringify(m.metadata || {}),
        (m.tags || []).join(';')
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    return JSON.stringify(this.metrics, null, 2);
  }
  
  /**
   * Performance recommendations engine
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const report = this.generateReport(10); // Last 10 minutes
    
    // Calculation performance recommendations
    if (report.metrics.calculation.averageCalculationTime > PERFORMANCE_THRESHOLDS.calculation.acceptable) {
      recommendations.push('Consider optimizing WACC calculation algorithm or increasing cache TTL');
    }
    
    if (report.metrics.calculation.cacheHitRate < PERFORMANCE_THRESHOLDS.caching.hitRateAcceptable) {
      recommendations.push('Cache hit rate is low - review caching strategy and TTL settings');
    }
    
    // Memory recommendations
    if (report.metrics.memory.heapUtilization > PERFORMANCE_THRESHOLDS.memory.heapUtilizationWarning) {
      recommendations.push('High memory usage detected - consider implementing memory cleanup routines');
    }
    
    // Rendering recommendations
    if (report.metrics.rendering.averageRenderTime > PERFORMANCE_THRESHOLDS.rendering.acceptable) {
      recommendations.push('Component render times are high - consider React.memo or component splitting');
    }
    
    if (Object.values(report.metrics.rendering.componentRerenders).some(count => count > 10)) {
      recommendations.push('Excessive component re-renders detected - optimize state management');
    }
    
    return recommendations;
  }
  
  // Private helper methods
  
  private setupWebVitalsObservers(): void {
    if (typeof PerformanceObserver === 'undefined') return;
    
    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEventTiming;
      
      this.recordMetric({
        name: 'largest-contentful-paint',
        value: lastEntry.startTime,
        timestamp: performance.now(),
        tags: ['web-vitals', 'lcp']
      });
    });
    
    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', lcpObserver);
    } catch (e) {
      console.warn('LCP observer not supported');
    }
    
    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name === 'first-input-delay') {
          this.recordMetric({
            name: 'first-input-delay',
            value: entry.duration,
            timestamp: performance.now(),
            tags: ['web-vitals', 'fid']
          });
        }
      });
    });
    
    try {
      fidObserver.observe({ entryTypes: ['measure'] });
      this.observers.set('fid', fidObserver);
    } catch (e) {
      console.warn('FID observer not supported');
    }
    
    // Cumulative Layout Shift
    const clsObserver = new PerformanceObserver((list) => {
      let clsValue = 0;
      
      list.getEntries().forEach((entry) => {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      });
      
      this.recordMetric({
        name: 'cumulative-layout-shift',
        value: clsValue,
        timestamp: performance.now(),
        tags: ['web-vitals', 'cls']
      });
    });
    
    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', clsObserver);
    } catch (e) {
      console.warn('CLS observer not supported');
    }
  }
  
  private setupMemoryMonitoring(): void {
    const collectMemoryMetrics = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        
        this.recordMetric({
          name: 'memory-usage',
          value: memory.usedJSHeapSize,
          timestamp: performance.now(),
          metadata: {
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
          },
          tags: ['memory']
        });
      }
    };
    
    // Collect memory metrics every 30 seconds
    const memoryInterval = setInterval(collectMemoryMetrics, 30000);
    
    // Store interval reference for cleanup
    (this as any).memoryInterval = memoryInterval;
  }
  
  private setupUserTimingObserver(): void {
    if (typeof PerformanceObserver === 'undefined') return;
    
    const userTimingObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'measure') {
          this.recordMetric({
            name: `user-timing-${entry.name}`,
            value: entry.duration,
            timestamp: performance.now(),
            metadata: {
              startTime: entry.startTime,
            },
            tags: ['user-timing']
          });
        }
      });
    });
    
    try {
      userTimingObserver.observe({ entryTypes: ['measure'] });
      this.observers.set('user-timing', userTimingObserver);
    } catch (e) {
      console.warn('User timing observer not supported');
    }
  }
  
  private startPeriodicReporting(): void {
    this.reportInterval = setInterval(() => {
      const stats = this.getRealTimeStats();
      console.log('Performance Stats:', stats);
      
      // Check for performance issues
      const recommendations = this.getRecommendations();
      if (recommendations.length > 0) {
        console.warn('Performance Recommendations:', recommendations);
      }
    }, 60000); // Report every minute
  }
  
  private calculateCalculationMetrics(metrics: PerformanceMetric[]): CalculationMetrics {
    const calcMetrics = metrics.filter(m => m.name === 'wacc-calculation');
    const times = calcMetrics.map(m => m.value);
    
    return {
      averageCalculationTime: this.calculateAverage(times),
      medianCalculationTime: this.calculateMedian(times),
      p95CalculationTime: this.calculatePercentile(times, 95),
      totalCalculations: calcMetrics.length,
      cacheHitRate: this.calculateCacheHitRate(calcMetrics),
      errorRate: calcMetrics.filter(m => m.metadata?.errorOccurred).length / calcMetrics.length,
      inputValidationTime: this.calculateAverage(
        metrics.filter(m => m.name.includes('validation')).map(m => m.value)
      ),
    };
  }
  
  private calculateRenderingMetrics(metrics: PerformanceMetric[]): RenderingMetrics {
    const renderMetrics = metrics.filter(m => m.name === 'component-render');
    const componentRerenders: Record<string, number> = {};
    
    renderMetrics.forEach(m => {
      const componentName = m.metadata?.componentName || 'unknown';
      if (m.metadata?.rerender) {
        componentRerenders[componentName] = (componentRerenders[componentName] || 0) + 1;
      }
    });
    
    return {
      averageRenderTime: this.calculateAverage(renderMetrics.map(m => m.value)),
      componentRerenders,
      largestContentfulPaint: this.getLatestMetric('largest-contentful-paint', metrics),
      firstInputDelay: this.getLatestMetric('first-input-delay', metrics),
      cumulativeLayoutShift: this.getLatestMetric('cumulative-layout-shift', metrics),
      frameDrop: 0, // Would require more sophisticated measurement
    };
  }
  
  private calculateCachingMetrics(metrics: PerformanceMetric[]): CachingMetrics {
    const cacheMetrics = metrics.filter(m => m.name === 'cache-operation');
    const hits = cacheMetrics.filter(m => m.metadata?.operation === 'hit').length;
    const misses = cacheMetrics.filter(m => m.metadata?.operation === 'miss').length;
    const evictions = cacheMetrics.filter(m => m.metadata?.operation === 'evict').length;
    const total = hits + misses;
    
    return {
      hitRate: total > 0 ? hits / total : 0,
      missRate: total > 0 ? misses / total : 0,
      evictionRate: cacheMetrics.length > 0 ? evictions / cacheMetrics.length : 0,
      averageAccessTime: this.calculateAverage(cacheMetrics.map(m => m.value)),
      cacheSize: 0, // Would be provided by cache manager
      memoryUsage: 0, // Would be provided by cache manager
    };
  }
  
  private calculateMemoryMetrics(): MemoryMetrics {
    const memoryUsage = this.getCurrentMemoryUsage();
    
    return {
      usedJSHeapSize: memoryUsage.usedJSHeapSize,
      totalJSHeapSize: memoryUsage.totalJSHeapSize,
      jsHeapSizeLimit: memoryUsage.jsHeapSizeLimit,
      heapUtilization: memoryUsage.usedJSHeapSize / memoryUsage.jsHeapSizeLimit,
      gcPauses: [], // Would require GC observation
    };
  }
  
  private calculateNetworkMetrics(metrics: PerformanceMetric[]): NetworkMetrics {
    const apiMetrics = metrics.filter(m => m.name === 'excel-api');
    
    return {
      excelApiCallTime: this.calculateAverage(apiMetrics.map(m => m.value)),
      apiErrorRate: apiMetrics.filter(m => m.metadata?.success === false).length / apiMetrics.length,
      totalApiCalls: apiMetrics.length,
      averageResponseSize: this.calculateAverage(
        apiMetrics.map(m => m.metadata?.dataSize || 0).filter(size => size > 0)
      ),
    };
  }
  
  private calculateUserInteractionMetrics(metrics: PerformanceMetric[]): UserInteractionMetrics {
    return {
      inputLatency: this.getLatestMetric('first-input-delay', metrics),
      buttonClickResponseTime: this.calculateAverage(
        metrics.filter(m => m.tags?.includes('user-interaction')).map(m => m.value)
      ),
      scrollPerformance: 0, // Would require scroll event measurement
      accessibilityIssues: 0, // Would require accessibility audit
    };
  }
  
  private generateSummary(metrics: PerformanceMetric[]): PerformanceSummary {
    const calcMetrics = this.calculateCalculationMetrics(metrics);
    const renderMetrics = this.calculateRenderingMetrics(metrics);
    const cacheMetrics = this.calculateCachingMetrics(metrics);
    
    let score = 100;
    const bottlenecks: string[] = [];
    const recommendations: string[] = [];
    
    // Scoring algorithm
    if (calcMetrics.averageCalculationTime > PERFORMANCE_THRESHOLDS.calculation.poor) {
      score -= 30;
      bottlenecks.push('Calculation Performance');
    } else if (calcMetrics.averageCalculationTime > PERFORMANCE_THRESHOLDS.calculation.acceptable) {
      score -= 15;
    }
    
    if (renderMetrics.averageRenderTime > PERFORMANCE_THRESHOLDS.rendering.poor) {
      score -= 25;
      bottlenecks.push('Rendering Performance');
    }
    
    if (cacheMetrics.hitRate < PERFORMANCE_THRESHOLDS.caching.hitRateAcceptable) {
      score -= 20;
      bottlenecks.push('Cache Efficiency');
    }
    
    // Generate recommendations
    recommendations.push(...this.getRecommendations());
    
    const performanceGrade: PerformanceSummary['performanceGrade'] = 
      score >= 90 ? 'A' :
      score >= 80 ? 'B' :
      score >= 70 ? 'C' :
      score >= 60 ? 'D' : 'F';
    
    return {
      overallScore: Math.max(0, score),
      bottlenecks,
      recommendations,
      performanceGrade,
    };
  }
  
  // Utility methods
  
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }
  
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
  
  private calculateCacheHitRate(metrics: PerformanceMetric[]): number {
    const relevantMetrics = metrics.filter(m => m.metadata?.cacheHit !== undefined);
    if (relevantMetrics.length === 0) return 0;
    
    const hits = relevantMetrics.filter(m => m.metadata?.cacheHit === true).length;
    return hits / relevantMetrics.length;
  }
  
  private getLatestMetric(name: string, metrics: PerformanceMetric[]): number {
    const relevant = metrics.filter(m => m.name === name);
    return relevant.length > 0 ? relevant[relevant.length - 1].value : 0;
  }
  
  private getCurrentMemoryUsage(): { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }
    
    return { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 };
  }
  
  /**
   * Cleanup resources
   */
  dispose(): void {
    this.stopMonitoring();
    
    if ((this as any).memoryInterval) {
      clearInterval((this as any).memoryInterval);
    }
    
    this.metrics = [];
    this.startTimes.clear();
  }
}

// Global performance monitor instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// React hook for performance monitoring
export const usePerformanceMonitoring = () => {
  const monitor = PerformanceMonitor.getInstance();
  
  return {
    markStart: monitor.markStart.bind(monitor),
    markEnd: monitor.markEnd.bind(monitor),
    recordMetric: monitor.recordMetric.bind(monitor),
    getRealTimeStats: monitor.getRealTimeStats.bind(monitor),
    getRecommendations: monitor.getRecommendations.bind(monitor),
  };
};