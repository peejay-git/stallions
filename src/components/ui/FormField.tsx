import AnimatedContainer from './AnimatedContainer';
import { useEffect, useState } from 'react';
import { FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: () => void;
  error?: string;
  success?: string;
  info?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  autoComplete?: string;
  min?: number;
  max?: number;
  pattern?: string;
  icon?: React.ReactNode;
  rows?: number;
}

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  success,
  info,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  autoComplete,
  min,
  max,
  pattern,
  icon,
  rows = 3,
}: FormFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    // Show feedback when field becomes dirty and has a message
    if (isDirty && (error || success || info)) {
      setShowFeedback(true);
    }
  }, [isDirty, error, success, info]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setIsDirty(true);
    onBlur?.();
  };

  const getBorderColor = () => {
    if (disabled) return 'border-gray-700';
    if (error) return 'border-red-500';
    if (success) return 'border-green-500';
    if (isFocused) return 'border-blue-500';
    return 'border-white/20';
  };

  const getBackgroundColor = () => {
    if (disabled) return 'bg-gray-800';
    if (error) return 'bg-red-900/10';
    if (success) return 'bg-green-900/10';
    return 'bg-white/10';
  };

  const getFeedbackIcon = () => {
    if (error) return <FiAlertCircle className="text-red-500" />;
    if (success) return <FiCheckCircle className="text-green-500" />;
    if (info) return <FiInfo className="text-blue-500" />;
    return null;
  };

  const getFeedbackText = () => {
    if (error) return error;
    if (success) return success;
    if (info) return info;
    return null;
  };

  const getFeedbackColor = () => {
    if (error) return 'text-red-500';
    if (success) return 'text-green-500';
    if (info) return 'text-blue-500';
    return '';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-200"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}

        {type === 'textarea' ? (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            rows={rows}
            className={`
              w-full rounded-lg
              ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2
              ${getBackgroundColor()}
              ${getBorderColor()}
              border backdrop-blur-xl
              text-white placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500/20
              disabled:cursor-not-allowed disabled:opacity-50
              transition-all duration-200
            `}
          />
        ) : (
          <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            autoComplete={autoComplete}
            min={min}
            max={max}
            pattern={pattern}
            className={`
              w-full rounded-lg
              ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2
              ${getBackgroundColor()}
              ${getBorderColor()}
              border backdrop-blur-xl
              text-white placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500/20
              disabled:cursor-not-allowed disabled:opacity-50
              transition-all duration-200
            `}
          />
        )}

        {/* Feedback message */}
        {showFeedback && getFeedbackText() && (
          <AnimatedContainer
            animation="fadeIn"
            className="absolute -bottom-6 left-0 flex items-center gap-1.5"
          >
            {getFeedbackIcon()}
            <span className={`text-xs ${getFeedbackColor()}`}>
              {getFeedbackText()}
            </span>
          </AnimatedContainer>
        )}
      </div>
    </div>
  );
}
