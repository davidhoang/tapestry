import { useState } from "react";
import { Plus, Edit2, Trash2, ExternalLink, Image, Calendar, User, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { usePortfolioProjects, useCreateProject, useUpdateProject, useDeleteProject } from "@/hooks/use-portfolios";
import type { SelectPortfolio, SelectPortfolioProject } from '@db/schema';

interface ProjectManagerProps {
  portfolio: SelectPortfolio;
}

const projectCategories = [
  { value: "web", label: "Web Design" },
  { value: "mobile", label: "Mobile App" },
  { value: "branding", label: "Branding" },
  { value: "illustration", label: "Illustration" },
  { value: "print", label: "Print Design" },
  { value: "ui-ux", label: "UI/UX" },
  { value: "motion", label: "Motion Graphics" },
  { value: "packaging", label: "Packaging" },
  { value: "other", label: "Other" },
];

export default function ProjectManager({ portfolio }: ProjectManagerProps) {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<SelectPortfolioProject | null>(null);
  
  const { data: projects, isLoading } = usePortfolioProjects(portfolio.id);
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    category: "",
    tags: [] as string[],
    projectUrl: "",
    sourceUrl: "",
    clientName: "",
    role: "",
    duration: "",
    technologies: [] as string[],
    isPublic: true,
    isFeatured: false,
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      content: "",
      category: "",
      tags: [],
      projectUrl: "",
      sourceUrl: "",
      clientName: "",
      role: "",
      duration: "",
      technologies: [],
      isPublic: true,
      isFeatured: false,
    });
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Project title is required",
        variant: "destructive",
      });
      return;
    }

    try {
      await createProjectMutation.mutateAsync({
        portfolioId: portfolio.id,
        ...formData,
      });
      
      toast({
        title: "Success",
        description: "Project created successfully",
      });
      
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingProject) return;

    try {
      await updateProjectMutation.mutateAsync({
        portfolioId: portfolio.id,
        id: editingProject.id,
        ...formData,
      });
      
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
      
      setEditingProject(null);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async (project: SelectPortfolioProject) => {
    if (!confirm(`Are you sure you want to delete "${project.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteProjectMutation.mutateAsync({
        portfolioId: portfolio.id,
        id: project.id,
      });
      
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (project: SelectPortfolioProject) => {
    setFormData({
      title: project.title,
      description: project.description || "",
      content: project.content || "",
      category: project.category || "",
      tags: Array.isArray(project.tags) ? project.tags : [],
      projectUrl: project.projectUrl || "",
      sourceUrl: project.sourceUrl || "",
      clientName: project.clientName || "",
      role: project.role || "",
      duration: project.duration || "",
      technologies: Array.isArray(project.technologies) ? project.technologies : [],
      isPublic: project.isPublic || false,
      isFeatured: project.isFeatured || false,
    });
    setEditingProject(project);
  };

  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData({ ...formData, tags });
  };

  const handleTechnologiesChange = (value: string) => {
    const technologies = value.split(',').map(tech => tech.trim()).filter(tech => tech);
    setFormData({ ...formData, technologies });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold">Projects</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold">Projects</h4>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Add a new project to your portfolio with details and media.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="E-commerce Website"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Short Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="A brief overview of this project..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="content">Project Details</Label>
                <MarkdownEditor
                  value={formData.content}
                  onChange={(value) => setFormData({ ...formData, content: value || "" })}
                  placeholder="Write detailed information about this project, your process, challenges, and solutions..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder="Acme Corporation"
                  />
                </div>
                
                <div>
                  <Label htmlFor="role">Your Role</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="Lead Designer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="3 months"
                  />
                </div>
                
                <div>
                  <Label htmlFor="projectUrl">Project URL</Label>
                  <Input
                    id="projectUrl"
                    type="url"
                    value={formData.projectUrl}
                    onChange={(e) => setFormData({ ...formData, projectUrl: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags.join(', ')}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  placeholder="responsive, ecommerce, minimal"
                />
              </div>

              <div>
                <Label htmlFor="technologies">Technologies (comma-separated)</Label>
                <Input
                  id="technologies"
                  value={formData.technologies.join(', ')}
                  onChange={(e) => handleTechnologiesChange(e.target.value)}
                  placeholder="React, TypeScript, Tailwind CSS"
                />
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPublic"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                  />
                  <Label htmlFor="isPublic" className="text-sm">Public</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                  />
                  <Label htmlFor="isFeatured" className="text-sm">Featured</Label>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createProjectMutation.isPending}
                >
                  {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects && projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Image className="h-12 w-12 text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h4>
            <p className="text-gray-500 mb-4">
              Add your first project to showcase your work
            </p>
            <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects?.map((project) => (
            <Card key={project.id} className="group hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base flex items-center gap-2">
                      {project.title}
                      {project.isFeatured && (
                        <Badge variant="secondary" className="text-xs">Featured</Badge>
                      )}
                    </CardTitle>
                    {project.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </div>
                  {project.category && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      {projectCategories.find(c => c.value === project.category)?.label || project.category}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {(project.clientName || project.role || project.duration) && (
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                      {project.clientName && (
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {project.clientName}
                        </span>
                      )}
                      {project.role && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {project.role}
                        </span>
                      )}
                      {project.duration && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {project.duration}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {project.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{project.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-2">
                      {project.projectUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(project.projectUrl!, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(project)}
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteProject(project)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Project Dialog */}
      <Dialog open={!!editingProject} onOpenChange={(open) => !open && setEditingProject(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update your project details and settings.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateProject} className="space-y-4">
            {/* Same form fields as create, but for editing */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-title">Project Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="E-commerce Website"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-description">Short Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="A brief overview of this project..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="edit-content">Project Details</Label>
              <MarkdownEditor
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value || "" })}
                placeholder="Write detailed information about this project..."
              />
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                />
                <Label htmlFor="edit-isPublic" className="text-sm">Public</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isFeatured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                />
                <Label htmlFor="edit-isFeatured" className="text-sm">Featured</Label>
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditingProject(null)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateProjectMutation.isPending}
              >
                {updateProjectMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}