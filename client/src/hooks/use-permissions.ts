import { useUser } from './use-user';
import { useQuery } from '@tanstack/react-query';

export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'member';

interface WorkspacePermissions {
  // Designer Management
  canCreateDesigners: boolean;
  canEditDesigners: boolean;
  canDeleteDesigners: boolean;
  canViewDesigners: boolean;
  canExportDesigners: boolean;
  canImportDesigners: boolean;
  canBulkEditDesigners: boolean;
  
  // List Management
  canCreateLists: boolean;
  canEditLists: boolean;
  canDeleteLists: boolean;
  canViewLists: boolean;
  canShareLists: boolean;
  canPublishLists: boolean;
  
  // Hiring & Jobs
  canCreateJobs: boolean;
  canEditJobs: boolean;
  canDeleteJobs: boolean;
  canViewJobs: boolean;
  canManageJobCandidates: boolean;
  canAccessAIMatching: boolean;
  
  // Workspace Management
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canChangeRoles: boolean;
  canManageWorkspaceSettings: boolean;
  canDeleteWorkspace: boolean;
  canViewMembersList: boolean;
  canManageInvitations: boolean;
  
  // Data & Analytics
  canAccessAnalytics: boolean;
  canExportData: boolean;
  canViewAuditLogs: boolean;
  
  // AI Features
  canUseAIEnrichment: boolean;
  canConfigureAI: boolean;
  
  // Billing & Admin
  canManageBilling: boolean;
  canViewUsage: boolean;
  
  // Legacy permissions for backward compatibility
  canAccessNotes: boolean;
  canAccessOpenToRoles: boolean;
  canAccessHiring: boolean;
  canManageWorkspace: boolean;
  
  role: WorkspaceRole | null;
  isOwner: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isMember: boolean;
}

// Permission utility function
function calculatePermissions(role: WorkspaceRole | null): WorkspacePermissions {
  const isOwner = role === 'owner';
  const isAdmin = role === 'admin';
  const isEditor = role === 'editor';
  const isMember = role === 'member';
  
  // Owner has all permissions
  if (isOwner) {
    return {
      canCreateDesigners: true,
      canEditDesigners: true,
      canDeleteDesigners: true,
      canViewDesigners: true,
      canExportDesigners: true,
      canImportDesigners: true,
      canBulkEditDesigners: true,
      canCreateLists: true,
      canEditLists: true,
      canDeleteLists: true,
      canViewLists: true,
      canShareLists: true,
      canPublishLists: true,
      canCreateJobs: true,
      canEditJobs: true,
      canDeleteJobs: true,
      canViewJobs: true,
      canManageJobCandidates: true,
      canAccessAIMatching: true,
      canInviteMembers: true,
      canRemoveMembers: true,
      canChangeRoles: true,
      canManageWorkspaceSettings: true,
      canDeleteWorkspace: true,
      canViewMembersList: true,
      canManageInvitations: true,
      canAccessAnalytics: true,
      canExportData: true,
      canViewAuditLogs: true,
      canUseAIEnrichment: true,
      canConfigureAI: true,
      canManageBilling: true,
      canViewUsage: true,
      canAccessNotes: true,
      canAccessOpenToRoles: true,
      canAccessHiring: true,
      canManageWorkspace: true,
      role,
      isOwner: true,
      isAdmin: false,
      isEditor: false,
      isMember: false,
    };
  }
  
  // Admin has most permissions except critical workspace management
  if (isAdmin) {
    return {
      canCreateDesigners: true,
      canEditDesigners: true,
      canDeleteDesigners: true,
      canViewDesigners: true,
      canExportDesigners: true,
      canImportDesigners: true,
      canBulkEditDesigners: true,
      canCreateLists: true,
      canEditLists: true,
      canDeleteLists: true,
      canViewLists: true,
      canShareLists: true,
      canPublishLists: true,
      canCreateJobs: true,
      canEditJobs: true,
      canDeleteJobs: true,
      canViewJobs: true,
      canManageJobCandidates: true,
      canAccessAIMatching: true,
      canInviteMembers: true,
      canRemoveMembers: true,
      canChangeRoles: true,
      canManageWorkspaceSettings: false,
      canDeleteWorkspace: false,
      canViewMembersList: true,
      canManageInvitations: true,
      canAccessAnalytics: true,
      canExportData: true,
      canViewAuditLogs: true,
      canUseAIEnrichment: true,
      canConfigureAI: true,
      canManageBilling: false,
      canViewUsage: true,
      canAccessNotes: true,
      canAccessOpenToRoles: true,
      canAccessHiring: true,
      canManageWorkspace: false,
      role,
      isOwner: false,
      isAdmin: true,
      isEditor: false,
      isMember: false,
    };
  }
  
  // Editor has content management permissions but limited workspace management
  if (isEditor) {
    return {
      canCreateDesigners: true,
      canEditDesigners: true,
      canDeleteDesigners: true,
      canViewDesigners: true,
      canExportDesigners: true,
      canImportDesigners: true,
      canBulkEditDesigners: true,
      canCreateLists: true,
      canEditLists: true,
      canDeleteLists: true,
      canViewLists: true,
      canShareLists: true,
      canPublishLists: true,
      canCreateJobs: true,
      canEditJobs: true,
      canDeleteJobs: true,
      canViewJobs: true,
      canManageJobCandidates: true,
      canAccessAIMatching: true,
      canInviteMembers: false,
      canRemoveMembers: false,
      canChangeRoles: false,
      canManageWorkspaceSettings: false,
      canDeleteWorkspace: false,
      canViewMembersList: true,
      canManageInvitations: false,
      canAccessAnalytics: true,
      canExportData: true,
      canViewAuditLogs: false,
      canUseAIEnrichment: true,
      canConfigureAI: false,
      canManageBilling: false,
      canViewUsage: false,
      canAccessNotes: true,
      canAccessOpenToRoles: true,
      canAccessHiring: true,
      canManageWorkspace: false,
      role,
      isOwner: false,
      isAdmin: false,
      isEditor: true,
      isMember: false,
    };
  }
  
  // Member has limited permissions - can view designers, create designers, and use AI matchmaker
  if (isMember) {
    return {
      canCreateDesigners: true,
      canEditDesigners: true,
      canDeleteDesigners: false,
      canViewDesigners: true,
      canExportDesigners: true,
      canImportDesigners: true,
      canBulkEditDesigners: false,
      canCreateLists: false,
      canEditLists: false,
      canDeleteLists: false,
      canViewLists: false,
      canShareLists: false,
      canPublishLists: false,
      canCreateJobs: false,
      canEditJobs: false,
      canDeleteJobs: false,
      canViewJobs: false,
      canManageJobCandidates: false,
      canAccessAIMatching: true,
      canInviteMembers: false,
      canRemoveMembers: false,
      canChangeRoles: false,
      canManageWorkspaceSettings: false,
      canDeleteWorkspace: false,
      canViewMembersList: true,
      canManageInvitations: false,
      canAccessAnalytics: false,
      canExportData: false,
      canViewAuditLogs: false,
      canUseAIEnrichment: true,
      canConfigureAI: false,
      canManageBilling: false,
      canViewUsage: false,
      canAccessNotes: true,
      canAccessOpenToRoles: false,
      canAccessHiring: false,
      canManageWorkspace: false,
      role,
      isOwner: false,
      isAdmin: false,
      isEditor: false,
      isMember: true,
    };
  }
  
  // No role - no permissions
  return {
    canCreateDesigners: false,
    canEditDesigners: false,
    canDeleteDesigners: false,
    canViewDesigners: false,
    canExportDesigners: false,
    canImportDesigners: false,
    canBulkEditDesigners: false,
    canCreateLists: false,
    canEditLists: false,
    canDeleteLists: false,
    canViewLists: false,
    canShareLists: false,
    canPublishLists: false,
    canCreateJobs: false,
    canEditJobs: false,
    canDeleteJobs: false,
    canViewJobs: false,
    canManageJobCandidates: false,
    canAccessAIMatching: false,
    canInviteMembers: false,
    canRemoveMembers: false,
    canChangeRoles: false,
    canManageWorkspaceSettings: false,
    canDeleteWorkspace: false,
    canViewMembersList: false,
    canManageInvitations: false,
    canAccessAnalytics: false,
    canExportData: false,
    canViewAuditLogs: false,
    canUseAIEnrichment: false,
    canConfigureAI: false,
    canManageBilling: false,
    canViewUsage: false,
    canAccessNotes: false,
    canAccessOpenToRoles: false,
    canAccessHiring: false,
    canManageWorkspace: false,
    role: null,
    isOwner: false,
    isAdmin: false,
    isEditor: false,
    isMember: false,
  };
}

export function useWorkspacePermissions(workspaceSlug?: string): WorkspacePermissions {
  const { user } = useUser();
  
  const { data: permissions } = useQuery({
    queryKey: ['/api/workspaces/permissions', workspaceSlug],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (workspaceSlug) {
        headers['x-workspace-slug'] = workspaceSlug;
      }
      
      const response = await fetch('/api/workspaces/permissions', { headers });
      if (!response.ok) throw new Error('Failed to fetch permissions');
      return response.json();
    },
    enabled: !!user,
  });

  if (!permissions) {
    return calculatePermissions(null);
  }

  return calculatePermissions(permissions.role);
}

export function useCurrentWorkspace() {
  const { user } = useUser();
  
  const { data: workspaces } = useQuery({
    queryKey: ['/api/workspaces'],
    queryFn: async () => {
      const response = await fetch('/api/workspaces');
      if (!response.ok) throw new Error('Failed to fetch workspaces');
      return response.json();
    },
    enabled: !!user,
  });

  // Return the first workspace (primary workspace) or null
  return workspaces?.[0] || null;
}