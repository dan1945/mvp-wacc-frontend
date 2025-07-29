/**
 * Enhanced Excel Formatter Service
 * CSS-like architecture for scalable Excel formatting
 */

import { WACCResult, WACCInputData, WACCTemplate } from '@types/wacc';
import { ExcelFormattingTokens, OfficeTokens } from '../styles/officeTheme';

// Excel style definition interface (CSS-like)
interface ExcelStyleDefinition {
  font?: {
    name?: string;
    size?: number;
    bold?: boolean;
    italic?: boolean;
    color?: string;
  };
  fill?: {
    color?: string;
    pattern?: 'solid' | 'gradient';
  };
  borders?: {
    top?: BorderStyle;
    bottom?: BorderStyle;
    left?: BorderStyle;
    right?: BorderStyle;
  };
  alignment?: {
    horizontal?: 'left' | 'center' | 'right' | 'justify';
    vertical?: 'top' | 'middle' | 'bottom';
    wrapText?: boolean;
  };
  numberFormat?: string;
}

interface BorderStyle {
  style: 'thin' | 'medium' | 'thick' | 'continuous';
  color?: string;
}

// CSS-like selector system for Excel ranges
interface ExcelSelector {
  range: string;
  styles: ExcelStyleDefinition;
  condition?: (value: any) => boolean;
}

// Style registry for reusable styles
class ExcelStyleRegistry {
  private static instance: ExcelStyleRegistry;
  private styleDefinitions: Map<string, ExcelStyleDefinition> = new Map();
  
  static getInstance(): ExcelStyleRegistry {
    if (!ExcelStyleRegistry.instance) {
      ExcelStyleRegistry.instance = new ExcelStyleRegistry();
    }
    return ExcelStyleRegistry.instance;
  }
  
  // Define reusable style (like CSS class)
  defineStyle(name: string, definition: ExcelStyleDefinition): void {
    this.styleDefinitions.set(name, definition);
  }
  
  // Get style definition
  getStyle(name: string): ExcelStyleDefinition | undefined {
    return this.styleDefinitions.get(name);
  }
  
  // Merge multiple styles (like CSS class composition)
  mergeStyles(...styleNames: string[]): ExcelStyleDefinition {
    const merged: ExcelStyleDefinition = {};
    
    styleNames.forEach(name => {
      const style = this.getStyle(name);
      if (style) {
        // Deep merge styles
        merged.font = { ...merged.font, ...style.font };
        merged.fill = { ...merged.fill, ...style.fill };
        merged.borders = { ...merged.borders, ...style.borders };
        merged.alignment = { ...merged.alignment, ...style.alignment };
        if (style.numberFormat) merged.numberFormat = style.numberFormat;
      }
    });
    
    return merged;
  }
}

/**
 * Enhanced Excel Formatter with CSS-like architecture
 */
export class EnhancedExcelFormatter {
  private styleRegistry = ExcelStyleRegistry.getInstance();
  private performanceMetrics = {
    startTime: 0,
    formatTime: 0,
    applyTime: 0,
  };
  
  constructor() {
    this.initializeBaseStyles();
  }
  
  /**
   * Initialize base styles (like CSS reset/base styles)
   */
  private initializeBaseStyles(): void {
    // Base cell style
    this.styleRegistry.defineStyle('base-cell', {
      font: {
        name: OfficeTokens.typography.fonts.office.replace(/['"]/g, ''),
        size: 11,
        color: OfficeTokens.colors.neutral.foreground1,
      },
      alignment: {
        vertical: 'middle',
      }
    });
    
    // Header styles
    this.styleRegistry.defineStyle('header-primary', {
      font: {
        size: 14,
        bold: true,
        color: ExcelFormattingTokens.colorThemes.professional.primary,
      },
      fill: {
        color: ExcelFormattingTokens.colorThemes.professional.background,
        pattern: 'solid',
      },
      borders: {
        bottom: { style: 'medium', color: ExcelFormattingTokens.colorThemes.professional.border }
      }
    });
    
    this.styleRegistry.defineStyle('header-secondary', {
      font: {
        size: 12,
        bold: true,
        color: ExcelFormattingTokens.colorThemes.professional.secondary,
      }
    });
    
    // Data styles
    this.styleRegistry.defineStyle('data-cell', {
      font: {
        size: 11,
      },
      borders: {
        top: { style: 'thin', color: ExcelFormattingTokens.colorThemes.professional.border },
        bottom: { style: 'thin', color: ExcelFormattingTokens.colorThemes.professional.border },
        left: { style: 'thin', color: ExcelFormattingTokens.colorThemes.professional.border },
        right: { style: 'thin', color: ExcelFormattingTokens.colorThemes.professional.border },
      }
    });
    
    // Number format styles
    this.styleRegistry.defineStyle('percentage-cell', {
      numberFormat: ExcelFormattingTokens.numberFormats.percentage1,
      alignment: {
        horizontal: 'right',
      }
    });
    
    this.styleRegistry.defineStyle('currency-cell', {
      numberFormat: ExcelFormattingTokens.numberFormats.currency,
      alignment: {
        horizontal: 'right',
      }
    });
    
    // Calculation result styles
    this.styleRegistry.defineStyle('calculation-result', {
      font: {
        bold: true,
        size: 12,
      },
      fill: {
        color: '#f0f8ff',
        pattern: 'solid',
      },
      borders: {
        top: { style: 'medium', color: ExcelFormattingTokens.colorThemes.professional.primary },
        bottom: { style: 'medium', color: ExcelFormattingTokens.colorThemes.professional.primary },
      }
    });
    
    // Final WACC result style
    this.styleRegistry.defineStyle('wacc-final-result', {
      font: {
        bold: true,
        size: 14,
        color: '#ffffff',
      },
      fill: {
        color: ExcelFormattingTokens.colorThemes.professional.primary,
        pattern: 'solid',
      },
      borders: {
        top: { style: 'thick', color: ExcelFormattingTokens.colorThemes.professional.primary },
        bottom: { style: 'thick', color: ExcelFormattingTokens.colorThemes.professional.primary },
        left: { style: 'thick', color: ExcelFormattingTokens.colorThemes.professional.primary },
        right: { style: 'thick', color: ExcelFormattingTokens.colorThemes.professional.primary },
      },
      alignment: {
        horizontal: 'center',
        vertical: 'middle',
      }
    });
  }
  
  /**
   * Generate style selectors for WACC table (CSS-like selectors)
   */
  generateWACCStylesheet(template: WACCTemplate): ExcelSelector[] {
    const theme = template.theme;
    
    // Update theme-specific styles
    this.updateThemeStyles(theme.colors);
    
    return [
      // Main title
      {
        range: 'B3',
        styles: this.styleRegistry.mergeStyles('base-cell', 'header-primary'),
      },
      
      // Section headers
      {
        range: 'B5',
        styles: this.styleRegistry.mergeStyles('base-cell', 'header-secondary'),
      },
      {
        range: 'E5',
        styles: this.styleRegistry.mergeStyles('base-cell', 'header-secondary'),
      },
      {
        range: 'B17',
        styles: this.styleRegistry.mergeStyles('base-cell', 'header-secondary'),
      },
      
      // Build-up model data
      {
        range: 'B6:B10',
        styles: this.styleRegistry.mergeStyles('base-cell', 'data-cell'),
      },
      {
        range: 'C6:C10',
        styles: this.styleRegistry.mergeStyles('base-cell', 'data-cell', 'percentage-cell'),
      },
      
      // Cost of equity result
      {
        range: 'B11:C11',
        styles: this.styleRegistry.mergeStyles('base-cell', 'calculation-result', 'percentage-cell'),
      },
      
      // Cost of debt calculations
      {
        range: 'E6:F7',
        styles: this.styleRegistry.mergeStyles('base-cell', 'data-cell', 'percentage-cell'),
      },
      {
        range: 'E8:F8',
        styles: this.styleRegistry.mergeStyles('base-cell', 'calculation-result', 'percentage-cell'),
      },
      {
        range: 'E10:F11',
        styles: this.styleRegistry.mergeStyles('base-cell', 'data-cell'),
      },
      {
        range: 'E12:F12',
        styles: this.styleRegistry.mergeStyles('base-cell', 'calculation-result', 'percentage-cell'),
      },
      
      // WACC calculations
      {
        range: 'B18:B25',
        styles: this.styleRegistry.mergeStyles('base-cell', 'data-cell'),
      },
      {
        range: 'C18:C20',
        styles: this.styleRegistry.mergeStyles('base-cell', 'data-cell', 'currency-cell'),
      },
      {
        range: 'C21:C25',
        styles: this.styleRegistry.mergeStyles('base-cell', 'data-cell', 'percentage-cell'),
      },
      
      // Final WACC result
      {
        range: 'B27:C27',
        styles: this.styleRegistry.mergeStyles('base-cell', 'wacc-final-result', 'percentage-cell'),
      },
      
      // Capital structure table
      {
        range: 'G20:J20',
        styles: this.styleRegistry.mergeStyles('base-cell', 'header-secondary'),
      },
      {
        range: 'F21:F23',
        styles: this.styleRegistry.mergeStyles('base-cell', 'data-cell'),
      },
      {
        range: 'G21:G23',
        styles: this.styleRegistry.mergeStyles('base-cell', 'data-cell', 'currency-cell'),
      },
      {
        range: 'H21:H23',
        styles: this.styleRegistry.mergeStyles('base-cell', 'data-cell', 'percentage-cell'),
      },
      {
        range: 'I21:I23',
        styles: this.styleRegistry.mergeStyles('base-cell', 'data-cell', 'percentage-cell'),
      },
      {
        range: 'J21:J23',
        styles: this.styleRegistry.mergeStyles('base-cell', 'data-cell', 'percentage-cell'),
      },
    ];
  }
  
  /**
   * Apply stylesheet to Excel worksheet
   */
  async applyStylesheet(
    worksheet: Excel.Worksheet, 
    stylesheet: ExcelSelector[]
  ): Promise<void> {
    this.performanceMetrics.startTime = performance.now();
    
    try {
      // Apply styles in batches for better performance
      const batches = this.createStyleBatches(stylesheet);
      
      for (const batch of batches) {
        await this.applyStyleBatch(worksheet, batch);
        await worksheet.context.sync();
      }
      
      this.performanceMetrics.applyTime = performance.now() - this.performanceMetrics.startTime;
      
    } catch (error) {
      console.error('Failed to apply stylesheet:', error);
      throw error;
    }
  }
  
  /**
   * Create conditional formatting rules (CSS-like pseudo-classes)
   */
  createConditionalFormatting(
    worksheet: Excel.Worksheet,
    conditions: Array<{
      range: string;
      condition: string;
      styles: ExcelStyleDefinition;
    }>
  ): void {
    conditions.forEach(({ range, condition, styles }) => {
      const conditionalFormat = worksheet.getRange(range).conditionalFormats.add(
        Excel.ConditionalFormatType.custom
      );
      
      if (conditionalFormat.custom) {
        conditionalFormat.custom.rule.formula = condition;
        
        // Apply styles to conditional format
        if (styles.font) {
          const format = conditionalFormat.custom.format;
          if (styles.font.bold) format.font.bold = true;
          if (styles.font.color) format.font.color = styles.font.color;
        }
        
        if (styles.fill?.color) {
          conditionalFormat.custom.format.fill.color = styles.fill.color;
        }
      }
    });
  }
  
  /**
   * Generate responsive layout adjustments
   */
  applyResponsiveLayout(worksheet: Excel.Worksheet, viewportWidth: number): void {
    // Adjust column widths based on viewport
    if (viewportWidth < 1024) {
      // Compact layout for smaller screens
      worksheet.getRange('B:B').columnWidth = 100;
      worksheet.getRange('C:C').columnWidth = 80;
      worksheet.getRange('E:F').columnWidth = 70;
    } else {
      // Standard layout
      worksheet.getRange('B:B').columnWidth = 120;
      worksheet.getRange('C:C').columnWidth = 100;
      worksheet.getRange('E:F').columnWidth = 90;
    }
  }
  
  /**
   * Performance metrics collection
   */
  getPerformanceMetrics(): typeof this.performanceMetrics {
    return { ...this.performanceMetrics };
  }
  
  // Private helper methods
  
  private updateThemeStyles(colors: any): void {
    // Update theme-specific styles dynamically
    this.styleRegistry.defineStyle('themed-primary', {
      font: { color: colors.primary },
      fill: { color: colors.background, pattern: 'solid' },
    });
    
    this.styleRegistry.defineStyle('themed-border', {
      borders: {
        top: { style: 'thin', color: colors.border },
        bottom: { style: 'thin', color: colors.border },
        left: { style: 'thin', color: colors.border },
        right: { style: 'thin', color: colors.border },
      }
    });
  }
  
  private createStyleBatches(selectors: ExcelSelector[]): ExcelSelector[][] {
    // Group selectors into batches to reduce sync calls
    const batchSize = 10;
    const batches: ExcelSelector[][] = [];
    
    for (let i = 0; i < selectors.length; i += batchSize) {
      batches.push(selectors.slice(i, i + batchSize));
    }
    
    return batches;
  }
  
  private async applyStyleBatch(
    worksheet: Excel.Worksheet, 
    batch: ExcelSelector[]
  ): Promise<void> {
    batch.forEach(selector => {
      const range = worksheet.getRange(selector.range);
      this.applyStyleToRange(range, selector.styles);
    });
  }
  
  private applyStyleToRange(range: Excel.Range, styles: ExcelStyleDefinition): void {
    // Apply font styles
    if (styles.font) {
      if (styles.font.name) range.format.font.name = styles.font.name;
      if (styles.font.size) range.format.font.size = styles.font.size;
      if (styles.font.bold !== undefined) range.format.font.bold = styles.font.bold;
      if (styles.font.italic !== undefined) range.format.font.italic = styles.font.italic;
      if (styles.font.color) range.format.font.color = styles.font.color;
    }
    
    // Apply fill styles
    if (styles.fill) {
      if (styles.fill.color) {
        range.format.fill.color = styles.fill.color;
      }
    }
    
    // Apply border styles
    if (styles.borders) {
      Object.entries(styles.borders).forEach(([side, borderStyle]) => {
        if (borderStyle) {
          const border = range.format.borders.getItem(this.getBorderSide(side));
          border.style = this.getBorderStyle(borderStyle.style);
          if (borderStyle.color) border.color = borderStyle.color;
        }
      });
    }
    
    // Apply alignment
    if (styles.alignment) {
      if (styles.alignment.horizontal) {
        range.format.horizontalAlignment = this.getHorizontalAlignment(styles.alignment.horizontal);
      }
      if (styles.alignment.vertical) {
        range.format.verticalAlignment = this.getVerticalAlignment(styles.alignment.vertical);
      }
      if (styles.alignment.wrapText !== undefined) {
        range.format.wrapText = styles.alignment.wrapText;
      }
    }
    
    // Apply number format
    if (styles.numberFormat) {
      range.numberFormat = styles.numberFormat;
    }
  }
  
  private getBorderSide(side: string): Excel.BorderIndex {
    const sideMap: Record<string, Excel.BorderIndex> = {
      top: Excel.BorderIndex.edgeTop,
      bottom: Excel.BorderIndex.edgeBottom,
      left: Excel.BorderIndex.edgeLeft,
      right: Excel.BorderIndex.edgeRight,
    };
    return sideMap[side] || Excel.BorderIndex.edgeTop;
  }
  
  private getBorderStyle(style: string): Excel.BorderLineStyle {
    const styleMap: Record<string, Excel.BorderLineStyle> = {
      thin: Excel.BorderLineStyle.continuous,
      medium: Excel.BorderLineStyle.continuous,
      thick: Excel.BorderLineStyle.continuous,
      continuous: Excel.BorderLineStyle.continuous,
    };
    return styleMap[style] || Excel.BorderLineStyle.continuous;
  }
  
  private getHorizontalAlignment(alignment: string): Excel.HorizontalAlignment {
    const alignmentMap: Record<string, Excel.HorizontalAlignment> = {
      left: Excel.HorizontalAlignment.left,
      center: Excel.HorizontalAlignment.center,
      right: Excel.HorizontalAlignment.right,
      justify: Excel.HorizontalAlignment.justify,
    };
    return alignmentMap[alignment] || Excel.HorizontalAlignment.left;
  }
  
  private getVerticalAlignment(alignment: string): Excel.VerticalAlignment {
    const alignmentMap: Record<string, Excel.VerticalAlignment> = {
      top: Excel.VerticalAlignment.top,
      middle: Excel.VerticalAlignment.center,
      bottom: Excel.VerticalAlignment.bottom,
    };
    return alignmentMap[alignment] || Excel.VerticalAlignment.center;
  }
}

// Factory for creating themed formatters
export class ExcelFormatterFactory {
  static createFormatter(template: WACCTemplate): EnhancedExcelFormatter {
    const formatter = new EnhancedExcelFormatter();
    
    // Apply template-specific configurations
    const registry = ExcelStyleRegistry.getInstance();
    
    // Override base styles with template theme
    registry.defineStyle('themed-header', {
      font: {
        name: template.theme.fonts.header.name,
        size: template.theme.fonts.header.size,
        bold: template.theme.fonts.header.bold,
        color: template.theme.fonts.header.color,
      }
    });
    
    registry.defineStyle('themed-body', {
      font: {
        name: template.theme.fonts.body.name,
        size: template.theme.fonts.body.size,
        color: template.theme.fonts.body.color,
      }
    });
    
    return formatter;
  }
}

export { ExcelStyleRegistry };