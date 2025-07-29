/**
 * Optimized WACC Components with React.memo and performance enhancements
 * Designed for minimal re-renders and maximum performance
 */

import React, { memo, useMemo, useCallback } from 'react';
import { 
  Text, 
  Input, 
  Button, 
  Card,
  CardHeader,
  CardPreview,
  Divider,
  Spinner
} from '@fluentui/react-components';
import { Calculator24Regular, TrendingUp24Regular } from '@fluentui/react-icons';
import { WACCInputData, WACCResult, BuildUpModelItem, CostOfDebtItem } from '@types/wacc';
import { performanceMonitor, usePerformanceMonitoring } from '../../services/PerformanceMonitor';

// Performance-optimized input component with debouncing
interface OptimizedInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  debounceMs?: number;
  formatType?: 'number' | 'percentage' | 'currency';
}

export const OptimizedInput = memo<OptimizedInputProps>(({
  value,
  onChange,
  placeholder,
  label,
  error,
  debounceMs = 300,
  formatType = 'number'
}) => {
  const { markStart, markEnd } = usePerformanceMonitoring();
  
  // Debounced change handler
  const debouncedOnChange = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    
    return (newValue: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        markStart('input-change');
        const numericValue = parseFloat(newValue) || 0;
        onChange(numericValue);
        markEnd('input-change');
      }, debounceMs);
    };
  }, [onChange, debounceMs, markStart, markEnd]);
  
  // Format display value based on type
  const displayValue = useMemo(() => {
    switch (formatType) {
      case 'percentage':
        return value.toString();
      case 'currency':
        return value.toLocaleString('en-US', { 
          style: 'currency', 
          currency: 'USD',
          minimumFractionDigits: 0 
        }).replace('$', '');
      default:
        return value.toString();
    }
  }, [value, formatType]);
  
  return (
    <div className="wacc-input-group">
      {label && (
        <Text variant="small" weight="semibold" className="wacc-label">
          {label}
        </Text>
      )}
      <Input
        value={displayValue}
        onChange={(_, data) => debouncedOnChange(data.value)}
        placeholder={placeholder}
        className={`wacc-input-field ${error ? 'error' : ''}`}
        aria-label={label}
        aria-invalid={!!error}
        aria-describedby={error ? `${label}-error` : undefined}
      />
      {error && (
        <Text 
          variant="small" 
          color="danger" 
          id={`${label}-error`}
          role="alert"
        >
          {error}
        </Text>
      )}
    </div>
  );
});

OptimizedInput.displayName = 'OptimizedInput';

// Memoized Build-Up Model section
interface OptimizedBuildUpModelProps {
  buildUpModel: BuildUpModelItem[];
  onUpdate: (index: number, item: BuildUpModelItem) => void;
  errors?: string[];
}

export const OptimizedBuildUpModel = memo<OptimizedBuildUpModelProps>(({
  buildUpModel,
  onUpdate,
  errors = []
}) => {
  const { recordRenderMetrics } = usePerformanceMonitoring();
  
  const renderStartTime = useMemo(() => performance.now(), []);
  
  React.useEffect(() => {
    const renderTime = performance.now() - renderStartTime;
    recordRenderMetrics('OptimizedBuildUpModel', renderTime);
  });
  
  // Memoized update handlers to prevent function recreation
  const updateHandlers = useMemo(() => {
    return buildUpModel.map((_, index) => ({
      updateName: (name: string) => {
        onUpdate(index, { ...buildUpModel[index], name });
      },
      updateValue: (value: number) => {
        onUpdate(index, { ...buildUpModel[index], value });
      }
    }));
  }, [buildUpModel, onUpdate]);
  
  return (
    <Card className="wacc-card">
      <CardHeader
        header={
          <div className="flex items-center space-x-2">
            <TrendingUp24Regular />
            <Text variant="large" weight="semibold">Build-Up Model</Text>
          </div>
        }
        description="Components for calculating cost of equity"
      />
      <CardPreview>
        <div className="space-y-4">
          {buildUpModel.map((item, index) => (
            <BuildUpModelRow
              key={`buildup-${index}`}
              item={item}
              index={index}
              onUpdateName={updateHandlers[index].updateName}
              onUpdateValue={updateHandlers[index].updateValue}
              error={errors[index]}
            />
          ))}
          
          <Divider />
          
          <div className="wacc-calculation-summary">
            <Text variant="medium" weight="semibold">
              Total Cost of Equity: {buildUpModel.reduce((sum, item) => sum + item.value, 0).toFixed(3)}%
            </Text>
          </div>
        </div>
      </CardPreview>
    </Card>
  );
});

OptimizedBuildUpModel.displayName = 'OptimizedBuildUpModel';

// Individual row component to minimize re-renders
interface BuildUpModelRowProps {
  item: BuildUpModelItem;
  index: number;
  onUpdateName: (name: string) => void;
  onUpdateValue: (value: number) => void;
  error?: string;
}

const BuildUpModelRow = memo<BuildUpModelRowProps>(({
  item,
  index,
  onUpdateName,
  onUpdateValue,
  error
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <OptimizedInput
        value={0} // Name field would need different handling
        onChange={() => {}} // Placeholder
        label={`Component ${index + 1}`}
        placeholder="e.g., Risk-free Rate"
      />
      <OptimizedInput
        value={item.value}
        onChange={onUpdateValue}
        label="Value (%)"
        formatType="percentage"
        error={error}
      />
    </div>
  );
});

BuildUpModelRow.displayName = 'BuildUpModelRow';

// Optimized Cost of Debt section
interface OptimizedCostOfDebtProps {
  costOfDebtCalculations: CostOfDebtItem[];
  selectionType: 1 | 2;
  onUpdate: (index: number, item: CostOfDebtItem) => void;
  onSelectionTypeChange: (type: 1 | 2) => void;
  errors?: string[];
}

export const OptimizedCostOfDebt = memo<OptimizedCostOfDebtProps>(({
  costOfDebtCalculations,
  selectionType,
  onUpdate,
  onSelectionTypeChange,
  errors = []
}) => {
  const { recordRenderMetrics } = usePerformanceMonitoring();
  
  const renderStartTime = useMemo(() => performance.now(), []);
  
  React.useEffect(() => {
    const renderTime = performance.now() - renderStartTime;
    recordRenderMetrics('OptimizedCostOfDebt', renderTime);
  });
  
  // Memoized calculation results
  const calculationResults = useMemo(() => {
    if (selectionType === 1) {
      // Sum of first two items
      const sum = (costOfDebtCalculations[0]?.value || 0) + (costOfDebtCalculations[1]?.value || 0);
      return { method: 'Sum', result: sum };
    } else {
      // Division of items 3 and 4
      const numerator = costOfDebtCalculations[2]?.value || 0;
      const denominator = costOfDebtCalculations[3]?.value || 1;
      return { method: 'Division', result: denominator !== 0 ? numerator / denominator : 0 };
    }
  }, [costOfDebtCalculations, selectionType]);
  
  const handleSelectionChange = useCallback((type: 1 | 2) => {
    performanceMonitor.markStart('cost-of-debt-selection-change');
    onSelectionTypeChange(type);
    performanceMonitor.markEnd('cost-of-debt-selection-change');
  }, [onSelectionTypeChange]);
  
  return (
    <Card className="wacc-card">
      <CardHeader
        header={
          <div className="flex items-center space-x-2">
            <Calculator24Regular />
            <Text variant="large" weight="semibold">Cost of Debt Calculations</Text>
          </div>
        }
        description="Choose calculation method and enter values"
      />
      <CardPreview>
        <div className="space-y-4">
          {/* Calculation method selection */}
          <div className="flex space-x-4">
            <Button
              appearance={selectionType === 1 ? 'primary' : 'secondary'}
              onClick={() => handleSelectionChange(1)}
              size="small"
            >
              Sum Method
            </Button>
            <Button
              appearance={selectionType === 2 ? 'primary' : 'secondary'}
              onClick={() => handleSelectionChange(2)}
              size="small"
            >
              Division Method
            </Button>
          </div>
          
          {/* Input fields based on selection type */}
          <div className="space-y-3">
            {selectionType === 1 ? (
              <>
                <CostOfDebtInputRow
                  item={costOfDebtCalculations[0]}
                  index={0}
                  onUpdate={onUpdate}
                  label="Interest Rate Component 1"
                  formatType="percentage"
                  error={errors[0]}
                />
                <CostOfDebtInputRow
                  item={costOfDebtCalculations[1]}
                  index={1}
                  onUpdate={onUpdate}
                  label="Interest Rate Component 2"
                  formatType="percentage"
                  error={errors[1]}
                />
              </>
            ) : (
              <>
                <CostOfDebtInputRow
                  item={costOfDebtCalculations[2]}
                  index={2}
                  onUpdate={onUpdate}
                  label="Total Interest Expense"
                  formatType="currency"
                  error={errors[2]}
                />
                <CostOfDebtInputRow
                  item={costOfDebtCalculations[3]}
                  index={3}
                  onUpdate={onUpdate}
                  label="Total Outstanding Debt"
                  formatType="currency"
                  error={errors[3]}
                />
              </>
            )}
          </div>
          
          <Divider />
          
          {/* Calculation result */}
          <div className="wacc-calculation-summary">
            <Text variant="medium" weight="semibold">
              Cost of Debt ({calculationResults.method}): {calculationResults.result.toFixed(3)}%
            </Text>
          </div>
        </div>
      </CardPreview>
    </Card>
  );
});

OptimizedCostOfDebt.displayName = 'OptimizedCostOfDebt';

// Individual cost of debt input row
interface CostOfDebtInputRowProps {
  item: CostOfDebtItem;
  index: number;
  onUpdate: (index: number, item: CostOfDebtItem) => void;
  label: string;
  formatType: 'number' | 'percentage' | 'currency';
  error?: string;
}

const CostOfDebtInputRow = memo<CostOfDebtInputRowProps>(({
  item,
  index,
  onUpdate,
  label,
  formatType,
  error
}) => {
  const handleValueChange = useCallback((value: number) => {
    onUpdate(index, { ...item, value });
  }, [item, index, onUpdate]);
  
  return (
    <OptimizedInput
      value={item.value}
      onChange={handleValueChange}
      label={label}
      formatType={formatType}
      error={error}
    />
  );
});

CostOfDebtInputRow.displayName = 'CostOfDebtInputRow';

// Optimized WACC Result Display
interface OptimizedWACCResultProps {
  result: WACCResult;
  isCalculating: boolean;
}

export const OptimizedWACCResult = memo<OptimizedWACCResultProps>(({
  result,
  isCalculating
}) => {
  const { recordRenderMetrics } = usePerformanceMonitoring();
  
  const renderStartTime = useMemo(() => performance.now(), []);
  
  React.useEffect(() => {
    const renderTime = performance.now() - renderStartTime;
    recordRenderMetrics('OptimizedWACCResult', renderTime);
  });
  
  // Memoized metrics for display
  const displayMetrics = useMemo(() => ({
    finalWACC: (result.weightedAverageCostOfCapital * 100).toFixed(3),
    costOfEquity: (result.costOfEquity * 100).toFixed(3),
    costOfDebt: (result.costOfDebt * 100).toFixed(3),
    weightOfEquity: (result.weightOfEquity).toFixed(1),
    weightOfDebt: (result.weightOfDebt).toFixed(1),
    taxRate: (result.taxRate * 100).toFixed(1),
  }), [result]);
  
  if (isCalculating) {
    return (
      <Card className="wacc-calculation-card">
        <div className="flex items-center justify-center p-8">
          <Spinner size="large" />
          <Text variant="large" className="ml-4">Calculating WACC...</Text>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="wacc-calculation-card">
      <CardHeader
        header={
          <Text variant="xxLarge" weight="bold">WACC Calculation Result</Text>
        }
        description={`Calculated on ${new Date(result.calculationTimestamp).toLocaleString()}`}
      />
      <CardPreview>
        <div className="space-y-6">
          {/* Final WACC - Primary result */}
          <div className="wacc-final-result">
            <Text variant="display" weight="bold" className="text-center">
              {displayMetrics.finalWACC}%
            </Text>
            <Text variant="large" className="text-center opacity-90">
              Weighted Average Cost of Capital
            </Text>
          </div>
          
          {/* Component breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <WACCMetricCard
              label="Cost of Equity"
              value={`${displayMetrics.costOfEquity}%`}
              description="Required return on equity"
            />
            <WACCMetricCard
              label="Cost of Debt"
              value={`${displayMetrics.costOfDebt}%`}
              description="After-tax cost of debt"
            />
            <WACCMetricCard
              label="Weight of Equity"
              value={`${displayMetrics.weightOfEquity}%`}
              description="Equity proportion"
            />
            <WACCMetricCard
              label="Weight of Debt"
              value={`${displayMetrics.weightOfDebt}%`}
              description="Debt proportion"
            />
          </div>
          
          {/* Performance metrics */}
          {result.performanceMetrics && (
            <div className="border-t pt-4">
              <Text variant="small" color="secondary">
                Calculation time: {result.performanceMetrics.calculationTime.toFixed(2)}ms
                {result.performanceMetrics.cacheHit && ' (cached)'}
              </Text>
            </div>
          )}
        </div>
      </CardPreview>
    </Card>
  );
});

OptimizedWACCResult.displayName = 'OptimizedWACCResult';

// Individual metric card component
interface WACCMetricCardProps {
  label: string;
  value: string;
  description: string;
}

const WACCMetricCard = memo<WACCMetricCardProps>(({
  label,
  value,
  description
}) => {
  return (
    <div className="wacc-metric-display">
      <Text variant="small" className="wacc-metric-label">
        {label}
      </Text>
      <Text variant="xLarge" weight="bold" className="wacc-metric-value">
        {value}
      </Text>
      <Text variant="small" color="secondary">
        {description}
      </Text>
    </div>
  );
});

WACCMetricCard.displayName = 'WACCMetricCard';

// Higher-order component for performance monitoring
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  const WrappedComponent = (props: P) => {
    const { recordRenderMetrics } = usePerformanceMonitoring();
    const renderStartTime = useMemo(() => performance.now(), []);
    
    React.useEffect(() => {
      const renderTime = performance.now() - renderStartTime;
      recordRenderMetrics(componentName, renderTime);
    });
    
    return <Component {...props} />;
  };
  
  WrappedComponent.displayName = `withPerformanceMonitoring(${componentName})`;
  
  return memo(WrappedComponent);
}

// Virtualized list component for large datasets
interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 1, items.length);
  
  const visibleItems = items.slice(startIndex, endIndex);
  
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);
  
  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => (
          <div
            key={startIndex + index}
            style={{
              position: 'absolute',
              top: (startIndex + index) * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(item, startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  );
}

export { memo as memoize };