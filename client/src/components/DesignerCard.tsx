import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SelectDesigner } from "@db/schema";
import { Globe, Linkedin, Mail, Pencil } from "lucide-react";
import MDEditor from "@uiw/react-md-editor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

interface DesignerCardProps {
  designer: SelectDesigner;
  onEdit?: (designer: SelectDesigner) => void;
  onAdd?: (designer: SelectDesigner) => void;
  onSkillClick?: (skill: string) => void;
}

export default function DesignerCard({ designer, onEdit, onAdd, onSkillClick }: DesignerCardProps) {
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  return (
    <>
      <Card 
        className="h-full relative cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setIsViewModalOpen(true)}
      >
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-start gap-4 pt-4 pr-12">
            {designer.photoUrl && (
              <img
                src={designer.photoUrl}
                alt={designer.name}
                className="h-16 w-16 rounded-full object-cover bg-muted"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold truncate">{designer.name}</h3>
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

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Designer Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex items-start gap-6">
              {designer.photoUrl ? (
                <img
                  src={designer.photoUrl}
                  alt={designer.name}
                  className="h-32 w-32 rounded-full object-cover bg-muted"
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-4xl font-bold text-muted-foreground">
                    {designer.name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold">{designer.name}</h2>
                    <p className="text-lg text-muted-foreground">{designer.title}</p>
                  </div>
                  {designer.available && (
                    <Badge variant="secondary" className="text-base px-4 py-1">Open to Roles</Badge>
                  )}
                </div>
                <div className="mt-4 flex items-center space-x-2 text-muted-foreground">
                  <span>{designer.level}</span>
                  <span>•</span>
                  <span>{designer.company}</span>
                  <span>•</span>
                  <span>{designer.location}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {designer.skills.map((skill, i) => (
                  <Badge key={i} variant="outline" className="text-base px-3 py-1">{skill}</Badge>
                ))}
              </div>
            </div>

            {designer.notes && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Notes</h3>
                <div className="prose prose-sm max-w-none">
                  <MDEditor.Markdown source={designer.notes} />
                </div>
              </div>
            )}

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
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}