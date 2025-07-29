import { useState, useEffect, useCallback } from 'react';
import { UseLocalStorageReturn } from '@types/wacc';

interface StorageOptions<T> {
  serializer?: {
    read: (value: string) => T;
    write: (value: T) => string;
  };
  validator?: (value: T) => boolean;
  defaultValue?: T;
}

const defaultSerializer = {
  read: (value: string) => {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  },
  write: (value: any) => JSON.stringify(value),
};

/**
 * Local Storage Hook
 * 
 * Provides persistent data storage with validation and fallback mechanisms.
 */
export function useLocalStorage<T>(
  key: string, 
  options: StorageOptions<T> = {}
): UseLocalStorageReturn<T> {
  const {
    serializer = defaultSerializer,
    validator,
    defaultValue = null,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  // Check localStorage support
  useEffect(() => {
    try {
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      setIsSupported(true);
    } catch {
      setIsSupported(false);
      console.warn('localStorage is not supported in this environment');
    }
  }, []);

  // Load initial data
  useEffect(() => {
    if (!isSupported) {
      setData(defaultValue);
      return;
    }

    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        const parsedItem = serializer.read(item);
        if (!validator || validator(parsedItem)) {
          setData(parsedItem);
        } else {
          setData(defaultValue);
        }
      } else {
        setData(defaultValue);
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      setData(defaultValue);
    }
  }, [key, isSupported, serializer, validator, defaultValue]);

  const saveData = useCallback((value: T): void => {
    if (!isSupported) {
      setData(value);
      return;
    }

    try {
      if (validator && !validator(value)) {
        throw new Error('Data validation failed');
      }

      const serializedValue = serializer.write(value);
      localStorage.setItem(key, serializedValue);
      setData(value);
    } catch (error) {
      console.error(`Error saving to localStorage key "${key}":`, error);
    }
  }, [key, isSupported, serializer, validator]);

  const restoreData = useCallback((): T | null => {
    if (!isSupported) return data;

    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        const parsedItem = serializer.read(item);
        if (!validator || validator(parsedItem)) {
          setData(parsedItem);
          return parsedItem;
        }
      }
      return null;
    } catch (error) {
      console.error(`Error restoring from localStorage key "${key}":`, error);
      return null;
    }
  }, [key, isSupported, serializer, validator, data]);

  const clearData = useCallback((): void => {
    if (!isSupported) {
      setData(defaultValue);
      return;
    }

    try {
      localStorage.removeItem(key);
      setData(defaultValue);
    } catch (error) {
      console.error(`Error clearing localStorage key "${key}":`, error);
    }
  }, [key, isSupported, defaultValue]);

  return {
    data,
    saveData,
    restoreData,
    clearData,
    isSupported,
  };
}