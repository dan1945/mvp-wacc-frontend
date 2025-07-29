import React from 'react';
import { Text, Card } from '@fluentui/react-components';
import { StepComponentProps } from '@types/wacc';

/**
 * Cost of Debt Step Component
 * 
 * Placeholder implementation for the Cost of Debt input step.
 * This will be fully implemented with the wizard.
 */
export const CostOfDebtStep: React.FC<StepComponentProps> = ({
  data,
  onChange,
  validationErrors,
  stepIndex
}) => {
  return (
    <Card className="p-4">
      <Text variant="medium" className="mb-4">
        Cost of Debt Step - Coming Soon
      </Text>
      <Text variant="small" color="secondary">
        This step will allow users to configure cost of debt calculation method and values:
        Interest Expense, Additional Cost, Total Interest Expense, and Outstanding Debt.
      </Text>
      
      {/* Show current data for debugging */}
      <div className="mt-4 p-3 bg-gray-50 rounded">
        <Text variant="small">Current Cost of Debt data:</Text>
        <pre className="text-xs mt-2">
          {JSON.stringify(data.costOfDebtCalculations, null, 2)}
        </pre>
        <Text variant="small" className="mt-2">
          Selection Type: {data.waccBuildUpSelectionType}
        </Text>
      </div>
      
      {/* Show validation errors */}
      {validationErrors.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
          <Text variant="small" weight="semibold" className="text-red-600">
            Validation Errors:
          </Text>
          <ul className="mt-2 text-xs text-red-600">
            {validationErrors.map((error, index) => (
              <li key={index}>{error.message}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
};