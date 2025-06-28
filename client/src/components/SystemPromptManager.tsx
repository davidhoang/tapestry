import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, CheckCircle, AlertCircle, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface SystemPrompt {
  id: number;
  workspaceId: number;
  name: string;
  description?: string;
  systemPrompt: string;
  isActive: boolean;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  createdByUser?: {
    id: number;
    email: string;
  };
}

interface SystemPromptFormData {
  name: string;
  description: string;
  systemPrompt: string;
  isActive: boolean;
}

export default function SystemPromptManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null);
  const [formData, setFormData] = useState<SystemPromptFormData>({
    name: "",
    description: "",
    systemPrompt: "",
    isActive: false,
  });

  // Extract workspace slug from URL
  const workspaceSlug = location.split('/')[1];

  const { data: systemPrompts = [], isLoading } = useQuery({
    queryKey: ["/api/system-prompts", workspaceSlug],
    queryFn: async () => {
      const response = await fetch("/api/system-prompts", {
        headers: {
          "x-workspace-slug": workspaceSlug,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch system prompts");
      }
      return response.json();
    },
  });

  const createPromptMutation = useMutation({
    mutationFn: async (data: SystemPromptFormData) => {
      const response = await fetch("/api/system-prompts", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-workspace-slug": workspaceSlug,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create system prompt");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-prompts"] });
      setIsCreateModalOpen(false);
      resetForm();
      toast({
        title: "System prompt created",
        description: "Your AI system prompt has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePromptMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: SystemPromptFormData }) => {
      const response = await fetch(`/api/system-prompts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update system prompt");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-prompts"] });
      setEditingPrompt(null);
      resetForm();
      toast({
        title: "System prompt updated",
        description: "Your AI system prompt has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePromptMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/system-prompts/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete system prompt");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-prompts"] });
      toast({
        title: "System prompt deleted",
        description: "The system prompt has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const activatePromptMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/system-prompts/${id}/activate`, {
        method: "POST",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to activate system prompt");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-prompts"] });
      toast({
        title: "System prompt activated",
        description: "The system prompt is now active and will be used for AI matching.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      systemPrompt: "",
      isActive: false,
    });
  };

  const handleEdit = (prompt: SystemPrompt) => {
    setEditingPrompt(prompt);
    setFormData({
      name: prompt.name,
      description: prompt.description || "",
      systemPrompt: prompt.systemPrompt,
      isActive: prompt.isActive,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPrompt) {
      updatePromptMutation.mutate({ id: editingPrompt.id, data: formData });
    } else {
      createPromptMutation.mutate(formData);
    }
  };

  const defaultSystemPrompt = `You are an expert design recruiter with access to historical feedback data. Learn from past recommendations to improve future matches.

IMPORTANT FEEDBACK INSIGHTS:
{feedbackInsights}

Based on feedback history, prioritize:
1. Location alignment when specified
2. Experience level matching
3. Skill relevance
4. Patterns from successful matches

Return JSON response:
{
  "analysis": "Brief analysis including how feedback influenced recommendations",
  "recommendations": [
    {
      "designerId": number,
      "matchScore": number (0-100),
      "reasoning": "Match explanation considering feedback",
      "matchedSkills": ["skill1", "skill2"],
      "concerns": "Potential concerns (optional)",
      "confidenceLevel": "high|medium|low"
    }
  ]
}

Only include matches with score 70+ (raised due to feedback learning). Limit to 8 matches.`;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div>Loading system prompts...</div>
        </CardContent>
      </Card>
    );
  }

  const activePrompt = systemPrompts.find((p: SystemPrompt) => p.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI System Prompts</h2>
          <p className="text-muted-foreground">
            Configure custom system prompts to improve AI matching quality
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              resetForm();
              setFormData(prev => ({ ...prev, systemPrompt: defaultSystemPrompt }));
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create prompt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create system prompt</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Enhanced Matching Prompt"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this prompt's purpose"
                />
              </div>
              <div>
                <Label htmlFor="systemPrompt">System prompt</Label>
                <Textarea
                  id="systemPrompt"
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                  rows={15}
                  className="font-mono text-sm"
                  placeholder="Enter the system prompt for the AI..."
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label>Activate immediately</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createPromptMutation.isPending}>
                  {createPromptMutation.isPending ? "Creating..." : "Create prompt"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {activePrompt && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{activePrompt.name}</strong> is currently active and being used for AI matching.
          </AlertDescription>
        </Alert>
      )}

      {systemPrompts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No system prompts configured</h3>
            <p className="text-muted-foreground mb-4">
              Create your first system prompt to customize how the AI analyzes job requirements and matches designers.
            </p>
            <Button onClick={() => {
              resetForm();
              setFormData(prev => ({ ...prev, systemPrompt: defaultSystemPrompt }));
              setIsCreateModalOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first prompt
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {systemPrompts.map((prompt: SystemPrompt) => (
            <Card key={prompt.id} className={prompt.isActive ? "ring-2 ring-primary" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CardTitle className="text-lg">{prompt.name}</CardTitle>
                    {prompt.isActive && (
                      <Badge variant="default">Active</Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {!prompt.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => activatePromptMutation.mutate(prompt.id)}
                        disabled={activatePromptMutation.isPending}
                      >
                        Activate
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(prompt)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deletePromptMutation.mutate(prompt.id)}
                      disabled={deletePromptMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {prompt.description && (
                  <p className="text-sm text-muted-foreground">{prompt.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-3 rounded-md">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {prompt.systemPrompt.slice(0, 300)}
                    {prompt.systemPrompt.length > 300 && "..."}
                  </pre>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Created {new Date(prompt.createdAt).toLocaleString()}
                  {prompt.createdByUser && ` by ${prompt.createdByUser.email}`}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={!!editingPrompt} onOpenChange={() => setEditingPrompt(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit system prompt</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-systemPrompt">System prompt</Label>
              <Textarea
                id="edit-systemPrompt"
                value={formData.systemPrompt}
                onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                rows={15}
                className="font-mono text-sm"
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label>Active</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setEditingPrompt(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updatePromptMutation.isPending}>
                {updatePromptMutation.isPending ? "Updating..." : "Update prompt"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}