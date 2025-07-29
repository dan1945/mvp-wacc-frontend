/**
 * WACC Calculation Performance Tests
 * Validates calculation performance meets sub-2 second requirements
 */

import { WACCCalculationEngine, WACCInputData } from '../../src/services/WACCCalculationEngine';
import { performanceMonitor } from '../../src/services/PerformanceMonitor';

describe('WACC Calculation Performance', () => {
  let engine: WACCCalculationEngine;
  let inputData: WACCInputData;

  beforeAll(() => {
    // Start performance monitoring for tests
    performanceMonitor.startMonitoring();
  });

  afterAll(() => {
    performanceMonitor.stopMonitoring();
  });

  beforeEach(() => {
    engine = new WACCCalculationEngine();
    inputData = global.testUtils.createMockWACCData();
  });

  describe('Calculation Speed Requirements', () => {
    test('should calculate WACC in under 100ms for standard input', async () => {
      const executionTime = await performanceTestUtils.measureTime(async () => {
        await engine.calculateWACC(inputData);
      });

      expect(executionTime).toBeFasterThan(performanceTestUtils.thresholds.calculation);
    });

    test('should handle large build-up models efficiently', async () => {
      // Create larger input data set
      const largeInputData = {
        ...inputData,
        buildUpModel: Array.from({ length: 20 }, (_, i) => ({
          name: `Component ${i + 1}`,
          value: Math.random() * 10
        }))
      };

      const executionTime = await performanceTestUtils.measureTime(async () => {
        await engine.calculateWACC(largeInputData);
      });

      // Should still be fast even with more complex data
      expect(executionTime).toBeFasterThan(200); // 200ms threshold for complex calculations
    });

    test('should maintain performance under repeated calculations', async () => {
      const iterations = 100;
      const executionTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const time = await performanceTestUtils.measureTime(async () => {
          await engine.calculateWACC(inputData);
        });
        executionTimes.push(time);
      }

      const averageTime = executionTimes.reduce((sum, time) => sum + time, 0) / iterations;
      const maxTime = Math.max(...executionTimes);

      expect(averageTime).toBeFasterThan(performanceTestUtils.thresholds.calculation);
      expect(maxTime).toBeFasterThan(performanceTestUtils.thresholds.calculation * 3); // Allow some variance
    });

    test('should handle concurrent calculations efficiently', async () => {
      const concurrentCalculations = 10;
      const promises = Array.from({ length: concurrentCalculations }, () =>
        performanceTestUtils.measureTime(async () => {
          await engine.calculateWACC(inputData);
        })
      );

      const executionTimes = await Promise.all(promises);
      const averageTime = executionTimes.reduce((sum, time) => sum + time, 0) / concurrentCalculations;

      expect(averageTime).toBeFasterThan(performanceTestUtils.thresholds.calculation * 2); // Allow some overhead for concurrency
    });
  });

  describe('Memory Performance', () => {
    test('should not cause memory leaks during repeated calculations', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Perform many calculations
      for (let i = 0; i < 1000; i++) {
        await engine.calculateWACC(inputData);
        
        // Force garbage collection periodically
        if (i % 100 === 0 && global.gc) {
          global.gc();
        }
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    test('should handle large datasets without excessive memory usage', async () => {
      const largeInputData = {
        ...inputData,
        buildUpModel: Array.from({ length: 1000 }, (_, i) => ({
          name: `Component ${i + 1}`,
          value: Math.random() * 10
        })),
        costOfDebtCalculations: Array.from({ length: 100 }, (_, i) => ({
          name: `Debt Component ${i + 1}`,
          value: Math.random() * 1000000
        }))
      };

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      await engine.calculateWACC(largeInputData);
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryUsed = finalMemory - initialMemory;

      // Should handle large datasets without excessive memory usage (less than 50MB)
      expect(memoryUsed).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Performance Monitoring Integration', () => {
    test('should record performance metrics', async () => {
      const metricsSpy = jest.spyOn(performanceMonitor, 'recordMetric');
      
      await engine.calculateWACC(inputData);
      
      expect(metricsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.stringContaining('calculation'),
          value: expect.any(Number),
          timestamp: expect.any(Number)
        })
      );
    });

    test('should provide detailed performance breakdown', async () => {
      const result = await engine.calculateWACC(inputData);
      
      expect(result.performanceMetrics).toBeDefined();
      expect(result.performanceMetrics?.calculationTime).toBeGreaterThan(0);
      expect(result.performanceMetrics?.calculationTime).toBeFasterThan(performanceTestUtils.thresholds.calculation);
    });

    test('should track validation performance separately', async () => {
      const startTime = performance.now();
      
      // Test with invalid data to trigger validation
      const invalidData = {
        ...inputData,
        buildUpModel: [{ name: 'Invalid', value: -1 }] // Negative value should trigger validation
      };

      try {
        await engine.calculateWACC(invalidData);
      } catch (error) {
        // Expected to fail
      }

      const validationTime = performance.now() - startTime;
      
      // Validation should be fast
      expect(validationTime).toBeFasterThan(50);
    });
  });

  describe('Performance Regression Detection', () => {
    test('should maintain calculation accuracy under performance pressure', async () => {
      // Run calculation under simulated load
      const promises = Array.from({ length: 50 }, async () => {
        return await engine.calculateWACC(inputData);
      });

      const results = await Promise.all(promises);
      
      // All results should be identical (accurate)
      const firstResult = results[0];
      results.forEach(result => {
        expect(result.weightedAverageCostOfCapital).toBeCloseTo(firstResult.weightedAverageCostOfCapital, 10);
        expect(result.costOfEquity).toBeCloseTo(firstResult.costOfEquity, 10);
        expect(result.costOfDebt).toBeCloseTo(firstResult.costOfDebt, 10);
      });
    });

    test('should perform consistently across different input sizes', async () => {
      const inputSizes = [1, 5, 10, 20, 50];
      const performanceResults: { size: number; time: number }[] = [];

      for (const size of inputSizes) {
        const testInput = {
          ...inputData,
          buildUpModel: Array.from({ length: size }, (_, i) => ({
            name: `Component ${i + 1}`,
            value: Math.random() * 10
          }))
        };

        const executionTime = await performanceTestUtils.measureTime(async () => {
          await engine.calculateWACC(testInput);
        });

        performanceResults.push({ size, time: executionTime });
      }

      // Performance should scale linearly or sub-linearly
      const timeIncrease = performanceResults[performanceResults.length - 1].time - performanceResults[0].time;
      const sizeIncrease = inputSizes[inputSizes.length - 1] - inputSizes[0];
      
      // Time should not increase more than proportionally to size
      expect(timeIncrease / sizeIncrease).toBeLessThan(5); // Max 5ms per additional component
    });
  });

  describe('Caching Performance', () => {
    test('should show performance improvement with caching', async () => {
      // First calculation (cache miss)
      const firstCalculationTime = await performanceTestUtils.measureTime(async () => {
        await engine.calculateWACC(inputData);
      });

      // Second calculation with same data (cache hit)
      const secondCalculationTime = await performanceTestUtils.measureTime(async () => {
        await engine.calculateWACC(inputData);
      });

      // Cached calculation should be faster
      expect(secondCalculationTime).toBeFasterThan(firstCalculationTime);
    });

    test('should maintain cache performance under load', async () => {
      // Warm up cache
      await engine.calculateWACC(inputData);

      // Test multiple cached calculations
      const cachedCalculations = Array.from({ length: 100 }, () =>
        performanceTestUtils.measureTime(async () => {
          await engine.calculateWACC(inputData);
        })
      );

      const cachedTimes = await Promise.all(cachedCalculations);
      const averageCachedTime = cachedTimes.reduce((sum, time) => sum + time, 0) / cachedTimes.length;

      // Cached calculations should be consistently fast
      expect(averageCachedTime).toBeFasterThan(10); // Very fast for cached results
    });
  });
});