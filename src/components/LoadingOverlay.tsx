import React from 'react';
import {
  Text,
  Button,
  Spinner,
  tokens
} from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';

interface LoadingOverlayProps {
  message?: string;
  onCancel?: () => void;
  showCancel?: boolean;
  progress?: number;
}

/**
 * Loading Overlay Component
 * 
 * Features:
 * - Full-screen overlay with backdrop
 * - Accessible loading indicator
 * - Optional cancel functionality
 * - Progress indication support
 * - Focus management for accessibility
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Loading...',
  onCancel,
  showCancel = true,
  progress
}) => {
  // Handle escape key to cancel
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && onCancel) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  // Trap focus within the overlay
  React.useEffect(() => {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.focus();
    }
  }, []);

  return (
    <div
      id="loading-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-title"
      aria-describedby="loading-description"
      tabIndex={-1}
    >
      <div 
        className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4 text-center"
        role="status"
        aria-live="polite"
      >
        {/* Loading Spinner */}
        <div className="mb-4">
          <Spinner 
            size="large"
            aria-label="Loading in progress"
          />
        </div>

        {/* Loading Message */}
        <Text 
          variant="large" 
          weight="semibold"
          id="loading-title"
          className="block mb-2 text-gray-800"
        >
          {message}
        </Text>

        {/* Progress Bar (if progress is provided) */}
        {typeof progress === 'number' && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-office-blue h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progress: ${Math.round(progress)}%`}
              />
            </div>
            <Text 
              variant="small" 
              color="secondary"
              className="mt-1"
            >
              {Math.round(progress)}% complete
            </Text>
          </div>
        )}

        {/* Additional Description */}
        <Text 
          variant="medium" 
          color="secondary"
          id="loading-description"
          className="block mb-4"
        >
          Please wait while we process your request...
        </Text>

        {/* Cancel Button */}
        {showCancel && onCancel && (
          <Button
            appearance="secondary"
            icon={<Dismiss24Regular />}
            onClick={onCancel}
            aria-label="Cancel the current operation"
            className="focus-visible-office"
          >
            Cancel
          </Button>
        )}

        {/* Screen reader instructions */}
        <div className="sr-only" aria-live="polite">
          Loading operation in progress. {showCancel ? 'Press Escape or click Cancel to abort.' : ''}
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;