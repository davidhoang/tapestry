import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Settings, Mail, Crown, Shield, User } from "lucide-react";

const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Workspace name must be at least 2 characters"),
  description: z.string().optional(),
});

const inviteUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["member", "admin"]).default("member"),
});

type CreateWorkspaceForm = z.infer<typeof createWorkspaceSchema>;
type InviteUserForm = z.infer<typeof inviteUserSchema>;

interface Workspace {
  id: number;
  name: string;
  slug: string;
  description?: string;
  ownerId: number;
  role: string;
  joinedAt: string;
  owner: {
    id: number;
    email: string;
    username?: string;
  };
}

interface WorkspaceMember {
  id: number;
  role: string;
  joinedAt: string;
  user: {
    id: number;
    email: string;
    username?: string;
  };
}

export default function WorkspacePage() {
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createForm = useForm<CreateWorkspaceForm>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const inviteForm = useForm<InviteUserForm>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  const { data: workspaces, isLoading } = useQuery({
    queryKey: ["/api/workspaces"],
    queryFn: async () => {
      const response = await fetch("/api/workspaces");
      if (!response.ok) throw new Error("Failed to fetch workspaces");
      return response.json() as Promise<Workspace[]>;
    },
  });

  const { data: members } = useQuery({
    queryKey: ["/api/workspaces", selectedWorkspace?.id, "members"],
    queryFn: async () => {
      if (!selectedWorkspace) return [];
      const response = await fetch(`/api/workspaces/${selectedWorkspace.id}/members`);
      if (!response.ok) throw new Error("Failed to fetch members");
      return response.json() as Promise<WorkspaceMember[]>;
    },
    enabled: !!selectedWorkspace,
  });

  const createWorkspaceMutation = useMutation({
    mutationFn: async (data: CreateWorkspaceForm) => {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Workspace created",
        description: "Your new workspace has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create workspace",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const inviteUserMutation = useMutation({
    mutationFn: async (data: InviteUserForm) => {
      if (!selectedWorkspace) throw new Error("No workspace selected");
      const response = await fetch(`/api/workspaces/${selectedWorkspace.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", selectedWorkspace?.id, "members"] });
      setIsInviteDialogOpen(false);
      inviteForm.reset();
      toast({
        title: "Invitation sent",
        description: "The invitation has been sent successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-3 w-3" />;
      case "admin":
        return <Shield className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner":
        return "default" as const;
      case "admin":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workspaces</h1>
          <p className="text-muted-foreground">
            Manage your workspaces and collaborate with team members
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Workspace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Workspace</DialogTitle>
              <DialogDescription>
                Create a new workspace to collaborate with your team on design projects.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit((data) => createWorkspaceMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workspace Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Design Team" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what this workspace is for..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createWorkspaceMutation.isPending}>
                    {createWorkspaceMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {workspaces?.map((workspace) => (
          <Card 
            key={workspace.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedWorkspace?.id === workspace.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setSelectedWorkspace(workspace)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{workspace.name}</CardTitle>
                <Badge variant={getRoleBadgeVariant(workspace.role)} className="flex items-center gap-1">
                  {getRoleIcon(workspace.role)}
                  {workspace.role}
                </Badge>
              </div>
              {workspace.description && (
                <CardDescription>{workspace.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Owner: {workspace.owner.email}
              </div>
              <div className="text-sm text-muted-foreground">
                Joined: {new Date(workspace.joinedAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedWorkspace && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {selectedWorkspace.name} Settings
                </CardTitle>
                <CardDescription>
                  Manage members and settings for this workspace
                </CardDescription>
              </div>
              
              {(selectedWorkspace.role === "owner" || selectedWorkspace.role === "admin") && (
                <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Mail className="h-4 w-4 mr-2" />
                      Invite Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Team Member</DialogTitle>
                      <DialogDescription>
                        Send an invitation to collaborate on this workspace.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...inviteForm}>
                      <form onSubmit={inviteForm.handleSubmit((data) => inviteUserMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={inviteForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input placeholder="colleague@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={inviteForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <FormControl>
                                <select 
                                  className="w-full p-2 border rounded"
                                  {...field}
                                >
                                  <option value="member">Member</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={inviteUserMutation.isPending}>
                            {inviteUserMutation.isPending ? "Sending..." : "Send Invitation"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4" />
                  Members ({members?.length || 0})
                </h3>
                <div className="space-y-2">
                  {members?.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{member.user.email}</div>
                        {member.user.username && (
                          <div className="text-sm text-muted-foreground">@{member.user.username}</div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant={getRoleBadgeVariant(member.role)} className="flex items-center gap-1">
                        {getRoleIcon(member.role)}
                        {member.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}