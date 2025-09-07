import React, { useState, useRef, FormEvent } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { useFormAnnounce } from './LiveRegion';
import { ariaUtils } from '../../utils/a11y';

interface FormFieldProps {
  id?: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  disabled?: boolean;
  autoComplete?: string;
}

/**
 * Accessible form field component with proper ARIA labels and error announcements
 */
export const AccessibleFormField: React.FC<FormFieldProps> = ({
  id: providedId,
  label,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
  helpText,
  disabled = false,
  autoComplete
}) => {
  const { announceValidation } = useFormAnnounce();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Generate unique IDs for ARIA relationships
  const fieldId = providedId || ariaUtils.generateId('field');
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Announce validation state changes
    if (error) {
      announceValidation(label, error);
    }
  };

  const handleBlur = () => {
    // Announce successful validation on blur if no error
    if (!error && value.trim()) {
      announceValidation(label);
    }
  };

  return (
    <div className="space-y-1">
      <label
        htmlFor={fieldId}
        className={`block text-sm font-medium ${
          error 
            ? 'text-red-700 dark:text-red-400' 
            : 'text-gray-700 dark:text-gray-300'
        }`}
      >
        {label}
        {required && (
          <span 
            className="text-red-500 ml-1" 
            aria-label="requerido"
          >
            *
          </span>
        )}
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          id={fieldId}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors ${
            error
              ? 'border-red-500 dark:border-red-400 focus:ring-red-500 bg-red-50 dark:bg-red-900/10'
              : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800'
          } ${
            disabled
              ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-60'
              : ''
          }`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={`${error ? errorId + ' ' : ''}${helpText ? helpId : ''}`.trim() || undefined}
        />
        
        {/* Visual validation indicator */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          {error ? (
            <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
          ) : value.trim() && !disabled ? (
            <Check className="h-5 w-5 text-green-500" aria-hidden="true" />
          ) : null}
        </div>
      </div>

      {/* Help text */}
      {helpText && (
        <p id={helpId} className="text-xs text-gray-600 dark:text-gray-400">
          {helpText}
        </p>
      )}

      {/* Error message */}
      {error && (
        <div
          id={errorId}
          className="flex items-start space-x-1 text-sm text-red-700 dark:text-red-400"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

interface AccessibleFormProps {
  onSubmit: (e: FormEvent) => void;
  children: React.ReactNode;
  className?: string;
  isSubmitting?: boolean;
  submitLabel?: string;
  submitDisabled?: boolean;
  title?: string;
  description?: string;
}

/**
 * Accessible form wrapper with proper form semantics and submission handling
 */
export const AccessibleForm: React.FC<AccessibleFormProps> = ({
  onSubmit,
  children,
  className = '',
  isSubmitting = false,
  submitLabel = 'Enviar',
  submitDisabled = false,
  title,
  description
}) => {
  const { announceFormSubmission, LiveRegionComponent } = useFormAnnounce();
  const formRef = useRef<HTMLFormElement>(null);
  const titleId = title ? ariaUtils.generateId('form-title') : undefined;
  const descId = description ? ariaUtils.generateId('form-desc') : undefined;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    announceFormSubmission(true);
    onSubmit(e);
  };

  return (
    <>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className={`space-y-6 ${className}`}
        noValidate
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        {title && (
          <h2 id={titleId} className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
        )}
        
        {description && (
          <p id={descId} className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        )}

        {children}

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting || submitDisabled}
            className={`w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
              isSubmitting || submitDisabled
                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            }`}
            aria-describedby="submit-status"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Enviando...
              </>
            ) : (
              submitLabel
            )}
          </button>
          
          <div id="submit-status" className="sr-only">
            {isSubmitting ? 'Enviando formulario, por favor espere' : ''}
          </div>
        </div>
      </form>
      
      <LiveRegionComponent />
    </>
  );
};

/**
 * Hook for form validation with accessibility announcements
 */
export const useAccessibleForm = <T extends Record<string, any>>(
  initialValues: T,
  validationRules: Partial<Record<keyof T, (value: any) => string | undefined>>
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const { announceValidation } = useFormAnnounce();

  const setValue = (field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const setFieldTouched = (field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const validateField = (field: keyof T): string | undefined => {
    const rule = validationRules[field];
    const error = rule ? rule(values[field]) : undefined;
    
    setErrors(prev => ({ ...prev, [field]: error }));
    
    if (touched[field]) {
      announceValidation(String(field), error);
    }
    
    return error;
  };

  const validateAll = (): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let hasErrors = false;

    Object.keys(validationRules).forEach(field => {
      const fieldKey = field as keyof T;
      const rule = validationRules[fieldKey];
      const error = rule ? rule(values[fieldKey]) : undefined;
      
      if (error) {
        newErrors[fieldKey] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    setTouched(Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    
    return !hasErrors;
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validateField,
    validateAll,
    reset,
    isValid: Object.keys(errors).length === 0
  };
};