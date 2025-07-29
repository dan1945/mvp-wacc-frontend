# WACC Calculator - Installation & Deployment Guide

## Table of Contents
1. [Installation Overview](#installation-overview)
2. [End User Installation](#end-user-installation)
3. [Developer Installation](#developer-installation)
4. [Office Add-in Sideloading](#office-add-in-sideloading)
5. [Production Deployment](#production-deployment)
6. [Enterprise Deployment](#enterprise-deployment)
7. [Troubleshooting Installation](#troubleshooting-installation)
8. [Platform-Specific Instructions](#platform-specific-instructions)

---

## Installation Overview

The WACC Calculator is an Office Add-in that works across multiple Excel platforms. Installation methods vary depending on your intended use:

### Installation Types

| Installation Type | Target Audience | Method | Duration |
|------------------|-----------------|---------|----------|
| **End User** | Business users, analysts | AppSource or Admin deployment | 2-5 minutes |
| **Developer** | Software developers | Sideloading with manifest | 10-15 minutes |
| **Enterprise** | IT administrators | Centralized deployment | 30-60 minutes |
| **Testing** | QA testers, beta users | Manual sideloading | 5-10 minutes |

### Supported Platforms

#### ✅ Fully Supported
- **Excel for Windows** (2019, 2021, Microsoft 365)
- **Excel for Mac** (2019, 2021, Microsoft 365)
- **Excel Online** (web browser)

#### ✅ Supported with Limitations
- **Excel Mobile** (iOS/Android) - Simplified interface
- **Excel iPad** (iOS) - Touch-optimized interface

#### ❌ Not Supported
- Excel 2016 and earlier versions
- Excel in offline mode (requires internet connection)

---

## End User Installation

### Method 1: Microsoft AppSource (Recommended)

#### Prerequisites
- Excel 2019 or later (Windows/Mac) or Excel Online
- Microsoft 365 account (personal or business)
- Internet connection

#### Installation Steps

##### From Excel Desktop (Windows/Mac)
1. **Open Excel** on your computer
2. **Click Insert tab** in the ribbon
3. **Click "Get Add-ins"** button
4. **Search for "WACC Calculator"** in the Office Store
5. **Click "Add"** next to the WACC Calculator
6. **Sign in** with your Microsoft account if prompted
7. **Grant permissions** when requested
8. **Look for WACC Calculator** in the Home ribbon

##### From Excel Online (Web)
1. **Go to office.com** and sign in
2. **Open Excel Online** (create new or open existing workbook)
3. **Click "Insert" > "Add-ins"**
4. **Browse Office Add-ins**
5. **Search for "WACC Calculator"**
6. **Click "Add"** to install
7. **Refresh the page** if the add-in doesn't appear immediately

#### Verification
```
After installation, you should see:
✅ "WACC Calculator" button in Excel ribbon
✅ Clicking opens the task pane on the right
✅ Sample calculation works without errors
```

### Method 2: Admin Deployment

If your organization's IT department has deployed the WACC Calculator centrally:

1. **Open Excel** as normal
2. **Look for WACC Calculator** in the ribbon (may be in "Admin" or "Company Apps" section)
3. **Contact IT support** if the add-in is not visible
4. **No additional installation required** - it's already deployed

---

## Developer Installation

### Prerequisites

#### Required Software
```bash
# Node.js (Latest LTS version)
# Download from: https://nodejs.org/
node --version  # Should be 16.0.0 or higher
npm --version   # Should be 8.0.0 or higher

# Git for version control
git --version

# Excel for testing (any supported platform)
```

#### Optional Tools
- **Visual Studio Code** with extensions:
  - Office Add-in Debugger
  - TypeScript and JavaScript Language Features
  - React Developer Tools
- **Office Add-in CLI**: `npm install -g office-addin-cli`

### Setup Instructions

#### 1. Clone the Repository
```bash
# Clone the repository
git clone https://github.com/your-org/werx-modern-wacc-calculator.git
cd werx-modern-wacc-calculator

# Verify repository structure
ls -la
# Should see: src/, package.json, manifest.xml, etc.
```

#### 2. Install Dependencies
```bash
# Install all dependencies
npm install

# Verify installation
npm run type-check
npm run lint
```

#### 3. Configure Environment
```bash
# Create environment file (if needed)
cp .env.example .env

# Edit environment variables
# NODE_ENV=development
# PUBLIC_URL=https://localhost:3000
```

#### 4. Start Development Server
```bash
# Start the development server
npm start

# Server will be available at:
# - Taskpane: https://localhost:3000/taskpane.html
# - Commands: https://localhost:3000/commands.html
# - Manifest: https://localhost:3000/manifest.xml
```

#### 5. Trust Development Certificate

##### Windows
```powershell
# Run PowerShell as Administrator
# Navigate to project directory
cd path\to\werx-modern-wacc-calculator

# Trust the certificate
npx office-addin-dev-certs install --machine
```

##### Mac
```bash
# Navigate to project directory
cd path/to/werx-modern-wacc-calculator

# Trust the certificate
npx office-addin-dev-certs install
```

#### 6. Verify Development Setup
```bash
# Check that all services are running
curl https://localhost:3000/taskpane.html
curl https://localhost:3000/manifest.xml

# Should return HTML and XML content respectively
```

---

## Office Add-in Sideloading

Sideloading allows you to test the add-in during development or install a custom version.

### Windows Excel (Desktop)

#### Method 1: Using Office Add-in CLI (Recommended)
```bash
# Install Office Add-in CLI globally
npm install -g office-addin-cli

# Navigate to project directory
cd werx-modern-wacc-calculator

# Start development server (if not already running)
npm start

# Sideload the add-in
npx office-addin sideload manifest.xml

# Excel will open automatically with the add-in loaded
```

#### Method 2: Manual Sideloading
1. **Open Excel** and create a new workbook
2. **Click File > Options**
3. **Select "Trust Center"** in left panel
4. **Click "Trust Center Settings"**
5. **Select "Trusted Add-in Catalogs"**
6. **Add catalog URL**: `https://localhost:3000`
7. **Check "Show in Menu"**
8. **Click OK** and restart Excel
9. **Go to Insert > My Add-ins**
10. **Select "WACC Calculator"** from the list

### Mac Excel (Desktop)

#### Method 1: Using Office Add-in CLI
```bash
# Same as Windows - CLI works cross-platform
npx office-addin sideload manifest.xml
```

#### Method 2: Manual Sideloading
1. **Open Excel** and create a new workbook
2. **Click Insert > Add-ins > My Add-ins**
3. **Click "Upload My Add-in"** at the bottom
4. **Browse to** `manifest.xml` file in your project
5. **Click "Upload"**
6. **Add-in should appear** in the ribbon

### Excel Online (Web)

1. **Go to office.com** and sign in
2. **Open Excel Online**
3. **Click Insert > Add-ins**
4. **Click "Upload My Add-in"**
5. **Upload the manifest.xml** file
6. **Add-in appears** in the ribbon

### Excel Mobile (iOS/Android)

1. **Open Excel Mobile** app
2. **Create or open** a workbook
3. **Tap the ribbon** at the bottom
4. **Tap "Add-ins"**
5. **Tap "Upload My Add-in"**
6. **Select manifest file** from cloud storage (OneDrive, etc.)

### Verification After Sideloading

```
✅ WACC Calculator button appears in Excel ribbon
✅ Clicking button opens task pane
✅ Task pane loads without errors
✅ Sample calculation produces results
✅ "Generate Excel Table" creates formatted output
```

---

## Production Deployment

### Deployment Architecture

```
Production Deployment Flow:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Source Code   │───▶│   Build Process │───▶│  Static Hosting │
│   (GitHub)      │    │   (CI/CD)       │    │   (Vercel)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Manifest XML  │◀───│   Office Store  │
                       │   (Production)  │    │   (AppSource)   │
                       └─────────────────┘    └─────────────────┘
```

### Prerequisites for Production Deployment

#### Required Accounts
- **GitHub Account**: For source code management
- **Vercel Account**: For static hosting (or similar CDN)
- **Microsoft Partner Center**: For AppSource publishing
- **Azure AD**: For app registration (if using authentication)

#### Required Certificates
- **SSL Certificate**: HTTPS is mandatory for Office Add-ins
- **Code Signing**: For enterprise distribution (optional)

### Deployment Steps

#### 1. Build Production Assets
```bash
# Navigate to project directory
cd werx-modern-wacc-calculator

# Install dependencies
npm ci

# Run production build
npm run build

# Verify build output
ls -la dist/
# Should contain: taskpane.html, commands.html, static assets
```

#### 2. Configure Production Manifest
```xml
<!-- manifest-production.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<OfficeApp xmlns="http://schemas.microsoft.com/office/appforoffice/1.1">
  <Id>12345678-1234-1234-1234-123456789012</Id>
  <Version>1.0.0</Version>
  <ProviderName>Your Organization</ProviderName>
  <DefaultLocale>en-US</DefaultLocale>
  <DisplayName DefaultValue="WACC Calculator"/>
  <Description DefaultValue="Professional WACC calculation tool"/>
  
  <!-- Production URLs -->
  <IconUrl DefaultValue="https://your-domain.com/assets/icon-32.png"/>
  <HighResolutionIconUrl DefaultValue="https://your-domain.com/assets/icon-64.png"/>
  <SupportUrl DefaultValue="https://your-domain.com/support"/>
  
  <Hosts>
    <Host Name="Workbook"/>
  </Hosts>
  
  <Requirements>
    <Sets DefaultMinVersion="1.1">
      <Set Name="ExcelApi" MinVersion="1.4"/>
    </Sets>
  </Requirements>
  
  <DefaultSettings>
    <SourceLocation DefaultValue="https://your-domain.com/taskpane.html"/>
  </DefaultSettings>
  
  <Permissions>ReadWriteDocument</Permissions>
  
  <VersionOverrides>
    <Commands>
      <Command id="ShowTaskpane">
        <Action xsi:type="ShowTaskpane">
          <TaskpaneId>ButtonId1</TaskpaneId>
          <SourceLocation resid="Taskpane.Url"/>
        </Action>
      </Command>
    </Commands>
    
    <Resources>
      <bt:Urls>
        <bt:Url id="Taskpane.Url" DefaultValue="https://your-domain.com/taskpane.html"/>
        <bt:Url id="Commands.Url" DefaultValue="https://your-domain.com/commands.html"/>
      </bt:Urls>
    </Resources>
  </VersionOverrides>
</OfficeApp>
```

#### 3. Deploy to Static Hosting

##### Option A: Vercel Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Set custom domain (optional)
vercel domains add your-domain.com
```

##### Option B: Azure Static Web Apps
```bash
# Install Azure CLI
# Follow: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

# Login to Azure
az login

# Create resource group
az group create --name wacc-calculator-rg --location eastus

# Create static web app
az staticwebapp create \
  --name wacc-calculator \
  --resource-group wacc-calculator-rg \
  --source . \
  --location eastus \
  --branch main
```

##### Option C: AWS S3 + CloudFront
```bash
# Install AWS CLI
# Follow: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html

# Configure AWS credentials
aws configure

# Create S3 bucket
aws s3 mb s3://wacc-calculator-production

# Sync build files
aws s3 sync dist/ s3://wacc-calculator-production --delete

# Create CloudFront distribution (for HTTPS)
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

#### 4. Configure Security Headers

##### Content Security Policy (CSP)
```
Content-Security-Policy: 
  default-src 'self' https://appsforoffice.microsoft.com;
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://appsforoffice.microsoft.com;
  style-src 'self' 'unsafe-inline' https://appsforoffice.microsoft.com;
  img-src 'self' data: https:;
  connect-src 'self' https://appsforoffice.microsoft.com;
  font-src 'self' https://appsforoffice.microsoft.com;
```

##### Additional Security Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
```

#### 5. Validate Production Deployment
```bash
# Test production URLs
curl -I https://your-domain.com/taskpane.html
curl -I https://your-domain.com/commands.html
curl -I https://your-domain.com/manifest.xml

# Validate manifest XML
npx office-addin validate manifest-production.xml

# Test in Excel
# Sideload the production manifest to verify functionality
```

### Continuous Deployment Setup

#### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:ci
      
      - name: Build production
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
      
      - name: Update manifest URLs
        run: |
          sed -i 's|localhost:3000|your-domain.com|g' manifest-production.xml
      
      - name: Validate deployment
        run: |
          curl -f https://your-domain.com/taskpane.html
          curl -f https://your-domain.com/manifest.xml
```

---

## Enterprise Deployment

### Centralized Deployment Overview

Enterprise deployment allows IT administrators to deploy the WACC Calculator to all users in the organization without individual installations.

### Prerequisites

#### Administrative Requirements
- **Microsoft 365 Admin Center** access
- **Global Administrator** or **SharePoint Administrator** role
- **Azure AD** tenant with appropriate licenses
- **PowerShell** with SharePoint Online module

#### Technical Requirements
- **Custom manifest** with organization-specific settings
- **Internal hosting** or approved external hosting
- **Security compliance** review and approval

### Deployment Methods

#### Method 1: SharePoint App Catalog (Recommended)

##### 1. Prepare the Manifest
```xml
<!-- manifest-enterprise.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<OfficeApp xmlns="http://schemas.microsoft.com/office/appforoffice/1.1">
  <Id>YOUR-ENTERPRISE-GUID</Id>
  <Version>1.0.0</Version>
  <ProviderName>Your Organization</ProviderName>
  <DefaultLocale>en-US</DefaultLocale>
  <DisplayName DefaultValue="WACC Calculator - Enterprise"/>
  <Description DefaultValue="Enterprise WACC calculation tool"/>
  
  <!-- Enterprise-specific URLs -->
  <IconUrl DefaultValue="https://your-internal-domain.com/assets/icon-32.png"/>
  <SupportUrl DefaultValue="https://helpdesk.your-org.com/wacc-calculator"/>
  
  <!-- Enterprise security settings -->
  <AppDomains>
    <AppDomain>https://your-internal-domain.com</AppDomain>
  </AppDomains>
  
  <DefaultSettings>
    <SourceLocation DefaultValue="https://your-internal-domain.com/taskpane.html"/>
  </DefaultSettings>
  
  <Permissions>ReadWriteDocument</Permissions>
</OfficeApp>
```

##### 2. Upload to SharePoint App Catalog
```powershell
# Connect to SharePoint Online
Connect-SPOService -Url https://yourtenant-admin.sharepoint.com

# Upload add-in to app catalog
Add-SPOApp -Path ".\manifest-enterprise.xml" -Publish

# Verify deployment
Get-SPOApp | Where-Object {$_.Name -eq "WACC Calculator"}
```

##### 3. Deploy to Organization
```powershell
# Deploy to all users
Install-SPOApp -Identity "WACC Calculator" -Scope Organization

# Or deploy to specific groups
Install-SPOApp -Identity "WACC Calculator" -Scope SiteCollection -SiteUrl "https://yourtenant.sharepoint.com/sites/finance"
```

#### Method 2: Microsoft 365 Admin Center

1. **Access Admin Center**
   - Go to [admin.microsoft.com](https://admin.microsoft.com)
   - Sign in with admin credentials

2. **Navigate to Add-ins**
   - Click "Settings" > "Integrated apps"
   - Or go to "Setup" > "Apps and services"

3. **Upload Custom Add-in**
   - Click "Upload custom apps"
   - Select "Office Add-in"
   - Upload the manifest file

4. **Configure Deployment**
   - Select target users or groups
   - Configure permissions and settings
   - Enable automatic updates

5. **Monitor Deployment**
   - Check deployment status
   - Review user adoption metrics
   - Handle support requests

#### Method 3: PowerShell Automation

```powershell
# Enterprise deployment script
param(
    [Parameter(Mandatory=$true)]
    [string]$TenantUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$ManifestPath,
    
    [Parameter(Mandatory=$false)]
    [string[]]$TargetGroups = @("All Users")
)

# Connect to services
Connect-SPOService -Url "$TenantUrl-admin.sharepoint.com"
Connect-MicrosoftTeams

# Upload and deploy add-in
try {
    Write-Host "Uploading WACC Calculator add-in..." -ForegroundColor Green
    $app = Add-SPOApp -Path $ManifestPath -Publish
    
    Write-Host "Deploying to organization..." -ForegroundColor Green
    Install-SPOApp -Identity $app.Id -Scope Organization
    
    # Configure user assignments
    foreach ($group in $TargetGroups) {
        Write-Host "Assigning to group: $group" -ForegroundColor Yellow
        # Add group assignment logic here
    }
    
    Write-Host "Deployment completed successfully!" -ForegroundColor Green
}
catch {
    Write-Error "Deployment failed: $($_.Exception.Message)"
}
```

### Enterprise Configuration

#### Security and Compliance

##### Data Classification
```json
{
  "dataClassification": {
    "level": "Internal",
    "retention": "7 years",
    "encryption": "required",
    "auditLogging": "enabled"
  },
  "accessControl": {
    "allowedDomains": ["*.your-org.com"],
    "blockedDomains": ["public-file-sharing.com"],
    "requireMFA": true
  }
}
```

##### Audit Configuration
```xml
<!-- Add to manifest for audit compliance -->
<ExtensionPoint xsi:type="CustomPane">
  <Audit>
    <LogLevel>Detailed</LogLevel>
    <RetentionDays>2555</RetentionDays> <!-- 7 years -->
    <LogDestination>AzureLog</LogDestination>
  </Audit>
</ExtensionPoint>
```

#### Custom Branding

```xml
<!-- Enterprise branding in manifest -->
<IconUrl DefaultValue="https://internal.your-org.com/assets/company-icon-32.png"/>
<HighResolutionIconUrl DefaultValue="https://internal.your-org.com/assets/company-icon-64.png"/>

<Resources>
  <bt:Images>
    <bt:Image id="Icon.16x16" DefaultValue="https://internal.your-org.com/assets/wacc-16.png"/>
    <bt:Image id="Icon.32x32" DefaultValue="https://internal.your-org.com/assets/wacc-32.png"/>
    <bt:Image id="Icon.80x80" DefaultValue="https://internal.your-org.com/assets/wacc-80.png"/>
  </bt:Images>
  
  <bt:Strings>
    <bt:String id="GetStarted.Title" DefaultValue="WACC Calculator - YourCompany Edition"/>
    <bt:String id="CommandsGroup.Label" DefaultValue="YourCompany Financial Tools"/>
  </bt:Strings>
</Resources>
```

### User Training and Support

#### Training Materials
Create organization-specific training materials:

1. **Quick Start Guide**
   - Company-specific examples
   - Internal process integration
   - Support contact information

2. **Video Tutorials**
   - Screen recordings with company data
   - Integration with existing workflows
   - Troubleshooting common issues

3. **Internal Documentation**
   - Link to company financial policies
   - Approval workflows for WACC calculations
   - Data governance requirements

#### Support Structure
```
Support Tier Structure:
┌─────────────────┐
│ Level 1: Help   │ ──▶ Basic usage questions
│ Desk            │     Installation issues
└─────────────────┘
          │
          ▼
┌─────────────────┐
│ Level 2: IT     │ ──▶ Technical configuration
│ Support         │     System integration
└─────────────────┘
          │
          ▼
┌─────────────────┐
│ Level 3:        │ ──▶ Custom development
│ Development     │     Advanced troubleshooting
└─────────────────┘
```

---

## Troubleshooting Installation

### Common Installation Issues

#### Issue: Add-in Not Appearing in Ribbon

##### Symptoms
- WACC Calculator button not visible in Excel ribbon
- Add-in shows as installed but doesn't function
- Error message: "Add-in could not be loaded"

##### Causes & Solutions

**Cause 1: Certificate Trust Issues**
```bash
# Solution: Trust the development certificate
# Windows (run as Administrator)
npx office-addin-dev-certs install --machine

# Mac
npx office-addin-dev-certs install

# Verify certificate installation
npx office-addin-dev-certs verify
```

**Cause 2: Incorrect Manifest URLs**
```xml
<!-- Problem: localhost URLs in production -->
<SourceLocation DefaultValue="http://localhost:3000/taskpane.html"/>

<!-- Solution: Use production URLs with HTTPS -->
<SourceLocation DefaultValue="https://your-domain.com/taskpane.html"/>
```

**Cause 3: Office Version Compatibility**
```javascript
// Check Office version compatibility
if (!Office.context.requirements.isSetSupported('ExcelApi', '1.4')) {
  console.error('Excel API 1.4 or higher is required');
  // Show upgrade message to user
}
```

#### Issue: Task Pane Won't Load

##### Symptoms
- Ribbon button works but task pane shows blank or error
- Console errors about CORS or loading failures
- Task pane shows "This add-in is not available"

##### Solutions

**Solution 1: Check HTTPS Configuration**
```bash
# Verify HTTPS is working
curl -I https://your-domain.com/taskpane.html

# Expected response:
# HTTP/2 200
# content-type: text/html
# content-security-policy: ...
```

**Solution 2: Verify Content Security Policy**
```html
<!-- Add to taskpane.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self' https://appsforoffice.microsoft.com; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
               style-src 'self' 'unsafe-inline';">
```

**Solution 3: Check Network Connectivity**
```javascript
// Add connection test to taskpane
Office.onReady(() => {
  // Test connectivity
  fetch('/manifest.xml')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      console.log('Connectivity test passed');
    })
    .catch(error => {
      console.error('Connectivity test failed:', error);
      // Show user-friendly error message
    });
});
```

#### Issue: Excel Integration Failures

##### Symptoms
- Calculator works but "Generate Excel Table" fails
- Error: "Excel.run is not a function"
- Permissions errors when writing to worksheet

##### Solutions

**Solution 1: Verify Office.js Loading**
```html
<!-- Ensure Office.js is loaded before app scripts -->
<script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js"></script>
<script>
  Office.onReady((info) => {
    if (info.host === Office.HostType.Excel) {
      console.log('Excel integration ready');
      // Initialize app
    } else {
      console.error('Not running in Excel');
    }
  });
</script>
```

**Solution 2: Check Permissions in Manifest**
```xml
<!-- Ensure correct permissions -->
<Permissions>ReadWriteDocument</Permissions>

<!-- For more advanced features -->
<Permissions>ReadAllDocument</Permissions>
```

**Solution 3: Test Excel API Support**
```typescript
// Test Excel API availability
const testExcelAPI = async (): Promise<boolean> => {
  try {
    await Excel.run(async (context) => {
      const worksheet = context.workbook.worksheets.getActiveWorksheet();
      worksheet.load('name');
      await context.sync();
      return true;
    });
  } catch (error) {
    console.error('Excel API test failed:', error);
    return false;
  }
};
```

### Platform-Specific Issues

#### Windows Excel Issues

**Issue: PowerShell Execution Policy**
```powershell
# Error: "execution of scripts is disabled on this system"
# Solution: Allow script execution (run as Administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Verify policy
Get-ExecutionPolicy -List
```

**Issue: Windows Defender SmartScreen**
```
# Error: "Windows protected your PC"
# Solution: Add exception for development certificates
# 1. Click "More info"
# 2. Click "Run anyway"
# 3. Or add certificate to trusted certificates
```

#### Mac Excel Issues

**Issue: macOS Gatekeeper**
```bash
# Error: "cannot be opened because the developer cannot be verified"
# Solution: Allow app in System Preferences
# 1. System Preferences > Security & Privacy
# 2. Click "Allow Anyway" next to blocked app
# 3. Or disable Gatekeeper temporarily (not recommended)
sudo spctl --master-disable
```

**Issue: Keychain Access**
```bash
# Error: Certificate not trusted
# Solution: Add certificate to Keychain
# 1. Open Keychain Access
# 2. Drag certificate file to "System" keychain
# 3. Double-click certificate > Trust > Always Trust
```

#### Excel Online Issues

**Issue: Browser Compatibility**
```javascript
// Check browser support
const checkBrowserSupport = () => {
  const isSupported = 
    'fetch' in window &&
    'Promise' in window &&
    'Object.assign' in window;
    
  if (!isSupported) {
    alert('This browser is not supported. Please use Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+');
  }
};
```

**Issue: Third-Party Cookies**
```
# Error: Add-in won't load in iframe
# Solution: Enable third-party cookies for office.com
# Chrome: Settings > Privacy > Cookies > Allow all cookies
# Firefox: Preferences > Privacy > Standard protection
# Safari: Preferences > Privacy > Prevent cross-site tracking (disable)
```

### Advanced Troubleshooting

#### Debug Mode Configuration
```typescript
// Enable debug mode for detailed logging
interface DebugConfig {
  enableLogging: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  logToConsole: boolean;
  logToFile: boolean;
}

const debugConfig: DebugConfig = {
  enableLogging: process.env.NODE_ENV === 'development',
  logLevel: 'debug',
  logToConsole: true,
  logToFile: false
};

// Debug utility
class DebugLogger {
  static log(level: string, message: string, data?: any): void {
    if (!debugConfig.enableLogging) return;
    
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (debugConfig.logToConsole) {
      console[level as keyof Console](logMessage, data);
    }
    
    if (debugConfig.logToFile) {
      // Implement file logging for electron apps
    }
  }
}
```

#### Network Diagnostics
```typescript
// Network connectivity testing
class NetworkDiagnostics {
  static async runDiagnostics(): Promise<DiagnosticResult> {
    const results = {
      internetConnectivity: false,
      officeServicesReachable: false,
      manifestAccessible: false,
      taskpaneAccessible: false,
      errors: [] as string[]
    };

    try {
      // Test internet connectivity
      const internetTest = await fetch('https://www.microsoft.com', { mode: 'no-cors' });
      results.internetConnectivity = true;
    } catch (error) {
      results.errors.push('No internet connectivity');
    }

    try {
      // Test Office services
      const officeTest = await fetch('https://appsforoffice.microsoft.com', { mode: 'no-cors' });
      results.officeServicesReachable = true;
    } catch (error) {
      results.errors.push('Cannot reach Office services');
    }

    // Additional tests...
    return results;
  }
}
```

### Getting Help

#### Support Resources

**Self-Help Resources**
- [User Guide](USER_GUIDE.md) - Complete user documentation
- [Technical Guide](TECHNICAL_GUIDE.md) - Developer documentation
- [FAQ Section](#faq) - Common questions and answers

**Community Support**
- GitHub Issues: Report bugs and request features
- Stack Overflow: Tag questions with 'office-js' and 'wacc-calculator'
- Microsoft Tech Community: Office development discussions

**Enterprise Support**
- IT Help Desk: Internal installation and configuration issues
- Microsoft Support: Office platform and API issues
- Professional Services: Custom development and integration

#### Diagnostic Information Collection

When reporting issues, please include:

```bash
# System information
node --version
npm --version
git --version

# Office version (from Excel > File > Account)
# Browser information (if using Excel Online)
# Operating system version

# Error logs from browser console
# Network requests from developer tools
# Manifest validation results
```

---

## Platform-Specific Instructions

### Windows Excel 2019/2021/365

#### Installation Requirements
- Windows 10 version 1903 or later
- Excel 2019 or Microsoft 365 Apps
- .NET Framework 4.7.2 or later
- Internet connection for add-in functionality

#### Performance Optimization
```registry
# Registry settings for improved Office add-in performance
# (Run as Administrator)

[HKEY_CURRENT_USER\SOFTWARE\Microsoft\Office\16.0\Excel\Security]
"VBAWarnings"=dword:00000001

[HKEY_CURRENT_USER\SOFTWARE\Microsoft\Office\16.0\Excel\Options]
"EnableLivePreview"=dword:00000000
"DisableAnimations"=dword:00000001
```

#### Group Policy Configuration (Enterprise)
```xml
<!-- Office 2019 ADMX template settings -->
<policy name="OfficeAddInTrustedCatalogs" class="Machine" displayName="Office Add-in Trusted Catalogs">
  <parentCategory ref="OfficeAddIns"/>
  <supportedOn ref="Office2019OrLater"/>
  <elements>
    <list id="TrustedCatalogs" key="SOFTWARE\Policies\Microsoft\Office\16.0\Excel\Security\Trusted Locations">
      <item displayName="WACC Calculator Catalog">
        <value>
          <string>https://your-domain.com/</string>
        </value>
      </item>
    </list>
  </elements>
</policy>
```

### macOS Excel 2019/2021/365

#### Installation Requirements
- macOS 10.14 (Mojave) or later
- Excel for Mac 2019 or Microsoft 365
- 4 GB RAM minimum, 8 GB recommended
- Internet connection for add-in functionality

#### Security Configuration
```bash
# Allow Excel to access network resources
# Add to /etc/hosts if using custom domain
127.0.0.1   local-wacc-dev.com

# Trust development certificates in Keychain
security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain /path/to/cert.pem
```

#### Performance Tuning
```bash
# Disable visual effects for better performance
defaults write com.microsoft.Excel VisualEffectsEnabled -bool false

# Increase memory allocation
defaults write com.microsoft.Excel VMOptions -array "-Xmx2g" "-XX:+UseG1GC"
```

### Excel Online (Web)

#### Browser Requirements
- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

#### Security Configuration
```javascript
// Content Security Policy for Excel Online
const cspConfig = {
  'default-src': "'self' https://*.officeapps.live.com https://*.office.com",
  'script-src': "'self' 'unsafe-inline' 'unsafe-eval' https://*.office.com",
  'style-src': "'self' 'unsafe-inline' https://*.office.com",
  'img-src': "'self' data: https:",
  'connect-src': "'self' https://*.office.com https://*.microsoft.com",
  'frame-ancestors': "https://*.office.com https://*.officeapps.live.com"
};
```

#### Progressive Web App Support
```json
{
  "name": "WACC Calculator",
  "short_name": "WACC Calc",
  "description": "Professional WACC calculation tool for Excel Online",
  "start_url": "/taskpane.html",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0078d4",
  "icons": [
    {
      "src": "/assets/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

### Excel Mobile (iOS/Android)

#### Platform Limitations
- Simplified UI for touch interface
- Limited formatting capabilities
- Reduced API functionality
- Network-dependent operation

#### Touch-Optimized Interface
```css
/* Mobile-specific styles */
@media (max-width: 768px) {
  .wacc-input {
    font-size: 16px; /* Prevent zoom on iOS */
    min-height: 44px; /* Apple touch target minimum */
    padding: 12px;
  }
  
  .wacc-button {
    min-height: 48px; /* Android touch target minimum */
    margin: 8px 0;
  }
}
```

#### Mobile Performance Optimization
```typescript
// Optimize for mobile performance
const mobileOptimizations = {
  // Reduce animation complexity
  disableAnimations: () => {
    document.body.classList.add('reduce-motion');
  },
  
  // Lazy load non-critical features
  loadFeaturesOnDemand: async () => {
    const { AdvancedFeatures } = await import('./AdvancedFeatures');
    return AdvancedFeatures;
  },
  
  // Optimize for low-memory devices
  enableMemoryManagement: () => {
    // Implement garbage collection triggers
    setInterval(() => {
      if (window.performance && window.performance.memory) {
        const memory = window.performance.memory;
        if (memory.usedJSHeapSize / memory.totalJSHeapSize > 0.8) {
          // Trigger cleanup
          window.gc && window.gc();
        }
      }
    }, 30000);
  }
};
```

---

*This installation guide provides comprehensive instructions for deploying the WACC Calculator across all supported platforms. For additional support, see the [User Guide](USER_GUIDE.md) and [Technical Guide](TECHNICAL_GUIDE.md).*