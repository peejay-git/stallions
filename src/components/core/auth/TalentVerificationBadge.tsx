import { VerificationLevel } from '@/types/reputation';
import { AnimatedContainer } from '@/components/ui/AnimatedContainer';
import { FiCheck, FiStar, FiAward, FiAlertCircle } from 'react-icons/fi';

interface TalentVerificationBadgeProps {
  level: VerificationLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const verificationConfig = {
  [VerificationLevel.UNVERIFIED]: {
    icon: FiAlertCircle,
    label: 'Unverified',
    baseStyle: 'bg-gray-900/40 text-gray-300 border-gray-700/30',
  },
  [VerificationLevel.BASIC]: {
    icon: FiCheck,
    label: 'Basic',
    baseStyle: 'bg-green-900/40 text-green-300 border-green-700/30',
  },
  [VerificationLevel.VERIFIED]: {
    icon: FiStar,
    label: 'Verified',
    baseStyle: 'bg-blue-900/40 text-blue-300 border-blue-700/30',
  },
  [VerificationLevel.EXPERT]: {
    icon: FiAward,
    label: 'Expert',
    baseStyle: 'bg-purple-900/40 text-purple-300 border-purple-700/30',
  },
};

const sizeStyles = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-2.5 py-1 gap-1.5',
  lg: 'text-base px-3 py-1.5 gap-2',
};

export default function TalentVerificationBadge({
  level,
  showLabel = true,
  size = 'sm',
  className = '',
}: TalentVerificationBadgeProps) {
  const config = verificationConfig[level];
  const Icon = config.icon;

  return (
    <AnimatedContainer
      animation="fadeIn"
      className={`
        inline-flex items-center rounded-full border
        ${config.baseStyle}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} />
      {showLabel && <span>{config.label}</span>}
    </AnimatedContainer>
  );
}

interface TalentBadgeListProps {
  badges: Array<{
    id: string;
    name: string;
    imageUrl: string;
  }>;
  className?: string;
}

export function TalentBadgeList({ badges, className = '' }: TalentBadgeListProps) {
  if (!badges.length) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {badges.map((badge) => (
        <div
          key={badge.id}
          className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1"
        >
          <img
            src={badge.imageUrl}
            alt={badge.name}
            className="w-4 h-4 rounded-full"
          />
          <span className="text-sm text-white">{badge.name}</span>
        </div>
      ))}
    </div>
  );
}
