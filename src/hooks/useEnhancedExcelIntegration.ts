import { useCallback, useState, useMemo, useEffect } from 'react';
import { WACCInputData, WACCResult, WACCTemplate, UseExcelIntegrationReturn } from '@types/wacc';
import { EnhancedExcelWACCGenerator, PlatformInfo, GenerationMetrics } from '../services/EnhancedExcelWACCGenerator';
import { ExcelDataReader, ExcelReadResult } from '../services/ExcelDataReader';
import { WACCCalculationEngine } from '../services/WACCCalculationEngine';

/**
 * Enhanced Excel Integration Hook
 * 
 * Advanced Office.js integration with:
 * - Cross-platform compatibility detection
 * - Intelligent retry logic and error recovery
 * - Bidirectional data synchronization
 * - Performance monitoring and optimization
 * - Network resilience for unreliable connections
 */

export interface EnhancedUseExcelIntegrationReturn extends UseExcelIntegrationReturn {
  // Enhanced capabilities
  platformInfo: PlatformInfo | null;
  performanceMetrics: GenerationMetrics | null;
  syncStatus: 'idle' | 'reading' | 'writing' | 'syncing' | 'error';
  lastSyncTime: Date | null;
  connectionStatus: 'online' | 'offline' | 'unstable';
  
  // Enhanced methods
  checkWorksheetExists: () => Promise<boolean>;
  syncWithExcel: () => Promise<ExcelReadResult>;
  getWorksheetStats: () => Promise<any>;
  testConnection: () => Promise<boolean>;
  clearWorksheet: () => Promise<void>;
}

export const useEnhancedExcelIntegration = (): EnhancedUseExcelIntegrationReturn => {
  // Enhanced state management
  const [isExcelAvailable, setIsExcelAvailable] = useState(false);
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<GenerationMetrics | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'reading' | 'writing' | 'syncing' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'unstable'>('online');

  // Create enhanced service instances
  const enhancedGenerator = useMemo(() => new EnhancedExcelWACCGenerator(), []);
  const dataReader = useMemo(() => new ExcelDataReader(), []);
  const calculationEngine = useMemo(() => new WACCCalculationEngine(), []);

  // Initialize Excel availability and platform detection
  useEffect(() => {
    const checkExcelAvailability = async () => {
      try {
        const available = typeof Office !== 'undefined' && 
                         typeof Excel !== 'undefined' && 
                         Excel.run !== undefined;
        
        setIsExcelAvailable(available);

        if (available) {
          // Detect platform capabilities
          Office.onReady(() => {
            try {
              const context = Office.context;
              if (context) {
                // This would typically be done in Excel.run, but for initial check
                // we can get basic platform info
                setConnectionStatus('online');
              }
            } catch (error) {
              console.warn('Platform detection failed:', error);
            }
          });
        }
      } catch (error) {
        console.error('Excel availability check failed:', error);
        setIsExcelAvailable(false);
        setConnectionStatus('offline');
      }
    };

    checkExcelAvailability();
  }, []);

  // Enhanced Excel table generation with performance monitoring
  const generateExcelTable = useCallback(async (
    result: WACCResult, 
    template: WACCTemplate
  ): Promise<void> => {
    if (!isExcelAvailable) {
      throw new Error('Excel integration is not available');
    }

    setSyncStatus('writing');
    
    try {
      // Convert WACCResult back to input format for Excel generation
      const inputData: WACCInputData = {
        buildUpModel: result.buildUpModelData?.map(([name, value]) => ({ 
          name, 
          value: value * 100 // Convert back to percentage
        })) || [],
        costOfDebtCalculations: result.costOfDebtData?.map(([name, value]) => ({ 
          name, 
          value 
        })) || [],
        weightData: {
          weightOfDebt: result.weightOfDebt * 100, // Convert to percentage
          weightOfEquity: result.weightOfEquity * 100
        },
        waccBuildUpSelectionType: 1, // Default to first calculation type
        isWeightDataEdited: true,
        taxRate: result.taxRate * 100 // Convert to percentage
      };

      const generationResult = await enhancedGenerator.generateWACCTable(inputData, result, template);
      
      if (!generationResult.success) {
        setSyncStatus('error');
        throw new Error(generationResult.message);
      }

      // Update state with results
      if (generationResult.platformInfo) {
        setPlatformInfo(generationResult.platformInfo);
      }
      if (generationResult.performanceMetrics) {
        setPerformanceMetrics(generationResult.performanceMetrics);
      }

      setLastSyncTime(new Date());
      setSyncStatus('idle');
      setConnectionStatus('online');

      console.log(`Enhanced Excel WACC table generated: ${generationResult.cellsWritten} cells written in ${generationResult.processingTime}ms`);
    } catch (error) {
      setSyncStatus('error');
      setConnectionStatus('unstable');
      console.error('Enhanced Excel generation failed:', error);
      throw new Error(`Excel generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [isExcelAvailable, enhancedGenerator]);

  // Enhanced Excel data reading with comprehensive validation
  const readExcelData = useCallback(async (): Promise<WACCInputData | null> => {
    if (!isExcelAvailable) {
      console.warn('Excel is not available for reading data');
      return null;
    }

    setSyncStatus('reading');

    try {
      const readResult = await dataReader.readWACCData();
      
      if (!readResult.success) {
        if (readResult.worksheetFound) {
          console.warn(`Excel read completed with issues: ${readResult.message}`);
          if (readResult.dataIntegrity.warnings.length > 0) {
            console.warn('Data integrity warnings:', readResult.dataIntegrity.warnings);
          }
        } else {
          console.info('No WACC worksheet found');
        }
        setSyncStatus('idle');
        return null;
      }

      setLastSyncTime(new Date());
      setSyncStatus('idle');
      setConnectionStatus('online');

      console.log('WACC data read successfully from Excel');
      if (readResult.dataIntegrity.warnings.length > 0) {
        console.warn('Data read with warnings:', readResult.dataIntegrity.warnings);
      }

      return readResult.data;
    } catch (error) {
      setSyncStatus('error');
      setConnectionStatus('unstable');
      console.error('Failed to read Excel data:', error);
      return null;
    }
  }, [isExcelAvailable, dataReader]);

  // Enhanced Excel data writing with bidirectional sync
  const writeExcelData = useCallback(async (data: WACCInputData): Promise<void> => {
    if (!isExcelAvailable) {
      throw new Error('Excel integration is not available');
    }

    setSyncStatus('writing');

    try {
      // Calculate the result first to get complete data for Excel
      const result = await calculationEngine.calculateWACC(data);
      
      // Use default template if none specified
      const defaultTemplate: WACCTemplate = {
        id: 'professional',
        name: 'Professional',
        description: 'Professional formatting with enhanced readability',
        theme: {
          fonts: {
            header: { name: 'Segoe UI', size: 12, bold: true, color: '#1f4e79' },
            body: { name: 'Segoe UI', size: 10 },
            calculation: { name: 'Segoe UI', size: 10, numberFormat: '0.0%' }
          },
          colors: {
            primary: '#1f4e79',
            secondary: '#f2f2f2',
            border: '#d1d1d1'
          },
          layout: {
            sectionSpacing: 2,
            columnWidths: [120, 100, 100, 120],
            borderStyle: 'continuous'
          }
        },
        waccSpecific: {
          highlightFinalWACC: true,
          showCalculationSteps: true,
          includeFormulas: true
        }
      };
      
      // Generate the complete Excel table
      const generationResult = await enhancedGenerator.generateWACCTable(data, result, defaultTemplate);
      
      if (!generationResult.success) {
        setSyncStatus('error');
        throw new Error(generationResult.message);
      }

      // Update state
      if (generationResult.platformInfo) {
        setPlatformInfo(generationResult.platformInfo);
      }
      if (generationResult.performanceMetrics) {
        setPerformanceMetrics(generationResult.performanceMetrics);
      }

      setLastSyncTime(new Date());
      setSyncStatus('idle');
      setConnectionStatus('online');

      console.log(`WACC data written to Excel: ${generationResult.cellsWritten} cells updated in ${generationResult.processingTime}ms`);
    } catch (error) {
      setSyncStatus('error');
      setConnectionStatus('unstable');
      console.error('Failed to write Excel data:', error);
      throw new Error(`Excel write failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [isExcelAvailable, enhancedGenerator, calculationEngine]);

  // Check if WACC worksheet exists
  const checkWorksheetExists = useCallback(async (): Promise<boolean> => {
    if (!isExcelAvailable) return false;

    try {
      return await dataReader.checkWorksheetExists();
    } catch (error) {
      console.error('Worksheet existence check failed:', error);
      return false;
    }
  }, [isExcelAvailable, dataReader]);

  // Bidirectional sync with Excel
  const syncWithExcel = useCallback(async (): Promise<ExcelReadResult> => {
    if (!isExcelAvailable) {
      throw new Error('Excel integration is not available');
    }

    setSyncStatus('syncing');

    try {
      const result = await dataReader.readWACCData();
      setLastSyncTime(new Date());
      setSyncStatus('idle');
      
      if (result.success) {
        setConnectionStatus('online');
      } else if (result.worksheetFound) {
        setConnectionStatus('unstable');
      }

      return result;
    } catch (error) {
      setSyncStatus('error');
      setConnectionStatus('unstable');
      throw error;
    }
  }, [isExcelAvailable, dataReader]);

  // Get worksheet statistics
  const getWorksheetStats = useCallback(async () => {
    if (!isExcelAvailable) return null;

    try {
      return await dataReader.getWorksheetStats();
    } catch (error) {
      console.error('Worksheet stats failed:', error);
      return null;
    }
  }, [isExcelAvailable, dataReader]);

  // Test Excel connection
  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!isExcelAvailable) return false;

    try {
      // Simple connection test
      if (typeof Excel === 'undefined' || !Excel.run) {
        setConnectionStatus('offline');
        return false;
      }

      await Excel.run(async (context) => {
        // Test basic Excel functionality
        const worksheets = context.workbook.worksheets;
        worksheets.load('count');
        await context.sync();
        return worksheets.count >= 0;
      });

      setConnectionStatus('online');
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('offline');
      return false;
    }
  }, [isExcelAvailable]);

  // Clear WACC worksheet
  const clearWorksheet = useCallback(async (): Promise<void> => {
    if (!isExcelAvailable) {
      throw new Error('Excel integration is not available');
    }

    setSyncStatus('writing');

    try {
      await Excel.run(async (context) => {
        const worksheet = context.workbook.worksheets.getItemOrNullObject('WACC');
        await context.sync();

        if (!worksheet.isNullObject) {
          const usedRange = worksheet.getUsedRange();
          usedRange.load('address');
          await context.sync();
          
          if (!usedRange.isNullObject) {
            usedRange.clear(Excel.ClearApplyTo.all);
            await context.sync();
          }
        }
      });

      setSyncStatus('idle');
      setConnectionStatus('online');
      console.log('WACC worksheet cleared successfully');
    } catch (error) {
      setSyncStatus('error');
      setConnectionStatus('unstable');
      console.error('Failed to clear worksheet:', error);
      throw new Error(`Worksheet clear failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [isExcelAvailable]);

  return {
    // Original interface
    generateExcelTable,
    readExcelData,
    writeExcelData,
    isExcelAvailable,
    
    // Enhanced capabilities
    platformInfo,
    performanceMetrics,
    syncStatus,
    lastSyncTime,
    connectionStatus,
    checkWorksheetExists,
    syncWithExcel,
    getWorksheetStats,
    testConnection,
    clearWorksheet
  };
};