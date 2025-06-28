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
  
  // Legacy permissions (for backward compatibility)
  canAccessNotes: boolean;
  canAccessOpenToRoles: boolean;
  canAccessHiring: boolean;
  canManageWorkspace: boolean;
  
  role: WorkspaceRole | null;
  isOwner: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isMember: boolean;
  isViewer: boolean;
}

// Permission utility function
function calculatePermissions(role: WorkspaceRole | null): WorkspacePermissions {
  const isOwner = role === 'owner';
  const isAdmin = role === 'admin';
  const isMember = role === 'member';
  const isEditor = role === 'editor';
  
  // Owner has all permissions
  if (isOwner) {
    return {
      // Designer Management
      canCreateDesigners: true,
      canEditDesigners: true,
      canDeleteDesigners: true,
      canViewDesigners: true,
      canExportDesigners: true,
      canImportDesigners: true,
      canBulkEditDesigners: true,
      
      // List Management
      canCreateLists: true,
      canEditLists: true,
      canDeleteLists: true,
      canViewLists: true,
      canShareLists: true,
      canPublishLists: true,
      
      // Hiring & Jobs
      canCreateJobs: true,
      canEditJobs: true,
      canDeleteJobs: true,
      canViewJobs: true,
      canManageJobCandidates: true,
      canAccessAIMatching: true,
      
      // Workspace Management
      canInviteMembers: true,
      canRemoveMembers: true,
      canChangeRoles: true,
      canManageWorkspaceSettings: true,
      canDeleteWorkspace: true,
      canViewMembersList: true,
      canManageInvitations: true,
      
      // Data & Analytics
      canAccessAnalytics: true,
      canExportData: true,
      canViewAuditLogs: true,
      
      // AI Features
      canUseAIEnrichment: true,
      canConfigureAI: true,
      
      // Billing & Admin
      canManageBilling: true,
      canViewUsage: true,
      
      // Legacy permissions
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
      // Designer Management
      canCreateDesigners: true,
      canEditDesigners: true,
      canDeleteDesigners: true,
      canViewDesigners: true,
      canExportDesigners: true,
      canImportDesigners: true,
      canBulkEditDesigners: true,
      
      // List Management
      canCreateLists: true,
      canEditLists: true,
      canDeleteLists: true,
      canViewLists: true,
      canShareLists: true,
      canPublishLists: true,
      
      // Hiring & Jobs
      canCreateJobs: true,
      canEditJobs: true,
      canDeleteJobs: true,
      canViewJobs: true,
      canManageJobCandidates: true,
      canAccessAIMatching: true,
      
      // Workspace Management (limited)
      canInviteMembers: true,
      canRemoveMembers: false, // Only owner can remove members
      canChangeRoles: false, // Only owner can change roles
      canManageWorkspaceSettings: false, // Only owner can manage settings
      canDeleteWorkspace: false, // Only owner can delete workspace
      canViewMembersList: true,
      canManageInvitations: true,
      
      // Data & Analytics
      canAccessAnalytics: true,
      canExportData: true,
      canViewAuditLogs: false, // Only owner can view audit logs
      
      // AI Features
      canUseAIEnrichment: true,
      canConfigureAI: false, // Only owner can configure AI
      
      // Billing & Admin
      canManageBilling: false, // Only owner can manage billing
      canViewUsage: true,
      
      // Legacy permissions
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
  
  // Member has standard permissions
  if (isMember) {
    return {
      // Designer Management
      canCreateDesigners: true,
      canEditDesigners: true,
      canDeleteDesigners: false, // Members can't delete designers
      canViewDesigners: true,
      canExportDesigners: true,
      canImportDesigners: true,
      canBulkEditDesigners: false, // Members can't bulk edit
      
      // List Management - Members restricted from lists
      canCreateLists: false,
      canEditLists: false,
      canDeleteLists: false,
      canViewLists: false,
      canShareLists: false,
      canPublishLists: false,
      
      // Hiring & Jobs - Members restricted from hiring
      canCreateJobs: false,
      canEditJobs: false,
      canDeleteJobs: false,
      canViewJobs: false,
      canManageJobCandidates: false,
      canAccessAIMatching: true, // Can still use Matchmaker
      
      // Workspace Management (very limited)
      canInviteMembers: false, // Members can't invite
      canRemoveMembers: false,
      canChangeRoles: false,
      canManageWorkspaceSettings: false,
      canDeleteWorkspace: false,
      canViewMembersList: true,
      canManageInvitations: false,
      
      // Data & Analytics
      canAccessAnalytics: false, // Members can't access analytics
      canExportData: true,
      canViewAuditLogs: false,
      
      // AI Features
      canUseAIEnrichment: true,
      canConfigureAI: false,
      
      // Billing & Admin
      canManageBilling: false,
      canViewUsage: false,
      
      // Legacy permissions
      canAccessNotes: false,
      canAccessOpenToRoles: false,
      canAccessHiring: false, // Members cannot access hiring
      canManageWorkspace: false,
      
      role,
      isOwner: false,
      isAdmin: false,
      isMember: true,
      isEditor: false,
    };
  }
  
  // Editor has content management permissions but limited workspace management
  if (isEditor) {
    return {
      // Designer Management
      canCreateDesigners: true,
      canEditDesigners: true,
      canDeleteDesigners: true,
      canViewDesigners: true,
      canExportDesigners: true,
      canImportDesigners: true,
      canBulkEditDesigners: true,
      
      // List Management
      canCreateLists: true,
      canEditLists: true,
      canDeleteLists: true,
      canViewLists: true,
      canShareLists: true,
      canPublishLists: true,
      
      // Hiring & Jobs
      canCreateJobs: true,
      canEditJobs: true,
      canDeleteJobs: true,
      canViewJobs: true,
      canManageJobCandidates: true,
      canAccessAIMatching: true,
      
      // Workspace Management (limited)
      canInviteMembers: false,
      canRemoveMembers: false,
      canChangeRoles: false,
      canManageWorkspaceSettings: false,
      canDeleteWorkspace: false,
      canViewMembersList: true,
      canManageInvitations: false,
      
      // Data & Analytics
      canAccessAnalytics: true,
      canExportData: true,
      canViewAuditLogs: false,
      
      // AI Features
      canUseAIEnrichment: true,
      canConfigureAI: false,
      
      // Billing & Admin
      canManageBilling: false,
      canViewUsage: false,
      
      // Legacy permissions
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
    isMember: false,
    isEditor: false,
  };
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
    ? workspaces?.find((w: any) => w.slug === workspaceSlug)
    : workspaces?.[0];

  const userRole = currentWorkspace?.role as WorkspaceRole || null;

  return calculatePermissions(userRole);
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