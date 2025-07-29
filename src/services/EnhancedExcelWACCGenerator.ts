/**
 * Enhanced Excel WACC Table Generator
 * Advanced Office.js integration with cross-platform compatibility and error recovery
 * Features:
 * - Modern Excel.run() patterns with proper error handling
 * - Cross-platform compatibility (Windows, Mac, Online, Mobile)
 * - Intelligent retry logic for network issues
 * - Optimized batch operations for performance
 * - Platform-specific feature detection
 */

import { WACCResult, WACCInputData } from './WACCCalculationEngine';
import { WACCTemplate, FontStyle, LayoutConfig } from '@types/wacc';

export interface ExcelGenerationResult {
  success: boolean;
  worksheetName: string;
  message: string;
  cellsWritten: number;
  processingTime: number;
  platformInfo?: PlatformInfo;
  performanceMetrics?: GenerationMetrics;
}

export interface PlatformInfo {
  platform: 'Windows' | 'Mac' | 'Online' | 'Mobile' | 'Unknown';
  version: string;
  apiVersion: string;
  capabilities: string[];
}

export interface GenerationMetrics {
  totalTime: number;
  syncOperations: number;
  batchOperations: number;
  retryAttempts: number;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * Enhanced Template Formatter with cross-platform optimization
 */
class EnhancedTemplateFormatter {
  private template: WACCTemplate;
  private worksheet: Excel.Worksheet;
  private batchOperations: Array<() => void> = [];
  private platformInfo: PlatformInfo;

  constructor(template: WACCTemplate, worksheet: Excel.Worksheet, platformInfo: PlatformInfo) {
    this.template = template;
    this.worksheet = worksheet;
    this.platformInfo = platformInfo;
  }

  /**
   * Apply font formatting with platform-specific optimizations
   */
  applyFontStyle(range: string, fontType: 'header' | 'body' | 'calculation'): void {
    const fontConfig = this.template.theme.fonts[fontType];
    this.batchOperations.push(() => {
      const cellRange = this.worksheet.getRange(range);
      
      // Apply basic formatting available on all platforms
      cellRange.format.font.name = fontConfig.name;
      cellRange.format.font.size = fontConfig.size;
      
      if (fontConfig.bold) {
        cellRange.format.font.bold = true;
      }
      
      // Apply color only if supported (not on mobile Excel)
      if (fontConfig.color && this.platformInfo.capabilities.includes('colorFormatting')) {
        cellRange.format.font.color = fontConfig.color;
      }
      
      // Apply number format with platform fallbacks
      if (fontConfig.numberFormat) {
        try {
          cellRange.numberFormat = [[fontConfig.numberFormat]];
        } catch (error) {
          // Fallback to basic percentage format on limited platforms
          if (fontType === 'calculation') {
            cellRange.numberFormat = [['0.0%']];
          }
        }
      }
    });
  }

  /**
   * Apply border style with platform compatibility checks
   */
  applyBorderStyle(range: string): void {
    const borderStyle = this.template.theme.layout.borderStyle;
    this.batchOperations.push(() => {
      const cellRange = this.worksheet.getRange(range);
      const excelBorderStyle = this.getExcelBorderStyle(borderStyle);
      
      // Apply borders only if supported
      if (this.platformInfo.capabilities.includes('borderFormatting')) {
        try {
          cellRange.format.borders.getItem('EdgeTop').style = excelBorderStyle;
          cellRange.format.borders.getItem('EdgeBottom').style = excelBorderStyle;
          cellRange.format.borders.getItem('EdgeLeft').style = excelBorderStyle;
          cellRange.format.borders.getItem('EdgeRight').style = excelBorderStyle;
        } catch (error) {
          console.warn(`Border formatting not supported: ${error}`);
        }
      }
    });
  }

  /**
   * Apply WACC result highlighting with platform-specific handling
   */
  applyWACCHighlight(range: string): void {
    if (!this.template.waccSpecific.highlightFinalWACC) return;

    this.batchOperations.push(() => {
      const cellRange = this.worksheet.getRange(range);
      
      // Enhanced highlighting for desktop platforms
      if (this.platformInfo.platform === 'Windows' || this.platformInfo.platform === 'Mac') {
        cellRange.format.font.bold = true;
        if (this.platformInfo.capabilities.includes('colorFormatting')) {
          cellRange.format.fill.color = this.template.theme.colors.primary;
          cellRange.format.font.color = '#FFFFFF';
        }
      } else {
        // Simplified highlighting for web/mobile
        cellRange.format.font.bold = true;
      }
    });
  }

  /**
   * Set column widths with mobile optimization
   */
  applyColumnWidths(): void {
    const widths = this.template.theme.layout.columnWidths;
    
    // Skip on mobile Excel to preserve auto-width behavior
    if (this.platformInfo.platform === 'Mobile') {
      return;
    }

    this.batchOperations.push(() => {
      widths.forEach((width, index) => {
        try {
          const columnLetter = String.fromCharCode(66 + index); // B, C, D, E...
          this.worksheet.getRange(`${columnLetter}:${columnLetter}`).format.columnWidth = width;
        } catch (error) {
          console.warn(`Column width setting not supported: ${error}`);
        }
      });
    });
  }

  /**
   * Execute all batched operations with performance tracking
   */
  async executeBatch(): Promise<number> {
    const operationCount = this.batchOperations.length;
    
    try {
      // Execute all operations in batch for performance
      this.batchOperations.forEach(operation => operation());
      this.batchOperations = []; // Clear batch
      return operationCount;
    } catch (error) {
      console.error('Batch operation failed:', error);
      this.batchOperations = []; // Clear batch even on error
      throw error;
    }
  }

  /**
   * Convert template border style to Excel format with fallbacks
   */
  private getExcelBorderStyle(style: string): Excel.BorderLineStyle {
    try {
      switch (style) {
        case 'thin': return Excel.BorderLineStyle.thin;
        case 'medium': return Excel.BorderLineStyle.medium;
        case 'continuous':
        default: return Excel.BorderLineStyle.continuous;
      }
    } catch (error) {
      // Fallback for platforms with limited border support
      return Excel.BorderLineStyle.continuous;
    }
  }

  /**
   * Detect platform capabilities
   */
  static detectPlatformCapabilities(): PlatformInfo {
    try {
      const context = Office.context;
      let platform: PlatformInfo['platform'] = 'Unknown';
      const capabilities: string[] = [];
      
      // Detect platform
      if (context.platform === Office.PlatformType.PC) {
        platform = 'Windows';
      } else if (context.platform === Office.PlatformType.Mac) {
        platform = 'Mac';
      } else if (context.platform === Office.PlatformType.OfficeOnline) {
        platform = 'Online';
      } else if (context.platform === Office.PlatformType.iOS || 
                 context.platform === Office.PlatformType.Android) {
        platform = 'Mobile';
      }

      // Detect capabilities based on platform and API version
      const requirements = context.requirements;
      
      // Basic capabilities available on all platforms
      capabilities.push('basicFormatting', 'formulas', 'numberFormats');
      
      // Advanced capabilities
      if (platform !== 'Mobile') {
        capabilities.push('colorFormatting', 'borderFormatting', 'columnResizing');
      }
      
      if (requirements.isSetSupported('ExcelApi', '1.2')) {
        capabilities.push('autoFit', 'conditionalFormatting');
      }
      
      if (requirements.isSetSupported('ExcelApi', '1.4')) {
        capabilities.push('advancedFormatting', 'chartAPI');
      }

      return {
        platform,
        version: context.diagnostics.version,
        apiVersion: requirements.isSetSupported('ExcelApi', '1.8') ? '1.8+' : '1.1',
        capabilities
      };
    } catch (error) {
      console.warn('Platform detection failed:', error);
      return {
        platform: 'Unknown',
        version: 'Unknown',
        apiVersion: '1.1',
        capabilities: ['basicFormatting']
      };
    }
  }
}

/**
 * Enhanced Excel WACC Generator with advanced Office.js patterns
 */
export class EnhancedExcelWACCGenerator {
  private readonly retryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 2.0
  };

  private platformInfo: PlatformInfo | null = null;
  private performanceMetrics: GenerationMetrics = {
    totalTime: 0,
    syncOperations: 0,
    batchOperations: 0,
    retryAttempts: 0
  };

  /**
   * Generate WACC table with advanced error handling and retry logic
   */
  async generateWACCTable(
    input: WACCInputData, 
    result: WACCResult,
    template: WACCTemplate
  ): Promise<ExcelGenerationResult> {
    const startTime = performance.now();
    this.performanceMetrics = { totalTime: 0, syncOperations: 0, batchOperations: 0, retryAttempts: 0 };

    // Detect platform capabilities
    this.platformInfo = EnhancedTemplateFormatter.detectPlatformCapabilities();

    try {
      // Check if Excel is available
      if (typeof Excel === 'undefined' || !Excel.run) {
        throw new Error('Excel integration not available');
      }

      // Execute with retry logic
      const result = await this.executeWithRetry(async () => {
        return await this.generateWACCTableInternal(input, result, template);
      });

      const endTime = performance.now();
      this.performanceMetrics.totalTime = endTime - startTime;

      return {
        ...result,
        platformInfo: this.platformInfo,
        performanceMetrics: this.performanceMetrics
      };
    } catch (error) {
      console.error('Excel WACC generation failed after retries:', error);
      const endTime = performance.now();
      
      return {
        success: false,
        worksheetName: 'WACC',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        cellsWritten: 0,
        processingTime: endTime - startTime,
        platformInfo: this.platformInfo,
        performanceMetrics: this.performanceMetrics
      };
    }
  }

  /**
   * Internal generation method with modern Excel.run patterns
   */
  private async generateWACCTableInternal(
    input: WACCInputData,
    result: WACCResult,
    template: WACCTemplate
  ): Promise<ExcelGenerationResult> {
    return await Excel.run(async (context) => {
      let cellsWritten = 0;

      // Enhanced worksheet management
      const worksheet = await this.getOrCreateWorksheet(context, 'WACC');
      this.performanceMetrics.syncOperations++;

      // Generate content with batch operations
      cellsWritten += await this.generateHeaders(worksheet);
      cellsWritten += await this.generateBuildUpModel(worksheet, input.buildUpModel);
      cellsWritten += await this.generateCostOfDebt(worksheet, input.costOfDebtCalculations, input.waccBuildUpSelectionType);
      cellsWritten += await this.generateWeightedAverage(worksheet, input, result);
      cellsWritten += await this.generateCapitalStructure(worksheet, result);

      // Apply formatting with enhanced template system
      const formatter = new EnhancedTemplateFormatter(template, worksheet, this.platformInfo!);
      await this.applyEnhancedFormatting(worksheet, formatter, input, result);
      
      // Final optimizations
      await this.applyFinalOptimizations(worksheet);

      // Single sync for all operations
      await context.sync();
      this.performanceMetrics.syncOperations++;

      return {
        success: true,
        worksheetName: 'WACC',
        message: `WACC table generated successfully with ${template.name} template (${this.platformInfo?.platform})`,
        cellsWritten,
        processingTime: 0 // Will be set by caller
      };
    });
  }

  /**
   * Enhanced worksheet management with error recovery
   */
  private async getOrCreateWorksheet(context: Excel.RequestContext, name: string): Promise<Excel.Worksheet> {
    try {
      // Try to get existing worksheet
      let worksheet = context.workbook.worksheets.getItemOrNullObject(name);
      await context.sync();
      
      if (worksheet.isNullObject) {
        // Create new worksheet
        worksheet = context.workbook.worksheets.add(name);
        await context.sync();
      } else {
        // Clear existing content efficiently
        await this.clearWorksheetContent(worksheet, context);
      }
      
      return worksheet;
    } catch (error) {
      console.error('Worksheet management error:', error);
      throw new Error(`Failed to manage worksheet '${name}': ${error}`);
    }
  }

  /**
   * Efficient worksheet clearing with batch operations
   */
  private async clearWorksheetContent(worksheet: Excel.Worksheet, context: Excel.RequestContext): Promise<void> {
    try {
      const usedRange = worksheet.getUsedRange();
      usedRange.load('address');
      await context.sync();
      
      if (!usedRange.isNullObject) {
        // Clear content and formatting in one operation
        usedRange.clear(Excel.ClearApplyTo.all);
        this.performanceMetrics.batchOperations++;
      }
    } catch (error) {
      // Fallback: clear cell by cell if batch clear fails
      console.warn('Batch clear failed, using fallback method:', error);
      worksheet.getRange('A1:Z100').clear(Excel.ClearApplyTo.all);
    }
  }

  /**
   * Execute operation with intelligent retry logic
   */
  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.performanceMetrics.retryAttempts++;

        // Don't retry on certain error types
        if (this.isNonRetryableError(lastError)) {
          throw lastError;
        }

        // Don't delay on last attempt
        if (attempt < this.retryConfig.maxAttempts) {
          const delay = Math.min(
            this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
            this.retryConfig.maxDelay
          );
          
          console.warn(`Operation failed, retrying in ${delay}ms (attempt ${attempt}/${this.retryConfig.maxAttempts}):`, lastError.message);
          await this.delay(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Check if error should not be retried
   */
  private isNonRetryableError(error: Error): boolean {
    const nonRetryableMessages = [
      'Excel integration not available',
      'Invalid range',
      'Permission denied',
      'Unsupported operation'
    ];

    return nonRetryableMessages.some(msg => error.message.includes(msg));
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Optimized content generation methods
  private async generateHeaders(worksheet: Excel.Worksheet): Promise<number> {
    // Use batch value setting for better performance
    const headerRanges = [
      { range: "B3", values: [["Table to Calculate WACC"]], bold: true },
      { range: "B5", values: [["Build Up Model"]], bold: true },
      { range: "E5", values: [["Cost of Debt Calculations"]], bold: true },
      { range: "B17", values: [["Weighted Average Cost of Capital Calculations"]], bold: true }
    ];

    headerRanges.forEach(({ range, values, bold }) => {
      const cellRange = worksheet.getRange(range);
      cellRange.values = values;
      if (bold) cellRange.format.font.bold = true;
    });

    this.performanceMetrics.batchOperations++;
    return headerRanges.length;
  }

  private async generateBuildUpModel(worksheet: Excel.Worksheet, buildUpModel: Array<{name: string, value: number}>): Promise<number> {
    const values = buildUpModel.map(item => [item.name, item.value / 100]);
    worksheet.getRange("B6:C10").values = values;
    worksheet.getRange("B11:C11").values = [["Cost of Equity", "=ROUND(SUM(C6:C10),3)"]];
    
    this.performanceMetrics.batchOperations++;
    return buildUpModel.length + 1;
  }

  private async generateCostOfDebt(
    worksheet: Excel.Worksheet, 
    costOfDebtItems: Array<{name: string, value: number}>,
    selectionType: 1 | 2
  ): Promise<number> {
    // First table
    const firstTableData = [
      [costOfDebtItems[0].name, costOfDebtItems[0].value / 100],
      [costOfDebtItems[1].name, costOfDebtItems[1].value / 100]
    ];
    worksheet.getRange("E6:F7").values = firstTableData;
    worksheet.getRange("E8:F8").values = [["Cost of Debt", "=ROUND(SUM(F6:F7),3)"]];
    
    // Second table
    const secondTableData = [
      [costOfDebtItems[2].name, costOfDebtItems[2].value],
      [costOfDebtItems[3].name, costOfDebtItems[3].value]
    ];
    worksheet.getRange("E10:F11").values = secondTableData;
    worksheet.getRange("E12:F12").values = [["Cost of Debt", "=ROUND(F10/F11,3)"]];
    
    this.performanceMetrics.batchOperations += 2;
    return 6;
  }

  private async generateWeightedAverage(
    worksheet: Excel.Worksheet,
    input: WACCInputData,
    result: WACCResult
  ): Promise<number> {
    const costOfDebtFormula = input.waccBuildUpSelectionType === 1 ? "=F8" : "=F12";
    
    const weightAverageTable = [
      ["Equity", `='Adjusted BS'!${this.getEquityReference()}`],
      ["Interest Accruing Debt Outstanding", "=F11"],
      ["Total IAD + Equity", "=SUM(C18:C19)"],
      ["Weight of Debt", input.isWeightDataEdited ? input.weightData.weightOfDebt / 100 : "=C19/C20"],
      ["Weight of Equity", input.isWeightDataEdited ? input.weightData.weightOfEquity / 100 : "=C18/C20"],
      ["Cost Of Equity", "=C11"],
      ["Cost Of Debt", costOfDebtFormula],
      ["Tax Rate", input.taxRate / 100]
    ];
    
    worksheet.getRange("B18:C25").values = weightAverageTable;
    worksheet.getRange("B27:C27").values = [["Weighted Average Cost of Capital", "=(C21*C24*(1-C25)+C22*C23)"]];
    
    this.performanceMetrics.batchOperations++;
    return 9;
  }

  private async generateCapitalStructure(worksheet: Excel.Worksheet, result: WACCResult): Promise<number> {
    // Headers
    worksheet.getRange("G20:J20").values = [["Capital Structure", "Weight", "Cost", "Extended Value"]];
    
    // Data rows
    const capitalStructureData = [
      ["Equity", "=C18", "=C22", "=C11", "=H21*I21"],
      ["Debt", "=C19", "=C21", "=C24", `=H22*I22*(1-${result.taxRate})`],
      ["Total", "=SUM(G21:G22)", "=SUM(H21:H22)", "", "=SUM(J21:J22)"]
    ];
    
    worksheet.getRange("F21:J23").values = capitalStructureData;
    
    this.performanceMetrics.batchOperations++;
    return 7;
  }

  private async applyEnhancedFormatting(
    worksheet: Excel.Worksheet, 
    formatter: EnhancedTemplateFormatter,
    input: WACCInputData, 
    result: WACCResult
  ): Promise<void> {
    // Apply all formatting through the enhanced formatter
    formatter.applyFontStyle("B3", "header");
    formatter.applyFontStyle("B5", "header");
    formatter.applyFontStyle("E5", "header");
    formatter.applyFontStyle("B17", "header");
    formatter.applyFontStyle("G20:J20", "header");
    
    // Body formatting
    formatter.applyFontStyle("B6:B27", "body");
    formatter.applyFontStyle("E6:E12", "body");
    formatter.applyFontStyle("F21:F23", "body");
    
    // Calculation formatting
    formatter.applyFontStyle("C6:C27", "calculation");
    formatter.applyFontStyle("F6:F12", "calculation");
    formatter.applyFontStyle("H21:J23", "calculation");
    
    // Borders
    const borderRanges = ["B6:C10", "B11:C11", "E6:F7", "E8:F8", "E10:F11", "E12:F12", "B18:C27", "G21:J23"];
    borderRanges.forEach(range => formatter.applyBorderStyle(range));
    
    // WACC highlighting
    formatter.applyWACCHighlight("B27:C27");
    
    // Column widths
    formatter.applyColumnWidths();
    
    // Execute all batch operations
    const operationsCount = await formatter.executeBatch();
    this.performanceMetrics.batchOperations += operationsCount;
    
    // Apply number formats (platform-optimized)
    await this.applyNumberFormats(worksheet);
  }

  private async applyNumberFormats(worksheet: Excel.Worksheet): Promise<void> {
    try {
      // Apply percentage formats
      const percentageRanges = [
        "C6:C11", "F6:F8", "F12", "C21:C27", "H21:J23"
      ];
      
      percentageRanges.forEach(range => {
        try {
          worksheet.getRange(range).numberFormat = [["0.0%"]];
        } catch (error) {
          console.warn(`Number format failed for range ${range}:`, error);
        }
      });
      
      // Apply currency formats
      const currencyRanges = [
        { range: "C18:C20", decimals: 3 },
        { range: "F10:F11", decimals: 2 },
        { range: "G21:G23", decimals: 3 }
      ];
      
      currencyRanges.forEach(({ range, decimals }) => {
        try {
          const format = decimals === 2 ? "$#,##0.00" : "$#,##0.000";
          worksheet.getRange(range).numberFormat = [[format]];
        } catch (error) {
          console.warn(`Currency format failed for range ${range}:`, error);
        }
      });
      
      // Right alignment for calculations
      const alignmentRanges = ["C6:C27", "F6:F12", "H21:J23"];
      alignmentRanges.forEach(range => {
        try {
          worksheet.getRange(range).format.horizontalAlignment = "Right";
        } catch (error) {
          console.warn(`Alignment failed for range ${range}:`, error);
        }
      });
      
    } catch (error) {
      console.warn('Number formatting partially failed:', error);
    }
  }

  private async applyFinalOptimizations(worksheet: Excel.Worksheet): Promise<void> {
    try {
      // Auto-fit columns if supported
      if (this.platformInfo?.capabilities.includes('autoFit')) {
        const usedRange = worksheet.getUsedRange();
        if (usedRange) {
          usedRange.format.autofitColumns();
          usedRange.format.autofitRows();
        }
      }
      
      // Hide gridlines if not on mobile
      if (this.platformInfo?.platform !== 'Mobile') {
        worksheet.showGridlines = false;
      }
      
      // Activate worksheet
      worksheet.activate();
      
    } catch (error) {
      console.warn('Final optimizations partially failed:', error);
    }
  }

  private getEquityReference(): string {
    // Placeholder implementation
    return "A1";
  }
}