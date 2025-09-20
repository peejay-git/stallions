import Skeleton from '@/components/ui/Skeleton';

interface BountyCardSkeletonProps {
  className?: string;
  animation?: 'pulse' | 'wave';
}

export default function BountyCardSkeleton({ 
  className = '',
  animation = 'wave'
}: BountyCardSkeletonProps) {
  return (
    <div className={`card space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <Skeleton variant="text" width={80} height={24} animation={animation} />
        <Skeleton variant="text" width={96} height={24} animation={animation} />
      </div>
      <Skeleton variant="text" width="66%" height={20} animation={animation} />
      <Skeleton variant="text" width="100%" height={16} animation={animation} />
      <Skeleton variant="text" width="83%" height={16} animation={animation} />
      <div className="flex gap-2 mt-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="text"
            width={64}
            height={20}
            animation={animation}
            className="rounded-full"
          />
        ))}
      </div>
      <div className="flex justify-between items-center pt-4 border-t border-gray-600">
        <Skeleton variant="text" width={96} height={16} animation={animation} />
        <Skeleton variant="text" width={80} height={16} animation={animation} />
      </div>
    </div>
  );
}
