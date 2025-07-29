/**
 * Optimized WACC Data Context
 * Scalable state management with selective re-renders and performance optimization
 */

import React, { 
  createContext, 
  useContext, 
  useReducer, 
  useCallback, 
  useMemo,
  useRef,
  useEffect
} from 'react';
import { WACCInputData, ValidationError } from '@types/wacc';
import { getDefaultWACCInput } from '../utils/waccDefaults';
import { performanceMonitor } from '../services/PerformanceMonitor';

// Optimized state interface with selector system
interface OptimizedWACCState {
  inputData: WACCInputData;
  validationErrors: ValidationError[];
  isDirty: boolean;
  lastSyncedWithExcel: Date | null;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  optimizationMetrics: {
    renderCount: number;
    lastRenderTime: number;
    selectorCacheHits: number;
    stateUpdates: number;
  };
}

// Action types for precise state updates
type OptimizedWACCAction = 
  | { type: 'SET_INPUT_DATA'; payload: WACCInputData }
  | { type: 'UPDATE_BUILDUP_MODEL'; payload: { index: number; item: any } }
  | { type: 'UPDATE_COST_OF_DEBT'; payload: { index: number; item: any } }
  | { type: 'UPDATE_WEIGHT_DATA'; payload: Partial<WACCInputData['weightData']> }
  | { type: 'UPDATE_TAX_RATE'; payload: number }
  | { type: 'UPDATE_SELECTION_TYPE'; payload: 1 | 2 }
  | { type: 'SET_VALIDATION_ERRORS'; payload: ValidationError[] }
  | { type: 'SET_SYNC_STATUS'; payload: OptimizedWACCState['syncStatus'] }
  | { type: 'MARK_SYNCED' }
  | { type: 'RESET_TO_DEFAULTS' }
  | { type: 'INCREMENT_RENDER_COUNT' }
  | { type: 'UPDATE_OPTIMIZATION_METRICS'; payload: Partial<OptimizedWACCState['optimizationMetrics']> };

// Selector function type for efficient state subscriptions
type StateSelector<T> = (state: OptimizedWACCState) => T;

// Context interface with selector-based subscriptions
interface OptimizedWACCContextType {
  // State selectors (prevent unnecessary re-renders)
  selectInputData: () => WACCInputData;
  selectBuildUpModel: () => WACCInputData['buildUpModel'];
  selectCostOfDebtCalculations: () => WACCInputData['costOfDebtCalculations'];
  selectWeightData: () => WACCInputData['weightData'];
  selectTaxRate: () => number;
  selectValidationErrors: () => ValidationError[];
  selectSyncStatus: () => OptimizedWACCState['syncStatus'];
  selectIsDirty: () => boolean;
  
  // Optimized update functions
  updateBuildUpModelItem: (index: number, item: any) => void;
  updateCostOfDebtItem: (index: number, item: any) => void;
  updateWeightData: (data: Partial<WACCInputData['weightData']>) => void;
  updateTaxRate: (rate: number) => void;
  updateSelectionType: (type: 1 | 2) => void;
  
  // Batch operations for performance
  batchUpdate: (updates: () => void) => void;
  
  // State management
  setInputData: (data: WACCInputData) => void;
  resetToDefaults: () => void;
  syncWithExcel: () => Promise<void>;
  
  // Performance metrics
  getOptimizationMetrics: () => OptimizedWACCState['optimizationMetrics'];
  
  // Custom selector hook
  useSelector: <T>(selector: StateSelector<T>) => T;
}

const initialState: OptimizedWACCState = {
  inputData: getDefaultWACCInput(),
  validationErrors: [],
  isDirty: false,
  lastSyncedWithExcel: null,
  syncStatus: 'idle',
  optimizationMetrics: {
    renderCount: 0,
    lastRenderTime: 0,
    selectorCacheHits: 0,
    stateUpdates: 0,
  },
};

// Optimized reducer with performance tracking
function optimizedWACCReducer(state: OptimizedWACCState, action: OptimizedWACCAction): OptimizedWACCState {
  const startTime = performance.now();
  
  let newState: OptimizedWACCState;
  
  switch (action.type) {
    case 'SET_INPUT_DATA':
      newState = {
        ...state,
        inputData: action.payload,
        validationErrors: [],
        isDirty: true,
        optimizationMetrics: {
          ...state.optimizationMetrics,
          stateUpdates: state.optimizationMetrics.stateUpdates + 1,
        },
      };
      break;

    case 'UPDATE_BUILDUP_MODEL':
      const newBuildUpModel = [...state.inputData.buildUpModel];
      newBuildUpModel[action.payload.index] = action.payload.item;
      
      newState = {
        ...state,
        inputData: {
          ...state.inputData,
          buildUpModel: newBuildUpModel,
        },
        isDirty: true,
        optimizationMetrics: {
          ...state.optimizationMetrics,
          stateUpdates: state.optimizationMetrics.stateUpdates + 1,
        },
      };
      break;

    case 'UPDATE_COST_OF_DEBT':
      const newCostOfDebt = [...state.inputData.costOfDebtCalculations];
      newCostOfDebt[action.payload.index] = action.payload.item;
      
      newState = {
        ...state,
        inputData: {
          ...state.inputData,
          costOfDebtCalculations: newCostOfDebt,
        },
        isDirty: true,
        optimizationMetrics: {
          ...state.optimizationMetrics,
          stateUpdates: state.optimizationMetrics.stateUpdates + 1,
        },
      };
      break;

    case 'UPDATE_WEIGHT_DATA':
      newState = {
        ...state,
        inputData: {
          ...state.inputData,
          weightData: {
            ...state.inputData.weightData,
            ...action.payload,
          },
        },
        isDirty: true,
        optimizationMetrics: {
          ...state.optimizationMetrics,
          stateUpdates: state.optimizationMetrics.stateUpdates + 1,
        },
      };
      break;

    case 'UPDATE_TAX_RATE':
      newState = {
        ...state,
        inputData: {
          ...state.inputData,
          taxRate: action.payload,
        },
        isDirty: true,
        optimizationMetrics: {
          ...state.optimizationMetrics,
          stateUpdates: state.optimizationMetrics.stateUpdates + 1,
        },
      };
      break;

    case 'UPDATE_SELECTION_TYPE':
      newState = {
        ...state,
        inputData: {
          ...state.inputData,
          waccBuildUpSelectionType: action.payload,
        },
        isDirty: true,
        optimizationMetrics: {
          ...state.optimizationMetrics,
          stateUpdates: state.optimizationMetrics.stateUpdates + 1,
        },
      };
      break;

    case 'SET_VALIDATION_ERRORS':
      newState = {
        ...state,
        validationErrors: action.payload,
      };
      break;

    case 'SET_SYNC_STATUS':
      newState = {
        ...state,
        syncStatus: action.payload,
      };
      break;

    case 'MARK_SYNCED':
      newState = {
        ...state,
        isDirty: false,
        lastSyncedWithExcel: new Date(),
        syncStatus: 'success',
      };
      break;

    case 'RESET_TO_DEFAULTS':
      newState = {
        ...initialState,
        inputData: getDefaultWACCInput(),
        optimizationMetrics: {
          ...state.optimizationMetrics,
          stateUpdates: state.optimizationMetrics.stateUpdates + 1,
        },
      };
      break;

    case 'INCREMENT_RENDER_COUNT':
      newState = {
        ...state,
        optimizationMetrics: {
          ...state.optimizationMetrics,
          renderCount: state.optimizationMetrics.renderCount + 1,
          lastRenderTime: performance.now(),
        },
      };
      break;

    case 'UPDATE_OPTIMIZATION_METRICS':
      newState = {
        ...state,
        optimizationMetrics: {
          ...state.optimizationMetrics,
          ...action.payload,
        },
      };
      break;

    default:
      return state;
  }
  
  const updateTime = performance.now() - startTime;
  performanceMonitor.recordMetric({
    name: 'state-update',
    value: updateTime,
    timestamp: performance.now(),
    metadata: { actionType: action.type },
    tags: ['state-management']
  });
  
  return newState;
}

// Selector cache for performance optimization
class SelectorCache {
  private cache = new Map<string, { result: any; lastState: any; dependencies: string[] }>();
  
  get<T>(key: string, selector: StateSelector<T>, state: OptimizedWACCState, dependencies: string[] = []): T {
    const cached = this.cache.get(key);
    
    // Check if cache is valid
    if (cached && this.areDependenciesEqual(cached.dependencies, dependencies, cached.lastState, state)) {
      return cached.result;
    }
    
    // Calculate new result
    const result = selector(state);
    this.cache.set(key, { result, lastState: state, dependencies });
    
    return result;
  }
  
  private areDependenciesEqual(
    deps: string[], 
    newDeps: string[], 
    oldState: OptimizedWACCState, 
    newState: OptimizedWACCState
  ): boolean {
    if (deps.length !== newDeps.length) return false;
    
    return deps.every((dep, index) => {
      if (dep !== newDeps[index]) return false;
      
      // Deep equality check for the specific dependency
      const oldValue = this.getNestedValue(oldState, dep);
      const newValue = this.getNestedValue(newState, dep);
      
      return JSON.stringify(oldValue) === JSON.stringify(newValue);
    });
  }
  
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

const OptimizedWACCContext = createContext<OptimizedWACCContextType | null>(null);

interface OptimizedWACCProviderProps {
  children: React.ReactNode;
  initialData?: WACCInputData;
  enableDebugMode?: boolean;
}

/**
 * Optimized WACC Data Provider with selector-based subscriptions
 */
export const OptimizedWACCProvider: React.FC<OptimizedWACCProviderProps> = ({
  children,
  initialData,
  enableDebugMode = false,
}) => {
  const [state, dispatch] = useReducer(optimizedWACCReducer, {
    ...initialState,
    inputData: initialData || getDefaultWACCInput(),
  });
  
  const selectorCache = useRef(new SelectorCache());
  const batchedUpdates = useRef<Array<() => void>>([]);
  const isBatching = useRef(false);
  
  // Performance monitoring
  useEffect(() => {
    if (enableDebugMode) {
      const interval = setInterval(() => {
        const metrics = state.optimizationMetrics;
        console.log('WACC Context Performance Metrics:', {
          renderCount: metrics.renderCount,
          stateUpdates: metrics.stateUpdates,
          cacheHits: metrics.selectorCacheHits,
          averageRenderTime: metrics.lastRenderTime > 0 ? metrics.lastRenderTime / metrics.renderCount : 0,
        });
      }, 10000); // Log every 10 seconds
      
      return () => clearInterval(interval);
    }
  }, [state.optimizationMetrics, enableDebugMode]);
  
  // Selector functions with caching
  const selectInputData = useCallback((): WACCInputData => {
    return selectorCache.current.get(
      'inputData',
      (state) => state.inputData,
      state,
      ['inputData']
    );
  }, [state]);
  
  const selectBuildUpModel = useCallback(() => {
    return selectorCache.current.get(
      'buildUpModel',
      (state) => state.inputData.buildUpModel,
      state,
      ['inputData.buildUpModel']
    );
  }, [state]);
  
  const selectCostOfDebtCalculations = useCallback(() => {
    return selectorCache.current.get(
      'costOfDebtCalculations',
      (state) => state.inputData.costOfDebtCalculations,
      state,
      ['inputData.costOfDebtCalculations']
    );
  }, [state]);
  
  const selectWeightData = useCallback(() => {
    return selectorCache.current.get(
      'weightData',
      (state) => state.inputData.weightData,
      state,
      ['inputData.weightData']
    );
  }, [state]);
  
  const selectTaxRate = useCallback(() => {
    return selectorCache.current.get(
      'taxRate',
      (state) => state.inputData.taxRate,
      state,
      ['inputData.taxRate']
    );
  }, [state]);
  
  const selectValidationErrors = useCallback(() => {
    return selectorCache.current.get(
      'validationErrors',
      (state) => state.validationErrors,
      state,
      ['validationErrors']
    );
  }, [state]);
  
  const selectSyncStatus = useCallback(() => {
    return selectorCache.current.get(
      'syncStatus',
      (state) => state.syncStatus,
      state,
      ['syncStatus']
    );
  }, [state]);
  
  const selectIsDirty = useCallback(() => {
    return selectorCache.current.get(
      'isDirty',
      (state) => state.isDirty,
      state,
      ['isDirty']
    );
  }, [state]);
  
  // Optimized update functions
  const updateBuildUpModelItem = useCallback((index: number, item: any) => {
    performanceMonitor.markStart('update-buildup-model');
    dispatch({ type: 'UPDATE_BUILDUP_MODEL', payload: { index, item } });
    performanceMonitor.markEnd('update-buildup-model');
  }, []);
  
  const updateCostOfDebtItem = useCallback((index: number, item: any) => {
    performanceMonitor.markStart('update-cost-of-debt');
    dispatch({ type: 'UPDATE_COST_OF_DEBT', payload: { index, item } });
    performanceMonitor.markEnd('update-cost-of-debt');
  }, []);
  
  const updateWeightData = useCallback((data: Partial<WACCInputData['weightData']>) => {
    dispatch({ type: 'UPDATE_WEIGHT_DATA', payload: data });
  }, []);
  
  const updateTaxRate = useCallback((rate: number) => {
    dispatch({ type: 'UPDATE_TAX_RATE', payload: rate });
  }, []);
  
  const updateSelectionType = useCallback((type: 1 | 2) => {
    dispatch({ type: 'UPDATE_SELECTION_TYPE', payload: type });
  }, []);
  
  // Batch update system for multiple simultaneous changes
  const batchUpdate = useCallback((updates: () => void) => {
    if (isBatching.current) {
      // Already batching, just add to queue
      batchedUpdates.current.push(updates);
      return;
    }
    
    isBatching.current = true;
    performanceMonitor.markStart('batch-update');
    
    // Execute immediately and any queued updates
    updates();
    
    while (batchedUpdates.current.length > 0) {
      const batchedUpdate = batchedUpdates.current.shift();
      batchedUpdate?.();
    }
    
    isBatching.current = false;
    performanceMonitor.markEnd('batch-update');
  }, []);
  
  const setInputData = useCallback((data: WACCInputData) => {
    dispatch({ type: 'SET_INPUT_DATA', payload: data });
  }, []);
  
  const resetToDefaults = useCallback(() => {
    dispatch({ type: 'RESET_TO_DEFAULTS' });
    selectorCache.current.clear(); // Clear cache on reset
  }, []);
  
  const syncWithExcel = useCallback(async () => {
    dispatch({ type: 'SET_SYNC_STATUS', payload: 'syncing' });
    
    try {
      // Placeholder Excel sync logic with performance monitoring
      performanceMonitor.markStart('excel-sync');
      await new Promise(resolve => setTimeout(resolve, 1000));
      performanceMonitor.markEnd('excel-sync');
      
      dispatch({ type: 'MARK_SYNCED' });
    } catch (error) {
      console.error('Excel sync failed:', error);
      dispatch({ type: 'SET_SYNC_STATUS', payload: 'error' });
    }
  }, []);
  
  const getOptimizationMetrics = useCallback(() => {
    return state.optimizationMetrics;
  }, [state.optimizationMetrics]);
  
  // Custom selector hook for components
  const useSelector = useCallback(function<T>(selector: StateSelector<T>): T {
    return useMemo(() => selector(state), [selector, state]);
  }, [state]);
  
  // Memoized context value to prevent unnecessary re-renders
  const contextValue: OptimizedWACCContextType = useMemo(() => ({
    selectInputData,
    selectBuildUpModel,
    selectCostOfDebtCalculations,
    selectWeightData,
    selectTaxRate,
    selectValidationErrors,
    selectSyncStatus,
    selectIsDirty,
    updateBuildUpModelItem,
    updateCostOfDebtItem,
    updateWeightData,
    updateTaxRate,
    updateSelectionType,
    batchUpdate,
    setInputData,
    resetToDefaults,
    syncWithExcel,
    getOptimizationMetrics,
    useSelector,
  }), [
    selectInputData,
    selectBuildUpModel,
    selectCostOfDebtCalculations,
    selectWeightData,
    selectTaxRate,
    selectValidationErrors,
    selectSyncStatus,
    selectIsDirty,
    updateBuildUpModelItem,
    updateCostOfDebtItem,
    updateWeightData,
    updateTaxRate,
    updateSelectionType,
    batchUpdate,
    setInputData,
    resetToDefaults,
    syncWithExcel,
    getOptimizationMetrics,
    useSelector,
  ]);
  
  return (
    <OptimizedWACCContext.Provider value={contextValue}>
      {children}
    </OptimizedWACCContext.Provider>
  );
};

// Optimized hook with selector system
export const useOptimizedWACCData = () => {
  const context = useContext(OptimizedWACCContext);
  if (!context) {
    throw new Error('useOptimizedWACCData must be used within an OptimizedWACCProvider');
  }
  return context;
};

// Specialized hooks for specific data slices (prevent unnecessary re-renders)
export const useBuildUpModel = () => {
  const context = useOptimizedWACCData();
  return {
    buildUpModel: context.selectBuildUpModel(),
    updateItem: context.updateBuildUpModelItem,
  };
};

export const useCostOfDebt = () => {
  const context = useOptimizedWACCData();
  return {
    costOfDebtCalculations: context.selectCostOfDebtCalculations(),
    updateItem: context.updateCostOfDebtItem,
  };
};

export const useWeightAndTax = () => {
  const context = useOptimizedWACCData();
  return {
    weightData: context.selectWeightData(),
    taxRate: context.selectTaxRate(),
    updateWeightData: context.updateWeightData,
    updateTaxRate: context.updateTaxRate,
  };
};

// Performance debugging hook
export const useWACCPerformanceDebug = () => {
  const context = useOptimizedWACCData();
  
  return {
    metrics: context.getOptimizationMetrics(),
    logPerformance: () => {
      const metrics = context.getOptimizationMetrics();
      console.table({
        'Render Count': metrics.renderCount,
        'State Updates': metrics.stateUpdates,
        'Cache Hits': metrics.selectorCacheHits,
        'Last Render Time': `${metrics.lastRenderTime.toFixed(2)}ms`,
      });
    },
  };
};