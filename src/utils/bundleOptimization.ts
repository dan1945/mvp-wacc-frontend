/**
 * Bundle Optimization Utilities
 * Dynamic imports, code splitting, and performance optimization strategies
 */

import { performanceMonitor } from '../services/PerformanceMonitor';

// Dynamic import wrapper with performance monitoring
export async function dynamicImport<T>(
  importFn: () => Promise<T>,
  moduleName: string
): Promise<T> {
  performanceMonitor.markStart(`dynamic-import-${moduleName}`);
  
  try {
    const module = await importFn();
    const loadTime = performanceMonitor.markEnd(`dynamic-import-${moduleName}`);
    
    performanceMonitor.recordMetric({
      name: 'module-load',
      value: loadTime,
      timestamp: performance.now(),
      metadata: { moduleName, success: true },
      tags: ['bundle', 'dynamic-import']
    });
    
    return module;
  } catch (error) {
    const loadTime = performanceMonitor.markEnd(`dynamic-import-${moduleName}`);
    
    performanceMonitor.recordMetric({
      name: 'module-load',
      value: loadTime,
      timestamp: performance.now(),
      metadata: { moduleName, success: false, error: (error as Error).message },
      tags: ['bundle', 'dynamic-import', 'error']
    });
    
    throw error;
  }
}

// Lazy loading wrapper for React components
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  componentName: string
) {
  return React.lazy(async () => {
    return dynamicImport(importFn, componentName);
  });
}

// Bundle analyzer utilities
export class BundleAnalyzer {
  private static loadedModules = new Set<string>();
  private static moduleStats = new Map<string, {
    loadTime: number;
    size: number;
    dependencies: string[];
  }>();
  
  static recordModuleLoad(moduleName: string, loadTime: number, size?: number): void {
    this.loadedModules.add(moduleName);
    this.moduleStats.set(moduleName, {
      loadTime,
      size: size || 0,
      dependencies: [],
    });
  }
  
  static getLoadedModules(): string[] {
    return Array.from(this.loadedModules);
  }
  
  static getModuleStats(moduleName: string) {
    return this.moduleStats.get(moduleName);
  }
  
  static getAllStats() {
    return Object.fromEntries(this.moduleStats);
  }
  
  static generateReport(): {
    totalModules: number;
    averageLoadTime: number;
    largestModules: Array<{ name: string; size: number; loadTime: number }>;
    recommendations: string[];
  } {
    const stats = Array.from(this.moduleStats.entries());
    const totalModules = stats.length;
    const averageLoadTime = stats.reduce((sum, [, stat]) => sum + stat.loadTime, 0) / totalModules;
    
    const largestModules = stats
      .filter(([, stat]) => stat.size > 0)
      .sort(([, a], [, b]) => b.size - a.size)
      .slice(0, 10)
      .map(([name, stat]) => ({
        name,
        size: stat.size,
        loadTime: stat.loadTime,
      }));
    
    const recommendations: string[] = [];
    
    // Generate recommendations based on stats
    if (averageLoadTime > 100) {
      recommendations.push('Consider implementing more aggressive code splitting');
    }
    
    if (largestModules.length > 0 && largestModules[0].size > 500000) {
      recommendations.push(`Large module detected: ${largestModules[0].name} (${(largestModules[0].size / 1024).toFixed(1)}KB)`);
    }
    
    return {
      totalModules,
      averageLoadTime,
      largestModules,
      recommendations,
    };
  }
}

// Tree shaking utilities
export const TreeShakingUtils = {
  // Mark unused exports for tree shaking
  markUnused: (exportName: string, moduleName: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Unused export '${exportName}' in module '${moduleName}' - consider removing`);
    }
  },
  
  // Dynamic import with selective exports
  importSelective: async <T extends Record<string, any>>(
    importFn: () => Promise<T>,
    exports: Array<keyof T>,
    moduleName: string
  ): Promise<Pick<T, keyof T>> => {
    const module = await dynamicImport(importFn, moduleName);
    
    // Create object with only requested exports
    const selectiveImport = {} as Pick<T, keyof T>;
    exports.forEach(exportName => {
      if (exportName in module) {
        selectiveImport[exportName] = module[exportName];
      }
    });
    
    return selectiveImport;
  },
};

// Preloading strategies
export class PreloadManager {
  private static preloadedModules = new Set<string>();
  
  // Preload critical modules
  static async preloadCritical(): Promise<void> {
    const criticalModules = [
      {
        name: 'wacc-calculation-engine',
        import: () => import('../services/WACCCalculationEngine'),
      },
      {
        name: 'cache-manager',
        import: () => import('../services/CacheManager'),
      },
    ];
    
    const preloadPromises = criticalModules.map(async module => {
      if (!this.preloadedModules.has(module.name)) {
        await dynamicImport(module.import, module.name);
        this.preloadedModules.add(module.name);
      }
    });
    
    await Promise.all(preloadPromises);
  }
  
  // Preload modules based on user interaction patterns
  static async preloadByUserBehavior(userActions: string[]): Promise<void> {
    const moduleMap: Record<string, () => Promise<any>> = {
      'template-selection': () => import('../templates/waccTemplates'),
      'excel-generation': () => import('../services/ExcelWACCGenerator'),
      'performance-monitoring': () => import('../services/PerformanceMonitor'),
    };
    
    // Predict likely next modules based on user actions
    const predictions = this.predictNextModules(userActions);
    
    const preloadPromises = predictions.map(async prediction => {
      const moduleImport = moduleMap[prediction];
      if (moduleImport && !this.preloadedModules.has(prediction)) {
        await dynamicImport(moduleImport, prediction);
        this.preloadedModules.add(prediction);
      }
    });
    
    await Promise.all(preloadPromises);
  }
  
  private static predictNextModules(userActions: string[]): string[] {
    // Simple prediction logic - in production this could be ML-based
    const predictions: string[] = [];
    
    if (userActions.includes('input-changed')) {
      predictions.push('wacc-calculation');
    }
    
    if (userActions.includes('calculation-completed')) {
      predictions.push('excel-generation');
    }
    
    if (userActions.includes('template-viewed')) {
      predictions.push('template-selection');
    }
    
    return predictions;
  }
}

// Resource hints for optimization
export const ResourceHints = {
  // Generate preload links for critical resources
  generatePreloadLinks: (): HTMLLinkElement[] => {
    const criticalResources = [
      { href: '/fonts/segoe-ui.woff2', as: 'font', type: 'font/woff2' },
      { href: '/api/wacc-templates', as: 'fetch' },
    ];
    
    return criticalResources.map(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as as any;
      if (resource.type) {
        link.type = resource.type;
      }
      if (resource.as === 'font') {
        link.crossOrigin = 'anonymous';
      }
      return link;
    });
  },
  
  // Add resource hints to document head
  applyResourceHints: (): void => {
    const links = ResourceHints.generatePreloadLinks();
    links.forEach(link => {
      document.head.appendChild(link);
    });
  },
  
  // Prefetch likely next page resources
  prefetchResources: (resources: string[]): void => {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = resource;
      document.head.appendChild(link);
    });
  },
};

// Code splitting points configuration
export const CodeSplitPoints = {
  // Route-based splitting
  routes: {
    calculator: () => import('../components/WACCCalculator'),
    templates: () => import('../components/TemplateSelector'),
    settings: () => import('../components/Settings'),
  },
  
  // Feature-based splitting
  features: {
    excelIntegration: () => import('../services/ExcelWACCGenerator'),
    performanceMonitoring: () => import('../services/PerformanceMonitor'),
    advancedCalculations: () => import('../services/AdvancedWACCCalculations'),
  },
  
  // Vendor splitting (handled by webpack config)
  vendors: {
    react: ['react', 'react-dom'],
    fluentUI: ['@fluentui/react-components', '@fluentui/react-icons'],
    office: ['office-js'],
    utilities: ['zod', 'date-fns'],
  },
};

// Performance budget monitoring
export class PerformanceBudget {
  private static budgets = {
    initialLoad: 250, // 250ms
    routeChange: 100, // 100ms
    chunkSize: 244 * 1024, // 244KB
    totalBundle: 1024 * 1024, // 1MB
  };
  
  static checkBudgets(metrics: {
    initialLoadTime?: number;
    routeChangeTime?: number;
    chunkSizes?: Record<string, number>;
    totalBundleSize?: number;
  }): {
    violations: Array<{ budget: string; actual: number; limit: number }>;
    status: 'pass' | 'warning' | 'fail';
  } {
    const violations: Array<{ budget: string; actual: number; limit: number }> = [];
    
    if (metrics.initialLoadTime && metrics.initialLoadTime > this.budgets.initialLoad) {
      violations.push({
        budget: 'Initial Load Time',
        actual: metrics.initialLoadTime,
        limit: this.budgets.initialLoad,
      });
    }
    
    if (metrics.routeChangeTime && metrics.routeChangeTime > this.budgets.routeChange) {
      violations.push({
        budget: 'Route Change Time',
        actual: metrics.routeChangeTime,
        limit: this.budgets.routeChange,
      });
    }
    
    if (metrics.chunkSizes) {
      Object.entries(metrics.chunkSizes).forEach(([chunk, size]) => {
        if (size > this.budgets.chunkSize) {
          violations.push({
            budget: `Chunk Size (${chunk})`,
            actual: size,
            limit: this.budgets.chunkSize,
          });
        }
      });
    }
    
    if (metrics.totalBundleSize && metrics.totalBundleSize > this.budgets.totalBundle) {
      violations.push({
        budget: 'Total Bundle Size',
        actual: metrics.totalBundleSize,
        limit: this.budgets.totalBundle,
      });
    }
    
    const status = violations.length === 0 ? 'pass' : violations.length <= 2 ? 'warning' : 'fail';
    
    return { violations, status };
  }
}

// Bundle optimization recommendations
export const OptimizationRecommendations = {
  analyzeBundle: async (): Promise<string[]> => {
    const recommendations: string[] = [];
    
    // Check for duplicate dependencies
    const bundleAnalysis = BundleAnalyzer.generateReport();
    
    if (bundleAnalysis.averageLoadTime > 100) {
      recommendations.push('Implement route-based code splitting to reduce initial bundle size');
    }
    
    if (bundleAnalysis.largestModules.length > 0) {
      const largest = bundleAnalysis.largestModules[0];
      if (largest.size > 200000) {
        recommendations.push(`Consider lazy loading large module: ${largest.name}`);
      }
    }
    
    // Check for unused Fluent UI components
    recommendations.push('Audit Fluent UI imports - use selective imports instead of full library');
    
    // Check for development dependencies in production
    if (process.env.NODE_ENV === 'production') {
      recommendations.push('Ensure development dependencies are not included in production bundle');
    }
    
    return recommendations;
  },
  
  getWebpackOptimizations: () => ({
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 20,
        },
        fluentui: {
          test: /[\\/]node_modules[\\/]@fluentui[\\/]/,
          name: 'fluentui',
          chunks: 'all',
          priority: 15,
        },
        office: {
          test: /[\\/]node_modules[\\/]office-js[\\/]/,
          name: 'office',
          chunks: 'all',
          priority: 15,
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
    
    usedExports: true,
    sideEffects: false,
    
    minimizer: [
      // Terser optimization settings for better compression
      {
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.warn'],
          },
          mangle: {
            safari10: true,
          },
          output: {
            comments: false,
          },
        },
      },
    ],
  }),
};

// Initialize bundle optimization
export const initializeBundleOptimization = (): void => {
  // Apply resource hints
  ResourceHints.applyResourceHints();
  
  // Start performance monitoring for bundle metrics
  performanceMonitor.recordMetric({
    name: 'bundle-initialization',
    value: performance.now(),
    timestamp: performance.now(),
    tags: ['bundle', 'initialization']
  });
  
  // Preload critical modules
  PreloadManager.preloadCritical().catch(error => {
    console.warn('Failed to preload critical modules:', error);
  });
};