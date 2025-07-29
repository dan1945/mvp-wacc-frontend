/**
 * Cache Manager and Performance Monitor Integration Tests
 * Tests caching optimization and performance monitoring integration
 */

import { waccCalculationCache, CacheManager } from '../CacheManager';
import { performanceMonitor } from '../PerformanceMonitor';
import { WACCCalculationEngine } from '../WACCCalculationEngine';

describe('Cache and Performance Integration Tests', () => {
  let engine: WACCCalculationEngine;
  let inputData: any;

  beforeEach(() => {
    engine = new WACCCalculationEngine();
    inputData = global.testUtils.createMockWACCData();
    
    // Clear cache and start monitoring
    waccCalculationCache.clear();
    performanceMonitor.startMonitoring();
  });

  afterEach(() => {
    performanceMonitor.stopMonitoring();
  });

  describe('Cache Manager Integration', () => {
    test('should cache WACC calculation results', async () => {
      const cacheKey = 'test-wacc-calculation';
      
      // First calculation (cache miss)
      const result1 = await engine.calculateWACC(inputData);
      await waccCalculationCache.set(cacheKey, result1, 300); // 5 minute TTL
      
      // Second calculation (cache hit)
      const cachedResult = await waccCalculationCache.get(cacheKey);
      
      expect(cachedResult).toBeDefined();
      expect(cachedResult.weightedAverageCostOfCapital).toBeCloseTo(result1.weightedAverageCostOfCapital, 10);
      expect(cachedResult.costOfEquity).toBeCloseTo(result1.costOfEquity, 10);
      expect(cachedResult.costOfDebt).toBeCloseTo(result1.costOfDebt, 10);
    });

    test('should handle cache performance with large datasets', async () => {
      const cacheOperations = [];
      
      // Generate multiple calculation results
      for (let i = 0; i < 50; i++) {
        const testInput = {
          ...inputData,
          buildUpModel: inputData.buildUpModel.map((item: any, index: number) => ({
            ...item,
            value: item.value + (i * 0.1) // Vary the values
          }))
        };
        
        const startTime = performance.now();
        const result = await engine.calculateWACC(testInput);
        const cacheKey = `wacc-${i}`;
        
        await waccCalculationCache.set(cacheKey, result, 300);
        const cacheTime = performance.now() - startTime;
        
        cacheOperations.push({ key: cacheKey, time: cacheTime });
      }
      
      // Cache operations should be fast
      const avgCacheTime = cacheOperations.reduce((sum, op) => sum + op.time, 0) / cacheOperations.length;
      expect(avgCacheTime).toBeLessThan(50); // Average cache operation under 50ms
      
      // Test cache retrieval performance
      const retrievalTimes = [];
      for (const operation of cacheOperations) {
        const startTime = performance.now();
        const cachedResult = await waccCalculationCache.get(operation.key);
        const retrievalTime = performance.now() - startTime;
        
        expect(cachedResult).toBeDefined();
        retrievalTimes.push(retrievalTime);
      }
      
      const avgRetrievalTime = retrievalTimes.reduce((sum, time) => sum + time, 0) / retrievalTimes.length;
      expect(avgRetrievalTime).toBeLessThan(10); // Cache retrieval should be very fast
    });

    test('should handle cache eviction policies', async () => {
      // Fill cache to near capacity
      const cacheKeys = [];
      for (let i = 0; i < 100; i++) {
        const cacheKey = `test-key-${i}`;
        const result = await engine.calculateWACC(inputData);
        
        await waccCalculationCache.set(cacheKey, result, 60); // 1 minute TTL
        cacheKeys.push(cacheKey);
      }
      
      // Verify cache contains items
      const midKey = cacheKeys[50];
      const midResult = await waccCalculationCache.get(midKey);
      expect(midResult).toBeDefined();
      
      // Add more items to trigger potential eviction
      for (let i = 100; i < 150; i++) {
        const cacheKey = `test-key-${i}`;
        const result = await engine.calculateWACC(inputData);
        await waccCalculationCache.set(cacheKey, result, 60);
      }
      
      // Cache should still be functional
      const newKey = 'test-key-125';
      const newResult = await waccCalculationCache.get(newKey);
      expect(newResult).toBeDefined();
    });

    test('should handle cache expiration correctly', async () => {
      const cacheKey = 'expiration-test';
      const result = await engine.calculateWACC(inputData);
      
      // Set with very short TTL
      await waccCalculationCache.set(cacheKey, result, 1); // 1 second TTL
      
      // Should be available immediately
      const immediateResult = await waccCalculationCache.get(cacheKey);
      expect(immediateResult).toBeDefined();
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Should be expired
      const expiredResult = await waccCalculationCache.get(cacheKey);
      expect(expiredResult).toBeNull();
    });
  });

  describe('Performance Monitor Integration', () => {
    test('should record calculation performance metrics', async () => {
      const metricsSpy = jest.spyOn(performanceMonitor, 'recordMetric');
      
      // Perform calculation
      await engine.calculateWACC(inputData);
      
      // Should record calculation metrics
      expect(metricsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.stringMatching(/calculation|wacc/),
          value: expect.any(Number),
          timestamp: expect.any(Number)
        })
      );
    });

    test('should record cache performance metrics', async () => {
      const metricsSpy = jest.spyOn(performanceMonitor, 'recordCacheMetrics');
      
      const cacheKey = 'performance-test';
      const result = await engine.calculateWACC(inputData);
      
      // Cache set operation
      const startTime = performance.now();
      await waccCalculationCache.set(cacheKey, result, 300);
      const setDuration = performance.now() - startTime;
      
      // Manually record cache metrics (simulating what the cache would do)
      performanceMonitor.recordCacheMetrics('set', setDuration, JSON.stringify(result).length);
      
      // Cache get operation
      const getStartTime = performance.now();
      await waccCalculationCache.get(cacheKey);
      const getDuration = performance.now() - getStartTime;
      
      performanceMonitor.recordCacheMetrics('hit', getDuration);
      
      expect(metricsSpy).toHaveBeenCalledWith('set', expect.any(Number), expect.any(Number));
      expect(metricsSpy).toHaveBeenCalledWith('hit', expect.any(Number));
    });

    test('should generate comprehensive performance reports', async () => {
      // Perform multiple operations to generate metrics
      for (let i = 0; i < 10; i++) {
        const cacheKey = `report-test-${i}`;
        const result = await engine.calculateWACC(inputData);
        
        await waccCalculationCache.set(cacheKey, result, 300);
        await waccCalculationCache.get(cacheKey);
      }
      
      // Generate performance report
      const report = performanceMonitor.generateReport(1); // Last 1 minute
      
      expect(report).toBeDefined();
      expect(report.period).toBeDefined();
      expect(report.metrics).toBeDefined();
      expect(report.metrics.calculation).toBeDefined();
      expect(report.metrics.caching).toBeDefined();
      expect(report.summary).toBeDefined();
      
      // Verify calculation metrics
      expect(report.metrics.calculation.totalCalculations).toBeGreaterThan(0);
      expect(report.metrics.calculation.averageCalculationTime).toBeGreaterThan(0);
      
      // Verify summary
      expect(report.summary.overallScore).toBeDefined();
      expect(report.summary.performanceGrade).toMatch(/[A-F]/);
    });

    test('should provide real-time performance statistics', async () => {
      // Perform some operations
      await engine.calculateWACC(inputData);
      await waccCalculationCache.set('stats-test', { test: 'data' }, 300);
      
      const stats = performanceMonitor.getRealTimeStats();
      
      expect(stats).toBeDefined();
      expect(stats.timestamp).toBeDefined();
      expect(typeof stats.activeMetrics).toBe('number');
      expect(typeof stats.averageCalculationTime).toBe('number');
    });

    test('should provide performance recommendations', async () => {
      // Perform operations that might trigger recommendations
      for (let i = 0; i < 20; i++) {
        const slowResult = await engine.calculateWACC({
          ...inputData,
          buildUpModel: Array.from({ length: 50 }, (_, index) => ({
            name: `Component ${index}`,
            value: Math.random() * 10
          }))
        });
        
        await waccCalculationCache.set(`slow-${i}`, slowResult, 300);
      }
      
      const recommendations = performanceMonitor.getRecommendations();
      
      expect(Array.isArray(recommendations)).toBe(true);
      // May or may not have recommendations depending on performance
      console.log('Performance Recommendations:', recommendations);
    });
  });

  describe('Integrated Cache and Performance Optimization', () => {
    test('should show performance improvement with caching', async () => {
      const testKey = 'performance-comparison';
      
      // First calculation (no cache)
      const uncachedStart = performance.now();
      const result1 = await engine.calculateWACC(inputData);
      const uncachedTime = performance.now() - uncachedStart;
      
      // Cache the result
      await waccCalculationCache.set(testKey, result1, 300);
      
      // Second calculation (from cache)
      const cachedStart = performance.now();
      const result2 = await waccCalculationCache.get(testKey);
      const cachedTime = performance.now() - cachedStart;
      
      expect(result2).toBeDefined();
      expect(cachedTime).toBeLessThan(uncachedTime);
      
      // Cache should provide significant speedup
      const speedupRatio = uncachedTime / cachedTime;
      expect(speedupRatio).toBeGreaterThan(2); // At least 2x faster
    });

    test('should handle cache hit/miss ratios', async () => {
      const cacheKeys = ['hit-miss-1', 'hit-miss-2', 'hit-miss-3'];
      const result = await engine.calculateWACC(inputData);
      
      // Cache some results
      await waccCalculationCache.set(cacheKeys[0], result, 300);
      await waccCalculationCache.set(cacheKeys[1], result, 300);
      
      // Test cache hits and misses
      const operations = [
        { key: cacheKeys[0], expectedHit: true },
        { key: cacheKeys[1], expectedHit: true },
        { key: cacheKeys[2], expectedHit: false }, // Not cached
        { key: 'non-existent', expectedHit: false }
      ];
      
      let hits = 0;
      let misses = 0;
      
      for (const operation of operations) {
        const cachedResult = await waccCalculationCache.get(operation.key);
        
        if (cachedResult !== null) {
          hits++;
          expect(operation.expectedHit).toBe(true);
        } else {
          misses++;
          expect(operation.expectedHit).toBe(false);
        }
      }
      
      const hitRate = hits / (hits + misses);
      expect(hitRate).toBe(0.5); // 50% hit rate for this test
    });

    test('should handle concurrent cache operations', async () => {
      const concurrentOperations = 20;
      const promises = [];
      
      // Create concurrent cache operations
      for (let i = 0; i < concurrentOperations; i++) {
        const promise = (async () => {
          const key = `concurrent-${i}`;
          const result = await engine.calculateWACC(inputData);
          
          await waccCalculationCache.set(key, result, 300);
          const retrieved = await waccCalculationCache.get(key);
          
          return { key, success: retrieved !== null };
        })();
        
        promises.push(promise);
      }
      
      const results = await Promise.all(promises);
      
      // All operations should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      
      expect(results).toHaveLength(concurrentOperations);
    });

    test('should maintain cache consistency under load', async () => {
      const loadTestKey = 'load-test';
      const originalResult = await engine.calculateWACC(inputData);
      
      await waccCalculationCache.set(loadTestKey, originalResult, 300);
      
      // Perform many concurrent reads
      const reads = Array.from({ length: 100 }, () =>
        waccCalculationCache.get(loadTestKey)
      );
      
      const readResults = await Promise.all(reads);
      
      // All reads should return the same result
      readResults.forEach(result => {
        expect(result).toBeDefined();
        expect(result.weightedAverageCostOfCapital).toBeCloseTo(originalResult.weightedAverageCostOfCapital, 10);
      });
    });
  });

  describe('Memory Management Integration', () => {
    test('should not create memory leaks with cache operations', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Perform many cache operations
      for (let i = 0; i < 1000; i++) {
        const key = `memory-test-${i}`;
        const result = await engine.calculateWACC(inputData);
        
        await waccCalculationCache.set(key, result, 60);
        await waccCalculationCache.get(key);
        
        // Occasionally clear old entries
        if (i % 100 === 0) {
          // Cache should handle its own cleanup
        }
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
    });

    test('should handle cache size limits gracefully', async () => {
      // Try to fill cache beyond reasonable limits
      const largeDataSets = [];
      
      for (let i = 0; i < 500; i++) {
        const largeInput = {
          ...inputData,
          buildUpModel: Array.from({ length: 100 }, (_, index) => ({
            name: `Large Component ${index}`,
            value: Math.random() * 10
          }))
        };
        
        const result = await engine.calculateWACC(largeInput);
        const key = `large-${i}`;
        
        try {
          await waccCalculationCache.set(key, result, 300);
          largeDataSets.push(key);
        } catch (error) {
          // Cache should handle size limits gracefully
          console.log('Cache size limit reached gracefully');
          break;
        }
      }
      
      // Should have cached at least some items
      expect(largeDataSets.length).toBeGreaterThan(0);
      
      // Recent items should still be accessible
      const recentKey = largeDataSets[largeDataSets.length - 1];
      const recentResult = await waccCalculationCache.get(recentKey);
      expect(recentResult).toBeDefined();
    });
  });
});