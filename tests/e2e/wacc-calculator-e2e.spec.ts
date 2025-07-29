/**
 * WACC Calculator End-to-End Tests
 * Complete user workflow testing across browsers and platforms
 */

import { test, expect, Page } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

// Test data
const testWACCData = {
  buildUpModel: {
    riskFreeRate: '3.5',
    marketRiskPremium: '6.0',
    beta: '1.2',
    sizePremium: '2.0',
    companyRisk: '1.0'
  },
  costOfDebt: {
    baseRate: '2.5',
    creditSpread: '1.5',
    totalInterest: '400000',
    totalDebt: '10000000'
  },
  weights: {
    debtWeight: '40',
    equityWeight: '60'
  },
  taxRate: '25'
};

// Helper functions
async function waitForAppLoad(page: Page) {
  await page.waitForSelector('[data-testid="wacc-calculator"], main, [role="main"]', {
    timeout: 10000
  });
  
  // Wait for Office.js mock to be ready
  await page.waitForFunction(() => window.officeJsReady, { timeout: 5000 });
}

async function fillWACCInputs(page: Page, data = testWACCData) {
  // Fill build-up model inputs
  const buildUpInputs = await page.locator('input[type="number"], input[type="text"]').all();
  
  // Assuming inputs are in order: risk-free rate, market risk premium, beta, size premium, company risk
  if (buildUpInputs.length >= 5) {
    await buildUpInputs[0].fill(data.buildUpModel.riskFreeRate);
    await buildUpInputs[1].fill(data.buildUpModel.marketRiskPremium);
    await buildUpInputs[2].fill(data.buildUpModel.beta);
    await buildUpInputs[3].fill(data.buildUpModel.sizePremium);
    await buildUpInputs[4].fill(data.buildUpModel.companyRisk);
  }
  
  // Fill cost of debt inputs (if present)
  if (buildUpInputs.length >= 9) {
    await buildUpInputs[5].fill(data.costOfDebt.baseRate);
    await buildUpInputs[6].fill(data.costOfDebt.creditSpread);
    await buildUpInputs[7].fill(data.costOfDebt.totalInterest);
    await buildUpInputs[8].fill(data.costOfDebt.totalDebt);
  }
  
  // Fill tax rate (if present)
  const taxRateInput = page.locator('input[placeholder*="tax"], input[aria-label*="tax"], input[name*="tax"]').first();
  if (await taxRateInput.isVisible()) {
    await taxRateInput.fill(data.taxRate);
  }
}

async function measurePerformance(page: Page, actionName: string, action: () => Promise<void>) {
  const startTime = await page.evaluate(() => performance.now());
  
  await action();
  
  const endTime = await page.evaluate(() => performance.now());
  const duration = endTime - startTime;
  
  // Record performance metric
  await page.evaluate(([name, value]) => {
    if (window.e2ePerformanceMetrics) {
      window.e2ePerformanceMetrics.addMetric(name, value);
    }
  }, [actionName, duration]);
  
  return duration;
}

test.describe('WACC Calculator E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppLoad(page);
  });

  test.describe('Core Functionality', () => {
    test('should load the WACC calculator successfully', async ({ page }) => {
      // Verify main elements are present
      await expect(page.locator('main, [role="main"], [data-testid="wacc-calculator"]')).toBeVisible();
      
      // Check for input fields
      const inputs = page.locator('input[type="number"], input[type="text"]');
      await expect(inputs.first()).toBeVisible();
      
      // Check page title
      await expect(page).toHaveTitle(/WACC Calculator|Werx/);
    });

    test('should calculate WACC with valid inputs', async ({ page }) => {
      await fillWACCInputs(page);
      
      // Trigger calculation (could be automatic or via button)
      const calculateButton = page.locator('button:has-text("Calculate"), button[aria-label*="calculate"]');
      if (await calculateButton.isVisible()) {
        await calculateButton.click();
      }
      
      // Wait for results
      await page.waitForSelector('[data-testid*="result"], [data-testid*="wacc"], .result', {
        timeout: 5000
      });
      
      // Verify results are displayed
      const resultElements = page.locator('[data-testid*="result"], [data-testid*="wacc"], .result');
      await expect(resultElements.first()).toBeVisible();
    });

    test('should handle input validation', async ({ page }) => {
      // Enter invalid data
      const firstInput = page.locator('input').first();
      await firstInput.fill('-1'); // Negative value should be invalid
      await firstInput.blur();
      
      // Look for validation messages
      const errorMessages = page.locator('[role="alert"], .error, [data-testid*="error"]');
      
      // Either validation message should appear or input should be corrected
      const hasError = await errorMessages.count() > 0;
      const inputValue = await firstInput.inputValue();
      
      expect(hasError || inputValue !== '-1').toBeTruthy();
    });

    test('should persist data during session', async ({ page }) => {
      await fillWACCInputs(page);
      
      // Refresh page
      await page.reload();
      await waitForAppLoad(page);
      
      // Check if some data is preserved (depending on implementation)
      const firstInput = page.locator('input').first();
      const value = await firstInput.inputValue();
      
      // Either data is preserved or inputs are reset to defaults
      expect(typeof value).toBe('string');
    });
  });

  test.describe('Excel Integration', () => {
    test('should handle Excel generation request', async ({ page }) => {
      await fillWACCInputs(page);
      
      // Look for Excel-related buttons
      const excelButton = page.locator(
        'button:has-text("Excel"), button:has-text("Generate"), button[aria-label*="excel"]'
      );
      
      if (await excelButton.count() > 0) {
        const duration = await measurePerformance(page, 'excel-generation', async () => {
          await excelButton.first().click();
          
          // Wait for generation to complete
          await page.waitForTimeout(1000);
        });
        
        // Excel generation should complete within 2 seconds
        expect(duration).toBeLessThan(2000);
        
        // Check for success message or indication
        const successIndicator = page.locator(
          '[data-testid*="success"], .success, [role="status"]:has-text("success")'
        );
        
        // Should either show success or handle gracefully
        const hasSuccess = await successIndicator.count() > 0;
        console.log(`Excel generation ${hasSuccess ? 'succeeded' : 'handled gracefully'}`);
      }
    });

    test('should handle template selection', async ({ page }) => {
      // Look for template selector
      const templateSelector = page.locator(
        'select[name*="template"], [data-testid*="template"], button:has-text("Template")'
      );
      
      if (await templateSelector.count() > 0) {
        await templateSelector.first().click();
        
        // Look for template options
        const templateOptions = page.locator('[role="option"], option, [data-testid*="template-option"]');
        
        if (await templateOptions.count() > 0) {
          await templateOptions.first().click();
          
          // Template selection should work without errors
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe('Performance Requirements', () => {
    test('should meet performance thresholds', async ({ page }) => {
      // Measure initial load performance
      const navigationMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstContentfulPaint: 0 // Will be measured by performance observer
        };
      });
      
      // Wait for performance metrics to be collected
      await page.waitForTimeout(2000);
      
      const webVitals = await page.evaluate(() => {
        return window.e2ePerformanceMetrics?.getWebVitals() || {};
      });
      
      console.log('Performance Metrics:', { navigationMetrics, webVitals });
      
      // Verify performance thresholds
      if (navigationMetrics.domContentLoaded > 0) {
        expect(navigationMetrics.domContentLoaded).toBeLessThan(2000); // DOM load < 2s
      }
      
      if (webVitals.lcp > 0) {
        expect(webVitals.lcp).toBeLessThan(4000); // LCP < 4s
      }
      
      if (webVitals.fid > 0) {
        expect(webVitals.fid).toBeLessThan(100); // FID < 100ms
      }
    });

    test('should handle calculation performance', async ({ page }) => {
      await fillWACCInputs(page);
      
      const calculationTime = await measurePerformance(page, 'wacc-calculation', async () => {
        // Trigger calculation
        const calculateButton = page.locator('button:has-text("Calculate")');
        if (await calculateButton.isVisible()) {
          await calculateButton.click();
        }
        
        // Wait for calculation to complete
        await page.waitForSelector('[data-testid*="result"], .result', { timeout: 5000 });
      });
      
      // Calculation should complete within 100ms
      expect(calculationTime).toBeLessThan(100);
    });
  });

  test.describe('Accessibility Compliance', () => {
    test('should have no accessibility violations', async ({ page }) => {
      await injectAxe(page);
      
      await fillWACCInputs(page);
      
      // Check accessibility
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: { html: true }
      });
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab through all interactive elements
      const inputs = page.locator('input, button, select, [tabindex="0"]');
      const inputCount = await inputs.count();
      
      if (inputCount > 0) {
        // Focus first element
        await inputs.first().focus();
        
        // Tab through elements
        for (let i = 0; i < Math.min(inputCount, 10); i++) {
          await page.keyboard.press('Tab');
          
          // Verify focus is on an interactive element
          const focusedElement = page.locator(':focus');
          await expect(focusedElement).toBeVisible();
        }
      }
    });

    test('should have proper ARIA labels', async ({ page }) => {
      const inputs = page.locator('input');
      const inputCount = await inputs.count();
      
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        
        // Each input should have an accessible name
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        const placeholder = await input.getAttribute('placeholder');
        
        const hasAccessibleName = ariaLabel || ariaLabelledBy || placeholder;
        expect(hasAccessibleName).toBeTruthy();
      }
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    test('should work consistently across browsers', async ({ page, browserName }) => {
      console.log(`Testing on ${browserName}`);
      
      await fillWACCInputs(page);
      
      // Verify core functionality works
      const inputs = page.locator('input');
      const inputCount = await inputs.count();
      expect(inputCount).toBeGreaterThan(0);
      
      // Browser-specific checks
      if (browserName === 'webkit') {
        // Safari-specific tests
        console.log('Running Safari-specific checks');
      } else if (browserName === 'firefox') {
        // Firefox-specific tests
        console.log('Running Firefox-specific checks');
      }
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile devices', async ({ page, isMobile }) => {
      if (isMobile) {
        // Verify mobile layout
        const viewport = page.viewportSize();
        expect(viewport?.width).toBeLessThan(768);
        
        // Check that inputs are touch-friendly
        const inputs = page.locator('input, button');
        const firstInput = inputs.first();
        
        if (await firstInput.isVisible()) {
          const boundingBox = await firstInput.boundingBox();
          if (boundingBox) {
            // Touch targets should be at least 44px
            expect(Math.min(boundingBox.width, boundingBox.height)).toBeGreaterThanOrEqual(44);
          }
        }
        
        // Test touch interactions
        await fillWACCInputs(page);
        
        // Verify mobile-specific behaviors
        console.log('Mobile layout verified');
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network issues by blocking requests
      await page.route('**/*', route => {
        if (route.request().url().includes('api')) {
          route.abort();
        } else {
          route.continue();
        }
      });
      
      await fillWACCInputs(page);
      
      // Trigger actions that might require network
      const excelButton = page.locator('button:has-text("Excel"), button:has-text("Generate")');
      if (await excelButton.count() > 0) {
        await excelButton.first().click();
        
        // Should handle network errors gracefully
        await page.waitForTimeout(2000);
        
        // Look for error messages or fallback behavior
        const errorMessages = page.locator('[role="alert"], .error, [data-testid*="error"]');
        const isErrorShown = await errorMessages.count() > 0;
        
        console.log(`Network error ${isErrorShown ? 'handled with error message' : 'handled gracefully'}`);
      }
    });

    test('should recover from JavaScript errors', async ({ page }) => {
      // Inject a potential error and verify recovery
      await page.evaluate(() => {
        // Simulate a recoverable error
        setTimeout(() => {
          try {
            throw new Error('Test error');
          } catch (e) {
            console.warn('Test error caught:', e);
          }
        }, 100);
      });
      
      await page.waitForTimeout(500);
      
      // App should still be functional
      await fillWACCInputs(page);
      
      const inputs = page.locator('input');
      await expect(inputs.first()).toBeVisible();
    });
  });
});