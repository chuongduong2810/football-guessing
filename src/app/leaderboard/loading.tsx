export default function LeaderboardLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="skeleton h-7 w-7 rounded" />
        <div className="skeleton h-8 w-40" />
      </div>
      <div className="space-y-0">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[3rem_1fr_6rem] sm:grid-cols-[3rem_1fr_6rem_6rem_6rem] gap-4 px-4 py-4 border-b border-border-cream"
          >
            <div className="skeleton h-5 w-6" />
            <div className="skeleton h-5 w-28" />
            <div className="skeleton h-5 w-8 ml-auto" />
            <div className="hidden sm:block skeleton h-5 w-8 ml-auto" />
            <div className="hidden sm:block skeleton h-5 w-8 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
