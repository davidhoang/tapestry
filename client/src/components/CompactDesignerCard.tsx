import { Card, CardContent } from "@/components/ui/card";
import { DesignerAvatar } from "./DesignerAvatar";
import { useParams, useLocation } from "wouter";
import { slugify } from "@/utils/slugify";
import { SelectDesigner } from "@db/schema";

interface CompactDesignerCardProps {
  designer: SelectDesigner;
}

export default function CompactDesignerCard({ designer }: CompactDesignerCardProps) {
  const { workspaceSlug } = useParams();
  const [, setLocation] = useLocation();

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow group"
      onClick={() => setLocation(`/${workspaceSlug}/directory/${slugify(designer.name)}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
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
            <p className="text-sm text-muted-foreground truncate">
              {designer.title}
            </p>
            {designer.company && (
              <p className="text-sm text-muted-foreground truncate">
                {designer.company}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
