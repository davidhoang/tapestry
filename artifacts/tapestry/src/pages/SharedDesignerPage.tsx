import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DesignerAvatar } from "@/components/DesignerAvatar";
import { getDesignerCoverImage } from "@/utils/coverImages";
import { getAuthHeaders } from "@/lib/queryClient";
import { slugify } from "@/utils/slugify";
import { MapPin, Briefcase, ExternalLink, Loader2 } from "lucide-react";
import { useEffect } from "react";

interface SharedDesigner {
  id: number;
  name: string;
  title: string;
  company: string | null;
  location: string | null;
  photoUrl: string | null;
  skills: string[];
  available: boolean | null;
  description: string | null;
  level: string;
  workspaceId: number;
  workspaceSlug: string | null;
  viewerIsMember: boolean;
}

export default function SharedDesignerPage() {
  const shareToken = window.location.pathname.split('/')[2];
  const { user, isLoading: isUserLoading, login } = useUser();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isUserLoading && !user) {
      // Use the redirect-based login() helper from use-user. The Clerk modal
      // path relies on cross-origin iframes / partitioned storage which
      // silently no-ops in browsers like Dia; a full-page redirect to /auth
      // works consistently and lands the visitor back on this shared
      // designer page after auth.
      void login();
    }
  }, [isUserLoading, user, login]);

  const { data: designer, isLoading, error } = useQuery<SharedDesigner>({
    queryKey: ["/api/shared/designers", shareToken],
    queryFn: async () => {
      const authHeaders = await getAuthHeaders();
      const resp = await fetch(`/api/shared/designers/${shareToken}`, {
        credentials: "include",
        headers: authHeaders,
      });
      if (!resp.ok) throw new Error("Designer not found");
      return resp.json();
    },
    enabled: !!user && !!shareToken,
  });

  if (isUserLoading || (!user && !isUserLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-72 w-full bg-muted animate-pulse" />
        <div className="max-w-2xl mx-auto px-6 -mt-20 pb-16">
          <Skeleton className="h-32 w-32 rounded-2xl mb-6" />
          <Skeleton className="h-10 w-64 mb-3" />
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-6 w-36 mb-8" />
          <div className="flex gap-2 flex-wrap mb-8">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-8 w-20 rounded-full" />)}
          </div>
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (error || !designer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
          <p className="text-muted-foreground mb-6">This designer profile could not be found or the link may be invalid.</p>
          <Button onClick={() => setLocation("/")}>Go to Tapestry</Button>
        </div>
      </div>
    );
  }

  const coverImage = getDesignerCoverImage(designer.id);
  const skills: string[] = Array.isArray(designer.skills)
    ? designer.skills
    : typeof designer.skills === "string"
    ? (designer.skills as string).split(",").map((s: string) => s.trim()).filter(Boolean)
    : [];

  const designerProfilePath = designer.workspaceSlug
    ? `/${designer.workspaceSlug}/directory/${slugify(designer.name)}`
    : "/";

  const handleOpenInTapestry = () => {
    setLocation(designerProfilePath);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Cover Image */}
      <div className="relative h-72 w-full overflow-hidden flex-shrink-0">
        <img
          src={coverImage}
          alt="Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/70" />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 pt-6">
          <span className="text-white/80 text-sm font-semibold tracking-wide">Tapestry</span>
          {designer.available && (
            <Badge className="bg-green-500 text-white border-0 shadow-md">
              Open to Roles
            </Badge>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="max-w-2xl mx-auto w-full px-6 -mt-24 pb-16 flex-1">
        <div className="bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
          {/* Profile header */}
          <div className="px-8 pt-8 pb-6">
            <div className="flex items-end gap-6 mb-6">
              <div className="flex-shrink-0 -mt-20 relative z-10">
                <div className="rounded-2xl overflow-hidden border-4 border-card shadow-xl">
                  <DesignerAvatar
                    imageUrl={designer.photoUrl}
                    name={designer.name}
                    size="lg"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0 pb-1">
                {designer.available && (
                  <Badge className="bg-green-100 text-green-800 border-green-200 mb-2 text-xs">
                    Open to Roles
                  </Badge>
                )}
              </div>
            </div>

            <h1 className="text-3xl font-bold leading-tight">{designer.name}</h1>
            <p className="text-lg text-muted-foreground mt-1">
              {designer.level} {designer.title}
              {designer.company ? ` at ${designer.company}` : ""}
            </p>

            {designer.location && (
              <div className="flex items-center gap-1.5 mt-2 text-muted-foreground text-sm">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>{designer.location}</span>
              </div>
            )}

            {designer.company && (
              <div className="flex items-center gap-1.5 mt-1 text-muted-foreground text-sm">
                <Briefcase className="h-4 w-4 flex-shrink-0" />
                <span>{designer.company}</span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-border mx-8" />

          {/* Skills */}
          {skills.length > 0 && (
            <div className="px-8 py-6">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Skills & Expertise</h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-sm px-3 py-1">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {designer.description && (
            <>
              <div className="border-t border-border mx-8" />
              <div className="px-8 py-6">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">About</h2>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                  {designer.description}
                </p>
              </div>
            </>
          )}

          {/* Divider */}
          <div className="border-t border-border mx-8" />

          {/* CTA — member vs non-member experience */}
          <div className="px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {designer.viewerIsMember ? (
              <>
                <Button
                  className="w-full sm:w-auto flex items-center gap-2"
                  onClick={handleOpenInTapestry}
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Full Profile
                </Button>
                <p className="text-xs text-muted-foreground">
                  View the full profile in your Tapestry workspace.
                </p>
              </>
            ) : (
              <>
                <Button
                  className="w-full sm:w-auto flex items-center gap-2"
                  onClick={() => setLocation("/")}
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in Tapestry
                </Button>
                <p className="text-xs text-muted-foreground">
                  Join or sign in to your workspace to see the full profile and collaborate on this designer.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Powered by{" "}
          <span className="font-semibold text-foreground">Tapestry</span>
          {" "}— The designer talent platform
        </p>
      </div>
    </div>
  );
}
