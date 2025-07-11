import { useState, useEffect, useRef } from "react";
import {
  useDesigners,
  useCreateDesigner,
  useUpdateDesigner,
  useDeleteDesigners,
} from "@/hooks/use-designer";
import { useCreateList, useAddDesignersToList } from "@/hooks/use-lists";
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
      <div className="container mx-auto px-4 sm:px-6 pt-20 pb-8 space-y-6 sm:space-y-8">
        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Directory</h1>
          <div className="flex flex-wrap gap-2">
            {/* View Toggle */}
            <div className="flex border rounded-lg">
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

            {selectedIds.length > 0 && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setShowAddToListDialog(true)}
                  className="min-h-[44px]"
                >
                  <ListPlus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Add to list</span> (
                  {selectedIds.length})
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteSelected}
                  disabled={deleteDesigners.isPending}
                  className="min-h-[44px]"
                >
                  {deleteDesigners.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Trash className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Delete selected</span> (
                  {selectedIds.length})
                </Button>
              </>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2 min-h-[44px]">
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

        <div className="space-y-6">
          <div className="space-y-2">
            <Input
              placeholder="Search designers by name, title, company, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-lg py-3 px-4 bg-white border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg shadow-sm"
            />
          </div>
        </div>

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
          <div className="space-y-4">
            {filteredDesigners.map((designer) => (
              <DesignerListItem
                key={designer.id}
                designer={designer}
                onEdit={setDesignerToEdit}
                onEnrich={(designer) => {
                  setEnrichmentDesigner(designer);
                  setShowEnrichment(true);
                }}
                isSelected={selectedIds.includes(designer.id)}
                onToggleSelect={toggleDesignerSelection}
              />
            ))}
          </div>
        )}

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
  const createList = useCreateList();
  const addDesignersToList = useAddDesignersToList();
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (values: { name: string; description: string }) => {
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
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New List</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button
                type="submit"
                disabled={createList.isPending || addDesignersToList.isPending}
              >
                {(createList.isPending || addDesignersToList.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create list with selected designers
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// List view component for designers
function DesignerListItem({
  designer,
  onEdit,
  onEnrich,
  isSelected,
  onToggleSelect,
}: {
  designer: SelectDesigner;
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
