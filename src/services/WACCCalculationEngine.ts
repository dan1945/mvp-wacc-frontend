/**
 * WACC Calculation Engine
 * Modern TypeScript implementation preserving existing business logic
 * Enhanced with caching and performance optimization
 */

import { z } from 'zod';
import { waccCalculationCache } from './CacheManager';

// Zod schemas for data validation
export const BuildUpModelItemSchema = z.object({
  name: z.string().min(1, 'Component name is required'),
  value: z.number().min(0, 'Value must be non-negative'),
});

export const CostOfDebtItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'), 
  value: z.number().min(0, 'Value must be non-negative'),
});

export const WeightDataSchema = z.object({
  weightOfDebt: z.number().min(0).max(100, 'Weight must be between 0 and 100'),
  weightOfEquity: z.number().min(0).max(100, 'Weight must be between 0 and 100'),
});

export const WACCInputDataSchema = z.object({
  buildUpModel: z.array(BuildUpModelItemSchema).min(1, 'At least one build-up component required'),
  costOfDebtCalculations: z.array(CostOfDebtItemSchema).min(4, 'Four cost of debt items required'),
  weightData: WeightDataSchema,
  waccBuildUpSelectionType: z.union([z.literal(1), z.literal(2)]),
  isWeightDataEdited: z.boolean(),
  taxRate: z.number().min(0).max(100, 'Tax rate must be between 0 and 100'),
});

// Type definitions
export type BuildUpModelItem = z.infer<typeof BuildUpModelItemSchema>;
export type CostOfDebtItem = z.infer<typeof CostOfDebtItemSchema>;
export type WeightData = z.infer<typeof WeightDataSchema>;
export type WACCInputData = z.infer<typeof WACCInputDataSchema>;

export interface CapitalStructureRow {
  component: 'Equity' | 'Debt' | 'Total';
  weight: number;
  cost: number | null;
  extendedValue: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface WACCResult {
  costOfEquity: number;
  costOfDebt: number;
  weightOfDebt: number;
  weightOfEquity: number;
  taxRate: number;
  weightedAverageCostOfCapital: number;
  capitalStructureTable: CapitalStructureRow[];
  calculationTimestamp: Date;
  inputValidation: ValidationResult;
  buildUpModelData?: Array<[string, number]>;
  costOfDebtData?: Array<[string, number]>;
  performanceMetrics?: {
    calculationTime: number;
    excelGenerationTime: number;
    cacheHit?: boolean;
    cacheKey?: string;
  };
}

export class ValidationError extends Error {
  constructor(public errors: string[]) {
    super(`Validation failed: ${errors.join(', ')}`);
    this.name = 'ValidationError';
  }
}

/**
 * Modern WACC Calculation Engine
 * Preserves existing business logic from legacy wacc.js
 */
export class WACCCalculationEngine {
  /**
   * Main WACC calculation method preserving existing business logic
   * from /ExcelAddInWeb/Scripts/Excel-Repository/wacc.js
   * Enhanced with intelligent caching
   */
  async calculateWACC(input: WACCInputData): Promise<WACCResult> {
    const startTime = performance.now();
    
    // Check cache first for performance optimization
    const cachedResult = await waccCalculationCache.getCachedCalculation(input);
    if (cachedResult) {
      // Update performance metrics with cache hit
      cachedResult.performanceMetrics = {
        ...cachedResult.performanceMetrics,
        calculationTime: performance.now() - startTime,
        cacheHit: true,
      };
      return cachedResult;
    }
    
    // Validate input using Zod schemas
    const validationResult = this.validateInput(input);
    if (!validationResult.isValid) {
      throw new ValidationError(validationResult.errors);
    }

    try {
      // Build Up Model calculation (sum of buildUpModel values)
      const costOfEquity = this.calculateCostOfEquity(input.buildUpModel);
      
      // Cost of Debt calculation based on selection type
      const costOfDebt = this.calculateCostOfDebt(
        input.costOfDebtCalculations, 
        input.waccBuildUpSelectionType
      );

      // Weight calculations (from Excel data or manual input)
      const weights = this.calculateWeights(input.weightData, input.isWeightDataEdited);

      // Final WACC formula from legacy: =(C21*C24*(1-C25)+C22*C23)
      // Where: C21=weightOfDebt, C24=costOfDebt, C25=taxRate, C22=weightOfEquity, C23=costOfEquity
      const taxRateDecimal = input.taxRate / 100;
      const weightOfEquityDecimal = weights.weightOfEquity / 100;
      const weightOfDebtDecimal = weights.weightOfDebt / 100;
      
      // Corrected WACC formula to match legacy exactly:
      // (weightOfDebt * costOfDebt * (1 - taxRate)) + (weightOfEquity * costOfEquity)
      const wacc = (weightOfDebtDecimal * costOfDebt * (1 - taxRateDecimal)) + 
                   (weightOfEquityDecimal * costOfEquity);

      // Generate capital structure table
      const capitalStructureTable = this.generateCapitalStructureTable(
        costOfEquity, 
        costOfDebt, 
        weights, 
        taxRateDecimal
      );

      const endTime = performance.now();

      const result: WACCResult = {
        costOfEquity,
        costOfDebt,
        weightOfDebt: weights.weightOfDebt,
        weightOfEquity: weights.weightOfEquity,
        taxRate: taxRateDecimal,
        weightedAverageCostOfCapital: wacc,
        capitalStructureTable,
        calculationTimestamp: new Date(),
        inputValidation: validationResult,
        buildUpModelData: input.buildUpModel.map(item => [item.name, item.value]),
        costOfDebtData: input.costOfDebtCalculations.map(item => [item.name, item.value]),
        performanceMetrics: {
          calculationTime: endTime - startTime,
          excelGenerationTime: 0,
          cacheHit: false
        }
      };

      // Cache the result for future use
      await waccCalculationCache.cacheCalculation(input, result);

      return result;
    } catch (error) {
      throw new Error(`WACC calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate cost of equity from build-up model components
   * Preserves legacy formula: =ROUND(SUM(C6:C10),3)
   * Legacy calls: SetValueInWACCTableByRange(sheet, "B6:C10", waccInLineItem.buildUpModel, true)
   * Where applyPercentage=true means ALL values are divided by 100
   */
  private calculateCostOfEquity(buildUpModel: BuildUpModelItem[]): number {
    const sum = buildUpModel.reduce((acc, item) => {
      // Legacy logic: ALL build-up model values are treated as percentages (value / 100)
      const value = item.value / 100;
      return acc + value;
    }, 0);
    
    // Apply legacy rounding to 3 decimal places
    return Math.round(sum * 1000) / 1000;
  }

  /**
   * Calculate cost of debt based on selection type
   * Preserves legacy formulas: =ROUND(SUM(F6:F7),3) and =ROUND(F10/F11,3)
   */
  private calculateCostOfDebt(
    costOfDebtItems: CostOfDebtItem[], 
    selectionType: 1 | 2
  ): number {
    if (costOfDebtItems.length < 4) {
      throw new Error('Cost of debt calculation requires at least 4 items');
    }

    let result: number;

    if (selectionType === 1) {
      // Legacy: =ROUND(SUM(F6:F7),3) - Sum of first two items
      const value1 = costOfDebtItems[0]?.value || 0;
      const value2 = costOfDebtItems[1]?.value || 0;
      const sum = value1 + value2;
      // Convert percentage to decimal and apply legacy rounding
      result = Math.round((sum / 100) * 1000) / 1000;
    } else {
      // Legacy: =ROUND(F10/F11,3) - Division calculation
      const numerator = costOfDebtItems[2]?.value || 0;
      const denominator = costOfDebtItems[3]?.value || 1;
      
      if (denominator === 0) {
        throw new Error('Cannot divide by zero in cost of debt calculation');
      }
      
      const division = numerator / denominator;
      // Apply legacy rounding to 3 decimal places
      result = Math.round(division * 1000) / 1000;
    }

    return result;
  }

  /**
   * Calculate or validate weight data
   */
  private calculateWeights(weightData: WeightData, isEdited: boolean): WeightData {
    if (isEdited) {
      // Validate that weights sum to 100%
      const total = weightData.weightOfDebt + weightData.weightOfEquity;
      if (Math.abs(total - 100) > 0.01) {
        throw new Error(`Weight of Debt and Weight of Equity must sum to 100%. Current total: ${total}%`);
      }
      return weightData;
    }
    
    // If not manually edited, use provided weights (could be calculated from Excel data)
    return weightData;
  }

  /**
   * Generate capital structure table for Excel output
   */
  private generateCapitalStructureTable(
    costOfEquity: number,
    costOfDebt: number,
    weights: WeightData,
    taxRate: number
  ): CapitalStructureRow[] {
    const weightOfEquityDecimal = weights.weightOfEquity / 100;
    const weightOfDebtDecimal = weights.weightOfDebt / 100;
    
    const equityExtendedValue = costOfEquity * weightOfEquityDecimal;
    const debtExtendedValue = costOfDebt * weightOfDebtDecimal * (1 - taxRate);
    const totalExtendedValue = equityExtendedValue + debtExtendedValue;

    return [
      {
        component: 'Equity',
        weight: weights.weightOfEquity,
        cost: costOfEquity,
        extendedValue: equityExtendedValue
      },
      {
        component: 'Debt',
        weight: weights.weightOfDebt,
        cost: costOfDebt * (1 - taxRate), // After-tax cost of debt
        extendedValue: debtExtendedValue
      },
      {
        component: 'Total',
        weight: 100,
        cost: null, // No single cost for total
        extendedValue: totalExtendedValue
      }
    ];
  }

  /**
   * Validate WACC input data using Zod schemas
   */
  private validateInput(input: WACCInputData): ValidationResult {
    try {
      WACCInputDataSchema.parse(input);
      
      // Additional business logic validation
      const errors: string[] = [];

      // Validate weight totals if manually edited
      if (input.isWeightDataEdited) {
        const totalWeight = input.weightData.weightOfDebt + input.weightData.weightOfEquity;
        if (Math.abs(totalWeight - 100) > 0.01) {
          errors.push('Weight of Debt and Weight of Equity must sum to 100%');
        }
      }

      // Validate build-up model components
      const negativeComponents = input.buildUpModel.filter(item => item.value < 0);
      if (negativeComponents.length > 0) {
        errors.push(`Negative values not allowed in build-up model: ${negativeComponents.map(c => c.name).join(', ')}`);
      }

      // Validate cost of debt items
      if (input.waccBuildUpSelectionType === 2) {
        const denominator = input.costOfDebtCalculations[3]?.value || 0;
        if (denominator === 0) {
          errors.push('Cannot divide by zero in cost of debt calculation');
        }
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      
      return {
        isValid: false,
        errors: ['Unknown validation error']
      };
    }
  }

  /**
   * Convert percentage value for input (preserves legacy logic)
   * Legacy function: GetPercentageValueForInputValue
   */
  private getPercentageValueForInputValue(value: number | null | undefined): number {
    if (value !== null && value !== undefined) {
      // Legacy: eval(+value / 100) - convert percentage to decimal
      return +value / 100;
    } else {
      return 0;
    }
  }

  /**
   * Round to 3 decimal places (preserves legacy ROUND function)
   */
  private roundToThreeDecimals(value: number): number {
    return Math.round(value * 1000) / 1000;
  }

  /**
   * Create sample WACC input data for testing
   */
  static createSampleData(): WACCInputData {
    return {
      buildUpModel: [
        { name: 'Risk-free Rate', value: 3.5 },
        { name: 'Market Risk Premium', value: 6.0 },
        { name: 'Beta', value: 1.2 },
        { name: 'Size Premium', value: 2.0 },
        { name: 'Company-specific Risk', value: 1.0 }
      ],
      costOfDebtCalculations: [
        { name: 'Interest Expense', value: 2.5 },
        { name: 'Additional Premium', value: 1.5 },
        { name: 'Total Interest', value: 4.0 },
        { name: 'Total Debt', value: 100.0 }
      ],
      weightData: {
        weightOfDebt: 40,
        weightOfEquity: 60
      },
      waccBuildUpSelectionType: 1,
      isWeightDataEdited: false,
      taxRate: 25
    };
  }
}