interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  fullScreen?: boolean;
  text?: string;
  variant?: 'default' | 'gradient' | 'pulse';
  theme?: 'light' | 'dark';
}

export default function LoadingSpinner({
  size = 'medium',
  className = '',
  fullScreen = false,
  text,
  variant = 'default',
  theme = 'dark',
}: LoadingSpinnerProps) {
  // Determine spinner size
  const sizeClass = {
    small: 'h-4 w-4 border-2',
    medium: 'h-8 w-8 border-3',
    large: 'h-12 w-12 border-4',
  };

  // Variant styles
  const variantStyles = {
    default: 'border-t-transparent border-stellar-blue animate-spin',
    gradient: `
      border-t-transparent
      border-l-stellar-blue/80
      border-r-stellar-blue/40
      border-b-stellar-blue/20
      animate-spin
    `,
    pulse: `
      border-stellar-blue/80
      animate-[pulse_1.5s_cubic-bezier(0.4,0,0.6,1)_infinite]
      shadow-[0_0_15px_rgba(0,122,255,0.4)]
    `,
  };

  // Theme styles
  const themeStyles = {
    light: 'bg-white/80',
    dark: 'bg-black/80',
  };

  // Text styles
  const textStyles = {
    light: 'text-gray-600',
    dark: 'text-gray-300',
  };

  // Base spinner classes
  const spinnerClasses = `
    inline-block rounded-full
    ${variantStyles[variant]}
    ${sizeClass[size]}
    ${className}
  `;

  // Render a full-screen spinner if requested
  if (fullScreen) {
    return (
      <div className={`fixed inset-0 flex flex-col items-center justify-center ${themeStyles[theme]} backdrop-blur-sm z-50`}>
        <div className={spinnerClasses}></div>
        {text && (
          <p className={`mt-4 font-medium ${textStyles[theme]} animate-fade-in`}>
            {text}
          </p>
        )}
      </div>
    );
  }

  // Otherwise, render an inline spinner
  return (
    <div className="flex flex-col items-center justify-center">
      <div className={spinnerClasses}></div>
      {text && (
        <p className={`mt-2 text-sm font-medium ${textStyles[theme]} animate-fade-in`}>
          {text}
        </p>
      )}
    </div>
  );
}