import { useState, useEffect } from 'react';

/**
 * Debounce Hook
 * 
 * Delays the update of a value until after a specified delay period.
 * Useful for preventing excessive API calls or calculations.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}