import { useQuery } from "@tanstack/react-query";
import { SelectList, SelectDesigner } from "@db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FlutedGlass } from "@paper-design/shaders-react";
import { WebGlGuard } from "@/components/WebGlGuard";
import { Link } from "wouter";
import heroArtwork from "../assets/visualelectric-1.png";

type ListDesignerEntry = { designer: SelectDesigner; notes?: string };

export default function PublicListPage({ params }: { params: { slugOrId: string } }) {
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

  const allDesigners: ListDesignerEntry[] = list.designers ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="py-16 md:py-24 overflow-hidden relative">
        <div className="absolute inset-0 bg-black" />

        <div className="absolute inset-0" style={{ opacity: 0.3 }}>
          <WebGlGuard>
            <FlutedGlass
              width="100%"
              height="100%"
              image={heroArtwork}
              colorBack="#00000000"
              colorShadow="#000000"
              colorHighlight="#ffffff"
              size={0.1}
              shadows={0.57}
              highlights={0.18}
              shape="lines"
              angle={0}
              distortionShape="prism"
              distortion={0.5}
              shift={0}
              stretch={0}
              blur={0}
              edges={0.25}
              margin={0}
              grainMixer={0}
              grainOverlay={0}
              fit="cover"
            />
          </WebGlGuard>
        </div>

        <div className="mx-auto px-4 w-full max-w-2xl relative z-10">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 drop-shadow-lg">
              {list.name}
            </h1>
            {list.description && (
              <p className="text-base text-white/80 leading-relaxed max-w-lg mx-auto">
                {list.description}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto py-10 px-4 w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 md:p-8">
          <div className="flex flex-col gap-4">
            {allDesigners.map(({ designer, notes }: ListDesignerEntry) => (
              <a
                key={designer.id}
                href={designer.linkedIn || "#"}
                target={designer.linkedIn ? "_blank" : undefined}
                rel="noopener noreferrer"
                className={designer.linkedIn ? "cursor-pointer" : "cursor-default"}
              >
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <CardContent className="flex items-start space-x-4 pt-6">
                    <Avatar className="w-14 h-14 flex-shrink-0">
                      <AvatarImage src={designer.photoUrl || ""} />
                      <AvatarFallback>
                        {designer.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
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
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Notes
                          </p>
                          <p className="text-sm mt-1">{notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>

          {allDesigners.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No designers in this list yet.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center pb-10">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Made with Tapestry
        </Link>
      </div>
    </div>
  );
}
