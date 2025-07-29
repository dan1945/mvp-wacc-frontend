import React, { memo, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardPreview,
  Text,
  Spinner,
  Badge,
  tokens
} from '@fluentui/react-components';
import {
  Calculator24Regular,
  Clock24Regular,
  ChartMultiple24Regular
} from '@fluentui/react-icons';
import { AnimatedNumber } from './AnimatedNumber';
import { WACCPreviewCardProps, WACCTemplate } from '@types/wacc';

/**
 * WACC Preview Card Component
 * 
 * Features:
 * - Real-time calculation display
 * - Performance metrics
 * - Animated number transitions
 * - Accessibility compliant
 * - Responsive design
 */
interface EnhancedWACCPreviewCardProps extends WACCPreviewCardProps {
  selectedTemplate?: WACCTemplate;
  showTemplatePreview?: boolean;
}

export const WACCPreviewCard: React.FC<EnhancedWACCPreviewCardProps> = memo(({ 
  result, 
  isCalculating = false,
  selectedTemplate,
  showTemplatePreview = false
}) => {
  const performanceColor = useMemo(() => {
    const calcTime = result.performanceMetrics?.calculationTime || 0;
    if (calcTime < 200) return tokens.colorPaletteGreenForeground1;
    if (calcTime < 500) return tokens.colorPaletteYellowForeground1;
    return tokens.colorPaletteRedForeground1;
  }, [result.performanceMetrics?.calculationTime]);

  // Apply template-specific styling
  const templateStyles = useMemo(() => {
    if (!selectedTemplate || !showTemplatePreview) return {};
    
    return {
      headerStyle: {
        fontFamily: selectedTemplate.theme.fonts.header.name,
        color: selectedTemplate.theme.colors.primary,
        fontSize: `${selectedTemplate.theme.fonts.header.size}px`,
        fontWeight: selectedTemplate.theme.fonts.header.bold ? 'bold' : 'normal'
      },
      primaryColor: selectedTemplate.theme.colors.primary,
      secondaryColor: selectedTemplate.theme.colors.secondary,
      borderColor: selectedTemplate.theme.colors.border,
      highlightWACC: selectedTemplate.waccSpecific.highlightFinalWACC
    };
  }, [selectedTemplate, showTemplatePreview]);

  if (isCalculating) {
    return (
      <Card className="wacc-calculation-card">
        <CardPreview>
          <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
            <Spinner size="medium" />
            <Text variant="medium">Calculating WACC...</Text>
          </div>
        </CardPreview>
      </Card>
    );
  }

  return (
    <Card 
      className="wacc-calculation-card"
      role="region"
      aria-labelledby="wacc-preview-title"
      aria-describedby="wacc-preview-description"
    >
      <CardHeader
        header={
          <div className="flex items-center space-x-3">
            <Calculator24Regular style={{ fontSize: '24px' }} />
            <div>
              <Text variant="large" weight="semibold" id="wacc-preview-title">
                WACC Calculation Preview
              </Text>
              <Badge 
                appearance="filled" 
                color="success"
                aria-label="Calculation completed successfully"
              >
                Live
              </Badge>
            </div>
          </div>
        }
        description={
          <Text id="wacc-preview-description" variant="small" color="secondary">
            Real-time calculation results with performance metrics
          </Text>
        }
      />

      <CardPreview>
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div 
            className="grid grid-cols-2 gap-4"
            role="group" 
            aria-label="WACC calculation components"
          >
            <MetricDisplay
              label="Cost of Equity"
              value={result.costOfEquity}
              format="percentage"
              precision={1}
              aria-label="Cost of Equity calculation result"
            />
            
            <MetricDisplay
              label="Cost of Debt"
              value={result.costOfDebt}
              format="percentage"
              precision={1}
              aria-label="Cost of Debt calculation result"
            />
            
            <MetricDisplay
              label="Weight of Equity"
              value={result.weightOfEquity}
              format="percentage"
              precision={1}
              aria-label="Weight of Equity in capital structure"
            />
            
            <MetricDisplay
              label="Weight of Debt"
              value={result.weightOfDebt}
              format="percentage"
              precision={1}
              aria-label="Weight of Debt in capital structure"
            />
          </div>

          {/* Final WACC Result */}
          <div 
            className="wacc-final-result"
            role="group"
            aria-labelledby="final-wacc-label"
            aria-describedby="final-wacc-description"
            style={{
              backgroundColor: templateStyles.highlightWACC ? templateStyles.secondaryColor : undefined,
              border: templateStyles.borderColor ? `2px solid ${templateStyles.borderColor}` : undefined,
              borderRadius: '8px',
              padding: '16px'
            }}
          >
            <div className="space-y-3 text-center">
              <div className="flex items-center justify-center space-x-2">
                <ChartMultiple24Regular 
                  style={{ 
                    fontSize: '20px',
                    color: templateStyles.highlightWACC ? 'white' : templateStyles.primaryColor || 'inherit'
                  }} 
                />
                <Text 
                  variant="xLarge" 
                  weight="bold" 
                  id="final-wacc-label"
                  style={{ 
                    color: templateStyles.highlightWACC ? 'white' : templateStyles.primaryColor || 'white',
                    ...templateStyles.headerStyle
                  }}
                >
                  Weighted Average Cost of Capital
                </Text>
              </div>
              
              <AnimatedNumber
                value={`${(result.weightedAverageCostOfCapital * 100).toFixed(2)}%`}
                variant="xxLarge"
                weight="bold"
                style={{ 
                  color: templateStyles.highlightWACC ? 'white' : templateStyles.primaryColor || 'white', 
                  fontSize: '2.5rem',
                  fontFamily: selectedTemplate?.theme.fonts.calculation.name || 'inherit'
                }}
                aria-label={`Final WACC result: ${(result.weightedAverageCostOfCapital * 100).toFixed(2)} percent`}
              />
              
              <Text 
                variant="small" 
                id="final-wacc-description"
                style={{ 
                  color: templateStyles.highlightWACC ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)'
                }}
              >
                After-tax weighted average cost of capital
                {selectedTemplate && showTemplatePreview && (
                  <span className="block mt-1 text-xs">
                    Using {selectedTemplate.name} template formatting
                  </span>
                )}
              </Text>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="flex justify-between items-center text-sm text-gray-500 border-t pt-4">
            <div className="flex items-center space-x-2">
              <Clock24Regular style={{ fontSize: '16px' }} />
              <Text variant="small">
                Calculated in{' '}
                <Text weight="semibold" style={{ color: performanceColor }}>
                  {result.performanceMetrics?.calculationTime?.toFixed(0) || 0}ms
                </Text>
              </Text>
            </div>
            
            <Text variant="small">
              Last updated: {new Date(result.calculationTimestamp).toLocaleTimeString()}
            </Text>
          </div>
        </div>
      </CardPreview>
    </Card>
  );
});

WACCPreviewCard.displayName = 'WACCPreviewCard';

// Metric Display Component
interface MetricDisplayProps {
  label: string;
  value: number;
  format: 'percentage' | 'decimal' | 'currency';
  precision?: number;
  'aria-label'?: string;
}

const MetricDisplay: React.FC<MetricDisplayProps> = memo(({ 
  label, 
  value, 
  format, 
  precision = 1,
  'aria-label': ariaLabel 
}) => {
  const formattedValue = useMemo(() => {
    switch (format) {
      case 'percentage':
        return `${(value * 100).toFixed(precision)}%`;
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: precision,
        }).format(value);
      case 'decimal':
      default:
        return value.toFixed(precision);
    }
  }, [value, format, precision]);

  return (
    <div className="wacc-metric-display" role="group" aria-label={ariaLabel || label}>
      <Text variant="small" color="secondary" weight="semibold" className="wacc-metric-label">
        {label}
      </Text>
      <AnimatedNumber
        value={formattedValue}
        variant="large"
        weight="bold"
        className="wacc-metric-value"
        aria-label={`${label}: ${formattedValue}`}
      />
    </div>
  );
});

MetricDisplay.displayName = 'MetricDisplay';