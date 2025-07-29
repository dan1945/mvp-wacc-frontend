/**
 * Excel Data Reader
 * Advanced bidirectional sync for WACC data with Excel worksheets
 * Cross-platform compatible with intelligent error recovery
 */

import { WACCInputData, BuildUpModelItem, CostOfDebtItem, WeightDataItem } from '@types/wacc';

export interface ExcelReadResult {
  success: boolean;
  data: WACCInputData | null;
  message: string;
  worksheetFound: boolean;
  dataIntegrity: DataIntegrityReport;
}

export interface DataIntegrityReport {
  isValid: boolean;
  missingFields: string[];
  inconsistentData: string[];
  warnings: string[];
}

export interface ExcelRangeData {
  range: string;
  values: any[][];
  isEmpty: boolean;
}

/**
 * Excel Data Reader with advanced cross-platform support
 */
export class ExcelDataReader {
  private readonly WACC_RANGES = {
    BUILD_UP_MODEL: 'B6:C10',
    COST_OF_EQUITY: 'C11',
    COST_OF_DEBT_TABLE1: 'E6:F7',
    COST_OF_DEBT_CALC1: 'F8',
    COST_OF_DEBT_TABLE2: 'E10:F11',
    COST_OF_DEBT_CALC2: 'F12',
    WEIGHT_DATA: 'C21:C22',
    TAX_RATE: 'C25',
    FINAL_WACC: 'C27',
    CAPITAL_STRUCTURE: 'G21:J23'
  };

  /**
   * Read WACC data from Excel worksheet with comprehensive validation
   */
  async readWACCData(): Promise<ExcelReadResult> {
    try {
      // Check if Excel is available
      if (typeof Excel === 'undefined' || !Excel.run) {
        return {
          success: false,
          data: null,
          message: 'Excel integration not available',
          worksheetFound: false,
          dataIntegrity: this.createEmptyIntegrityReport()
        };
      }

      return await Excel.run(async (context) => {
        // Check if WACC worksheet exists
        const worksheet = context.workbook.worksheets.getItemOrNullObject('WACC');
        await context.sync();

        if (worksheet.isNullObject) {
          return {
            success: false,
            data: null,
            message: 'WACC worksheet not found',
            worksheetFound: false,
            dataIntegrity: this.createEmptyIntegrityReport()
          };
        }

        // Read all relevant ranges
        const rangeData = await this.readAllRanges(worksheet, context);
        
        // Validate and convert data
        const validationResult = this.validateRangeData(rangeData);
        if (!validationResult.isValid) {
          return {
            success: false,
            data: null,
            message: `Data validation failed: ${validationResult.missingFields.join(', ')}`,
            worksheetFound: true,
            dataIntegrity: validationResult
          };
        }

        // Convert Excel data to WACCInputData format
        const waccData = this.convertToWACCInputData(rangeData);
        
        return {
          success: true,
          data: waccData,
          message: 'WACC data read successfully',
          worksheetFound: true,
          dataIntegrity: validationResult
        };
      });

    } catch (error) {
      console.error('Excel data reading failed:', error);
      return {
        success: false,
        data: null,
        message: `Read error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        worksheetFound: false,
        dataIntegrity: this.createEmptyIntegrityReport()
      };
    }
  }

  /**
   * Read specific ranges with error handling
   */
  private async readAllRanges(
    worksheet: Excel.Worksheet, 
    context: Excel.RequestContext
  ): Promise<Map<string, ExcelRangeData>> {
    const rangeData = new Map<string, ExcelRangeData>();

    // Read all ranges in batch for performance
    const rangeReads = Object.entries(this.WACC_RANGES).map(async ([key, range]) => {
      try {
        const cellRange = worksheet.getRange(range);
        cellRange.load(['values', 'address']);
        return { key, range, cellRange };
      } catch (error) {
        console.warn(`Failed to load range ${range}:`, error);
        return { key, range, cellRange: null };
      }
    });

    const rangeReferences = await Promise.all(rangeReads);
    await context.sync();

    // Process loaded ranges
    for (const { key, range, cellRange } of rangeReferences) {
      if (cellRange && !cellRange.isNullObject) {
        const values = cellRange.values || [];
        rangeData.set(key, {
          range,
          values,
          isEmpty: this.isRangeEmpty(values)
        });
      } else {
        rangeData.set(key, {
          range,
          values: [],
          isEmpty: true
        });
      }
    }

    return rangeData;
  }

  /**
   * Validate range data integrity
   */
  private validateRangeData(rangeData: Map<string, ExcelRangeData>): DataIntegrityReport {
    const report: DataIntegrityReport = {
      isValid: true,
      missingFields: [],
      inconsistentData: [],
      warnings: []
    };

    // Check for required ranges
    const requiredRanges = ['BUILD_UP_MODEL', 'COST_OF_DEBT_TABLE1', 'COST_OF_DEBT_TABLE2'];
    for (const rangeName of requiredRanges) {
      const range = rangeData.get(rangeName);
      if (!range || range.isEmpty) {
        report.missingFields.push(rangeName);
        report.isValid = false;
      }
    }

    // Validate Build Up Model data
    const buildUpData = rangeData.get('BUILD_UP_MODEL');
    if (buildUpData && !buildUpData.isEmpty) {
      if (buildUpData.values.length !== 5) {
        report.inconsistentData.push('Build Up Model should have exactly 5 rows');
      }
      
      // Check for numeric values in second column
      for (let i = 0; i < buildUpData.values.length; i++) {
        const row = buildUpData.values[i];
        if (row.length < 2 || typeof row[1] !== 'number') {
          report.warnings.push(`Build Up Model row ${i + 1} has invalid value`);
        }
      }
    }

    // Validate Cost of Debt data
    const costOfDebtTable1 = rangeData.get('COST_OF_DEBT_TABLE1');
    const costOfDebtTable2 = rangeData.get('COST_OF_DEBT_TABLE2');
    
    if (costOfDebtTable1 && costOfDebtTable1.values.length !== 2) {
      report.inconsistentData.push('First Cost of Debt table should have 2 rows');
    }
    
    if (costOfDebtTable2 && costOfDebtTable2.values.length !== 2) {
      report.inconsistentData.push('Second Cost of Debt table should have 2 rows');
    }

    // Check for calculation consistency
    this.validateCalculationConsistency(rangeData, report);

    return report;
  }

  /**
   * Validate calculation consistency
   */
  private validateCalculationConsistency(
    rangeData: Map<string, ExcelRangeData>, 
    report: DataIntegrityReport
  ): void {
    // Check if calculated values are reasonable
    const finalWACC = rangeData.get('FINAL_WACC');
    if (finalWACC && !finalWACC.isEmpty) {
      const waccValue = finalWACC.values[0]?.[0];
      if (typeof waccValue === 'number') {
        if (waccValue < 0 || waccValue > 1) {
          report.warnings.push('WACC value appears to be outside normal range (0-100%)');
        }
      }
    }

    // Check weight data consistency
    const weightData = rangeData.get('WEIGHT_DATA');
    if (weightData && !weightData.isEmpty && weightData.values.length >= 2) {
      const debtWeight = weightData.values[0]?.[0];
      const equityWeight = weightData.values[1]?.[0];
      
      if (typeof debtWeight === 'number' && typeof equityWeight === 'number') {
        const total = debtWeight + equityWeight;
        if (Math.abs(total - 1.0) > 0.01) {
          report.warnings.push('Debt and Equity weights do not sum to 100%');
        }
      }
    }
  }

  /**
   * Convert Excel range data to WACCInputData
   */
  private convertToWACCInputData(rangeData: Map<string, ExcelRangeData>): WACCInputData {
    // Build Up Model conversion
    const buildUpModel: BuildUpModelItem[] = [];
    const buildUpData = rangeData.get('BUILD_UP_MODEL');
    if (buildUpData && !buildUpData.isEmpty) {
      for (const row of buildUpData.values) {
        if (row.length >= 2 && row[0] && typeof row[1] === 'number') {
          buildUpModel.push({
            name: String(row[0]),
            value: row[1] * 100 // Convert from decimal to percentage
          });
        }
      }
    }

    // Ensure we have 5 build-up model items (pad with defaults if needed)
    while (buildUpModel.length < 5) {
      buildUpModel.push({
        name: `Item ${buildUpModel.length + 1}`,
        value: 0
      });
    }

    // Cost of Debt conversion
    const costOfDebtCalculations: CostOfDebtItem[] = [];
    
    // First table
    const costOfDebtTable1 = rangeData.get('COST_OF_DEBT_TABLE1');
    if (costOfDebtTable1 && !costOfDebtTable1.isEmpty) {
      for (const row of costOfDebtTable1.values) {
        if (row.length >= 2 && row[0] && typeof row[1] === 'number') {
          costOfDebtCalculations.push({
            name: String(row[0]),
            value: row[1] * 100 // Convert percentage to our format
          });
        }
      }
    }

    // Second table
    const costOfDebtTable2 = rangeData.get('COST_OF_DEBT_TABLE2');
    if (costOfDebtTable2 && !costOfDebtTable2.isEmpty) {
      for (const row of costOfDebtTable2.values) {
        if (row.length >= 2 && row[0] && typeof row[1] === 'number') {
          costOfDebtCalculations.push({
            name: String(row[0]),
            value: row[1] // Keep as currency value
          });
        }
      }
    }

    // Ensure we have 4 cost of debt items
    while (costOfDebtCalculations.length < 4) {
      costOfDebtCalculations.push({
        name: `Cost Item ${costOfDebtCalculations.length + 1}`,
        value: 0
      });
    }

    // Weight Data conversion
    let weightData: WeightDataItem = {
      weightOfDebt: 30, // Default values
      weightOfEquity: 70
    };

    const weightRangeData = rangeData.get('WEIGHT_DATA');
    if (weightRangeData && !weightRangeData.isEmpty && weightRangeData.values.length >= 2) {
      const debtWeight = weightRangeData.values[0]?.[0];
      const equityWeight = weightRangeData.values[1]?.[0];
      
      if (typeof debtWeight === 'number' && typeof equityWeight === 'number') {
        weightData = {
          weightOfDebt: debtWeight * 100, // Convert to percentage
          weightOfEquity: equityWeight * 100
        };
      }
    }

    // Tax Rate conversion
    let taxRate = 25; // Default 25%
    const taxRateData = rangeData.get('TAX_RATE');
    if (taxRateData && !taxRateData.isEmpty) {
      const taxValue = taxRateData.values[0]?.[0];
      if (typeof taxValue === 'number') {
        taxRate = taxValue * 100; // Convert to percentage
      }
    }

    // Determine selection type based on which calculation is being used
    // This is a heuristic - in practice, you might need additional indicators
    let waccBuildUpSelectionType: 1 | 2 = 1;
    const calc1 = rangeData.get('COST_OF_DEBT_CALC1');
    const calc2 = rangeData.get('COST_OF_DEBT_CALC2');
    
    if (calc2 && !calc2.isEmpty && calc1 && calc1.isEmpty) {
      waccBuildUpSelectionType = 2;
    }

    return {
      buildUpModel,
      costOfDebtCalculations,
      weightData,
      taxRate,
      waccBuildUpSelectionType,
      isWeightDataEdited: true // Assume edited if data exists
    };
  }

  /**
   * Check if range is empty or contains only null/undefined values
   */
  private isRangeEmpty(values: any[][]): boolean {
    if (!values || values.length === 0) return true;
    
    return values.every(row => 
      !row || row.length === 0 || row.every(cell => 
        cell === null || cell === undefined || cell === ''
      )
    );
  }

  /**
   * Create empty integrity report
   */
  private createEmptyIntegrityReport(): DataIntegrityReport {
    return {
      isValid: false,
      missingFields: ['WACC worksheet not found'],
      inconsistentData: [],
      warnings: []
    };
  }

  /**
   * Check if WACC worksheet exists
   */
  async checkWorksheetExists(): Promise<boolean> {
    try {
      if (typeof Excel === 'undefined' || !Excel.run) {
        return false;
      }

      return await Excel.run(async (context) => {
        const worksheet = context.workbook.worksheets.getItemOrNullObject('WACC');
        await context.sync();
        return !worksheet.isNullObject;
      });
    } catch (error) {
      console.error('Worksheet existence check failed:', error);
      return false;
    }
  }

  /**
   * Get worksheet statistics for debugging
   */
  async getWorksheetStats(): Promise<{
    exists: boolean;
    hasData: boolean;
    dataRanges: string[];
    lastModified?: Date;
  }> {
    try {
      if (typeof Excel === 'undefined' || !Excel.run) {
        return { exists: false, hasData: false, dataRanges: [] };
      }

      return await Excel.run(async (context) => {
        const worksheet = context.workbook.worksheets.getItemOrNullObject('WACC');
        await context.sync();

        if (worksheet.isNullObject) {
          return { exists: false, hasData: false, dataRanges: [] };
        }

        // Check which ranges have data
        const dataRanges: string[] = [];
        const rangeChecks = Object.entries(this.WACC_RANGES).map(async ([key, range]) => {
          try {
            const cellRange = worksheet.getRange(range);
            cellRange.load('values');
            return { key, range, cellRange };
          } catch (error) {
            return { key, range, cellRange: null };
          }
        });

        const ranges = await Promise.all(rangeChecks);
        await context.sync();

        for (const { key, range, cellRange } of ranges) {
          if (cellRange && !cellRange.isNullObject && !this.isRangeEmpty(cellRange.values)) {
            dataRanges.push(`${key}(${range})`);
          }
        }

        return {
          exists: true,
          hasData: dataRanges.length > 0,
          dataRanges,
          lastModified: new Date() // Would need additional API calls to get actual modification time
        };
      });
    } catch (error) {
      console.error('Worksheet stats failed:', error);
      return { exists: false, hasData: false, dataRanges: [] };
    }
  }
}