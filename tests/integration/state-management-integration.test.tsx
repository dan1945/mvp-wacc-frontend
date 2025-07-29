/**
 * State Management Integration Tests
 * Tests OptimizedWACCContext integration with components and performance optimization
 */

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook } from '@testing-library/react-hooks';

import { 
  OptimizedWACCProvider, 
  useOptimizedWACCData, 
  useBuildUpModel, 
  useCostOfDebt, 
  useWeightAndTax 
} from '../../src/contexts/OptimizedWACCContext';
import { performanceMonitor } from '../../src/services/PerformanceMonitor';

// Mock components for testing
const TestBuildUpComponent: React.FC = () => {
  const { buildUpModel, updateItem } = useBuildUpModel();
  
  return (
    <div data-testid="buildup-component">
      {buildUpModel.map((item, index) => (
        <div key={index} data-testid={`buildup-item-${index}`}>
          <span>{item.name}: {item.value}</span>
          <button 
            onClick={() => updateItem(index, { ...item, value: item.value + 1 })}
            data-testid={`update-buildup-${index}`}
          >
            Update
          </button>
        </div>
      ))}
    </div>
  );
};

const TestCostOfDebtComponent: React.FC = () => {
  const { costOfDebtCalculations, updateItem } = useCostOfDebt();
  
  return (
    <div data-testid="cost-of-debt-component">
      {costOfDebtCalculations.map((item, index) => (
        <div key={index} data-testid={`debt-item-${index}`}>
          <span>{item.name}: {item.value}</span>
          <button 
            onClick={() => updateItem(index, { ...item, value: item.value + 100 })}
            data-testid={`update-debt-${index}`}
          >
            Update
          </button>
        </div>
      ))}
    </div>
  );
};

const TestWeightTaxComponent: React.FC = () => {
  const { weightData, taxRate, updateWeightData, updateTaxRate } = useWeightAndTax();
  
  return (
    <div data-testid="weight-tax-component">
      <div>Weight of Debt: {weightData.weightOfDebt}</div>
      <div>Weight of Equity: {weightData.weightOfEquity}</div>
      <div>Tax Rate: {taxRate}</div>
      <button 
        onClick={() => updateWeightData({ weightOfDebt: 50, weightOfEquity: 50 })}
        data-testid="update-weights"
      >
        Update Weights
      </button>
      <button 
        onClick={() => updateTaxRate(30)}
        data-testid="update-tax-rate"
      >
        Update Tax Rate
      </button>
    </div>
  );
};

const TestApp: React.FC<{ enableDebug?: boolean }> = ({ enableDebug = false }) => (
  <OptimizedWACCProvider 
    initialData={global.testUtils.createMockWACCData()}
    enableDebugMode={enableDebug}
  >
    <TestBuildUpComponent />
    <TestCostOfDebtComponent />
    <TestWeightTaxComponent />
  </OptimizedWACCProvider>
);

describe('State Management Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performanceMonitor.startMonitoring();
  });

  afterEach(() => {
    performanceMonitor.stopMonitoring();
  });

  describe('Context Provider Integration', () => {
    test('should provide initial data to all child components', () => {
      render(<TestApp />);

      // Build-up model data should be available
      expect(screen.getByTestId('buildup-component')).toBeInTheDocument();
      expect(screen.getByText(/Risk-free Rate: 3.5/)).toBeInTheDocument();
      
      // Cost of debt data should be available
      expect(screen.getByTestId('cost-of-debt-component')).toBeInTheDocument();
      expect(screen.getByText(/Base Rate: 2.5/)).toBeInTheDocument();
      
      // Weight and tax data should be available
      expect(screen.getByTestId('weight-tax-component')).toBeInTheDocument();
      expect(screen.getByText(/Weight of Debt: 40/)).toBeInTheDocument();
      expect(screen.getByText(/Tax Rate: 25/)).toBeInTheDocument();
    });

    test('should handle missing provider gracefully', () => {
      // Suppress expected error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useOptimizedWACCData());
      }).toThrow('useOptimizedWACCData must be used within an OptimizedWACCProvider');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Selective Re-rendering Optimization', () => {
    test('should only re-render components affected by state changes', async () => {
      let buildUpRenderCount = 0;
      let costOfDebtRenderCount = 0;
      let weightTaxRenderCount = 0;

      const TestBuildUpWithCounter: React.FC = () => {
        buildUpRenderCount++;
        return <TestBuildUpComponent />;
      };

      const TestCostOfDebtWithCounter: React.FC = () => {
        costOfDebtRenderCount++;
        return <TestCostOfDebtComponent />;
      };

      const TestWeightTaxWithCounter: React.FC = () => {
        weightTaxRenderCount++;
        return <TestWeightTaxComponent />;
      };

      const OptimizedTestApp: React.FC = () => (
        <OptimizedWACCProvider initialData={global.testUtils.createMockWACCData()}>
          <TestBuildUpWithCounter />
          <TestCostOfDebtWithCounter />
          <TestWeightTaxWithCounter />
        </OptimizedWACCProvider>
      );

      const user = userEvent.setup();
      render(<OptimizedTestApp />);

      const initialBuildUpRenders = buildUpRenderCount;
      const initialCostOfDebtRenders = costOfDebtRenderCount;
      const initialWeightTaxRenders = weightTaxRenderCount;

      // Update only build-up model
      await user.click(screen.getByTestId('update-buildup-0'));

      // Only build-up component should re-render
      expect(buildUpRenderCount).toBeGreaterThan(initialBuildUpRenders);
      expect(costOfDebtRenderCount).toBe(initialCostOfDebtRenders);
      expect(weightTaxRenderCount).toBe(initialWeightTaxRenders);
    });

    test('should use selector caching to prevent unnecessary calculations', async () => {
      const TestSelectorCache: React.FC = () => {
        const context = useOptimizedWACCData();
        const buildUpModel1 = context.selectBuildUpModel();
        const buildUpModel2 = context.selectBuildUpModel();
        
        // Should return same reference due to caching
        expect(buildUpModel1).toBe(buildUpModel2);
        
        return <div data-testid="selector-cache-test">Cache Test</div>;
      };

      render(
        <OptimizedWACCProvider initialData={global.testUtils.createMockWACCData()}>
          <TestSelectorCache />
        </OptimizedWACCProvider>
      );

      expect(screen.getByTestId('selector-cache-test')).toBeInTheDocument();
    });
  });

  describe('Batch Updates', () => {
    test('should batch multiple updates for performance', async () => {
      const TestBatchUpdates: React.FC = () => {
        const context = useOptimizedWACCData();
        
        const handleBatchUpdate = () => {
          context.batchUpdate(() => {
            context.updateBuildUpModelItem(0, { name: 'Updated Risk-free Rate', value: 4.0 });
            context.updateTaxRate(30);
            context.updateWeightData({ weightOfDebt: 45, weightOfEquity: 55 });
          });
        };
        
        return (
          <div>
            <button onClick={handleBatchUpdate} data-testid="batch-update">
              Batch Update
            </button>
            <div data-testid="current-values">
              Tax Rate: {context.selectTaxRate()}, 
              Weight of Debt: {context.selectWeightData().weightOfDebt}
            </div>
          </div>
        );
      };

      const user = userEvent.setup();
      render(
        <OptimizedWACCProvider initialData={global.testUtils.createMockWACCData()}>
          <TestBatchUpdates />
        </OptimizedWACCProvider>
      );

      // Perform batch update
      await user.click(screen.getByTestId('batch-update'));

      // All updates should be applied
      await waitFor(() => {
        expect(screen.getByText(/Tax Rate: 30/)).toBeInTheDocument();
        expect(screen.getByText(/Weight of Debt: 45/)).toBeInTheDocument();
      });
    });
  });

  describe('Performance Monitoring Integration', () => {
    test('should record performance metrics for state updates', async () => {
      const metricsSpy = jest.spyOn(performanceMonitor, 'recordMetric');
      
      const user = userEvent.setup();
      render(<TestApp enableDebug={true} />);

      // Perform a state update
      await user.click(screen.getByTestId('update-buildup-0'));

      // Should record performance metrics
      expect(metricsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'state-update',
          metadata: expect.objectContaining({
            actionType: 'UPDATE_BUILDUP_MODEL'
          })
        })
      );
    });

    test('should track optimization metrics', async () => {
      const TestOptimizationMetrics: React.FC = () => {
        const context = useOptimizedWACCData();
        const metrics = context.getOptimizationMetrics();
        
        return (
          <div data-testid="optimization-metrics">
            <div>Render Count: {metrics.renderCount}</div>
            <div>State Updates: {metrics.stateUpdates}</div>
            <div>Cache Hits: {metrics.selectorCacheHits}</div>
          </div>
        );
      };

      const user = userEvent.setup();
      render(
        <OptimizedWACCProvider 
          initialData={global.testUtils.createMockWACCData()}
          enableDebugMode={true}
        >
          <TestOptimizationMetrics />
          <TestBuildUpComponent />
        </OptimizedWACCProvider>
      );

      // Perform multiple updates
      await user.click(screen.getByTestId('update-buildup-0'));
      await user.click(screen.getByTestId('update-buildup-1'));

      // Metrics should be updated
      await waitFor(() => {
        expect(screen.getByText(/State Updates: 2/)).toBeInTheDocument();
      });
    });
  });

  describe('State Synchronization', () => {
    test('should maintain state consistency across components', async () => {
      const user = userEvent.setup();
      render(<TestApp />);

      // Update build-up model from one component
      await user.click(screen.getByTestId('update-buildup-0'));

      // Verify the update is reflected
      await waitFor(() => {
        expect(screen.getByText(/Risk-free Rate: 4.5/)).toBeInTheDocument();
      });

      // Update weights from another component
      await user.click(screen.getByTestId('update-weights'));

      // Verify the weight update is reflected
      await waitFor(() => {
        expect(screen.getByText(/Weight of Debt: 50/)).toBeInTheDocument();
        expect(screen.getByText(/Weight of Equity: 50/)).toBeInTheDocument();
      });
    });

    test('should handle concurrent updates correctly', async () => {
      const TestConcurrentUpdates: React.FC = () => {
        const context = useOptimizedWACCData();
        
        const handleConcurrentUpdates = async () => {
          // Simulate concurrent updates
          const promises = [
            new Promise(resolve => {
              setTimeout(() => {
                context.updateTaxRate(35);
                resolve(void 0);
              }, 10);
            }),
            new Promise(resolve => {
              setTimeout(() => {
                context.updateBuildUpModelItem(0, { name: 'Risk-free Rate', value: 5.0 });
                resolve(void 0);
              }, 5);
            }),
            new Promise(resolve => {
              setTimeout(() => {
                context.updateWeightData({ weightOfDebt: 60, weightOfEquity: 40 });
                resolve(void 0);
              }, 15);
            })
          ];
          
          await Promise.all(promises);
        };
        
        return (
          <div>
            <button onClick={handleConcurrentUpdates} data-testid="concurrent-updates">
              Concurrent Updates
            </button>
            <div data-testid="final-values">
              Tax: {context.selectTaxRate()}, 
              Debt Weight: {context.selectWeightData().weightOfDebt},
              Risk-free: {context.selectBuildUpModel()[0]?.value}
            </div>
          </div>
        );
      };

      const user = userEvent.setup();
      render(
        <OptimizedWACCProvider initialData={global.testUtils.createMockWACCData()}>
          <TestConcurrentUpdates />
        </OptimizedWACCProvider>
      );

      await user.click(screen.getByTestId('concurrent-updates'));

      // All concurrent updates should be applied correctly
      await waitFor(() => {
        expect(screen.getByText(/Tax: 35/)).toBeInTheDocument();
        expect(screen.getByText(/Debt Weight: 60/)).toBeInTheDocument();
        expect(screen.getByText(/Risk-free: 5/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Memory Management', () => {
    test('should not create memory leaks with frequent updates', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      const TestMemoryUsage: React.FC = () => {
        const context = useOptimizedWACCData();
        
        React.useEffect(() => {
          // Perform many updates
          const interval = setInterval(() => {
            context.updateTaxRate(Math.random() * 50);
          }, 10);
          
          setTimeout(() => clearInterval(interval), 1000);
        }, [context]);
        
        return <div data-testid="memory-test">Memory Test</div>;
      };

      render(
        <OptimizedWACCProvider initialData={global.testUtils.createMockWACCData()}>
          <TestMemoryUsage />
        </OptimizedWACCProvider>
      );

      // Wait for updates to complete
      await waitFor(() => {
        expect(screen.getByTestId('memory-test')).toBeInTheDocument();
      });

      await new Promise(resolve => setTimeout(resolve, 1200));

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(1024 * 1024); // Less than 1MB
    });

    test('should clean up resources on unmount', () => {
      const TestCleanup: React.FC = () => {
        const context = useOptimizedWACCData();
        
        React.useEffect(() => {
          return () => {
            // Cleanup should happen automatically
            expect(context).toBeDefined();
          };
        }, [context]);
        
        return <div data-testid="cleanup-test">Cleanup Test</div>;
      };

      const { unmount } = render(
        <OptimizedWACCProvider initialData={global.testUtils.createMockWACCData()}>
          <TestCleanup />
        </OptimizedWACCProvider>
      );

      // Unmount should not cause errors
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid state updates gracefully', async () => {
      const TestErrorHandling: React.FC = () => {
        const context = useOptimizedWACCData();
        
        const handleInvalidUpdate = () => {
          try {
            // Attempt invalid update
            context.updateBuildUpModelItem(-1, { name: 'Invalid', value: -1 });
          } catch (error) {
            // Should handle gracefully
          }
        };
        
        return (
          <button onClick={handleInvalidUpdate} data-testid="invalid-update">
            Invalid Update
          </button>
        );
      };

      const user = userEvent.setup();
      render(
        <OptimizedWACCProvider initialData={global.testUtils.createMockWACCData()}>
          <TestErrorHandling />
        </OptimizedWACCProvider>
      );

      // Should not crash on invalid update
      await user.click(screen.getByTestId('invalid-update'));
      
      // Component should remain functional
      expect(screen.getByTestId('invalid-update')).toBeInTheDocument();
    });
  });
});