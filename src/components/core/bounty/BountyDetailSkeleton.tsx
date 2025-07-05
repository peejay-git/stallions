export default function BountyDetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto min-h-screen py-12 px-4 sm:px-6">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-white/10 rounded w-1/2" />
        <div className="h-4 bg-white/10 rounded w-1/3" />
        <div className="h-40 bg-white/5 rounded" />
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-6 w-20 bg-white/10 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
