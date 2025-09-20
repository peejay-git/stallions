import React from 'react';

interface AccessibleIconProps {
  icon: React.ReactElement;
  label: string;
  className?: string;
}

export default function AccessibleIcon({
  icon,
  label,
  className = '',
}: AccessibleIconProps) {
  return (
    <span
      role="img"
      aria-label={label}
      className={className}
    >
      {React.cloneElement(icon, {
        'aria-hidden': true,
        focusable: false,
      })}
    </span>
  );
}
