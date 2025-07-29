/**
 * WACC Calculator Default Values and Utilities
 * Provides default data structures and helper functions
 */

import { WACCInputData, BuildUpModelItem, CostOfDebtItem, WeightDataItem } from '@types/wacc';

/**
 * Default Build Up Model components for Cost of Equity calculation
 * Based on common financial modeling practices
 */
export const DEFAULT_BUILD_UP_MODEL: BuildUpModelItem[] = [
  { name: 'Risk-free Rate', value: 0 },
  { name: 'Beta Premium', value: 0 },
  { name: 'Small Company Premium', value: 0 },
  { name: 'Company Specific Risk', value: 0 },
];

/**
 * Default Cost of Debt calculation items
 * Based on legacy implementation structure
 */
export const DEFAULT_COST_OF_DEBT_CALCULATIONS: CostOfDebtItem[] = [
  { name: 'Interest Expense', value: 0 },
  { name: 'Additional Cost', value: 0 },
  { name: 'Total Interest Expense', value: 0 },
  { name: 'Outstanding Debt', value: 0 },
];

/**
 * Default weight distribution for capital structure
 */
export const DEFAULT_WEIGHT_DATA: WeightDataItem = {
  weightOfDebt: 30,
  weightOfEquity: 70,
};

/**
 * Default tax rate (as percentage)
 */
export const DEFAULT_TAX_RATE = 25;

/**
 * Default WACC build up selection type
 * 1 = Sum method (F6+F7)
 * 2 = Division method (F10/F11)
 */
export const DEFAULT_WACC_BUILDUP_SELECTION_TYPE = 1 as const;

/**
 * Generate complete default WACC input data
 * @returns Complete WACCInputData with all default values
 */
export function getDefaultWACCInput(): WACCInputData {
  return {
    buildUpModel: [...DEFAULT_BUILD_UP_MODEL],
    costOfDebtCalculations: [...DEFAULT_COST_OF_DEBT_CALCULATIONS],
    weightData: { ...DEFAULT_WEIGHT_DATA },
    waccBuildUpSelectionType: DEFAULT_WACC_BUILDUP_SELECTION_TYPE,
    isWeightDataEdited: true,
    taxRate: DEFAULT_TAX_RATE,
  };
}

/**
 * Create a new Build Up Model item with default structure
 * @param name Item name
 * @param value Item value (as percentage)
 * @returns BuildUpModelItem
 */
export function createBuildUpModelItem(name: string, value: number = 0): BuildUpModelItem {
  return { name, value };
}

/**
 * Create a new Cost of Debt item with default structure
 * @param name Item name
 * @param value Item value
 * @returns CostOfDebtItem
 */
export function createCostOfDebtItem(name: string, value: number = 0): CostOfDebtItem {
  return { name, value };
}

/**
 * Validate that weights sum to 100%
 * @param weightData Weight data to validate
 * @param tolerance Acceptable tolerance (default: 0.01)
 * @returns true if weights are valid
 */
export function validateWeightSum(
  weightData: WeightDataItem, 
  tolerance: number = 0.01
): boolean {
  const total = weightData.weightOfDebt + weightData.weightOfEquity;
  return Math.abs(total - 100) <= tolerance;
}

/**
 * Normalize weights to sum to 100%
 * @param weightData Weight data to normalize
 * @returns Normalized weight data
 */
export function normalizeWeights(weightData: WeightDataItem): WeightDataItem {
  const total = weightData.weightOfDebt + weightData.weightOfEquity;
  
  if (total === 0) {
    return DEFAULT_WEIGHT_DATA;
  }
  
  return {
    weightOfDebt: (weightData.weightOfDebt / total) * 100,
    weightOfEquity: (weightData.weightOfEquity / total) * 100,
  };
}

/**
 * Convert percentage to decimal
 * @param percentage Percentage value (5.0 for 5%)
 * @returns Decimal value (0.05 for 5%)
 */
export function percentageToDecimal(percentage: number): number {
  return percentage / 100;
}

/**
 * Convert decimal to percentage
 * @param decimal Decimal value (0.05 for 5%)
 * @returns Percentage value (5.0 for 5%)
 */
export function decimalToPercentage(decimal: number): number {
  return decimal * 100;
}

/**
 * Round number to specified decimal places
 * @param value Number to round
 * @param decimals Number of decimal places (default: 3)
 * @returns Rounded number
 */
export function roundToDecimals(value: number, decimals: number = 3): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Format number as percentage string
 * @param value Decimal value
 * @param decimals Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export function formatAsPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format number as currency string
 * @param value Currency value
 * @param currency Currency code (default: 'USD')
 * @param decimals Number of decimal places (default: 0)
 * @returns Formatted currency string
 */
export function formatAsCurrency(
  value: number, 
  currency: string = 'USD', 
  decimals: number = 0
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Deep clone WACC input data to avoid mutations
 * @param data WACC input data to clone
 * @returns Deep cloned data
 */
export function cloneWACCInputData(data: WACCInputData): WACCInputData {
  return {
    buildUpModel: data.buildUpModel.map(item => ({ ...item })),
    costOfDebtCalculations: data.costOfDebtCalculations.map(item => ({ ...item })),
    weightData: { ...data.weightData },
    waccBuildUpSelectionType: data.waccBuildUpSelectionType,
    isWeightDataEdited: data.isWeightDataEdited,
    taxRate: data.taxRate,
  };
}

/**
 * Check if WACC input data has any non-zero values
 * @param data WACC input data to check
 * @returns true if data has meaningful values
 */
export function hasSignificantData(data: WACCInputData): boolean {
  const hasBuildUpData = data.buildUpModel.some(item => item.value !== 0);
  const hasCostOfDebtData = data.costOfDebtCalculations.some(item => item.value !== 0);
  const hasWeightData = data.weightData.weightOfDebt !== 0 || data.weightData.weightOfEquity !== 0;
  const hasTaxRate = data.taxRate !== 0;
  
  return hasBuildUpData || hasCostOfDebtData || hasWeightData || hasTaxRate;
}

/**
 * Reset specific section of WACC data to defaults
 * @param data Current WACC input data
 * @param section Section to reset
 * @returns Updated WACC input data
 */
export function resetWACCSection(
  data: WACCInputData, 
  section: 'buildUpModel' | 'costOfDebt' | 'weights' | 'all'
): WACCInputData {
  const cloned = cloneWACCInputData(data);
  
  switch (section) {
    case 'buildUpModel':
      cloned.buildUpModel = [...DEFAULT_BUILD_UP_MODEL];
      break;
    case 'costOfDebt':
      cloned.costOfDebtCalculations = [...DEFAULT_COST_OF_DEBT_CALCULATIONS];
      cloned.waccBuildUpSelectionType = DEFAULT_WACC_BUILDUP_SELECTION_TYPE;
      break;
    case 'weights':
      cloned.weightData = { ...DEFAULT_WEIGHT_DATA };
      cloned.taxRate = DEFAULT_TAX_RATE;
      cloned.isWeightDataEdited = true;
      break;
    case 'all':
      return getDefaultWACCInput();
  }
  
  return cloned;
}

/**
 * Sample WACC data for demonstration purposes
 */
export const SAMPLE_WACC_DATA: WACCInputData = {
  buildUpModel: [
    { name: 'Risk-free Rate', value: 2.5 },
    { name: 'Beta Premium', value: 5.0 },
    { name: 'Small Company Premium', value: 3.0 },
    { name: 'Company Specific Risk', value: 2.0 },
  ],
  costOfDebtCalculations: [
    { name: 'Interest Expense', value: 4.5 },
    { name: 'Additional Cost', value: 0.5 },
    { name: 'Total Interest Expense', value: 500000 },
    { name: 'Outstanding Debt', value: 10000000 },
  ],
  weightData: {
    weightOfDebt: 40,
    weightOfEquity: 60,
  },
  waccBuildUpSelectionType: 1,
  isWeightDataEdited: true,
  taxRate: 21,
};

/**
 * Validation rules for WACC input data
 */
export const WACC_VALIDATION_RULES = {
  buildUpModel: {
    minItems: 1,
    maxItems: 10,
    minValue: 0,
    maxValue: 100,
  },
  costOfDebt: {
    requiredItems: 4,
    minValue: 0,
  },
  weights: {
    minValue: 0,
    maxValue: 100,
    sumMustEqual: 100,
    tolerance: 0.01,
  },
  taxRate: {
    minValue: 0,
    maxValue: 100,
  },
} as const;