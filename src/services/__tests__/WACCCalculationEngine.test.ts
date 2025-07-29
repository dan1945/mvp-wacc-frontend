/**
 * Comprehensive unit tests for WACC Calculation Engine
 * Tests validate 100% parity with legacy wacc.js calculations
 */

import { WACCCalculationEngine, WACCInputData, ValidationError } from '../WACCCalculationEngine';

describe('WACCCalculationEngine', () => {
  let engine: WACCCalculationEngine;

  beforeEach(() => {
    engine = new WACCCalculationEngine();
  });

  describe('Legacy Formula Validation', () => {
    /**
     * Test case based on legacy wacc.js line 24: =ROUND(SUM(C6:C10),3)
     */
    test('Cost of Equity calculation matches legacy ROUND(SUM(),3) formula', async () => {
      const input: WACCInputData = {
        buildUpModel: [
          { name: 'Risk-free Rate', value: 3.5 },
          { name: 'Market Risk Premium', value: 6.0 },
          { name: 'Beta', value: 1.2 },
          { name: 'Size Premium', value: 2.0 },
          { name: 'Company Risk', value: 1.0 }
        ],
        costOfDebtCalculations: [
          { name: 'Base Rate', value: 2.5 },
          { name: 'Credit Spread', value: 1.5 },
          { name: 'Total Interest', value: 400000 },
          { name: 'Total Debt', value: 10000000 }
        ],
        weightData: { weightOfDebt: 40, weightOfEquity: 60 },
        waccBuildUpSelectionType: 1,
        isWeightDataEdited: false,
        taxRate: 25
      };

      const result = await engine.calculateWACC(input);
      
      // Expected: (3.5 + 6.0 + 1.2 + 2.0 + 1.0) / 100 = 0.137
      // With legacy rounding: ROUND(0.137, 3) = 0.137
      expect(result.costOfEquity).toBeCloseTo(0.137, 3);
    });

    /**
     * Test case based on legacy wacc.js line 25: =ROUND(SUM(F6:F7),3)
     */
    test('Cost of Debt Type 1 calculation matches legacy ROUND(SUM(),3) formula', async () => {
      const input: WACCInputData = {
        buildUpModel: [
          { name: 'Risk-free Rate', value: 3.5 },
          { name: 'Market Risk Premium', value: 6.0 },
          { name: 'Beta', value: 1.2 },
          { name: 'Size Premium', value: 2.0 },
          { name: 'Company Risk', value: 1.0 }
        ],
        costOfDebtCalculations: [
          { name: 'Base Rate', value: 2.5 },
          { name: 'Credit Spread', value: 1.5 },
          { name: 'Total Interest', value: 400000 },
          { name: 'Total Debt', value: 10000000 }
        ],
        weightData: { weightOfDebt: 40, weightOfEquity: 60 },
        waccBuildUpSelectionType: 1,
        isWeightDataEdited: false,
        taxRate: 25
      };

      const result = await engine.calculateWACC(input);
      
      // Expected: (2.5 + 1.5) / 100 = 0.04
      // With legacy rounding: ROUND(0.04, 3) = 0.04
      expect(result.costOfDebt).toBeCloseTo(0.04, 3);
    });

    /**
     * Test case based on legacy wacc.js line 26: =ROUND(F10/F11,3)
     */
    test('Cost of Debt Type 2 calculation matches legacy ROUND(division,3) formula', async () => {
      const input: WACCInputData = {
        buildUpModel: [
          { name: 'Risk-free Rate', value: 3.5 },
          { name: 'Market Risk Premium', value: 6.0 },
          { name: 'Beta', value: 1.2 },
          { name: 'Size Premium', value: 2.0 },
          { name: 'Company Risk', value: 1.0 }
        ],
        costOfDebtCalculations: [
          { name: 'Base Rate', value: 2.5 },
          { name: 'Credit Spread', value: 1.5 },
          { name: 'Total Interest', value: 400000 },
          { name: 'Total Debt', value: 10000000 }
        ],
        weightData: { weightOfDebt: 40, weightOfEquity: 60 },
        waccBuildUpSelectionType: 2, // Type 2 uses division
        isWeightDataEdited: false,
        taxRate: 25
      };

      const result = await engine.calculateWACC(input);
      
      // Expected: 400000 / 10000000 = 0.04
      // With legacy rounding: ROUND(0.04, 3) = 0.04
      expect(result.costOfDebt).toBeCloseTo(0.04, 3);
    });

    /**
     * Test case based on legacy wacc.js line 55: =(C21*C24*(1-C25)+C22*C23)
     * Final WACC formula validation
     */
    test('Final WACC calculation matches legacy Excel formula exactly', async () => {
      const input: WACCInputData = {
        buildUpModel: [
          { name: 'Risk-free Rate', value: 3.5 },
          { name: 'Market Risk Premium', value: 6.0 },
          { name: 'Beta', value: 1.2 },
          { name: 'Size Premium', value: 2.0 },
          { name: 'Company Risk', value: 1.0 }
        ],
        costOfDebtCalculations: [
          { name: 'Base Rate', value: 2.5 },
          { name: 'Credit Spread', value: 1.5 },
          { name: 'Total Interest', value: 400000 },
          { name: 'Total Debt', value: 10000000 }
        ],
        weightData: { weightOfDebt: 40, weightOfEquity: 60 },
        waccBuildUpSelectionType: 1,
        isWeightDataEdited: true, // Use manual weights
        taxRate: 25
      };

      const result = await engine.calculateWACC(input);
      
      // Manual calculation:
      // Cost of Equity: 0.137
      // Cost of Debt: 0.04
      // Weight of Debt: 0.40
      // Weight of Equity: 0.60
      // Tax Rate: 0.25
      // WACC = (0.40 * 0.04 * (1 - 0.25)) + (0.60 * 0.137)
      // WACC = (0.40 * 0.04 * 0.75) + (0.082)
      // WACC = 0.012 + 0.0822 = 0.0942
      
      expect(result.weightedAverageCostOfCapital).toBeCloseTo(0.0942, 4);
    });

    test('Sample data generation and calculation workflow', async () => {
      const sampleData = WACCCalculationEngine.createSampleData();
      const result = await engine.calculateWACC(sampleData);
      
      expect(result).toBeDefined();
      expect(result.costOfEquity).toBeGreaterThan(0);
      expect(result.costOfDebt).toBeGreaterThan(0);
      expect(result.weightedAverageCostOfCapital).toBeGreaterThan(0);
      expect(result.capitalStructureTable).toHaveLength(3);
      expect(result.performanceMetrics?.calculationTime).toBeGreaterThan(0);
    });
  });

  describe('Validation and Error Handling', () => {
    test('Should reject invalid build-up model with negative values', async () => {
      const invalidInput: WACCInputData = {
        buildUpModel: [
          { name: 'Risk-free Rate', value: -3.5 }, // Invalid negative value
          { name: 'Market Risk Premium', value: 6.0 }
        ],
        costOfDebtCalculations: [
          { name: 'Base Rate', value: 2.5 },
          { name: 'Credit Spread', value: 1.5 },
          { name: 'Total Interest', value: 400000 },
          { name: 'Total Debt', value: 10000000 }
        ],
        weightData: { weightOfDebt: 40, weightOfEquity: 60 },
        waccBuildUpSelectionType: 1,
        isWeightDataEdited: false,
        taxRate: 25
      };

      await expect(engine.calculateWACC(invalidInput)).rejects.toThrow(ValidationError);
    });

    test('Should reject weights that do not sum to 100%', async () => {
      const invalidInput: WACCInputData = {
        buildUpModel: [
          { name: 'Risk-free Rate', value: 3.5 },
          { name: 'Market Risk Premium', value: 6.0 }
        ],
        costOfDebtCalculations: [
          { name: 'Base Rate', value: 2.5 },
          { name: 'Credit Spread', value: 1.5 },
          { name: 'Total Interest', value: 400000 },
          { name: 'Total Debt', value: 10000000 }
        ],
        weightData: { weightOfDebt: 30, weightOfEquity: 60 }, // Sum = 90%, not 100%
        waccBuildUpSelectionType: 1,
        isWeightDataEdited: true, // This enables weight validation
        taxRate: 25
      };

      await expect(engine.calculateWACC(invalidInput)).rejects.toThrow(ValidationError);
    });

    test('Should handle division by zero in cost of debt calculation', async () => {
      const invalidInput: WACCInputData = {
        buildUpModel: [
          { name: 'Risk-free Rate', value: 3.5 },
          { name: 'Market Risk Premium', value: 6.0 }
        ],
        costOfDebtCalculations: [
          { name: 'Base Rate', value: 2.5 },
          { name: 'Credit Spread', value: 1.5 },
          { name: 'Total Interest', value: 400000 },
          { name: 'Total Debt', value: 0 } // Division by zero
        ],
        weightData: { weightOfDebt: 40, weightOfEquity: 60 },
        waccBuildUpSelectionType: 2, // Type 2 uses division
        isWeightDataEdited: false,
        taxRate: 25
      };

      await expect(engine.calculateWACC(invalidInput)).rejects.toThrow();
    });
  });

  describe('Capital Structure Table Generation', () => {
    test('Should generate proper capital structure table', async () => {
      const input = WACCCalculationEngine.createSampleData();
      const result = await engine.calculateWACC(input);
      
      expect(result.capitalStructureTable).toHaveLength(3);
      
      const [equity, debt, total] = result.capitalStructureTable;
      
      expect(equity.component).toBe('Equity');
      expect(debt.component).toBe('Debt');
      expect(total.component).toBe('Total');
      
      expect(equity.weight + debt.weight).toBeCloseTo(100, 2);
      expect(total.weight).toBe(100);
      
      expect(equity.extendedValue + debt.extendedValue).toBeCloseTo(total.extendedValue, 6);
    });
  });

  describe('Performance Metrics', () => {
    test('Should track calculation performance metrics', async () => {
      const input = WACCCalculationEngine.createSampleData();
      const result = await engine.calculateWACC(input);
      
      expect(result.performanceMetrics).toBeDefined();
      expect(result.performanceMetrics?.calculationTime).toBeGreaterThan(0);
      expect(result.performanceMetrics?.excelGenerationTime).toBe(0);
    });
  });
});