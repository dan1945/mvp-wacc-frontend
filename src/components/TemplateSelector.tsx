import React, { useState, useCallback, useMemo } from 'react';
import { Text, Card, CardHeader, CardPreview, Button, Spinner, Badge } from '@fluentui/react-components';
import { Checkmark24Filled, Eye24Regular, Sparkle24Regular } from '@fluentui/react-icons';
import { TemplateSelectionProps, WACCTemplate, WACCResult } from '@types/wacc';

/**
 * Template Selector Component
 * 
 * Fully functional template selection with live previews
 * Supports Professional, Modern, and Classic templates
 */
interface EnhancedTemplateSelectionProps extends TemplateSelectionProps {
  calculationResult?: WACCResult | null;
  isGenerating?: boolean;
  lastGenerationTime?: number;
  platformInfo?: { platform: string; version: string } | null;
}

export const TemplateSelector: React.FC<EnhancedTemplateSelectionProps> = ({
  selectedTemplate,
  onTemplateChange,
  templates,
  calculationResult,
  isGenerating = false,
  lastGenerationTime,
  platformInfo
}) => {
  const [previewTemplate, setPreviewTemplate] = useState<WACCTemplate | null>(null);
  
  // Determine the performance indicator color
  const performanceIndicator = useMemo(() => {
    if (!lastGenerationTime) return null;
    
    const color = lastGenerationTime < 1000 ? 'success' : 
                  lastGenerationTime < 3000 ? 'warning' : 'danger';
    const label = lastGenerationTime < 1000 ? 'Fast' : 
                  lastGenerationTime < 3000 ? 'Good' : 'Slow';
    
    return { color, label, time: lastGenerationTime };
  }, [lastGenerationTime]);

  const handleTemplatePreview = useCallback((template: WACCTemplate) => {
    setPreviewTemplate(template === previewTemplate ? null : template);
  }, [previewTemplate]);

  const handleKeyDown = (event: React.KeyboardEvent, template: WACCTemplate) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onTemplateChange(template);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <Text variant="large" weight="semibold">
            Excel Template Selection
          </Text>
          <div className="flex items-center space-x-2">
            {isGenerating && (
              <div className="flex items-center space-x-1">
                <Spinner size="tiny" />
                <Text variant="small" color="secondary">Generating...</Text>
              </div>
            )}
            {performanceIndicator && (
              <Badge 
                appearance="filled" 
                color={performanceIndicator.color as any}
                icon={<Sparkle24Regular />}
              >
                {performanceIndicator.label} ({performanceIndicator.time.toFixed(0)}ms)
              </Badge>
            )}
            {platformInfo && (
              <Badge appearance="outline">
                {platformInfo.platform}
              </Badge>
            )}
          </div>
        </div>
        <Text variant="small" color="secondary" className="mb-4">
          Choose a template to style your WACC Excel output. Each template offers different fonts, 
          colors, and formatting options optimized for various presentation needs.
        </Text>
      </div>
      
      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card 
            key={template.id}
            className={`cursor-pointer transition-all duration-200 border-2 ${
              selectedTemplate.id === template.id 
                ? 'border-blue-500 bg-blue-50 shadow-lg scale-105' 
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
            onClick={() => onTemplateChange(template)}
            onKeyDown={(e) => handleKeyDown(e, template)}
            role="radio"
            aria-checked={selectedTemplate.id === template.id}
            tabIndex={0}
          >
            <CardHeader
              header={
                <div className="flex items-center justify-between mb-2">
                  <Text variant="medium" weight="semibold" style={{ color: template.theme.colors.primary }}>
                    {template.name}
                  </Text>
                  {selectedTemplate.id === template.id && (
                    <Checkmark24Filled style={{ color: '#0078d4' }} />
                  )}
                </div>
              }
              description={
                <Text variant="small" color="secondary" className="mb-3">
                  {template.description}
                </Text>
              }
            />
            <CardPreview>
              {/* Live Template Preview */}
              <div className="space-y-3">
                <div className="p-3 bg-white rounded border" style={{ borderColor: template.theme.colors.border }}>
                  {/* Excel Table Preview with real or mock data */}
                  <div className="space-y-2">
                    {/* Header */}
                    <div 
                      className="text-center py-1 font-bold text-xs rounded"
                      style={{ 
                        fontFamily: template.theme.fonts.header.name,
                        fontSize: '10px',
                        color: template.theme.colors.primary,
                        backgroundColor: template.waccSpecific.highlightFinalWACC ? `${template.theme.colors.secondary}20` : 'transparent'
                      }}
                    >
                      WACC Table
                    </div>
                    
                    {/* Build Up Model Section */}
                    <div className="border" style={{ borderColor: template.theme.colors.border }}>
                      <div 
                        className="text-xs px-2 py-1 font-semibold"
                        style={{ 
                          fontFamily: template.theme.fonts.header.name,
                          color: template.theme.colors.primary,
                          fontSize: '9px'
                        }}
                      >
                        Build Up Model
                      </div>
                      <div className="px-2 pb-1">
                        <div className="flex justify-between text-xs" style={{ fontFamily: template.theme.fonts.body.name, fontSize: '8px' }}>
                          <span>Risk-free Rate</span>
                          <span style={{ fontFamily: template.theme.fonts.calculation.name }}>
                            {calculationResult ? 
                              `${(calculationResult.buildUpModelData?.[0]?.[1] * 100 || 3.5).toFixed(1)}%` : 
                              '3.50%'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between text-xs" style={{ fontFamily: template.theme.fonts.body.name, fontSize: '8px' }}>
                          <span>Beta Premium</span>
                          <span style={{ fontFamily: template.theme.fonts.calculation.name }}>
                            {calculationResult ? 
                              `${(calculationResult.buildUpModelData?.[1]?.[1] * 100 || 5.25).toFixed(1)}%` : 
                              '5.25%'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* WACC Result */}
                    <div 
                      className="text-center py-1 text-xs font-bold rounded"
                      style={{ 
                        fontFamily: template.theme.fonts.calculation.name,
                        backgroundColor: template.waccSpecific.highlightFinalWACC ? template.theme.colors.secondary : 'transparent',
                        color: template.waccSpecific.highlightFinalWACC ? '#FFFFFF' : template.theme.colors.primary,
                        fontSize: '9px'
                      }}
                    >
                      WACC: {calculationResult ? 
                        `${(calculationResult.weightedAverageCostOfCapital * 100).toFixed(2)}%` : 
                        '8.75%'
                      }
                    </div>
                  </div>
                </div>
                
                {/* Template Preview Actions */}
                <div className="flex justify-between items-center">
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<Eye24Regular />}
                    onClick={() => handleTemplatePreview(template)}
                    aria-label={`Preview ${template.name} template in detail`}
                  >
                    {previewTemplate === template ? 'Hide Preview' : 'Full Preview'}
                  </Button>
                  {calculationResult && (
                    <Badge appearance="outline" size="small">
                      Live Data
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Template Details */}
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Font:</span>
                  <span className="font-medium">{template.theme.fonts.header.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Primary Color:</span>
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-1 border"
                      style={{ backgroundColor: template.theme.colors.primary }}
                    ></div>
                    <span className="text-xs font-mono">{template.theme.colors.primary}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Highlights WACC:</span>
                  <span className="font-medium">{template.waccSpecific.highlightFinalWACC ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Formulas:</span>
                  <span className="font-medium">{template.waccSpecific.includeFormulas ? 'Shown' : 'Hidden'}</span>
                </div>
              </div>
            </CardPreview>
          </Card>
        ))}
      </div>
      
      {/* Full Template Preview */}
      {previewTemplate && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader
            header={
              <div className="flex items-center justify-between">
                <Text variant="large" weight="semibold">
                  {previewTemplate.name} Template Preview
                </Text>
                <Button
                  appearance="subtle"
                  onClick={() => setPreviewTemplate(null)}
                  aria-label="Close preview"
                >
                  ×
                </Button>
              </div>
            }
            description={
              <Text variant="small" color="secondary">
                Detailed preview showing how your WACC table will appear in Excel
              </Text>
            }
          />
          <CardPreview>
            <div className="p-6 bg-white rounded-lg border">
              {/* Full Excel Table Simulation */}
              <div className="font-mono text-sm space-y-4" style={{ fontFamily: previewTemplate.theme.fonts.body.name }}>
                {/* Table Header */}
                <div 
                  className="text-center py-2 font-bold border-b-2"
                  style={{ 
                    fontFamily: previewTemplate.theme.fonts.header.name,
                    fontSize: previewTemplate.theme.fonts.header.size,
                    color: previewTemplate.theme.colors.primary,
                    borderColor: previewTemplate.theme.colors.border
                  }}
                >
                  Table to Calculate WACC
                </div>
                
                {/* Build Up Model Section */}
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div 
                      className="font-bold mb-2 pb-1 border-b"
                      style={{ 
                        fontFamily: previewTemplate.theme.fonts.header.name,
                        color: previewTemplate.theme.colors.primary,
                        borderColor: previewTemplate.theme.colors.border
                      }}
                    >
                      Build Up Model
                    </div>
                    <div className="space-y-1">
                      {calculationResult?.buildUpModelData?.map(([name, value], index) => (
                        <div key={index} className="flex justify-between">
                          <span style={{ fontFamily: previewTemplate.theme.fonts.body.name }}>{name}</span>
                          <span 
                            style={{ 
                              fontFamily: previewTemplate.theme.fonts.calculation.name,
                              fontWeight: 'bold'
                            }}
                          >
                            {(value * 100).toFixed(1)}%
                          </span>
                        </div>
                      )) || (
                        <>
                          <div className="flex justify-between">
                            <span>Risk-free Rate</span>
                            <span className="font-bold">3.50%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Beta Premium</span>
                            <span className="font-bold">5.25%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Size Premium</span>
                            <span className="font-bold">2.00%</span>
                          </div>
                        </>
                      )}
                      <div 
                        className="flex justify-between font-bold pt-1 border-t"
                        style={{ borderColor: previewTemplate.theme.colors.border }}
                      >
                        <span>Cost of Equity</span>
                        <span style={{ fontFamily: previewTemplate.theme.fonts.calculation.name }}>
                          {calculationResult ? 
                            `${(calculationResult.costOfEquity * 100).toFixed(2)}%` : 
                            '10.75%'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Cost of Debt Section */}
                  <div>
                    <div 
                      className="font-bold mb-2 pb-1 border-b"
                      style={{ 
                        fontFamily: previewTemplate.theme.fonts.header.name,
                        color: previewTemplate.theme.colors.primary,
                        borderColor: previewTemplate.theme.colors.border
                      }}
                    >
                      Cost of Debt Calculations
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Interest Expense</span>
                        <span className="font-bold">4.20%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Risk Premium</span>
                        <span className="font-bold">1.30%</span>
                      </div>
                      <div 
                        className="flex justify-between font-bold pt-1 border-t"
                        style={{ borderColor: previewTemplate.theme.colors.border }}
                      >
                        <span>Cost of Debt</span>
                        <span style={{ fontFamily: previewTemplate.theme.fonts.calculation.name }}>
                          {calculationResult ? 
                            `${(calculationResult.costOfDebt * 100).toFixed(2)}%` : 
                            '5.50%'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Final WACC Result */}
                <div 
                  className="text-center py-3 rounded font-bold text-lg"
                  style={{
                    fontFamily: previewTemplate.theme.fonts.calculation.name,
                    backgroundColor: previewTemplate.waccSpecific.highlightFinalWACC ? previewTemplate.theme.colors.secondary : 'transparent',
                    color: previewTemplate.waccSpecific.highlightFinalWACC ? '#FFFFFF' : previewTemplate.theme.colors.primary,
                    border: `2px solid ${previewTemplate.theme.colors.border}`
                  }}
                >
                  Weighted Average Cost of Capital: {calculationResult ? 
                    `${(calculationResult.weightedAverageCostOfCapital * 100).toFixed(2)}%` : 
                    '8.75%'
                  }
                </div>
              </div>
            </div>
          </CardPreview>
        </Card>
      )}
      
      {/* Selected Template Summary */}
      <div className="mt-8 p-4 rounded-lg border-l-4" style={{ 
        borderLeftColor: selectedTemplate.theme.colors.primary,
        backgroundColor: `${selectedTemplate.theme.colors.primary}08`
      }}>
        <div className="flex items-center mb-3">
          <Checkmark24Filled style={{ color: selectedTemplate.theme.colors.primary, marginRight: '8px' }} />
          <Text variant="medium" weight="semibold">
            Selected: {selectedTemplate.name} Template
          </Text>
        </div>
        
        <Text variant="small" color="secondary" className="mb-4">
          {selectedTemplate.description}
        </Text>
        
        {/* Technical Specifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Text variant="small" weight="semibold">Typography</Text>
            <div className="text-xs space-y-1">
              <div><strong>Header:</strong> {selectedTemplate.theme.fonts.header.name} {selectedTemplate.theme.fonts.header.size}pt</div>
              <div><strong>Body:</strong> {selectedTemplate.theme.fonts.body.name} {selectedTemplate.theme.fonts.body.size}pt</div>
              <div><strong>Calculations:</strong> {selectedTemplate.theme.fonts.calculation.name} {selectedTemplate.theme.fonts.calculation.size}pt</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Text variant="small" weight="semibold">Formatting Options</Text>
            <div className="text-xs space-y-1">
              <div><strong>Number Format:</strong> {selectedTemplate.theme.fonts.calculation.numberFormat}</div>
              <div><strong>Border Style:</strong> {selectedTemplate.theme.layout.borderStyle}</div>
              <div><strong>WACC Highlighting:</strong> {selectedTemplate.waccSpecific.highlightFinalWACC ? 'Enabled' : 'Disabled'}</div>
              <div><strong>Formula Display:</strong> {selectedTemplate.waccSpecific.includeFormulas ? 'Visible' : 'Hidden'}</div>
            </div>
          </div>
        </div>
        
        {/* Color Palette */}
        <div className="mt-4">
          <Text variant="small" weight="semibold" className="mb-2">Color Palette</Text>
          <div className="flex space-x-4 text-xs">
            <div className="flex items-center">
              <div 
                className="w-4 h-4 rounded mr-2 border"
                style={{ backgroundColor: selectedTemplate.theme.colors.primary }}
              ></div>
              <span>Primary: {selectedTemplate.theme.colors.primary}</span>
            </div>
            <div className="flex items-center">
              <div 
                className="w-4 h-4 rounded mr-2 border"
                style={{ backgroundColor: selectedTemplate.theme.colors.secondary }}
              ></div>
              <span>Secondary: {selectedTemplate.theme.colors.secondary}</span>
            </div>
            <div className="flex items-center">
              <div 
                className="w-4 h-4 rounded mr-2 border"
                style={{ backgroundColor: selectedTemplate.theme.colors.border }}
              ></div>
              <span>Border: {selectedTemplate.theme.colors.border}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};