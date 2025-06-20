import { useState, useEffect, useRef } from "react";
import { useDesigners, useCreateDesigner, useUpdateDesigner, useDeleteDesigners } from "@/hooks/use-designer";
import { useCreateList, useAddDesignersToList } from "@/hooks/use-lists";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import DesignerCard from "@/components/DesignerCard";
import SkillsInput from "@/components/SkillsInput";
import Navigation from "@/components/Navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MDEditor from "@uiw/react-md-editor";
import { useForm } from "react-hook-form";
import { Loader2, Plus, Trash, ListPlus, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EnrichmentDialog from "@/components/EnrichmentDialog";
import { SelectDesigner } from "@db/schema";

const EXPERIENCE_LEVELS = [
  "Mid-level",
  "Senior",
  "Staff",
  "Senior Staff",
  "Principal",
  "Manager",
  "Director",
  "Senior Director",
  "VP"
];

const designerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  title: z.string().min(1, "Title is required"),
  email: z.union([z.string().email("Please enter a valid email address"), z.literal("")]),
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
  const { data: designers, isLoading } = useDesigners();
  const deleteDesigners = useDeleteDesigners();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [designerToEdit, setDesignerToEdit] = useState<SelectDesigner | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showAddToListDialog, setShowAddToListDialog] = useState(false);
  const [showEnrichment, setShowEnrichment] = useState(false);
  const [enrichmentDesigner, setEnrichmentDesigner] = useState<SelectDesigner | null>(null);
  const { toast } = useToast();
  const scrollPositionRef = useRef<number>(0);

  const filteredDesigners = designers?.filter((designer) => {
    const matchesSearch = designer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         designer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         designer.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSkills = selectedSkills.length === 0 || 
                         selectedSkills.some(skill => 
                           designer.skills.some(designerSkill => 
                             designerSkill.toLowerCase().includes(skill.toLowerCase())
                           )
                         );
    
    return matchesSearch && matchesSkills;
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
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(designerId => designerId !== id)
        : [...prev, id]
    );
  };

  return (
    <div>
      <Navigation />
      <div className="container mx-auto px-4 pt-20 pb-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Design Talent Match Directory</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => {
                setEnrichmentDesigner(null);
                setShowEnrichment(true);
              }}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              AI Enrich New
            </Button>
            {selectedIds.length > 0 && (
              <>
                <Button 
                  variant="secondary"
                  onClick={() => setShowAddToListDialog(true)}
                >
                  <ListPlus className="mr-2 h-4 w-4" />
                  Add to List ({selectedIds.length})
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteSelected}
                  disabled={deleteDesigners.isPending}
                >
                  {deleteDesigners.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Selected ({selectedIds.length})
                </Button>
              </>
            )}
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Designer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle>Add New Designer</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto pr-2">
                  <AddDesignerDialog designer={null} onClose={() => {}} />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Input
              placeholder="Search designers by name, title, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-lg py-3 px-4 bg-white border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg shadow-sm"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Search by skill</label>
            <SkillsInput
              value={selectedSkills}
              onChange={setSelectedSkills}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDesigners.map((designer) => (
              <div key={designer.id} className="relative">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(designer.id)}
                  onChange={() => toggleDesignerSelection(designer.id)}
                  className="absolute top-4 left-4 z-10 w-4 h-4 text-primary bg-background border-2 border-muted-foreground rounded focus:ring-primary focus:ring-2"
                />
                <DesignerCard 
                  designer={designer} 
                  onEdit={setDesignerToEdit}
                  onEnrich={(designer) => {
                    setEnrichmentDesigner(designer);
                    setShowEnrichment(true);
                  }}
                />
              </div>
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
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
                document.body.classList.remove('overflow-hidden');
                // Restore scroll position if needed
                window.scrollTo(0, scrollPositionRef.current);
              }, 50);
            } else {
              // Store current scroll position when opening
              scrollPositionRef.current = window.scrollY;
            }
          }}
        >
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Edit Designer</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-2">
              <AddDesignerDialog 
                designer={designerToEdit} 
                onClose={() => setDesignerToEdit(null)} 
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
      </div>
    </div>
  );
}

interface AddDesignerDialogProps {
  designer?: SelectDesigner | null;
  onClose: () => void;
}

function AddDesignerDialog({ designer, onClose }: AddDesignerDialogProps) {
  const { toast } = useToast();
  const createDesigner = useCreateDesigner();
  const updateDesigner = useUpdateDesigner();
  const [photoFile, setPhotoFile] = useState<File | null>(null);

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
      skills: designer?.skills || [],
      notes: designer?.notes || "",
      available: designer?.available || false,
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
        skills: designer.skills || [],
        notes: designer.notes || "",
        available: designer.available || false,
      });
    }
  }, [designer, form]);

  const handleClose = () => {
    form.reset();
    setPhotoFile(null);
    onClose();
    
    // Force comprehensive scroll restoration after modal closes
    setTimeout(() => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.body.classList.remove('overflow-hidden');
      document.documentElement.style.overflow = '';
      document.documentElement.style.paddingRight = '';
      document.documentElement.classList.remove('overflow-hidden');
      
      // Force repaint to ensure scroll is restored
      document.body.offsetHeight;
    }, 150);
  };

  const onSubmit = async (values: any) => {
    try {
      const formData = new FormData();
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const designerData = {
        name: values.name,
        title: values.title,
        location: values.location || "",
        company: values.company || "",
        level: values.level,
        website: values.website || "",
        linkedIn: values.linkedIn || "",
        email: values.email || "",
        skills: values.skills || [],
        notes: values.notes || "",
        available: values.available
      };

      formData.append('data', JSON.stringify(designerData));

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
      console.error('Form submission error:', error);
      const errorMessage = error.message || error.response?.data?.message || "Failed to create designer profile";
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="photo" className="block text-sm font-medium mb-2">
            Photo
          </label>
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
                <FormLabel>Name <span className="text-red-500">*</span></FormLabel>
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
                    <FormLabel>Title <span className="text-red-500">*</span></FormLabel>
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
                    <FormLabel>Level <span className="text-red-500">*</span></FormLabel>
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
                  <FormLabel>Skills</FormLabel>
                  <FormControl>
                    <SkillsInput
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <MDEditor
                      value={field.value}
                      onChange={(value) => field.onChange(value || '')}
                      data-color-mode="light"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button 
                type="submit" 
                disabled={createDesigner.isPending || updateDesigner.isPending}
              >
                {(createDesigner.isPending || updateDesigner.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {designer ? 'Update Designer' : 'Create Designer'}
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

function AddToListDialog({ open, onOpenChange, designerIds, onSuccess }: AddToListDialogProps) {
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
        designerIds.map(designerId =>
          addDesignersToList.mutateAsync({
            listId: list.id,
            designerId,
          })
        )
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
                Create List with Selected Designers
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}