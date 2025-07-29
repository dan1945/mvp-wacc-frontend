/**
 * Vercel Analytics and Performance Monitoring
 * Integrates with Vercel's built-in analytics and custom metrics
 */

// Enhanced analytics for Office Add-in specific events
class WACCAnalytics {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.events = [];
    
    // Initialize Vercel Analytics if available
    if (typeof window !== 'undefined' && window.va) {
      this.vercelAnalytics = window.va;
    }
    
    this.initializeEventListeners();
  }

  generateSessionId() {
    return 'wacc_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  initializeEventListeners() {
    if (typeof window === 'undefined') return;

    // Track page load performance
    window.addEventListener('load', () => {
      this.trackPageLoad();
    });

    // Track user interactions
    document.addEventListener('click', (event) => {
      if (event.target.closest('[data-analytics]')) {
        const element = event.target.closest('[data-analytics]');
        this.trackEvent('click', {
          element: element.dataset.analytics,
          timestamp: Date.now()
        });
      }
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      if (event.target.closest('[data-analytics-form]')) {
        const form = event.target.closest('[data-analytics-form]');
        this.trackEvent('form_submit', {
          form: form.dataset.analyticsForm,
          timestamp: Date.now()
        });
      }
    });

    // Track errors
    window.addEventListener('error', (event) => {
      this.trackError('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError('unhandled_promise', {
        reason: event.reason.toString()
      });
    });
  }

  trackPageLoad() {
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
      this.trackEvent('page_load', {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstContentfulPaint: this.getFirstContentfulPaint(),
        largestContentfulPaint: this.getLargestContentfulPaint()
      });
    }
  }

  getFirstContentfulPaint() {
    const entry = performance.getEntriesByName('first-contentful-paint')[0];
    return entry ? entry.startTime : null;
  }

  getLargestContentfulPaint() {
    return new Promise((resolve) => {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry.startTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    });
  }

  trackEvent(eventName, properties = {}) {
    const event = {
      name: eventName,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer
      }
    };

    this.events.push(event);

    // Send to Vercel Analytics
    if (this.vercelAnalytics) {
      this.vercelAnalytics.track(eventName, properties);
    }

    // Send to custom analytics endpoint
    this.sendToAnalytics(event);

    console.log('Analytics Event:', event);
  }

  trackError(errorType, errorDetails) {
    this.trackEvent('error', {
      errorType,
      ...errorDetails,
      severity: 'error'
    });
  }

  trackWACCCalculation(inputData, result, calculationTime) {
    this.trackEvent('wacc_calculation', {
      marketValueEquity: inputData.marketValueEquity,
      marketValueDebt: inputData.marketValueDebt,
      waccResult: result.wacc,
      calculationTime,
      inputMethod: inputData.inputMethod || 'manual'
    });
  }

  trackExcelIntegration(action, success, details = {}) {
    this.trackEvent('excel_integration', {
      action,
      success,
      ...details
    });
  }

  trackPerformanceMetric(metricName, value, unit = 'ms') {
    this.trackEvent('performance_metric', {
      metric: metricName,
      value,
      unit
    });
  }

  async sendToAnalytics(event) {
    try {
      // In production, this would send to your analytics service
      // For now, we'll just log to console and potentially send to Vercel
      
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        }).catch(err => {
          console.warn('Failed to send analytics:', err);
        });
      }
    } catch (error) {
      console.warn('Analytics error:', error);
    }
  }

  getSessionSummary() {
    const sessionDuration = Date.now() - this.startTime;
    const eventCounts = this.events.reduce((acc, event) => {
      acc[event.name] = (acc[event.name] || 0) + 1;
      return acc;
    }, {});

    return {
      sessionId: this.sessionId,
      duration: sessionDuration,
      eventCounts,
      totalEvents: this.events.length
    };
  }

  // Performance monitoring specific to WACC Calculator
  startWACCCalculationTimer() {
    this.calculationStartTime = performance.now();
  }

  endWACCCalculationTimer(inputData, result) {
    if (this.calculationStartTime) {
      const calculationTime = performance.now() - this.calculationStartTime;
      this.trackWACCCalculation(inputData, result, calculationTime);
      this.calculationStartTime = null;
    }
  }

  // Excel integration monitoring
  trackExcelRead(success, rowsRead, timeMs) {
    this.trackExcelIntegration('read', success, { rowsRead, timeMs });
  }

  trackExcelWrite(success, rowsWritten, timeMs) {
    this.trackExcelIntegration('write', success, { rowsWritten, timeMs });
  }

  // Office Add-in specific events
  trackOfficeReady() {
    this.trackEvent('office_ready', {
      host: Office?.context?.host || 'unknown',
      platform: Office?.context?.platform || 'unknown'
    });
  }

  trackTaskPaneOpen() {
    this.trackEvent('taskpane_open');
  }

  trackTaskPaneClose() {
    this.trackEvent('taskpane_close');
  }
}

// Initialize global analytics instance
let waccAnalytics = null;

if (typeof window !== 'undefined') {
  waccAnalytics = new WACCAnalytics();
  window.waccAnalytics = waccAnalytics;
}

export default waccAnalytics;
export { WACCAnalytics };