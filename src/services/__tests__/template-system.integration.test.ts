/**
 * Template System Integration Tests
 * Tests all three WACC templates with cross-platform compatibility
 */

import { EnhancedExcelWACCGenerator } from '../EnhancedExcelWACCGenerator';
import { WACCCalculationEngine } from '../WACCCalculationEngine';
import WACCTemplates from '../../templates/waccTemplates';
import { WACCTemplate } from '@types/wacc';

describe('Template System Integration Tests', () => {
  let generator: EnhancedExcelWACCGenerator;
  let engine: WACCCalculationEngine;
  let inputData: any;
  let waccResult: any;

  beforeEach(async () => {
    generator = new EnhancedExcelWACCGenerator();
    engine = new WACCCalculationEngine();
    inputData = global.testUtils.createMockWACCData();
    waccResult = await engine.calculateWACC(inputData);
  });

  describe('Template Validation', () => {
    test('should have exactly three templates', () => {
      expect(WACCTemplates).toHaveLength(3);
      
      const templateIds = WACCTemplates.map(t => t.id);
      expect(templateIds).toEqual(['professional', 'modern', 'classic']);
    });

    test('should have valid template structure', () => {
      WACCTemplates.forEach(template => {
        // Basic properties
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.description).toBeDefined();
        
        // Theme structure
        expect(template.theme).toBeDefined();
        expect(template.theme.fonts).toBeDefined();
        expect(template.theme.colors).toBeDefined();
        expect(template.theme.layout).toBeDefined();
        
        // Font definitions
        expect(template.theme.fonts.header).toBeDefined();
        expect(template.theme.fonts.body).toBeDefined();
        expect(template.theme.fonts.calculation).toBeDefined();
        
        // Color definitions
        expect(template.theme.colors.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(template.theme.colors.secondary).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(template.theme.colors.border).toMatch(/^#[0-9A-Fa-f]{6}$/);
        
        // WACC-specific settings
        expect(template.waccSpecific).toBeDefined();
        expect(typeof template.waccSpecific.highlightFinalWACC).toBe('boolean');
        expect(typeof template.waccSpecific.showCalculationSteps).toBe('boolean');
        expect(typeof template.waccSpecific.includeFormulas).toBe('boolean');
      });
    });
  });

  describe('Professional Template', () => {
    let professionalTemplate: WACCTemplate;

    beforeEach(() => {
      professionalTemplate = WACCTemplates.find(t => t.id === 'professional')!;
    });

    test('should have correct professional template properties', () => {
      expect(professionalTemplate.name).toBe('Professional');
      expect(professionalTemplate.description).toContain('corporate');
      
      // Professional styling characteristics
      expect(professionalTemplate.theme.fonts.header.name).toBe('Calibri');
      expect(professionalTemplate.theme.fonts.header.color).toBe('#1f4e79');
      expect(professionalTemplate.theme.colors.primary).toBe('#1f4e79');
      expect(professionalTemplate.waccSpecific.highlightFinalWACC).toBe(true);
      expect(professionalTemplate.waccSpecific.includeFormulas).toBe(false);
    });

    test('should generate WACC table with professional styling', async () => {
      const mockWorksheet = createMockWorksheetWithFormatTracking();
      const mockExcelRun = jest.fn().mockImplementation(async (callback) => {
        const context = {
          workbook: { worksheets: mockWorksheet },
          sync: jest.fn()
        };
        return await callback(context);
      });
      
      (global as any).Excel.run = mockExcelRun;

      const result = await generator.generateWACCTable(inputData, waccResult, professionalTemplate);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Professional template');
      
      // Verify professional styling was applied
      expect(mockWorksheet.formatTracking.fontApplications).toBeGreaterThan(0);
      expect(mockWorksheet.formatTracking.colorApplications).toBeGreaterThan(0);
    });

    test('should optimize for corporate presentation', async () => {
      // Professional template should prioritize readability and clean appearance
      expect(professionalTemplate.theme.layout.sectionSpacing).toBe(2);
      expect(professionalTemplate.theme.layout.borderStyle).toBe('continuous');
      expect(professionalTemplate.theme.layout.columnWidths).toEqual([120, 100, 80, 100]);
    });
  });

  describe('Modern Template', () => {
    let modernTemplate: WACCTemplate;

    beforeEach(() => {
      modernTemplate = WACCTemplates.find(t => t.id === 'modern')!;
    });

    test('should have correct modern template properties', () => {
      expect(modernTemplate.name).toBe('Modern');
      expect(modernTemplate.description).toContain('Contemporary');
      
      // Modern styling characteristics
      expect(modernTemplate.theme.fonts.header.name).toBe('Segoe UI');
      expect(modernTemplate.theme.fonts.calculation.name).toBe('Consolas');
      expect(modernTemplate.theme.colors.primary).toBe('#0078d4');
      expect(modernTemplate.theme.colors.secondary).toBe('#00b7c3');
      expect(modernTemplate.waccSpecific.includeFormulas).toBe(true);
    });

    test('should generate WACC table with modern styling', async () => {
      const mockWorksheet = createMockWorksheetWithFormatTracking();
      const mockExcelRun = jest.fn().mockImplementation(async (callback) => {
        const context = {
          workbook: { worksheets: mockWorksheet },
          sync: jest.fn()
        };
        return await callback(context);
      });
      
      (global as any).Excel.run = mockExcelRun;

      const result = await generator.generateWACCTable(inputData, waccResult, modernTemplate);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Modern template');
      
      // Verify modern styling features
      expect(mockWorksheet.formatTracking.fontApplications).toBeGreaterThan(0);
    });

    test('should include advanced formatting features', () => {
      // Modern template should have enhanced formatting options
      expect(modernTemplate.theme.layout.sectionSpacing).toBe(3); // More spacing
      expect(modernTemplate.theme.layout.borderStyle).toBe('thin');
      expect(modernTemplate.waccSpecific.showCalculationSteps).toBe(true);
      expect(modernTemplate.waccSpecific.includeFormulas).toBe(true);
    });
  });

  describe('Classic Template', () => {
    let classicTemplate: WACCTemplate;

    beforeEach(() => {
      classicTemplate = WACCTemplates.find(t => t.id === 'classic')!;
    });

    test('should have correct classic template properties', () => {
      expect(classicTemplate.name).toBe('Classic');
      expect(classicTemplate.description).toContain('Traditional');
      
      // Classic styling characteristics
      expect(classicTemplate.theme.fonts.header.name).toBe('Times New Roman');
      expect(classicTemplate.theme.fonts.body.name).toBe('Times New Roman');
      expect(classicTemplate.theme.colors.primary).toBe('#000000');
      expect(classicTemplate.waccSpecific.highlightFinalWACC).toBe(false);
    });

    test('should generate WACC table with classic styling', async () => {
      const mockWorksheet = createMockWorksheetWithFormatTracking();
      const mockExcelRun = jest.fn().mockImplementation(async (callback) => {
        const context = {
          workbook: { worksheets: mockWorksheet },
          sync: jest.fn()
        };
        return await callback(context);
      });
      
      (global as any).Excel.run = mockExcelRun;

      const result = await generator.generateWACCTable(inputData, waccResult, classicTemplate);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Classic template');
    });

    test('should follow traditional financial document styling', () => {
      // Classic template should be conservative
      expect(classicTemplate.theme.layout.sectionSpacing).toBe(1); // Minimal spacing
      expect(classicTemplate.theme.layout.borderStyle).toBe('medium');
      expect(classicTemplate.theme.fonts.calculation.numberFormat).toBe('0.000%'); // More decimal places
      expect(classicTemplate.waccSpecific.highlightFinalWACC).toBe(false); // No highlighting
    });
  });

  describe('Cross-Template Consistency', () => {
    test('should have consistent data structure across templates', async () => {
      const results = [];
      
      for (const template of WACCTemplates) {
        const mockWorksheet = createMockWorksheetWithFormatTracking();
        const mockExcelRun = jest.fn().mockImplementation(async (callback) => {
          const context = {
            workbook: { worksheets: mockWorksheet },
            sync: jest.fn()
          };
          return await callback(context);
        });
        
        (global as any).Excel.run = mockExcelRun;

        const result = await generator.generateWACCTable(inputData, waccResult, template);
        results.push(result);
      }

      // All templates should generate successfully
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.cellsWritten).toBeGreaterThan(0);
        expect(result.processingTime).toBeDefined();
      });

      // Cell counts should be similar (same data, different formatting)
      const cellCounts = results.map(r => r.cellsWritten);
      const minCells = Math.min(...cellCounts);
      const maxCells = Math.max(...cellCounts);
      
      // Should be within reasonable range
      expect(maxCells - minCells).toBeLessThan(10);
    });

    test('should handle same data consistently across templates', async () => {
      const testResults: any[] = [];
      
      for (const template of WACCTemplates) {
        const mockWorksheet = createMockWorksheetWithFormatTracking();
        const mockExcelRun = jest.fn().mockImplementation(async (callback) => {
          const context = {
            workbook: { worksheets: mockWorksheet },
            sync: jest.fn()
          };
          return await callback(context);
        });
        
        (global as any).Excel.run = mockExcelRun;

        const startTime = performance.now();
        const result = await generator.generateWACCTable(inputData, waccResult, template);
        const endTime = performance.now();

        testResults.push({
          templateId: template.id,
          success: result.success,
          processingTime: endTime - startTime,
          cellsWritten: result.cellsWritten
        });
      }

      // All should succeed
      testResults.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Performance should be consistent
      const processingTimes = testResults.map(r => r.processingTime);
      const avgTime = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
      
      processingTimes.forEach(time => {
        expect(time).toBeLessThan(avgTime * 2); // No template should be more than 2x slower
      });
    });
  });

  describe('Platform Compatibility', () => {
    const platforms = [
      { name: 'Windows', context: 'PC' },
      { name: 'Mac', context: 'Mac' },
      { name: 'Online', context: 'OfficeOnline' },
      { name: 'Mobile', context: 'iOS' }
    ];

    test.each(platforms)('should handle all templates on $name platform', async ({ context }) => {
      (global as any).Office.context.platform = context;

      for (const template of WACCTemplates) {
        const mockWorksheet = createMockWorksheetWithFormatTracking();
        const mockExcelRun = jest.fn().mockImplementation(async (callback) => {
          const mockContext = {
            workbook: { worksheets: mockWorksheet },
            sync: jest.fn()
          };
          return await callback(mockContext);
        });
        
        (global as any).Excel.run = mockExcelRun;

        const result = await generator.generateWACCTable(inputData, waccResult, template);

        expect(result.success).toBe(true);
        expect(result.platformInfo?.platform).toBeDefined();
        
        // Platform-specific capabilities should be considered
        if (context === 'iOS' || context === 'Android') {
          expect(result.platformInfo?.capabilities).toContain('basicFormatting');
        } else {
          expect(result.platformInfo?.capabilities).toContain('colorFormatting');
        }
      }
    });
  });

  describe('Template Performance', () => {
    test('should meet performance requirements for all templates', async () => {
      const performanceResults: Array<{ templateId: string; time: number }> = [];
      
      for (const template of WACCTemplates) {
        const mockWorksheet = createMockWorksheetWithFormatTracking();
        const mockExcelRun = jest.fn().mockImplementation(async (callback) => {
          // Simulate realistic Excel API delay
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
          
          const context = {
            workbook: { worksheets: mockWorksheet },
            sync: jest.fn()
          };
          return await callback(context);
        });
        
        (global as any).Excel.run = mockExcelRun;

        const startTime = performance.now();
        const result = await generator.generateWACCTable(inputData, waccResult, template);
        const endTime = performance.now();

        expect(result.success).toBe(true);
        
        const processingTime = endTime - startTime;
        performanceResults.push({ templateId: template.id, time: processingTime });
        
        // Each template should meet performance threshold
        expect(processingTime).toBeLessThan(2000); // 2 second threshold
      }

      // Log performance comparison
      console.log('Template Performance:', performanceResults);
    });

    test('should have consistent performance across templates', async () => {
      const times: number[] = [];
      
      for (const template of WACCTemplates) {
        const mockWorksheet = createMockWorksheetWithFormatTracking();
        const mockExcelRun = jest.fn().mockImplementation(async (callback) => {
          const context = {
            workbook: { worksheets: mockWorksheet },
            sync: jest.fn()
          };
          return await callback(context);
        });
        
        (global as any).Excel.run = mockExcelRun;

        const executionTime = await performanceTestUtils.measureTime(async () => {
          await generator.generateWACCTable(inputData, waccResult, template);
        });
        
        times.push(executionTime);
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxVariance = Math.max(...times) - Math.min(...times);
      
      // Variance should not be excessive
      expect(maxVariance).toBeLessThan(avgTime); // Variance less than average time
    });
  });
});

// Helper function to create mock worksheet with format tracking
function createMockWorksheetWithFormatTracking() {
  const formatTracking = {
    fontApplications: 0,
    colorApplications: 0,
    borderApplications: 0
  };

  return {
    formatTracking,
    getItemOrNullObject: jest.fn().mockReturnValue({ isNullObject: true }),
    add: jest.fn().mockReturnThis(),
    getUsedRange: jest.fn().mockReturnValue({
      load: jest.fn(),
      clear: jest.fn(),
      isNullObject: false,
      format: {
        autofitColumns: jest.fn(),
        autofitRows: jest.fn()
      }
    }),
    getRange: jest.fn().mockImplementation(() => ({
      values: [],
      format: {
        font: {
          name: '',
          size: 0,
          bold: false,
          color: '',
          set name(value) { formatTracking.fontApplications++; },
          set size(value) { formatTracking.fontApplications++; },
          set bold(value) { formatTracking.fontApplications++; },
          set color(value) { formatTracking.colorApplications++; }
        },
        borders: {
          getItem: jest.fn().mockReturnValue({
            style: '',
            set style(value) { formatTracking.borderApplications++; }
          })
        },
        fill: {
          color: '',
          set color(value) { formatTracking.colorApplications++; }
        },
        horizontalAlignment: '',
        columnWidth: 0
      },
      numberFormat: [],
      set values(val) { /* Mock setter */ },
      set numberFormat(val) { /* Mock setter */ }
    })),
    showGridlines: false,
    activate: jest.fn()
  };
}