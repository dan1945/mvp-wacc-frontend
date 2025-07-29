#!/usr/bin/env node

/**
 * Health check script for WACC Calculator deployment
 * Validates critical functionality and performance metrics
 */

const https = require('https');
const http = require('http');
const { performance } = require('perf_hooks');

const CONFIG = {
  production: {
    baseUrl: 'https://werx-wacc-calculator.vercel.app',
    timeout: 10000,
    expectedResponseTime: 3000
  },
  staging: {
    baseUrl: 'https://werx-wacc-calculator-staging.vercel.app',
    timeout: 10000,
    expectedResponseTime: 3000
  }
};

class HealthChecker {
  constructor(environment = 'production') {
    this.config = CONFIG[environment];
    this.results = {
      timestamp: new Date().toISOString(),
      environment,
      checks: [],
      overall: 'unknown'
    };
  }

  async checkEndpoint(path, expectedStatus = 200, maxResponseTime = null) {
    const url = `${this.config.baseUrl}${path}`;
    const startTime = performance.now();
    
    return new Promise((resolve) => {
      const client = url.startsWith('https:') ? https : http;
      
      const request = client.get(url, {
        timeout: this.config.timeout,
        headers: {
          'User-Agent': 'WACC-Calculator-Health-Check/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      }, (response) => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        let body = '';
        response.on('data', chunk => body += chunk);
        response.on('end', () => {
          const result = {
            endpoint: path,
            url,
            status: response.statusCode,
            responseTime: Math.round(responseTime),
            expectedStatus,
            maxResponseTime: maxResponseTime || this.config.expectedResponseTime,
            success: response.statusCode === expectedStatus && 
                    responseTime <= (maxResponseTime || this.config.expectedResponseTime),
            headers: response.headers,
            bodySize: body.length
          };
          
          if (!result.success) {
            result.error = `Status: ${response.statusCode} (expected ${expectedStatus}), Response time: ${Math.round(responseTime)}ms (max ${maxResponseTime || this.config.expectedResponseTime}ms)`;
          }
          
          resolve(result);
        });
      });
      
      request.on('error', (error) => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        resolve({
          endpoint: path,
          url,
          status: 0,
          responseTime: Math.round(responseTime),
          expectedStatus,
          success: false,
          error: error.message
        });
      });
      
      request.on('timeout', () => {
        request.destroy();
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        resolve({
          endpoint: path,
          url,
          status: 0,
          responseTime: Math.round(responseTime),
          expectedStatus,
          success: false,
          error: `Timeout after ${this.config.timeout}ms`
        });
      });
    });
  }

  async checkSSL() {
    const url = this.config.baseUrl;
    return new Promise((resolve) => {
      const request = https.get(url, { timeout: 5000 }, (response) => {
        const cert = response.socket.getPeerCertificate();
        const now = new Date();
        const validFrom = new Date(cert.valid_from);
        const validTo = new Date(cert.valid_to);
        
        resolve({
          endpoint: 'SSL Certificate',
          url,
          success: now >= validFrom && now <= validTo,
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          daysUntilExpiry: Math.floor((validTo - now) / (1000 * 60 * 60 * 24)),
          issuer: cert.issuer.CN,
          subject: cert.subject.CN
        });
      });
      
      request.on('error', (error) => {
        resolve({
          endpoint: 'SSL Certificate',
          url,
          success: false,
          error: error.message
        });
      });
    });
  }

  async runAllChecks() {
    console.log(`🏥 Running health checks for ${this.results.environment} environment...`);
    console.log(`📍 Base URL: ${this.config.baseUrl}\n`);

    // Core application endpoints
    const endpoints = [
      { path: '/', name: 'Root redirect' },
      { path: '/taskpane.html', name: 'Task pane' },
      { path: '/commands.html', name: 'Commands page' },
      { path: '/manifest.xml', name: 'Office Add-in manifest' },
      { path: '/assets/images/icon-32.png', name: 'Icon assets' }
    ];

    // Check each endpoint
    for (const endpoint of endpoints) {
      process.stdout.write(`⏳ Checking ${endpoint.name}... `);
      const result = await this.checkEndpoint(endpoint.path);
      this.results.checks.push(result);
      
      if (result.success) {
        console.log(`✅ OK (${result.responseTime}ms)`);
      } else {
        console.log(`❌ FAILED - ${result.error}`);
      }
    }

    // SSL Certificate check
    process.stdout.write('⏳ Checking SSL certificate... ');
    const sslResult = await this.checkSSL();
    this.results.checks.push(sslResult);
    
    if (sslResult.success) {
      console.log(`✅ OK (expires in ${sslResult.daysUntilExpiry} days)`);
    } else {
      console.log(`❌ FAILED - ${sslResult.error}`);
    }

    // Determine overall health
    const failedChecks = this.results.checks.filter(check => !check.success);
    this.results.overall = failedChecks.length === 0 ? 'healthy' : 'unhealthy';
    this.results.failedChecks = failedChecks.length;
    this.results.totalChecks = this.results.checks.length;

    return this.results;
  }

  generateReport() {
    console.log('\n📊 HEALTH CHECK REPORT');
    console.log('='.repeat(50));
    console.log(`Environment: ${this.results.environment}`);
    console.log(`Timestamp: ${this.results.timestamp}`);
    console.log(`Overall Status: ${this.results.overall.toUpperCase()}`);
    console.log(`Success Rate: ${this.results.totalChecks - this.results.failedChecks}/${this.results.totalChecks}`);
    
    if (this.results.failedChecks > 0) {
      console.log('\n❌ FAILED CHECKS:');
      this.results.checks
        .filter(check => !check.success)
        .forEach(check => {
          console.log(`  • ${check.endpoint}: ${check.error}`);
        });
    }

    // Performance summary
    const responseTimes = this.results.checks
      .filter(check => check.responseTime)
      .map(check => check.responseTime);
    
    if (responseTimes.length > 0) {
      const avgResponseTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
      const maxResponseTime = Math.max(...responseTimes);
      
      console.log('\n⚡ PERFORMANCE SUMMARY:');
      console.log(`  Average Response Time: ${avgResponseTime}ms`);
      console.log(`  Max Response Time: ${maxResponseTime}ms`);
      console.log(`  Performance Threshold: ${this.config.expectedResponseTime}ms`);
    }

    console.log('\n' + '='.repeat(50));
    
    return this.results.overall === 'healthy' ? 0 : 1;
  }
}

// Export for programmatic use
module.exports = HealthChecker;

// CLI usage
if (require.main === module) {
  const environment = process.argv[2] || 'production';
  const checker = new HealthChecker(environment);
  
  checker.runAllChecks()
    .then(results => {
      const exitCode = checker.generateReport();
      
      // Output JSON for CI/CD integration
      if (process.env.CI) {
        console.log('\nJSON Output for CI:');
        console.log(JSON.stringify(results, null, 2));
      }
      
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('❌ Health check failed with error:', error.message);
      process.exit(1);
    });
}