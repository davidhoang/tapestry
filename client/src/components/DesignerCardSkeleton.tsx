import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DesignerCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden">
      <div className="relative h-16 overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>
      
      <CardHeader className="space-y-1 pb-4">
        <div className="flex items-start gap-4 pt-4">
          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-14" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DesignerCardSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <DesignerCardSkeleton key={i} />
      ))}
    </div>
  );
}
