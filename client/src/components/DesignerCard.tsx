import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SelectDesigner } from "@db/schema";
import { Pencil, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { getDesignerCoverImage } from "@/utils/coverImages";
import { slugify } from "@/utils/slugify";

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
        className="h-full relative cursor-pointer hover:shadow-md transition-shadow group overflow-hidden"
        onClick={() => setLocation(`/designer/${slugify(designer.name)}`)}
      >
        {/* Cover Image */}
        <div className="relative h-16 overflow-hidden">
          <img 
            src={getDesignerCoverImage(designer.id)} 
            alt="Cover"
            className="w-full h-full object-cover transition-transform duration-[3000ms] ease-out group-hover:scale-110"
            style={{ transitionDuration: '3s' }}
          />
          <div 
            className="absolute inset-0 bg-black/20 transition-opacity duration-[3000ms] ease-out group-hover:bg-black/30" 
            style={{ transitionDuration: '3s' }}
          />
          
          {/* Top-left checkbox */}
          {showCheckbox && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onToggleSelect?.(designer.id);
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="absolute top-3 left-3 z-10 w-4 h-4 text-primary bg-white border-2 border-gray-300 rounded focus:ring-primary focus:ring-2 cursor-pointer shadow-sm"
            />
          )}
          
          {/* Top-right edit button - only visible on hover */}
          {onEdit && (
            <button
              className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20 rounded-md backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(designer);
              }}
            >
              <Pencil className="h-4 w-4 text-white" />
            </button>
          )}
          
          {/* Open to Roles badge - positioned below cover image */}
          {designer.available && (
            <div className="absolute -bottom-2 right-3 z-10">
              <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200 shadow-sm">
                Open to Roles
              </Badge>
            </div>
          )}
        </div>
        
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-start gap-4 pt-4">
            <Avatar className="h-16 w-16 overflow-hidden">
              <AvatarImage 
                src={designer.photoUrl || undefined} 
                alt={designer.name}
                className="transition-transform duration-[3000ms] ease-out group-hover:scale-110"
                style={{ transitionDuration: '3s' }}
              />
              <AvatarFallback className="text-lg font-medium">
                {designer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <h3 className="text-lg designer-name truncate">{designer.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {designer.title}{designer.company ? ` at ${designer.company}` : ''}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">{designer.location}</p>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {displayedSkills.map((skill, i) => (
                  <span 
                    key={i} 
                    className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSkillClick?.(skill);
                    }}
                  >
                    #{skill}
                  </span>
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

          </div>
        </CardContent>
      </Card>
    </>
  );
}