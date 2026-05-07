import { SkeletonStatCard, SkeletonRow, SkeletonHeading } from "@/components/skeletons";

export default function DashboardLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <SkeletonHeading />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
      <div className="skeleton h-6 w-24 mb-4" />
      <div className="space-y-3">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    </div>
  );
}
