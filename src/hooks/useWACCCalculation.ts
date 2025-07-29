import { useState, useEffect, useMemo } from 'react';
import { WACCInputData, WACCResult, UseWACCCalculationReturn } from '@types/wacc';
import { WACCCalculationEngine, ValidationError } from '../services/WACCCalculationEngine';
import { useDebounce } from './useDebounce';
import { performanceMonitor } from '../services/PerformanceMonitor';

/**
 * WACC Calculation Hook
 * 
 * Real implementation using the WACCCalculationEngine with 100% functional parity.
 */
export const useWACCCalculation = (inputData: WACCInputData): UseWACCCalculationReturn => {
  const [calculationResult, setCalculationResult] = useState<WACCResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<Error | null>(null);
  const [calculationHistory, setCalculationHistory] = useState<WACCResult[]>([]);

  // Debounce input changes to avoid excessive calculations
  const debouncedInputData = useDebounce(inputData, 300);

  // Create calculation engine instance
  const calculationEngine = useMemo(() => new WACCCalculationEngine(), []);

  // Real WACC calculation using the production-ready engine
  useEffect(() => {
    const calculateWACC = async (): Promise<void> => {
      // Skip calculation if input data is incomplete
      if (!debouncedInputData || 
          !debouncedInputData.buildUpModel?.length || 
          !debouncedInputData.costOfDebtCalculations?.length ||
          debouncedInputData.costOfDebtCalculations.length < 4) {
        setCalculationResult(null);
        setCalculationError(null);
        return;
      }

      setIsCalculating(true);
      setCalculationError(null);

      try {
        // Start performance monitoring
        performanceMonitor.markStart('wacc-calculation', {
          inputSize: JSON.stringify(debouncedInputData).length,
          buildUpModelItems: debouncedInputData.buildUpModel.length,
          costOfDebtItems: debouncedInputData.costOfDebtCalculations.length,
        });

        // Use the real calculation engine
        const result = await calculationEngine.calculateWACC(debouncedInputData);
        
        // End performance monitoring
        const calculationTime = performanceMonitor.markEnd('wacc-calculation');
        
        // Record detailed metrics
        performanceMonitor.recordCalculationMetrics(
          calculationTime,
          result.performanceMetrics?.cacheHit || false,
          JSON.stringify(debouncedInputData).length,
          false
        );
        
        setCalculationResult(result);
        setCalculationHistory(prev => [result, ...prev.slice(0, 9)]);
      } catch (error) {
        // End performance monitoring for error case
        const calculationTime = performanceMonitor.markEnd('wacc-calculation');
        
        // Record error metrics
        performanceMonitor.recordCalculationMetrics(
          calculationTime,
          false,
          JSON.stringify(debouncedInputData).length,
          true
        );
        
        console.error('WACC calculation error:', error);
        setCalculationError(error as Error);
        setCalculationResult(null);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateWACC();
  }, [debouncedInputData, calculationEngine]);

  return {
    calculationResult,
    isCalculating,
    calculationError,
    calculationHistory,
  };
};