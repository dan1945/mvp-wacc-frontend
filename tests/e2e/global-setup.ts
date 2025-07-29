/**
 * Playwright Global Setup
 * Initializes testing environment and Office.js simulation
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting WACC Calculator E2E Test Setup...');
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Navigate to the application
    await page.goto(config.webServer?.url || 'http://localhost:3000');
    
    // Wait for the application to load
    await page.waitForSelector('[data-testid="wacc-calculator"], [data-testid="app-root"], main', {
      timeout: 30000
    });
    
    // Inject Office.js mock for testing
    await page.addScriptTag({
      content: `
        // Mock Office.js for E2E testing
        window.Office = {
          context: {
            host: 'Excel',
            platform: 'PC',
            requirements: {
              isSetSupported: () => true
            },
            diagnostics: {
              version: '16.0.0'
            }
          },
          onReady: () => Promise.resolve(),
          PlatformType: {
            PC: 'PC',
            Mac: 'Mac',
            OfficeOnline: 'OfficeOnline',
            iOS: 'iOS',
            Android: 'Android'
          }
        };
        
        window.Excel = {
          run: async (callback) => {
            const mockContext = {
              workbook: {
                worksheets: {
                  getItemOrNullObject: () => ({ isNullObject: true }),
                  add: () => ({
                    getRange: () => ({
                      values: [],
                      format: {
                        font: {},
                        borders: { getItem: () => ({}) }
                      }
                    }),
                    activate: () => {}
                  })
                }
              },
              sync: () => Promise.resolve()
            };
            return await callback(mockContext);
          }
        };
        
        // Signal that Office.js is ready
        window.officeJsReady = true;
      `
    });
    
    // Wait for Office.js mock to be ready
    await page.waitForFunction(() => window.officeJsReady);
    
    console.log('✅ Office.js simulation initialized');
    
    // Verify application is functional
    const isAppLoaded = await page.evaluate(() => {
      return document.querySelector('[data-testid="wacc-calculator"], main, [role="main"]') !== null;
    });
    
    if (!isAppLoaded) {
      throw new Error('Application failed to load properly');
    }
    
    console.log('✅ WACC Calculator application loaded successfully');
    
    // Set up performance monitoring
    await page.addScriptTag({
      content: `
        // Enhanced performance tracking for E2E tests
        window.e2ePerformanceMetrics = {
          navigationStart: performance.timing?.navigationStart || performance.now(),
          metrics: [],
          addMetric: function(name, value, metadata = {}) {
            this.metrics.push({
              name,
              value,
              metadata,
              timestamp: performance.now()
            });
          },
          getMetrics: function() {
            return this.metrics;
          },
          getWebVitals: function() {
            return {
              fcp: this.metrics.find(m => m.name === 'first-contentful-paint')?.value || 0,
              lcp: this.metrics.find(m => m.name === 'largest-contentful-paint')?.value || 0,
              fid: this.metrics.find(m => m.name === 'first-input-delay')?.value || 0,
              cls: this.metrics.find(m => m.name === 'cumulative-layout-shift')?.value || 0
            };
          }
        };
        
        // Observe Web Vitals
        if (typeof PerformanceObserver !== 'undefined') {
          const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
              if (entry.entryType === 'largest-contentful-paint') {
                window.e2ePerformanceMetrics.addMetric('largest-contentful-paint', entry.startTime);
              }
              if (entry.entryType === 'first-input') {
                window.e2ePerformanceMetrics.addMetric('first-input-delay', entry.processingStart - entry.startTime);
              }
              if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
                window.e2ePerformanceMetrics.addMetric('cumulative-layout-shift', entry.value);
              }
            });
          });
          
          try {
            observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
          } catch (e) {
            console.warn('Some performance observers not supported:', e.message);
          }
        }
      `
    });
    
    console.log('✅ Performance monitoring initialized');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('🎉 E2E Test Setup Complete!');
}

export default globalSetup;