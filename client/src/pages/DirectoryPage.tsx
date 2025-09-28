import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  useDesigners,
  useCreateDesigner,
  useUpdateDesigner,
  useDeleteDesigners,
} from "@/hooks/use-designer";
import { useLists, useCreateList, useAddDesignersToList } from "@/hooks/use-lists";
import { useWorkspacePermissions } from "@/hooks/use-permissions";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import DesignerCard from "@/components/DesignerCard";
import SkillsInput from "@/components/SkillsInput";
import Navigation from "@/components/Navigation";
import { Link, useParams } from "wouter";
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { useForm } from "react-hook-form";
import {
  Loader2,
  Plus,
  Trash,
  ListPlus,
  Sparkles,
  Grid3X3,
  List,
  Table,
  Edit,
  ChevronDown,
  Upload,
} from "lucide-react";
import { slugify } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import EnrichmentDialog from "@/components/EnrichmentDialog";
import LinkedInImportModal from "@/components/LinkedInImportModal";
import { SelectDesigner } from "@db/schema";

// Helper function to normalize LinkedIn URLs
const normalizeLinkedInUrl = (url: string): string => {
  if (!url || url.trim() === "") return "";

  const trimmed = url.trim();

  // If it already starts with http:// or https://, return as is
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // If it starts with linkedin.com or www.linkedin.com, add https://
  if (
    trimmed.startsWith("linkedin.com") ||
    trimmed.startsWith("www.linkedin.com")
  ) {
    return `https://${trimmed}`;
  }

  // If it looks like a LinkedIn profile path (/in/username), add the full domain
  if (trimmed.startsWith("/in/")) {
    return `https://www.linkedin.com${trimmed}`;
  }

  // If it's just a username (no slashes), assume it's a LinkedIn profile
  if (!trimmed.includes("/") && !trimmed.includes(".")) {
    return `https://www.linkedin.com/in/${trimmed}`;
  }

  // For any other case, assume https:// is needed
  return `https://${trimmed}`;
};

const EXPERIENCE_LEVELS = [
  "Mid-level",
  "Senior",
  "Staff",
  "Senior Staff",
  "Principal",
  "Manager",
  "Director",
  "Senior Director",
  "VP",
];

const designerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  title: z.string().min(1, "Title is required"),
  email: z.union([
    z.string().email("Please enter a valid email address"),
    z.literal(""),
  ]),
  location: z.string().optional(),
  company: z.string().optional(),
  level: z.string().min(1, "Level is required"),
  website: z.string().optional(),
  linkedIn: z.string().optional(),
  skills: z.array(z.string()).default([]),
  notes: z.string().optional(),
  available: z.boolean().default(false),
});

export default function DirectoryPage() {
  const { workspaceSlug } = useParams();
  const { data: designers, isLoading } = useDesigners();
  const updateDesigner = useUpdateDesigner();
  const deleteDesigners = useDeleteDesigners();
  const permissions = useWorkspacePermissions(workspaceSlug);
  const [searchTerm, setSearchTerm] = useState("");
  const [designerToEdit, setDesignerToEdit] = useState<SelectDesigner | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showAddToListDialog, setShowAddToListDialog] = useState(false);
  const [showEnrichment, setShowEnrichment] = useState(false);
  const [enrichmentDesigner, setEnrichmentDesigner] =
    useState<SelectDesigner | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showLinkedInImport, setShowLinkedInImport] = useState(false);
  const { toast } = useToast();
  const scrollPositionRef = useRef<number>(0);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Column widths for resizable table
  const [columnWidths, setColumnWidths] = useState({
    checkbox: 40,
    name: 250,
    email: 200,
    website: 200,
    linkedin: 200,
    tags: 300,
  });
  
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<{ column: string; startX: number; startWidth: number } | null>(null);
  
  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editingValues, setEditingValues] = useState<{ [key: string]: any }>({});

  // Inline editing handlers
  const startEditing = useCallback((id: number, field: string, currentValue: any) => {
    setEditingCell({ id, field });
    setEditingValues({ [`${id}-${field}`]: currentValue || '' });
  }, []);

  const updateEditingValue = useCallback((key: string, value: any) => {
    setEditingValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingCell(null);
    setEditingValues({});
  }, []);

  const saveEdit = useCallback(async (id: number, field: string, newValue: any) => {
    try {
      const designer = designers?.find(d => d.id === id);
      if (!designer) return;

      // Create form data for the mutation
      const formData = new FormData();
      formData.append('name', designer.name);
      formData.append('title', designer.title);
      formData.append('email', designer.email || '');
      formData.append('location', designer.location || '');
      formData.append('company', designer.company || '');
      formData.append('level', designer.level);
      formData.append('website', designer.website || '');
      formData.append('linkedIn', designer.linkedIn || '');
      formData.append('notes', designer.notes || '');
      formData.append('available', designer.available ? 'true' : 'false');

      // Handle skills array properly
      let skillsValue = designer.skills;
      if (field === 'skills') {
        skillsValue = Array.isArray(newValue) ? newValue : [];
      }
      
      // Convert skills array to JSON string for form data
      if (Array.isArray(skillsValue)) {
        formData.append('skills', JSON.stringify(skillsValue));
      } else {
        formData.append('skills', skillsValue || '[]');
      }

      // Update the specific field being edited
      if (field !== 'skills') {
        formData.set(field, newValue || '');
      }

      await updateDesigner.mutateAsync({ id, formData });
      
      setEditingCell(null);
      setEditingValues({});
      
      toast({
        title: "Updated successfully",
        description: `${field} has been updated`,
      });
    } catch (error) {
      toast({
        title: "Error updating",
        description: "Failed to save changes",
        variant: "destructive",
      });
    }
  }, [designers, updateDesigner, toast]);

  // Column resizing handlers
  const handleResizeStart = useCallback((column: string, e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartRef.current = {
      column,
      startX: e.clientX,
      startWidth: columnWidths[column as keyof typeof columnWidths],
    };
  }, [columnWidths]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizeStartRef.current) return;
    
    e.preventDefault();
    const { column, startX, startWidth } = resizeStartRef.current;
    const deltaX = e.clientX - startX;
    const newWidth = Math.max(50, startWidth + deltaX);
    
    setColumnWidths(prev => ({
      ...prev,
      [column]: newWidth,
    }));
  }, [isResizing]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    resizeStartRef.current = null;
  }, []);

  // Double-click auto-fit handler
  const handleDoubleClickResize = useCallback((column: string) => {
    // Simple auto-fit logic - could be enhanced to measure actual content
    const autoSizes = {
      checkbox: 40,
      name: 250,
      email: 220,
      website: 180,
      linkedin: 200,
      tags: 300,
    };
    
    setColumnWidths(prev => ({
      ...prev,
      [column]: autoSizes[column as keyof typeof autoSizes] || 200,
    }));
  }, []);

  // Add mouse event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Add scroll listener to detect when page is scrolled
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 10;
      setIsScrolled(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial scroll position
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredDesigners =
    designers?.filter((designer) => {
      if (!searchTerm.trim()) return true;

      const searchLower = searchTerm.toLowerCase();

      // Search in name, title, and company
      const matchesBasicInfo =
        designer.name.toLowerCase().includes(searchLower) ||
        designer.title.toLowerCase().includes(searchLower) ||
        designer.company?.toLowerCase().includes(searchLower);

      // Search in skills
      const skills = (() => {
        if (Array.isArray(designer.skills)) {
          return designer.skills;
        }
        if (typeof designer.skills === "string" && designer.skills.trim()) {
          try {
            // Try parsing as JSON first
            return JSON.parse(designer.skills);
          } catch {
            // If JSON parsing fails, treat as comma-separated string
            return designer.skills
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s);
          }
        }
        return [];
      })();
      const matchesSkills = skills.some((skill) =>
        skill.toLowerCase().includes(searchLower),
      );

      return matchesBasicInfo || matchesSkills;
    }) || [];

  const handleDeleteSelected = async () => {
    try {
      await deleteDesigners.mutateAsync(selectedIds);
      toast({
        title: "Success",
        description: "Selected designers have been deleted",
      });
      setSelectedIds([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete designers",
        variant: "destructive",
      });
    }
  };

  const toggleDesignerSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((designerId) => designerId !== id)
        : [...prev, id],
    );
  };

  return (
    <div>
      <Navigation />
      
      {/* Main container with adjusted padding for fixed nav */}
      <div className="pt-16">
        {/* Title section */}
        <div className="container mx-auto px-4 sm:px-6 pt-6 pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Directory</h1>
        </div>
        
        {/* Sticky action bar */}
        <div className={`sticky top-16 z-40 transition-all duration-300 ${
          isScrolled ? 'bg-nav-cream border-b border-gray-200 shadow-sm' : ''
        }`}>
          <div className="container mx-auto px-4 sm:px-6 py-3">
            <div className="flex flex-wrap gap-2 items-center">
              {/* View Toggle */}
              <div className="flex border rounded-lg bg-white">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Divider when items are selected */}
              {selectedIds.length > 0 && (
                <div className="w-px h-8 bg-gray-300 mx-2" />
              )}

              {selectedIds.length > 0 && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => setShowAddToListDialog(true)}
                    className="min-h-[36px]"
                  >
                    <ListPlus className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Add to list</span> (
                    {selectedIds.length})
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteSelected}
                    disabled={deleteDesigners.isPending}
                    className="min-h-[36px]"
                  >
                    {deleteDesigners.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Trash className="mr-2 h-4 w-4" />
                    ({selectedIds.length})
                  </Button>
                </>
              )}
              
              {/* Search bar */}
              <div className="flex-1 mx-4">
                <Input
                  placeholder="Search designers by name, title, company, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>
              
              {/* Add designer dropdown - pushed to the right */}
              <div className="flex-shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="gap-2 min-h-[36px]">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Add designer</span>
                      <span className="sm:hidden">Add</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <Dialog>
                      <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add designer
                        </DropdownMenuItem>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl h-full sm:max-h-[85vh] flex flex-col">
                        <DialogHeader className="flex-shrink-0">
                          <DialogTitle>Add new designer</DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto pr-2">
                          <AddDesignerDialog
                            designer={null}
                            onClose={() => {}}
                            permissions={permissions}
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                    <DropdownMenuItem onClick={() => setShowLinkedInImport(true)}>
                      <Upload className="mr-2 h-4 w-4" />
                      Import LinkedIn
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Content section */}
        <div className="container mx-auto px-4 sm:px-6 pb-8 mt-6">
          {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredDesigners.map((designer) => (
              <DesignerCard
                key={designer.id}
                designer={designer}
                onEdit={setDesignerToEdit}
                onEnrich={(designer) => {
                  setEnrichmentDesigner(designer);
                  setShowEnrichment(true);
                }}
                showCheckbox={true}
                isSelected={selectedIds.includes(designer.id)}
                onToggleSelect={toggleDesignerSelection}
              />
            ))}
          </div>
        ) : (
          <DesignerTable
            designers={filteredDesigners}
            workspaceSlug={workspaceSlug}
            onEdit={setDesignerToEdit}
            onEnrich={(designer) => {
              setEnrichmentDesigner(designer);
              setShowEnrichment(true);
            }}
            selectedIds={selectedIds}
            onToggleSelect={toggleDesignerSelection}
            columnWidths={columnWidths}
            onResizeStart={handleResizeStart}
            onDoubleClickResize={handleDoubleClickResize}
            editingCell={editingCell}
            onStartEdit={startEditing}
            onSaveEdit={saveEdit}
            onCancelEdit={cancelEditing}
            editingValues={editingValues}
            onEditingValueChange={updateEditingValue}
          />
        )}
        </div>

        <Dialog
          open={!!designerToEdit}
          onOpenChange={(open) => {
            if (!open) {
              setDesignerToEdit(null);
              // Force scroll restoration with proper cleanup
              setTimeout(() => {
                document.body.style.overflow = "";
                document.body.style.paddingRight = "";
                document.body.classList.remove("overflow-hidden");
                // Restore scroll position if needed
                window.scrollTo(0, scrollPositionRef.current);
              }, 50);
            } else {
              // Store current scroll position when opening
              scrollPositionRef.current = window.scrollY;
            }
          }}
        >
          <DialogContent className="sm:max-w-2xl h-full sm:max-h-[85vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Edit Designer</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-2">
              <AddDesignerDialog
                designer={designerToEdit}
                onClose={() => setDesignerToEdit(null)}
                permissions={permissions}
              />
            </div>
          </DialogContent>
        </Dialog>

        <AddToListDialog
          open={showAddToListDialog}
          onOpenChange={setShowAddToListDialog}
          designerIds={selectedIds}
          onSuccess={() => setSelectedIds([])}
        />

        <EnrichmentDialog
          open={showEnrichment}
          onOpenChange={setShowEnrichment}
          designer={enrichmentDesigner}
          onSuccess={() => {
            setShowEnrichment(false);
            setEnrichmentDesigner(null);
          }}
        />

        {/* LinkedIn Import Modal */}
        <Dialog open={showLinkedInImport} onOpenChange={setShowLinkedInImport}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import from LinkedIn
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <LinkedInImportModal
                onClose={() => setShowLinkedInImport(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

interface AddDesignerDialogProps {
  designer?: SelectDesigner | null;
  onClose: () => void;
  permissions: ReturnType<typeof useWorkspacePermissions>;
}

function AddDesignerDialog({
  designer,
  onClose,
  permissions,
}: AddDesignerDialogProps) {
  const { toast } = useToast();
  const createDesigner = useCreateDesigner();
  const updateDesigner = useUpdateDesigner();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [isEnrichingProfile, setIsEnrichingProfile] = useState(false);

  const form = useForm({
    resolver: zodResolver(designerSchema),
    defaultValues: {
      name: designer?.name || "",
      email: designer?.email || "",
      title: designer?.title || "",
      location: designer?.location || "",
      company: designer?.company || "",
      level: designer?.level || "",
      website: designer?.website || "",
      linkedIn: designer?.linkedIn || "",
      skills: Array.isArray(designer?.skills) ? designer.skills : [],
      notes: designer?.notes || "",
      available: designer?.available ?? false,
    },
  });

  useEffect(() => {
    if (designer) {
      form.reset({
        name: designer.name,
        email: designer.email || "",
        title: designer.title,
        location: designer.location || "",
        company: designer.company || "",
        level: designer.level,
        website: designer.website || "",
        linkedIn: designer.linkedIn || "",
        skills: Array.isArray(designer.skills) ? designer.skills : [],
        notes: designer.notes || "",
        available: designer.available ?? false,
      });
    }
  }, [designer, form]);

  const handleClose = () => {
    form.reset();
    setPhotoFile(null);
    onClose();

    // Force comprehensive scroll restoration after modal closes
    setTimeout(() => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      document.body.classList.remove("overflow-hidden");
      document.documentElement.style.overflow = "";
      document.documentElement.style.paddingRight = "";
      document.documentElement.classList.remove("overflow-hidden");

      // Force repaint to ensure scroll is restored
      document.body.offsetHeight;
    }, 150);
  };

  const onSubmit = async (values: any) => {
    try {
      const formData = new FormData();
      if (photoFile) {
        formData.append("photo", photoFile);
      }

      const designerData = {
        name: values.name,
        title: values.title,
        location: values.location || "",
        company: values.company || "",
        level: values.level,
        website: values.website || "",
        linkedIn: normalizeLinkedInUrl(values.linkedIn) || "",
        email: values.email || "",
        skills: values.skills || [],
        notes: values.notes || "",
        available: values.available,
      };

      formData.append("data", JSON.stringify(designerData));

      if (designer) {
        await updateDesigner.mutateAsync({ id: designer.id, formData });
        toast({
          title: "Success",
          description: "Designer profile updated successfully",
        });
      } else {
        await createDesigner.mutateAsync(formData);
        toast({
          title: "Success",
          description: "Designer profile created successfully",
        });
        // Close modal immediately after successful creation
        handleClose();
        return;
      }
      handleClose();
    } catch (error: any) {
      console.error("Form submission error:", error);
      const errorMessage =
        error.message ||
        error.response?.data?.message ||
        "Failed to create designer profile";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  const handleAISuggestNotes = async (field: any) => {
    setIsGeneratingNotes(true);
    try {
      const currentValues = form.getValues();
      const bio = currentValues.notes || "";
      const experience = `${currentValues.title} at ${currentValues.company || "Unknown Company"}. ${currentValues.level} level designer.`;

      const response = await fetch("/api/designers/generate-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bio, experience }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate AI suggestions");
      }

      const suggestions = await response.json();

      // Generate enhanced notes based on current information
      const enhancedNotes = `## Profile Summary
${currentValues.name} is a ${currentValues.level} ${currentValues.title}${currentValues.company ? ` at ${currentValues.company}` : ""}${currentValues.location ? ` based in ${currentValues.location}` : ""}.

## Skills & Expertise
${suggestions.skills.length > 0 ? suggestions.skills.map((skill: string) => `- ${skill}`).join("\n") : "Skills to be added based on experience and portfolio."}

## Professional Background
${bio || "Professional background and experience details to be added."}

## Contact & Availability
${currentValues.email ? `Email: ${currentValues.email}\n` : ""}${currentValues.available ? "Currently open to new opportunities." : "Availability status to be confirmed."}`;

      field.onChange(enhancedNotes);

      toast({
        title: "AI Notes Generated",
        description:
          "Professional notes have been generated based on the current profile information.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate AI suggestions",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  const handleEnrichProfile = async () => {
    setIsEnrichingProfile(true);
    try {
      const currentValues = form.getValues();

      if (!currentValues.name.trim()) {
        toast({
          title: "Error",
          description: "Please enter a name before enriching the profile",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch("/api/designers/enrich-new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: currentValues.name }),
      });

      if (!response.ok) {
        throw new Error("Failed to enrich profile");
      }

      const enrichment = await response.json();

      if (enrichment.success && enrichment.data) {
        const data = enrichment.data;

        // Update form with enriched data (only if current field is empty)
        if (data.title && !currentValues.title) {
          form.setValue("title", data.title);
        }
        if (data.company && !currentValues.company) {
          form.setValue("company", data.company);
        }
        if (data.location && !currentValues.location) {
          form.setValue("location", data.location);
        }
        if (data.email && !currentValues.email) {
          form.setValue("email", data.email);
        }
        if (data.portfolioUrl && !currentValues.website) {
          form.setValue("website", data.portfolioUrl);
        }
        if (data.socialLinks?.linkedin && !currentValues.linkedIn) {
          form.setValue("linkedIn", data.socialLinks.linkedin);
        }
        if (data.bio && !currentValues.notes) {
          form.setValue("notes", data.bio);
        }
        if (data.skills && data.skills.length > 0) {
          const currentSkills = form.getValues("skills") || [];
          const newSkills = [...new Set([...currentSkills, ...data.skills])];
          form.setValue("skills", newSkills);
        }

        toast({
          title: "Profile Enriched",
          description: `Found information with ${Math.round(enrichment.confidence * 100)}% confidence. Empty fields have been populated.`,
        });
      } else {
        toast({
          title: "No Additional Information",
          description:
            "Could not find additional information for this person online.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to enrich profile",
        variant: "destructive",
      });
    } finally {
      setIsEnrichingProfile(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <label htmlFor="photo" className="block text-sm font-medium">
              Photo
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleEnrichProfile}
              disabled={isEnrichingProfile}
            >
              {isEnrichingProfile ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enriching...
                </>
              ) : (
                <>AI enrich profile</>
              )}
            </Button>
          </div>
          <input
            type="file"
            id="photo"
            accept="image/*"
            onChange={handlePhotoChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Name <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Title <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Level <span className="text-red-500">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input {...field} type="url" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="linkedIn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>LinkedIn URL</FormLabel>
                <FormControl>
                  <Input {...field} type="url" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="skills"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Skills</FormLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      const currentValues = form.getValues();
                      const bio = currentValues.notes || "";
                      const experience = `${currentValues.title} at ${currentValues.company || "Unknown Company"}`;

                      const response = await fetch(
                        "/api/designers/generate-skills",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          body: JSON.stringify({ bio, experience }),
                        },
                      );

                      if (response.ok) {
                        const { skills } = await response.json();
                        if (skills && skills.length > 0) {
                          const currentSkills = field.value || [];
                          const newSkills = [
                            ...new Set([...currentSkills, ...skills]),
                          ];
                          field.onChange(newSkills);
                          toast({
                            title: "Skills Generated",
                            description: `Added ${skills.length} suggested skills`,
                          });
                        }
                      }
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to generate skills",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Suggest
                </Button>
              </div>
              <FormControl>
                <SkillsInput
                  value={Array.isArray(field.value) ? field.value : []}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {permissions?.canAccessNotes && (
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Notes</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAISuggestNotes(field)}
                    disabled={isGeneratingNotes}
                  >
                    {isGeneratingNotes ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>AI suggest</>
                    )}
                  </Button>
                </div>
                <FormControl>
                  <MarkdownEditor
                    value={field.value}
                    onChange={(value) => field.onChange(value || "")}
                    data-color-mode="light"
                    preview="edit"
                    height={200}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {permissions?.canAccessOpenToRoles && (
          <FormField
            control={form.control}
            name="available"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="!mt-0">Open to Roles</FormLabel>
              </FormItem>
            )}
          />
        )}

        <div className="flex flex-col space-y-3 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createDesigner.isPending || updateDesigner.isPending}
            className="w-full sm:w-auto"
          >
            {(createDesigner.isPending || updateDesigner.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {designer ? "Update designer" : "Create designer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface AddToListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  designerIds: number[];
  onSuccess: () => void;
}

function AddToListDialog({
  open,
  onOpenChange,
  designerIds,
  onSuccess,
}: AddToListDialogProps) {
  const { data: lists } = useLists();
  const createList = useCreateList();
  const addDesignersToList = useAddDesignersToList();
  const { toast } = useToast();
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSelectedListId(null);
      form.reset();
    }
  }, [open, form]);

  const handleAddToExistingList = async () => {
    if (!selectedListId) {
      toast({
        title: "Error",
        description: "Please select a list",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      await Promise.all(
        designerIds.map((designerId) =>
          addDesignersToList.mutateAsync({
            listId: selectedListId,
            designerId,
          }),
        ),
      );

      toast({
        title: "Success",
        description: `Added ${designerIds.length} designer${designerIds.length > 1 ? 's' : ''} to list`,
      });
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add designers to list",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateNewList = async (values: { name: string; description: string }) => {
    setIsProcessing(true);
    try {
      const list = await createList.mutateAsync(values);

      await Promise.all(
        designerIds.map((designerId) =>
          addDesignersToList.mutateAsync({
            listId: list.id,
            designerId,
          }),
        ),
      );

      toast({
        title: "Success",
        description: "List created and designers added successfully",
      });
      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create list",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const defaultTab = lists && lists.length > 0 ? "existing" : "new";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Add {designerIds.length} designer{designerIds.length > 1 ? 's' : ''} to list
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue={defaultTab} className="w-full">
          {lists && lists.length > 0 && (
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">Existing list</TabsTrigger>
              <TabsTrigger value="new">New list</TabsTrigger>
            </TabsList>
          )}
          
          {lists && lists.length > 0 && (
            <TabsContent value="existing" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select a list</label>
                <Select 
                  value={selectedListId?.toString()} 
                  onValueChange={(value) => setSelectedListId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a list..." />
                  </SelectTrigger>
                  <SelectContent>
                    {lists.map((list) => (
                      <SelectItem key={list.id} value={list.id.toString()}>
                        <div className="flex items-center">
                          <span>{list.name}</span>
                          {list.designerCount > 0 && (
                            <span className="text-muted-foreground ml-2">
                              ({list.designerCount} designer{list.designerCount !== 1 ? 's' : ''})
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddToExistingList}
                  disabled={!selectedListId || isProcessing}
                >
                  {isProcessing && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add to list
                </Button>
              </div>
            </TabsContent>
          )}
          
          <TabsContent value="new" className={lists && lists.length > 0 ? "mt-4" : ""}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateNewList)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  rules={{ required: "List name is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>List name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Design Technologists" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Add a description..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isProcessing}
                  >
                    {isProcessing && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create list
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// List view component for designers
function DesignerListItem({
  designer,
  workspaceSlug,
  onEdit,
  onEnrich,
  isSelected,
  onToggleSelect,
}: {
  designer: SelectDesigner;
  workspaceSlug: string;
  onEdit: (designer: SelectDesigner) => void;
  onEnrich: (designer: SelectDesigner) => void;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
}) {
  const skills = (() => {
    if (Array.isArray(designer.skills)) {
      return designer.skills;
    }
    if (typeof designer.skills === "string" && designer.skills.trim()) {
      try {
        // Try parsing as JSON first
        return JSON.parse(designer.skills);
      } catch {
        // If JSON parsing fails, treat as comma-separated string
        return designer.skills
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s);
      }
    }
    return [];
  })();

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on checkbox or edit button
    if (
      (e.target as HTMLElement).closest('input[type="checkbox"]') ||
      (e.target as HTMLElement).closest("button")
    ) {
      return;
    }
    // Navigate to designer details page
    window.location.href = `/${workspaceSlug}/directory/${slugify(designer.name)}`;
  };

  return (
    <div
      className={`relative border rounded-lg p-4 sm:p-6 hover:shadow-md transition-all group cursor-pointer ${
        isSelected ? "ring-2 ring-primary bg-primary/5" : "bg-white"
      }`}
      onClick={handleClick}
    >
      {/* Checkbox in top-left */}
      <div className="absolute top-3 left-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(designer.id)}
        />
      </div>

      {/* Edit button on hover in top-right */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(designer);
          }}
          className="h-10 w-10 p-0 min-h-[44px]"
        >
          <Edit className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-start space-x-4 pl-8 sm:pl-10">
        <div className="flex-shrink-0">
          {designer.photoUrl ? (
            <img
              src={designer.photoUrl}
              alt={designer.name}
              className="w-14 h-14 sm:w-12 sm:h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-14 h-14 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {designer.name.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name */}
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
            {designer.name}
          </h3>

          {/* Title at Company on same line */}
          {(designer.title || designer.company) && (
            <p className="text-sm text-gray-600 truncate">
              {designer.title && designer.company
                ? `${designer.title} at ${designer.company}`
                : designer.title || designer.company}
            </p>
          )}

          {/* Location on third line */}
          {designer.location && (
            <p className="text-sm text-gray-500 truncate">
              {designer.location}
            </p>
          )}

          {/* Skills */}
          {skills && skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {skills.slice(0, 6).map((skill: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {skills.length > 6 && (
                <Badge variant="outline" className="text-xs">
                  +{skills.length - 6} more
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Available badge on the right */}
        <div className="flex-shrink-0">
          {designer.available && (
            <Badge variant="default" className="mt-1">
              Available
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// EditableCell component for inline editing
interface EditableCellProps {
  value: any;
  field: string;
  designerId: number;
  isEditing: boolean;
  onStartEdit: (id: number, field: string, value: any) => void;
  onSave: (id: number, field: string, value: any) => void;
  onCancel: () => void;
  editingValue: any;
  onEditingValueChange: (value: any) => void;
  type?: 'text' | 'email' | 'url' | 'tags';
  className?: string;
}

function EditableCell({ 
  value, 
  field, 
  designerId, 
  isEditing, 
  onStartEdit, 
  onSave, 
  onCancel,
  editingValue,
  onEditingValueChange,
  type = 'text',
  className = ''
}: EditableCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSave(designerId, field, editingValue);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = () => {
    onSave(designerId, field, editingValue);
  };

  if (isEditing) {
    if (type === 'tags') {
      return (
        <div className={`py-2 px-3 ${className}`}>
          <Input
            ref={inputRef}
            value={Array.isArray(editingValue) ? editingValue.join(', ') : ''}
            onChange={(e) => {
              const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
              onEditingValueChange(tags);
            }}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder="Enter tags separated by commas"
            className="text-xs border-blue-300 focus:border-blue-500"
          />
        </div>
      );
    }

    return (
      <div className={`py-2 px-3 ${className}`}>
        <Input
          ref={inputRef}
          value={editingValue}
          onChange={(e) => onEditingValueChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          type={type === 'email' ? 'email' : type === 'url' ? 'url' : 'text'}
          placeholder={`Enter ${field}`}
          className="text-sm border-blue-300 focus:border-blue-500"
        />
      </div>
    );
  }

  // Display mode
  if (type === 'tags' && Array.isArray(value)) {
    return (
      <div 
        className={`py-2 px-3 cursor-text hover:bg-gray-50 ${className}`}
        onClick={() => onStartEdit(designerId, field, value)}
      >
        {value.length > 0 ? (
          <div className="flex gap-1 overflow-hidden">
            {value.slice(0, 6).map((skill: string, skillIndex: number) => (
              <span 
                key={skillIndex} 
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 flex-shrink-0 whitespace-nowrap"
              >
                {skill}
              </span>
            ))}
            {value.length > 6 && (
              <span className="text-xs text-gray-500 flex-shrink-0 self-center">
                +{value.length - 6}
              </span>
            )}
          </div>
        ) : (
          <span className="text-gray-400 text-sm">No tags</span>
        )}
      </div>
    );
  }

  if ((type === 'email' || type === 'url') && value) {
    const href = type === 'email' ? `mailto:${value}` : value;
    const isExternal = type === 'url';
    
    return (
      <div 
        className={`py-2 px-3 cursor-text hover:bg-gray-50 ${className}`}
        onClick={() => onStartEdit(designerId, field, value)}
      >
        <a 
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="text-blue-600 hover:underline truncate block"
          onClick={(e) => e.stopPropagation()}
        >
          {value}
        </a>
      </div>
    );
  }

  return (
    <div 
      className={`py-2 px-3 cursor-text hover:bg-gray-50 ${className}`}
      onClick={() => onStartEdit(designerId, field, value)}
    >
      {value || <span className="text-gray-400 text-sm">Click to add</span>}
    </div>
  );
}

interface DesignerTableProps {
  designers: SelectDesigner[];
  workspaceSlug: string;
  onEdit: (designer: SelectDesigner) => void;
  onEnrich: (designer: SelectDesigner) => void;
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  columnWidths: { [key: string]: number };
  onResizeStart: (column: string, e: React.MouseEvent) => void;
  onDoubleClickResize: (column: string) => void;
  editingCell: { id: number; field: string } | null;
  onStartEdit: (id: number, field: string, value: any) => void;
  onSaveEdit: (id: number, field: string, value: any) => void;
  onCancelEdit: () => void;
  editingValues: { [key: string]: any };
  onEditingValueChange: (key: string, value: any) => void;
}

function DesignerTable({
  designers,
  workspaceSlug,
  onEdit,
  onEnrich,
  selectedIds,
  onToggleSelect,
  columnWidths,
  onResizeStart,
  onDoubleClickResize,
  editingCell,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  editingValues,
  onEditingValueChange,
}: DesignerTableProps) {
  return (
    <div className="bg-white border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {/* Checkbox column */}
              <th 
                className="sticky left-0 z-10 bg-gray-50 text-left py-2 px-3 font-medium text-gray-700 text-sm relative group"
                style={{ width: columnWidths.checkbox }}
              >
                <Checkbox
                  checked={designers.length > 0 && selectedIds.length === designers.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      designers.forEach(designer => {
                        if (!selectedIds.includes(designer.id)) {
                          onToggleSelect(designer.id);
                        }
                      });
                    } else {
                      selectedIds.forEach(id => onToggleSelect(id));
                    }
                  }}
                />
                <div 
                  className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => onResizeStart('checkbox', e)}
                  onDoubleClick={() => onDoubleClickResize('checkbox')}
                />
              </th>

              {/* Name column */}
              <th 
                className="sticky left-0 z-10 bg-gray-50 text-left py-2 px-3 font-medium text-gray-700 text-sm relative group"
                style={{ 
                  width: columnWidths.name, 
                  left: columnWidths.checkbox 
                }}
              >
                Name
                <div 
                  className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => onResizeStart('name', e)}
                  onDoubleClick={() => onDoubleClickResize('name')}
                />
              </th>

              {/* Email column */}
              <th 
                className="text-left py-2 px-3 font-medium text-gray-700 text-sm relative group"
                style={{ width: columnWidths.email }}
              >
                Email
                <div 
                  className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => onResizeStart('email', e)}
                  onDoubleClick={() => onDoubleClickResize('email')}
                />
              </th>

              {/* Website column */}
              <th 
                className="text-left py-2 px-3 font-medium text-gray-700 text-sm relative group"
                style={{ width: columnWidths.website }}
              >
                Website
                <div 
                  className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => onResizeStart('website', e)}
                  onDoubleClick={() => onDoubleClickResize('website')}
                />
              </th>

              {/* LinkedIn column */}
              <th 
                className="text-left py-2 px-3 font-medium text-gray-700 text-sm relative group"
                style={{ width: columnWidths.linkedin }}
              >
                LinkedIn
                <div 
                  className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => onResizeStart('linkedin', e)}
                  onDoubleClick={() => onDoubleClickResize('linkedin')}
                />
              </th>

              {/* Tags column */}
              <th 
                className="text-left py-2 px-3 font-medium text-gray-700 text-sm relative group"
                style={{ width: columnWidths.tags }}
              >
                Tags
                <div 
                  className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => onResizeStart('tags', e)}
                  onDoubleClick={() => onDoubleClickResize('tags')}
                />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {designers.map((designer, index) => {
              const skills = (() => {
                if (Array.isArray(designer.skills)) {
                  return designer.skills;
                }
                if (typeof designer.skills === "string" && designer.skills.trim()) {
                  try {
                    return JSON.parse(designer.skills);
                  } catch {
                    return designer.skills
                      .split(",")
                      .map((s: string) => s.trim())
                      .filter((s: string) => s);
                  }
                }
                return [];
              })();

              return (
                <tr
                  key={designer.id}
                  className={`hover:bg-gray-50 cursor-pointer text-sm ${
                    selectedIds.includes(designer.id) ? "bg-blue-50" : ""
                  }`}
                  onClick={(e) => {
                    // Don't navigate if editing a cell, clicking on checkbox, buttons, or editable cells
                    if (
                      editingCell ||
                      (e.target as HTMLElement).closest('input[type="checkbox"]') ||
                      (e.target as HTMLElement).closest("button") ||
                      (e.target as HTMLElement).closest("input") ||
                      (e.target as HTMLElement).closest("[data-action]") ||
                      (e.target as HTMLElement).closest("[data-editable]")
                    ) {
                      return;
                    }
                    // Only navigate when clicking on the name column
                    const nameCell = (e.target as HTMLElement).closest('td[data-name-cell]');
                    if (nameCell) {
                      window.location.href = `/${workspaceSlug}/directory/${slugify(designer.name)}`;
                    }
                  }}
                >
                  <td 
                    className="sticky left-0 z-10 bg-white py-2 px-3 border-r border-gray-100"
                    style={{ width: columnWidths.checkbox }}
                  >
                    <Checkbox
                      checked={selectedIds.includes(designer.id)}
                      onCheckedChange={() => onToggleSelect(designer.id)}
                    />
                  </td>
                  <td 
                    className="sticky left-0 z-10 bg-white py-2 px-3 border-r border-gray-100 cursor-pointer"
                    style={{ 
                      width: columnWidths.name,
                      left: columnWidths.checkbox 
                    }}
                    data-name-cell
                  >
                    <div className="font-medium text-gray-900 truncate">
                      {designer.name}
                    </div>
                    <div className="text-gray-500 text-xs truncate">
                      {designer.title}{designer.company && ` at ${designer.company}`}
                    </div>
                  </td>
                  <td style={{ width: columnWidths.email }}>
                    <EditableCell
                      value={designer.email}
                      field="email"
                      designerId={designer.id}
                      isEditing={editingCell?.id === designer.id && editingCell?.field === 'email'}
                      onStartEdit={onStartEdit}
                      onSave={onSaveEdit}
                      onCancel={onCancelEdit}
                      editingValue={editingValues[`${designer.id}-email`] || ''}
                      onEditingValueChange={(value) => onEditingValueChange(`${designer.id}-email`, value)}
                      type="email"
                      className="truncate"
                    />
                  </td>
                  <td style={{ width: columnWidths.website }}>
                    <EditableCell
                      value={designer.website}
                      field="website"
                      designerId={designer.id}
                      isEditing={editingCell?.id === designer.id && editingCell?.field === 'website'}
                      onStartEdit={onStartEdit}
                      onSave={onSaveEdit}
                      onCancel={onCancelEdit}
                      editingValue={editingValues[`${designer.id}-website`] || ''}
                      onEditingValueChange={(value) => onEditingValueChange(`${designer.id}-website`, value)}
                      type="url"
                      className="truncate"
                    />
                  </td>
                  <td style={{ width: columnWidths.linkedin }}>
                    <EditableCell
                      value={designer.linkedIn}
                      field="linkedIn"
                      designerId={designer.id}
                      isEditing={editingCell?.id === designer.id && editingCell?.field === 'linkedIn'}
                      onStartEdit={onStartEdit}
                      onSave={onSaveEdit}
                      onCancel={onCancelEdit}
                      editingValue={editingValues[`${designer.id}-linkedIn`] || ''}
                      onEditingValueChange={(value) => onEditingValueChange(`${designer.id}-linkedIn`, value)}
                      type="url"
                      className="truncate"
                    />
                  </td>
                  <td style={{ width: columnWidths.tags }}>
                    <EditableCell
                      value={skills}
                      field="skills"
                      designerId={designer.id}
                      isEditing={editingCell?.id === designer.id && editingCell?.field === 'skills'}
                      onStartEdit={onStartEdit}
                      onSave={onSaveEdit}
                      onCancel={onCancelEdit}
                      editingValue={editingValues[`${designer.id}-skills`] || []}
                      onEditingValueChange={(value) => onEditingValueChange(`${designer.id}-skills`, value)}
                      type="tags"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {designers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No designers found matching your search criteria.
          </div>
        )}
      </div>
    </div>
  );
}
