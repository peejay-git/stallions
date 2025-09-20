import { AnimatedButton } from './AnimatedContainer';
import { LoadingSpinner } from '.';

interface FormButtonProps {
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export default function FormButton({
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  onClick,
  children,
  className = '',
}: FormButtonProps) {
  // Base styles
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200';

  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  // Variant styles
  const variantStyles = {
    primary: `
      bg-blue-600 hover:bg-blue-700 text-white
      disabled:bg-blue-800/50 disabled:cursor-not-allowed
      focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-900
    `,
    secondary: `
      bg-white/10 hover:bg-white/20 text-white border border-white/20
      disabled:bg-white/5 disabled:cursor-not-allowed
      focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-gray-900
    `,
    danger: `
      bg-red-600 hover:bg-red-700 text-white
      disabled:bg-red-800/50 disabled:cursor-not-allowed
      focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-gray-900
    `,
    success: `
      bg-green-600 hover:bg-green-700 text-white
      disabled:bg-green-800/50 disabled:cursor-not-allowed
      focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 focus:ring-offset-gray-900
    `,
  };

  // Width styles
  const widthStyles = fullWidth ? 'w-full' : '';

  // Loading state
  const isDisabled = disabled || loading;

  return (
    <AnimatedButton
      onClick={!isDisabled ? onClick : undefined}
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${widthStyles}
        ${className}
        ${isDisabled ? 'opacity-70' : ''}
      `}
      disabled={isDisabled}
    >
      {loading ? (
        <>
          <LoadingSpinner size="small" className="mr-2" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className="mr-2">{icon}</span>
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <span className="ml-2">{icon}</span>
          )}
        </>
      )}
    </AnimatedButton>
  );
}
