import React, { useState, useCallback, useMemo } from 'react';
import {
  Button,
  Text,
  MessageBar,
  Spinner,
  Card,
  CardHeader,
  CardPreview,
  CardFooter,
  Divider,
  tokens
} from '@fluentui/react-components';
import { 
  Calculator24Filled,
  DocumentTable24Regular,
  Save24Regular,
  ArrowReset24Regular,
  ErrorCircle24Regular,
  Checkmark24Filled
} from '@fluentui/react-icons';
import { WACCInputWizard } from './WACCInputWizard';
import { WACCPreviewCard } from './WACCPreviewCard';
import { TemplateSelector } from './TemplateSelector';
import { LoadingOverlay } from './LoadingOverlay';
import { useWACCData } from '../contexts/WACCDataContext';
import { useWACCCalculation } from '../hooks/useWACCCalculation';
import { useEnhancedExcelIntegration } from '../hooks/useEnhancedExcelIntegration';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { WACCTemplates } from '../templates/waccTemplates';
import { WACCTemplate, WACCInputData } from '@types/wacc';

/**
 * Main WACC Calculator Component
 * 
 * Features:
 * - Guided wizard interface for data input
 * - Real-time calculation preview
 * - Template-based Excel generation
 * - Local storage persistence
 * - Comprehensive error handling
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Responsive design for Office taskpane
 */
export const WACCCalculator: React.FC = () => {
  // Context and state management
  const { inputData, setInputData, validationErrors } = useWACCData();
  const [selectedTemplate, setSelectedTemplate] = useState<WACCTemplate>(WACCTemplates[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [lastOperation, setLastOperation] = useState<string | null>(null);

  // Custom hooks for business logic
  const { calculationResult, isCalculating, calculationError } = useWACCCalculation(inputData);
  const { 
    generateExcelTable, 
    readExcelData, 
    isExcelAvailable,
    platformInfo,
    performanceMetrics,
    syncStatus,
    connectionStatus,
    lastSyncTime,
    testConnection
  } = useEnhancedExcelIntegration();
  const { saveData, restoreData, clearData } = useLocalStorage<WACCInputData>('wacc_input_data');

  // Memoized validation state for performance
  const hasValidationErrors = useMemo(() => 
    validationErrors.length > 0, [validationErrors]
  );

  const canGenerate = useMemo(() => 
    calculationResult && 
    !hasValidationErrors && 
    !isCalculating && 
    isExcelAvailable && 
    syncStatus !== 'syncing' && 
    connectionStatus !== 'offline', 
    [calculationResult, hasValidationErrors, isCalculating, isExcelAvailable, syncStatus, connectionStatus]
  );

  // Show success message temporarily
  const showTemporarySuccess = useCallback((message: string): void => {
    setLastOperation(message);
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
      setLastOperation(null);
    }, 3000);
  }, []);

  // Generate Excel table handler
  const handleGenerateExcelTable = useCallback(async (): Promise<void> => {
    if (!calculationResult) return;

    setIsGenerating(true);
    try {
      await generateExcelTable(calculationResult, selectedTemplate);
      const platformStr = platformInfo ? ` on ${platformInfo.platform}` : '';
      const performanceStr = performanceMetrics ? ` (${performanceMetrics.totalTime.toFixed(0)}ms)` : '';
      showTemporarySuccess(`WACC table generated successfully${platformStr}${performanceStr}`);
    } catch (error) {
      console.error('Failed to generate Excel table:', error);
      // Error will be handled by error boundary
    } finally {
      setIsGenerating(false);
    }
  }, [calculationResult, selectedTemplate, generateExcelTable, showTemporarySuccess, platformInfo, performanceMetrics]);

  // Save data to local storage
  const handleSaveData = useCallback((): void => {
    try {
      saveData(inputData);
      showTemporarySuccess('WACC data saved to local storage');
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }, [inputData, saveData, showTemporarySuccess]);

  // Restore data from storage or Excel
  const handleRestoreData = useCallback(async (): Promise<void> => {
    try {
      const savedData = restoreData();
      if (savedData) {
        setInputData(savedData);
        showTemporarySuccess('WACC data restored from local storage');
        return;
      }

      // Try to load from Excel if no local data
      if (isExcelAvailable) {
        const excelData = await readExcelData();
        if (excelData) {
          setInputData(excelData);
          showTemporarySuccess('WACC data restored from Excel');
          return;
        }
      }

      showTemporarySuccess('No saved data found');
    } catch (error) {
      console.error('Failed to restore data:', error);
    }
  }, [restoreData, setInputData, readExcelData, isExcelAvailable, showTemporarySuccess]);

  // Clear all data
  const handleClearData = useCallback((): void => {
    try {
      clearData();
      // Reset to defaults would be handled by the context
      showTemporarySuccess('WACC data cleared');
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }, [clearData, showTemporarySuccess]);

  return (
    <div className="w-full space-y-6" role="main" aria-label="WACC Calculator Interface">
      {/* Accessibility Live Regions */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {syncStatus === 'syncing' && 'Excel sync in progress'}
        {syncStatus === 'error' && 'Excel sync failed'}
        {connectionStatus === 'offline' && 'Excel connection is offline'}
        {connectionStatus === 'unstable' && 'Excel connection is unstable'}
        {isGenerating && 'Generating WACC table in Excel'}
        {performanceMetrics && lastOperation && 
          `${lastOperation}. Performance: ${performanceMetrics.totalTime.toFixed(0)} milliseconds, ${performanceMetrics.batchOperations} operations completed.`
        }
      </div>
      
      <div className="sr-only" role="alert" aria-live="assertive" aria-atomic="true">
        {validationErrors.length > 0 && 
          `${validationErrors.length} validation error${validationErrors.length > 1 ? 's' : ''} found. Please review and correct before proceeding.`
        }
        {calculationError && `Calculation error: ${calculationError.message}`}
      </div>

      {/* Header Section */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center space-x-3 mb-2">
          <Calculator24Filled 
            style={{ fontSize: '24px', color: tokens.colorBrandBackground }}
            aria-hidden="true" 
          />
          <Text 
            variant="xxLarge" 
            as="h1" 
            id="wacc-calculator-title"
            aria-describedby="wacc-calculator-description"
            className="text-office-gray font-semibold"
          >
            WACC Calculator
          </Text>
        </div>
        <Text 
          variant="medium" 
          id="wacc-calculator-description"
          color="secondary"
          className="text-gray-600"
        >
          Calculate Weighted Average Cost of Capital with guided input and real-time preview
        </Text>
      </div>

      {/* Success Message */}
      {showSuccessMessage && lastOperation && (
        <MessageBar 
          intent="success"
          role="status"
          aria-live="polite"
          className="wacc-success-message"
        >
          <div className="flex items-center space-x-2">
            <Checkmark24Filled style={{ color: tokens.colorPaletteGreenForeground1 }} />
            <Text weight="semibold">{lastOperation}</Text>
          </div>
        </MessageBar>
      )}

      {/* Error Messages */}
      {validationErrors.length > 0 && (
        <MessageBar 
          intent="error"
          role="alert"
          aria-live="polite"
          className="wacc-error-message"
        >
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <ErrorCircle24Regular style={{ color: tokens.colorPaletteRedForeground1 }} />
              <Text weight="semibold">Input Validation Errors:</Text>
            </div>
            <ul style={{ margin: 0, paddingLeft: tokens.spacingHorizontalM }}>
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm">
                  {error.field && <strong>{error.field}:</strong>} {error.message}
                </li>
              ))}
            </ul>
          </div>
        </MessageBar>
      )}

      {calculationError && (
        <MessageBar 
          intent="error"
          role="alert"
          aria-live="polite"
          className="wacc-error-message"
        >
          <div className="flex items-center space-x-2">
            <ErrorCircle24Regular style={{ color: tokens.colorPaletteRedForeground1 }} />
            <Text weight="semibold">Calculation Error: {calculationError.message}</Text>
          </div>
        </MessageBar>
      )}

      {/* Excel Availability Warning */}
      {!isExcelAvailable && (
        <MessageBar 
          intent="warning"
          role="alert"
          aria-live="polite"
        >
          <Text>
            Excel integration is not available. The calculator will work in preview mode only.
          </Text>
        </MessageBar>
      )}

      {/* Performance and Connection Status */}
      {platformInfo && (
        <Card 
          className="wacc-card border-l-4 border-blue-500"
          role="region"
          aria-labelledby="platform-status-title"
          aria-describedby="platform-status-description"
        >
          <CardPreview>
            <div 
              className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4"
              role="group"
              aria-label="Excel platform and performance information"
            >
              <div className="space-y-2">
                <Text 
                  variant="small" 
                  weight="semibold" 
                  className="text-gray-700"
                  id="platform-status-title"
                >
                  Platform
                </Text>
                <div className="flex items-center space-x-2">
                  <div 
                    className={`w-2 h-2 rounded-full ${
                      connectionStatus === 'online' ? 'bg-green-500' : 
                      connectionStatus === 'unstable' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    role="img"
                    aria-label={`Connection status indicator: ${connectionStatus}`}
                  />
                  <Text 
                    variant="small" 
                    className="font-mono"
                    aria-label={`Platform: ${platformInfo.platform}`}
                  >
                    {platformInfo.platform}
                  </Text>
                </div>
                <Text 
                  variant="small" 
                  color="secondary"
                  aria-label={`Version: ${platformInfo.version}`}
                >
                  {platformInfo.version}
                </Text>
              </div>
              
              <div className="space-y-2">
                <Text 
                  variant="small" 
                  weight="semibold" 
                  className="text-gray-700"
                  id="sync-status-title"
                >
                  Sync Status
                </Text>
                <div className="flex items-center space-x-2" role="group" aria-labelledby="sync-status-title">
                  {syncStatus === 'syncing' && (
                    <Spinner 
                      size="tiny" 
                      aria-label="Syncing with Excel"
                    />
                  )}
                  <Text 
                    variant="small" 
                    className={`
                      ${syncStatus === 'idle' ? 'text-gray-600' : ''}
                      ${syncStatus === 'error' ? 'text-red-600' : ''}
                      ${syncStatus === 'syncing' ? 'text-blue-600' : ''}
                    `}
                    aria-label={`Sync status: ${syncStatus}`}
                  >
                    {syncStatus.charAt(0).toUpperCase() + syncStatus.slice(1)}
                  </Text>
                </div>
                {lastSyncTime && (
                  <Text 
                    variant="small" 
                    color="secondary"
                    aria-label={`Last synchronization: ${lastSyncTime.toLocaleDateString()} at ${lastSyncTime.toLocaleTimeString()}`}
                  >
                    Last sync: {lastSyncTime.toLocaleTimeString()}
                  </Text>
                )}
              </div>
              
              {performanceMetrics && (
                <div className="space-y-2">
                  <Text 
                    variant="small" 
                    weight="semibold" 
                    className="text-gray-700"
                    id="performance-metrics-title"
                  >
                    Performance
                  </Text>
                  <div 
                    className="space-y-1" 
                    role="group" 
                    aria-labelledby="performance-metrics-title"
                    aria-label="Excel generation performance metrics"
                  >
                    <div className="flex justify-between">
                      <Text variant="small" color="secondary">Total Time:</Text>
                      <Text 
                        variant="small" 
                        className="font-mono"
                        aria-label={`Total processing time: ${performanceMetrics.totalTime.toFixed(0)} milliseconds`}
                      >
                        {performanceMetrics.totalTime.toFixed(0)}ms
                      </Text>
                    </div>
                    <div className="flex justify-between">
                      <Text variant="small" color="secondary">Operations:</Text>
                      <Text 
                        variant="small" 
                        className="font-mono"
                        aria-label={`Number of batch operations: ${performanceMetrics.batchOperations}`}
                      >
                        {performanceMetrics.batchOperations}
                      </Text>
                    </div>
                    {performanceMetrics.retryAttempts > 0 && (
                      <div className="flex justify-between">
                        <Text variant="small" color="secondary">Retries:</Text>
                        <Text 
                          variant="small" 
                          className="font-mono text-yellow-600"
                          aria-label={`Number of retry attempts: ${performanceMetrics.retryAttempts}`}
                        >
                          {performanceMetrics.retryAttempts}
                        </Text>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardPreview>
        </Card>
      )}

      {/* Input Wizard */}
      <Card className="wacc-card">
        <CardHeader
          header={
            <Text variant="large" weight="semibold">WACC Parameters</Text>
          }
          description="Enter the required data for WACC calculation using the guided wizard"
        />
        <CardPreview>
          <WACCInputWizard 
            data={inputData}
            onChange={setInputData}
            validationErrors={validationErrors}
            aria-labelledby="wacc-calculator-title"
          />
        </CardPreview>
      </Card>

      {/* Real-time Preview */}
      {calculationResult && (
        <WACCPreviewCard 
          result={calculationResult}
          isCalculating={isCalculating}
          selectedTemplate={selectedTemplate}
          showTemplatePreview={true}
        />
      )}

      {/* Template Selection */}
      <Card className="wacc-card">
        <CardHeader
          header={
            <Text variant="large" weight="semibold">Output Template</Text>
          }
          description="Choose formatting style for Excel output"
        />
        <CardPreview>
          <TemplateSelector 
            selectedTemplate={selectedTemplate}
            onTemplateChange={setSelectedTemplate}
            templates={WACCTemplates}
            calculationResult={calculationResult}
            isGenerating={isGenerating}
            lastGenerationTime={performanceMetrics?.totalTime}
            platformInfo={platformInfo}
          />
        </CardPreview>
      </Card>

      <Divider />

      {/* Action Bar */}
      <div 
        className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:justify-between lg:items-center"
        role="toolbar"
        aria-label="WACC Calculator actions"
      >
        {/* Secondary Actions */}
        <div 
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Data management actions"
        >
          <Button
            appearance="secondary"
            icon={<Save24Regular />}
            onClick={handleSaveData}
            aria-label="Save current WACC data to local storage for future use"
            aria-describedby="save-data-help"
            size="medium"
            tabIndex={0}
          >
            Save Data
          </Button>
          <span id="save-data-help" className="sr-only">
            Saves the current WACC calculation inputs to your browser's local storage
          </span>
          
          <Button
            appearance="secondary"
            icon={<ArrowReset24Regular />}
            onClick={handleRestoreData}
            aria-label="Restore WACC data from local storage or Excel worksheet"
            aria-describedby="restore-data-help"
            size="medium"
            tabIndex={0}
          >
            Restore Data
          </Button>
          <span id="restore-data-help" className="sr-only">
            Loads previously saved WACC data from local storage or Excel worksheet
          </span>
          
          <Button
            appearance="subtle"
            onClick={handleClearData}
            aria-label="Clear all WACC data and reset to defaults"
            aria-describedby="clear-data-help"
            size="medium"
            tabIndex={0}
          >
            Clear All
          </Button>
          <span id="clear-data-help" className="sr-only">
            Removes all current data and resets the calculator to default values
          </span>
        </div>

        {/* Primary Action */}
        <div 
          className="flex flex-col items-center space-y-2"
          role="group"
          aria-label="Primary action - Generate Excel table"
        >
          <Button
            appearance="primary"
            size="large"
            className="wacc-button-primary min-w-[200px]"
            disabled={!canGenerate || isGenerating}
            onClick={handleGenerateExcelTable}
            icon={isGenerating ? <Spinner size="tiny" /> : <DocumentTable24Regular />}
            aria-describedby={canGenerate ? "generate-button-success-info" : "generate-button-disabled-reason"}
            aria-label={
              isGenerating 
                ? "Generating WACC table in Excel, please wait" 
                : canGenerate 
                  ? "Generate WACC table in Excel with selected template"
                  : "Generate WACC table in Excel - currently disabled"
            }
            tabIndex={0}
          >
            {isGenerating ? 'Generating...' : 'Generate WACC Table in Excel'}
          </Button>
          
          {canGenerate && (
            <span id="generate-button-success-info" className="sr-only">
              Ready to generate WACC table using {selectedTemplate.name} template for {platformInfo?.platform || 'Excel'}
            </span>
          )}

          {/* Status Text */}
          {!canGenerate && (
            <Text 
              id="generate-button-disabled-reason" 
              variant="small"
              color="secondary"
              aria-live="polite"
              className="text-center max-w-[200px]"
            >
              {!isExcelAvailable 
                ? 'Excel integration not available' 
                : connectionStatus === 'offline'
                  ? 'Excel connection is offline'
                  : syncStatus === 'syncing'
                    ? 'Excel sync in progress...'
                    : hasValidationErrors 
                      ? 'Please fix validation errors first' 
                      : isCalculating 
                        ? 'Calculation in progress...' 
                        : 'Complete all required fields to generate'
              }
            </Text>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {isGenerating && (
        <LoadingOverlay 
          message="Generating WACC table in Excel..."
          onCancel={() => setIsGenerating(false)}
        />
      )}
    </div>
  );
};