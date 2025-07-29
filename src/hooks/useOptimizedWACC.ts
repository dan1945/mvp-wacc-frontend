import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WACCInputData, WACCResult, ValidationError } from '../types/wacc';
import { useOptimizedWACCData } from '../contexts/OptimizedWACCContext';
import { performanceMonitor } from '../services/PerformanceMonitor';
import { waccCalculationCache } from '../services/CacheManager';

/**
 * Enhanced WACC Hook with Integrated Performance and Caching
 * 
 * Provides optimized WACC calculation with:
 * - Intelligent caching with cache hit/miss tracking
 * - Performance monitoring for all operations
 * - Debounced calculations to prevent excessive re-computation
 * - Error recovery and retry logic
 * - Memory leak prevention
 */

export interface UseOptimizedWACCOptions {
  debounceMs?: number;
  enableAutoCalculation?: boolean;
  cacheKey?: string;
  retryAttempts?: number;
  onPerformanceIssue?: (issue: string) => void;
}

export interface UseOptimizedWACCReturn {
  // Core WACC data and state
  inputData: WACCInputData;
  result: WACCResult | null;
  isCalculating: boolean;
  validationErrors: ValidationError[];
  
  // Performance and caching metrics
  performanceMetrics: {
    lastCalculationTime: number;
    averageCalculationTime: number;
    cacheHitRate: number;
    totalCalculations: number;
  };
  
  // Enhanced methods
  calculate: (data?: WACCInputData) => Promise<WACCResult>;
  updateInput: (field: string, value: any) => void;
  setInputData: (data: WACCInputData) => void;
  resetToDefaults: () => void;
  
  // Cache management
  getCachedResult: (data?: WACCInputData) => Promise<WACCResult | null>;
  clearCache: () => Promise<void>;
  preloadCache: (inputs: WACCInputData[]) => Promise<void>;
  
  // Performance utilities
  getPerformanceReport: () => any;
  isPerformanceOptimal: boolean;
  optimizationRecommendations: string[];
  
  // Error management
  errors: Error[];
  clearErrors: () => void;
  hasErrors: boolean;
}

export const useOptimizedWACC = (options: UseOptimizedWACCOptions = {}): UseOptimizedWACCReturn => {
  const {
    debounceMs = 300,
    enableAutoCalculation = true,
    cacheKey,
    retryAttempts = 3,
    onPerformanceIssue,
  } = options;

  // Get context data
  const context = useOptimizedWACCData();
  
  // Local state for hook-specific functionality
  const [localErrors, setLocalErrors] = useState<Error[]>([]);
  const [optimizationRecommendations, setOptimizationRecommendations] = useState<string[]>([]);
  const [isPerformanceOptimal, setIsPerformanceOptimal] = useState(true);
  
  // Refs for debouncing and cleanup
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const lastCalculationRef = useRef<WACCInputData | null>(null);
  const componentMountTimeRef = useRef(Date.now());
  const calculationAttempts = useRef(0);

  // Performance monitoring for this hook instance
  useEffect(() => {
    performanceMonitor.markStart(`wacc-hook-${componentMountTimeRef.current}`);
    
    return () => {
      performanceMonitor.markEnd(`wacc-hook-${componentMountTimeRef.current}`);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Debounced calculation function
  const debouncedCalculate = useCallback((data: WACCInputData) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        await context.calculateWACC(data);
        calculationAttempts.current = 0; // Reset on success
      } catch (error) {
        calculationAttempts.current++;
        setLocalErrors(prev => [...prev, error instanceof Error ? error : new Error(String(error))]);
        
        // Retry logic
        if (calculationAttempts.current <= retryAttempts) {
          console.warn(`Calculation failed, retrying (${calculationAttempts.current}/${retryAttempts})`);
          setTimeout(() => debouncedCalculate(data), 1000 * calculationAttempts.current);
        }
      }
    }, debounceMs);
  }, [context, debounceMs, retryAttempts]);

  // Auto-calculation when input changes
  useEffect(() => {
    if (!enableAutoCalculation) return;
    
    const currentInput = context.inputData;
    
    // Skip if data hasn't changed
    if (lastCalculationRef.current && 
        JSON.stringify(lastCalculationRef.current) === JSON.stringify(currentInput)) {
      return;
    }
    
    lastCalculationRef.current = currentInput;
    debouncedCalculate(currentInput);
  }, [context.inputData, enableAutoCalculation, debouncedCalculate]);

  // Performance monitoring and optimization recommendations
  useEffect(() => {
    const checkPerformance = () => {
      const metrics = context.optimizationMetrics;
      const recommendations: string[] = [];
      let optimal = true;

      // Check calculation performance
      if (metrics.averageCalculationTime > 200) {
        recommendations.push('Consider simplifying calculation inputs for better performance');
        optimal = false;
      }

      // Check cache performance
      if (metrics.cacheHitRate < 0.7 && metrics.totalCalculations > 5) {
        recommendations.push('Low cache hit rate - consider caching more calculations');
        optimal = false;
      }

      // Check re-render frequency
      if (metrics.rerenderCount > metrics.totalCalculations * 3) {
        recommendations.push('Excessive re-renders detected - optimize component structure');
        optimal = false;
      }

      setOptimizationRecommendations(recommendations);
      setIsPerformanceOptimal(optimal);

      // Notify about performance issues
      if (!optimal && onPerformanceIssue) {
        onPerformanceIssue(recommendations.join('; '));
      }
    };

    const performanceCheckInterval = setInterval(checkPerformance, 30000); // Check every 30s
    return () => clearInterval(performanceCheckInterval);
  }, [context.optimizationMetrics, onPerformanceIssue]);

  // Enhanced calculation method with performance tracking
  const calculate = useCallback(async (data?: WACCInputData): Promise<WACCResult> => {
    const inputData = data || context.inputData;
    performanceMonitor.markStart('hook-calculate');
    
    try {
      const result = await context.calculateWACC(inputData);
      performanceMonitor.markEnd('hook-calculate');
      return result;
    } catch (error) {
      performanceMonitor.markEnd('hook-calculate');
      const err = error instanceof Error ? error : new Error(String(error));
      setLocalErrors(prev => [...prev, err]);
      throw err;
    }
  }, [context]);

  // Enhanced input update with validation
  const updateInput = useCallback((field: string, value: any) => {
    performanceMonitor.recordMetric({
      name: 'input-update',
      value: 1,
      timestamp: performance.now(),
      metadata: { field },
      tags: ['user-interaction']
    });
    
    context.updateField(field, value);
  }, [context]);

  // Set input data with performance tracking
  const setInputData = useCallback((data: WACCInputData) => {
    performanceMonitor.markStart('set-input-data');
    context.setInputData(data);
    performanceMonitor.markEnd('set-input-data');
  }, [context]);

  // Get cached result
  const getCachedResult = useCallback(async (data?: WACCInputData): Promise<WACCResult | null> => {
    const inputData = data || context.inputData;
    return await context.getCachedCalculation(inputData);
  }, [context]);

  // Clear cache
  const clearCache = useCallback(async (): Promise<void> => {
    await context.clearCache();
    setLocalErrors([]); // Clear errors when clearing cache
  }, [context]);

  // Preload cache with multiple inputs
  const preloadCache = useCallback(async (inputs: WACCInputData[]): Promise<void> => {
    performanceMonitor.markStart('cache-preload');
    
    try {
      const promises = inputs.map(input => context.calculateWACC(input));
      await Promise.allSettled(promises); // Don't fail if one calculation fails
      performanceMonitor.markEnd('cache-preload');
    } catch (error) {
      performanceMonitor.markEnd('cache-preload');
      console.warn('Cache preload partially failed:', error);
    }
  }, [context]);

  // Get performance report
  const getPerformanceReport = useCallback(() => {
    return context.getPerformanceReport();
  }, [context]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    performanceMonitor.markStart('reset-defaults');
    context.resetToDefaults();
    setLocalErrors([]);
    calculationAttempts.current = 0;
    performanceMonitor.markEnd('reset-defaults');
  }, [context]);

  // Clear errors
  const clearErrors = useCallback(() => {
    setLocalErrors([]);
    context.clearErrors();
  }, [context]);

  // Combine all errors
  const allErrors = useMemo(() => {
    return [...context.errorHistory, ...localErrors];
  }, [context.errorHistory, localErrors]);

  // Performance metrics
  const performanceMetrics = useMemo(() => ({
    lastCalculationTime: context.optimizationMetrics.averageCalculationTime,
    averageCalculationTime: context.optimizationMetrics.averageCalculationTime,
    cacheHitRate: context.optimizationMetrics.cacheHitRate,
    totalCalculations: context.optimizationMetrics.totalCalculations,
  }), [context.optimizationMetrics]);

  return {
    // Core WACC data and state
    inputData: context.inputData,
    result: context.calculationResult,
    isCalculating: context.isCalculating,
    validationErrors: context.validationErrors,
    
    // Performance and caching metrics
    performanceMetrics,
    
    // Enhanced methods
    calculate,
    updateInput,
    setInputData,
    resetToDefaults,
    
    // Cache management
    getCachedResult,
    clearCache,
    preloadCache,
    
    // Performance utilities
    getPerformanceReport,
    isPerformanceOptimal,
    optimizationRecommendations,
    
    // Error management
    errors: allErrors,
    clearErrors,
    hasErrors: allErrors.length > 0,
  };
};

/**
 * Hook for managing WACC calculation history with performance tracking
 */
export const useWACCHistory = () => {
  const [history, setHistory] = useState<WACCResult[]>([]);
  const { result } = useOptimizedWACC({ enableAutoCalculation: false });

  useEffect(() => {
    if (result) {
      setHistory(prev => {
        const newHistory = [result, ...prev.slice(0, 9)]; // Keep last 10 results
        
        // Track history usage
        performanceMonitor.recordMetric({
          name: 'wacc-history-update',
          value: newHistory.length,
          timestamp: performance.now(),
          tags: ['history']
        });
        
        return newHistory;
      });
    }
  }, [result]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const getHistoryStats = useCallback(() => {
    if (history.length === 0) return null;

    const waccValues = history.map(r => r.weightedAverageCostOfCapital);
    return {
      count: history.length,
      latest: waccValues[0],
      average: waccValues.reduce((sum, val) => sum + val, 0) / waccValues.length,
      min: Math.min(...waccValues),
      max: Math.max(...waccValues),
    };
  }, [history]);

  return {
    history,
    clearHistory,
    getHistoryStats,
  };
};

/**
 * Hook for WACC comparison and sensitivity analysis
 */
export const useWACCComparison = () => {
  const [scenarios, setScenarios] = useState<Map<string, WACCResult>>(new Map());
  const context = useOptimizedWACCData();

  const addScenario = useCallback(async (name: string, inputData: WACCInputData): Promise<void> => {
    performanceMonitor.markStart(`scenario-${name}`);
    
    try {
      const result = await context.calculateWACC(inputData);
      setScenarios(prev => new Map(prev).set(name, result));
      performanceMonitor.markEnd(`scenario-${name}`);
    } catch (error) {
      performanceMonitor.markEnd(`scenario-${name}`);
      throw error;
    }
  }, [context]);

  const removeScenario = useCallback((name: string) => {
    setScenarios(prev => {
      const newMap = new Map(prev);
      newMap.delete(name);
      return newMap;
    });
  }, []);

  const clearScenarios = useCallback(() => {
    setScenarios(new Map());
  }, []);

  const getComparison = useCallback(() => {
    const scenarioArray = Array.from(scenarios.entries());
    if (scenarioArray.length === 0) return null;

    return scenarioArray.map(([name, result]) => ({
      name,
      wacc: result.weightedAverageCostOfCapital,
      costOfEquity: result.costOfEquity,
      costOfDebt: result.costOfDebt,
      result,
    }));
  }, [scenarios]);

  return {
    scenarios: Array.from(scenarios.entries()),
    addScenario,
    removeScenario,
    clearScenarios,
    getComparison,
  };
};