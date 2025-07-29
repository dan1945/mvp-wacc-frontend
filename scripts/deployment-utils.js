#!/usr/bin/env node

/**
 * Deployment utilities for WACC Calculator
 * Provides deployment management, rollback utilities, and environment validation
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DeploymentManager {
  constructor() {
    this.environments = {
      production: {
        url: 'https://werx-wacc-calculator.vercel.app',
        domain: 'werx-wacc-calculator.vercel.app'
      },
      staging: {
        url: 'https://werx-wacc-calculator-staging.vercel.app',
        domain: 'werx-wacc-calculator-staging.vercel.app'
      }
    };
  }

  async getDeploymentInfo(environment) {
    const env = this.environments[environment];
    if (!env) {
      throw new Error(`Unknown environment: ${environment}`);
    }

    try {
      // Get current deployment info from Vercel API if available
      const deploymentInfo = {
        environment,
        url: env.url,
        domain: env.domain,
        timestamp: new Date().toISOString()
      };

      return deploymentInfo;
    } catch (error) {
      console.error('Failed to get deployment info:', error.message);
      return null;
    }
  }

  async validateDeployment(environment) {
    const env = this.environments[environment];
    const checks = [];

    console.log(`🔍 Validating ${environment} deployment...`);

    // Check main endpoints
    const endpoints = [
      '/taskpane.html',
      '/commands.html',
      '/manifest.xml',
      '/assets/images/icon-32.png'
    ];

    for (const endpoint of endpoints) {
      const result = await this.checkEndpoint(env.url + endpoint);
      checks.push({
        endpoint,
        status: result.status,
        responseTime: result.responseTime,
        success: result.success,
        error: result.error
      });

      if (result.success) {
        console.log(`✅ ${endpoint} - OK (${result.responseTime}ms)`);
      } else {
        console.log(`❌ ${endpoint} - FAILED: ${result.error}`);
      }
    }

    const failedChecks = checks.filter(check => !check.success);
    const success = failedChecks.length === 0;

    return {
      success,
      checks,
      failedChecks: failedChecks.length,
      totalChecks: checks.length
    };
  }

  async checkEndpoint(url) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const request = https.get(url, { timeout: 10000 }, (response) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        resolve({
          status: response.statusCode,
          responseTime,
          success: response.statusCode >= 200 && response.statusCode < 400,
          error: response.statusCode >= 400 ? `HTTP ${response.statusCode}` : null
        });
      });

      request.on('error', (error) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        resolve({
          status: 0,
          responseTime,
          success: false,
          error: error.message
        });
      });

      request.on('timeout', () => {
        request.destroy();
        resolve({
          status: 0,
          responseTime: 10000,
          success: false,
          error: 'Request timeout'
        });
      });
    });
  }

  async prepareRollback(fromCommit, toCommit) {
    console.log('🔄 Preparing rollback...');
    
    // Create backup tag
    const backupTag = `backup-${Date.now()}-${fromCommit.substring(0, 8)}`;
    
    try {
      execSync(`git tag -a "${backupTag}" -m "Pre-rollback backup"`, { stdio: 'inherit' });
      console.log(`✅ Created backup tag: ${backupTag}`);
    } catch (error) {
      console.error('❌ Failed to create backup tag:', error.message);
      throw error;
    }

    // Validate rollback target
    try {
      execSync(`git rev-parse --verify ${toCommit}`, { stdio: 'pipe' });
      console.log(`✅ Rollback target ${toCommit} is valid`);
    } catch (error) {
      console.error(`❌ Invalid rollback target: ${toCommit}`);
      throw error;
    }

    return {
      backupTag,
      fromCommit,
      toCommit,
      timestamp: new Date().toISOString()
    };
  }

  async performRollback(rollbackInfo, environment) {
    console.log(`🚀 Performing rollback to ${rollbackInfo.toCommit}...`);

    try {
      // Checkout rollback target
      execSync(`git checkout ${rollbackInfo.toCommit}`, { stdio: 'inherit' });
      
      // Install dependencies and build
      execSync('npm ci', { stdio: 'inherit' });
      execSync('npm run build', { stdio: 'inherit' });
      
      // Update manifest for production if needed
      if (environment === 'production') {
        this.updateManifestForProduction();
      }
      
      // Deploy to Vercel
      const deployCommand = environment === 'production' 
        ? 'vercel --prod --yes --force'
        : 'vercel --yes --env NODE_ENV=staging';
      
      execSync(deployCommand, { stdio: 'inherit' });
      
      console.log('✅ Rollback deployment completed');
      return true;
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      return false;
    }
  }

  updateManifestForProduction() {
    const manifestPath = path.join(process.cwd(), 'manifest.xml');
    const prodManifestPath = path.join(process.cwd(), 'manifest-production.xml');
    
    if (fs.existsSync(manifestPath)) {
      let manifest = fs.readFileSync(manifestPath, 'utf8');
      manifest = manifest.replace(/https:\/\/localhost:3000/g, 'https://werx-wacc-calculator.vercel.app');
      fs.writeFileSync(prodManifestPath, manifest);
      console.log('✅ Updated production manifest');
    }
  }

  async createDeploymentReport(environment, validation) {
    const report = {
      environment,
      timestamp: new Date().toISOString(),
      validation,
      deployment: await this.getDeploymentInfo(environment)
    };

    const reportPath = path.join(process.cwd(), `deployment-report-${environment}-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📊 Deployment report saved: ${reportPath}`);
    return reportPath;
  }

  async listDeployments(environment) {
    console.log(`📋 Recent deployments for ${environment}:`);
    
    try {
      // Get git log for recent deployments
      const gitLog = execSync(
        'git log --oneline --max-count=10 --format="%h %ad %s" --date=short',
        { encoding: 'utf8' }
      );
      
      console.log(gitLog);
    } catch (error) {
      console.error('Failed to get deployment history:', error.message);
    }
  }

  async monitorDeployment(environment, duration = 300000) {
    console.log(`👀 Monitoring ${environment} for ${duration / 1000} seconds...`);
    
    const startTime = Date.now();
    const checks = [];
    
    while (Date.now() - startTime < duration) {
      const validation = await this.validateDeployment(environment);
      checks.push({
        timestamp: new Date().toISOString(),
        success: validation.success,
        failedChecks: validation.failedChecks
      });
      
      if (!validation.success) {
        console.log(`⚠️  Deployment issues detected at ${new Date().toISOString()}`);
      }
      
      // Wait 30 seconds between checks
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
    
    return checks;
  }
}

// CLI Interface
if (require.main === module) {
  const manager = new DeploymentManager();
  const command = process.argv[2];
  const environment = process.argv[3] || 'production';

  switch (command) {
    case 'validate':
      manager.validateDeployment(environment)
        .then(result => {
          console.log(`\n📊 Validation Result: ${result.success ? 'PASSED' : 'FAILED'}`);
          console.log(`Success Rate: ${result.totalChecks - result.failedChecks}/${result.totalChecks}`);
          process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
          console.error('Validation error:', error.message);
          process.exit(1);
        });
      break;

    case 'rollback':
      const fromCommit = process.argv[4];
      const toCommit = process.argv[5];
      
      if (!fromCommit || !toCommit) {
        console.error('Usage: node deployment-utils.js rollback <environment> <from-commit> <to-commit>');
        process.exit(1);
      }
      
      manager.prepareRollback(fromCommit, toCommit)
        .then(rollbackInfo => manager.performRollback(rollbackInfo, environment))
        .then(success => {
          if (success) {
            console.log('✅ Rollback completed successfully');
            return manager.validateDeployment(environment);
          } else {
            throw new Error('Rollback failed');
          }
        })
        .then(validation => {
          if (validation.success) {
            console.log('✅ Post-rollback validation passed');
            process.exit(0);
          } else {
            console.log('❌ Post-rollback validation failed');
            process.exit(1);
          }
        })
        .catch(error => {
          console.error('Rollback error:', error.message);
          process.exit(1);
        });
      break;

    case 'monitor':
      const duration = parseInt(process.argv[4]) || 300000;
      manager.monitorDeployment(environment, duration)
        .then(checks => {
          const failures = checks.filter(check => !check.success);
          console.log(`\n📈 Monitoring completed. Failures: ${failures.length}/${checks.length}`);
          process.exit(failures.length > checks.length * 0.1 ? 1 : 0);
        })
        .catch(error => {
          console.error('Monitoring error:', error.message);
          process.exit(1);
        });
      break;

    case 'list':
      manager.listDeployments(environment);
      break;

    default:
      console.log('WACC Calculator Deployment Manager');
      console.log('Usage:');
      console.log('  node deployment-utils.js validate [environment]');
      console.log('  node deployment-utils.js rollback <environment> <from-commit> <to-commit>');
      console.log('  node deployment-utils.js monitor [environment] [duration-ms]');
      console.log('  node deployment-utils.js list [environment]');
      break;
  }
}

module.exports = DeploymentManager;