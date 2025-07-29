import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for WACC Calculator E2E Testing
 * Comprehensive cross-browser and cross-platform testing setup
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ...(process.env.CI ? [['github']] : [])
  ],
  
  /* Shared settings for all the projects below. */
  use: {
    /* Base URL for tests */
    baseURL: 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Global test timeout */
    actionTimeout: 10 * 1000,
    
    /* Ignore HTTPS errors for local development */
    ignoreHTTPSErrors: true,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable Office.js simulation
        contextOptions: {
          permissions: ['clipboard-read', 'clipboard-write']
        }
      },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against branded browsers. */
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
  globalTeardown: require.resolve('./tests/e2e/global-teardown.ts'),

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },

  /* Accessibility testing configuration */
  expect: {
    // Global assertion timeout
    timeout: 5000,
  },

  /* Performance testing configuration */
  metadata: {
    'performance-budget': {
      'first-contentful-paint': 2000,
      'largest-contentful-paint': 4000,
      'time-to-interactive': 5000,
      'total-blocking-time': 500,
      'cumulative-layout-shift': 0.1
    }
  }
});