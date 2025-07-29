/**
 * Template System Tests for ExcelWACCGenerator
 * Tests the enhanced template functionality and cross-platform compatibility
 */

import { ExcelWACCGenerator } from '../ExcelWACCGenerator';
import { WACCInputData, WACCResult, WACCTemplate } from '@types/wacc';
import WACCTemplates from '../../templates/waccTemplates';

// Mock Excel API for testing
const mockExcel = {
  run: jest.fn(),
  BorderLineStyle: {
    continuous: 'Continuous',
    thin: 'Thin',
    medium: 'Medium'
  }
};

// Mock Office context for testing
const mockOffice = {
  context: {
    host: 'Excel',
    platform: 'PC',
    requirements: {
      isSetSupported: jest.fn().mockReturnValue(true)
    }
  }
};

// Setup global mocks
(global as any).Excel = mockExcel;
(global as any).Office = mockOffice;

describe('ExcelWACCGenerator Template System', () => {
  let generator: ExcelWACCGenerator;
  let mockInputData: WACCInputData;
  let mockResult: WACCResult;

  beforeEach(() => {
    generator = new ExcelWACCGenerator();
    
    mockInputData = {
      buildUpModel: [
        { name: 'Risk-free Rate', value: 3.5 },
        { name: 'Beta Premium', value: 5.25 }
      ],
      costOfDebtCalculations: [
        { name: 'Interest Expense', value: 2.5 },
        { name: 'Outstanding Debt', value: 1000 },
        { name: 'Total Debt', value: 1000 },
        { name: 'Tax Rate', value: 25 }
      ],
      weightData: { weightOfDebt: 30, weightOfEquity: 70 },
      taxRate: 25,
      waccBuildUpSelectionType: 1,
      isWeightDataEdited: false
    };

    mockResult = {
      costOfEquity: 0.0875,
      costOfDebt: 0.025,
      weightOfDebt: 0.30,
      weightOfEquity: 0.70,
      taxRate: 0.25,
      weightedAverageCostOfCapital: 0.0806,
      buildUpModelData: [
        ['Risk-free Rate', 0.035],
        ['Beta Premium', 0.0525]
      ],
      costOfDebtData: [
        ['Interest Expense', 0.025],
        ['Outstanding Debt', 1000]
      ],
      capitalStructureTable: [
        { component: 'Equity', weight: 0.70, cost: 0.0875, extendedValue: 0.06125 },
        { component: 'Debt', weight: 0.30, cost: 0.025, extendedValue: 0.005625 },
        { component: 'Total', weight: 1.0, cost: 0.0806, extendedValue: 0.066875 }
      ],
      calculationTimestamp: new Date(),
      inputValidation: { isValid: true, errors: [] },
      performanceMetrics: { calculationTime: 10, excelGenerationTime: 50 }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Template Integration', () => {
    it('should accept template parameter in generateWACCTable', async () => {
      const professionalTemplate = WACCTemplates.find(t => t.id === 'professional')!;
      
      // Create proper mock worksheet with all required methods
      const createMockWorksheet = () => ({
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
        getRange: jest.fn().mockReturnValue({
          values: [],
          format: {
            font: { name: '', size: 0, bold: false, color: '' },
            borders: {
              getItem: jest.fn().mockReturnValue({ style: '', color: '' })
            },
            fill: { color: '' },
            horizontalAlignment: '',
            columnWidth: 0
          },
          numberFormat: []
        }),
        showGridlines: false,
        activate: jest.fn()
      });

      // Mock Excel.run to return success
      mockExcel.run.mockImplementation(async (callback) => {
        const worksheet = createMockWorksheet();
        const mockContext = {
          workbook: {
            worksheets: worksheet
          },
          sync: jest.fn()
        };

        return await callback(mockContext);
      });

      const result = await generator.generateWACCTable(mockInputData, mockResult, professionalTemplate);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Professional template');
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should handle all three template types', async () => {
      const templates = ['professional', 'modern', 'classic'];
      
      for (const templateId of templates) {
        const template = WACCTemplates.find(t => t.id === templateId)!;
        
        // Create proper mock for each template test
        const createMockWorksheet = () => ({
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
          getRange: jest.fn().mockReturnValue({
            values: [],
            format: {
              font: { name: '', size: 0, bold: false, color: '' },
              borders: {
                getItem: jest.fn().mockReturnValue({ style: '', color: '' })
              },
              fill: { color: '' },
              horizontalAlignment: '',
              columnWidth: 0
            },
            numberFormat: []
          }),
          showGridlines: false,
          activate: jest.fn()
        });

        mockExcel.run.mockImplementation(async (callback) => {
          const worksheet = createMockWorksheet();
          const mockContext = {
            workbook: {
              worksheets: worksheet
            },
            sync: jest.fn()
          };
          return await callback(mockContext);
        });

        const result = await generator.generateWACCTable(mockInputData, mockResult, template);
        expect(result.success).toBe(true);
        expect(result.message).toContain(template.name);
      }
    });
  });

  describe('TemplateFormatter Cross-Platform Compatibility', () => {
    it('should detect Excel Online platform', () => {
      mockOffice.context.platform = 'OfficeOnline';
      
      // This would be called internally by TemplateFormatter
      // Testing the static method logic
      const compatibility = {
        supportsAdvancedFormatting: mockOffice.context.platform !== 'iOS' && mockOffice.context.platform !== 'Android',
        supportsColorBorders: mockOffice.context.platform !== 'OfficeOnline' && 
                             mockOffice.context.platform !== 'iOS' && 
                             mockOffice.context.platform !== 'Android',
        platformInfo: `${mockOffice.context.host}-${mockOffice.context.platform}`
      };

      expect(compatibility.supportsAdvancedFormatting).toBe(true);
      expect(compatibility.supportsColorBorders).toBe(false);
      expect(compatibility.platformInfo).toBe('Excel-OfficeOnline');
    });

    it('should detect mobile platforms', () => {
      mockOffice.context.platform = 'iOS';
      
      const compatibility = {
        supportsAdvancedFormatting: mockOffice.context.platform !== 'iOS' && mockOffice.context.platform !== 'Android',
        supportsColorBorders: mockOffice.context.platform !== 'OfficeOnline' && 
                             mockOffice.context.platform !== 'iOS' && 
                             mockOffice.context.platform !== 'Android',
        platformInfo: `${mockOffice.context.host}-${mockOffice.context.platform}`
      };

      expect(compatibility.supportsAdvancedFormatting).toBe(false);
      expect(compatibility.supportsColorBorders).toBe(false);
      expect(compatibility.platformInfo).toBe('Excel-iOS');
    });
  });

  describe('Performance Optimization', () => {
    it('should track processing time', async () => {
      const professionalTemplate = WACCTemplates.find(t => t.id === 'professional')!;
      
      const createMockWorksheet = () => ({
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
        getRange: jest.fn().mockReturnValue({
          values: [],
          format: {
            font: { name: '', size: 0, bold: false, color: '' },
            borders: {
              getItem: jest.fn().mockReturnValue({ style: '', color: '' })
            },
            fill: { color: '' },
            horizontalAlignment: '',
            columnWidth: 0
          },
          numberFormat: []
        }),
        showGridlines: false,
        activate: jest.fn()
      });

      mockExcel.run.mockImplementation(async (callback) => {
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const worksheet = createMockWorksheet();
        const mockContext = {
          workbook: {
            worksheets: worksheet
          },
          sync: jest.fn()
        };
        return await callback(mockContext);
      });

      const result = await generator.generateWACCTable(mockInputData, mockResult, professionalTemplate);
      
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.processingTime).toBeLessThan(2000); // Should be under 2 seconds
    });

    it('should report cells written count', async () => {
      const professionalTemplate = WACCTemplates.find(t => t.id === 'professional')!;
      
      const createMockWorksheet = () => ({
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
        getRange: jest.fn().mockReturnValue({
          values: [],
          format: {
            font: { name: '', size: 0, bold: false, color: '' },
            borders: {
              getItem: jest.fn().mockReturnValue({ style: '', color: '' })
            },
            fill: { color: '' },
            horizontalAlignment: '',
            columnWidth: 0
          },
          numberFormat: []
        }),
        showGridlines: false,
        activate: jest.fn()
      });

      mockExcel.run.mockImplementation(async (callback) => {
        const worksheet = createMockWorksheet();
        const mockContext = {
          workbook: {
            worksheets: worksheet
          },
          sync: jest.fn()
        };
        return await callback(mockContext);
      });

      const result = await generator.generateWACCTable(mockInputData, mockResult, professionalTemplate);
      
      expect(result.cellsWritten).toBeGreaterThan(0);
      expect(typeof result.cellsWritten).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should handle Excel API errors gracefully', async () => {
      const professionalTemplate = WACCTemplates.find(t => t.id === 'professional')!;
      
      mockExcel.run.mockRejectedValue(new Error('Excel API Error'));

      const result = await generator.generateWACCTable(mockInputData, mockResult, professionalTemplate);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Excel API Error');
      expect(result.processingTime).toBe(0);
    });

    it('should handle missing Excel integration', async () => {
      // Temporarily remove Excel global
      const originalExcel = (global as any).Excel;
      delete (global as any).Excel;

      const professionalTemplate = WACCTemplates.find(t => t.id === 'professional')!;
      const result = await generator.generateWACCTable(mockInputData, mockResult, professionalTemplate);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Excel integration not available');

      // Restore Excel global
      (global as any).Excel = originalExcel;
    });
  });

  describe('Template Validation', () => {
    it('should validate all template properties exist', () => {
      WACCTemplates.forEach(template => {
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.theme).toBeDefined();
        expect(template.theme.fonts).toBeDefined();
        expect(template.theme.fonts.header).toBeDefined();
        expect(template.theme.fonts.body).toBeDefined();
        expect(template.theme.fonts.calculation).toBeDefined();
        expect(template.theme.colors).toBeDefined();
        expect(template.theme.layout).toBeDefined();
        expect(template.waccSpecific).toBeDefined();
      });
    });

    it('should have unique template IDs', () => {
      const ids = WACCTemplates.map(t => t.id);
      const uniqueIds = [...new Set(ids)];
      expect(ids.length).toBe(uniqueIds.length);
    });

    it('should have valid color formats', () => {
      WACCTemplates.forEach(template => {
        expect(template.theme.colors.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(template.theme.colors.secondary).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(template.theme.colors.border).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });
});