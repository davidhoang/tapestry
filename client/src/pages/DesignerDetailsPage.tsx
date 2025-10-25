import { useParams, useLocation, Link } from "wouter";
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SelectDesigner } from "@db/schema";
import { Globe, Linkedin, Mail, ArrowLeft, Pencil, Upload, X, ListPlus, Loader2, MapPin, Building2, Sparkles } from "lucide-react";
import { RichTextPreview } from "@/components/ui/rich-text-preview";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useDesignerBySlug } from "@/hooks/use-designer";
import { useState, useRef } from "react";
import { useUpdateDesigner } from "@/hooks/use-designer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDesignerSchema } from "@db/schema";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import SkillsInput from "@/components/SkillsInput";
import { useToast } from "@/hooks/use-toast";
import { getDesignerCoverImage } from "@/utils/coverImages";
import PortfolioManager from "@/components/PortfolioManager";
import { useLists, useAddDesignersToList, useCreateList } from "@/hooks/use-lists";
import { DesignerAvatar } from "@/components/DesignerAvatar";

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

const formSchema = insertDesignerSchema.omit({ id: true, userId: true, createdAt: true, workspaceId: true });
type FormData = z.infer<typeof formSchema>;

export default function DesignerDetailsPage() {
  const { slug, workspaceSlug } = useParams<{ slug: string; workspaceSlug: string }>();
  const [, setLocation] = useLocation();
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const { data: designer, isLoading, error } = useDesignerBySlug(slug || "");
  const updateDesigner = useUpdateDesigner();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      title: "",
      email: "",
      company: "",
      location: "",
      level: "",
      website: "",
      linkedIn: "",
      skills: [],
      notes: "",
      available: false,
      photoUrl: "",
    },
  });

  const handleEdit = () => {
    if (designer) {
      form.reset({
        name: designer.name || "",
        title: designer.title || "",
        email: designer.email || "",
        company: designer.company || "",
        location: designer.location || "",
        level: designer.level || "",
        website: designer.website || "",
        linkedIn: designer.linkedIn || "",
        skills: Array.isArray(designer.skills) ? designer.skills : [],
        notes: designer.notes || "",
        available: designer.available || false,
        photoUrl: designer.photoUrl || "",
      });
      setIsEditMode(true);
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    form.reset();
    setSelectedPhoto(null);
    setPhotoPreview(null);
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!designer) return;

    try {

      const formData = new FormData();
      formData.append('data', JSON.stringify(data));
      
      if (selectedPhoto) {
        formData.append('photo', selectedPhoto);
      }

      await updateDesigner.mutateAsync({ 
        id: designer.id, 
        formData 
      });

      toast({
        title: "Designer updated",
        description: "The designer information has been updated successfully.",
      });
      
      setIsEditMode(false);
      setSelectedPhoto(null);
      setPhotoPreview(null);
    } catch (error: any) {

      toast({
        title: "Error",
        description: error?.message || "Failed to update designer. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FBF8F3] to-background">
        <div className="animate-pulse">
          <div className="h-80 bg-gradient-to-br from-muted/50 to-muted"></div>
          <div className="container mx-auto px-6 lg:px-8 max-w-6xl">
            <div className="-mt-24 mb-8">
              <div className="h-40 w-40 rounded-3xl bg-background border-4 border-background shadow-2xl"></div>
            </div>
            <div className="space-y-4">
              <div className="h-10 bg-muted rounded w-1/3"></div>
              <div className="h-6 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-1/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !designer) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FBF8F3] to-background">
        <div className="container mx-auto px-6 lg:px-8 py-12 max-w-6xl">
          <Button
            variant="ghost"
            onClick={() => setLocation(`/${workspaceSlug}/directory`)}
            className="mb-8 hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to directory
          </Button>
          <div className="text-center py-20 bg-white/50 backdrop-blur rounded-3xl shadow-sm border">
            <h1 className="text-3xl font-bold mb-4">Designer Not Found</h1>
            <p className="text-muted-foreground text-lg">The designer you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FBF8F3] to-background">
      {/* Cover Photo Section - Enhanced */}
      <div className="relative h-80 overflow-hidden">
        <img 
          src={getDesignerCoverImage(designer.id)} 
          alt="Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
        
        {/* Back Button - Refined */}
        <Button
          variant="ghost"
          onClick={() => setLocation(`/${workspaceSlug}/directory`)}
          className="absolute top-8 left-8 bg-white/95 backdrop-blur-md hover:bg-white text-foreground shadow-lg border-0 transition-all hover:scale-105"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to directory
        </Button>

        {/* Available badge - Enhanced */}
        {designer.available && (
          <div className="absolute top-8 right-8">
            <Badge className="text-sm px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-xl font-medium rounded-full flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Open to Roles
            </Badge>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-6 lg:px-8 pb-16 max-w-6xl">
        <div className="space-y-8">
          {isEditMode ? (
            /* Edit Mode */
            <div className="bg-white/80 backdrop-blur rounded-3xl shadow-xl border p-8 -mt-16">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Profile Photo */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-6">
                      <div className="relative">
                        {photoPreview || designer.photoUrl ? (
                          <img
                            src={photoPreview || designer.photoUrl || undefined}
                            alt={designer.name}
                            className="h-40 w-40 rounded-3xl object-cover bg-background border-4 border-background shadow-2xl"
                          />
                        ) : (
                          <div className="h-40 w-40 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border-4 border-background shadow-2xl flex items-center justify-center">
                            <span className="text-5xl font-bold text-primary/60">
                              {designer.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        
                        {photoPreview && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0 shadow-lg"
                            onClick={removePhoto}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-3 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2 hover:bg-secondary/80 transition-colors"
                        >
                          <Upload className="h-4 w-4" />
                          {photoPreview || designer.photoUrl ? "Change photo" : "Upload photo"}
                        </Button>
                        
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                        
                        <p className="text-sm text-muted-foreground">
                          JPG, PNG or GIF (max 5MB)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Edit Header */}
                  <div className="flex items-center justify-between border-b pb-6">
                    <div>
                      <h2 className="text-4xl font-bold tracking-tight">Edit Designer</h2>
                      <p className="text-muted-foreground text-lg mt-1">Update the designer's information below</p>
                    </div>
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" onClick={handleCancel} className="hover:bg-secondary/80">
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={updateDesigner.isPending}
                        className="shadow-lg hover:shadow-xl transition-all"
                      >
                        {updateDesigner.isPending ? "Saving..." : "Save changes"}
                      </Button>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Full name" {...field} className="h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Title *</FormLabel>
                          <FormControl>
                            <Input placeholder="Job title" {...field} className="h-11" />
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
                          <FormLabel className="text-base font-semibold">Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@example.com" {...field} value={field.value || ""} className="h-11" />
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
                          <FormLabel className="text-base font-semibold">Level *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11">
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

                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Company</FormLabel>
                          <FormControl>
                            <Input placeholder="Company name" {...field} value={field.value || ""} className="h-11" />
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
                          <FormLabel className="text-base font-semibold">Location</FormLabel>
                          <FormControl>
                            <Input placeholder="City, State/Country" {...field} value={field.value || ""} className="h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Website</FormLabel>
                          <FormControl>
                            <Input type="url" placeholder="https://..." {...field} value={field.value || ""} className="h-11" />
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
                          <FormLabel className="text-base font-semibold">LinkedIn</FormLabel>
                          <FormControl>
                            <Input type="url" placeholder="https://linkedin.com/in/..." {...field} value={field.value || ""} className="h-11" />
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
                        <FormLabel className="text-base font-semibold">Skills</FormLabel>
                        <FormControl>
                          <SkillsInput 
                            value={Array.isArray(field.value) ? (field.value as string[]) : []} 
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
                        <FormLabel className="text-base font-semibold">Notes</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Additional information about the designer..."
                            height={200}
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
                      <FormItem className="flex items-center space-x-3 space-y-0 rounded-2xl border p-6 bg-secondary/30">
                        <FormControl>
                          <Switch
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-base font-normal cursor-pointer">
                          Open to roles
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </div>
          ) : (
            /* View Mode */
            <>
              {/* Profile Header with Overlapping Photo */}
              <div className="-mt-24 relative">
                {/* Profile Photo - Overlapping cover */}
                <div className="mb-6">
                  <DesignerAvatar 
                    imageUrl={designer.photoUrl}
                    name={designer.name}
                    size="xl"
                    className="ring-8 ring-[#FBF8F3] shadow-2xl"
                  />
                </div>

                {/* Name, Title, and Action Buttons */}
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
                  <div className="flex-1 min-w-0 space-y-4">
                    <div>
                      <h1 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight mb-3">
                        {designer.name}
                      </h1>
                      <p className="text-xl lg:text-2xl text-muted-foreground font-light flex flex-wrap items-center gap-2">
                        <span className="font-medium text-primary">{designer.level}</span>
                        <span className="text-muted-foreground/50">•</span>
                        <Link 
                          href={`/${workspaceSlug}/search?type=title&value=${encodeURIComponent(designer.title)}`}
                          className="hover:text-foreground hover:underline decoration-primary/30 underline-offset-4 cursor-pointer transition-all"
                        >
                          {designer.title}
                        </Link>
                        {designer.company && (
                          <>
                            <span className="text-muted-foreground/50">at</span>
                            <span className="font-medium">{designer.company}</span>
                          </>
                        )}
                      </p>
                    </div>

                    {/* Location & Contact Row */}
                    <div className="flex flex-wrap items-center gap-6">
                      {designer.location && (
                        <Link 
                          href={`/${workspaceSlug}/search?type=location&value=${encodeURIComponent(designer.location)}`}
                          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
                        >
                          <MapPin className="h-4 w-4 group-hover:text-primary transition-colors" />
                          <span className="text-base hover:underline decoration-primary/30 underline-offset-4">
                            {designer.location}
                          </span>
                        </Link>
                      )}
                      
                      {/* Contact Links */}
                      <div className="flex items-center gap-2">
                        {designer.website && (
                          <a 
                            href={designer.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2.5 rounded-xl hover:bg-primary/10 hover:text-primary transition-all inline-flex items-center justify-center group"
                            title="Website"
                          >
                            <Globe className="h-5 w-5 group-hover:scale-110 transition-transform" />
                          </a>
                        )}
                        {designer.linkedIn && (
                          <a 
                            href={designer.linkedIn} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2.5 rounded-xl hover:bg-primary/10 hover:text-primary transition-all inline-flex items-center justify-center group"
                            title="LinkedIn"
                          >
                            <Linkedin className="h-5 w-5 group-hover:scale-110 transition-transform" />
                          </a>
                        )}
                        {designer.email && (
                          <a 
                            href={`mailto:${designer.email}`}
                            className="p-2.5 rounded-xl hover:bg-primary/10 hover:text-primary transition-all inline-flex items-center justify-center group"
                            title="Email"
                          >
                            <Mail className="h-5 w-5 group-hover:scale-110 transition-transform" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    <AddToListPopover designerId={designer.id} />
                    <Button
                      variant="outline"
                      onClick={handleEdit}
                      className="flex items-center gap-2 hover:bg-secondary/80 hover:shadow-lg transition-all shadow-sm"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - About & Skills */}
                <div className="lg:col-span-2 space-y-6">
                  {/* About Section */}
                  {designer.notes && (
                    <div className="bg-white/80 backdrop-blur rounded-3xl shadow-lg border p-8 hover:shadow-xl transition-shadow">
                      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                        About
                      </h2>
                      <div className="prose prose-lg max-w-none text-foreground/90 leading-relaxed">
                        <RichTextPreview source={designer.notes} />
                      </div>
                    </div>
                  )}

                  {/* Portfolio Section */}
                  <div className="bg-white/80 backdrop-blur rounded-3xl shadow-lg border p-8 hover:shadow-xl transition-shadow">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                      Portfolio
                    </h2>
                    <PortfolioManager designer={designer} />
                  </div>
                </div>

                {/* Right Column - Skills */}
                <div className="space-y-6">
                  {designer.skills && designer.skills.length > 0 && (
                    <div className="bg-white/80 backdrop-blur rounded-3xl shadow-lg border p-8 hover:shadow-xl transition-shadow sticky top-8">
                      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                        Skills & Expertise
                      </h2>
                      <div className="flex flex-wrap gap-2.5">
                        {designer.skills.map((skill, index) => (
                          <Link
                            key={index}
                            href={`/${workspaceSlug}/search?type=skill&value=${encodeURIComponent(skill)}`}
                          >
                            <Badge 
                              variant="secondary" 
                              className="px-4 py-2 text-sm font-medium hover:bg-primary/10 hover:text-primary hover:shadow-md transition-all cursor-pointer rounded-full border-primary/10"
                            >
                              {skill}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Add to List Popover Component
function AddToListPopover({ designerId }: { designerId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [selectedListIds, setSelectedListIds] = useState<number[]>([]);
  const { data: lists } = useLists();
  const addToList = useAddDesignersToList();
  const createList = useCreateList();
  const { toast } = useToast();

  const handleAddToLists = async () => {
    if (selectedListIds.length === 0) {
      toast({
        title: "No lists selected",
        description: "Please select at least one list",
        variant: "destructive",
      });
      return;
    }

    try {
      for (const listId of selectedListIds) {
        await addToList.mutateAsync({
          listId,
          designerId: designerId,
        });
      }

      toast({
        title: "Success",
        description: `Added to ${selectedListIds.length} list${selectedListIds.length > 1 ? 's' : ''}`,
      });

      setIsOpen(false);
      setSelectedListIds([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to add to lists",
        variant: "destructive",
      });
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a list name",
        variant: "destructive",
      });
      return;
    }

    try {
      const newList = await createList.mutateAsync({
        name: newListName,
        description: "",
      });

      await addToList.mutateAsync({
        listId: newList.id,
        designerId: designerId,
      });

      toast({
        title: "List created",
        description: `Created "${newListName}" and added designer`,
      });

      setIsCreating(false);
      setNewListName("");
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to create list",
        variant: "destructive",
      });
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="default"
          size="sm"
          className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
        >
          <ListPlus className="h-4 w-4" />
          Add to List
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-2xl shadow-2xl border-2" align="end">
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Add to List</h3>
            <p className="text-sm text-muted-foreground">
              Select existing lists or create a new one
            </p>
          </div>

          {isCreating ? (
            <div className="space-y-4">
              <Input
                placeholder="List name"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateList();
                  }
                }}
                autoFocus
                className="h-11"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreateList}
                  disabled={createList.isPending}
                  className="flex-1"
                >
                  {createList.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setNewListName("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {lists && lists.length > 0 ? (
                  lists.map((list) => (
                    <label
                      key={list.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedListIds.includes(list.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedListIds([...selectedListIds, list.id]);
                          } else {
                            setSelectedListIds(
                              selectedListIds.filter((id) => id !== list.id)
                            );
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{list.name}</div>
                        {list.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {list.description}
                          </div>
                        )}
                      </div>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No lists yet
                  </p>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreating(true)}
                  className="w-full justify-start hover:bg-secondary/80"
                >
                  <ListPlus className="mr-2 h-4 w-4" />
                  Create new list
                </Button>

                {lists && lists.length > 0 && (
                  <Button
                    size="sm"
                    onClick={handleAddToLists}
                    disabled={
                      selectedListIds.length === 0 || addToList.isPending
                    }
                    className="w-full shadow-lg"
                  >
                    {addToList.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      `Add to ${selectedListIds.length} list${selectedListIds.length !== 1 ? 's' : ''}`
                    )}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
