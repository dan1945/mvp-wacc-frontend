import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Text,
  Button,
  ProgressBar,
  Card,
  CardHeader,
  CardPreview,
  CardFooter,
  tokens
} from '@fluentui/react-components';
import {
  ChevronLeft24Regular,
  ChevronRight24Regular,
  Checkmark24Filled
} from '@fluentui/react-icons';
import { BuildUpModelStep } from './steps/BuildUpModelStep';
import { CostOfDebtStep } from './steps/CostOfDebtStep';
import { WeightTaxStep } from './steps/WeightTaxStep';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { WACCInputWizardProps, WizardStep } from '@types/wacc';

/**
 * WACC Input Wizard Component
 * 
 * Features:
 * - Multi-step guided input process
 * - Progress tracking and validation
 * - Keyboard navigation support
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Step validation and error handling
 * - Responsive design for Office taskpane
 */
export const WACCInputWizard: React.FC<WACCInputWizardProps> = ({
  data,
  onChange,
  validationErrors,
  'aria-labelledby': ariaLabelledBy
}) => {
  const { announceToScreenReader, focusManagement } = useAccessibility();
  const [currentStep, setCurrentStep] = useState(0);
  const stepContentRef = useRef<HTMLDivElement>(null);

  // Define wizard steps
  const wizardSteps: WizardStep[] = [
    {
      id: 'build-up-model',
      title: 'Build Up Model',
      description: 'Enter components for cost of equity calculation',
      component: BuildUpModelStep,
      isValid: (data) => data.buildUpModel.length > 0 && 
        data.buildUpModel.every(item => item.name && item.value >= 0),
      requiredFields: ['buildUpModel']
    },
    {
      id: 'cost-of-debt',
      title: 'Cost of Debt',
      description: 'Configure cost of debt calculation method and values',
      component: CostOfDebtStep,
      isValid: (data) => data.costOfDebtCalculations.length === 4 &&
        data.costOfDebtCalculations.every(item => item.name && item.value >= 0),
      requiredFields: ['costOfDebtCalculations', 'waccBuildUpSelectionType']
    },
    {
      id: 'weights-tax',
      title: 'Weights & Tax Rate',
      description: 'Set capital structure weights and tax rate',
      component: WeightTaxStep,
      isValid: (data) => data.taxRate >= 0 && data.taxRate <= 100 &&
        Math.abs((data.weightData.weightOfDebt + data.weightData.weightOfEquity) - 100) < 0.01,
      requiredFields: ['weightData', 'taxRate']
    }
  ];

  const currentStepData = wizardSteps[currentStep];
  const isStepValid = currentStepData.isValid?.(data) ?? true;
  const canGoNext = currentStep < wizardSteps.length - 1;
  const canGoPrevious = currentStep > 0;

  // Get step-specific validation errors
  const stepValidationErrors = validationErrors.filter(error =>
    currentStepData.requiredFields?.some(field => error.field?.startsWith(field))
  );

  // Handle step change with accessibility announcements
  const handleStepChange = useCallback((newStep: number): void => {
    if (newStep < 0 || newStep >= wizardSteps.length) return;

    setCurrentStep(newStep);
    
    // Announce step change to screen readers
    const stepData = wizardSteps[newStep];
    announceToScreenReader(
      `Now on step ${newStep + 1} of ${wizardSteps.length}: ${stepData.title}`
    );
    
    // Focus management for accessibility
    if (stepContentRef.current) {
      focusManagement.focusElement(stepContentRef.current);
    }
  }, [wizardSteps, announceToScreenReader, focusManagement]);

  const handleNext = useCallback((): void => {
    if (canGoNext) {
      handleStepChange(currentStep + 1);
    }
  }, [canGoNext, currentStep, handleStepChange]);

  const handlePrevious = useCallback((): void => {
    if (canGoPrevious) {
      handleStepChange(currentStep - 1);
    }
  }, [canGoPrevious, currentStep, handleStepChange]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.altKey) {
        switch (event.key) {
          case 'ArrowLeft':
            if (canGoPrevious) {
              event.preventDefault();
              handlePrevious();
            }
            break;
          case 'ArrowRight':
            if (canGoNext && isStepValid) {
              event.preventDefault();
              handleNext();
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [canGoPrevious, canGoNext, isStepValid, handlePrevious, handleNext]);

  const StepComponent = currentStepData.component;

  return (
    <Card className="min-h-[500px] relative">
      {/* Progress Indicator */}
      <CardHeader>
        <div className="space-y-3 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Text variant="medium" weight="semibold">
                Step {currentStep + 1} of {wizardSteps.length}
              </Text>
              {isStepValid && (
                <Checkmark24Filled 
                  style={{ color: tokens.colorPaletteGreenForeground1 }}
                  aria-label="Step completed"
                />
              )}
            </div>
            <Text variant="small" color="secondary">
              {Math.round(((currentStep + 1) / wizardSteps.length) * 100)}% Complete
            </Text>
          </div>
          
          <ProgressBar 
            value={(currentStep + 1) / wizardSteps.length}
            aria-label={`Progress: step ${currentStep + 1} of ${wizardSteps.length}`}
            className="w-full"
          />
          
          <Text variant="small" color="secondary">
            {currentStepData.description}
          </Text>
        </div>
      </CardHeader>

      {/* Step Content */}
      <CardPreview>
        <div 
          ref={stepContentRef}
          className="min-h-[350px] p-4"
          role="tabpanel"
          aria-labelledby={ariaLabelledBy}
          aria-label={`${currentStepData.title} step`}
          tabIndex={-1}
        >
          <Text variant="xLarge" as="h2" id={`step-${currentStep}-title`} className="mb-4">
            {currentStepData.title}
          </Text>
          
          <div aria-describedby={`step-${currentStep}-title`}>
            <StepComponent
              data={data}
              onChange={onChange}
              validationErrors={stepValidationErrors}
              stepIndex={currentStep}
            />
          </div>
        </div>
      </CardPreview>

      {/* Navigation Bar */}
      <CardFooter className="flex justify-between items-center border-t border-gray-200 pt-4">
        <Button
          appearance="secondary"
          icon={<ChevronLeft24Regular />}
          disabled={!canGoPrevious}
          onClick={handlePrevious}
          aria-label="Go to previous step"
        >
          Previous
        </Button>

        {/* Step Indicators */}
        <div className="flex items-center space-x-1">
          {wizardSteps.map((step, index) => (
            <Button
              key={step.id}
              appearance={index === currentStep ? "primary" : "secondary"}
              size="small"
              onClick={() => handleStepChange(index)}
              aria-label={`Go to step ${index + 1}: ${step.title}`}
              aria-current={index === currentStep ? "step" : undefined}
              className="w-8 h-8 p-0"
            >
              {index + 1}
            </Button>
          ))}
        </div>

        <Button
          appearance="primary"
          icon={<ChevronRight24Regular />}
          disabled={!canGoNext || !isStepValid}
          onClick={handleNext}
          aria-label="Go to next step"
        >
          Next
        </Button>
      </CardFooter>

      {/* Screen reader instructions */}
      <div className="sr-only" aria-live="polite">
        Use Alt + Left/Right arrow keys to navigate between steps.
        {!isStepValid && " Complete current step before proceeding."}
      </div>
    </Card>
  );
};