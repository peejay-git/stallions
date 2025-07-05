interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  fullScreen?: boolean;
  text?: string;
}

export default function LoadingSpinner({
  size = 'medium',
  className = '',
  fullScreen = false,
  text,
}: LoadingSpinnerProps) {
  // Determine spinner size
  const sizeClass = {
    small: 'h-4 w-4 border-2',
    medium: 'h-8 w-8 border-3',
    large: 'h-12 w-12 border-4',
  };

  // Base spinner classes
  const spinnerClasses = `
    inline-block rounded-full
    border-t-transparent
    border-stellar-blue
    animate-spin
    ${sizeClass[size]}
    ${className}
  `;

  // Render a full-screen spinner if requested
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white bg-opacity-80 z-50">
        <div className={spinnerClasses}></div>
        {text && <p className="mt-4 text-gray-600">{text}</p>}
      </div>
    );
  }

  // Otherwise, render an inline spinner
  return (
    <div className="flex flex-col items-center justify-center">
      <div className={spinnerClasses}></div>
      {text && <p className="mt-2 text-sm text-gray-600">{text}</p>}
    </div>
  );
}
