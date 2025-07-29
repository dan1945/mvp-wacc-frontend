# WACC Calculator - Production Deployment Guide

## Overview

This guide covers the complete DevOps infrastructure and deployment pipeline for the WACC Calculator Office Add-in, including CI/CD, monitoring, security, and rollback procedures.

## 🏗️ Infrastructure Architecture

### Deployment Platforms
- **Production**: Vercel (https://werx-wacc-calculator.vercel.app)
- **Staging**: Vercel (https://werx-wacc-calculator-staging.vercel.app)
- **CI/CD**: GitHub Actions
- **Monitoring**: Vercel Analytics + Custom monitoring
- **Security**: Snyk, CodeQL, OWASP ZAP

### Office Add-in Compatibility
- **HTTPS Required**: Office Add-ins require HTTPS hosting
- **CSP Considerations**: Content Security Policy configured for Office.js
- **Manifest URLs**: Production manifest uses https://werx-wacc-calculator.vercel.app

## 🚀 Deployment Pipeline

### Automated Deployments

#### Main CI/CD Pipeline (`.github/workflows/ci.yml`)
Triggers on:
- Push to `master`/`main` → Production deployment
- Push to `develop` → Staging deployment
- Pull requests → Build validation only

Pipeline stages:
1. **Code Quality**: ESLint, TypeScript check, Prettier
2. **Security Scan**: npm audit, Snyk scan
3. **Testing**: Unit tests, integration tests, performance benchmarks
4. **Build**: Webpack production build, manifest validation
5. **Deploy**: Vercel deployment with health checks
6. **Monitor**: Lighthouse performance audit

#### Security Pipeline (`.github/workflows/security.yml`)
Runs daily and on commits:
- Dependency vulnerability scanning
- Static code analysis (CodeQL)
- Secrets detection (TruffleHog)
- Web application security testing (OWASP ZAP)

### Required Secrets

Configure these in GitHub repository settings:

```bash
# Vercel Deployment
VERCEL_TOKEN=your_vercel_token
VERCEL_PROJECT_ID=your_project_id
VERCEL_ORG_ID=your_org_id

# Security Scanning
SNYK_TOKEN=your_snyk_token
CODECOV_TOKEN=your_codecov_token

# Notifications
SLACK_WEBHOOK=your_slack_webhook_url

# Optional: Performance Monitoring
LHCI_GITHUB_APP_TOKEN=your_lighthouse_token
```

## 📋 Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (`npm run test`)
- [ ] No linting errors (`npm run lint`)
- [ ] TypeScript compilation clean (`npm run type-check`)
- [ ] Code formatted (`npm run format:check`)

### Security
- [ ] No high-severity vulnerabilities (`npm audit`)
- [ ] Dependencies up to date
- [ ] No secrets in code
- [ ] Security headers configured

### Office Add-in Specific
- [ ] Manifest URLs point to production domain
- [ ] All required icons present in `/assets/images/`
- [ ] Task pane loads correctly
- [ ] Excel integration functions work
- [ ] CSP allows necessary Office.js resources

### Performance
- [ ] Bundle size optimized
- [ ] Lighthouse scores > 80
- [ ] WACC calculations complete in < 100ms
- [ ] Page load time < 3 seconds

## 🔧 Manual Deployment

### Initial Setup

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Link Project**:
   ```bash
   vercel link
   ```

### Deploy to Staging

```bash
# Build and deploy to staging
npm run build
vercel --env NODE_ENV=staging
```

### Deploy to Production

```bash
# Build with production manifest
npm run build
sed -i 's|localhost:3000|werx-wacc-calculator.vercel.app|g' manifest.xml

# Deploy to production
vercel --prod
```

### Verify Deployment

```bash
# Run health checks
npm run health-check production

# Validate Office Add-in
curl https://werx-wacc-calculator.vercel.app/manifest.xml
curl https://werx-wacc-calculator.vercel.app/taskpane.html
```

## 📊 Monitoring & Alerting

### Health Monitoring

The deployment includes comprehensive monitoring:

1. **Uptime Monitoring**: Continuous checks of critical endpoints
2. **Performance Monitoring**: Response times, Core Web Vitals
3. **Error Tracking**: Application errors and exceptions
4. **Security Monitoring**: SSL certificate expiry, security headers

### Key Metrics

- **Availability**: > 99.9% uptime
- **Response Time**: < 3 seconds average
- **Error Rate**: < 1% of requests
- **Performance Score**: > 80 Lighthouse score

### Alert Channels

- **Slack**: #deployments and #alerts channels
- **Email**: Development team notifications
- **PagerDuty**: Critical incidents (optional)

### Health Check Script

```bash
# Check production health
node scripts/health-check.js production

# Check staging health
node scripts/health-check.js staging

# Monitor deployment for 5 minutes
node scripts/deployment-utils.js monitor production 300000
```

## 🔄 Rollback Procedures

### Emergency Rollback

Use GitHub Actions workflow for safe rollbacks:

1. Go to GitHub Actions → "Emergency Rollback"
2. Click "Run workflow"
3. Fill in parameters:
   - **Environment**: production or staging
   - **Rollback to**: commit SHA or tag
   - **Reason**: description of why rolling back

### Manual Rollback

```bash
# Using deployment utilities
node scripts/deployment-utils.js rollback production current_sha previous_sha

# Direct Vercel rollback (if needed)
vercel rollback --token $VERCEL_TOKEN
```

### Rollback Validation

After rollback:
1. Health checks run automatically
2. Smoke tests execute
3. Team notification sent
4. Backup tag created for safety

## 🔒 Security Configuration

### Content Security Policy

The application uses a CSP configured for Office Add-ins:

```
default-src 'self' https://appsforoffice.microsoft.com;
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://appsforoffice.microsoft.com;
style-src 'self' 'unsafe-inline' https://appsforoffice.microsoft.com;
```

### Security Headers

All responses include security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`

### Vulnerability Scanning

- **Daily scans**: Automated security checks
- **Dependency monitoring**: Snyk integration
- **Code analysis**: CodeQL static analysis
- **Web security**: OWASP ZAP testing

## 📈 Performance Optimization

### Bundle Optimization

- **Code splitting**: Webpack configuration optimized
- **Tree shaking**: Unused code eliminated
- **Compression**: Gzip enabled
- **Caching**: Static assets cached for 24 hours

### Performance Monitoring

- **Lighthouse CI**: Automated performance audits
- **Core Web Vitals**: FCP, LCP, CLS tracking
- **Custom metrics**: WACC calculation performance
- **Real User Monitoring**: Vercel Analytics integration

### Performance Benchmarks

- **WACC Calculation**: < 100ms
- **Component Rendering**: < 200ms initial
- **Excel Integration**: < 2s for 1000 rows
- **Page Load**: < 3s First Contentful Paint

## 🧪 Testing Strategy

### Test Types

1. **Unit Tests**: Core calculation logic
2. **Integration Tests**: Component interactions
3. **Performance Tests**: Benchmark calculations
4. **End-to-End Tests**: Complete workflows
5. **Accessibility Tests**: WCAG compliance

### Continuous Testing

- **PR Tests**: All tests run on pull requests
- **Performance Regression**: Benchmark comparisons
- **Cross-browser Testing**: Office Add-in compatibility
- **Load Testing**: Excel integration stress tests

### Test Coverage

- **Minimum**: 75% code coverage
- **Critical Paths**: 100% coverage for WACC calculations
- **Error Handling**: Complete error scenario coverage

## 🚨 Incident Response

### Incident Classification

1. **Critical**: Application down, data loss risk
2. **High**: Major functionality broken
3. **Medium**: Performance degradation
4. **Low**: Minor issues, cosmetic problems

### Response Procedures

1. **Detection**: Automated monitoring alerts
2. **Assessment**: Health check and error analysis
3. **Response**: Rollback or hotfix deployment
4. **Communication**: Team and stakeholder updates
5. **Resolution**: Problem fixing and testing
6. **Post-mortem**: Incident analysis and improvements

### Emergency Contacts

- **DevOps Lead**: Primary incident response
- **Development Team**: Code fixes and deployment
- **Product Owner**: Business impact decisions

## 📝 Deployment Checklist Templates

### Pre-Release Checklist

- [ ] All tests passing
- [ ] Security scan clean
- [ ] Performance benchmarks met
- [ ] Office Add-in manifest updated
- [ ] Staging deployment validated
- [ ] Documentation updated
- [ ] Rollback plan prepared

### Post-Release Checklist

- [ ] Health checks passing
- [ ] Performance metrics normal
- [ ] Error rates acceptable
- [ ] Office Add-in functional
- [ ] User acceptance confirmed
- [ ] Monitoring configured
- [ ] Team notified

## 🔗 Quick Reference

### Important URLs

- **Production**: https://werx-wacc-calculator.vercel.app
- **Staging**: https://werx-wacc-calculator-staging.vercel.app
- **Repository**: https://github.com/goquantive/werx20-reportwriter
- **CI/CD**: GitHub Actions workflows

### Key Commands

```bash
# Development
npm start                    # Start development server
npm run build               # Production build
npm run test               # Run all tests
npm run validate           # Full validation

# Deployment
npm run deploy:staging     # Deploy to staging
npm run deploy:production  # Deploy to production
npm run health-check       # Verify deployment

# Monitoring
node scripts/health-check.js production
node scripts/deployment-utils.js validate production
node scripts/deployment-utils.js monitor production
```

### Support

For deployment issues or questions:
- **Documentation**: This guide and inline code comments
- **Monitoring**: Check Vercel dashboard and GitHub Actions
- **Logs**: Vercel function logs and browser developer tools
- **Team**: Development team via Slack #deployments

---

**Last Updated**: 2025-07-29  
**Version**: 1.0.0  
**Environment**: Production Ready