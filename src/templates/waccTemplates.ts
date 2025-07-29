/**
 * WACC Template Definitions
 * Based on specifications from frontend architecture document
 */

import { WACCTemplate } from '@types/wacc';

export const WACCTemplates: WACCTemplate[] = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clean, corporate styling suitable for client presentations',
    theme: {
      fonts: {
        header: { name: 'Calibri', size: 14, bold: true, color: '#1f4e79' },
        body: { name: 'Calibri', size: 11, color: '#000000' },
        calculation: { name: 'Calibri', size: 11, numberFormat: '0.0%' }
      },
      colors: {
        primary: '#1f4e79',
        secondary: '#70ad47',
        border: '#d0cece'
      },
      layout: {
        sectionSpacing: 2,
        columnWidths: [120, 100, 80, 100],
        borderStyle: 'continuous'
      }
    },
    waccSpecific: {
      highlightFinalWACC: true,
      showCalculationSteps: true,
      includeFormulas: false
    }
  },
  
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary design with accent colors and improved readability',
    theme: {
      fonts: {
        header: { name: 'Segoe UI', size: 13, bold: true, color: '#0078d4' },
        body: { name: 'Segoe UI', size: 10, color: '#323130' },
        calculation: { name: 'Consolas', size: 10, numberFormat: '0.00%' }
      },
      colors: {
        primary: '#0078d4',
        secondary: '#00b7c3',
        border: '#c8c6c4'
      },
      layout: {
        sectionSpacing: 3,
        columnWidths: [140, 90, 90, 90],
        borderStyle: 'thin'
      }
    },
    waccSpecific: {
      highlightFinalWACC: true,
      showCalculationSteps: true,
      includeFormulas: true
    }
  },
  
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional financial document styling with conservative formatting',
    theme: {
      fonts: {
        header: { name: 'Times New Roman', size: 12, bold: true, color: '#000000' },
        body: { name: 'Times New Roman', size: 10, color: '#000000' },
        calculation: { name: 'Times New Roman', size: 10, numberFormat: '0.000%' }
      },
      colors: {
        primary: '#000000',
        secondary: '#555555',
        border: '#000000'
      },
      layout: {
        sectionSpacing: 1,
        columnWidths: [130, 80, 80, 80],
        borderStyle: 'medium'
      }
    },
    waccSpecific: {
      highlightFinalWACC: false,
      showCalculationSteps: true,
      includeFormulas: true
    }
  }
];

export default WACCTemplates;