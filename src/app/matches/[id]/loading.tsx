export default function MatchDetailLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="skeleton h-4 w-28 mb-8" />
      <div className="bg-ivory border border-border-cream rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-5 w-14 rounded-full" />
        </div>
        <div className="flex items-center justify-center gap-16 mb-8">
          <div className="flex flex-col items-center gap-3">
            <div className="skeleton h-16 w-16 rounded-full" />
            <div className="skeleton h-4 w-20" />
          </div>
          <div className="skeleton h-8 w-8" />
          <div className="flex flex-col items-center gap-3">
            <div className="skeleton h-16 w-16 rounded-full" />
            <div className="skeleton h-4 w-20" />
          </div>
        </div>
        <div className="flex justify-center gap-6 mb-8">
          <div className="skeleton h-4 w-40" />
          <div className="skeleton h-4 w-24" />
        </div>
        <div className="border-t border-border-cream pt-8">
          <div className="skeleton h-5 w-40 mx-auto mb-6" />
          <div className="flex justify-center gap-4">
            <div className="skeleton h-11 w-20 rounded-xl" />
            <div className="skeleton h-5 w-4 self-center" />
            <div className="skeleton h-11 w-20 rounded-xl" />
          </div>
          <div className="skeleton h-10 w-40 rounded-xl mx-auto mt-6" />
        </div>
      </div>
    </div>
  );
}
