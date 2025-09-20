import { BountyStatus } from '@/types/bounty';
import { cn } from '@/utils/cn';

interface StatusBadgeProps {
  status: BountyStatus;
  isExpired?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig = {
  [BountyStatus.OPEN]: {
    baseStyle: 'bg-green-900/40 text-green-300 border-green-700/30',
    label: 'OPEN',
  },
  [BountyStatus.IN_PROGRESS]: {
    baseStyle: 'bg-blue-900/40 text-blue-300 border-blue-700/30',
    label: 'IN PROGRESS',
  },
  [BountyStatus.REVIEW]: {
    baseStyle: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/30',
    label: 'IN REVIEW',
  },
  [BountyStatus.COMPLETED]: {
    baseStyle: 'bg-gray-700/40 text-gray-300 border-gray-600/30',
    label: 'COMPLETED',
  },
  [BountyStatus.CANCELLED]: {
    baseStyle: 'bg-red-900/40 text-red-300 border-red-700/30',
    label: 'CANCELLED',
  },
} as const;

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export default function StatusBadge({
  status,
  isExpired = false,
  size = 'sm',
  className,
}: StatusBadgeProps) {
  // If expired or already completed, show completed status
  const displayStatus = isExpired || status === BountyStatus.COMPLETED
    ? BountyStatus.COMPLETED
    : status;

  const config = statusConfig[displayStatus];

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-full border transition-colors',
        config.baseStyle,
        sizeStyles[size],
        className
      )}
    >
      {config.label}
    </span>
  );
}

// Helper function to determine if a bounty should be marked as expired
export function shouldShowAsExpired(deadline: string | Date): boolean {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  return now > deadlineDate;
}

// Helper function to get the effective status considering expiration
export function getEffectiveStatus(status: BountyStatus, deadline: string | Date): BountyStatus {
  if (shouldShowAsExpired(deadline) || status === BountyStatus.COMPLETED) {
    return BountyStatus.COMPLETED;
  }
  return status;
}
