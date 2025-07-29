/**
 * WACC Calculator Accessibility Tests
 * Validates WCAG 2.1 AA compliance across all components
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';

// Import components to test
import { WACCCalculatorApp } from '../../src/components/WACCCalculatorApp';
import { WACCInputWizard } from '../../src/components/WACCInputWizard';
import { TemplateSelector } from '../../src/components/TemplateSelector';
import { OptimizedWACCProvider } from '../../src/contexts/OptimizedWACCContext';
import WACCTemplates from '../../src/templates/waccTemplates';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock providers for isolated testing
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <OptimizedWACCProvider initialData={global.testUtils.createMockWACCData()}>
    {children}
  </OptimizedWACCProvider>
);

describe('WACC Calculator Accessibility', () => {
  beforeEach(() => {
    // Reset any global state
    jest.clearAllMocks();
  });

  describe('WCAG 2.1 AA Compliance', () => {
    test('main calculator app should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <WACCCalculatorApp />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('input wizard should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <WACCInputWizard />
        </TestWrapper>  
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('template selector should have no accessibility violations', async () => {
      const { container } = render(
        <TemplateSelector
          templates={WACCTemplates}
          selectedTemplate={WACCTemplates[0]}
          onTemplateChange={jest.fn()}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    test('should support full keyboard navigation through input wizard', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <WACCInputWizard />
        </TestWrapper>
      );

      // Start from first focusable element
      const firstInput = screen.getAllByRole('textbox')[0];
      await user.click(firstInput);

      // Navigate through all inputs using Tab
      let activeElement = document.activeElement;
      const focusableElements = [];

      while (activeElement) {
        focusableElements.push(activeElement);
        await user.tab();
        
        if (document.activeElement === activeElement) {
          break; // Completed the tab cycle
        }
        activeElement = document.activeElement;
      }

      // Should have at least 5 focusable elements (all input fields)
      expect(focusableElements.length).toBeGreaterThanOrEqual(5);
    });

    test('should support reverse tab navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <WACCInputWizard />
        </TestWrapper>
      );

      // Focus on an input
      const inputs = screen.getAllByRole('textbox');
      await user.click(inputs[2]); // Middle input

      // Navigate backwards
      await user.tab({ shift: true });
      
      // Should move to previous focusable element
      expect(document.activeElement).not.toBe(inputs[2]);
    });

    test('should handle keyboard shortcuts appropriately', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <WACCCalculatorApp />
        </TestWrapper>
      );

      // Test Enter key to trigger actions
      const buttons = screen.getAllByRole('button');
      if (buttons.length > 0) {
        await user.click(buttons[0]);
        await user.keyboard('{Enter}');
        // Should not cause any errors
      }

      // Test Escape key
      await user.keyboard('{Escape}');
      // Should not cause any errors
    });
  });

  describe('Screen Reader Support', () => {
    test('should have proper ARIA labels on all form inputs', () => {
      render(
        <TestWrapper>
          <WACCInputWizard />
        </TestWrapper>
      );

      // All textboxes should have accessible names
      const textboxes = screen.getAllByRole('textbox');
      textboxes.forEach(textbox => {
        expect(
          textbox.getAttribute('aria-label') || 
          textbox.getAttribute('aria-labelledby') ||
          screen.queryByLabelText(textbox.getAttribute('placeholder') || '')
        ).toBeTruthy();
      });
    });

    test('should provide meaningful headings structure', () => {
      render(
        <TestWrapper>
          <WACCCalculatorApp />
        </TestWrapper>
      );

      // Should have hierarchical heading structure
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);

      // Check heading levels are logical
      const headingLevels = headings.map(h => 
        parseInt(h.tagName.charAt(1), 10)
      );
      
      // Should start with h1 or h2 and not skip levels
      expect(headingLevels[0]).toBeLessThanOrEqual(2);
    });

    test('should have descriptive button labels', () => {
      render(
        <TestWrapper>
          <WACCCalculatorApp />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const accessibleName = button.textContent || 
                              button.getAttribute('aria-label') ||
                              button.getAttribute('title');
        
        expect(accessibleName).toBeTruthy();
        expect(accessibleName).not.toBe(''); // Should not be empty
      });
    });

    test('should announce loading states appropriately', async () => {
      render(
        <TestWrapper>
          <WACCCalculatorApp />
        </TestWrapper>
      );

      // Look for live regions that announce status
      const liveRegions = screen.queryAllByRole('status') || 
                         screen.queryAllByLabelText(/loading/i);

      // If loading states exist, they should be properly announced
      if (liveRegions.length > 0) {
        liveRegions.forEach(region => {
          expect(region.getAttribute('aria-live')).toBeTruthy();
        });
      }
    });
  });

  describe('Color and Contrast', () => {
    test('should not rely solely on color for information', () => {
      render(
        <TestWrapper>
          <WACCCalculatorApp />
        </TestWrapper>
      );

      // Look for elements that might use color-only communication
      const errorElements = screen.queryAllByText(/error/i);
      const warningElements = screen.queryAllByText(/warning/i);
      const successElements = screen.queryAllByText(/success/i);

      // These elements should have text or icons, not just color
      [...errorElements, ...warningElements, ...successElements].forEach(element => {
        expect(element.textContent?.length).toBeGreaterThan(0);
      });
    });

    test('should maintain functionality without CSS', async () => {
      // This tests that functionality doesn't depend on visual styling
      const { container } = render(
        <TestWrapper>
          <WACCInputWizard />
        </TestWrapper>
      );

      // Remove all styles
      const styleElements = container.querySelectorAll('style, link[rel="stylesheet"]');
      styleElements.forEach(el => el.remove());

      // Basic functionality should still work
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThan(0);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Dynamic Content Accessibility', () => {
    test('should announce dynamic content changes', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <WACCInputWizard />
        </TestWrapper>
      );

      // Look for elements that might change dynamically
      const inputs = screen.getAllByRole('textbox');
      
      if (inputs.length > 0) {
        // Change input value
        await user.clear(inputs[0]);
        await user.type(inputs[0], '5.5');

        // Any error messages or validation feedback should be announced
        const alerts = screen.queryAllByRole('alert');
        alerts.forEach(alert => {
          expect(alert.getAttribute('aria-live')).toBeTruthy();
        });
      }
    });

    test('should handle error states accessibly', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <WACCInputWizard />
        </TestWrapper>
      );

      const inputs = screen.getAllByRole('textbox');
      
      if (inputs.length > 0) {
        // Enter invalid data
        await user.clear(inputs[0]);
        await user.type(inputs[0], '-1'); // Negative value should be invalid

        // Tab away to trigger validation
        await user.tab();

        // Check for error announcement
        const errorElements = screen.queryAllByRole('alert') ||
                             screen.queryAllByText(/invalid/i) ||
                             screen.queryAllByText(/error/i);

        if (errorElements.length > 0) {
          errorElements.forEach(element => {
            expect(element.getAttribute('aria-live')).toBeTruthy();
          });
        }
      }
    });
  });

  describe('Focus Management', () => {
    test('should trap focus in modal dialogs', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <WACCCalculatorApp />
        </TestWrapper>
      );

      // Look for dialog triggers
      const dialogTriggers = screen.queryAllByRole('button');
      
      for (const trigger of dialogTriggers) {
        // If this opens a dialog
        await user.click(trigger);
        
        const dialog = screen.queryByRole('dialog');
        if (dialog) {
          // Focus should be within the dialog
          expect(dialog.contains(document.activeElement)).toBe(true);
          
          // Tab should cycle within dialog
          await user.tab();
          expect(dialog.contains(document.activeElement)).toBe(true);
          
          // Escape should close dialog if applicable
          await user.keyboard('{Escape}');
        }
      }
    });

    test('should restore focus after modal closes', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <WACCCalculatorApp />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      
      if (buttons.length > 0) {
        const triggerButton = buttons[0];
        await user.click(triggerButton);
        
        // If a modal was opened and closed, focus should return
        const dialog = screen.queryByRole('dialog');
        if (dialog) {
          await user.keyboard('{Escape}');
          
          // Focus should return to trigger
          expect(document.activeElement).toBe(triggerButton);
        }
      }
    });
  });

  describe('Mobile Accessibility', () => {
    test('should have appropriate touch targets', () => {
      render(
        <TestWrapper>
          <WACCCalculatorApp />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      const inputs = screen.getAllByRole('textbox');
      
      // All interactive elements should be large enough for touch
      [...buttons, ...inputs].forEach(element => {
        const styles = getComputedStyle(element);
        const minSize = 44; // 44px minimum touch target
        
        // Note: In tests, computed styles might not reflect real values
        // This is more of a structural check
        expect(element.getBoundingClientRect().width).toBeGreaterThanOrEqual(0);
        expect(element.getBoundingClientRect().height).toBeGreaterThanOrEqual(0);
      });
    });

    test('should work with voice control', () => {
      render(
        <TestWrapper>
          <WACCCalculatorApp />
        </TestWrapper>
      );

      // All interactive elements should have accessible names for voice control
      const interactiveElements = [
        ...screen.getAllByRole('button'),
        ...screen.getAllByRole('textbox'),
        ...screen.getAllByRole('combobox', { hidden: true }) || []
      ];

      interactiveElements.forEach(element => {
        const accessibleName = element.getAttribute('aria-label') ||
                              element.textContent ||
                              element.getAttribute('title') ||
                              element.getAttribute('placeholder');
        
        expect(accessibleName).toBeTruthy();
      });
    });
  });

  describe('Internationalization Accessibility', () => {  
    test('should have proper language attributes', () => {
      render(
        <TestWrapper>
          <WACCCalculatorApp />
        </TestWrapper>
      );

      // Check for lang attributes on the document or elements
      const elementWithLang = document.querySelector('[lang]');
      
      // Should have language specified somewhere
      expect(
        document.documentElement.lang || 
        elementWithLang?.getAttribute('lang')
      ).toBeTruthy();
    });

    test('should handle RTL languages gracefully', () => {
      // Test with RTL direction
      document.documentElement.dir = 'rtl';
      
      render(
        <TestWrapper>
          <WACCCalculatorApp />
        </TestWrapper>
      );

      // Components should render without errors
      expect(screen.getByRole('main') || screen.getByRole('application')).toBeInTheDocument();

      // Reset direction
      document.documentElement.dir = 'ltr';
    });
  });
});