export function SkeletonCard() {
  return (
    <div className="bg-ivory border border-border-cream rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-5 w-14 rounded-full" />
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col items-center gap-2 w-24">
          <div className="skeleton h-10 w-10 rounded-full" />
          <div className="skeleton h-3 w-16" />
        </div>
        <div className="skeleton h-5 w-6" />
        <div className="flex flex-col items-center gap-2 w-24">
          <div className="skeleton h-10 w-10 rounded-full" />
          <div className="skeleton h-3 w-16" />
        </div>
      </div>
      <div className="skeleton h-3 w-32 mt-2" />
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="bg-ivory border border-border-cream rounded-2xl p-6 flex items-center gap-4">
      <div className="skeleton h-11 w-11 rounded-xl" />
      <div className="space-y-2">
        <div className="skeleton h-6 w-12" />
        <div className="skeleton h-3 w-20" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="bg-ivory border border-border-cream rounded-xl p-4 flex items-center justify-between">
      <div className="space-y-2 flex-1">
        <div className="skeleton h-4 w-48" />
        <div className="skeleton h-3 w-24" />
      </div>
      <div className="flex items-center gap-4">
        <div className="skeleton h-4 w-16" />
        <div className="skeleton h-4 w-12" />
      </div>
    </div>
  );
}

export function SkeletonText({ width = "w-32" }: { width?: string }) {
  return <div className={`skeleton h-4 ${width}`} />;
}

export function SkeletonHeading() {
  return <div className="skeleton h-8 w-56 mb-8" />;
}
