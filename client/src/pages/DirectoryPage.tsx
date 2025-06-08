import { useState, useEffect } from "react";
import { useDesigners, useCreateDesigner, useUpdateDesigner, useDeleteDesigners } from "@/hooks/use-designer";
import { useCreateList, useAddDesignersToList } from "@/hooks/use-lists";
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
import { Loader2, Plus, Trash, ListPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

export default function DirectoryPage() {
  const { data: designers, isLoading } = useDesigners();
  const deleteDesigners = useDeleteDesigners();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [designerToEdit, setDesignerToEdit] = useState<SelectDesigner | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showAddToListDialog, setShowAddToListDialog] = useState(false);
  const { toast } = useToast();

  const filteredDesigners = designers?.filter((designer) => {
    const matchesSearch = designer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         designer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         designer.company?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSkills = selectedSkills.length === 0 || 
                         selectedSkills.every(skill => designer.skills.includes(skill));

    return matchesSearch && matchesSkills;
  });

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;

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
      <div className="container mx-auto px-4 py-8 space-y-8 min-h-full overflow-y-auto pb-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Design Talent Match Directory</h1>
        <div className="flex gap-2">
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
                Delete Selected
              </Button>
            </>
          )}
          <AddDesignerDialog 
            designer={designerToEdit} 
            onClose={() => setDesignerToEdit(null)} 
          />
        </div>
      </div>

      <div className="space-y-4">
        <Input
          placeholder="Search designers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <SkillsInput
          value={selectedSkills}
          onChange={setSelectedSkills}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDesigners?.map((designer) => (
            <div key={designer.id} className="relative">
              <div className="absolute top-4 left-4 z-10">
                <Checkbox
                  checked={selectedIds.includes(designer.id)}
                  onCheckedChange={() => toggleDesignerSelection(designer.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <DesignerCard 
                designer={designer}
                onEdit={setDesignerToEdit}
                onSkillClick={(skill) => setSelectedSkills([skill])}
              />
            </div>
          ))}
        </div>
      )}

      <AddToListDialog
        open={showAddToListDialog}
        onOpenChange={setShowAddToListDialog}
        designerIds={selectedIds}
        onSuccess={() => setSelectedIds([])}
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
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      name: designer?.name ?? "",
      title: designer?.title ?? "",
      location: designer?.location ?? "",
      company: designer?.company ?? "",
      level: designer?.level ?? "",
      website: designer?.website ?? "",
      linkedIn: designer?.linkedIn ?? "",
      email: designer?.email ?? "",
      skills: designer?.skills ?? [],
      notes: designer?.notes ?? "",
      available: designer?.available ?? false,
    },
  });

  useEffect(() => {
    if (designer) {
      form.reset({
        name: designer.name,
        title: designer.title,
        location: designer.location,
        company: designer.company,
        level: designer.level,
        website: designer.website,
        linkedIn: designer.linkedIn,
        email: designer.email,
        skills: designer.skills,
        notes: designer.notes,
        available: designer.available,
      });
      setIsOpen(true);
    }
  }, [designer, form]);

  const handleClose = () => {
    setIsOpen(false);
    form.reset();
    setPhotoFile(null);
    onClose();
  };

  const onSubmit = async (values: Omit<SelectDesigner, "id" | "userId" | "createdAt" | "photoUrl">) => {
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
      }
      handleClose();
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create designer profile",
        variant: "destructive",
      });
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  return (
    <Dialog open={isOpen || Boolean(designer)} onOpenChange={(open) => {
      if (!open) handleClose();
      setIsOpen(open);
    }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Designer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{designer ? 'Edit Designer' : 'Add New Designer'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-1 overflow-y-auto">
            <FormField
              control={form.control}
              name="photo"
              render={() => (
                <FormItem>
                  <FormLabel>Photo</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" required {...field} />
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
                    <FormLabel>Title</FormLabel>
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
                    <FormLabel>Level</FormLabel>
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
              <DialogTrigger asChild>
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
              </DialogTrigger>
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
      </DialogContent>
    </Dialog>
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