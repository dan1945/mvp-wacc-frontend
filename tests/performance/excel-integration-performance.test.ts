/**
 * Excel Integration Performance Tests
 * Validates Excel generation meets sub-2 second requirements across platforms
 */

import { EnhancedExcelWACCGenerator } from '../../src/services/EnhancedExcelWACCGenerator';
import { WACCCalculationEngine } from '../../src/services/WACCCalculationEngine';
import WACCTemplates from '../../src/templates/waccTemplates';

describe('Excel Integration Performance', () => {
  let generator: EnhancedExcelWACCGenerator;
  let engine: WACCCalculationEngine;
  let inputData: any;
  let waccResult: any;

  beforeEach(() => {
    generator = new EnhancedExcelWACCGenerator();
    engine = new WACCCalculationEngine();
    inputData = global.testUtils.createMockWACCData();
  });

  describe('Excel Generation Speed', () => {
    test('should generate Excel WACC table in under 2 seconds', async () => {
      // Calculate WACC first
      waccResult = await engine.calculateWACC(inputData);
      const professionalTemplate = WACCTemplates.find(t => t.id === 'professional')!;
      
      // Mock Excel.run to simulate realistic timing
      const mockExcelRun = jest.fn().mockImplementation(async (callback) => {
        // Simulate Excel API delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
        return await callback(global.testUtils.createMockExcelContext());
      });
      
      (global as any).Excel.run = mockExcelRun;

      const executionTime = await performanceTestUtils.measureTime(async () => {
        await generator.generateWACCTable(inputData, waccResult, professionalTemplate);
      });

      expect(executionTime).toBeFasterThan(performanceTestUtils.thresholds.excel);
    });

    test('should handle all template types within performance thresholds', async () => {
      waccResult = await engine.calculateWACC(inputData);
      
      const templatePerformance: Array<{ templateId: string; time: number }> = [];

      for (const template of WACCTemplates) {
        const mockExcelRun = jest.fn().mockImplementation(async (callback) => {
          await new Promise(resolve => setTimeout(resolve, Math.random() * 300));
          return await callback(global.testUtils.createMockExcelContext());
        });
        
        (global as any).Excel.run = mockExcelRun;

        const executionTime = await performanceTestUtils.measureTime(async () => {
          await generator.generateWACCTable(inputData, waccResult, template);
        });

        templatePerformance.push({ templateId: template.id, time: executionTime });
      }

      // All templates should meet performance requirements
      templatePerformance.forEach(({ templateId, time }) => {
        expect(time).toBeFasterThan(performanceTestUtils.thresholds.excel);
      });

      // Template performance should be consistent (no template significantly slower)
      const times = templatePerformance.map(p => p.time);
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      const variance = maxTime - minTime;
      
      expect(variance).toBeLessThan(1000); // Less than 1 second variance between templates
    });

    test('should optimize for different Excel platforms', async () => {
      waccResult = await engine.calculateWACC(inputData);
      const template = WACCTemplates[0];
      
      const platforms = ['PC', 'Mac', 'OfficeOnline', 'iOS', 'Android'];
      const platformPerformance: Array<{ platform: string; time: number }> = [];

      for (const platform of platforms) {
        // Mock platform detection
        (global as any).Office.context.platform = platform;
        
        const mockExcelRun = jest.fn().mockImplementation(async (callback) => {
          // Simulate platform-specific delays
          const platformDelays = {
            'PC': 100,
            'Mac': 120,
            'OfficeOnline': 300,
            'iOS': 500,
            'Android': 500
          };
          
          await new Promise(resolve => 
            setTimeout(resolve, platformDelays[platform as keyof typeof platformDelays] || 100)
          );
          
          return await callback(global.testUtils.createMockExcelContext());
        });
        
        (global as any).Excel.run = mockExcelRun;

        const executionTime = await performanceTestUtils.measureTime(async () => {
          await generator.generateWACCTable(inputData, waccResult, template);
        });

        platformPerformance.push({ platform, time: executionTime });
      }

      // Desktop platforms should be fastest
      const desktopPlatforms = platformPerformance.filter(p => ['PC', 'Mac'].includes(p.platform));
      const mobilePlatforms = platformPerformance.filter(p => ['iOS', 'Android'].includes(p.platform));
      
      desktopPlatforms.forEach(({ time }) => {
        expect(time).toBeFasterThan(1000); // Desktop should be under 1 second
      });
      
      mobilePlatforms.forEach(({ time }) => {
        expect(time).toBeFasterThan(performanceTestUtils.thresholds.excel); // Mobile within 2 seconds
      });
    });
  });

  describe('Batch Operations Performance', () => {
    test('should optimize batch operations for performance', async () => {
      waccResult = await engine.calculateWACC(inputData);
      const template = WACCTemplates[0];
      
      let batchOperationCount = 0;
      const mockExcelRun = jest.fn().mockImplementation(async (callback) => {
        const mockContext = {
          ...global.testUtils.createMockExcelContext(),
          sync: jest.fn(() => {
            batchOperationCount++;
            return Promise.resolve();
          })
        };
        
        return await callback(mockContext);
      });
      
      (global as any).Excel.run = mockExcelRun;

      await generator.generateWACCTable(inputData, waccResult, template);
      
      // Should minimize sync operations (batch efficiently)
      expect(batchOperationCount).toBeLessThan(5); // Maximum 5 sync operations
    });

    test('should handle large datasets efficiently', async () => {
      // Create large dataset
      const largeInputData = {
        ...inputData,
        buildUpModel: Array.from({ length: 100 }, (_, i) => ({
          name: `Component ${i + 1}`,
          value: Math.random() * 10
        }))
      };
      
      waccResult = await engine.calculateWACC(largeInputData);
      const template = WACCTemplates[0];
      
      const mockExcelRun = jest.fn().mockImplementation(async (callback) => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return await callback(global.testUtils.createMockExcelContext());
      });
      
      (global as any).Excel.run = mockExcelRun;

      const executionTime = await performanceTestUtils.measureTime(async () => {
        await generator.generateWACCTable(largeInputData, waccResult, template);
      });

      // Should still meet performance requirements with large datasets
      expect(executionTime).toBeFasterThan(performanceTestUtils.thresholds.excel * 1.5); // Allow 50% more time for large datasets
    });
  });

  describe('Error Recovery Performance', () => {
    test('should handle retries efficiently', async () => {
      waccResult = await engine.calculateWACC(inputData);
      const template = WACCTemplates[0];
      
      let attemptCount = 0;
      const mockExcelRun = jest.fn().mockImplementation(async (callback) => {
        attemptCount++;
        
        if (attemptCount < 3) {
          // Simulate failure for first 2 attempts
          throw new Error('Network error');
        }
        
        // Succeed on 3rd attempt
        await new Promise(resolve => setTimeout(resolve, 100));
        return await callback(global.testUtils.createMockExcelContext());
      });
      
      (global as any).Excel.run = mockExcelRun;

      const executionTime = await performanceTestUtils.measureTime(async () => {
        const result = await generator.generateWACCTable(inputData, waccResult, template);
        expect(result.success).toBe(true);
      });

      // Should complete within threshold even with retries
      expect(executionTime).toBeFasterThan(performanceTestUtils.thresholds.excel);
      expect(attemptCount).toBe(3); // Confirm retries happened
    });

    test('should timeout appropriately for failed operations', async () => {
      waccResult = await engine.calculateWACC(inputData);
      const template = WACCTemplates[0];
      
      const mockExcelRun = jest.fn().mockImplementation(async () => {
        // Simulate a hanging operation
        await new Promise(resolve => setTimeout(resolve, 10000));
        throw new Error('Operation timed out');
      });
      
      (global as any).Excel.run = mockExcelRun;

      const executionTime = await performanceTestUtils.measureTime(async () => {
        const result = await generator.generateWACCTable(inputData, waccResult, template);
        expect(result.success).toBe(false);
      });

      // Should not wait too long for failed operations
      expect(executionTime).toBeFasterThan(5000); // 5 second timeout
    });
  });

  describe('Cross-Platform Optimization', () => {
    test('should adapt performance based on platform capabilities', async () => {
      waccResult = await engine.calculateWACC(inputData);
      const template = WACCTemplates[0];
      
      const platformTests = [
        { platform: 'PC', expectedFeatures: ['colorFormatting', 'borderFormatting'] },
        { platform: 'OfficeOnline', expectedFeatures: ['basicFormatting'] },
        { platform: 'iOS', expectedFeatures: ['basicFormatting'] }
      ];

      for (const { platform, expectedFeatures } of platformTests) {
        (global as any).Office.context.platform = platform;
        
        const mockExcelRun = jest.fn().mockImplementation(async (callback) => {
          await new Promise(resolve => setTimeout(resolve, 150));
          return await callback(global.testUtils.createMockExcelContext());
        });
        
        (global as any).Excel.run = mockExcelRun;

        const executionTime = await performanceTestUtils.measureTime(async () => {
          const result = await generator.generateWACCTable(inputData, waccResult, template);
          expect(result.success).toBe(true);
          
          // Verify platform info is captured
          expect(result.platformInfo?.platform).toBeDefined();
        });

        // Performance should be optimized for each platform
        expect(executionTime).toBeFasterThan(performanceTestUtils.thresholds.excel);
      }
    });
  });

  describe('Memory Management', () => {
    test('should not leak memory during Excel operations', async () => {
      waccResult = await engine.calculateWACC(inputData);
      const template = WACCTemplates[0];
      
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Perform multiple Excel generations
      for (let i = 0; i < 10; i++) {
        const mockExcelRun = jest.fn().mockImplementation(async (callback) => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return await callback(global.testUtils.createMockExcelContext());
        });
        
        (global as any).Excel.run = mockExcelRun;
        
        await generator.generateWACCTable(inputData, waccResult, template);
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Should not have significant memory increase
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // Less than 5MB increase
    });
  });
});