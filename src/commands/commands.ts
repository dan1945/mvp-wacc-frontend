/**
 * Enhanced Office Add-in Commands
 * 
 * Advanced ribbon and context menu commands with:
 * - Cross-platform compatibility
 * - Intelligent error handling and user feedback
 * - Performance monitoring
 * - Network resilience
 */

import { EnhancedExcelWACCGenerator } from '../services/EnhancedExcelWACCGenerator';
import { ExcelDataReader } from '../services/ExcelDataReader';
import { WACCCalculationEngine } from '../services/WACCCalculationEngine';

// Global Office namespace
declare const Office: any;

// Service instances for commands
let enhancedGenerator: EnhancedExcelWACCGenerator;
let dataReader: ExcelDataReader;
let calculationEngine: WACCCalculationEngine;

/**
 * Initialize Office Add-in commands with enhanced services
 */
Office.onReady(() => {
  console.log('Enhanced WACC Calculator commands loaded');
  
  // Initialize service instances
  enhancedGenerator = new EnhancedExcelWACCGenerator();
  dataReader = new ExcelDataReader();
  calculationEngine = new WACCCalculationEngine();
});

/**
 * Enhanced Quick WACC Generation Command
 * 
 * Generates a WACC table with intelligent defaults and comprehensive error handling.
 * Features automatic data recovery and cross-platform optimizations.
 */
export async function generateWACCQuick(event: Office.AddinCommands.Event): Promise<void> {
  try {
    console.log('Enhanced quick WACC generation triggered');
    
    // Show progress indicator
    await showNotification('Generating WACC table...', 'info');
    
    // Check if Excel is available and ready
    if (typeof Excel === 'undefined' || !Excel.run) {
      await showNotification('Excel integration not available', 'error');
      event.completed();
      return;
    }

    // Try to read existing data first
    let inputData = null;
    try {
      const readResult = await dataReader.readWACCData();
      if (readResult.success && readResult.data) {
        inputData = readResult.data;
        console.log('Using existing WACC data from worksheet');
      }
    } catch (error) {
      console.warn('Could not read existing data, using defaults:', error);
    }

    // Use default data if no existing data found
    if (!inputData) {
      inputData = getDefaultWACCData();
      console.log('Using default WACC data');
    }

    // Calculate WACC result
    const result = await calculationEngine.calculateWACC(inputData);
    
    // Get default professional template
    const defaultTemplate = getDefaultTemplate();
    
    // Generate Excel table with enhanced generator
    const generationResult = await enhancedGenerator.generateWACCTable(inputData, result, defaultTemplate);
    
    if (generationResult.success) {
      const message = `WACC table generated successfully in ${generationResult.processingTime}ms (${generationResult.cellsWritten} cells)`;
      await showNotification(message, 'success');
      
      // Log platform info for diagnostics
      if (generationResult.platformInfo) {
        console.log('Platform:', generationResult.platformInfo.platform, 
                   'Version:', generationResult.platformInfo.version);
      }
    } else {
      await showNotification(`Generation failed: ${generationResult.message}`, 'error');
    }
    
    // Update ribbon state
    await updateRibbonState(generationResult.success);
    
    event.completed();
    
  } catch (error) {
    console.error('Enhanced quick WACC generation failed:', error);
    await showNotification(`Generation error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    await updateRibbonState(false);
    event.completed();
  }
}

/**
 * Show WACC Task Pane Command
 * 
 * Opens the main WACC Calculator task pane.
 */
export function showWACCTaskPane(event: Office.AddinCommands.Event): void {
  try {
    console.log('Show WACC task pane triggered');
    
    // The task pane URL is defined in the manifest
    // Office will handle opening the task pane
    
    event.completed();
    
  } catch (error) {
    console.error('Failed to show WACC task pane:', error);
    event.completed();
  }
}

/**
 * Clear WACC Data Command
 * 
 * Clears WACC worksheet data with confirmation.
 */
export function clearWACCData(event: Office.AddinCommands.Event): void {
  try {
    console.log('Clear WACC data triggered');
    
    // In full implementation, this would:
    // 1. Show confirmation dialog
    // 2. Clear WACC worksheet if confirmed
    // 3. Reset any cached data
    // 4. Show success notification
    
    event.completed();
    
  } catch (error) {
    console.error('Failed to clear WACC data:', error);
    event.completed();
  }
}

// Export commands for Office to register
(window as any).generateWACCQuick = generateWACCQuick;
(window as any).showWACCTaskPane = showWACCTaskPane;
(window as any).clearWACCData = clearWACCData;