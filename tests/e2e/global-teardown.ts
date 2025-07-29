/**
 * Playwright Global Teardown
 * Cleans up testing environment and generates final reports
 */

import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E Test Cleanup...');
  
  try {
    // Generate performance report
    const testResultsDir = path.join(process.cwd(), 'test-results');
    
    if (fs.existsSync(testResultsDir)) {
      console.log('✅ Test results directory exists');
      
      // Generate summary report
      const summaryPath = path.join(testResultsDir, 'e2e-summary.json');
      const summary = {
        timestamp: new Date().toISOString(),
        testRun: {
          browser_projects: config.projects.map(p => p.name),
          total_tests: 0, // Will be updated by actual test results
          passed: 0,
          failed: 0,
          skipped: 0
        },
        performance: {
          note: 'Performance metrics collected during test execution'
        }
      };
      
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
      console.log('✅ E2E summary report generated');
    }
    
    // Clean up temporary files if needed
    const tempFiles = [
      'test-temp',
      'playwright-temp'
    ];
    
    for (const tempFile of tempFiles) {
      const tempPath = path.join(process.cwd(), tempFile);
      if (fs.existsSync(tempPath)) {
        fs.rmSync(tempPath, { recursive: true, force: true });
        console.log(`✅ Cleaned up temporary directory: ${tempFile}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Cleanup error (non-critical):', error);
  }
  
  console.log('✨ E2E Test Cleanup Complete!');
}

export default globalTeardown;