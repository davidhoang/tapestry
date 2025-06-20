import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SelectDesigner } from "@db/schema";
import { Pencil, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

interface DesignerCardProps {
  designer: SelectDesigner;
  onEdit?: (designer: SelectDesigner) => void;
  onAdd?: (designer: SelectDesigner) => void;
  onSkillClick?: (skill: string) => void;
  onEnrich?: (designer: SelectDesigner) => void;
  showCheckbox?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: number) => void;
}

export default function DesignerCard({ 
  designer, 
  onEdit, 
  onAdd, 
  onSkillClick, 
  onEnrich, 
  showCheckbox = false, 
  isSelected = false, 
  onToggleSelect 
}: DesignerCardProps) {
  const [, setLocation] = useLocation();
  const [isSkillsExpanded, setIsSkillsExpanded] = useState(false);
  
  // Check if skills overflow one line (roughly 3-4 skills depending on length)
  const shouldShowExpansion = designer.skills.length > 3;
  const displayedSkills = isSkillsExpanded ? designer.skills : designer.skills.slice(0, 3);

  return (
    <>
      <Card 
        className="h-full relative cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setLocation(`/designer/${designer.id}`)}
      >
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-start gap-4 pt-4">
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
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {displayedSkills.map((skill, i) => (
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
                {shouldShowExpansion && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSkillsExpanded(!isSkillsExpanded);
                    }}
                  >
                    {isSkillsExpanded ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        +{designer.skills.length - 3} more
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
            {designer.available && (
              <div className="pt-2">
                <Badge variant="secondary">Open to Roles</Badge>
              </div>
            )}
          </div>
        </CardContent>
        
        {/* Bottom section with controls */}
        <div className="px-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showCheckbox && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleSelect?.(designer.id);
                }}
                className="w-4 h-4 text-primary bg-background border-2 border-muted-foreground rounded focus:ring-primary focus:ring-2"
              />
            )}
          </div>
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(designer);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </>
  );
}