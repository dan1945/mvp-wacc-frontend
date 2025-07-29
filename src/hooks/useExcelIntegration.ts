import { useCallback, useState, useMemo } from 'react';
import { WACCInputData, WACCResult, WACCTemplate, UseExcelIntegrationReturn } from '@types/wacc';
import { ExcelWACCGenerator } from '../services/ExcelWACCGenerator';
import { EnhancedExcelWACCGenerator } from '../services/EnhancedExcelWACCGenerator';
import { ExcelDataReader } from '../services/ExcelDataReader';
import { WACCCalculationEngine } from '../services/WACCCalculationEngine';
import { waccTemplates } from '../templates/waccTemplates';
import WACCTemplates from '../templates/waccTemplates';

/**
 * Excel Integration Hook
 * 
 * Real implementation using ExcelWACCGenerator for production-ready Excel integration.
 */
export const useExcelIntegration = (): UseExcelIntegrationReturn => {
  const [isExcelAvailable] = useState(
    typeof Office !== 'undefined' && 
    typeof Excel !== 'undefined' && 
    Excel.run !== undefined
  );

  // Create Excel generator instance
  const excelGenerator = useMemo(() => new ExcelWACCGenerator(), []);

  const generateExcelTable = useCallback(async (
    result: WACCResult, 
    template: WACCTemplate
  ): Promise<void> => {
    if (!isExcelAvailable) {
      throw new Error('Excel integration is not available');
    }

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

      const generationResult = await excelGenerator.generateWACCTable(inputData, result, template);
      
      if (!generationResult.success) {
        throw new Error(generationResult.message);
      }

      console.log(`Excel WACC table generated successfully with ${template.name} template: ${generationResult.cellsWritten} cells written in ${generationResult.processingTime.toFixed(2)}ms`);
    } catch (error) {
      console.error('Failed to generate Excel table:', error);
      throw new Error(`Excel generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [isExcelAvailable, excelGenerator]);

  const readExcelData = useCallback(async (): Promise<WACCInputData | null> => {
    if (!isExcelAvailable) {
      console.warn('Excel is not available for reading data');
      return null;
    }

    try {
      // In a full implementation, this would read from the WACC worksheet
      // For now, we'll return null to indicate no data was found
      console.log('Reading WACC data from Excel worksheet...');
      
      // TODO: Implement Excel data reading
      // This would involve:
      // 1. Checking if WACC worksheet exists
      // 2. Reading values from specific ranges (B6:C10, E6:F12, etc.)
      // 3. Converting Excel values back to WACCInputData format
      // 4. Validating the data before returning
      
      return null; // No data found or not implemented yet
    } catch (error) {
      console.error('Failed to read Excel data:', error);
      return null;
    }
  }, [isExcelAvailable]);

  const writeExcelData = useCallback(async (data: WACCInputData): Promise<void> => {
    if (!isExcelAvailable) {
      throw new Error('Excel integration is not available');
    }

    try {
      // Calculate the result first to get complete data for Excel
      const calculationEngine = new WACCCalculationEngine();
      const result = await calculationEngine.calculateWACC(data);
      
      // Generate the complete Excel table with professional template (default)
      const defaultTemplate = WACCTemplates.find(t => t.id === 'professional') || WACCTemplates[0];
      const generationResult = await excelGenerator.generateWACCTable(data, result, defaultTemplate);
      
      if (!generationResult.success) {
        throw new Error(generationResult.message);
      }

      console.log(`WACC data written to Excel with ${defaultTemplate.name} template: ${generationResult.cellsWritten} cells updated in ${generationResult.processingTime.toFixed(2)}ms`);
    } catch (error) {
      console.error('Failed to write Excel data:', error);
      throw new Error(`Excel write failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [isExcelAvailable, excelGenerator]);

  return {
    generateExcelTable,
    readExcelData,
    writeExcelData,
    isExcelAvailable,
  };
};