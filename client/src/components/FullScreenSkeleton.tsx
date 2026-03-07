import { Skeleton } from "@/components/ui/skeleton";

export default function FullScreenSkeleton() {
  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
      {/* Header Skeleton */}
      <div className="bg-background border-b border-border sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 lg:px-6 py-3 max-w-6xl mx-auto">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-10 h-10" data-testid="loading-spinner" />
            <Skeleton className="w-32 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <main className="pb-20 p-4 space-y-6">
        {/* Large Card Skeleton */}
        <div className="bg-card border rounded-lg p-6 space-y-4" data-testid="skeleton-card">
          <div className="space-y-2">
            <Skeleton className="w-40 h-6" />
            <Skeleton className="w-64 h-4" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="w-16 h-4" />
              <Skeleton className="w-20 h-6" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="w-16 h-4" />
              <Skeleton className="w-24 h-4" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="w-32 h-4" />
              <Skeleton className="w-16 h-4" />
            </div>
          </div>
        </div>

        {/* Two Column Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* First Card */}
          <div className="bg-card border rounded-lg p-6 space-y-4" data-testid="skeleton-card">
            <div className="space-y-2">
              <Skeleton className="w-24 h-6" />
              <Skeleton className="w-40 h-4" />
              <Skeleton className="w-20 h-8" />
            </div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="w-4 h-4" />
                  <Skeleton className="w-48 h-4" />
                </div>
              ))}
            </div>
          </div>

          {/* Second Card */}
          <div className="bg-card border rounded-lg p-6 space-y-4" data-testid="skeleton-card">
            <div className="space-y-2">
              <Skeleton className="w-24 h-6" />
              <Skeleton className="w-40 h-4" />
              <Skeleton className="w-20 h-8" />
            </div>
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="w-4 h-4" />
                  <Skeleton className="w-48 h-4" />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Skeleton className="w-full h-10" />
              <Skeleton className="w-full h-10" />
            </div>
          </div>
        </div>

        {/* Additional Card Skeleton */}
        <div className="bg-card border rounded-lg p-6 space-y-4" data-testid="skeleton-card">
          <div className="space-y-2">
            <Skeleton className="w-32 h-6" />
            <Skeleton className="w-56 h-4" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="w-24 h-4" />
              <Skeleton className="w-32 h-4" />
            </div>
            <Skeleton className="w-full h-px" />
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <Skeleton className="w-32 h-4" />
                <Skeleton className="w-48 h-3" />
              </div>
              <Skeleton className="w-20 h-8" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}