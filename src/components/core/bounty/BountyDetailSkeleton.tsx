import Skeleton from '@/components/ui/Skeleton';

interface BountyDetailSkeletonProps {
  className?: string;
  animation?: 'pulse' | 'wave';
}

export default function BountyDetailSkeleton({
  className = '',
  animation = 'wave'
}: BountyDetailSkeletonProps) {
  return (
    <div className={`max-w-5xl mx-auto min-h-screen py-12 px-4 sm:px-6 ${className}`}>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="space-y-6">
          <Skeleton variant="text" width="50%" height={32} animation={animation} />
          <div className="flex items-center space-x-4">
            <Skeleton variant="circular" width={40} height={40} animation={animation} />
            <Skeleton variant="text" width="30%" height={16} animation={animation} />
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <Skeleton variant="rectangular" height={160} animation={animation} className="rounded-xl" />
          <div className="space-y-4">
            <Skeleton variant="text" width="90%" height={16} animation={animation} />
            <Skeleton variant="text" width="85%" height={16} animation={animation} />
            <Skeleton variant="text" width="80%" height={16} animation={animation} />
          </div>
        </div>

        {/* Tags Section */}
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="text"
              width={80}
              height={24}
              animation={animation}
              className="rounded-full"
            />
          ))}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 border border-white/10 rounded-lg space-y-2">
              <Skeleton variant="text" width="60%" height={16} animation={animation} />
              <Skeleton variant="text" width="40%" height={24} animation={animation} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
