import { SkeletonStatCard, SkeletonHeading } from "@/components/skeletons";

export default function AdminLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <SkeletonHeading />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
      <div className="flex gap-4">
        <div className="skeleton h-10 w-44 rounded-xl" />
        <div className="skeleton h-10 w-36 rounded-xl" />
      </div>
    </div>
  );
}
