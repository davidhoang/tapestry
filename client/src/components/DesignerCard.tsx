import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SelectDesigner } from "@db/schema";
import { Globe, Linkedin, Mail, Pencil, X } from "lucide-react";
import MDEditor from "@uiw/react-md-editor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
        <DialogContent className="fixed inset-0 m-12 max-w-none max-h-none w-auto h-auto overflow-hidden bg-background border-0 shadow-2xl rounded-2xl p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Designer Profile</DialogTitle>
            <DialogDescription>
              View detailed information about {designer.name}, including their skills, experience, and contact details.
            </DialogDescription>
          </DialogHeader>
          
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-6 right-6 z-20 bg-background/80 backdrop-blur-sm hover:bg-background/90 rounded-full"
            onClick={() => setIsViewModalOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {/* Cover Photo Section */}
            <div className="relative h-80 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 overflow-hidden">
              {/* Gradient overlay for better text contrast */}
              <div className="absolute inset-0 bg-black/20" />
              
              {/* Profile Photo - positioned to overlap cover */}
              <div className="absolute bottom-0 left-12 transform translate-y-1/2">
                {designer.photoUrl ? (
                  <img
                    src={designer.photoUrl}
                    alt={designer.name}
                    className="h-40 w-40 rounded-2xl object-cover bg-background border-4 border-background shadow-xl"
                  />
                ) : (
                  <div className="h-40 w-40 rounded-2xl bg-background border-4 border-background shadow-xl flex items-center justify-center">
                    <span className="text-6xl font-bold text-muted-foreground">
                      {designer.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Available badge positioned on cover */}
              {designer.available && (
                <div className="absolute top-6 left-6">
                  <Badge variant="secondary" className="text-lg px-6 py-2 bg-green-500 text-white border-0 shadow-lg">
                    Open to Roles
                  </Badge>
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="px-12 pt-24 pb-12 space-y-12">
              {/* Name and Title */}
              <div className="space-y-4">
                <h1 className="text-6xl font-bold leading-tight tracking-tight">{designer.name}</h1>
                <p className="text-3xl text-muted-foreground font-light">{designer.title}</p>
                
                {/* Company and Location */}
                <div className="flex items-center space-x-3 text-xl text-muted-foreground">
                  <span className="font-medium">{designer.level}</span>
                  <span>•</span>
                  <span>{designer.company}</span>
                  <span>•</span>
                  <span>{designer.location}</span>
                </div>
              </div>

              {/* Skills Section */}
              <div className="space-y-6">
                <h2 className="text-3xl font-bold">Skills & Expertise</h2>
                <div className="flex flex-wrap gap-3">
                  {designer.skills.map((skill, i) => (
                    <Badge 
                      key={i} 
                      variant="outline" 
                      className="text-lg px-6 py-3 border-2 hover:bg-secondary/50 transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSkillClick?.(skill);
                      }}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Notes Section */}
              {designer.notes && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold">About</h2>
                  <div className="prose prose-xl max-w-none prose-headings:font-bold prose-p:text-xl prose-p:leading-relaxed">
                    <MDEditor.Markdown source={designer.notes} style={{ backgroundColor: 'transparent' }} />
                  </div>
                </div>
              )}

              {/* Contact Section */}
              <div className="space-y-6">
                <h2 className="text-3xl font-bold">Get in Touch</h2>
                <div className="flex flex-wrap gap-4">
                  {designer.website && (
                    <Button variant="outline" size="lg" className="text-lg px-8 py-6" asChild>
                      <a href={designer.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-5 w-5 mr-3" />
                        Website
                      </a>
                    </Button>
                  )}
                  {designer.linkedIn && (
                    <Button variant="outline" size="lg" className="text-lg px-8 py-6" asChild>
                      <a href={designer.linkedIn} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-5 w-5 mr-3" />
                        LinkedIn
                      </a>
                    </Button>
                  )}
                  {designer.email && (
                    <Button variant="outline" size="lg" className="text-lg px-8 py-6" asChild>
                      <a href={`mailto:${designer.email}`}>
                        <Mail className="h-5 w-5 mr-3" />
                        Email
                      </a>
                    </Button>
                  )}
                  {onAdd && (
                    <Button size="lg" className="text-lg px-8 py-6 ml-auto" onClick={() => onAdd(designer)}>
                      Add to List
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}