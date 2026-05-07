import { SkeletonStatCard, SkeletonCard, SkeletonHeading } from "@/components/skeletons";

export default function HomeLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <div className="skeleton h-10 w-72 mx-auto mb-4" />
        <div className="skeleton h-5 w-96 mx-auto" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
      <SkeletonHeading />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
