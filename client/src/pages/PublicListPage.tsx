import { useQuery } from "@tanstack/react-query";
import { SelectList } from "@db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { SelectDesigner } from "@db/schema";

export default function PublicListPage({ params }: { params: { id: string } }) {
  const [selectedDesigner, setSelectedDesigner] = useState<SelectDesigner | null>(null);
  
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
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{list.name}</h1>
          {list.description && (
            <p className="mt-2 text-muted-foreground">{list.description}</p>
          )}
        </div>

        <div className="grid gap-4">
          {list.designers?.map(({ designer, notes }) => (
            <Card
              key={designer.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedDesigner(designer)}
            >
              <CardContent className="flex items-start space-x-4 pt-6">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={designer.photoUrl || ''} />
                  <AvatarFallback>
                    {designer.name.split(' ').map(n => n[0]).join('')}
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
          ))}
        </div>
      </div>

      {selectedDesigner && (
        <Dialog open={Boolean(selectedDesigner)} onOpenChange={(open) => !open && setSelectedDesigner(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">Designer Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedDesigner.photoUrl || ''} />
                  <AvatarFallback>
                    {selectedDesigner.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold">{selectedDesigner.name}</h2>
                  <p className="text-muted-foreground">{selectedDesigner.title}</p>
                </div>
              </div>
              {selectedDesigner.notes && (
                <div>
                  <h3 className="font-medium mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground">{selectedDesigner.notes}</p>
                </div>
              )}
              {selectedDesigner.skills && (
                <div>
                  <h3 className="font-medium mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedDesigner.skills.map((skill, index) => (
                      <div
                        key={index}
                        className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                      >
                        {skill}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
