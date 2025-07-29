import React, { useEffect, useRef } from 'react';
import { Text } from '@fluentui/react-components';
import { BaseComponentProps } from '@types/index';

interface AnimatedNumberProps extends BaseComponentProps {
  value: string;
  variant?: 'small' | 'medium' | 'large' | 'xLarge' | 'xxLarge';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  color?: string;
  duration?: number;
}

/**
 * Animated Number Component
 * 
 * Features:
 * - Smooth transitions when value changes
 * - Accessibility compliant announcements
 * - Reduced motion support
 * - Configurable animation duration
 */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  variant = 'medium',
  weight = 'regular',
  color,
  duration = 500,
  className,
  style,
  'aria-label': ariaLabel,
  ...props
}) => {
  const elementRef = useRef<HTMLSpanElement>(null);
  const previousValueRef = useRef<string>(value);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Check if value actually changed
    if (previousValueRef.current === value) return;

    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // No animation for users who prefer reduced motion
      element.textContent = value;
      previousValueRef.current = value;
      return;
    }

    // Add animation class
    element.classList.add('animate-number-change');
    
    // Animate the value change
    const animationDuration = duration;
    let animationFrame: number;
    
    // For accessibility, announce the change
    const announcement = `Value updated to ${value}`;
    
    // Create a temporary element for screen reader announcement
    const srElement = document.createElement('div');
    srElement.setAttribute('aria-live', 'polite');
    srElement.setAttribute('aria-atomic', 'true');
    srElement.className = 'sr-only';
    srElement.textContent = announcement;
    document.body.appendChild(srElement);
    
    // Remove the announcement element after a delay
    setTimeout(() => {
      if (document.body.contains(srElement)) {
        document.body.removeChild(srElement);
      }
    }, 1000);

    // Simple opacity animation
    element.style.opacity = '0.7';
    element.style.transform = 'scale(0.95)';
    
    animationFrame = requestAnimationFrame(() => {
      element.textContent = value;
      element.style.opacity = '1';
      element.style.transform = 'scale(1)';
      
      // Clean up animation class after animation completes
      setTimeout(() => {
        element.classList.remove('animate-number-change');
      }, animationDuration);
    });

    previousValueRef.current = value;

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  return (
    <Text
      ref={elementRef}
      variant={variant}
      weight={weight}
      className={`animate-number-change ${className || ''}`}
      style={{
        color,
        display: 'inline-block',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        ...style
      }}
      aria-label={ariaLabel}
      role="status"
      aria-live="polite"
      {...props}
    >
      {value}
    </Text>
  );
};