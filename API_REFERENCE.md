# WACC Calculator - API Reference

## Table of Contents
1. [API Overview](#api-overview)
2. [Core Calculation API](#core-calculation-api)
3. [Excel Integration API](#excel-integration-api)
4. [React Hooks API](#react-hooks-api)
5. [Component API](#component-api)
6. [Service APIs](#service-apis)
7. [Type Definitions](#type-definitions)
8. [Error Handling](#error-handling)
9. [Performance Monitoring](#performance-monitoring)
10. [Examples and Usage](#examples-and-usage)

---

## API Overview

The WACC Calculator provides a comprehensive set of APIs organized into several layers:

### Architecture Layers
```
┌─────────────────────────────────────────────────────┐
│                Component API                        │
│  React Components with Props and Event Handlers    │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│                Hook API                             │
│     Custom React Hooks for State Management        │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│               Service API                           │
│   Business Logic Services and Utility Functions    │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│                Data API                             │
│      Type Definitions and Data Structures          │
└─────────────────────────────────────────────────────┘
```

### API Design Principles
- **Type Safety**: All APIs are fully typed with TypeScript
- **Async/Await**: Asynchronous operations use modern async/await patterns
- **Error Handling**: Comprehensive error types and handling strategies
- **Performance**: Optimized for high-performance financial calculations
- **Extensibility**: Designed for easy extension and customization

---

## Core Calculation API

### WACCCalculationEngine

The main calculation engine for WACC computations.

#### Class: `WACCCalculationEngine`

##### Constructor
```typescript
constructor(options?: EngineOptions)
```

**Parameters:**
- `options?: EngineOptions` - Optional configuration

```typescript
interface EngineOptions {
  cache?: CacheManager;
  performanceMonitor?: PerformanceMonitor;
  validator?: ZodValidator;
  precision?: number; // Default: 3 decimal places
}
```

**Example:**
```typescript
const engine = new WACCCalculationEngine({
  precision: 4,
  cache: new CacheManager({ maxSize: 100 })
});
```

##### Methods

###### `calculateWACC(input: WACCInputData): Promise<WACCResult>`

Performs complete WACC calculation with validation and caching.

**Parameters:**
- `input: WACCInputData` - Complete input data structure

**Returns:** `Promise<WACCResult>` - Calculation result with metadata

**Throws:**
- `WACCValidationError` - Invalid input data
- `WACCCalculationError` - Calculation failure

**Example:**
```typescript
try {
  const result = await engine.calculateWACC({
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
  });

  console.log(`WACC: ${(result.weightedAverageCostOfCapital * 100).toFixed(2)}%`);
  console.log(`Cost of Equity: ${(result.costOfEquity * 100).toFixed(2)}%`);
  console.log(`Cost of Debt: ${(result.costOfDebt * 100).toFixed(2)}%`);
} catch (error) {
  if (error instanceof WACCValidationError) {
    console.error('Validation errors:', error.errors);
  } else {
    console.error('Calculation failed:', error.message);
  }
}
```

###### `createSampleData(): WACCInputData`

Creates sample input data for testing and demonstrations.

**Returns:** `WACCInputData` - Complete sample data structure

**Example:**
```typescript
const sampleData = WACCCalculationEngine.createSampleData();
const result = await engine.calculateWACC(sampleData);
```

###### `validateInput(input: WACCInputData): ValidationResult`

Validates input data without performing calculation.

**Parameters:**
- `input: WACCInputData` - Input data to validate

**Returns:** `ValidationResult` - Validation result with errors

**Example:**
```typescript
const validation = engine.validateInput(inputData);
if (!validation.isValid) {
  validation.errors.forEach(error => {
    console.error(`${error.field}: ${error.message}`);
  });
}
```

#### Calculation Methods (Internal)

These methods are exposed for advanced usage and testing:

###### `calculateCostOfEquity(buildUpModel: BuildUpModelItem[]): number`

Calculates cost of equity from build-up model components.

**Legacy Formula:** `=ROUND(SUM(C6:C10),3)`

**Parameters:**
- `buildUpModel: BuildUpModelItem[]` - Risk components

**Returns:** `number` - Cost of equity as decimal (0.137 for 13.7%)

**Example:**
```typescript
const costOfEquity = engine['calculateCostOfEquity']([
  { name: 'Risk-free Rate', value: 3.5 },
  { name: 'Market Risk Premium', value: 6.0 },
  { name: 'Beta', value: 1.2 }
]);
// Result: 0.107 (10.7%)
```

###### `calculateCostOfDebt(items: CostOfDebtItem[], selectionType: 1 | 2): number`

Calculates cost of debt using selected method.

**Legacy Formulas:**
- Method 1: `=ROUND(SUM(F6:F7),3)` (Additive)
- Method 2: `=ROUND(F10/F11,3)` (Ratio)

**Parameters:**
- `items: CostOfDebtItem[]` - Cost components
- `selectionType: 1 | 2` - Calculation method

**Returns:** `number` - Cost of debt as decimal

**Example:**
```typescript
// Method 1: Additive
const costOfDebt1 = engine['calculateCostOfDebt']([
  { name: 'Base Rate', value: 4.0 },
  { name: 'Credit Spread', value: 1.5 },
  { name: 'Unused', value: 0 },
  { name: 'Unused', value: 0 }
], 1);
// Result: 0.055 (5.5%)

// Method 2: Ratio
const costOfDebt2 = engine['calculateCostOfDebt']([
  { name: 'Unused', value: 0 },
  { name: 'Unused', value: 0 },
  { name: 'Interest Expense', value: 50000 },
  { name: 'Total Debt', value: 1000000 }
], 2);
// Result: 0.05 (5.0%)
```

---

## Excel Integration API

### EnhancedExcelWACCGenerator

Advanced Excel integration with cross-platform support and retry logic.

#### Class: `EnhancedExcelWACCGenerator`

##### Constructor
```typescript
constructor(options?: GeneratorOptions)
```

**Parameters:**
- `options?: GeneratorOptions` - Configuration options

```typescript
interface GeneratorOptions {
  platformInfo?: PlatformInfo;
  retryConfig?: RetryConfig;
  performanceMonitor?: PerformanceMonitor;
}

interface RetryConfig {
  maxAttempts: number;      // Default: 3
  baseDelay: number;        // Default: 1000ms
  maxDelay: number;         // Default: 5000ms
  backoffMultiplier: number; // Default: 2.0
}
```

##### Methods

###### `generateWACCTable(input: WACCInputData, result: WACCResult, template: WACCTemplate): Promise<ExcelGenerationResult>`

Generates formatted WACC table in Excel with platform adaptation.

**Parameters:**
- `input: WACCInputData` - Original calculation input
- `result: WACCResult` - Calculation results
- `template: WACCTemplate` - Formatting template

**Returns:** `Promise<ExcelGenerationResult>` - Generation result with metrics

**Example:**
```typescript
const generator = new EnhancedExcelWACCGenerator();
const professionalTemplate = WACCTemplates.find(t => t.id === 'professional');

try {
  const generationResult = await generator.generateWACCTable(
    inputData,
    calculationResult,
    professionalTemplate
  );

  if (generationResult.success) {
    console.log(`Generated in ${generationResult.generationTime}ms`);
    console.log(`Sync operations: ${generationResult.syncOperations}`);
    console.log(`Retry attempts: ${generationResult.retryAttempts}`);
  } else {
    console.error('Generation failed:', generationResult.error);
  }
} catch (error) {
  console.error('Excel generation error:', error);
}
```

###### `detectPlatformCapabilities(): PlatformInfo`

Detects current Excel platform and available capabilities.

**Returns:** `PlatformInfo` - Platform details and feature support

**Example:**
```typescript
const platformInfo = EnhancedExcelWACCGenerator.detectPlatformCapabilities();

console.log(`Platform: ${platformInfo.platform}`);
console.log(`Version: ${platformInfo.version}`);
console.log(`API Version: ${platformInfo.apiVersion}`);
console.log('Capabilities:', platformInfo.capabilities);

// Conditional feature usage
if (platformInfo.capabilities.includes('colorFormatting')) {
  // Use advanced color schemes
} else {
  // Fall back to basic formatting
}
```

###### `executeWithRetry<T>(operation: () => Promise<T>): Promise<T>`

Executes Excel operations with intelligent retry logic.

**Parameters:**
- `operation: () => Promise<T>` - Excel operation to execute

**Returns:** `Promise<T>` - Operation result

**Example:**
```typescript
const result = await generator.executeWithRetry(async () => {
  return Excel.run(async (context) => {
    const worksheet = context.workbook.worksheets.getActiveWorksheet();
    const range = worksheet.getRange('A1:C10');
    range.load('values');
    await context.sync();
    return range.values;
  });
});
```

### ExcelDataReader

Reads and validates WACC data from existing Excel worksheets.

#### Class: `ExcelDataReader`

##### Methods

###### `readWACCData(): Promise<ExcelReadResult>`

Reads and validates complete WACC data from Excel.

**Returns:** `Promise<ExcelReadResult>` - Read result with validation

**Example:**
```typescript
const reader = new ExcelDataReader();

try {
  const readResult = await reader.readWACCData();
  
  if (readResult.success && readResult.data) {
    console.log('Data read successfully');
    
    // Check data integrity
    if (readResult.dataIntegrity.isValid) {
      // Use the data
      const calculationResult = await engine.calculateWACC(readResult.data);
    } else {
      console.warn('Data integrity issues:', readResult.dataIntegrity.warnings);
    }
  } else {
    console.error('Failed to read data:', readResult.message);
  }
} catch (error) {
  console.error('Excel read error:', error);
}
```

###### `checkWorksheetExists(): Promise<boolean>`

Checks if a WACC worksheet exists in the current workbook.

**Returns:** `Promise<boolean>` - True if worksheet found

**Example:**
```typescript
const worksheetExists = await reader.checkWorksheetExists();
if (worksheetExists) {
  const data = await reader.readWACCData();
}
```

###### `getWorksheetStats(): Promise<WorksheetStats>`

Retrieves statistics about the current worksheet.

**Returns:** `Promise<WorksheetStats>` - Worksheet information

**Example:**
```typescript
const stats = await reader.getWorksheetStats();
console.log(`Worksheet: ${stats.name}`);
console.log(`Rows: ${stats.rowCount}, Columns: ${stats.columnCount}`);
console.log(`Last modified: ${stats.lastModified}`);
```

---

## React Hooks API

### useEnhancedExcelIntegration

Enhanced Excel integration hook with advanced features.

#### Hook: `useEnhancedExcelIntegration()`

**Returns:** `EnhancedUseExcelIntegrationReturn`

```typescript
interface EnhancedUseExcelIntegrationReturn {
  // Core methods
  generateExcelTable: (result: WACCResult, template: WACCTemplate) => Promise<void>;
  readExcelData: () => Promise<WACCInputData | null>;
  writeExcelData: (data: WACCInputData) => Promise<void>;
  isExcelAvailable: boolean;
  
  // Enhanced properties
  platformInfo: PlatformInfo | null;
  performanceMetrics: GenerationMetrics | null;
  syncStatus: 'idle' | 'reading' | 'writing' | 'syncing' | 'error';
  lastSyncTime: Date | null;
  connectionStatus: 'online' | 'offline' | 'unstable';
  
  // Enhanced methods
  checkWorksheetExists: () => Promise<boolean>;
  syncWithExcel: () => Promise<ExcelReadResult>;
  getWorksheetStats: () => Promise<WorksheetStats>;
  testConnection: () => Promise<boolean>;
  clearWorksheet: () => Promise<void>;
}
```

**Example:**
```typescript
const ExcelIntegratedWACCCalculator: React.FC = () => {
  const {
    generateExcelTable,
    readExcelData,
    platformInfo,
    syncStatus,
    connectionStatus,
    syncWithExcel,
    testConnection
  } = useEnhancedExcelIntegration();

  const [inputData, setInputData] = useState<WACCInputData>(getDefaultWACCInput());
  const [calculationResult, setCalculationResult] = useState<WACCResult | null>(null);

  // Handle Excel data synchronization
  const handleSyncWithExcel = useCallback(async () => {
    try {
      const syncResult = await syncWithExcel();
      if (syncResult.success && syncResult.data) {
        setInputData(syncResult.data);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }, [syncWithExcel]);

  // Test connection on mount
  useEffect(() => {
    testConnection().then(isConnected => {
      console.log('Excel connection:', isConnected ? 'available' : 'unavailable');
    });
  }, [testConnection]);

  // Generate Excel table
  const handleGenerateTable = useCallback(async () => {
    if (!calculationResult) return;

    try {
      await generateExcelTable(calculationResult, WACCTemplates[0]);
      console.log('Excel table generated successfully');
    } catch (error) {
      console.error('Failed to generate Excel table:', error);
    }
  }, [generateExcelTable, calculationResult]);

  return (
    <div>
      <div>Platform: {platformInfo?.platform}</div>
      <div>Sync Status: {syncStatus}</div>
      <div>Connection: {connectionStatus}</div>
      
      <button onClick={handleSyncWithExcel}>Sync with Excel</button>
      <button onClick={handleGenerateTable}>Generate Excel Table</button>
    </div>
  );
};
```

### useOptimizedWACC

Performance-optimized WACC calculation hook with caching and memoization.

#### Hook: `useOptimizedWACC(inputData: WACCInputData)`

**Parameters:**
- `inputData: WACCInputData` - Input data for calculation

**Returns:** `UseOptimizedWACCReturn`

```typescript
interface UseOptimizedWACCReturn {
  calculationResult: WACCResult | null;
  isCalculating: boolean;
  calculationError: Error | null;
  calculationHistory: WACCResult[];
  selectors: WACCSelectors;
  performanceMetrics: PerformanceMetrics | null;
}

interface WACCSelectors {
  getCostOfEquity: () => number | null;
  getCostOfDebt: () => number | null;
  getWACC: () => number | null;
  getWeightOfDebt: () => number | null;
  getWeightOfEquity: () => number | null;
  getCapitalStructureTable: () => CapitalStructureRow[] | null;
}
```

**Example:**
```typescript
const OptimizedWACCCalculator: React.FC<{ inputData: WACCInputData }> = ({ inputData }) => {
  const {
    calculationResult,
    isCalculating,
    calculationError,
    selectors,
    performanceMetrics
  } = useOptimizedWACC(inputData);

  // Use memoized selectors to prevent unnecessary re-renders
  const costOfEquity = selectors.getCostOfEquity();
  const wacc = selectors.getWACC();
  const capitalStructure = selectors.getCapitalStructureTable();

  if (isCalculating) {
    return <LoadingSpinner message="Calculating WACC..." />;
  }

  if (calculationError) {
    return <ErrorMessage error={calculationError} />;
  }

  return (
    <div>
      <div>Cost of Equity: {costOfEquity ? `${(costOfEquity * 100).toFixed(2)}%` : 'N/A'}</div>
      <div>WACC: {wacc ? `${(wacc * 100).toFixed(2)}%` : 'N/A'}</div>
      
      {performanceMetrics && (
        <div>Calculation Time: {performanceMetrics.calculationTime}ms</div>
      )}
      
      {capitalStructure && (
        <CapitalStructureTable data={capitalStructure} />
      )}
    </div>
  );
};
```

### useWACCCalculation

Basic WACC calculation hook.

#### Hook: `useWACCCalculation(inputData: WACCInputData)`

**Parameters:**
- `inputData: WACCInputData` - Input data for calculation

**Returns:** `UseWACCCalculationReturn`

```typescript
interface UseWACCCalculationReturn {
  calculationResult: WACCResult | null;
  isCalculating: boolean;
  calculationError: Error | null;
  recalculate: () => void;
}
```

**Example:**
```typescript
const BasicWACCCalculator: React.FC = () => {
  const [inputData, setInputData] = useState<WACCInputData>(getDefaultWACCInput());
  const { calculationResult, isCalculating, calculationError, recalculate } = useWACCCalculation(inputData);

  const handleInputChange = (newData: WACCInputData) => {
    setInputData(newData);
    // Calculation automatically triggers on input change
  };

  const handleManualRecalculate = () => {
    recalculate();
  };

  return (
    <div>
      <WACCInputForm data={inputData} onChange={handleInputChange} />
      
      {calculationResult && (
        <WACCResultDisplay result={calculationResult} />
      )}
      
      <button onClick={handleManualRecalculate} disabled={isCalculating}>
        {isCalculating ? 'Calculating...' : 'Recalculate'}
      </button>
    </div>
  );
};
```

### useLocalStorage

Local storage hook for data persistence.

#### Hook: `useLocalStorage<T>(key: string, initialValue: T)`

**Parameters:**
- `key: string` - Storage key
- `initialValue: T` - Default value

**Returns:** `UseLocalStorageReturn<T>`

```typescript
interface UseLocalStorageReturn<T> {
  data: T | null;
  saveData: (value: T) => void;
  restoreData: () => T | null;
  clearData: () => void;
  isSupported: boolean;
}
```

**Example:**
```typescript
const PersistentWACCCalculator: React.FC = () => {
  const {
    data: savedInputData,
    saveData: saveInputData,
    clearData: clearSavedData,
    isSupported: isLocalStorageSupported
  } = useLocalStorage<WACCInputData>('wacc-input-data', getDefaultWACCInput());

  const [inputData, setInputData] = useState<WACCInputData>(
    savedInputData || getDefaultWACCInput()
  );

  // Auto-save input data changes
  useEffect(() => {
    if (isLocalStorageSupported) {
      saveInputData(inputData);
    }
  }, [inputData, saveInputData, isLocalStorageSupported]);

  const handleClearSavedData = () => {
    clearSavedData();
    setInputData(getDefaultWACCInput());
  };

  return (
    <div>
      <WACCInputForm data={inputData} onChange={setInputData} />
      
      {isLocalStorageSupported && (
        <button onClick={handleClearSavedData}>Clear Saved Data</button>
      )}
    </div>
  );
};
```

---

## Component API

### WACCCalculatorApp

Main application component with full feature set.

#### Component: `WACCCalculatorApp`

**Props:** `WACCCalculatorAppProps`

```typescript
interface WACCCalculatorAppProps {
  hostTheme?: 'light' | 'dark' | 'colorful';
  initialData?: WACCInputData;
  onError?: (error: Error) => void;
  onCalculationComplete?: (result: WACCResult) => void;
}
```

**Example:**
```typescript
const App: React.FC = () => {
  const handleError = (error: Error) => {
    console.error('WACC Calculator error:', error);
    // Show user-friendly error message
  };

  const handleCalculationComplete = (result: WACCResult) => {
    console.log('WACC calculated:', result.weightedAverageCostOfCapital);
    // Update parent component or trigger other actions
  };

  return (
    <WACCCalculatorApp
      hostTheme="light"
      initialData={getDefaultWACCInput()}
      onError={handleError}
      onCalculationComplete={handleCalculationComplete}
    />
  );
};
```

### WACCInputWizard

Step-by-step input wizard component.

#### Component: `WACCInputWizard`

**Props:** `WACCInputWizardProps`

```typescript
interface WACCInputWizardProps {
  data: WACCInputData;
  onChange: (data: WACCInputData) => void;
  validationErrors: ValidationError[];
  'aria-labelledby'?: string;
}
```

**Example:**
```typescript
const CustomWACCForm: React.FC = () => {
  const [inputData, setInputData] = useState<WACCInputData>(getDefaultWACCInput());
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const handleDataChange = (newData: WACCInputData) => {
    setInputData(newData);
    
    // Validate data and update errors
    const validation = validateWACCInput(newData);
    setValidationErrors(validation.errors);
  };

  return (
    <div>
      <h2 id="wizard-title">WACC Calculation Wizard</h2>
      <WACCInputWizard
        data={inputData}
        onChange={handleDataChange}
        validationErrors={validationErrors}
        aria-labelledby="wizard-title"
      />
    </div>
  );
};
```

### WACCPreviewCard

Real-time calculation preview component.

#### Component: `WACCPreviewCard`

**Props:** `WACCPreviewCardProps`

```typescript
interface WACCPreviewCardProps {
  result: WACCResult;
  isCalculating?: boolean;
  showPerformanceMetrics?: boolean;
  onResultClick?: (result: WACCResult) => void;
}
```

**Example:**
```typescript
const WACCDashboard: React.FC = () => {
  const [calculationResult, setCalculationResult] = useState<WACCResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleResultClick = (result: WACCResult) => {
    // Show detailed breakdown or export options
    console.log('Result clicked:', result);
  };

  return (
    <div>
      {calculationResult && (
        <WACCPreviewCard
          result={calculationResult}
          isCalculating={isCalculating}
          showPerformanceMetrics={true}
          onResultClick={handleResultClick}
        />
      )}
    </div>
  );
};
```

### TemplateSelector

Excel template selection component.

#### Component: `TemplateSelector`

**Props:** `TemplateSelectionProps`

```typescript
interface TemplateSelectionProps {
  selectedTemplate: WACCTemplate;
  onTemplateChange: (template: WACCTemplate) => void;
  templates: WACCTemplate[];
  disabled?: boolean;
}
```

**Example:**
```typescript
const ExcelOutputConfiguration: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<WACCTemplate>(WACCTemplates[0]);

  const handleTemplateChange = (template: WACCTemplate) => {
    setSelectedTemplate(template);
    console.log('Template selected:', template.name);
  };

  return (
    <div>
      <h3>Choose Excel Template</h3>
      <TemplateSelector
        selectedTemplate={selectedTemplate}
        onTemplateChange={handleTemplateChange}
        templates={WACCTemplates}
      />
      
      <div>
        <h4>Template Preview</h4>
        <p>{selectedTemplate.description}</p>
      </div>
    </div>
  );
};
```

---

## Service APIs

### CacheManager

Multi-tier caching service for performance optimization.

#### Class: `CacheManager`

##### Constructor
```typescript
constructor(config?: CacheConfig)
```

**Parameters:**
- `config?: CacheConfig` - Cache configuration

```typescript
interface CacheConfig {
  memoryLimit: number;      // Max items in memory cache
  ttl: number;             // Time to live in milliseconds
  maxSize: number;         // Max cache size in bytes
  enablePersistence: boolean; // Enable local storage persistence
}
```

##### Methods

###### `get<T>(key: string): Promise<T | null>`

Retrieves cached value with multi-tier lookup.

**Parameters:**
- `key: string` - Cache key

**Returns:** `Promise<T | null>` - Cached value or null

**Example:**
```typescript
const cache = new CacheManager();

// Store calculation result
await cache.set('wacc-result-123', calculationResult);

// Retrieve calculation result
const cachedResult = await cache.get<WACCResult>('wacc-result-123');
if (cachedResult) {
  console.log('Using cached result');
  return cachedResult;
}
```

###### `set<T>(key: string, value: T, ttl?: number): Promise<void>`

Stores value in cache with optional TTL override.

**Parameters:**
- `key: string` - Cache key
- `value: T` - Value to cache
- `ttl?: number` - Optional TTL override

**Returns:** `Promise<void>`

###### `clear(): Promise<void>`

Clears all cached data.

**Example:**
```typescript
// Clear cache when user logs out or switches contexts
await cache.clear();
```

###### `getStats(): CacheStats`

Returns cache performance statistics.

**Returns:** `CacheStats` - Cache performance metrics

```typescript
interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  memoryUsage: number;
  totalRequests: number;
}
```

**Example:**
```typescript
const stats = cache.getStats();
console.log(`Cache hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
console.log(`Memory usage: ${(stats.memoryUsage / 1024 / 1024).toFixed(1)} MB`);
```

### PerformanceMonitor

Performance tracking and optimization service.

#### Class: `PerformanceMonitor`

##### Methods

###### `markStart(operation: string): void`

Starts performance timing for an operation.

**Parameters:**
- `operation: string` - Operation name

**Example:**
```typescript
const monitor = new PerformanceMonitor();

monitor.markStart('wacc-calculation');
const result = await calculateWACC(inputData);
const duration = monitor.markEnd('wacc-calculation');

console.log(`Calculation completed in ${duration}ms`);
```

###### `markEnd(operation: string): number`

Ends performance timing and returns duration.

**Parameters:**
- `operation: string` - Operation name

**Returns:** `number` - Duration in milliseconds

###### `recordMetric(name: string, value: number): void`

Records a custom performance metric.

**Parameters:**
- `name: string` - Metric name
- `value: number` - Metric value

**Example:**
```typescript
// Record custom metrics
monitor.recordMetric('cache-hit-rate', 0.87);
monitor.recordMetric('memory-usage', 42.5);
monitor.recordMetric('user-satisfaction', 4.2);
```

###### `generateReport(timeWindow?: number): PerformanceReport`

Generates performance report for specified time window.

**Parameters:**
- `timeWindow?: number` - Time window in milliseconds (default: 1 hour)

**Returns:** `PerformanceReport` - Performance report

```typescript
interface PerformanceReport {
  timeWindow: number;
  totalOperations: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
  recommendations: string[];
}
```

**Example:**
```typescript
// Generate report for last 30 minutes
const report = monitor.generateReport(30 * 60 * 1000);

console.log('Performance Report:');
console.log(`Average response time: ${report.averageResponseTime}ms`);
console.log(`95th percentile: ${report.p95ResponseTime}ms`);
console.log(`Cache hit rate: ${(report.cacheHitRate * 100).toFixed(1)}%`);

if (report.recommendations.length > 0) {
  console.log('Recommendations:');
  report.recommendations.forEach(rec => console.log(`- ${rec}`));
}
```

### EnhancedExcelFormatter

CSS-like formatting service for Excel output.

#### Class: `EnhancedExcelFormatter`

##### Methods

###### `applyTheme(range: Excel.Range, theme: WACCTheme): Promise<void>`

Applies complete theme to Excel range.

**Parameters:**
- `range: Excel.Range` - Target range
- `theme: WACCTheme` - Theme configuration

**Returns:** `Promise<void>`

**Example:**
```typescript
const formatter = new EnhancedExcelFormatter();
const professionalTheme = WACCTemplates.find(t => t.id === 'professional').theme;

await Excel.run(async (context) => {
  const range = context.workbook.worksheets.getActiveWorksheet().getRange('A1:D10');
  await formatter.applyTheme(range, professionalTheme);
  await context.sync();
});
```

###### `createStyleRegistry(): StyleRegistry`

Creates reusable style registry for consistent formatting.

**Returns:** `StyleRegistry` - Style registry instance

**Example:**
```typescript
const styleRegistry = formatter.createStyleRegistry();

// Define reusable styles
styleRegistry.define('header-style', {
  font: { bold: true, size: 14, color: '#1f4e79' },
  fill: { color: '#f2f2f2' },
  border: { style: 'continuous', color: '#d0cece' }
});

styleRegistry.define('currency-style', {
  numberFormat: '$#,##0.00',
  alignment: { horizontal: 'right' }
});

// Apply styles
await Excel.run(async (context) => {
  const headerRange = context.workbook.worksheets.getActiveWorksheet().getRange('A1:D1');
  const dataRange = context.workbook.worksheets.getActiveWorksheet().getRange('A2:D10');
  
  styleRegistry.apply(headerRange, 'header-style');
  styleRegistry.apply(dataRange, 'currency-style');
  
  await context.sync();
});
```

---

## Type Definitions

### Core Data Types

#### WACCInputData
```typescript
interface WACCInputData {
  buildUpModel: BuildUpModelItem[];
  costOfDebtCalculations: CostOfDebtItem[];
  weightData: WeightDataItem;
  waccBuildUpSelectionType: 1 | 2;
  isWeightDataEdited: boolean;
  taxRate: number;
}
```

#### WACCResult
```typescript
interface WACCResult {
  costOfEquity: number;                          // As decimal (0.137 for 13.7%)
  costOfDebt: number;                           // As decimal (0.055 for 5.5%)
  weightOfDebt: number;                         // As percentage (40 for 40%)
  weightOfEquity: number;                       // As percentage (60 for 60%)
  taxRate: number;                             // As decimal (0.25 for 25%)
  weightedAverageCostOfCapital: number;        // Final WACC result
  capitalStructureTable: CapitalStructureRow[]; // For Excel output
  calculationTimestamp: Date;                   // When calculated
  inputValidation: ValidationResult;            // Validation status
  performanceMetrics?: PerformanceMetrics;     // Performance data
}
```

#### BuildUpModelItem
```typescript
interface BuildUpModelItem {
  name: string;    // Component name (e.g., "Risk-free Rate")
  value: number;   // As percentage (5.0 for 5%)
}
```

#### CostOfDebtItem
```typescript
interface CostOfDebtItem {
  name: string;    // Item name (e.g., "Interest Expense")
  value: number;   // Currency amount or percentage based on context
}
```

#### WeightDataItem
```typescript
interface WeightDataItem {
  weightOfDebt: number;    // As percentage (30 for 30%)
  weightOfEquity: number;  // As percentage (70 for 70%)
}
```

### Template System Types

#### WACCTemplate
```typescript
interface WACCTemplate {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  description: string;           // Template description
  theme: WACCTheme;             // Visual theme
  waccSpecific: WACCSpecificConfig; // WACC-specific settings
}
```

#### WACCTheme
```typescript
interface WACCTheme {
  fonts: {
    header: FontStyle;      // Header font configuration
    body: FontStyle;        // Body text font configuration
    calculation: FontStyle; // Calculation result font configuration
  };
  colors: ThemeColors;     // Color scheme
  layout: LayoutConfig;    // Layout configuration
}
```

#### FontStyle
```typescript
interface FontStyle {
  name: string;           // Font family name
  size: number;           // Font size in points
  bold?: boolean;         // Bold formatting
  color?: string;         // Font color (hex)
  numberFormat?: string;  // Number format string
}
```

### Excel Integration Types

#### PlatformInfo
```typescript
interface PlatformInfo {
  platform: 'Windows' | 'Mac' | 'Online' | 'Mobile' | 'Unknown';
  version: string;        // Excel version
  apiVersion: string;     // Office.js API version
  capabilities: string[]; // Available features
}
```

#### ExcelGenerationResult
```typescript
interface ExcelGenerationResult {
  success: boolean;           // Generation success status
  generationTime: number;     // Time taken in milliseconds
  syncOperations: number;     // Number of sync operations
  retryAttempts: number;      // Number of retry attempts
  platformAdaptations: string[]; // Applied platform adaptations
  error?: string;            // Error message if failed
}
```

#### ExcelReadResult
```typescript
interface ExcelReadResult {
  success: boolean;              // Read operation success
  data: WACCInputData | null;   // Read data (if successful)
  message: string;              // Status message
  worksheetFound: boolean;      // Worksheet existence status
  dataIntegrity: DataIntegrityReport; // Data validation results
}
```

### Validation Types

#### ValidationResult
```typescript
interface ValidationResult {
  isValid: boolean;          // Overall validation status
  errors: ValidationError[]; // List of validation errors
}
```

#### ValidationError
```typescript
interface ValidationError {
  field?: string;            // Field name (if field-specific)
  message: string;           // Error message
  code: string;             // Error code for programmatic handling
  severity?: 'error' | 'warning' | 'info'; // Error severity
}
```

### Performance Types

#### PerformanceMetrics
```typescript
interface PerformanceMetrics {
  calculationTime: number;     // Calculation duration (ms)
  excelGenerationTime: number; // Excel generation duration (ms)
  cacheHit?: boolean;         // Whether cache was used
  cacheKey?: string;          // Cache key (if cached)
}
```

#### GenerationMetrics
```typescript
interface GenerationMetrics {
  totalTime: number;          // Total generation time (ms)
  syncOperations: number;     // Number of Excel sync operations
  batchOperations: number;    // Number of batch operations
  retryAttempts: number;      // Number of retry attempts
}
```

---

## Error Handling

### Error Types

#### WACCValidationError
```typescript
class WACCValidationError extends Error {
  public readonly errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super(`WACC validation failed: ${errors.map(e => e.message).join(', ')}`);
    this.name = 'WACCValidationError';
    this.errors = errors;
  }
}
```

**Usage:**
```typescript
try {
  const result = await engine.calculateWACC(inputData);
} catch (error) {
  if (error instanceof WACCValidationError) {
    error.errors.forEach(validationError => {
      console.error(`${validationError.field}: ${validationError.message}`);
    });
  }
}
```

#### WACCCalculationError
```typescript
class WACCCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WACCCalculationError';
  }
}
```

**Usage:**
```typescript
try {
  const result = await engine.calculateWACC(inputData);
} catch (error) {
  if (error instanceof WACCCalculationError) {
    console.error('Calculation failed:', error.message);
    // Show user-friendly error message
  }
}
```

### Error Handling Patterns

#### Comprehensive Error Handling
```typescript
const handleWACCCalculation = async (inputData: WACCInputData): Promise<WACCResult | null> => {
  try {
    // Attempt calculation
    const result = await engine.calculateWACC(inputData);
    return result;
  } catch (error) {
    // Handle specific error types
    if (error instanceof WACCValidationError) {
      // Show validation errors to user
      setValidationErrors(error.errors);
      return null;
    } else if (error instanceof WACCCalculationError) {
      // Show calculation error
      setCalculationError(error.message);
      return null;
    } else {
      // Handle unexpected errors
      console.error('Unexpected error:', error);
      setGeneralError('An unexpected error occurred. Please try again.');
      return null;
    }
  }
};
```

#### React Error Boundary Integration
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class WACCErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error for debugging
    console.error('WACC Calculator Error:', error, errorInfo);
    
    // Report to error tracking service
    if (error instanceof WACCValidationError) {
      // Handle validation errors
    } else if (error instanceof WACCCalculationError) {
      // Handle calculation errors
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Something went wrong</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.message}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## Performance Monitoring

### Performance Tracking

#### Automatic Performance Monitoring
```typescript
// Wrap components with performance monitoring
const withPerformanceMonitoring = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const renderStart = performance.now();
    
    useLayoutEffect(() => {
      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart;
      
      // Record render performance
      performanceMonitor.recordMetric(`${componentName}-render-time`, renderTime);
      
      // Alert on slow renders
      if (renderTime > 16) { // 60fps target
        console.warn(`Slow render detected: ${componentName} took ${renderTime}ms`);
      }
    });

    return <Component {...props} ref={ref} />;
  });
};

// Usage
const MonitoredWACCCalculator = withPerformanceMonitoring(WACCCalculator, 'WACCCalculator');
```

#### Custom Performance Metrics
```typescript
// Custom performance hook
const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  const measureOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const endTime = performance.now();
      
      setMetrics(prev => ({
        ...prev,
        [operationName]: endTime - startTime
      }));
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      setMetrics(prev => ({
        ...prev,
        [`${operationName}-error`]: endTime - startTime
      }));
      throw error;
    }
  }, []);

  return { metrics, measureOperation };
};

// Usage in component
const PerformanceAwareComponent: React.FC = () => {
  const { metrics, measureOperation } = usePerformanceMetrics();
  const [calculationResult, setCalculationResult] = useState<WACCResult | null>(null);

  const handleCalculation = useCallback(async (inputData: WACCInputData) => {
    const result = await measureOperation(
      () => engine.calculateWACC(inputData),
      'wacc-calculation'
    );
    setCalculationResult(result);
  }, [measureOperation]);

  return (
    <div>
      {metrics && (
        <div>
          Calculation Time: {metrics['wacc-calculation']?.toFixed(2)}ms
        </div>
      )}
    </div>
  );
};
```

---

## Examples and Usage

### Complete Integration Example

```typescript
// Complete WACC Calculator integration example
import React, { useState, useCallback, useEffect } from 'react';
import {
  WACCCalculationEngine,
  WACCInputData,
  WACCResult,
  WACCTemplate,
  WACCTemplates,
  getDefaultWACCInput,
  useEnhancedExcelIntegration,
  useOptimizedWACC,
  useLocalStorage,
  WACCCalculatorApp,
  WACCInputWizard,
  WACCPreviewCard,
  TemplateSelector
} from 'wacc-calculator';

const CompleteWACCApplication: React.FC = () => {
  // State management
  const [inputData, setInputData] = useState<WACCInputData>(getDefaultWACCInput());
  const [selectedTemplate, setSelectedTemplate] = useState<WACCTemplate>(WACCTemplates[0]);
  
  // Hooks for functionality
  const {
    generateExcelTable,
    readExcelData,
    syncWithExcel,
    platformInfo,
    syncStatus,
    connectionStatus
  } = useEnhancedExcelIntegration();
  
  const {
    calculationResult,
    isCalculating,
    calculationError,
    selectors
  } = useOptimizedWACC(inputData);
  
  const {
    data: savedData,
    saveData: saveInputData,
    clearData: clearSavedData
  } = useLocalStorage<WACCInputData>('wacc-app-data', getDefaultWACCInput());

  // Auto-save functionality
  useEffect(() => {
    saveInputData(inputData);
  }, [inputData, saveInputData]);

  // Load saved data on mount
  useEffect(() => {
    if (savedData) {
      setInputData(savedData);
    }
  }, [savedData]);

  // Event handlers
  const handleInputChange = useCallback((newData: WACCInputData) => {
    setInputData(newData);
  }, []);

  const handleGenerateExcel = useCallback(async () => {
    if (!calculationResult) return;

    try {
      await generateExcelTable(calculationResult, selectedTemplate);
      console.log('Excel table generated successfully');
    } catch (error) {
      console.error('Failed to generate Excel table:', error);
    }
  }, [generateExcelTable, calculationResult, selectedTemplate]);

  const handleSyncWithExcel = useCallback(async () => {
    try {
      const syncResult = await syncWithExcel();
      if (syncResult.success && syncResult.data) {
        setInputData(syncResult.data);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }, [syncWithExcel]);

  const handleReadExcelData = useCallback(async () => {
    try {
      const excelData = await readExcelData();
      if (excelData) {
        setInputData(excelData);
      }
    } catch (error) {
      console.error('Failed to read Excel data:', error);
    }
  }, [readExcelData]);

  const handleClearData = useCallback(() => {
    setInputData(getDefaultWACCInput());
    clearSavedData();
  }, [clearSavedData]);

  // Render
  return (
    <div className="wacc-application">
      <h1>WACC Calculator</h1>
      
      {/* Platform Information */}
      <div className="platform-info">
        <p>Platform: {platformInfo?.platform}</p>
        <p>Connection: {connectionStatus}</p>
        <p>Sync Status: {syncStatus}</p>
      </div>

      {/* Main Application */}
      <div className="main-content">
        <div className="input-section">
          <WACCInputWizard
            data={inputData}
            onChange={handleInputChange}
            validationErrors={calculationError ? [{ message: calculationError.message, code: 'CALC_ERROR' }] : []}
          />
        </div>

        <div className="preview-section">
          {calculationResult && (
            <WACCPreviewCard
              result={calculationResult}
              isCalculating={isCalculating}
              showPerformanceMetrics={true}
            />
          )}
        </div>

        <div className="template-section">
          <TemplateSelector
            selectedTemplate={selectedTemplate}
            onTemplateChange={setSelectedTemplate}
            templates={WACCTemplates}
          />
        </div>

        <div className="actions-section">
          <button onClick={handleGenerateExcel} disabled={!calculationResult}>
            Generate Excel Table
          </button>
          
          <button onClick={handleSyncWithExcel}>
            Sync with Excel
          </button>
          
          <button onClick={handleReadExcelData}>
            Read Excel Data
          </button>
          
          <button onClick={handleClearData}>
            Clear Data
          </button>
        </div>
      </div>

      {/* Results Display */}
      {calculationResult && (
        <div className="results-section">
          <h3>Calculation Results</h3>
          <p>Cost of Equity: {(selectors.getCostOfEquity() * 100).toFixed(2)}%</p>
          <p>Cost of Debt: {(selectors.getCostOfDebt() * 100).toFixed(2)}%</p>
          <p>WACC: {(selectors.getWACC() * 100).toFixed(2)}%</p>
        </div>
      )}

      {/* Error Display */}
      {calculationError && (
        <div className="error-section">
          <h3>Error</h3>
          <p>{calculationError.message}</p>
        </div>
      )}
    </div>
  );
};

export default CompleteWACCApplication;
```

### Advanced Usage Patterns

#### Custom Calculation Engine
```typescript
// Extend the calculation engine for custom requirements
class CustomWACCEngine extends WACCCalculationEngine {
  // Override calculation method for custom logic
  async calculateWACC(input: WACCInputData): Promise<WACCResult> {
    // Pre-calculation validation
    const customValidation = this.customValidation(input);
    if (!customValidation.isValid) {
      throw new WACCValidationError(customValidation.errors);
    }

    // Call parent calculation
    const result = await super.calculateWACC(input);

    // Post-calculation customization
    return this.customizeResult(result, input);
  }

  private customValidation(input: WACCInputData): ValidationResult {
    const errors: ValidationError[] = [];

    // Custom business rules
    if (input.taxRate > 50) {
      errors.push({
        field: 'taxRate',
        message: 'Tax rate cannot exceed 50% per company policy',
        code: 'TAX_RATE_LIMIT'
      });
    }

    return { isValid: errors.length === 0, errors };
  }

  private customizeResult(result: WACCResult, input: WACCInputData): WACCResult {
    // Add custom metadata or adjustments
    return {
      ...result,
      // Custom field example
      companyRiskAdjustment: this.calculateRiskAdjustment(input)
    };
  }
}
```

#### Batch Calculation Processing
```typescript
// Process multiple WACC calculations
const processBatchCalculations = async (
  inputDataSets: WACCInputData[],
  template: WACCTemplate
): Promise<BatchCalculationResult[]> => {
  const engine = new WACCCalculationEngine();
  const generator = new EnhancedExcelWACCGenerator();
  const results: BatchCalculationResult[] = [];

  for (const [index, inputData] of inputDataSets.entries()) {
    try {
      // Calculate WACC
      const calculationResult = await engine.calculateWACC(inputData);
      
      // Generate Excel output
      const excelResult = await generator.generateWACCTable(
        inputData,
        calculationResult,
        template
      );

      results.push({
        index,
        success: true,
        calculationResult,
        excelResult,
        error: null
      });
    } catch (error) {
      results.push({
        index,
        success: false,
        calculationResult: null,
        excelResult: null,
        error: error.message
      });
    }
  }

  return results;
};

interface BatchCalculationResult {
  index: number;
  success: boolean;
  calculationResult: WACCResult | null;
  excelResult: ExcelGenerationResult | null;
  error: string | null;
}
```

---

*This API reference provides comprehensive documentation for all WACC Calculator APIs. For usage examples and integration guides, see the [User Guide](USER_GUIDE.md) and [Technical Guide](TECHNICAL_GUIDE.md).*