import React from 'react';
import { createRoot } from 'react-dom/client';
import WACCCalculatorApp from '../components/WACCCalculatorApp';
import '../styles/globals.css';

/**
 * Taskpane Entry Point
 * 
 * Initializes the React application within the Office Add-in taskpane.
 * Handles Office initialization and error boundaries.
 */

// Initialize Office and start the React app
const initializeApp = (): void => {
  const container = document.getElementById('container');
  if (!container) {
    console.error('Container element not found');
    return;
  }

  const root = createRoot(container);

  // Detect Office theme if available
  let hostTheme: 'light' | 'dark' | 'colorful' = 'light';
  
  if (typeof Office !== 'undefined' && Office.context?.officeTheme) {
    // Map Office theme to our theme system
    const officeTheme = Office.context.officeTheme;
    if (officeTheme.bodyBackgroundColor === '#1B1A19') {
      hostTheme = 'dark';
    } else if (officeTheme.controlBackgroundColor !== '#FFFFFF') {
      hostTheme = 'colorful';
    }
  }

  // Global error handler for unhandled errors
  const handleGlobalError = (error: Error): void => {
    console.error('Global application error:', error);
    // In production, this could report to error tracking service
  };

  root.render(
    <React.StrictMode>
      <WACCCalculatorApp 
        hostTheme={hostTheme}
        onError={handleGlobalError}
      />
    </React.StrictMode>
  );
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Handle hot module replacement in development
if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept('../components/WACCCalculatorApp', () => {
    console.log('Hot reloading WACCCalculatorApp...');
    initializeApp();
  });
}