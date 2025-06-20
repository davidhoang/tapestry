import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SelectDesigner } from "@db/schema";
import { Pencil, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

interface DesignerCardProps {
  designer: SelectDesigner;
  onEdit?: (designer: SelectDesigner) => void;
  onAdd?: (designer: SelectDesigner) => void;
  onSkillClick?: (skill: string) => void;
  onEnrich?: (designer: SelectDesigner) => void;
}

export default function DesignerCard({ designer, onEdit, onAdd, onSkillClick, onEnrich }: DesignerCardProps) {
  const [, setLocation] = useLocation();

  return (
    <>
      <Card 
        className="h-full relative cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setLocation(`/designer/${designer.id}`)}
      >
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-start gap-4 pt-4 pr-12">
            <Avatar className="h-16 w-16">
              <AvatarImage src={designer.photoUrl || undefined} alt={designer.name} />
              <AvatarFallback className="text-lg font-medium">
                {designer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <h3 className="text-lg designer-name truncate">{designer.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{designer.title}</p>
                </div>
              </div>
            </div>
          </div>
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(designer);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-muted-foreground">{designer.level}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{designer.company}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{designer.location}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {designer.skills.map((skill, i) => (
                <Badge 
                  key={i} 
                  variant="outline" 
                  className="cursor-pointer hover:bg-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSkillClick?.(skill);
                  }}
                >
                  {skill}
                </Badge>
              ))}
            </div>
            {designer.available && (
              <div className="pt-2">
                <Badge variant="secondary">Open to Roles</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}