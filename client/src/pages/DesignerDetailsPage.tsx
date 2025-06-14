import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SelectDesigner } from "@db/schema";
import { Globe, Linkedin, Mail, ArrowLeft } from "lucide-react";
import MDEditor from "@uiw/react-md-editor";
import { useDesigner } from "@/hooks/use-designers";

export default function DesignerDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  
  const { data: designer, isLoading, error } = useDesigner(parseInt(id || "0"));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-48 bg-muted rounded-2xl mb-8"></div>
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !designer) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/directory")}
            className="mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Directory
          </Button>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Designer Not Found</h1>
            <p className="text-muted-foreground">The designer you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Photo Section */}
      <div className="relative h-64 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/directory")}
          className="absolute top-6 left-6 bg-background/80 backdrop-blur-sm hover:bg-background/90 text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Directory
        </Button>

        {/* Available badge */}
        {designer.available && (
          <div className="absolute top-6 right-6">
            <Badge variant="secondary" className="text-sm px-4 py-2 bg-green-500 text-white border-0 shadow-lg">
              Open to Roles
            </Badge>
          </div>
        )}
        
        {/* Profile Photo - positioned to overlap cover and content */}
        <div className="absolute bottom-0 left-0 right-0 transform translate-y-1/2">
          <div className="container mx-auto px-8">
            <div className="max-w-4xl mx-auto">
              {designer.photoUrl ? (
                <img
                  src={designer.photoUrl}
                  alt={designer.name}
                  className="h-32 w-32 rounded-2xl object-cover bg-background border-4 border-background shadow-xl"
                />
              ) : (
                <div className="h-32 w-32 rounded-2xl bg-background border-4 border-background shadow-xl flex items-center justify-center">
                  <span className="text-4xl font-bold text-muted-foreground">
                    {designer.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-8 pt-20 pb-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Name and Title */}
          <div className="space-y-4">
            <h1 className="text-5xl font-bold leading-tight tracking-tight">{designer.name}</h1>
            <p className="text-2xl text-muted-foreground font-light">{designer.title}</p>
            
            {/* Company and Location */}
            <div className="flex items-center space-x-3 text-lg text-muted-foreground">
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
                  className="text-base px-6 py-3 border-2 hover:bg-secondary/50 transition-colors"
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
              <div className="prose prose-lg max-w-none prose-headings:font-bold prose-p:text-lg prose-p:leading-relaxed">
                <MDEditor.Markdown source={designer.notes} style={{ backgroundColor: 'transparent' }} />
              </div>
            </div>
          )}

          {/* Contact Section */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Get in Touch</h2>
            <div className="flex flex-wrap gap-4">
              {designer.website && (
                <Button variant="outline" size="lg" className="text-base px-8 py-4" asChild>
                  <a href={designer.website} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-5 w-5 mr-3" />
                    Website
                  </a>
                </Button>
              )}
              {designer.linkedIn && (
                <Button variant="outline" size="lg" className="text-base px-8 py-4" asChild>
                  <a href={designer.linkedIn} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="h-5 w-5 mr-3" />
                    LinkedIn
                  </a>
                </Button>
              )}
              {designer.email && (
                <Button variant="outline" size="lg" className="text-base px-8 py-4" asChild>
                  <a href={`mailto:${designer.email}`}>
                    <Mail className="h-5 w-5 mr-3" />
                    Email
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}