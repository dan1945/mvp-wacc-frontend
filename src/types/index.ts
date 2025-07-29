/**
 * Main type exports for the WACC Calculator application
 */

// Re-export all WACC-specific types
export * from './wacc';

// Global application types
export interface AppTheme {
  mode: 'light' | 'dark' | 'colorful';
  primaryColor: string;
  secondaryColor: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

// Office Add-in specific types
export interface OfficeContext {
  platform: string;
  host: string;
  requirements: any;
  touchEnabled: boolean;
  commerceAllowed: boolean;
}

export interface OfficeThemeInfo {
  bodyBackgroundColor: string;
  bodyForegroundColor: string;
  controlBackgroundColor: string;
  controlForegroundColor: string;
}

// Storage and persistence types
export interface StorageOptions<T> {
  serializer?: {
    read: (value: string) => T;
    write: (value: T) => string;
  };
  validator?: (value: T) => boolean;
  defaultValue?: T;
}

// Animation and UI types
export type AnimationDirection = 'left' | 'right' | 'up' | 'down';
export type AnimationDuration = 'fast' | 'normal' | 'slow';

export interface AnimationConfig {
  direction: AnimationDirection;
  duration: AnimationDuration;
  easing?: string;
}

// Utility types for better type safety
export type NonEmptyArray<T> = [T, ...T[]];
export type RequiredNonNull<T> = { [P in keyof T]-?: NonNullable<T[P]> };
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Event handler types
export type InputChangeHandler<T = string> = (value: T) => void;
export type AsyncHandler<T = void> = () => Promise<T>;
export type ErrorHandler = (error: Error) => void;

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

// Performance monitoring types
export interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
  entryType: string;
}

export interface PerformanceMarker {
  mark: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Accessibility types
export type AriaRole = 
  | 'alert'
  | 'alertdialog'
  | 'application'
  | 'article'
  | 'banner'
  | 'button'
  | 'cell'
  | 'checkbox'
  | 'columnheader'
  | 'combobox'
  | 'complementary'
  | 'contentinfo'
  | 'dialog'
  | 'document'
  | 'feed'
  | 'figure'
  | 'form'
  | 'grid'
  | 'gridcell'
  | 'group'
  | 'heading'
  | 'img'
  | 'link'
  | 'list'
  | 'listbox'
  | 'listitem'
  | 'main'
  | 'navigation'
  | 'option'
  | 'presentation'
  | 'progressbar'
  | 'radio'
  | 'radiogroup'
  | 'region'
  | 'row'
  | 'rowgroup'
  | 'rowheader'
  | 'search'
  | 'separator'
  | 'slider'
  | 'spinbutton'
  | 'status'
  | 'switch'
  | 'tab'
  | 'table'
  | 'tablist'
  | 'tabpanel'
  | 'textbox'
  | 'timer'
  | 'toolbar'
  | 'tooltip'
  | 'tree'
  | 'treegrid'
  | 'treeitem';

export type AriaLive = 'off' | 'polite' | 'assertive';

export interface AccessibilityAttributes {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-live'?: AriaLive;
  'aria-atomic'?: boolean;
  'aria-relevant'?: string;
  'aria-busy'?: boolean;
  'aria-disabled'?: boolean;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  'aria-invalid'?: boolean | 'false' | 'true' | 'grammar' | 'spelling';
  'aria-pressed'?: boolean;
  'aria-readonly'?: boolean;
  'aria-required'?: boolean;
  'aria-selected'?: boolean;
  role?: AriaRole;
  tabIndex?: number;
}

// Component base props
export interface BaseComponentProps extends AccessibilityAttributes {
  className?: string;
  id?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

// Form-related types
export interface FormFieldProps extends BaseComponentProps {
  label: string;
  name: string;
  value: string | number;
  onChange: InputChangeHandler;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings?: Record<string, string>;
}

// Data grid/table types
export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex: keyof T;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  selectable?: boolean;
  onRowClick?: (record: T, index: number) => void;
  onSelectionChange?: (selectedRows: T[]) => void;
}

// Wizard/stepper types
export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  component: React.ComponentType<any>;
  isValid?: (data: any) => boolean;
  requiredFields?: string[];
  optional?: boolean;
}

export interface WizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete: () => void;
  allowSkip?: boolean;
  showProgress?: boolean;
}

// Card/panel types
export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  loading?: boolean;
  elevated?: boolean;
  size?: 'small' | 'medium' | 'large';
}

// Button types
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'subtle' | 'transparent';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends BaseComponentProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
}

// Modal/dialog types
export interface ModalProps extends BaseComponentProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  centered?: boolean;
  closable?: boolean;
  maskClosable?: boolean;
  footer?: React.ReactNode;
}

// Toast/notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationProps {
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  closable?: boolean;
  onClose?: () => void;
}

// Progress indicator types
export interface ProgressProps extends BaseComponentProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  animated?: boolean;
}

// File upload types
export interface FileUploadProps extends BaseComponentProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  onFileSelect: (files: File[]) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  dragAndDrop?: boolean;
}