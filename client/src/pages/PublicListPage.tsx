import { useQuery } from "@tanstack/react-query";
import { SelectList } from "@db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import AuthPage from "./AuthPage";

export default function PublicListPage({ params }: { params: { slugOrId: string } }) {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { data: list, isLoading, error } = useQuery<SelectList>({
    queryKey: [`/api/lists/${params.slugOrId}/public`],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <h1 className="text-2xl font-bold text-destructive mb-2">List Not Found</h1>
            <p className="text-muted-foreground">
              This list may be private or no longer exists.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <header className="absolute top-0 left-0 right-0 z-10 bg-transparent">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <a className="text-xl font-bold text-white drop-shadow-lg">Design Matchmaker</a>
          </Link>
          <Button variant="default" onClick={() => setShowAuthDialog(true)}>
            Sign in
          </Button>
        </div>
      </header>

      {/* Hero Section with Image */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/hero-design.png')",
            filter: "brightness(0.7) contrast(1.1)"
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
        
        {/* List Title and Description */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="container mx-auto px-4 text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-3 drop-shadow-lg">{list.name}</h1>
            {list.description && (
              <p className="text-lg md:text-xl text-white/90 drop-shadow-md max-w-2xl mx-auto">
                {list.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Designers Grid */}
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {list.designers?.map(({ designer, notes }: { designer: any; notes?: string }) => (
              <a
                key={designer.id}
                href={designer.linkedIn || '#'}
                target={designer.linkedIn ? "_blank" : undefined}
                rel="noopener noreferrer"
                className={designer.linkedIn ? "cursor-pointer" : "cursor-default"}
              >
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <CardContent className="flex items-start space-x-4 pt-6">
                    <Avatar className="w-14 h-14 flex-shrink-0">
                      <AvatarImage src={designer.photoUrl || ''} />
                      <AvatarFallback>
                        {designer.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg">{designer.name}</h3>
                      <p className="text-sm text-muted-foreground">{designer.title}</p>
                      {designer.company && (
                        <p className="text-sm text-muted-foreground mt-1">{designer.company}</p>
                      )}
                      {designer.location && (
                        <p className="text-sm text-muted-foreground">{designer.location}</p>
                      )}
                      {notes && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</p>
                          <p className="text-sm mt-1">{notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
          
          {/* Empty state if no designers */}
          {(!list.designers || list.designers.length === 0) && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No designers in this list yet.</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="max-w-sm p-0 h-auto overflow-visible">
          <AuthPage />
        </DialogContent>
      </Dialog>
    </div>
  );
}