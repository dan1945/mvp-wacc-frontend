module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@templates/(.*)$': '<rootDir>/src/templates/$1',
    '^@contexts/(.*)$': '<rootDir>/src/contexts/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1'
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}',
    '<rootDir>/tests/**/*.{test,spec}.{ts,tsx}'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/e2e/'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '\!src/**/*.d.ts',
    '\!src/test-setup.ts',
    '\!src/index.tsx',
    '\!src/**/*.stories.{ts,tsx}',
    '\!src/taskpane/index.tsx'
  ],
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Specific thresholds for critical components
    './src/services/WACCCalculationEngine.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    },
    './src/services/EnhancedExcelWACCGenerator.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/contexts/OptimizedWACCContext.tsx': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  // Performance testing setup
  testTimeout: 30000,
  maxWorkers: '50%',
  // Test categorization
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.unit.{test,spec}.{ts,tsx}'],
      testEnvironment: 'jsdom'
    },
    {
      displayName: 'integration', 
      testMatch: ['<rootDir>/src/**/*.integration.{test,spec}.{ts,tsx}'],
      testEnvironment: 'jsdom'
    },
    {
      displayName: 'performance',
      testMatch: ['<rootDir>/tests/performance/**/*.{test,spec}.{ts,tsx}'],
      testEnvironment: 'node'
    },
    {
      displayName: 'accessibility',
      testMatch: ['<rootDir>/tests/accessibility/**/*.{test,spec}.{ts,tsx}'],
      testEnvironment: 'jsdom'
    }
  ]
};
EOF < /dev/null