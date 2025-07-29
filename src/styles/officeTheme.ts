/**
 * CSS-like Office Formatting Architecture
 * Centralized style definitions for scalable Excel formatting system
 */

// Core Office Theme Tokens (CSS Custom Properties equivalent)
export const OfficeTokens = {
  // Colors - Based on Office Fluent Design
  colors: {
    // Brand colors
    primary: '#0078d4',
    primaryHover: '#106ebe',
    primaryPressed: '#005a9e',
    secondary: '#00bcf2',
    
    // Semantic colors
    success: '#107c10',
    warning: '#ff8c00', 
    error: '#d13438',
    info: '#0078d4',
    
    // Neutral colors
    neutral: {
      foreground1: '#242424',
      foreground2: '#424242',
      foreground3: '#616161',
      foregroundDisabled: '#a19f9d',
      background1: '#ffffff',
      background2: '#faf9f8',
      background3: '#f3f2f1',
      background4: '#edebe9',
      backgroundDisabled: '#f3f2f1',
    },
    
    // Border colors
    border: {
      light: '#e1dfdd',
      medium: '#c8c6c4',
      strong: '#8a8886',
    }
  },
  
  // Typography scale
  typography: {
    fonts: {
      base: '"Segoe UI", system-ui, sans-serif',
      monospace: '"SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
      office: '"Calibri", "Segoe UI", system-ui, sans-serif',
    },
    
    fontSizes: {
      caption: '12px',
      body: '14px',
      subtitle: '16px',
      title: '20px',
      display: '24px',
    },
    
    fontWeights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    
    lineHeights: {
      caption: '16px',
      body: '20px',
      subtitle: '22px',
      title: '28px',
      display: '32px',
    }
  },
  
  // Spacing scale (based on 4px grid)
  spacing: {
    xs: '4px',
    s: '8px',
    m: '12px',
    l: '16px',
    xl: '20px',
    xxl: '24px',
    xxxl: '32px',
  },
  
  // Border radius
  borderRadius: {
    none: '0px',
    small: '2px',
    medium: '4px',
    large: '8px',
    circular: '50%',
  },
  
  // Shadows
  shadows: {
    2: '0 1px 2px rgba(0, 0, 0, 0.14), 0 0px 2px rgba(0, 0, 0, 0.12)',
    4: '0 2px 4px rgba(0, 0, 0, 0.14), 0 0px 2px rgba(0, 0, 0, 0.12)',
    8: '0 4px 8px rgba(0, 0, 0, 0.14), 0 0px 2px rgba(0, 0, 0, 0.12)',
    16: '0 8px 16px rgba(0, 0, 0, 0.14), 0 0px 2px rgba(0, 0, 0, 0.12)',
  },
  
  // Animation durations
  duration: {
    ultraFast: '50ms',
    faster: '100ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '400ms',
    ultraSlow: '500ms',
  },
  
  // Z-index scale
  zIndex: {
    base: 0,
    overlay: 1000,
    modal: 2000,
    tooltip: 3000,
    popover: 4000,
  }
} as const;

// Excel-specific formatting tokens
export const ExcelFormattingTokens = {
  // Cell formatting
  cell: {
    padding: {
      compact: '4px 8px',
      normal: '6px 12px',
      comfortable: '8px 16px',
    },
    
    borders: {
      none: 'none',
      thin: '1px solid #d0cece',
      medium: '2px solid #8a8886',
      thick: '3px solid #323130',
      continuous: '1px solid #323130',
    },
    
    alignment: {
      left: 'left',
      center: 'center',
      right: 'right',
      justify: 'justify',
    }
  },
  
  // Number formatting patterns (Excel compatible)
  numberFormats: {
    general: 'General',
    currency: '$#,##0.00',
    accounting: '_($* #,##0.00_);_($* (#,##0.00);_($* "-"??_);_(@_)',
    percentage: '0.00%',
    percentage1: '0.0%',
    percentage3: '0.000%',
    date: 'mm/dd/yyyy',
    time: 'h:mm:ss AM/PM',
    scientific: '0.00E+00',
    fraction: '# ?/?',
    text: '@',
  },
  
  // Color themes (Excel compatible hex values)
  colorThemes: {
    professional: {
      primary: '#1f4e79',
      secondary: '#70ad47',
      accent1: '#4f81bd',
      accent2: '#9cbb58',
      neutral: '#c5504b',
      background: '#ffffff',
      text: '#000000',
      border: '#d0cece',
    },
    
    modern: {
      primary: '#0078d4',
      secondary: '#00b7c3',
      accent1: '#8764b8',
      accent2: '#00cc6a',
      neutral: '#69797e',
      background: '#ffffff',
      text: '#323130',
      border: '#c8c6c4',
    },
    
    classic: {
      primary: '#000000',
      secondary: '#555555',
      accent1: '#1f497d',
      accent2: '#548235',
      neutral: '#7f7f7f',
      background: '#ffffff',
      text: '#000000',
      border: '#000000',
    }
  }
} as const;

// Style class generator (CSS-in-JS approach)
export class OfficeStyleSheet {
  private static instance: OfficeStyleSheet;
  private styles: Map<string, string> = new Map();
  private cssText = '';
  
  static getInstance(): OfficeStyleSheet {
    if (!OfficeStyleSheet.instance) {
      OfficeStyleSheet.instance = new OfficeStyleSheet();
    }
    return OfficeStyleSheet.instance;
  }
  
  // Create reusable style definitions
  defineStyle(name: string, properties: Record<string, string | number>): string {
    const className = `wacc-${name}`;
    const cssProperties = Object.entries(properties)
      .map(([key, value]) => `${this.kebabCase(key)}: ${value}`)
      .join('; ');
    
    this.styles.set(className, cssProperties);
    this.updateCSSText();
    
    return className;
  }
  
  // Batch define multiple styles
  defineStyles(styleMap: Record<string, Record<string, string | number>>): Record<string, string> {
    const classNames: Record<string, string> = {};
    
    Object.entries(styleMap).forEach(([name, properties]) => {
      classNames[name] = this.defineStyle(name, properties);
    });
    
    return classNames;
  }
  
  // Generate CSS text for injection
  getCSSText(): string {
    return this.cssText;
  }
  
  // Apply styles to DOM
  injectStyles(): void {
    const styleId = 'wacc-office-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = this.cssText;
  }
  
  private updateCSSText(): void {
    this.cssText = Array.from(this.styles.entries())
      .map(([className, properties]) => `.${className} { ${properties} }`)
      .join('\n');
  }
  
  private kebabCase(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }
}

// Pre-defined component styles
export const ComponentStyles = {
  // Card components
  card: {
    base: {
      backgroundColor: OfficeTokens.colors.neutral.background1,
      border: `1px solid ${OfficeTokens.colors.border.light}`,
      borderRadius: OfficeTokens.borderRadius.medium,
      boxShadow: OfficeTokens.shadows[2],
      padding: OfficeTokens.spacing.l,
    },
    
    elevated: {
      backgroundColor: OfficeTokens.colors.neutral.background1,
      border: `1px solid ${OfficeTokens.colors.border.light}`,
      borderRadius: OfficeTokens.borderRadius.medium,
      boxShadow: OfficeTokens.shadows[8],
      padding: OfficeTokens.spacing.l,
    },
    
    calculation: {
      backgroundColor: OfficeTokens.colors.neutral.background1,
      border: `2px solid ${OfficeTokens.colors.primary}`,
      borderRadius: OfficeTokens.borderRadius.medium,
      boxShadow: OfficeTokens.shadows[4],
      padding: OfficeTokens.spacing.xl,
      background: `linear-gradient(135deg, ${OfficeTokens.colors.neutral.background1} 0%, ${OfficeTokens.colors.neutral.background2} 100%)`,
    }
  },
  
  // Input components
  input: {
    base: {
      fontSize: OfficeTokens.typography.fontSizes.body,
      fontFamily: OfficeTokens.typography.fonts.base,
      padding: `${OfficeTokens.spacing.s} ${OfficeTokens.spacing.m}`,
      border: `1px solid ${OfficeTokens.colors.border.medium}`,
      borderRadius: OfficeTokens.borderRadius.small,
      backgroundColor: OfficeTokens.colors.neutral.background1,
      color: OfficeTokens.colors.neutral.foreground1,
      transition: `border-color ${OfficeTokens.duration.fast} ease`,
    },
    
    focused: {
      borderColor: OfficeTokens.colors.primary,
      boxShadow: `0 0 0 1px ${OfficeTokens.colors.primary}`,
      outline: 'none',
    },
    
    error: {
      borderColor: OfficeTokens.colors.error,
      boxShadow: `0 0 0 1px ${OfficeTokens.colors.error}`,
    }
  },
  
  // Button components
  button: {
    primary: {
      backgroundColor: OfficeTokens.colors.primary,
      color: OfficeTokens.colors.neutral.background1,
      border: 'none',
      padding: `${OfficeTokens.spacing.m} ${OfficeTokens.spacing.xl}`,
      borderRadius: OfficeTokens.borderRadius.small,
      fontSize: OfficeTokens.typography.fontSizes.body,
      fontWeight: OfficeTokens.typography.fontWeights.semibold,
      cursor: 'pointer',
      transition: `background-color ${OfficeTokens.duration.fast} ease`,
    },
    
    secondary: {
      backgroundColor: 'transparent',
      color: OfficeTokens.colors.primary,
      border: `1px solid ${OfficeTokens.colors.primary}`,
      padding: `${OfficeTokens.spacing.m} ${OfficeTokens.spacing.xl}`,
      borderRadius: OfficeTokens.borderRadius.small,
      fontSize: OfficeTokens.typography.fontSizes.body,
      fontWeight: OfficeTokens.typography.fontWeights.medium,
      cursor: 'pointer',
      transition: `all ${OfficeTokens.duration.fast} ease`,
    }
  },
  
  // Data visualization
  metric: {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      padding: OfficeTokens.spacing.l,
      backgroundColor: OfficeTokens.colors.neutral.background1,
      border: `1px solid ${OfficeTokens.colors.border.light}`,
      borderRadius: OfficeTokens.borderRadius.medium,
    },
    
    label: {
      fontSize: OfficeTokens.typography.fontSizes.caption,
      color: OfficeTokens.colors.neutral.foreground2,
      fontWeight: OfficeTokens.typography.fontWeights.medium,
      marginBottom: OfficeTokens.spacing.s,
      textAlign: 'center' as const,
    },
    
    value: {
      fontSize: OfficeTokens.typography.fontSizes.display,
      color: OfficeTokens.colors.neutral.foreground1,
      fontWeight: OfficeTokens.typography.fontWeights.bold,
      fontFamily: OfficeTokens.typography.fonts.monospace,
    },
    
    finalResult: {
      fontSize: OfficeTokens.typography.fontSizes.display,
      color: OfficeTokens.colors.neutral.background1,
      fontWeight: OfficeTokens.typography.fontWeights.bold,
      fontFamily: OfficeTokens.typography.fonts.monospace,
      backgroundColor: OfficeTokens.colors.primary,
      padding: OfficeTokens.spacing.l,
      borderRadius: OfficeTokens.borderRadius.medium,
      textAlign: 'center' as const,
    }
  }
} as const;

// Theme manager for runtime theme switching
export class OfficeThemeManager {
  private currentTheme: keyof typeof ExcelFormattingTokens.colorThemes = 'professional';
  private styleSheet = OfficeStyleSheet.getInstance();
  
  setTheme(theme: keyof typeof ExcelFormattingTokens.colorThemes): void {
    this.currentTheme = theme;
    this.updateThemeStyles();
  }
  
  getCurrentTheme(): keyof typeof ExcelFormattingTokens.colorThemes {
    return this.currentTheme;
  }
  
  getThemeColors(): typeof ExcelFormattingTokens.colorThemes.professional {
    return ExcelFormattingTokens.colorThemes[this.currentTheme];
  }
  
  private updateThemeStyles(): void {
    const colors = this.getThemeColors();
    
    // Update CSS custom properties for theme
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--wacc-theme-${key}`, value);
    });
    
    // Update component styles with new theme
    this.styleSheet.defineStyles({
      'themed-primary': {
        backgroundColor: colors.primary,
        color: colors.background,
      },
      'themed-border': {
        borderColor: colors.border,
      },
      'themed-text': {
        color: colors.text,
      }
    });
  }
}

// Export singleton instances
export const officeStyleSheet = OfficeStyleSheet.getInstance();
export const officeThemeManager = new OfficeThemeManager();

// Utility functions for style generation
export const createResponsiveStyle = (baseStyles: Record<string, string | number>, breakpoints: Record<string, Record<string, string | number>>) => {
  let css = Object.entries(baseStyles)
    .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
    .join('; ');
  
  Object.entries(breakpoints).forEach(([breakpoint, styles]) => {
    const mediaQuery = `@media (max-width: ${breakpoint}) { `;
    const breakpointStyles = Object.entries(styles)
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
      .join('; ');
    css += ` ${mediaQuery} ${breakpointStyles} }`;
  });
  
  return css;
};

export const generateUtilityClasses = () => {
  const utilities: Record<string, Record<string, string | number>> = {};
  
  // Spacing utilities
  Object.entries(OfficeTokens.spacing).forEach(([key, value]) => {
    utilities[`p-${key}`] = { padding: value };
    utilities[`m-${key}`] = { margin: value };
    utilities[`mt-${key}`] = { marginTop: value };
    utilities[`mb-${key}`] = { marginBottom: value };
    utilities[`ml-${key}`] = { marginLeft: value };
    utilities[`mr-${key}`] = { marginRight: value };
  });
  
  // Color utilities
  Object.entries(OfficeTokens.colors.neutral).forEach(([key, value]) => {
    utilities[`text-${key}`] = { color: value };
    utilities[`bg-${key}`] = { backgroundColor: value };
  });
  
  return officeStyleSheet.defineStyles(utilities);
};