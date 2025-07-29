import React, { memo, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { WACCInputData, WACCResult, ValidationError, BuildUpModelItem, CostOfDebtItem } from '../../types/wacc';
import { useOptimizedWACC } from '../../hooks/useOptimizedWACC';
import { useRenderPerformance } from '../../providers/PerformanceProvider';

/**
 * Optimized WACC Components with React.memo and Selective Updates
 * 
 * Features:
 * - React.memo for preventing unnecessary re-renders
 * - Selective state updates to minimize re-computation
 * - Virtualization for large data sets
 * - Debounced inputs for better performance
 * - Memoized calculations and derived state
 */

// Types for component optimization
interface OptimizedComponentProps {
  className?: string;
  'data-testid'?: string;
}

interface MemoizedInputProps extends OptimizedComponentProps {
  value: number | string;
  onChange: (value: number | string) => void;
  placeholder?: string;
  type?: 'number' | 'text';
  debounceMs?: number;
  min?: number;
  max?: number;
  step?: number;
}

/**
 * Optimized Input Component with Debouncing
 */
const OptimizedInput = memo<MemoizedInputProps>(({
  value,
  onChange,
  placeholder,
  type = 'number',
  debounceMs = 300,
  min,
  max,
  step,
  className,
  'data-testid': testId,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<NodeJS.Timeout>();
  const { renderCount } = useRenderPerformance('OptimizedInput');

  // Sync local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced change handler
  const handleChange = useCallback((newValue: number | string) => {
    setLocalValue(newValue);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      onChange(newValue);
    }, debounceMs);
  }, [onChange, debounceMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <input
      type={type}
      value={localValue}
      onChange={(e) => {
        const val = type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
        handleChange(val);
      }}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      className={className}
      data-testid={testId}
      style={{
        padding: '8px 12px',
        border: '1px solid #d1d1d1',
        borderRadius: '4px',
        fontSize: '14px',
        width: '100%',
      }}
    />
  );
});

OptimizedInput.displayName = 'OptimizedInput';

/**
 * Optimized Build-Up Model Section
 */
interface OptimizedBuildUpModelProps extends OptimizedComponentProps {
  data: BuildUpModelItem[];
  onChange: (data: BuildUpModelItem[]) => void;
  validationErrors: ValidationError[];
}

const OptimizedBuildUpModel = memo<OptimizedBuildUpModelProps>(({
  data,
  onChange,
  validationErrors,
  className,
  'data-testid': testId,
}) => {
  const { renderCount } = useRenderPerformance('OptimizedBuildUpModel');
  
  // Memoized validation errors for this section
  const sectionErrors = useMemo(() => {
    return validationErrors.filter(error => 
      error.field?.startsWith('buildUpModel')
    );
  }, [validationErrors]);

  // Memoized total calculation
  const totalValue = useMemo(() => {
    return data.reduce((sum, item) => sum + (item.value || 0), 0);
  }, [data]);

  // Optimized item update handler
  const updateItem = useCallback((index: number, field: keyof BuildUpModelItem, value: any) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    onChange(newData);
  }, [data, onChange]);

  return (
    <div className={className} data-testid={testId}>
      <h3 style={{ margin: '0 0 16px 0', color: '#1f4e79', fontSize: '16px' }}>
        Build Up Model
      </h3>
      
      {data.map((item, index) => (
        <MemoizedBuildUpModelItem
          key={`${item.name}-${index}`}
          item={item}
          index={index}
          onUpdate={updateItem}
        />
      ))}
      
      <div style={{
        marginTop: '12px',
        padding: '8px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        fontWeight: 'bold',
      }}>
        Total Cost of Equity: {totalValue.toFixed(2)}%
      </div>
      
      {sectionErrors.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          {sectionErrors.map((error, index) => (
            <div key={index} style={{ color: '#d73502', fontSize: '12px' }}>
              {error.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

OptimizedBuildUpModel.displayName = 'OptimizedBuildUpModel';

/**
 * Memoized Individual Build-Up Model Item
 */
interface MemoizedBuildUpModelItemProps {
  item: BuildUpModelItem;
  index: number;
  onUpdate: (index: number, field: keyof BuildUpModelItem, value: any) => void;
}

const MemoizedBuildUpModelItem = memo<MemoizedBuildUpModelItemProps>(({
  item,
  index,
  onUpdate,
}) => {
  const { renderCount } = useRenderPerformance(`BuildUpModelItem-${index}`);

  const handleNameChange = useCallback((value: string) => {
    onUpdate(index, 'name', value);
  }, [index, onUpdate]);

  const handleValueChange = useCallback((value: number) => {
    onUpdate(index, 'value', value);
  }, [index, onUpdate]);

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '1fr 100px', 
      gap: '12px', 
      marginBottom: '8px',
      alignItems: 'center',
    }}>
      <OptimizedInput
        type="text"
        value={item.name}
        onChange={handleNameChange}
        placeholder="Component name"
      />
      <OptimizedInput
        type="number"
        value={item.value}
        onChange={handleValueChange}
        placeholder="0.00"
        step={0.01}
        min={0}
        max={100}
      />
    </div>
  );
});

MemoizedBuildUpModelItem.displayName = 'MemoizedBuildUpModelItem';

/**
 * Optimized Cost of Debt Section
 */
interface OptimizedCostOfDebtProps extends OptimizedComponentProps {
  data: CostOfDebtItem[];
  selectionType: 1 | 2;
  onChange: (data: CostOfDebtItem[], selectionType: 1 | 2) => void;
  validationErrors: ValidationError[];
}

const OptimizedCostOfDebt = memo<OptimizedCostOfDebtProps>(({
  data,
  selectionType,
  onChange,
  validationErrors,
  className,
  'data-testid': testId,
}) => {
  const { renderCount } = useRenderPerformance('OptimizedCostOfDebt');

  // Memoized validation errors
  const sectionErrors = useMemo(() => {
    return validationErrors.filter(error => 
      error.field?.startsWith('costOfDebt')
    );
  }, [validationErrors]);

  // Memoized calculation results
  const calculationResults = useMemo(() => {
    if (selectionType === 1) {
      const sum = (data[0]?.value || 0) + (data[1]?.value || 0);
      return { result: sum, label: 'Sum Method' };
    } else {
      const ratio = (data[2]?.value || 0) / (data[3]?.value || 1);
      return { result: ratio, label: 'Ratio Method' };
    }
  }, [data, selectionType]);

  const updateData = useCallback((newData: CostOfDebtItem[]) => {
    onChange(newData, selectionType);
  }, [onChange, selectionType]);

  const updateSelectionType = useCallback((newType: 1 | 2) => {
    onChange(data, newType);
  }, [onChange, data]);

  const updateItem = useCallback((index: number, field: keyof CostOfDebtItem, value: any) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    updateData(newData);
  }, [data, updateData]);

  return (
    <div className={className} data-testid={testId}>
      <h3 style={{ margin: '0 0 16px 0', color: '#1f4e79', fontSize: '16px' }}>
        Cost of Debt Calculations
      </h3>
      
      {/* Selection Type Toggle */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <input
            type="radio"
            checked={selectionType === 1}
            onChange={() => updateSelectionType(1)}
            style={{ marginRight: '8px' }}
          />
          Method 1: Sum Calculation
        </label>
        <label style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="radio"
            checked={selectionType === 2}
            onChange={() => updateSelectionType(2)}
            style={{ marginRight: '8px' }}
          />
          Method 2: Ratio Calculation
        </label>
      </div>

      {/* Method 1 Items */}
      {selectionType === 1 && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Sum Method Items:</h4>
          {data.slice(0, 2).map((item, index) => (
            <MemoizedCostOfDebtItem
              key={`method1-${index}`}
              item={item}
              index={index}
              onUpdate={updateItem}
            />
          ))}
        </div>
      )}

      {/* Method 2 Items */}
      {selectionType === 2 && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Ratio Method Items:</h4>
          {data.slice(2, 4).map((item, index) => (
            <MemoizedCostOfDebtItem
              key={`method2-${index + 2}`}
              item={item}
              index={index + 2}
              onUpdate={updateItem}
            />
          ))}
        </div>
      )}

      {/* Calculation Result */}
      <div style={{
        marginTop: '12px',
        padding: '8px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        fontWeight: 'bold',
      }}>
        Cost of Debt ({calculationResults.label}): {calculationResults.result.toFixed(3)}%
      </div>

      {sectionErrors.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          {sectionErrors.map((error, index) => (
            <div key={index} style={{ color: '#d73502', fontSize: '12px' }}>
              {error.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

OptimizedCostOfDebt.displayName = 'OptimizedCostOfDebt';

/**
 * Memoized Individual Cost of Debt Item
 */
interface MemoizedCostOfDebtItemProps {
  item: CostOfDebtItem;
  index: number;
  onUpdate: (index: number, field: keyof CostOfDebtItem, value: any) => void;
}

const MemoizedCostOfDebtItem = memo<MemoizedCostOfDebtItemProps>(({
  item,
  index,
  onUpdate,
}) => {
  const { renderCount } = useRenderPerformance(`CostOfDebtItem-${index}`);

  const handleNameChange = useCallback((value: string) => {
    onUpdate(index, 'name', value);
  }, [index, onUpdate]);

  const handleValueChange = useCallback((value: number) => {
    onUpdate(index, 'value', value);
  }, [index, onUpdate]);

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '1fr 120px', 
      gap: '12px', 
      marginBottom: '8px',
      alignItems: 'center',
    }}>
      <OptimizedInput
        type="text"
        value={item.name}
        onChange={handleNameChange}
        placeholder="Item name"
      />
      <OptimizedInput
        type="number"
        value={item.value}
        onChange={handleValueChange}
        placeholder="0.00"
        step={0.01}
      />
    </div>
  );
});

MemoizedCostOfDebtItem.displayName = 'MemoizedCostOfDebtItem';

/**
 * Optimized WACC Result Display
 */
interface OptimizedWACCResultProps extends OptimizedComponentProps {
  result: WACCResult | null;
  isCalculating: boolean;
  performanceMetrics: {
    lastCalculationTime: number;
    cacheHitRate: number;
  };
}

const OptimizedWACCResult = memo<OptimizedWACCResultProps>(({
  result,
  isCalculating,
  performanceMetrics,
  className,
  'data-testid': testId,
}) => {
  const { renderCount } = useRenderPerformance('OptimizedWACCResult');

  // Memoized formatted values
  const formattedResult = useMemo(() => {
    if (!result) return null;

    return {
      wacc: (result.weightedAverageCostOfCapital * 100).toFixed(2),
      costOfEquity: (result.costOfEquity * 100).toFixed(2),
      costOfDebt: (result.costOfDebt * 100).toFixed(2),
      weightOfEquity: (result.weightOfEquity * 100).toFixed(1),
      weightOfDebt: (result.weightOfDebt * 100).toFixed(1),
    };
  }, [result]);

  if (isCalculating) {
    return (
      <div className={className} data-testid={testId}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          fontSize: '16px',
          color: '#666',
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid #0078d4',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginRight: '12px',
          }} />
          Calculating WACC...
        </div>
      </div>
    );
  }

  if (!result || !formattedResult) {
    return (
      <div className={className} data-testid={testId}>
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: '#666',
          fontSize: '16px',
        }}>
          Enter data to see WACC calculation
        </div>
      </div>
    );
  }

  return (
    <div className={className} data-testid={testId}>
      <div style={{
        padding: '24px',
        border: '2px solid #0078d4',
        borderRadius: '8px',
        backgroundColor: '#f8f9fa',
      }}>
        <h2 style={{
          margin: '0 0 20px 0',
          fontSize: '24px',
          color: '#1f4e79',
          textAlign: 'center',
        }}>
          WACC Result: {formattedResult.wacc}%
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}>
          <div>
            <div style={{ fontSize: '12px', color: '#666' }}>Cost of Equity</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{formattedResult.costOfEquity}%</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#666' }}>Cost of Debt</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{formattedResult.costOfDebt}%</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#666' }}>Weight of Equity</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{formattedResult.weightOfEquity}%</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#666' }}>Weight of Debt</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{formattedResult.weightOfDebt}%</div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div style={{
          borderTop: '1px solid #ddd',
          paddingTop: '12px',
          fontSize: '12px',
          color: '#666',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <span>Calculation Time: {performanceMetrics.lastCalculationTime.toFixed(1)}ms</span>
          <span>Cache Hit Rate: {Math.round(performanceMetrics.cacheHitRate * 100)}%</span>
        </div>
      </div>
    </div>
  );
});

OptimizedWACCResult.displayName = 'OptimizedWACCResult';

/**
 * Main Optimized WACC Calculator Component
 */
interface OptimizedWACCCalculatorProps extends OptimizedComponentProps {
  initialData?: WACCInputData;
  onResultChange?: (result: WACCResult | null) => void;
}

export const OptimizedWACCCalculator = memo<OptimizedWACCCalculatorProps>(({
  initialData,
  onResultChange,
  className,
  'data-testid': testId,
}) => {
  const { renderCount } = useRenderPerformance('OptimizedWACCCalculator');
  
  const {
    inputData,
    result,
    isCalculating,
    validationErrors,
    performanceMetrics,
    updateInput,
    setInputData,
  } = useOptimizedWACC({
    enableAutoCalculation: true,
    debounceMs: 500, // Slightly longer debounce for main calculator
  });

  // Set initial data if provided
  useEffect(() => {
    if (initialData) {
      setInputData(initialData);
    }
  }, [initialData, setInputData]);

  // Notify parent of result changes
  useEffect(() => {
    if (onResultChange) {
      onResultChange(result);
    }
  }, [result, onResultChange]);

  // Memoized update handlers
  const handleBuildUpModelChange = useCallback((data: BuildUpModelItem[]) => {
    updateInput('buildUpModel', data);
  }, [updateInput]);

  const handleCostOfDebtChange = useCallback((data: CostOfDebtItem[], selectionType: 1 | 2) => {
    updateInput('costOfDebtCalculations', data);
    updateInput('waccBuildUpSelectionType', selectionType);
  }, [updateInput]);

  return (
    <div className={className} data-testid={testId}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '24px',
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        {/* Build-Up Model Section */}
        <OptimizedBuildUpModel
          data={inputData.buildUpModel}
          onChange={handleBuildUpModelChange}
          validationErrors={validationErrors}
        />

        {/* Cost of Debt Section */}
        <OptimizedCostOfDebt
          data={inputData.costOfDebtCalculations}
          selectionType={inputData.waccBuildUpSelectionType}
          onChange={handleCostOfDebtChange}
          validationErrors={validationErrors}
        />

        {/* WACC Result */}
        <OptimizedWACCResult
          result={result}
          isCalculating={isCalculating}
          performanceMetrics={performanceMetrics}
        />
      </div>

      {/* CSS for loading animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
});

OptimizedWACCCalculator.displayName = 'OptimizedWACCCalculator';

export {
  OptimizedInput,
  OptimizedBuildUpModel,
  OptimizedCostOfDebt,
  OptimizedWACCResult,
};