import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { WACCDataContextType, WACCInputData, ValidationError } from '@types/wacc';
import { getDefaultWACCInput } from '../utils/waccDefaults';

interface WACCDataState {
  inputData: WACCInputData;
  validationErrors: ValidationError[];
  isDirty: boolean;
  lastSyncedWithExcel: Date | null;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
}

type WACCDataAction = 
  | { type: 'SET_INPUT_DATA'; payload: WACCInputData }
  | { type: 'UPDATE_FIELD'; payload: { field: string; value: any } }
  | { type: 'SET_VALIDATION_ERRORS'; payload: ValidationError[] }
  | { type: 'SET_SYNC_STATUS'; payload: WACCDataState['syncStatus'] }
  | { type: 'MARK_SYNCED' }
  | { type: 'RESET_TO_DEFAULTS' };

const initialState: WACCDataState = {
  inputData: getDefaultWACCInput(),
  validationErrors: [],
  isDirty: false,
  lastSyncedWithExcel: null,
  syncStatus: 'idle',
};

function waccDataReducer(state: WACCDataState, action: WACCDataAction): WACCDataState {
  switch (action.type) {
    case 'SET_INPUT_DATA':
      return {
        ...state,
        inputData: action.payload,
        validationErrors: [], // Clear errors when setting new data
        isDirty: true,
      };

    case 'UPDATE_FIELD':
      const updatedData = { ...state.inputData };
      setNestedProperty(updatedData, action.payload.field, action.payload.value);
      
      return {
        ...state,
        inputData: updatedData,
        isDirty: true,
      };

    case 'SET_VALIDATION_ERRORS':
      return {
        ...state,
        validationErrors: action.payload,
      };

    case 'SET_SYNC_STATUS':
      return {
        ...state,
        syncStatus: action.payload,
      };

    case 'MARK_SYNCED':
      return {
        ...state,
        isDirty: false,
        lastSyncedWithExcel: new Date(),
        syncStatus: 'success',
      };

    case 'RESET_TO_DEFAULTS':
      return {
        ...initialState,
        inputData: getDefaultWACCInput(),
      };

    default:
      return state;
  }
}

const WACCDataContext = createContext<WACCDataContextType | null>(null);

interface WACCDataProviderProps {
  children: React.ReactNode;
  initialData?: WACCInputData;
  autoSyncWithExcel?: boolean;
}

/**
 * WACC Data Context Provider
 * 
 * Manages WACC input data state and validation.
 * Placeholder implementation for Excel integration.
 */
export const WACCDataProvider: React.FC<WACCDataProviderProps> = ({
  children,
  initialData,
  autoSyncWithExcel = false,
}) => {
  const [state, dispatch] = useReducer(waccDataReducer, {
    ...initialState,
    inputData: initialData || getDefaultWACCInput(),
  });

  const setInputData = useCallback((data: WACCInputData) => {
    dispatch({ type: 'SET_INPUT_DATA', payload: data });
  }, []);

  const updateField = useCallback((field: string, value: any) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { field, value } });
  }, []);

  const syncWithExcel = useCallback(async () => {
    dispatch({ type: 'SET_SYNC_STATUS', payload: 'syncing' });
    
    try {
      // Placeholder Excel sync logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      dispatch({ type: 'MARK_SYNCED' });
    } catch (error) {
      console.error('Excel sync failed:', error);
      dispatch({ type: 'SET_SYNC_STATUS', payload: 'error' });
    }
  }, []);

  const resetToDefaults = useCallback(() => {
    dispatch({ type: 'RESET_TO_DEFAULTS' });
  }, []);

  const contextValue: WACCDataContextType = {
    inputData: state.inputData,
    validationErrors: state.validationErrors,
    isDirty: state.isDirty,
    lastSyncedWithExcel: state.lastSyncedWithExcel,
    syncStatus: state.syncStatus,
    setInputData,
    updateField,
    syncWithExcel,
    resetToDefaults,
  };

  return (
    <WACCDataContext.Provider value={contextValue}>
      {children}
    </WACCDataContext.Provider>
  );
};

export const useWACCData = (): WACCDataContextType => {
  const context = useContext(WACCDataContext);
  if (!context) {
    throw new Error('useWACCData must be used within a WACCDataProvider');
  }
  return context;
};

// Helper function to set nested object properties
function setNestedProperty(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
}