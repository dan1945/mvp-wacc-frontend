/**
 * WACC Calculator Type Definitions
 * Based on specifications from 05-wacc-requirements.md
 * Maintains 100% functional parity with legacy implementation
 */

// Core WACC Data Model Interfaces

export interface BuildUpModelItem {
  name: string; // e.g., "Risk-free Rate", "Beta Premium", etc.
  value: number; // As percentage (5.0 for 5%)
}

export interface CostOfDebtItem {
  name: string; // e.g., "Interest Expense", "Outstanding Debt", etc.
  value: number; // Currency amount or percentage based on context
}

export interface WeightDataItem {
  weightOfDebt: number; // As percentage (30.0 for 30%)
  weightOfEquity: number; // As percentage (70.0 for 70%)
}

// Legacy compatibility alias
export type WeightData = WeightDataItem;

/**
 * Main input data structure for WACC calculation
 * Replaces legacy waccInLineItem structure
 */
export interface WACCInputData {
  // Build Up Model section (replaces waccInLineItem.buildUpModel)
  buildUpModel: BuildUpModelItem[];
  
  // Cost of Debt section (replaces waccInLineItem.costofDebtCalculations)
  costOfDebtCalculations: CostOfDebtItem[];
  
  // Weight and tax information
  weightData: WeightDataItem;
  taxRate: number; // Percentage (0-100)
  
  // Selection and editing flags
  waccBuildUpSelectionType: 1 | 2; // Determines cost of debt calculation method
  isWeightDataEdited: boolean; // Manual weight input vs Excel calculation
}

// Calculation Result Interfaces

export interface CapitalStructureRow {
  component: 'Equity' | 'Debt' | 'Total';
  weight: number; // As decimal
  cost: number; // As decimal  
  extendedValue: number; // Calculated value
}

export interface PerformanceMetrics {
  calculationTime: number; // milliseconds
  excelGenerationTime: number; // milliseconds
}

/**
 * Complete WACC calculation result with supporting data
 */
export interface WACCResult {
  // Core calculation results
  costOfEquity: number; // Decimal (0.08 for 8%)
  costOfDebt: number; // Decimal (0.05 for 5%)
  weightOfDebt: number; // Decimal (0.30 for 30%)
  weightOfEquity: number; // Decimal (0.70 for 70%)
  taxRate: number; // Decimal (0.25 for 25%)
  weightedAverageCostOfCapital: number; // Final result
  
  // Supporting data for Excel generation
  buildUpModelData: Array<[string, number]>; // For B6:C10 range
  costOfDebtData: Array<[string, number]>; // For E6:F12 range
  capitalStructureTable: CapitalStructureRow[]; // For G20:J23 range
  
  // Metadata
  calculationTimestamp: Date;
  inputValidation: ValidationResult;
  performanceMetrics: PerformanceMetrics;
}

// Validation Interfaces

export interface ValidationError {
  field?: string;
  message: string;
  code: string;
  severity?: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface AccuracyValidationResult {
  isAccurate: boolean;
  accuracy: number;
  expectedValue: number;
  actualValue: number;
}

// Weight calculation helper interface

export interface WeightResult {
  weightOfDebt: number;
  weightOfEquity: number;
}

// Template System Interfaces

export interface FontStyle {
  name: string;
  size: number;
  bold?: boolean;
  color?: string;
  numberFormat?: string;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  border: string;
}

export interface LayoutConfig {
  sectionSpacing: number;
  columnWidths: number[];
  borderStyle: 'continuous' | 'thin' | 'medium';
}

export interface WACCSpecificConfig {
  highlightFinalWACC: boolean;
  showCalculationSteps: boolean;
  includeFormulas: boolean;
}

export interface WACCTheme {
  fonts: {
    header: FontStyle;
    body: FontStyle;
    calculation: FontStyle;
  };
  colors: ThemeColors;
  layout: LayoutConfig;
}

export interface WACCTemplate {
  id: string;
  name: string;
  description: string;
  theme: WACCTheme;
  waccSpecific: WACCSpecificConfig;
}

// Error Classes

export class WACCValidationError extends Error {
  public readonly errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super(`WACC validation failed: ${errors.map(e => e.message).join(', ')}`);
    this.name = 'WACCValidationError';
    this.errors = errors;
  }
}

export class WACCCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WACCCalculationError';
  }
}

// Utility Types

export type WACCBuildUpSelectionType = 1 | 2;

export interface DefaultWACCInput {
  buildUpModel: BuildUpModelItem[];
  costOfDebtCalculations: CostOfDebtItem[];
  weightData: WeightDataItem;
  waccBuildUpSelectionType: WACCBuildUpSelectionType;
  isWeightDataEdited: boolean;
  taxRate: number;
}

// Component Props Interfaces

export interface WACCCalculatorAppProps {
  // Support for theme switching based on Office host theme
  hostTheme?: 'light' | 'dark' | 'colorful';
  // Initial data loaded from Excel or local storage
  initialData?: WACCInputData;
  // Callback for application-level error handling
  onError?: (error: Error) => void;
}

export interface WACCInputWizardProps {
  data: WACCInputData;
  onChange: (data: WACCInputData) => void;
  validationErrors: ValidationError[];
  'aria-labelledby'?: string;
}

export interface WACCPreviewCardProps {
  result: WACCResult;
  isCalculating?: boolean;
}

export interface TemplateSelectionProps {
  selectedTemplate: WACCTemplate;
  onTemplateChange: (template: WACCTemplate) => void;
  templates: WACCTemplate[];
}

// Step component props

export interface StepComponentProps {
  data: WACCInputData;
  onChange: (data: WACCInputData) => void;
  validationErrors: ValidationError[];
  stepIndex?: number;
}

export interface BuildUpModelStepProps extends StepComponentProps {
  data: BuildUpModelItem[];
  onChange: (buildUpModel: BuildUpModelItem[]) => void;
}

export interface CostOfDebtStepProps extends StepComponentProps {
  data: CostOfDebtItem[];
  selectionType: WACCBuildUpSelectionType;
  onChange: (
    costOfDebtCalculations: CostOfDebtItem[], 
    waccBuildUpSelectionType: WACCBuildUpSelectionType
  ) => void;
}

export interface WeightTaxStepProps extends StepComponentProps {
  weightData: WeightDataItem;
  taxRate: number;
  isWeightDataEdited: boolean;
  onChange: (
    weightData: WeightDataItem, 
    taxRate: number, 
    isWeightDataEdited: boolean
  ) => void;
}

// Hook return types

export interface UseWACCCalculationReturn {
  calculationResult: WACCResult | null;
  isCalculating: boolean;
  calculationError: Error | null;
  calculationHistory: WACCResult[];
}

export interface UseLocalStorageReturn<T> {
  data: T | null;
  saveData: (value: T) => void;
  restoreData: () => T | null;
  clearData: () => void;
  isSupported: boolean;
}

export interface UseExcelIntegrationReturn {
  generateExcelTable: (result: WACCResult, template: WACCTemplate) => Promise<void>;
  readExcelData: () => Promise<WACCInputData | null>;
  writeExcelData: (data: WACCInputData) => Promise<void>;
  isExcelAvailable: boolean;
}

// Enhanced Excel Integration Types

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

export interface EnhancedUseExcelIntegrationReturn extends UseExcelIntegrationReturn {
  // Enhanced capabilities
  platformInfo: PlatformInfo | null;
  performanceMetrics: GenerationMetrics | null;
  syncStatus: 'idle' | 'reading' | 'writing' | 'syncing' | 'error';
  lastSyncTime: Date | null;
  connectionStatus: 'online' | 'offline' | 'unstable';
  
  // Enhanced methods
  checkWorksheetExists: () => Promise<boolean>;
  syncWithExcel: () => Promise<ExcelReadResult>;
  getWorksheetStats: () => Promise<any>;
  testConnection: () => Promise<boolean>;
  clearWorksheet: () => Promise<void>;
}

// Context Types

export interface WACCDataContextType {
  inputData: WACCInputData;
  validationErrors: ValidationError[];
  isDirty: boolean;
  lastSyncedWithExcel: Date | null;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  setInputData: (data: WACCInputData) => void;
  updateField: (field: string, value: any) => void;
  syncWithExcel: () => Promise<void>;
  resetToDefaults: () => void;
}

export interface AccessibilityContextType {
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  focusManagement: {
    focusElement: (element: HTMLElement) => void;
    trapFocus: (container: HTMLElement) => () => void;
    returnFocus: (previousElement: HTMLElement) => void;
  };
  keyboardNavigation: {
    handleEscapeKey: (callback: () => void) => (event: KeyboardEvent) => void;
    handleEnterSpace: (callback: () => void) => (event: KeyboardEvent) => void;
  };
}