import React, { createContext, useContext, useCallback, useRef } from 'react';
import { AccessibilityContextType } from '@types/wacc';

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

/**
 * Accessibility Context Provider
 * 
 * Features:
 * - Screen reader announcements
 * - Focus management utilities
 * - Keyboard navigation helpers
 * - WCAG 2.1 AA compliance utilities
 */
export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!liveRegionRef.current) return;

    // Clear previous announcement
    liveRegionRef.current.textContent = '';
    
    // Set new announcement with slight delay to ensure screen readers catch it
    setTimeout(() => {
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = message;
        liveRegionRef.current.setAttribute('aria-live', priority);
      }
    }, 100);
  }, []);

  const focusElement = useCallback((element: HTMLElement) => {
    if (!element) return;
    
    // Ensure element is focusable
    if (!element.hasAttribute('tabindex') && !['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'A'].includes(element.tagName)) {
      element.setAttribute('tabindex', '-1');
    }
    
    element.focus();
  }, []);

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          event.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => container.removeEventListener('keydown', handleTabKey);
  }, []);

  const returnFocus = useCallback((previousElement: HTMLElement) => {
    if (previousElement && typeof previousElement.focus === 'function') {
      previousElement.focus();
    }
  }, []);

  const handleEscapeKey = useCallback((callback: () => void) => {
    return (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        callback();
      }
    };
  }, []);

  const handleEnterSpace = useCallback((callback: () => void) => {
    return (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        callback();
      }
    };
  }, []);

  const contextValue: AccessibilityContextType = {
    announceToScreenReader,
    focusManagement: {
      focusElement,
      trapFocus,
      returnFocus,
    },
    keyboardNavigation: {
      handleEscapeKey,
      handleEnterSpace,
    },
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
      {/* Live region for screen reader announcements */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};