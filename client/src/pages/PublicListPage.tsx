import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { SelectList, SelectDesigner } from "@db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { FlutedGlass } from "@paper-design/shaders-react";
import { MapPin } from "lucide-react";
import { Link } from "wouter";
import heroArtwork from "../assets/visualelectric-1.png";

type ListDesignerEntry = { designer: SelectDesigner; notes?: string };

type DesignerCard = {
  id: number;
  name: string;
  title: string;
  company: string;
  photo: string;
  rotation: number;
  spreadY: number;
  location?: string;
};

function buildDesignerCards(designers: ListDesignerEntry[]): DesignerCard[] {
  const rotations = [-6, -3, 0, 3, 6];
  const spreadYs = [-80, -40, 0, 40, 80];

  return designers.slice(0, 5).map(({ designer }, index) => ({
    id: designer.id,
    name: designer.name,
    title: designer.title ?? "",
    company: designer.company ?? "",
    photo: designer.photoUrl ?? "",
    rotation: rotations[index] ?? 0,
    spreadY: spreadYs[index] ?? 0,
    location: designer.location ?? undefined,
  }));
}

export default function PublicListPage({ params }: { params: { slugOrId: string } }) {
  const { data: list, isLoading, error } = useQuery<SelectList>({
    queryKey: [`/api/lists/${params.slugOrId}/public`],
  });

  const [isCardStackHovered, setIsCardStackHovered] = useState(false);
  const [selectedDesigner, setSelectedDesigner] = useState<DesignerCard | null>(null);
  const cardStackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedDesigner) {
        setSelectedDesigner(null);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        selectedDesigner &&
        cardStackRef.current &&
        !cardStackRef.current.contains(e.target as Node)
      ) {
        setSelectedDesigner(null);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedDesigner]);

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
  const designerCards = buildDesignerCards(allDesigners);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section — FlutedGlass shader + interactive card stack */}
      <section className="py-20 md:py-28 overflow-hidden relative">
        <div className="absolute inset-0 bg-black" />

        <div className="absolute inset-0" style={{ opacity: 0.3 }}>
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
        </div>

        <div className="mx-auto px-4 w-full max-w-2xl relative z-10">
          <div className="flex flex-col items-center gap-8">
            {/* List name and description — above the cards */}
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

            {/* Stacked Cards */}
            <div
              ref={cardStackRef}
              className="relative w-full h-[360px] flex items-center justify-center"
              onMouseEnter={() => !selectedDesigner && setIsCardStackHovered(true)}
              onMouseLeave={() => !selectedDesigner && setIsCardStackHovered(false)}
            >
              {/* List Background */}
              <div
                className={`absolute inset-4 bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden transition-all duration-500 ${
                  isCardStackHovered && !selectedDesigner
                    ? "opacity-100 scale-100"
                    : "opacity-95 scale-[0.98]"
                }`}
              >
                <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-3 text-sm font-medium text-gray-600 truncate max-w-[140px]">
                    {list.name}
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  {(designerCards.length > 0 ? designerCards : [1, 2, 3, 4, 5]).map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                      {typeof item === "object" && "photo" in item && item.photo ? (
                        <img
                          src={item.photo}
                          alt={item.name}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        {typeof item === "object" && "name" in item ? (
                          <>
                            <div className="text-xs font-medium text-gray-700 truncate">
                              {item.name}
                            </div>
                            <div className="text-[10px] text-gray-400 truncate mt-0.5">
                              {item.title}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="h-3 w-24 bg-gray-200 rounded" />
                            <div className="h-2 w-16 bg-gray-100 rounded mt-1" />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Stack */}
              {designerCards.length > 0 && (
                <AnimatePresence>
                  {designerCards.map((designer, index) => {
                    const isSelected = selectedDesigner?.id === designer.id;
                    const isAnySelected = selectedDesigner !== null;

                    return (
                      <motion.div
                        key={designer.id}
                        layoutId={`card-${designer.id}`}
                        onClick={() => setSelectedDesigner(isSelected ? null : designer)}
                        className="absolute bg-white rounded-xl shadow-lg cursor-pointer"
                        initial={false}
                        animate={{
                          rotate: isSelected ? 0 : designer.rotation,
                          y: isSelected ? 0 : isCardStackHovered ? designer.spreadY : 0,
                          scale: isSelected
                            ? 1.15
                            : isAnySelected && !isSelected
                            ? 0.9
                            : 1,
                          opacity: isAnySelected && !isSelected ? 0 : 1,
                          width: isSelected ? 288 : 256,
                          padding: isSelected ? 24 : 20,
                        }}
                        whileHover={!isSelected && !isAnySelected ? { scale: 1.05 } : {}}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                          opacity: { duration: 0.2 },
                        }}
                        style={{
                          zIndex: isSelected ? 50 : 10 + index,
                          boxShadow: isSelected
                            ? "0 25px 50px -12px rgb(0 0 0 / 0.25)"
                            : isCardStackHovered
                            ? "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
                            : "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                        }}
                      >
                        <motion.div
                          className="flex gap-4"
                          animate={{
                            flexDirection: isSelected ? "column" : "row",
                            alignItems: "center",
                            textAlign: isSelected ? "center" : "left",
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          {designer.photo ? (
                            <motion.img
                              src={designer.photo}
                              alt={designer.name}
                              className="rounded-full object-cover flex-shrink-0"
                              animate={{
                                width: isSelected ? 80 : 56,
                                height: isSelected ? 80 : 56,
                              }}
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                          ) : (
                            <motion.div
                              className="rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex-shrink-0"
                              animate={{
                                width: isSelected ? 80 : 56,
                                height: isSelected ? 80 : 56,
                              }}
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                          )}
                          <div>
                            <motion.h3
                              className="font-semibold text-gray-900"
                              animate={{ fontSize: isSelected ? "18px" : "14px" }}
                            >
                              {designer.name}
                            </motion.h3>
                            <p className={`text-gray-600 ${isSelected ? "text-sm" : "text-xs"}`}>
                              {designer.title}
                            </p>
                            <p className={`text-gray-500 ${isSelected ? "text-sm" : "text-xs"}`}>
                              {designer.company}
                            </p>
                          </div>
                        </motion.div>

                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3, delay: 0.1 }}
                              className="overflow-hidden mt-4"
                            >
                              {designer.location && (
                                <div className="flex items-center justify-center gap-2 text-gray-500 mb-2">
                                  <MapPin className="w-4 h-4" />
                                  <span className="text-sm">{designer.location}</span>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Designers Grid — polished container */}
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

      {/* Made with Tapestry */}
      <div className="flex justify-center pb-10">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Made with Tapestry
        </Link>
      </div>
    </div>
  );
}
