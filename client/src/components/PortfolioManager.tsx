import { useState } from "react";
import { Plus, ExternalLink, Edit2, Trash2, Globe, Lock, Eye, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useDesignerPortfolios, useCreatePortfolio, useUpdatePortfolio, useDeletePortfolio } from "@/hooks/use-portfolios";
import ProjectManager from "./ProjectManager";
import type { SelectDesigner, SelectPortfolio } from '@db/schema';

interface PortfolioManagerProps {
  designer: SelectDesigner;
}

const portfolioThemes = [
  { value: "modern", label: "Modern" },
  { value: "minimal", label: "Minimal" },
  { value: "creative", label: "Creative" },
  { value: "professional", label: "Professional" },
];

export default function PortfolioManager({ designer }: PortfolioManagerProps) {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<SelectPortfolio | null>(null);
  
  const { data: portfolios, isLoading } = useDesignerPortfolios(designer.id);
  const createPortfolioMutation = useCreatePortfolio();
  const updatePortfolioMutation = useUpdatePortfolio();
  const deletePortfolioMutation = useDeletePortfolio();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tagline: "",
    theme: "modern",
    primaryColor: "#C8944B",
    isPublic: true,
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      tagline: "",
      theme: "modern",
      primaryColor: "#C8944B",
      isPublic: true,
    });
  };

  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Portfolio title is required",
        variant: "destructive",
      });
      return;
    }

    try {
      await createPortfolioMutation.mutateAsync({
        designerId: designer.id,
        ...formData,
      });
      
      toast({
        title: "Success",
        description: "Portfolio created successfully",
      });
      
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create portfolio",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingPortfolio) return;

    try {
      await updatePortfolioMutation.mutateAsync({
        id: editingPortfolio.id,
        ...formData,
      });
      
      toast({
        title: "Success",
        description: "Portfolio updated successfully",
      });
      
      setEditingPortfolio(null);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update portfolio",
        variant: "destructive",
      });
    }
  };

  const handleDeletePortfolio = async (portfolio: SelectPortfolio) => {
    if (!confirm(`Are you sure you want to delete "${portfolio.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deletePortfolioMutation.mutateAsync(portfolio.id);
      
      toast({
        title: "Success",
        description: "Portfolio deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete portfolio",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (portfolio: SelectPortfolio) => {
    setFormData({
      title: portfolio.title,
      description: portfolio.description || "",
      tagline: portfolio.tagline || "",
      theme: portfolio.theme || "modern",
      primaryColor: portfolio.primaryColor || "#C8944B",
      isPublic: portfolio.isPublic || false,
    });
    setEditingPortfolio(portfolio);
  };

  const getPortfolioUrl = (portfolio: SelectPortfolio) => {
    return `${window.location.origin}/portfolio/${portfolio.slug}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Portfolios</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
        <h3 className="text-lg font-semibold">Portfolios</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Portfolio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Portfolio</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreatePortfolio} className="space-y-4">
              <div>
                <Label htmlFor="title">Portfolio Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="My Design Portfolio"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="Creating beautiful digital experiences"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell visitors about your design philosophy and approach..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="theme">Theme</Label>
                <Select value={formData.theme} onValueChange={(value) => setFormData({ ...formData, theme: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {portfolioThemes.map((theme) => (
                      <SelectItem key={theme.value} value={theme.value}>
                        {theme.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    placeholder="#C8944B"
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                />
                <Label htmlFor="isPublic" className="text-sm">
                  Make portfolio public
                </Label>
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
                  disabled={createPortfolioMutation.isPending}
                >
                  {createPortfolioMutation.isPending ? "Creating..." : "Create Portfolio"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {portfolios && portfolios.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Globe className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No portfolios yet</h3>
            <p className="text-gray-500 mb-4">
              Create your first portfolio to showcase {designer.name}'s work
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Portfolio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {portfolios?.map((portfolio) => (
            <Card key={portfolio.id} className="group hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {portfolio.title}
                      {portfolio.isPublic ? (
                        <Globe className="h-4 w-4 text-green-500" />
                      ) : (
                        <Lock className="h-4 w-4 text-gray-400" />
                      )}
                    </CardTitle>
                    {portfolio.tagline && (
                      <CardDescription className="mt-1">
                        {portfolio.tagline}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {portfolio.theme}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                {portfolio.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {portfolio.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {portfolio.isPublic && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(getPortfolioUrl(portfolio), '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(portfolio)}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePortfolio(portfolio)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="mt-3 pt-3 border-t">
                  <ProjectManager portfolio={portfolio} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Portfolio Dialog */}
      <Dialog open={!!editingPortfolio} onOpenChange={(open) => !open && setEditingPortfolio(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Portfolio</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdatePortfolio} className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Portfolio Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="My Design Portfolio"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit-tagline">Tagline</Label>
              <Input
                id="edit-tagline"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="Creating beautiful digital experiences"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell visitors about your design philosophy and approach..."
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-theme">Theme</Label>
              <Select value={formData.theme} onValueChange={(value) => setFormData({ ...formData, theme: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {portfolioThemes.map((theme) => (
                    <SelectItem key={theme.value} value={theme.value}>
                      {theme.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-primaryColor">Primary Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="edit-primaryColor"
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-16 h-10"
                />
                <Input
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  placeholder="#C8944B"
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
              />
              <Label htmlFor="edit-isPublic" className="text-sm">
                Make portfolio public
              </Label>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditingPortfolio(null)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updatePortfolioMutation.isPending}
              >
                {updatePortfolioMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}