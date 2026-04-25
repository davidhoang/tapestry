import { useSimilarDesigners } from "@/hooks/use-designer";
import { Card, CardContent } from "@/components/ui/card";
import CompactDesignerCard from "./CompactDesignerCard";

interface SimilarDesignersProps {
  designerId: number;
}

export default function SimilarDesigners({ designerId }: SimilarDesignersProps) {
  const { data: similarDesigners, isLoading } = useSimilarDesigners(designerId);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <h2 className="text-3xl font-bold">Similar designers</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-80 animate-pulse">
              <Card className="h-full">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-full bg-muted flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!similarDesigners || similarDesigners.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 pb-12">
      <h2 className="text-3xl font-bold">Similar designers</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {similarDesigners.map((designer: any) => (
          <div key={designer.id} className="flex-shrink-0 w-80">
            <CompactDesignerCard designer={designer} />
          </div>
        ))}
      </div>
    </div>
  );
}
