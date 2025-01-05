import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SelectDesigner } from "@db/schema";
import { Globe, Linkedin, Mail } from "lucide-react";

interface DesignerCardProps {
  designer: SelectDesigner;
  onAdd?: (designer: SelectDesigner) => void;
}

export default function DesignerCard({ designer, onAdd }: DesignerCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="space-y-1">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{designer.name}</h3>
            <p className="text-sm text-muted-foreground">{designer.title}</p>
          </div>
          {designer.available && (
            <Badge variant="secondary">Available</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-muted-foreground">{designer.company}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{designer.location}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {designer.skills.map((skill, i) => (
              <Badge key={i} variant="outline">{skill}</Badge>
            ))}
          </div>
        </div>
        
        <div className="flex space-x-2">
          {designer.website && (
            <Button variant="outline" size="icon" asChild>
              <a href={designer.website} target="_blank" rel="noopener noreferrer">
                <Globe className="h-4 w-4" />
              </a>
            </Button>
          )}
          {designer.linkedIn && (
            <Button variant="outline" size="icon" asChild>
              <a href={designer.linkedIn} target="_blank" rel="noopener noreferrer">
                <Linkedin className="h-4 w-4" />
              </a>
            </Button>
          )}
          {designer.email && (
            <Button variant="outline" size="icon" asChild>
              <a href={`mailto:${designer.email}`}>
                <Mail className="h-4 w-4" />
              </a>
            </Button>
          )}
          {onAdd && (
            <Button className="ml-auto" onClick={() => onAdd(designer)}>
              Add to List
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
