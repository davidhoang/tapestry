import { useUser } from './use-user';
import { useQuery } from '@tanstack/react-query';

interface WorkspacePermissions {
  canAccessNotes: boolean;
  canAccessOpenToRoles: boolean;
  canAccessHiring: boolean;
  canInviteMembers: boolean;
  canManageWorkspace: boolean;
  role: string | null;
}

export function useWorkspacePermissions(workspaceSlug?: string): WorkspacePermissions {
  const { user } = useUser();
  
  const { data: workspaces } = useQuery({
    queryKey: ["/api/workspaces"],
    queryFn: async () => {
      const response = await fetch("/api/workspaces");
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user,
  });

  // Find current workspace by slug or use first workspace
  const currentWorkspace = workspaceSlug 
    ? workspaces?.find(w => w.slug === workspaceSlug)
    : workspaces?.[0];

  const userRole = currentWorkspace?.role || null;

  const permissions: WorkspacePermissions = {
    canAccessNotes: userRole === 'owner' || userRole === 'admin',
    canAccessOpenToRoles: userRole === 'owner' || userRole === 'admin', 
    canAccessHiring: userRole === 'owner' || userRole === 'admin',
    canInviteMembers: userRole === 'owner' || userRole === 'admin',
    canManageWorkspace: userRole === 'owner' || userRole === 'admin',
    role: userRole,
  };

  return permissions;
}

export function useCurrentWorkspace() {
  const { user } = useUser();
  
  const { data: workspaces } = useQuery({
    queryKey: ["/api/workspaces"],
    queryFn: async () => {
      const response = await fetch("/api/workspaces");
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user,
  });

  return workspaces?.[0] || null;
}