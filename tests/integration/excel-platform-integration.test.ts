/**
 * Excel Platform Integration Tests
 * Tests Enhanced Excel Generator across different Excel platforms and versions
 */

import { EnhancedExcelWACCGenerator, PlatformInfo } from '../../src/services/EnhancedExcelWACCGenerator';
import { WACCCalculationEngine } from '../../src/services/WACCCalculationEngine';
import WACCTemplates from '../../src/templates/waccTemplates';

describe('Excel Platform Integration Tests', () => {
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

  describe('Excel 2019+ Desktop Integration', () => {
    beforeEach(() => {
      // Mock Excel 2019+ environment
      (global as any).Office.context.platform = 'PC';
      (global as any).Office.context.requirements.isSetSupported = jest.fn((set, version) => {
        if (set === 'ExcelApi') {
          return parseFloat(version) <= 1.8; // Support up to 1.8
        }
        return true;
      });
    });

    test('should generate WACC table on Excel Windows 2019+', async () => {
      const template = WACCTemplates.find(t => t.id === 'professional')!;
      
      const mockWorksheet = createMockWorksheet();
      const mockExcelRun = jest.fn().mockImplementation(async (callback) => {
        const context = {
          workbook: { worksheets: mockWorksheet },
          sync: jest.fn()
        };
        return await callback(context);
      });
      
      (global as any).Excel.run = mockExcelRun;

      const result = await generator.generateWACCTable(inputData, waccResult, template);

      expect(result.success).toBe(true);
      expect(result.platformInfo?.platform).toBe('Windows');
      expect(result.platformInfo?.capabilities).toContain('colorFormatting');
      expect(result.platformInfo?.capabilities).toContain('borderFormatting');
      expect(result.cellsWritten).toBeGreaterThan(0);
    });

    test('should generate WACC table on Excel Mac 2019+', async () => {
      (global as any).Office.context.platform = 'Mac';
      const template = WACCTemplates.find(t => t.id === 'modern')!;
      
      const mockWorksheet = createMockWorksheet();
      const mockExcelRun = jest.fn().mockImplementation(async (callback) => {
        const context = {
          workbook: { worksheets: mockWorksheet },
          sync: jest.fn()
        };
        return await callback(context);
      });
      
      (global as any).Excel.run = mockExcelRun;

      const result = await generator.generateWACCTable(inputData, waccResult, template);

      expect(result.success).toBe(true);
      expect(result.platformInfo?.platform).toBe('Mac');
      expect(result.platformInfo?.capabilities).toContain('colorFormatting');
      expect(result.message).toContain('Modern template');
    });

    test('should handle advanced formatting features on desktop', async () => {
      const template = WACCTemplates.find(t => t.id === 'professional')!;
      
      let formattingCalls = 0;
      const mockWorksheet = createMockWorksheet({
        formatCallback: () => { formattingCalls++; }
      });
      
      const mockExcelRun = jest.fn().mockImplementation(async (callback) => {
        const context = {
          workbook: { worksheets: mockWorksheet },
          sync: jest.fn()
        };
        return await callback(context);
      });
      
      (global as any).Excel.run = mockExcelRun;

      const result = await generator.generateWACCTable(inputData, waccResult, template);

      expect(result.success).toBe(true);
      expect(formattingCalls).toBeGreaterThan(0); // Should apply formatting
      expect(result.platformInfo?.capabilities).toContain('autoFit');
    });
  });

  describe('Excel Online Integration', () => {
    beforeEach(() => {
      // Mock Excel Online environment
      (global as any).Office.context.platform = 'OfficeOnline';
      (global as any).Office.context.requirements.isSetSupported = jest.fn((set, version) => {
        if (set === 'ExcelApi') {
          return parseFloat(version) <= 1.4; // Limited API support
        }
        return true;
      });
    });

    test('should generate WACC table on Excel Online', async () => {
      const template = WACCTemplates.find(t => t.id === 'classic')!;
      
      const mockWorksheet = createMockWorksheet();
      const mockExcelRun = jest.fn().mockImplementation(async (callback) => {
        const context = {
          workbook: { worksheets: mockWorksheet },
          sync: jest.fn()
        };
        return await callback(context);
      });
      
      (global as any).Excel.run = mockExcelRun;

      const result = await generator.generateWACCTable(inputData, waccResult, template);

      expect(result.success).toBe(true);
      expect(result.platformInfo?.platform).toBe('Online');
      expect(result.platformInfo?.capabilities).toContain('basicFormatting');
      expect(result.platformInfo?.capabilities).not.toContain('colorFormatting');
    });

    test('should gracefully degrade formatting on Excel Online', async () => {
      const template = WACCTemplates.find(t => t.id === 'modern')!; // Template with colors
      
      const mockWorksheet = createMockWorksheet();
      const mockExcelRun = jest.fn().mockImplementation(async (callback) => {
        const context = {
          workbook: { worksheets: mockWorksheet },
          sync: jest.fn()
        };
        return await callback(context);
      });
      
      (global as any).Excel.run = mockExcelRun;

      const result = await generator.generateWACCTable(inputData, waccResult, template);

      expect(result.success).toBe(true);
      expect(result.platformInfo?.platform).toBe('Online');
      // Should still generate successfully without advanced formatting
    });

    test('should handle network connectivity issues', async () => {
      const template = WACCTemplates.find(t => t.id === 'professional')!;
      
      // Simulate network issues
      let attemptCount = 0;
      const mockExcelRun = jest.fn().mockImplementation(async (callback) => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('NetworkError: Failed to fetch');
        }
        
        const context = {
          workbook: { worksheets: createMockWorksheet() },
          sync: jest.fn()
        };
        return await callback(context);
      });
      
      (global as any).Excel.run = mockExcelRun;

      const result = await generator.generateWACCTable(inputData, waccResult, template);

      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3); // Should retry
      expect(result.performanceMetrics?.retryAttempts).toBeGreaterThan(0);
    });
  });

  describe('Excel Mobile Integration', () => {
    beforeEach(() => {
      // Mock mobile Excel environment
      (global as any).Office.context.platform = 'iOS';
      (global as any).Office.context.requirements.isSetSupported = jest.fn((set, version) => {
        if (set === 'ExcelApi') {
          return parseFloat(version) <= 1.2; // Very limited API support
        }
        return true;
      });
    });

    test('should generate WACC table on Excel iOS', async () => {
      const template = WACCTemplates.find(t => t.id === 'classic')!; // Simplest template
      
      const mockWorksheet = createMockWorksheet();
      const mockExcelRun = jest.fn().mockImplementation(async (callback) => {
        // Simulate slower mobile performance
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const context = {
          workbook: { worksheets: mockWorksheet },
          sync: jest.fn()
        };
        return await callback(context);
      });
      
      (global as any).Excel.run = mockExcelRun;

      const result = await generator.generateWACCTable(inputData, waccResult, template);

      expect(result.success).toBe(true);
      expect(result.platformInfo?.platform).toBe('Mobile');
      expect(result.platformInfo?.capabilities).toContain('basicFormatting');
      expect(result.platformInfo?.capabilities).not.toContain('columnResizing');
    });

    test('should generate WACC table on Excel Android', async () => {
      (global as any).Office.context.platform = 'Android';
      const template = WACCTemplates.find(t => t.id === 'professional')!;
      
      const mockWorksheet = createMockWorksheet();
      const mockExcelRun = jest.fn().mockImplementation(async (callback) => {
        const context = {
          workbook: { worksheets: mockWorksheet },
          sync: jest.fn()
        };
        return await callback(context);
      });
      
      (global as any).Excel.run = mockExcelRun;

      const result = await generator.generateWACCTable(inputData, waccResult, template);

      expect(result.success).toBe(true);
      expect(result.platformInfo?.platform).toBe('Mobile');
    });

    test('should optimize for mobile screen sizes', async () => {
      const template = WACCTemplates.find(t => t.id === 'modern')!;
      
      const mockWorksheet = createMockWorksheet({
        skipColumnWidthSetting: true // Mobile should skip column width setting
      });
      
      const mockExcelRun = jest.fn().mockImplementation(async (callback) => {
        const context = {
          workbook: { worksheets: mockWorksheet },
          sync: jest.fn()
        };
        return await callback(context);
      });
      
      (global as any).Excel.run = mockExcelRun;

      const result = await generator.generateWACCTable(inputData, waccResult, template);

      expect(result.success).toBe(true);
      // Mobile optimization should be applied
    });
  });

  describe('Template System Cross-Platform Compatibility', () => {
    const platforms = [
      { name: 'Windows', context: 'PC', apiLevel: 1.8 },
      { name: 'Mac', context: 'Mac', apiLevel: 1.8 },
      { name: 'Online', context: 'OfficeOnline', apiLevel: 1.4 },
      { name: 'iOS', context: 'iOS', apiLevel: 1.2 },
      { name: 'Android', context: 'Android', apiLevel: 1.2 }
    ];

    test.each(platforms)('should handle all templates on $name platform', async ({ context, apiLevel }) => {
      (global as any).Office.context.platform = context;
      (global as any).Office.context.requirements.isSetSupported = jest.fn((set, version) => {
        if (set === 'ExcelApi') {
          return parseFloat(version) <= apiLevel;
        }
        return true;
      });

      for (const template of WACCTemplates) {
        const mockWorksheet = createMockWorksheet();
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
        expect(result.message).toContain(template.name);
        expect(result.cellsWritten).toBeGreaterThan(0);
      }
    });
  });

  describe('Legacy Excel Version Compatibility', () => {
    test('should handle Excel 2016 gracefully', async () => {
      // Mock older Excel version
      (global as any).Office.context.platform = 'PC';
      (global as any).Office.context.requirements.isSetSupported = jest.fn((set, version) => {
        if (set === 'ExcelApi') {
          return parseFloat(version) <= 1.1; // Very limited API
        }
        return true;
      });

      const template = WACCTemplates.find(t => t.id === 'classic')!;
      
      const mockWorksheet = createMockWorksheet();
      const mockExcelRun = jest.fn().mockImplementation(async (callback) => {
        const context = {
          workbook: { worksheets: mockWorksheet },
          sync: jest.fn()
        };
        return await callback(context);
      });
      
      (global as any).Excel.run = mockExcelRun;

      const result = await generator.generateWACCTable(inputData, waccResult, template);

      expect(result.success).toBe(true);
      expect(result.platformInfo?.apiVersion).toBe('1.1');
      expect(result.platformInfo?.capabilities).toContain('basicFormatting');
    });
  });

  describe('Error Recovery Across Platforms', () => {
    test('should handle platform-specific errors appropriately', async () => {
      const platforms = ['PC', 'Mac', 'OfficeOnline', 'iOS', 'Android'];
      
      for (const platform of platforms) {
        (global as any).Office.context.platform = platform;
        
        const template = WACCTemplates[0];
        const mockExcelRun = jest.fn().mockRejectedValue(
          new Error(`Platform-specific error on ${platform}`)
        );
        
        (global as any).Excel.run = mockExcelRun;

        const result = await generator.generateWACCTable(inputData, waccResult, template);

        expect(result.success).toBe(false);
        expect(result.message).toContain('error');
        expect(result.platformInfo?.platform).toBeDefined();
      }
    });
  });
});

// Helper function to create mock worksheet
function createMockWorksheet(options: any = {}) {
  return {
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
    getRange: jest.fn().mockImplementation((range) => ({
      values: [],
      format: {
        font: { 
          name: '', 
          size: 0, 
          bold: false, 
          color: '',
          set bold(value) { if (options.formatCallback) options.formatCallback(); }
        },
        borders: {
          getItem: jest.fn().mockReturnValue({ 
            style: '',
            set style(value) { if (options.formatCallback) options.formatCallback(); }
          })
        },
        fill: { 
          color: '',
          set color(value) { if (options.formatCallback) options.formatCallback(); }
        },
        horizontalAlignment: '',
        columnWidth: 0,
        set columnWidth(value) { 
          if (!options.skipColumnWidthSetting && options.formatCallback) {
            options.formatCallback(); 
          }
        }
      },
      numberFormat: [],
      set values(val) { /* Mock setter */ },
      set numberFormat(val) { if (options.formatCallback) options.formatCallback(); }
    })),
    showGridlines: false,
    activate: jest.fn()
  };
}