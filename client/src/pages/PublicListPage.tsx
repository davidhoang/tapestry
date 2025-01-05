import { useQuery } from "@tanstack/react-query";
import { SelectList } from "@db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import AuthPage from "./AuthPage";

export default function PublicListPage({ params }: { params: { id: string } }) {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { data: list, isLoading, error } = useQuery<SelectList>({
    queryKey: [`/api/lists/${params.id}/public`],
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
    <div>
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <a className="text-xl font-bold">Design Matchmaker</a>
          </Link>
          <Button variant="default" onClick={() => setShowAuthDialog(true)}>
            Sign in
          </Button>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{list.name}</h1>
            {list.description && (
              <p className="mt-2 text-muted-foreground">{list.description}</p>
            )}
          </div>

          <div className="grid gap-4">
            {list.designers?.map(({ designer, notes }: { designer: any; notes?: string }) => (
              <a
                key={designer.id}
                href={designer.linkedIn || '#'}
                target={designer.linkedIn ? "_blank" : undefined}
                rel="noopener noreferrer"
                className={designer.linkedIn ? "cursor-pointer" : "cursor-default"}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="flex items-start space-x-4 pt-6">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={designer.photoUrl || ''} />
                      <AvatarFallback>
                        {designer.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-medium">{designer.name}</h3>
                      <p className="text-sm text-muted-foreground">{designer.title}</p>
                      {notes && (
                        <div className="mt-2 text-sm">
                          <p className="font-medium">Notes:</p>
                          <p className="text-muted-foreground">{notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="max-w-sm p-0">
          <AuthPage />
        </DialogContent>
      </Dialog>
    </div>
  );
}