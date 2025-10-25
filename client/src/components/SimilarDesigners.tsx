import { useSimilarDesigners } from "@/hooks/use-designer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DesignerAvatar } from "./DesignerAvatar";
import { useParams, useLocation } from "wouter";
import { slugify } from "@/utils/slugify";

interface SimilarDesignersProps {
  designerId: number;
}

export default function SimilarDesigners({ designerId }: SimilarDesignersProps) {
  const { workspaceSlug } = useParams();
  const [, setLocation] = useLocation();
  const { data: similarDesigners, isLoading } = useSimilarDesigners(designerId);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <h2 className="text-3xl font-bold">Similar designers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {similarDesigners.map((designer: any) => (
          <Card
            key={designer.id}
            className="h-full cursor-pointer hover:shadow-lg transition-shadow group"
            onClick={() => setLocation(`/${workspaceSlug}/directory/${slugify(designer.name)}`)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <DesignerAvatar 
                    imageUrl={designer.photoUrl}
                    name={designer.name}
                    size="md"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base leading-tight truncate group-hover:text-primary transition-colors">
                    {designer.name}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {designer.level} {designer.title}
                  </p>
                  {designer.company && (
                    <p className="text-xs text-muted-foreground truncate">
                      {designer.company}
                    </p>
                  )}
                  {designer.location && (
                    <p className="text-xs text-muted-foreground truncate">
                      {designer.location}
                    </p>
                  )}
                  
                  {designer.similarityReasons && designer.similarityReasons.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {designer.similarityReasons.slice(0, 2).map((reason: string, index: number) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="text-xs px-2 py-0 h-5 bg-primary/5 text-primary border-primary/20"
                        >
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
