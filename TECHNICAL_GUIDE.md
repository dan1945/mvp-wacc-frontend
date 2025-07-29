# WACC Calculator - Technical Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Development Environment](#development-environment)
3. [Code Structure](#code-structure)
4. [Core Systems](#core-systems)
5. [Performance Optimization](#performance-optimization)
6. [Testing Strategy](#testing-strategy)
7. [Deployment](#deployment)
8. [Maintenance](#maintenance)
9. [Troubleshooting](#troubleshooting)
10. [API Reference](#api-reference)

---

## Architecture Overview

### System Architecture

The WACC Calculator follows a modern React-based architecture with Office.js integration:

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                   │
│  React Components + Fluent UI + Tailwind CSS          │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                  Application Layer                      │
│     React Hooks + Context Providers + State Mgmt      │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                   Service Layer                        │
│  WACC Engine + Excel Integration + Caching + Monitor   │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                   Data Layer                           │
│      Local Storage + Session Storage + Excel API      │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Core Technologies
- **React 18**: Component framework with concurrent features
- **TypeScript 5.3+**: Type-safe development with strict mode
- **Webpack 5**: Module bundling with optimization
- **Office.js**: Excel Add-in API integration

#### UI/UX Technologies
- **Fluent UI v9**: Microsoft's design system for Office integration
- **Tailwind CSS 3.3**: Utility-first CSS framework
- **CSS Custom Properties**: Dynamic theming support

#### Testing Technologies
- **Jest 29**: Unit testing framework
- **React Testing Library**: Component testing utilities
- **Playwright**: End-to-end testing
- **jest-axe**: Accessibility testing

#### Development Tools
- **ESLint + Prettier**: Code quality and formatting
- **TypeScript Compiler**: Type checking and compilation
- **Webpack Dev Server**: Development with hot reload

### Design Principles

#### 1. Performance First
- **Bundle optimization** with code splitting
- **Memoization** for expensive calculations
- **Caching strategies** for improved responsiveness
- **Lazy loading** for non-critical components

#### 2. Accessibility Compliance
- **WCAG 2.1 AA** standards adherence
- **Screen reader** support with ARIA labels
- **Keyboard navigation** throughout the application
- **Focus management** for complex interactions

#### 3. Type Safety
- **Strict TypeScript** configuration
- **Comprehensive interfaces** for all data structures
- **Runtime validation** with Zod schemas
- **Type-safe API** integrations

#### 4. Maintainability
- **Modular architecture** with clear separation of concerns
- **Consistent coding standards** enforced by tooling
- **Comprehensive documentation** for all components
- **Test-driven development** approach

---

## Development Environment

### Prerequisites

#### Required Software
```bash
# Node.js (LTS version)
node --version  # Should be 16.0.0 or higher
npm --version   # Should be 8.0.0 or higher

# Git for version control
git --version

# Excel for testing (any supported platform)
# - Excel 2019+ (Windows/Mac)
# - Excel Online
# - Excel Mobile (iOS/Android)
```

#### Optional Tools
- **Visual Studio Code**: Recommended IDE with extensions
- **Office Add-in Debugger**: For advanced debugging
- **React Developer Tools**: Browser extension for React debugging

### Installation

#### 1. Clone Repository
```bash
git clone https://github.com/your-org/werx-modern-wacc-calculator.git
cd werx-modern-wacc-calculator
```

#### 2. Install Dependencies
```bash
# Install all dependencies
npm install

# Verify installation
npm run type-check
npm run lint
```

#### 3. Development Server
```bash
# Start development server
npm start

# Server will be available at:
# - Taskpane: https://localhost:3000/taskpane.html
# - Commands: https://localhost:3000/commands.html
```

#### 4. Excel Integration Setup
```bash
# For Excel Add-in testing, you'll need to:
# 1. Trust the localhost certificate
# 2. Sideload the manifest.xml
# 3. Configure Excel to allow add-ins

# See INSTALLATION_GUIDE.md for detailed steps
```

### Development Scripts

#### Core Development
```bash
npm start              # Start development server with HMR
npm run serve         # Alternative development server
npm run watch         # Build in watch mode
npm run build         # Production build
npm run build:dev     # Development build
```

#### Quality Assurance
```bash
npm run test          # Run unit tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run test:e2e      # Run end-to-end tests
npm run test:all      # Run complete test suite

npm run lint          # Check code style
npm run lint:fix      # Fix linting issues
npm run type-check    # TypeScript type checking
npm run format        # Format code with Prettier
npm run validate      # Complete validation pipeline
```

#### Maintenance
```bash
npm run clean         # Clean build directory
npm audit             # Security vulnerability check
npm run health-check  # Deployment health check
```

---

## Code Structure

### Directory Organization

```
src/
├── components/              # React components
│   ├── optimized/          # Performance-optimized components
│   │   ├── MemoizedWACCComponents.tsx
│   │   └── OptimizedWACCComponents.tsx
│   ├── steps/              # Wizard step components
│   │   ├── BuildUpModelStep.tsx
│   │   ├── CostOfDebtStep.tsx
│   │   └── WeightTaxStep.tsx
│   ├── ErrorBoundaries/    # Error handling components
│   │   └── EnhancedErrorBoundary.tsx
│   ├── WACCCalculatorApp.tsx    # Main application component
│   ├── WACCCalculator.tsx       # Core calculator component
│   ├── WACCInputWizard.tsx      # Input wizard component
│   ├── WACCPreviewCard.tsx      # Results preview component
│   ├── TemplateSelector.tsx     # Template selection component
│   ├── LoadingOverlay.tsx       # Loading state component
│   └── AnimatedNumber.tsx       # Number animation component
│
├── contexts/               # React context providers
│   ├── OptimizedWACCContext.tsx  # Optimized state management
│   ├── WACCDataContext.tsx       # Data management context
│   ├── AccessibilityContext.tsx  # Accessibility utilities
│   └── AuthContext.tsx           # Authentication context
│
├── hooks/                  # Custom React hooks
│   ├── useEnhancedExcelIntegration.ts  # Advanced Excel integration
│   ├── useExcelIntegration.ts          # Basic Excel integration
│   ├── useOptimizedWACC.ts            # Optimized WACC calculations
│   ├── useWACCCalculation.ts          # Core calculation hook
│   ├── useLocalStorage.ts             # Local storage utilities
│   └── useDebounce.ts                 # Input debouncing
│
├── services/               # Business logic services
│   ├── WACCCalculationEngine.ts       # Core calculation engine
│   ├── EnhancedExcelWACCGenerator.ts  # Advanced Excel generation
│   ├── ExcelWACCGenerator.ts          # Basic Excel generation
│   ├── ExcelDataReader.ts             # Excel data reading
│   ├── EnhancedExcelFormatter.ts      # CSS-like formatting
│   ├── CacheManager.ts                # Multi-tier caching
│   └── PerformanceMonitor.ts          # Performance tracking
│
├── providers/              # Additional context providers
│   └── PerformanceProvider.tsx        # Performance monitoring context
│
├── types/                  # TypeScript type definitions
│   ├── index.ts                       # Common types
│   └── wacc.ts                        # WACC-specific types
│
├── templates/              # Excel output templates
│   └── waccTemplates.ts               # Template configurations
│
├── utils/                  # Utility functions
│   ├── waccDefaults.ts                # Default values
│   └── bundleOptimization.ts          # Bundle optimization utilities
│
├── styles/                 # Styling and themes
│   ├── globals.css                    # Global styles
│   └── officeTheme.ts                 # Office theme integration
│
├── taskpane/               # Office Add-in entry points
│   ├── index.tsx                      # Taskpane entry point
│   └── taskpane.html                  # Taskpane HTML template
│
├── commands/               # Office Add-in commands
│   ├── enhancedCommands.ts            # Advanced ribbon commands
│   ├── commands.ts                    # Basic ribbon commands
│   ├── commands.html                  # Commands HTML template
│   └── enhancedCommands.ts            # Enhanced command handlers
│
└── examples/               # Usage examples and demos
    └── IntegratedWACCApp.tsx          # Complete integration example
```

### Component Architecture

#### Component Hierarchy
```
WACCCalculatorApp
├── ErrorBoundary
├── AccessibilityProvider
├── WACCDataProvider
│   └── OptimizedWACCContext
│       ├── WACCInputWizard
│       │   ├── BuildUpModelStep
│       │   ├── CostOfDebtStep
│       │   └── WeightTaxStep
│       ├── WACCPreviewCard
│       │   └── AnimatedNumber
│       ├── TemplateSelector
│       └── LoadingOverlay
└── PerformanceProvider
```

#### Component Patterns

##### 1. Memoized Components
```typescript
// Performance-optimized component pattern
const MemoizedWACCPreview = React.memo(
  WACCPreviewCard,
  (prevProps, nextProps) => {
    return (
      prevProps.result.weightedAverageCostOfCapital === 
      nextProps.result.weightedAverageCostOfCapital
    );
  }
);
```

##### 2. Error Boundaries
```typescript
// Service-specific error boundary pattern
export class WACCCalculationErrorBoundary extends React.Component {
  static getDerivedStateFromError(error: Error) {
    if (error.name === 'WACCCalculationError') {
      return { hasError: true, errorType: 'calculation' };
    }
    return { hasError: true, errorType: 'general' };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.performanceMonitor.recordError(error, errorInfo);
  }
}
```

##### 3. Context Providers
```typescript
// Optimized context provider pattern
export const OptimizedWACCProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [state, dispatch] = useReducer(waccReducer, initialState);
  
  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    state,
    dispatch,
    selectors: createSelectors(state)
  }), [state]);

  return (
    <OptimizedWACCContext.Provider value={contextValue}>
      {children}
    </OptimizedWACCContext.Provider>
  );
};
```

---

## Core Systems

### 1. WACC Calculation Engine

#### Architecture
```typescript
// Core calculation engine with caching and validation
export class WACCCalculationEngine {
  private cache: CacheManager;
  private validator: ZodValidator;
  private performanceMonitor: PerformanceMonitor;

  async calculateWACC(input: WACCInputData): Promise<WACCResult> {
    // 1. Check cache for existing result
    const cachedResult = await this.cache.get(input);
    if (cachedResult) return cachedResult;

    // 2. Validate input data
    const validation = this.validator.validate(input);
    if (!validation.isValid) {
      throw new WACCValidationError(validation.errors);
    }

    // 3. Perform calculation
    const result = await this.performCalculation(input);

    // 4. Cache result and return
    await this.cache.set(input, result);
    return result;
  }
}
```

#### Calculation Methods

##### Cost of Equity Calculation
```typescript
// Build-up model: Sum of risk components
private calculateCostOfEquity(buildUpModel: BuildUpModelItem[]): number {
  const sum = buildUpModel.reduce((acc, item) => {
    // Convert percentage to decimal (legacy compatibility)
    const value = item.value / 100;
    return acc + value;
  }, 0);
  
  // Apply legacy rounding to 3 decimal places
  return Math.round(sum * 1000) / 1000;
}
```

##### Cost of Debt Calculation
```typescript
// Two methods: additive or ratio-based
private calculateCostOfDebt(
  costOfDebtItems: CostOfDebtItem[], 
  selectionType: 1 | 2
): number {
  if (selectionType === 1) {
    // Method 1: Sum of first two components
    const sum = costOfDebtItems[0].value + costOfDebtItems[1].value;
    return Math.round((sum / 100) * 1000) / 1000;
  } else {
    // Method 2: Division calculation
    const numerator = costOfDebtItems[2].value;
    const denominator = costOfDebtItems[3].value;
    const division = numerator / denominator;
    return Math.round(division * 1000) / 1000;
  }
}
```

##### Final WACC Formula
```typescript
// WACC = (E/V × Re) + (D/V × Rd × (1 - Tc))
private calculateWACC(
  costOfEquity: number,
  costOfDebt: number,
  weights: WeightData,
  taxRate: number
): number {
  const weightOfEquityDecimal = weights.weightOfEquity / 100;
  const weightOfDebtDecimal = weights.weightOfDebt / 100;
  const taxRateDecimal = taxRate / 100;
  
  return (weightOfDebtDecimal * costOfDebt * (1 - taxRateDecimal)) + 
         (weightOfEquityDecimal * costOfEquity);
}
```

### 2. Excel Integration System

#### Enhanced Excel Generator

##### Platform Detection
```typescript
// Detect Excel platform and capabilities
static detectPlatformCapabilities(): PlatformInfo {
  const platform = Office.context.platform;
  const version = Office.context.diagnostics.version;
  
  return {
    platform: this.getPlatformName(platform),
    version,
    apiVersion: Office.context.requirements.isSetSupported('ExcelApi', '1.8') ? '1.8' : '1.4',
    capabilities: this.getCapabilities(platform, version)
  };
}
```

##### Batch Operations for Performance
```typescript
// Optimized Excel operations using batching
async generateWACCTable(
  input: WACCInputData, 
  result: WACCResult, 
  template: WACCTemplate
): Promise<ExcelGenerationResult> {
  return Excel.run(async (context) => {
    const worksheet = context.workbook.worksheets.getActiveWorksheet();
    
    // Batch 1: Clear and prepare worksheet
    const clearRange = worksheet.getRange('A1:Z100');
    clearRange.clear();
    
    // Batch 2: Set all values simultaneously
    const ranges = this.prepareAllRanges(worksheet, input, result, template);
    
    // Batch 3: Apply all formatting
    const formatting = this.prepareAllFormatting(ranges, template);
    
    // Single sync operation for all changes
    await context.sync();
    
    return this.generateResult(result);
  });
}
```

##### Cross-Platform Compatibility
```typescript
// Adaptive formatting based on platform capabilities
private applyFormatting(
  range: Excel.Range, 
  style: CellStyle, 
  platformInfo: PlatformInfo
): void {
  if (platformInfo.capabilities.includes('colorFormatting')) {
    range.format.fill.color = style.backgroundColor;
    range.format.font.color = style.fontColor;
  }
  
  if (platformInfo.capabilities.includes('borderFormatting')) {
    range.format.borders.getItem('EdgeTop').style = style.borderStyle;
  } else {
    // Fallback for limited platforms
    range.format.borders.getItem('EdgeTop').style = 'Continuous';
  }
}
```

#### Data Reading and Validation

##### Excel Data Reader
```typescript
// Comprehensive data reading with validation
export class ExcelDataReader {
  async readWACCData(): Promise<ExcelReadResult> {
    try {
      return await Excel.run(async (context) => {
        const worksheet = this.findWACCWorksheet(context);
        
        // Read all data ranges simultaneously
        const buildUpRange = worksheet.getRange('B6:C10');
        const costOfDebtRange = worksheet.getRange('E6:F12');
        const weightsRange = worksheet.getRange('G20:J23');
        
        buildUpRange.load('values');
        costOfDebtRange.load('values');
        weightsRange.load('values');
        
        await context.sync();
        
        // Validate and convert data
        const data = this.convertExcelToWACCData({
          buildUp: buildUpRange.values,
          costOfDebt: costOfDebtRange.values,
          weights: weightsRange.values
        });
        
        const integrity = this.validateDataIntegrity(data);
        
        return {
          success: true,
          data,
          message: 'Data read successfully',
          worksheetFound: true,
          dataIntegrity: integrity
        };
      });
    } catch (error) {
      return this.handleReadError(error);
    }
  }
}
```

### 3. Performance Optimization System

#### Multi-Tier Caching Strategy

##### Cache Manager Implementation
```typescript
export class CacheManager {
  private memoryCache: LRUCache<string, any>;
  private sessionCache: SessionStorageCache;
  private localCache: LocalStorageCache;

  async get<T>(key: string): Promise<T | null> {
    // 1. Check memory cache (fastest)
    let result = this.memoryCache.get(key);
    if (result) {
      this.recordCacheHit('memory');
      return result;
    }

    // 2. Check session storage
    result = await this.sessionCache.get(key);
    if (result) {
      this.memoryCache.set(key, result);
      this.recordCacheHit('session');
      return result;
    }

    // 3. Check local storage
    result = await this.localCache.get(key);
    if (result) {
      this.memoryCache.set(key, result);
      this.sessionCache.set(key, result);
      this.recordCacheHit('local');
      return result;
    }

    this.recordCacheMiss();
    return null;
  }
}
```

##### Cache Configuration
```typescript
// Specialized cache configurations for different data types
const CACHE_CONFIGS = {
  waccCalculations: {
    memoryLimit: 100,      // Max 100 calculations in memory
    ttl: 30 * 60 * 1000,  // 30 minutes
    maxSize: 10 * 1024 * 1024  // 10MB
  },
  excelFormatting: {
    memoryLimit: 50,
    ttl: 24 * 60 * 60 * 1000,  // 24 hours
    maxSize: 5 * 1024 * 1024    // 5MB
  },
  templates: {
    memoryLimit: 10,
    ttl: -1,  // Never expire
    maxSize: 1 * 1024 * 1024    // 1MB
  }
};
```

#### Performance Monitoring

##### Real-time Metrics Collection
```typescript
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private webVitalsObserver: PerformanceObserver;

  // Web Vitals tracking
  private initializeWebVitals(): void {
    this.webVitalsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          this.recordMetric('LCP', entry.startTime);
        }
        if (entry.entryType === 'first-input') {
          this.recordMetric('FID', entry.processingStart - entry.startTime);
        }
        if (entry.entryType === 'layout-shift') {
          this.recordMetric('CLS', entry.value);
        }
      }
    });
  }

  // Custom performance tracking
  markStart(operation: string): void {
    performance.mark(`${operation}-start`);
  }

  markEnd(operation: string): number {
    performance.mark(`${operation}-end`);
    performance.measure(operation, `${operation}-start`, `${operation}-end`);
    
    const measure = performance.getEntriesByName(operation, 'measure')[0];
    this.recordMetric(operation, measure.duration);
    
    return measure.duration;
  }
}
```

#### Component Optimization

##### Memoization Strategies
```typescript
// Memoized WACC calculation hook
export const useOptimizedWACC = (inputData: WACCInputData) => {
  // Memoize expensive calculation
  const calculationResult = useMemo(() => {
    return waccEngine.calculateWACC(inputData);
  }, [
    inputData.buildUpModel,
    inputData.costOfDebtCalculations,
    inputData.weightData,
    inputData.taxRate
  ]);

  // Memoize selectors to prevent unnecessary re-renders
  const selectors = useMemo(() => ({
    getCostOfEquity: () => calculationResult?.costOfEquity,
    getCostOfDebt: () => calculationResult?.costOfDebt,
    getWACC: () => calculationResult?.weightedAverageCostOfCapital
  }), [calculationResult]);

  return { calculationResult, selectors };
};
```

##### Bundle Optimization
```typescript
// Webpack optimization configuration
const optimizationConfig = {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      react: {
        test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
        name: 'react',
        priority: 20
      },
      office: {
        test: /[\\/]node_modules[\\/](@fluentui|office-addin)[\\/]/,
        name: 'office',
        priority: 15
      },
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendor',
        priority: 10
      }
    }
  },
  usedExports: true,
  sideEffects: false
};
```

### 4. State Management System

#### Optimized Context Architecture

##### Selector-Based Subscriptions
```typescript
// Context with selective re-rendering
export const OptimizedWACCContext = createContext<OptimizedWACCContextType | null>(null);

export const useWACCSelector = <T>(
  selector: (state: WACCState) => T
): T => {
  const context = useContext(OptimizedWACCContext);
  if (!context) {
    throw new Error('useWACCSelector must be used within OptimizedWACCProvider');
  }

  // Create stable selector reference
  const memoizedSelector = useCallback(selector, []);
  
  // Subscribe only to selected state slice
  return useSyncExternalStore(
    context.subscribe,
    () => memoizedSelector(context.getState()),
    () => memoizedSelector(context.getInitialState())
  );
};
```

##### Performance-Optimized Reducers
```typescript
// Immer-based reducer for immutable updates
const waccReducer = produce((draft: WACCState, action: WACCAction) => {
  switch (action.type) {
    case 'UPDATE_BUILD_UP_MODEL':
      // Direct mutation in draft (Immer handles immutability)
      draft.inputData.buildUpModel = action.payload;
      draft.isDirty = true;
      draft.lastModified = Date.now();
      break;
      
    case 'UPDATE_CALCULATION_RESULT':
      draft.calculationResult = action.payload;
      draft.lastCalculated = Date.now();
      break;
      
    case 'RESET_TO_DEFAULTS':
      // Reset only necessary fields
      Object.assign(draft.inputData, getDefaultWACCInput());
      draft.isDirty = false;
      draft.calculationResult = null;
      break;
  }
});
```

---

## Testing Strategy

### Test Architecture

#### Test Categories and Coverage

##### 1. Unit Tests (95% Critical Component Coverage)
```typescript
// Example: WACC Calculation Engine test
describe('WACCCalculationEngine', () => {
  let engine: WACCCalculationEngine;
  
  beforeEach(() => {
    engine = new WACCCalculationEngine();
  });

  describe('calculateCostOfEquity', () => {
    it('should match legacy ROUND(SUM(),3) formula', () => {
      const buildUpModel = [
        { name: 'Risk-free Rate', value: 3.5 },
        { name: 'Market Risk Premium', value: 6.0 },
        { name: 'Beta', value: 1.2 },
        { name: 'Size Premium', value: 2.0 },
        { name: 'Company-specific Risk', value: 1.0 }
      ];
      
      const result = engine['calculateCostOfEquity'](buildUpModel);
      expect(result).toBeCloseTo(0.137, 3); // Exact legacy match
    });
  });

  describe('calculateWACC integration', () => {
    it('should maintain 100% accuracy with legacy system', async () => {
      const input = WACCCalculationEngine.createSampleData();
      const result = await engine.calculateWACC(input);
      
      // Verify against known legacy calculation
      expect(result.weightedAverageCostOfCapital).toBeCloseTo(0.0845, 4);
      expect(result.costOfEquity).toBeCloseTo(0.137, 3);
      expect(result.costOfDebt).toBeCloseTo(0.04, 3);
    });
  });
});
```

##### 2. Integration Tests
```typescript
// Example: Excel integration test
describe('Excel Integration', () => {
  let mockExcel: jest.Mocked<typeof Excel>;
  
  beforeEach(() => {
    mockExcel = createMockExcel();
    global.Excel = mockExcel;
  });

  it('should generate WACC table across all platforms', async () => {
    const platforms = ['Windows', 'Mac', 'Online', 'Mobile'];
    
    for (const platform of platforms) {
      const generator = new EnhancedExcelWACCGenerator();
      const platformInfo = { platform, capabilities: getCapabilities(platform) };
      
      const result = await generator.generateWACCTableWithPlatformAdaptation(
        sampleInput,
        sampleResult,
        professionalTemplate,
        platformInfo
      );
      
      expect(result.success).toBe(true);
      expect(result.generationTime).toBeLessThan(2000); // Sub-2 second requirement
      expect(mockExcel.run).toHaveBeenCalled();
    }
  });
});
```

##### 3. Performance Tests
```typescript
// Example: Performance benchmark test
describe('Performance Benchmarks', () => {
  it('should complete WACC calculation under 100ms', async () => {
    const engine = new WACCCalculationEngine();
    const input = WACCCalculationEngine.createSampleData();
    
    const startTime = performance.now();
    const result = await engine.calculateWACC(input);
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(100);
    expect(result.performanceMetrics?.calculationTime).toBeLessThan(100);
  });

  it('should achieve >85% cache hit rate under load', async () => {
    const engine = new WACCCalculationEngine();
    const inputs = generateRandomWACCInputs(1000);
    
    // Perform calculations
    for (const input of inputs) {
      await engine.calculateWACC(input);
    }
    
    // Repeat calculations (should hit cache)
    const cacheHits = 0;
    for (const input of inputs) {
      const result = await engine.calculateWACC(input);
      if (result.performanceMetrics?.cacheHit) {
        cacheHits++;
      }
    }
    
    const hitRate = cacheHits / inputs.length;
    expect(hitRate).toBeGreaterThan(0.85);
  });
});
```

##### 4. Accessibility Tests
```typescript
// Example: WCAG compliance test
describe('Accessibility Compliance', () => {
  it('should meet WCAG 2.1 AA standards', async () => {
    render(<WACCCalculatorApp />);
    
    const results = await axe(document.body);
    expect(results.violations).toHaveLength(0);
  });

  it('should support complete keyboard navigation', () => {
    render(<WACCCalculatorApp />);
    
    // Test keyboard navigation through all interactive elements
    const interactiveElements = screen.getAllByRole(/button|textbox|combobox/);
    
    interactiveElements.forEach((element, index) => {
      element.focus();
      expect(element).toHaveFocus();
      
      // Test Enter/Space activation for buttons
      if (element.getAttribute('role') === 'button') {
        fireEvent.keyDown(element, { key: 'Enter' });
        // Verify appropriate action occurred
      }
    });
  });
});
```

### Test Configuration

#### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test-setup.ts'
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/WACCCalculationEngine.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}',
    '<rootDir>/tests/**/*.{test,spec}.{ts,tsx}'
  ]
};
```

#### Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'https://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Deployment

### CI/CD Pipeline

#### GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Test with coverage
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  build-and-deploy:
    needs: [quality-check, security-scan]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install and build
        run: |
          npm ci
          npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Production Configuration

#### Environment Variables
```bash
# Production environment configuration
NODE_ENV=production
PUBLIC_URL=https://werx-wacc-calculator.vercel.app
OFFICE_ENV=production

# Security
CSP_POLICY="default-src 'self' https://appsforoffice.microsoft.com"
FORCE_HTTPS=true

# Performance
ENABLE_COMPRESSION=true
CACHE_CONTROL_MAX_AGE=31536000
```

#### Webpack Production Configuration
```javascript
// webpack.prod.js
const config = {
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
        },
      }),
      new CssMinimizerPlugin(),
    ],
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          chunks: 'all',
        },
        office: {
          test: /[\\/]node_modules[\\/](@fluentui|office-addin)[\\/]/,
          name: 'office',
          chunks: 'all',
        },
      },
    },
  },
  plugins: [
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8,
    }),
  ],
};
```

---

## Maintenance

### Monitoring and Observability

#### Health Check Implementation
```typescript
// scripts/health-check.js
export class HealthCheckService {
  async performHealthCheck(environment: 'staging' | 'production'): Promise<HealthCheckResult> {
    const baseUrl = this.getBaseUrl(environment);
    const checks = [
      this.checkEndpointHealth(`${baseUrl}/taskpane.html`),
      this.checkEndpointHealth(`${baseUrl}/commands.html`),
      this.checkManifestValidity(`${baseUrl}/manifest.xml`),
      this.checkPerformance(baseUrl),
      this.checkSecurityHeaders(baseUrl)
    ];

    const results = await Promise.allSettled(checks);
    return this.aggregateResults(results);
  }

  private async checkPerformance(baseUrl: string): Promise<PerformanceCheckResult> {
    const start = performance.now();
    const response = await fetch(`${baseUrl}/taskpane.html`);
    const end = performance.now();

    return {
      responseTime: end - start,
      statusCode: response.status,
      contentSize: parseInt(response.headers.get('content-length') || '0'),
      passed: end - start < 3000 && response.status === 200
    };
  }
}
```

#### Performance Monitoring
```typescript
// Real-time performance monitoring
export class ProductionMonitor {
  private metricsCollector: MetricsCollector;
  private alertManager: AlertManager;

  initializeMonitoring(): void {
    // Web Vitals collection
    this.collectWebVitals();
    
    // Custom application metrics
    this.collectApplicationMetrics();
    
    // Error tracking
    this.setupErrorTracking();
    
    // Performance budget monitoring
    this.monitorPerformanceBudgets();
  }

  private monitorPerformanceBudgets(): void {
    const budgets = {
      'wacc-calculation': 100,    // 100ms max
      'excel-generation': 2000,   // 2s max
      'component-render': 16,     // 16ms for 60fps
      'cache-hit-rate': 0.85      // 85% minimum
    };

    setInterval(() => {
      Object.entries(budgets).forEach(([metric, threshold]) => {
        const currentValue = this.metricsCollector.getMetric(metric);
        if (this.exceedsThreshold(currentValue, threshold)) {
          this.alertManager.triggerAlert({
            metric,
            currentValue,
            threshold,
            severity: 'warning'
          });
        }
      });
    }, 60000); // Check every minute
  }
}
```

### Update and Migration Procedures

#### Version Management
```typescript
// Version compatibility checking
export class VersionManager {
  static checkCompatibility(currentVersion: string, targetVersion: string): CompatibilityResult {
    const current = semver.parse(currentVersion);
    const target = semver.parse(targetVersion);
    
    if (!current || !target) {
      return { compatible: false, reason: 'Invalid version format' };
    }

    // Breaking changes in major versions
    if (target.major > current.major) {
      return {
        compatible: false,
        reason: 'Major version change may require data migration',
        migrationRequired: true
      };
    }

    // Minor version updates are generally safe
    if (target.minor > current.minor) {
      return {
        compatible: true,
        reason: 'Minor version update with new features',
        migrationRequired: false
      };
    }

    return { compatible: true, reason: 'Patch update' };
  }
}
```

#### Data Migration
```typescript
// Data migration utilities
export class DataMigrationService {
  async migrateUserData(fromVersion: string, toVersion: string): Promise<MigrationResult> {
    const migrations = this.getMigrationPath(fromVersion, toVersion);
    
    for (const migration of migrations) {
      try {
        await this.executeMigration(migration);
      } catch (error) {
        return {
          success: false,
          error: error.message,
          rollbackAvailable: true
        };
      }
    }

    return { success: true, migrationsApplied: migrations.length };
  }

  private async executeMigration(migration: Migration): Promise<void> {
    switch (migration.type) {
      case 'localStorage':
        await this.migrateLocalStorage(migration);
        break;
      case 'calculation':
        await this.migrateCalculationFormat(migration);
        break;
      case 'template':
        await this.migrateTemplateFormat(migration);
        break;
    }
  }
}
```

---

## Troubleshooting

### Common Development Issues

#### TypeScript Compilation Errors

##### Issue: Strict Mode Violations
```typescript
// Problem: Type 'undefined' is not assignable to type 'string'
const userName = userProfile.name; // Error if name can be undefined

// Solution: Use optional chaining and nullish coalescing
const userName = userProfile?.name ?? 'Anonymous';

// Or use type guards
function isValidUser(user: any): user is User {
  return user && typeof user.name === 'string';
}

if (isValidUser(userProfile)) {
  const userName = userProfile.name; // TypeScript knows name exists
}
```

##### Issue: Complex Type Inference
```typescript
// Problem: Complex generic types not inferred correctly
const useGenericHook = <T>(initial: T) => {
  const [state, setState] = useState(initial);
  return [state, setState] as const; // Use const assertion
};

// Solution: Explicit type parameters
const useWACCState = () => useGenericHook<WACCInputData>(getDefaultWACCInput());
```

#### Office.js Integration Issues

##### Issue: Context Sync Errors
```typescript
// Problem: Multiple sync calls causing conflicts
await Excel.run(async (context) => {
  const range1 = worksheet.getRange('A1');
  await context.sync(); // First sync
  
  const range2 = worksheet.getRange('B1');
  await context.sync(); // Second sync - inefficient
});

// Solution: Batch operations
await Excel.run(async (context) => {
  const range1 = worksheet.getRange('A1');
  const range2 = worksheet.getRange('B1');
  
  range1.load('values');
  range2.load('values');
  
  await context.sync(); // Single sync for all operations
});
```

##### Issue: Platform Compatibility
```typescript
// Problem: Using features not available on all platforms
range.format.conditionalFormats.add(); // Not available on Mobile

// Solution: Feature detection
if (Office.context.requirements.isSetSupported('ExcelApi', '1.6')) {
  range.format.conditionalFormats.add();
} else {
  // Fallback formatting
  range.format.fill.color = 'yellow';
}
```

#### Performance Issues

##### Issue: Unnecessary Re-renders
```typescript
// Problem: Component re-renders on every parent update
const ExpensiveComponent: React.FC<Props> = ({ data }) => {
  const expensiveCalculation = calculateExpensiveValue(data);
  return <div>{expensiveCalculation}</div>;
};

// Solution: Memoization
const OptimizedComponent = React.memo<Props>(({ data }) => {
  const expensiveCalculation = useMemo(() => 
    calculateExpensiveValue(data), 
    [data.relevantField] // Only recalculate when relevant field changes
  );
  return <div>{expensiveCalculation}</div>;
});
```

##### Issue: Memory Leaks
```typescript
// Problem: Event listeners not cleaned up
useEffect(() => {
  const handleResize = () => updateLayout();
  window.addEventListener('resize', handleResize);
  // Missing cleanup
}, []);

// Solution: Proper cleanup
useEffect(() => {
  const handleResize = () => updateLayout();
  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

### Production Issues

#### Issue: Bundle Size Too Large
```javascript
// Analysis: Use webpack-bundle-analyzer
npm install --save-dev webpack-bundle-analyzer
npx webpack-bundle-analyzer dist/static/js/*.js

// Solutions:
// 1. Dynamic imports for large dependencies
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// 2. Tree shaking configuration
// webpack.config.js
module.exports = {
  optimization: {
    usedExports: true,
    sideEffects: false
  }
};

// 3. Replace large libraries with smaller alternatives
// Instead of: import _ from 'lodash';
// Use: import debounce from 'lodash/debounce';
```

#### Issue: Cache Problems
```typescript
// Debugging cache issues
export class CacheDebugger {
  static diagnoseCacheIssues(): CacheDiagnostic {
    const memoryStats = this.getMemoryCacheStats();
    const storageStats = this.getStorageCacheStats();
    
    return {
      memoryHitRate: memoryStats.hits / (memoryStats.hits + memoryStats.misses),
      storageUsage: storageStats.used / storageStats.available,
      evictionRate: memoryStats.evictions / memoryStats.total,
      recommendations: this.generateRecommendations(memoryStats, storageStats)
    };
  }

  private static generateRecommendations(
    memory: CacheStats, 
    storage: CacheStats
  ): string[] {
    const recommendations = [];
    
    if (memory.hitRate < 0.8) {
      recommendations.push('Consider increasing memory cache size');
    }
    
    if (storage.usage > 0.9) {
      recommendations.push('Storage cache approaching limit, enable cleanup');
    }
    
    return recommendations;
  }
}
```

### Debugging Tools and Techniques

#### React Developer Tools Integration
```typescript
// Enhanced component debugging
export const WACCCalculatorWithDebug: React.FC<Props> = (props) => {
  // Development-only debugging
  if (process.env.NODE_ENV === 'development') {
    useEffect(() => {
      // Add component to React DevTools
      (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__?.onCommitFiberRoot?.(
        null,
        'WACCCalculator',
        props
      );
    });
  }

  return <WACCCalculator {...props} />;
};
```

#### Performance Profiling
```typescript
// Performance profiling utilities
export class PerformanceProfiler {
  static profileComponent<T extends React.ComponentType<any>>(
    Component: T,
    componentName: string
  ): T {
    return React.forwardRef((props, ref) => {
      const renderStart = performance.now();
      
      useLayoutEffect(() => {
        const renderEnd = performance.now();
        console.log(`${componentName} render time: ${renderEnd - renderStart}ms`);
      });

      return React.createElement(Component, { ...props, ref });
    }) as any;
  }

  static measureAsyncOperation<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const start = performance.now();
      
      try {
        const result = await operation();
        const end = performance.now();
        
        console.log(`${operationName} completed in ${end - start}ms`);
        resolve(result);
      } catch (error) {
        const end = performance.now();
        console.error(`${operationName} failed after ${end - start}ms:`, error);
        reject(error);
      }
    });
  }
}
```

---

## API Reference

### Core Calculation API

#### WACCCalculationEngine

##### Constructor
```typescript
new WACCCalculationEngine(options?: EngineOptions)
```

**Parameters:**
- `options.cache?`: Custom cache configuration
- `options.performanceMonitor?`: Custom performance monitor
- `options.validator?`: Custom validation schema

##### Methods

###### calculateWACC
```typescript
async calculateWACC(input: WACCInputData): Promise<WACCResult>
```

**Description:** Performs complete WACC calculation with caching and validation.

**Parameters:**
- `input: WACCInputData` - Complete input data structure

**Returns:** `Promise<WACCResult>` - Calculation result with metadata

**Throws:**
- `WACCValidationError` - Invalid input data
- `WACCCalculationError` - Calculation failure

**Example:**
```typescript
const engine = new WACCCalculationEngine();
const input = {
  buildUpModel: [
    { name: 'Risk-free Rate', value: 3.5 },
    { name: 'Market Risk Premium', value: 6.0 }
  ],
  costOfDebtCalculations: [/* ... */],
  weightData: { weightOfDebt: 40, weightOfEquity: 60 },
  waccBuildUpSelectionType: 1,
  isWeightDataEdited: false,
  taxRate: 25
};

const result = await engine.calculateWACC(input);
console.log(`WACC: ${result.weightedAverageCostOfCapital}`);
```

###### createSampleData
```typescript
static createSampleData(): WACCInputData
```

**Description:** Creates sample input data for testing and demos.

**Returns:** `WACCInputData` - Complete sample data structure

### Excel Integration API

#### EnhancedExcelWACCGenerator

##### Constructor
```typescript
new EnhancedExcelWACCGenerator(options?: GeneratorOptions)
```

**Parameters:**
- `options.platformInfo?`: Target platform information
- `options.retryConfig?`: Retry logic configuration
- `options.performanceMonitor?`: Performance tracking

##### Methods

###### generateWACCTable
```typescript
async generateWACCTable(
  input: WACCInputData,
  result: WACCResult,
  template: WACCTemplate
): Promise<ExcelGenerationResult>
```

**Description:** Generates formatted WACC table in Excel with platform adaptation.

**Parameters:**
- `input: WACCInputData` - Original calculation input
- `result: WACCResult` - Calculation results
- `template: WACCTemplate` - Formatting template

**Returns:** `Promise<ExcelGenerationResult>` - Generation result with metrics

**Example:**
```typescript
const generator = new EnhancedExcelWACCGenerator();
const generationResult = await generator.generateWACCTable(
  inputData,
  calculationResult,
  WACCTemplates.find(t => t.id === 'professional')
);

if (generationResult.success) {
  console.log(`Generated in ${generationResult.generationTime}ms`);
}
```

###### detectPlatformCapabilities
```typescript
static detectPlatformCapabilities(): PlatformInfo
```

**Description:** Detects current Excel platform and available capabilities.

**Returns:** `PlatformInfo` - Platform details and feature support

### React Hooks API

#### useEnhancedExcelIntegration

```typescript
function useEnhancedExcelIntegration(): EnhancedUseExcelIntegrationReturn
```

**Description:** Enhanced Excel integration hook with advanced features.

**Returns:** Object with the following properties:

##### Core Methods
- `generateExcelTable(result: WACCResult, template: WACCTemplate): Promise<void>`
- `readExcelData(): Promise<WACCInputData | null>`
- `writeExcelData(data: WACCInputData): Promise<void>`

##### Enhanced Properties
- `platformInfo: PlatformInfo | null` - Current platform information
- `performanceMetrics: GenerationMetrics | null` - Performance data
- `syncStatus: SyncStatus` - Current synchronization state
- `connectionStatus: ConnectionStatus` - Excel connection state

##### Enhanced Methods
- `checkWorksheetExists(): Promise<boolean>`
- `syncWithExcel(): Promise<ExcelReadResult>`
- `testConnection(): Promise<boolean>`
- `clearWorksheet(): Promise<void>`

**Example:**
```typescript
const {
  generateExcelTable,
  platformInfo,
  syncStatus,
  connectionStatus
} = useEnhancedExcelIntegration();

// Check platform capabilities
if (platformInfo?.capabilities.includes('colorFormatting')) {
  // Use advanced formatting
}

// Monitor sync status
useEffect(() => {
  if (syncStatus === 'error') {
    // Handle sync error
  }
}, [syncStatus]);
```

#### useOptimizedWACC

```typescript
function useOptimizedWACC(inputData: WACCInputData): UseOptimizedWACCReturn
```

**Description:** Performance-optimized WACC calculation hook with caching.

**Parameters:**
- `inputData: WACCInputData` - Input data for calculation

**Returns:** Object with:
- `calculationResult: WACCResult | null` - Current calculation result
- `isCalculating: boolean` - Calculation in progress
- `calculationError: Error | null` - Any calculation error
- `selectors: WACCSelectors` - Memoized selector functions

**Example:**
```typescript
const { calculationResult, isCalculating, selectors } = useOptimizedWACC(inputData);

// Use memoized selectors to prevent unnecessary re-renders
const costOfEquity = selectors.getCostOfEquity();
const wacc = selectors.getWACC();
```

### Type Definitions

#### Core Types

##### WACCInputData
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

##### WACCResult
```typescript
interface WACCResult {
  costOfEquity: number;
  costOfDebt: number;
  weightOfDebt: number;
  weightOfEquity: number;
  taxRate: number;
  weightedAverageCostOfCapital: number;
  capitalStructureTable: CapitalStructureRow[];
  calculationTimestamp: Date;
  inputValidation: ValidationResult;
  performanceMetrics?: PerformanceMetrics;
}
```

##### WACCTemplate
```typescript
interface WACCTemplate {
  id: string;
  name: string;
  description: string;
  theme: WACCTheme;
  waccSpecific: WACCSpecificConfig;
}
```

#### Excel Integration Types

##### PlatformInfo
```typescript
interface PlatformInfo {
  platform: 'Windows' | 'Mac' | 'Online' | 'Mobile' | 'Unknown';
  version: string;
  apiVersion: string;
  capabilities: string[];
}
```

##### ExcelGenerationResult
```typescript
interface ExcelGenerationResult {
  success: boolean;
  generationTime: number;
  syncOperations: number;
  retryAttempts: number;
  platformAdaptations: string[];
  error?: string;
}
```

### Error Handling

#### Error Types

##### WACCValidationError
```typescript
class WACCValidationError extends Error {
  constructor(errors: ValidationError[]);
  readonly errors: ValidationError[];
}
```

##### WACCCalculationError
```typescript
class WACCCalculationError extends Error {
  constructor(message: string);
}
```

#### Error Handling Patterns

```typescript
try {
  const result = await engine.calculateWACC(inputData);
  return result;
} catch (error) {
  if (error instanceof WACCValidationError) {
    // Handle validation errors
    setValidationErrors(error.errors);
  } else if (error instanceof WACCCalculationError) {
    // Handle calculation errors
    setCalculationError(error.message);
  } else {
    // Handle unexpected errors
    setGeneralError('An unexpected error occurred');
  }
}
```

---

*This technical guide provides comprehensive information for developers working with the WACC Calculator. For user-focused documentation, see the [User Guide](USER_GUIDE.md) and [Installation Guide](INSTALLATION_GUIDE.md).*