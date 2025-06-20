import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SelectDesigner } from "@db/schema";
import { Globe, Linkedin, Mail, ArrowLeft, Pencil } from "lucide-react";
import MDEditor from "@uiw/react-md-editor";
import { useDesigner } from "@/hooks/use-designers";
import { useState } from "react";
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
import SkillsInput from "@/components/SkillsInput";
import { useToast } from "@/hooks/use-toast";

const formSchema = insertDesignerSchema.omit({ id: true, userId: true, createdAt: true });
type FormData = z.infer<typeof formSchema>;

export default function DesignerDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [isEditMode, setIsEditMode] = useState(false);
  const { toast } = useToast();
  
  const { data: designer, isLoading, error } = useDesigner(parseInt(id || "0"));
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
        skills: designer.skills || [],
        notes: designer.notes || "",
        available: designer.available || false,
      });
      setIsEditMode(true);
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    form.reset();
  };

  const onSubmit = async (data: FormData) => {
    if (!designer) return;

    try {
      const formData = new FormData();
      formData.append('data', JSON.stringify(data));

      await updateDesigner.mutateAsync({ 
        id: designer.id, 
        formData 
      });

      toast({
        title: "Designer updated",
        description: "The designer information has been updated successfully.",
      });
      
      setIsEditMode(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update designer. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-48 bg-muted rounded-2xl mb-8"></div>
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !designer) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/directory")}
            className="mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Directory
          </Button>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Designer Not Found</h1>
            <p className="text-muted-foreground">The designer you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Photo Section */}
      <div className="relative h-64 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/directory")}
          className="absolute top-6 left-6 bg-background/80 backdrop-blur-sm hover:bg-background/90 text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Directory
        </Button>

        {/* Available badge */}
        {designer.available && (
          <div className="absolute top-6 right-6">
            <Badge variant="secondary" className="text-sm px-4 py-2 bg-green-500 text-white border-0 shadow-lg">
              Open to Roles
            </Badge>
          </div>
        )}
        
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-8 pt-8 pb-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {isEditMode ? (
            /* Edit Mode */
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Profile Photo */}
                <div className="flex justify-start">
                  {designer.photoUrl ? (
                    <img
                      src={designer.photoUrl}
                      alt={designer.name}
                      className="h-32 w-32 rounded-2xl object-cover bg-background border-4 border-background shadow-xl"
                    />
                  ) : (
                    <div className="h-32 w-32 rounded-2xl bg-background border-4 border-background shadow-xl flex items-center justify-center">
                      <span className="text-4xl font-bold text-muted-foreground">
                        {designer.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Edit Header */}
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h2 className="text-3xl font-bold">Edit Designer</h2>
                    <p className="text-muted-foreground">Update the designer's information below</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updateDesigner.isPending}>
                      {updateDesigner.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name" {...field} />
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
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Job title" {...field} />
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
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@example.com" {...field} />
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
                        <FormLabel>Level *</FormLabel>
                        <FormControl>
                          <Input placeholder="Senior, Staff, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input placeholder="Company name" {...field} value={field.value || ""} />
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
                          <Input placeholder="City, State/Country" {...field} value={field.value || ""} />
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
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://..." {...field} value={field.value || ""} />
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
                        <FormLabel>LinkedIn</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://linkedin.com/in/..." {...field} value={field.value || ""} />
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
                          value={Array.isArray(field.value) ? field.value : []} 
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
                        <Textarea 
                          placeholder="Additional information about the designer..."
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ""}
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
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        Open to roles
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          ) : (
            /* View Mode */
            <>
              {/* Profile Photo */}
              <div className="flex justify-start">
                {designer.photoUrl ? (
                  <img
                    src={designer.photoUrl}
                    alt={designer.name}
                    className="h-32 w-32 rounded-2xl object-cover bg-background border-4 border-background shadow-xl"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-2xl bg-background border-4 border-background shadow-xl flex items-center justify-center">
                    <span className="text-4xl font-bold text-muted-foreground">
                      {designer.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Name and Title with Edit Button */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-5xl font-bold leading-tight tracking-tight">{designer.name}</h1>
                    <p className="text-2xl text-muted-foreground font-light">{designer.title}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    className="flex items-center gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                </div>
                
                {/* Company and Location */}
                <div className="flex items-center space-x-4 text-lg text-muted-foreground designer-meta">
                  <span><span className="font-medium text-foreground">Level:</span> {designer.level}</span>
                  <span>|</span>
                  <span><span className="font-medium text-foreground">Company:</span> {designer.company}</span>
                  <span>|</span>
                  <span><span className="font-medium text-foreground">Location:</span> {designer.location}</span>
                </div>
              </div>

              {/* Skills Section */}
              <div className="space-y-6">
                <h2 className="text-3xl font-bold">Skills & Expertise</h2>
                <div className="flex flex-wrap gap-3">
                  {designer.skills.map((skill, i) => (
                    <span 
                      key={i} 
                      className="text-base hover:text-foreground transition-colors cursor-default"
                      style={{ color: '#374151' }}
                    >
                      #{skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Notes Section */}
              {designer.notes && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold">About</h2>
                  <div className="prose prose-lg max-w-none prose-headings:font-bold prose-p:text-lg prose-p:leading-relaxed" style={{ color: '#111827' }}>
                    <MDEditor.Markdown source={designer.notes} style={{ backgroundColor: 'transparent' }} />
                  </div>
                </div>
              )}

              {/* Contact Section */}
              <div className="space-y-6">
                <h2 className="text-3xl font-bold">Get in Touch</h2>
                <div className="flex flex-wrap gap-4">
                  {designer.website && (
                    <a 
                      href={designer.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors inline-flex items-center justify-center"
                    >
                      <Globe className="h-5 w-5" />
                    </a>
                  )}
                  {designer.linkedIn && (
                    <a 
                      href={designer.linkedIn} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors inline-flex items-center justify-center"
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}
                  {designer.email && (
                    <a 
                      href={`mailto:${designer.email}`}
                      className="p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors inline-flex items-center justify-center"
                    >
                      <Mail className="h-5 w-5" />
                    </a>
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