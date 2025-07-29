/**
 * Enhanced Jest Test Setup
 * Comprehensive testing configuration with performance monitoring and accessibility support
 */

import '@testing-library/jest-dom';
import 'jest-axe/extend-expect';

// Mock Office.js globally with comprehensive API surface
global.Office = {
  context: {
    host: 'Excel',
    platform: 'PC',
    requirements: {
      isSetSupported: jest.fn().mockReturnValue(true)
    },
    diagnostics: {
      version: '16.0.0'
    },
    ui: {
      displayDialogAsync: jest.fn(),
      closeContainer: jest.fn()
    }
  },
  onReady: jest.fn().mockResolvedValue({}),
  EventType: {
    DocumentSelectionChanged: 'DocumentSelectionChanged'
  },
  PlatformType: {
    PC: 'PC',
    Mac: 'Mac',
    OfficeOnline: 'OfficeOnline',
    iOS: 'iOS',
    Android: 'Android'
  }
};

// Enhanced Excel API mock with comprehensive coverage
global.Excel = {
  run: jest.fn().mockResolvedValue({}),
  createWorkbook: jest.fn(),
  BorderLineStyle: {
    continuous: 'Continuous',
    thin: 'Thin',
    medium: 'Medium'
  },
  ClearApplyTo: {
    all: 'All',
    contents: 'Contents',
    formats: 'Formats'
  }
};

// Enhanced Performance API mock with realistic timing
let performanceNowTime = 0;
global.performance = {
  now: jest.fn(() => {
    performanceNowTime += Math.random() * 10; // Simulate realistic timing
    return performanceNowTime;
  }),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn().mockReturnValue([]),
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000
  }
} as any;

// Global test utilities
global.testUtils = {
  // Create mock WACC data
  createMockWACCData: () => ({
    buildUpModel: [
      { name: 'Risk-free Rate', value: 3.5 },
      { name: 'Market Risk Premium', value: 6.0 },
      { name: 'Beta', value: 1.2 },
      { name: 'Size Premium', value: 2.0 },
      { name: 'Company Risk', value: 1.0 }
    ],
    costOfDebtCalculations: [
      { name: 'Base Rate', value: 2.5 },
      { name: 'Credit Spread', value: 1.5 },
      { name: 'Total Interest', value: 400000 },
      { name: 'Total Debt', value: 10000000 }
    ],
    weightData: { weightOfDebt: 40, weightOfEquity: 60 },
    waccBuildUpSelectionType: 1 as const,
    isWeightDataEdited: false,
    taxRate: 25
  }),
  
  // Create mock Excel context
  createMockExcelContext: () => ({
    workbook: {
      worksheets: {
        getItemOrNullObject: jest.fn().mockReturnValue({ isNullObject: true }),
        add: jest.fn().mockReturnThis()
      }
    },
    sync: jest.fn()
  }),
  
  // Wait for all promises to resolve
  flushPromises: () => new Promise(resolve => setImmediate(resolve))
};

// Performance testing utilities
global.performanceTestUtils = {
  // Measure execution time
  measureTime: async (fn: () => Promise<any> | any) => {
    const start = performance.now();
    await fn();
    return performance.now() - start;
  },
  
  // Performance thresholds for testing
  thresholds: {
    calculation: 100, // 100ms
    rendering: 50,    // 50ms
    excel: 2000       // 2 seconds
  }
};

// Console handling
const originalConsole = {
  error: console.error,
  warn: console.warn
};

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
});

afterEach(() => {
  jest.clearAllMocks();
  performanceNowTime = 0;
});
EOF < /dev/null