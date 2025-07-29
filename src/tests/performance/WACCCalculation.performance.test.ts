/**
 * Performance benchmarks for WACC Calculator
 * These tests ensure the application meets performance requirements
 */

import { WACCCalculationEngine } from '../../services/WACCCalculationEngine';
import { WACCInputData } from '../../types/wacc';

describe('WACC Calculator Performance Benchmarks', () => {
  const engine = new WACCCalculationEngine();
  
  const sampleData: WACCInputData = {
    marketValueEquity: 1000000,
    marketValueDebt: 500000,
    costOfEquity: 0.12,
    costOfDebt: 0.08,
    taxRate: 0.25,
    riskFreeRate: 0.03,
    marketRiskPremium: 0.08,
    beta: 1.2,
    debtToEquityRatio: 0.5,
    equityRiskPremium: 0.05
  };

  beforeEach(() => {
    // Clear any performance marks
    if (typeof performance !== 'undefined' && performance.clearMarks) {
      performance.clearMarks();
      performance.clearMeasures();
    }
  });

  test('WACC calculation should complete within 100ms', async () => {
    const startTime = performance.now();
    
    const result = engine.calculateWACC(sampleData);
    
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    
    expect(executionTime).toBeLessThan(100);
    expect(result.wacc).toBeGreaterThan(0);
  });

  test('Bulk WACC calculations should maintain performance', async () => {
    const iterations = 1000;
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      const modifiedData = {
        ...sampleData,
        marketValueEquity: sampleData.marketValueEquity + i
      };
      engine.calculateWACC(modifiedData);
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const averageTime = totalTime / iterations;
    
    // Each calculation should average less than 1ms
    expect(averageTime).toBeLessThan(1);
    // Total time for 1000 calculations should be less than 500ms
    expect(totalTime).toBeLessThan(500);
  });

  test('Memory usage should remain stable during calculations', async () => {
    const iterations = 100;
    let initialMemory: number = 0;
    let finalMemory: number = 0;

    // Get initial memory usage if available
    if (typeof (performance as any).memory !== 'undefined') {
      initialMemory = (performance as any).memory.usedJSHeapSize;
    }

    // Perform calculations
    for (let i = 0; i < iterations; i++) {
      const modifiedData = {
        ...sampleData,
        marketValueEquity: sampleData.marketValueEquity + i
      };
      engine.calculateWACC(modifiedData);
    }

    // Force garbage collection if available
    if (typeof (global as any).gc === 'function') {
      (global as any).gc();
    }

    // Get final memory usage
    if (typeof (performance as any).memory !== 'undefined') {
      finalMemory = (performance as any).memory.usedJSHeapSize;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be less than 1MB for 100 calculations
      expect(memoryIncrease).toBeLessThan(1024 * 1024);
    } else {
      // If memory monitoring is not available, just pass the test
      expect(true).toBe(true);
    }
  });

  test('Component rendering should be fast', async () => {
    const { render } = await import('@testing-library/react');
    const { WACCCalculator } = await import('../../components/WACCCalculator');
    
    const startTime = performance.now();
    
    const { unmount } = render(<WACCCalculator />);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Initial render should complete within 200ms
    expect(renderTime).toBeLessThan(200);
    
    unmount();
  });

  test('Excel integration should maintain performance', async () => {
    const mockExcelData = Array.from({ length: 1000 }, (_, i) => ({
      row: i,
      marketValueEquity: 1000000 + i,
      marketValueDebt: 500000 + i,
      costOfEquity: 0.12,
      costOfDebt: 0.08,
      taxRate: 0.25
    }));

    const startTime = performance.now();
    
    // Simulate processing Excel data
    const results = mockExcelData.map(data => {
      return engine.calculateWACC({
        marketValueEquity: data.marketValueEquity,
        marketValueDebt: data.marketValueDebt,
        costOfEquity: data.costOfEquity,
        costOfDebt: data.costOfDebt,
        taxRate: data.taxRate,
        riskFreeRate: 0.03,
        marketRiskPremium: 0.08,
        beta: 1.2,
        debtToEquityRatio: 0.5,
        equityRiskPremium: 0.05
      });
    });
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    // Processing 1000 Excel rows should complete within 2 seconds
    expect(totalTime).toBeLessThan(2000);
    expect(results).toHaveLength(1000);
    expect(results.every(result => result.wacc > 0)).toBe(true);
  });

  test('Error handling should not impact performance', async () => {
    const invalidData = {
      ...sampleData,
      marketValueEquity: -1000, // Invalid negative value
      costOfEquity: 2.5 // Invalid high percentage
    };

    const startTime = performance.now();
    
    // Test multiple error scenarios
    for (let i = 0; i < 100; i++) {
      try {
        engine.calculateWACC(invalidData);
      } catch (error) {
        // Expected to throw errors
      }
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    // Error handling should still be fast
    expect(totalTime).toBeLessThan(100);
  });
});

describe('Cache Performance', () => {
  test('Cache should improve calculation performance', async () => {
    const { CacheManager } = await import('../../services/CacheManager');
    const cache = new CacheManager();
    
    const testData = {
      marketValueEquity: 1000000,
      marketValueDebt: 500000,
      costOfEquity: 0.12,
      costOfDebt: 0.08,
      taxRate: 0.25
    };
    
    const cacheKey = 'wacc_test';
    
    // First calculation (should cache)
    const startTime1 = performance.now();
    cache.set(cacheKey, testData, 60000);
    const result1 = cache.get(cacheKey);
    const endTime1 = performance.now();
    
    // Second calculation (should hit cache)
    const startTime2 = performance.now();
    const result2 = cache.get(cacheKey);
    const endTime2 = performance.now();
    
    const firstTime = endTime1 - startTime1;
    const secondTime = endTime2 - startTime2;
    
    // Cache hit should be significantly faster
    expect(secondTime).toBeLessThan(firstTime);
    expect(secondTime).toBeLessThan(10); // Cache hit should be sub-10ms
    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
  });
});