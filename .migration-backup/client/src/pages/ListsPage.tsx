import { useState, useEffect, useRef, useMemo } from "react";
import {
  useLists,
  useCreateList,
  useDeleteList,
  useUpdateList,
  useAddDesignersToList,
  useUpdateListDesignerNotes,
  useReorderListDesigners,
} from "@/hooks/use-lists";
import { useQueryClient } from "@tanstack/react-query";
import { useDesigners } from "@/hooks/use-designer";
import { useLocation, useParams } from "wouter";
import { slugify } from "@/utils/slugify";
import { getDesignerCoverImage } from "@/utils/coverImages";
import Navigation from "@/components/Navigation";
import PageLayout from "@/components/layouts/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { useForm } from "react-hook-form";
import { Loader2, Plus, Trash, Mail, Pencil, Copy, Search, Check, Download, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { exportToCSV, designerExportColumns } from "@/lib/export";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SelectDesigner, SelectList } from "@db/schema";
import { UserPlus } from "lucide-react";

const CARD_GRADIENTS = [
  "linear-gradient(135deg, #f5c6a0 0%, #e8956b 50%, #c0614a 100%)",
  "linear-gradient(135deg, #f2d7c4 0%, #d4956a 50%, #a0614e 100%)",
  "linear-gradient(135deg, #c8d8c0 0%, #8aab7e 50%, #5a7a52 100%)",
  "linear-gradient(135deg, #d4cce8 0%, #9b8ab8 50%, #6b5a8a 100%)",
  "linear-gradient(135deg, #f0d6b8 0%, #c8a06a 50%, #8a6040 100%)",
  "linear-gradient(135deg, #e8d0c4 0%, #c09080 50%, #8a5a50 100%)",
  "linear-gradient(135deg, #c4d4e0 0%, #7a9ab8 50%, #4a6a8a 100%)",
  "linear-gradient(135deg, #f0e0c0 0%, #d4b080 50%, #a07840 100%)",
];

function getCardGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return CARD_GRADIENTS[Math.abs(hash) % CARD_GRADIENTS.length];
}

function DesignerCardFan({ designers }: { designers: Array<{ photoUrl?: string | null; name: string }> }) {
  const [hovered, setHovered] = useState(false);

  const fanDesigners = useMemo(() => {
    const shuffled = [...designers].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  }, [designers.map(d => d.name).join(",")]);

  const count = fanDesigners.length;
  const zIndexes = [1, 3, 5, 3, 1].slice(0, count);

  // At rest: gentle fan, cards sitting slightly low
  const restRotations = [-13, -6, 0, 6, 13];
  const restDropY     = [10, 4, 0, 4, 10];
  const restSpacing   = 78;

  // On hover: dramatic spread + ALL cards lift up strongly
  const hoverRotations = [-30, -15, 0, 15, 30];
  const hoverDropY     = [-48, -60, -70, -60, -48];
  const hoverSpacing   = 100;

  return (
    <div
      className="relative flex items-end justify-center w-full cursor-default pb-4"
      style={{ height: "100%" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {fanDesigners.map((designer, i) => {
        const rot      = hovered ? hoverRotations[i] : restRotations[i];
        const dy       = hovered ? hoverDropY[i]     : restDropY[i];
        const spacing  = hovered ? hoverSpacing       : restSpacing;
        const offsetX  = (i - Math.floor(count / 2)) * spacing;
        const gradient = getCardGradient(designer.name);
        const initials = designer.name.split(" ").map(n => n[0]).join("").slice(0, 2);

        return (
          <div
            key={i}
            className="absolute bottom-4"
            style={{
              transform: `translateX(${offsetX}px) rotate(${rot}deg) translateY(${dy}px)`,
              zIndex: zIndexes[i],
              transition: "transform 0.5s cubic-bezier(0.34, 1.3, 0.64, 1)",
            }}
          >
            <div
              className="w-36 h-36 rounded-3xl border-[3px] border-white/90 shadow-2xl overflow-hidden"
              style={{ background: gradient }}
            >
              {designer.photoUrl ? (
                <img src={designer.photoUrl} alt={designer.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-end justify-center pb-4">
                  <span className="text-white/90 font-bold text-3xl drop-shadow-md tracking-wide">{initials}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface SortableDesignerCardProps {
  designer: SelectDesigner & { notes?: string | null };
  onEditNotes: (designerId: number, notes: string) => void;
  onSaveNotes: (designerId: number) => void;
  editingNotesFor: number | null;
  notesValue: string;
  setNotesValue: (v: string) => void;
  onNavigate: (designer: SelectDesigner) => void;
}


function SortableDesignerCard({
  designer,
  onEditNotes,
  onSaveNotes,
  editingNotesFor,
  notesValue,
  setNotesValue,
  onNavigate,
}: SortableDesignerCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: designer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const notes = designer.notes;
  const isEditing = editingNotesFor === designer.id;

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`group/card transition-shadow overflow-visible ${isDragging ? "shadow-2xl ring-2 ring-primary/30" : "hover:shadow-md"}`}>
        {/* Main row */}
        <CardContent className="flex items-center gap-3 py-3 px-4">
          {/* Grip handle — only visible on hover */}
          <div
            {...attributes}
            {...listeners}
            className="opacity-0 group-hover/card:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground flex-shrink-0"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          <Avatar
            className="w-10 h-10 flex-shrink-0 cursor-pointer"
            onClick={() => onNavigate(designer)}
          >
            <AvatarImage src={designer.photoUrl || ""} />
            <AvatarFallback className="text-xs">
              {designer.name.split(" ").map((n: string) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3
              className="font-medium cursor-pointer hover:underline truncate text-sm leading-tight"
              onClick={() => onNavigate(designer)}
            >
              {designer.name}
            </h3>
            <p className="text-xs text-muted-foreground truncate">{designer.title}</p>
          </div>
        </CardContent>

        {/* Note — always visible below the card row */}
        <div className="mx-4 mb-3">
          <div
            className="rounded-lg border border-amber-200/60 shadow-sm overflow-hidden"
            style={{ background: "#fef9ee" }}
          >
            {isEditing ? (
              <textarea
                value={notesValue}
                onChange={(e) => {
                  setNotesValue(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                onBlur={() => onSaveNotes(designer.id)}
                ref={(el) => {
                  if (el) {
                    el.style.height = "auto";
                    el.style.height = el.scrollHeight + "px";
                  }
                }}
                placeholder="Jot down your thoughts…"
                autoFocus
                rows={1}
                className="w-full bg-transparent border-none outline-none text-sm px-4 py-3 resize-none leading-6 rounded-lg overflow-hidden"
              />
            ) : (
              <div
                className="px-4 py-3 cursor-text min-h-[44px] flex items-center"
                onClick={() => onEditNotes(designer.id, notes || "")}
              >
                {notes ? (
                  <p className="text-sm text-foreground/70 leading-6 line-clamp-2">{notes}</p>
                ) : (
                  <p className="text-sm text-muted-foreground/35 leading-6 italic">Add a note…</p>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function DesignerSelect({
  onSelect,
  excludeDesignerIds = [],
}: {
  onSelect: (designerId: number) => void;
  excludeDesignerIds?: number[];
}) {
  const { data: designers, isLoading } = useDesigners();
  const [open, setOpen] = useState(false);

  if (isLoading) return null;

  const availableDesigners = designers?.filter(
    designer => !excludeDesignerIds.includes(designer.id)
  ) || [];

  const handleSelect = (designerId: number) => {
    onSelect(designerId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-11"
        >
          Select a designer to add
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <Command>
          <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
            <CommandPrimitive.Input
              placeholder="Search designers..."
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>No designers found.</CommandEmpty>
            <CommandGroup>
              {availableDesigners.map((designer) => (
                <CommandItem
                  key={designer.id}
                  value={`${designer.name} ${designer.title || ''} ${designer.company || ''}`}
                  onSelect={() => handleSelect(designer.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-3 w-full min-w-0">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={designer.photoUrl || ""} />
                      <AvatarFallback className="text-xs">
                        {designer.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{designer.name}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {designer.title} {designer.company && `• ${designer.company}`}
                      </div>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function ListsPage() {
  const { data: lists, isLoading } = useLists();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<SelectList | null>(null);
  const [listToEdit, setListToEdit] = useState<SelectList | null>(null);
  const [listToDelete, setListToDelete] = useState<SelectList | null>(null);
  const { toast } = useToast();
  const deleteList = useDeleteList();
  const [location, setLocation] = useLocation();
  const params = useParams<{ listSlug?: string }>();
  const pathParts = location.split("/");
  const workspaceSlug = pathParts[1];

  useEffect(() => {
    if (params.listSlug && lists) {
      const list = lists.find(l => l.slug === params.listSlug || String(l.id) === params.listSlug);
      if (list) {
        setSelectedList(list);
      } else {
        setLocation(`/${workspaceSlug}/lists`);
      }
    } else if (!params.listSlug) {
      setSelectedList(null);
    }
  }, [params.listSlug, lists, workspaceSlug, setLocation]);

  const handleListClick = (list: SelectList) => {
    const listIdentifier = list.slug || String(list.id);
    setLocation(`/${workspaceSlug}/lists/${listIdentifier}`);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setSelectedList(null);
      setLocation(`/${workspaceSlug}/lists`);
    }
  };

  const handleDeleteList = async () => {
    if (!listToDelete) return;

    try {
      await deleteList.mutateAsync(listToDelete.id);
      toast({
        title: "Success",
        description: "List deleted successfully",
      });
      setListToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete list",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <Navigation />
      <PageLayout className="container mx-auto px-4 pb-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Lists</h1>
          <CreateListDialog open={isOpen} onOpenChange={setIsOpen} />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists?.map((list) => (
            <Card
              key={list.id}
              className="group cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
              onClick={() => handleListClick(list)}
            >
              {/* Cover Image */}
              <div className="relative h-16 overflow-hidden">
                <img
                  src={getDesignerCoverImage(list.id)}
                  alt="Cover"
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform ease-out group-hover:scale-110"
                  style={{ transitionDuration: '3s' }}
                />
                <div
                  className="absolute inset-0 bg-black/20 transition-opacity ease-out group-hover:bg-black/30"
                  style={{ transitionDuration: '3s' }}
                />
              </div>
              <CardHeader className="relative">
                <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setListToEdit(list);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit List
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          if (list.designers && list.designers.length > 0) {
                            const designers = list.designers.map(d => d.designer);
                            exportToCSV(designers, `${list.name}-designers`, designerExportColumns);
                            toast({
                              title: "Export complete",
                              description: `Exported ${designers.length} designers to CSV`,
                            });
                          } else {
                            toast({
                              title: "No designers to export",
                              description: "This list has no designers",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export to CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setListToDelete(list);
                        }}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete List
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle>{list.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {list.description}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex -space-x-2">
                  {list.designers?.slice(0, 5).map(({ designer }) => (
                    <Avatar
                      key={designer.id}
                      className="border-2 border-background"
                    >
                      <AvatarImage src={designer.photoUrl || ""} />
                      <AvatarFallback>
                        {designer.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {(list.designers?.length ?? 0) > 5 && (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground text-xs border-2 border-background">
                      +{(list.designers?.length ?? 0) - 5}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedList && (
        <ViewListDialog
          list={selectedList}
          open={Boolean(selectedList)}
          onOpenChange={handleDialogClose}
        />
      )}

      {listToEdit && (
        <EditListDialog
          list={listToEdit}
          open={Boolean(listToEdit)}
          onOpenChange={(open) => !open && setListToEdit(null)}
        />
      )}

      <AlertDialog
        open={Boolean(listToDelete)}
        onOpenChange={(open) => !open && setListToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this list?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              list and remove all designer associations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteList}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteList.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash className="mr-2 h-4 w-4" />
              )}
              Delete List
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </PageLayout>
    </div>
  );
}

interface ViewListDialogProps {
  list: SelectList;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ViewListDialog({
  list,
  open,
  onOpenChange,
}: ViewListDialogProps) {
  const [location, setLocation] = useLocation();
  const pathParts = location.split("/");
  const workspaceSlug = pathParts[1];
  const [isPublic, setIsPublic] = useState(list.isPublic || false);
  const [editingNotesFor, setEditingNotesFor] = useState<number | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const updateList = useUpdateList();
  const updateNotes = useUpdateListDesignerNotes();
  const { toast } = useToast();
  const origin = window.location.origin;
  const shareUrl = `${origin}/lists/${list.slug || list.id}`;

  const handleSaveNotes = async (designerId: number) => {
    try {
      await updateNotes.mutateAsync({
        listId: list.id,
        designerId,
        notes: notesValue,
      });
      setEditingNotesFor(null);
      setNotesValue("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save notes",
        variant: "destructive",
      });
    }
  };

  const handleStartEditNotes = (designerId: number, currentNotes?: string) => {
    setEditingNotesFor(designerId);
    setNotesValue(currentNotes || "");
  };

  const handleCancelEditNotes = () => {
    setEditingNotesFor(null);
    setNotesValue("");
  };

  const handlePublicToggle = async (checked: boolean) => {
    try {
      await updateList.mutateAsync({
        id: list.id,
        isPublic: checked,
      });
      setIsPublic(checked);
      toast({
        title: "Success",
        description: checked ? "List is now public" : "List is now private",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update list visibility",
        variant: "destructive",
      });
    }
  };

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Success",
      description: "Share URL copied to clipboard",
    });
  };

  const reorderDesigners = useReorderListDesigners();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  type ListDesignerEntry = {
    id: number;
    designer: SelectDesigner;
    notes?: string | null;
    sortOrder?: number | null;
  };

  const [orderedDesigners, setOrderedDesigners] = useState<ListDesignerEntry[]>(() =>
    [...(list.designers || [])].sort((a: any, b: any) => (a.sortOrder ?? a.id) - (b.sortOrder ?? b.id))
  );

  useEffect(() => {
    setOrderedDesigners(
      [...(list.designers || [])].sort((a: any, b: any) => (a.sortOrder ?? a.id) - (b.sortOrder ?? b.id))
    );
  }, [list.designers]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrderedDesigners((prev) => {
      const oldIndex = prev.findIndex((e) => e.designer.id === active.id);
      const newIndex = prev.findIndex((e) => e.designer.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);
      reorderDesigners.mutate({
        listId: list.id,
        orderedDesignerIds: reordered.map((e) => e.designer.id),
      });
      return reordered;
    });
  };

  const [jobUrlInput, setJobUrlInput] = useState("");
  const [isLoadingOg, setIsLoadingOg] = useState(false);
  const [ogData, setOgData] = useState<{ title?: string; description?: string; image?: string; siteName?: string; favicon?: string; url?: string } | null>(
    (list as any).jobDescriptionOgData || null
  );
  const [savedJobUrl, setSavedJobUrl] = useState<string | null>((list as any).jobDescriptionUrl || null);
  const jobUrlInputRef = useRef<HTMLInputElement>(null);

  const handleJobUrlSubmit = async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;

    let fullUrl = trimmed;
    if (!/^https?:\/\//i.test(fullUrl)) {
      fullUrl = `https://${fullUrl}`;
    }

    setIsLoadingOg(true);
    try {
      const res = await fetch(`/api/og-preview?url=${encodeURIComponent(fullUrl)}`, { credentials: "include" });
      const data = await res.json();

      if (res.ok) {
        await updateList.mutateAsync({
          id: list.id,
          jobDescriptionUrl: fullUrl,
          jobDescriptionOgData: data,
        });
        setOgData(data);
        setSavedJobUrl(fullUrl);
        setJobUrlInput("");
        toast({ title: "Job description linked" });
      } else {
        toast({ title: "Couldn't fetch link preview", description: "The URL may not be publicly accessible.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to link job description", variant: "destructive" });
    } finally {
      setIsLoadingOg(false);
    }
  };

  const handleRemoveJobDescription = async () => {
    await updateList.mutateAsync({ id: list.id, jobDescriptionUrl: null, jobDescriptionOgData: null });
    setOgData(null);
    setSavedJobUrl(null);
  };

  const coverDesigners = useMemo(
    () => orderedDesigners.map((e) => ({ photoUrl: e.designer.photoUrl, name: e.designer.name })),
    [orderedDesigners]
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-[900px] max-h-[90vh] flex flex-col overflow-hidden p-0 sm:p-0 gap-0">

          {/* Cover: full-bleed gradient + fanned designer photos — outside scroll */}
          <div className="relative h-60 bg-gradient-to-br from-primary/25 via-primary/10 to-background flex-shrink-0 overflow-visible">
            <div className="absolute inset-0 flex items-center justify-center">
              {coverDesigners.length > 0 ? (
                <DesignerCardFan designers={coverDesigners} />
              ) : (
                <div className="text-muted-foreground/30 text-sm">No designers yet</div>
              )}
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>

            {/* Header */}
            <div className="px-6 pt-5 pb-0">
              <DialogTitle className="text-xl font-bold leading-tight">{list.name}</DialogTitle>
              {list.description && (
                <p className="text-muted-foreground text-sm mt-1">{list.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1.5">
                {orderedDesigners.length} designer{orderedDesigners.length !== 1 ? 's' : ''}
                {orderedDesigners.length > 1 && (
                  <span className="ml-1.5 text-muted-foreground/50">· drag to reorder</span>
                )}
              </p>
            </div>

            {/* Content */}
            <div className="px-6 pb-6 mt-4 space-y-3">

              {/* Job Description Smart Link */}
              {ogData && savedJobUrl ? (
                <div className="group relative">
                  <a
                    href={savedJobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl border border-border hover:border-primary/40 transition-colors overflow-hidden bg-card"
                  >
                    <div className="flex gap-4 p-4">
                      {ogData.image && (
                        <div className="flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden bg-muted hidden sm:block">
                          <img
                            src={ogData.image}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <img
                            src={ogData.favicon}
                            alt=""
                            className="w-4 h-4 rounded-sm flex-shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <span className="text-xs text-muted-foreground font-medium truncate">
                            {ogData.siteName || new URL(savedJobUrl).hostname}
                          </span>
                        </div>
                        <p className="font-semibold text-sm leading-snug line-clamp-2 text-foreground">
                          {ogData.title}
                        </p>
                        {ogData.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {ogData.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </a>
                  <button
                    onClick={(e) => { e.preventDefault(); handleRemoveJobDescription(); }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-background/80 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    title="Remove job description"
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  className="rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors cursor-text"
                  onClick={() => jobUrlInputRef.current?.focus()}
                >
                  {isLoadingOg ? (
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Fetching job details…</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-1">
                      <UserPlus className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                      <input
                        ref={jobUrlInputRef}
                        type="url"
                        value={jobUrlInput}
                        onChange={(e) => setJobUrlInput(e.target.value)}
                        onPaste={(e) => {
                          const pasted = e.clipboardData.getData("text");
                          if (pasted.trim()) {
                            e.preventDefault();
                            setJobUrlInput(pasted.trim());
                            handleJobUrlSubmit(pasted.trim());
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleJobUrlSubmit(jobUrlInput);
                        }}
                        placeholder="Paste a job description URL…"
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 py-3"
                      />
                      {jobUrlInput && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => handleJobUrlSubmit(jobUrlInput)}
                        >
                          Add
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Designer list with drag-and-drop */}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext
                  items={orderedDesigners.map((e) => e.designer.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {orderedDesigners.map((entry) => (
                      <SortableDesignerCard
                        key={entry.designer.id}
                        designer={{ ...entry.designer, notes: entry.notes }}
                        editingNotesFor={editingNotesFor}
                        notesValue={notesValue}
                        setNotesValue={setNotesValue}
                        onEditNotes={handleStartEditNotes}
                        onSaveNotes={handleSaveNotes}
                        onNavigate={(d) => setLocation(`/${workspaceSlug}/designers/${slugify(d.name)}`)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {/* Share / visibility footer */}
              <div className="border-t pt-4 mt-1">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="public"
                      checked={isPublic}
                      onCheckedChange={handlePublicToggle}
                    />
                    <label
                      htmlFor="public"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Share via URL
                    </label>
                  </div>

                  {isPublic && (
                    <div className="flex items-center space-x-2">
                      <Input
                        readOnly
                        value={shareUrl}
                        className="font-mono text-sm"
                      />
                      <Button variant="outline" size="icon" onClick={copyShareUrl}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const listIdentifier = list.slug || String(list.id);
                          setLocation(`/${workspaceSlug}/lists/${listIdentifier}/email`);
                        }}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
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

interface EditListDialogProps {
  list: SelectList;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function EditListDialog({ list, open, onOpenChange }: EditListDialogProps) {
  const updateList = useUpdateList();
  const addDesigner = useAddDesignersToList();
  const { data: designers } = useDesigners();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const pathParts = location.split("/");
  const workspaceSlug = pathParts[1];
  const [designerNotes, setDesignerNotes] = useState<Record<number, string | undefined>>({});
  
  // Track changes for batch operations
  const [currentDesigners, setCurrentDesigners] = useState(list.designers || []);
  const [designersToAdd, setDesignersToAdd] = useState<number[]>([]);
  const [designersToRemove, setDesignersToRemove] = useState<number[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const form = useForm({
    defaultValues: {
      name: list.name,
      description: list.description || "",
    },
  });

  const onSubmit = async (values: {
    name: string;
    description: string;
  }) => {
    try {
      // Update list details
      await updateList.mutateAsync({
        id: list.id,
        ...values,
      });

      // Apply designer changes if any
      if (hasChanges) {
        // Add new designers
        if (designersToAdd.length > 0) {
          await Promise.all(
            designersToAdd.map(designerId =>
              addDesigner.mutateAsync({
                listId: list.id,
                designerId,
                notes: designerNotes[designerId],
              })
            )
          );
        }

        // Remove designers
        if (designersToRemove.length > 0) {
          await Promise.all(
            designersToRemove.map(designerId =>
              fetch(`/api/lists/${list.id}/designers/${designerId}`, {
                method: 'DELETE',
              })
            )
          );
        }

        // Reset changes tracking
        setDesignersToAdd([]);
        setDesignersToRemove([]);
        setHasChanges(false);
      }

      toast({
        title: "Success",
        description: "All changes saved successfully",
      });
      
      form.reset();
      // Refresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/lists', workspaceSlug] });
      await queryClient.invalidateQueries({ queryKey: ['/api/designers'] });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save changes",
        variant: "destructive",
      });
    }
  };

  const handleAddDesigner = (designerId: number) => {
    // Add to pending additions
    setDesignersToAdd(prev => [...prev, designerId]);
    setHasChanges(true);
  };

  const handleUpdateNotes = async (designerId: number, notes: string) => {
    try {
      // This function is not currently used - notes are updated via the list-designer relationship
      toast({
        title: "Success",
        description: "Notes updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update notes",
        variant: "destructive",
      });
    }
  };

  const handleRemoveDesigner = (designerId: number) => {
    // Add to pending removals
    setDesignersToRemove(prev => [...prev, designerId]);
    setHasChanges(true);
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl sm:w-[95vw] max-h-[90vh] sm:max-h-[90vh] md:max-h-[85vh] flex flex-col !p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Edit List</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 pb-20" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
          <div className="space-y-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>List Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Add</h3>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <DesignerSelect 
                        onSelect={handleAddDesigner}
                        excludeDesignerIds={[
                          ...(list.designers?.map(d => d.designer.id) || []),
                          ...designersToAdd
                        ]}
                      />
                    </div>
                  </div>

                  {/* Show pending additions */}
                  {designersToAdd.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-green-600">Pending Additions</h4>
                      <div className="space-y-2">
                        {designersToAdd.map((designerId) => {
                          const designer = designers?.find(d => d.id === designerId);
                          if (!designer) return null;
                          return (
                            <div key={designerId} className="flex items-center justify-between p-2 rounded-md border border-green-200 bg-green-50">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={designer.photoUrl || ""} />
                                  <AvatarFallback>
                                    {designer.name.split(" ").map((n) => n[0]).join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{designer.name}</p>
                                  <p className="text-xs text-muted-foreground">{designer.title}</p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setDesignersToAdd(prev => prev.filter(id => id !== designerId));
                                  setHasChanges(designersToAdd.length > 1 || designersToRemove.length > 0);
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea className="resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

              </form>
            </Form>

            <div className="space-y-2">
              <h3 className="font-medium">Current Designers</h3>
              <div className="space-y-2">
                {list.designers?.map(({ designer, notes }) => {
                  const isBeingRemoved = designersToRemove.includes(designer.id);
                  return (
                    <div
                      key={designer.id}
                      className={`flex flex-col p-2 rounded-md border ${
                        isBeingRemoved ? 'border-red-200 bg-red-50 opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage src={designer.photoUrl || ""} />
                            <AvatarFallback>
                              {designer.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{designer.name}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {designer.title} {designer.company && `• ${designer.company}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const currentNotes = designerNotes[designer.id];
                              setDesignerNotes((prev) => {
                                const newNotes = { ...prev };
                                if (currentNotes === undefined) {
                                  newNotes[designer.id] = notes || "";
                                } else {
                                  delete newNotes[designer.id];
                                }
                                return newNotes;
                              });
                            }}
                          >
                            {designerNotes[designer.id] !== undefined
                              ? "Cancel"
                              : notes
                                ? "Edit Notes"
                                : "Add Notes"}
                          </Button>
                          {isBeingRemoved ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDesignersToRemove(prev => prev.filter(id => id !== designer.id));
                                setHasChanges(designersToAdd.length > 0 || designersToRemove.length > 1);
                              }}
                            >
                              Undo Remove
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveDesigner(designer.id)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>

                      {designerNotes[designer.id] !== undefined && (
                        <div className="mt-2 space-y-2">
                          <Textarea
                            placeholder="Add notes about this designer..."
                            value={designerNotes[designer.id]}
                            onChange={(e) =>
                              setDesignerNotes((prev) => ({
                                ...prev,
                                [designer.id]: e.target.value,
                              }))
                            }
                            className="min-h-[80px] resize-none"
                          />
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              onClick={() => {
                                handleUpdateNotes(
                                  designer.id,
                                  designerNotes[designer.id] || "",
                                );
                                setDesignerNotes((prev) => {
                                  const newNotes = { ...prev };
                                  delete newNotes[designer.id];
                                  return newNotes;
                                });
                              }}
                            >
                              Save Notes
                            </Button>
                          </div>
                        </div>
                      )}

                      {notes && designerNotes[designer.id] === undefined && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating Footer */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex items-center justify-between rounded-b-lg">
          <div className="flex-1">
            {hasChanges && (
              <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2 inline-block">
                <span className="font-medium">Pending: </span>
                <span className="text-xs">
                  {designersToAdd.length > 0 && `+${designersToAdd.length}`}
                  {designersToAdd.length > 0 && designersToRemove.length > 0 && ', '}
                  {designersToRemove.length > 0 && `-${designersToRemove.length}`}
                  {' '}designer{(designersToAdd.length + designersToRemove.length) > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
          <Button 
            onClick={form.handleSubmit(onSubmit)}
            disabled={updateList.isPending || addDesigner.isPending}
            className="ml-4"
          >
            {(updateList.isPending || addDesigner.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


interface CreateListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CreateListDialog({ open, onOpenChange }: CreateListDialogProps) {
  const createList = useCreateList();
  const addDesigner = useAddDesignersToList();
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const [selectedDesignerIds, setSelectedDesignerIds] = useState<number[]>([]);

  const onSubmit = async (values: { name: string; description: string }) => {
    try {
      const list = await createList.mutateAsync({
        ...values,
        designerIds: selectedDesignerIds,
      });

      toast({
        title: "Success",
        description: "List created successfully",
      });
      form.reset();
      setSelectedDesignerIds([]);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create list",
        variant: "destructive",
      });
    }
  };

  const handleAddDesigner = (designerId: number) => {
    if (!selectedDesignerIds.includes(designerId)) {
      setSelectedDesignerIds([...selectedDesignerIds, designerId]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create list
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Create new list</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea className="resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-5">
                <h3 className="font-medium">Add Designers</h3>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <DesignerSelect onSelect={handleAddDesigner} />
                  </div>
                </div>
                {selectedDesignerIds.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Selected Designers</h4>
                    <div className="text-sm text-muted-foreground">
                      {selectedDesignerIds.length} designer
                      {selectedDesignerIds.length !== 1 ? "s" : ""} selected
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="submit" disabled={createList.isPending}>
                  {createList.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create List
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
