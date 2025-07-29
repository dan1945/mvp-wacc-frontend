import React from 'react';
import { Text, Card } from '@fluentui/react-components';
import { StepComponentProps } from '@types/wacc';

/**
 * Build Up Model Step Component
 * 
 * Placeholder implementation for the Build Up Model input step.
 * This will be fully implemented with the wizard.
 */
export const BuildUpModelStep: React.FC<StepComponentProps> = ({
  data,
  onChange,
  validationErrors,
  stepIndex
}) => {
  return (
    <Card className="p-4">
      <Text variant="medium" className="mb-4">
        Build Up Model Step - Coming Soon
      </Text>
      <Text variant="small" color="secondary">
        This step will allow users to input the components for cost of equity calculation:
        Risk-free Rate, Beta Premium, Small Company Premium, and Company Specific Risk.
      </Text>
      
      {/* Show current data for debugging */}
      <div className="mt-4 p-3 bg-gray-50 rounded">
        <Text variant="small">Current Build Up Model data:</Text>
        <pre className="text-xs mt-2">
          {JSON.stringify(data.buildUpModel, null, 2)}
        </pre>
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