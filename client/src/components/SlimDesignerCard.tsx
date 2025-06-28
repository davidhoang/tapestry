import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Star } from "lucide-react";

interface Designer {
  id: number;
  userId: number | null;
  workspaceId: number;
  name: string;
  title: string;
  location: string | null;
  company: string | null;
  level: string;
  website: string | null;
  linkedIn: string | null;
  email: string | null;
  photoUrl: string | null;
  skills: string[];
  available: boolean | null;
  description: string | null;
  notes: string | null;
  createdAt: Date | null;
}

interface MatchRecommendation {
  designerId: number;
  matchScore: number;
  reasoning: string;
  matchedSkills: string[];
  concerns?: string;
  designer: Designer;
}

interface SlimDesignerCardProps {
  match: MatchRecommendation;
  isSelected?: boolean;
  onSelectionChange?: (selected: boolean) => void;
  showSelection?: boolean;
}

export default function SlimDesignerCard({ 
  match, 
  isSelected = false, 
  onSelectionChange, 
  showSelection = false 
}: SlimDesignerCardProps) {
  const { designer, matchScore, reasoning, matchedSkills, concerns } = match;

  return (
    <div className="flex items-center gap-4 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
      {/* Selection Checkbox */}
      {showSelection && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelectionChange}
          className="flex-shrink-0"
        />
      )}

      {/* Photo */}
      <div className="flex-shrink-0">
        {designer.photoUrl ? (
          <img
            src={designer.photoUrl}
            alt={designer.name}
            className="w-12 h-12 rounded-full object-cover border"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border">
            <span className="text-lg font-medium text-muted-foreground">
              {designer.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium font-serif truncate">{designer.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{designer.title}</p>
            {designer.company && (
              <p className="text-xs text-muted-foreground truncate">{designer.company}</p>
            )}
          </div>
          
          {/* Match Score */}
          <div className="flex-shrink-0 flex items-center gap-1">
            <Star className="h-3 w-3 fill-primary text-primary" />
            <span className="text-sm font-medium">{Math.round(matchScore * 100)}%</span>
          </div>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1 mt-2">
          {matchedSkills.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="secondary" className="text-xs px-1.5 py-0.5 h-auto">
              {skill}
            </Badge>
          ))}
          {matchedSkills.length > 3 && (
            <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-auto">
              +{matchedSkills.length - 3}
            </Badge>
          )}
        </div>

        {/* Reasoning - truncated */}
        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
          {reasoning}
        </p>

        {/* Concerns if any */}
        {concerns && (
          <p className="text-xs text-amber-600 mt-1 line-clamp-1">
            ⚠️ {concerns}
          </p>
        )}
      </div>
    </div>
  );
}