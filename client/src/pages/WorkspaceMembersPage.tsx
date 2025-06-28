import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkspacePermissions } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, Shield, Trash2, Mail, Calendar, Crown, UserCheck, Eye, Settings } from "lucide-react";
import { useCurrentWorkspace } from "@/hooks/use-permissions";

interface WorkspaceMember {
  id: number;
  userId: number;
  role: string;
  joinedAt: string;
  user: {
    id: number;
    email: string;
    username: string;
    profilePhotoUrl: string;
    createdAt: string;
  };
}

interface WorkspaceInvitation {
  id: number;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
  invitedBy: {
    id: number;
    email: string;
    username: string;
  };
}

const roleIcons = {
  owner: Crown,
  admin: Shield,
  editor: Shield,
  member: UserCheck,
};

const roleColors = {
  owner: "bg-yellow-100 text-yellow-800 border-yellow-200",
  admin: "bg-blue-100 text-blue-800 border-blue-200",
  member: "bg-green-100 text-green-800 border-green-200",
  viewer: "bg-gray-100 text-gray-800 border-gray-200",
};

const roleDescriptions = {
  owner: "Full access to everything including workspace settings and billing",
  admin: "Can manage content and invite members, but can't change workspace settings",
  member: "Can view designers directory, add designers, and use AI matchmaker. No access to lists or hiring by default",
  viewer: "Read-only access to workspace content",
};

export default function WorkspaceMembersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const permissions = useWorkspacePermissions();
  const currentWorkspace = useCurrentWorkspace();
  const [selectedMember, setSelectedMember] = useState<WorkspaceMember | null>(null);

  const workspaceId = currentWorkspace?.id;

  // Fetch workspace members
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['/api/workspaces', workspaceId, 'members'],
    queryFn: async () => {
      if (!workspaceId) return [];
      const response = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (!response.ok) throw new Error('Failed to fetch members');
      return response.json() as WorkspaceMember[];
    },
    enabled: !!workspaceId && permissions.canViewMembersList,
  });

  // Fetch pending invitations
  const { data: invitations, isLoading: invitationsLoading } = useQuery({
    queryKey: ['/api/workspaces', workspaceId, 'invitations'],
    queryFn: async () => {
      if (!workspaceId) return [];
      const response = await fetch(`/api/workspaces/${workspaceId}/invitations`);
      if (!response.ok) throw new Error('Failed to fetch invitations');
      return response.json() as WorkspaceInvitation[];
    },
    enabled: !!workspaceId && permissions.canManageInvitations,
  });

  // Change member role mutation
  const changeRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: number; role: string }) => {
      const response = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change role');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Role updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces', workspaceId, 'members'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: number) => {
      const response = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove member');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Member removed successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces', workspaceId, 'members'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel invitation mutation
  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await fetch(`/api/workspaces/${workspaceId}/invitations/${invitationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel invitation');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Invitation cancelled successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces', workspaceId, 'invitations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to cancel invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!permissions.canViewMembersList) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              You don't have permission to view workspace members.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Workspace Members</h1>
            <p className="text-gray-600 mt-2">
              Manage access and permissions for {currentWorkspace?.name}
            </p>
          </div>
          {permissions.canInviteMembers && (
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          )}
        </div>

        <Tabs defaultValue="members" className="space-y-6">
          <TabsList>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members ({members?.length || 0})
            </TabsTrigger>
            {permissions.canManageInvitations && (
              <TabsTrigger value="invitations" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Pending Invitations ({invitations?.length || 0})
              </TabsTrigger>
            )}
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Permission Guide
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>Active Members</CardTitle>
                <CardDescription>
                  People who have accepted invitations and can access the workspace
                </CardDescription>
              </CardHeader>
              <CardContent>
                {membersLoading ? (
                  <div className="text-center py-8">Loading members...</div>
                ) : !members?.length ? (
                  <div className="text-center py-8 text-gray-500">
                    No members found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {members.map((member) => {
                      const RoleIcon = roleIcons[member.role as keyof typeof roleIcons];
                      return (
                        <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member.user.profilePhotoUrl} />
                              <AvatarFallback>
                                {member.user.email[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{member.user.email}</div>
                              <div className="text-sm text-gray-500 flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                Joined {new Date(member.joinedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <Badge className={`flex items-center gap-1 ${roleColors[member.role as keyof typeof roleColors]}`}>
                              <RoleIcon className="h-3 w-3" />
                              {member.role}
                            </Badge>

                            {permissions.canChangeRoles && member.role !== 'owner' && (
                              <Select
                                value={member.role}
                                onValueChange={(role) =>
                                  changeRoleMutation.mutate({ memberId: member.id, role })
                                }
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="member">Member</SelectItem>
                                  <SelectItem value="viewer">Viewer</SelectItem>
                                  {permissions.isOwner && (
                                    <SelectItem value="owner">Owner</SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            )}

                            {permissions.canRemoveMembers && member.role !== 'owner' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove Member</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to remove {member.user.email} from this workspace?
                                      They will lose access to all workspace content.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => removeMemberMutation.mutate(member.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Remove Member
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {permissions.canManageInvitations && (
            <TabsContent value="invitations">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Invitations</CardTitle>
                  <CardDescription>
                    Invitations that have been sent but not yet accepted
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {invitationsLoading ? (
                    <div className="text-center py-8">Loading invitations...</div>
                  ) : !invitations?.length ? (
                    <div className="text-center py-8 text-gray-500">
                      No pending invitations
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {invitations.map((invitation) => {
                        const RoleIcon = roleIcons[invitation.role as keyof typeof roleIcons];
                        const isExpired = new Date(invitation.expiresAt) < new Date();
                        
                        return (
                          <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                                <Mail className="h-5 w-5 text-gray-600" />
                              </div>
                              <div>
                                <div className="font-medium">{invitation.email}</div>
                                <div className="text-sm text-gray-500">
                                  Invited by {invitation.invitedBy.email} on{' '}
                                  {new Date(invitation.createdAt).toLocaleDateString()}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {isExpired ? (
                                    <span className="text-red-600">Expired</span>
                                  ) : (
                                    `Expires ${new Date(invitation.expiresAt).toLocaleDateString()}`
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <Badge className={`flex items-center gap-1 ${roleColors[invitation.role as keyof typeof roleColors]}`}>
                                <RoleIcon className="h-3 w-3" />
                                {invitation.role}
                              </Badge>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => cancelInvitationMutation.mutate(invitation.id)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="permissions">
            <div className="grid gap-6 md:grid-cols-2">
              {Object.entries(roleDescriptions).map(([role, description]) => {
                const RoleIcon = roleIcons[role as keyof typeof roleIcons];
                return (
                  <Card key={role}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <RoleIcon className="h-5 w-5" />
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </CardTitle>
                      <CardDescription>{description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {role === 'owner' && (
                          <>
                            <div>• Manage workspace settings and billing</div>
                            <div>• Add and remove members</div>
                            <div>• Change member roles</div>
                            <div>• Access all features and analytics</div>
                          </>
                        )}
                        {role === 'admin' && (
                          <>
                            <div>• Invite new members</div>
                            <div>• Manage all content and lists</div>
                            <div>• Use AI features and hiring tools</div>
                            <div>• Access analytics and export data</div>
                          </>
                        )}
                        {role === 'member' && (
                          <>
                            <div>• View designers directory</div>
                            <div>• Add and edit designers</div>
                            <div>• Use AI matchmaker</div>
                            <div>• No access to lists or hiring</div>
                          </>
                        )}
                        {role === 'viewer' && (
                          <>
                            <div>• View designers and lists</div>
                            <div>• View jobs and hiring information</div>
                            <div>• Read-only access to all content</div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}