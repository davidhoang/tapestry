import { Request, Response, NextFunction } from 'express';
import { db } from '@db';
import { workspaceMembers, workspaces } from '@db/schema';
import { eq, and } from 'drizzle-orm';

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface PermissionContext {
  userId: number;
  workspaceId: number;
  role: WorkspaceRole;
  isOwner: boolean;
  isAdmin: boolean;
  isMember: boolean;
  isViewer: boolean;
}

export interface WorkspacePermissions {
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
}

// Calculate permissions based on role
export function calculatePermissions(role: WorkspaceRole): WorkspacePermissions {
  const isOwner = role === 'owner';
  const isAdmin = role === 'admin';
  const isMember = role === 'member';
  const isViewer = role === 'viewer';
  
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
    };
  }
  
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
      canRemoveMembers: false,
      canChangeRoles: false,
      canManageWorkspaceSettings: false,
      canDeleteWorkspace: false,
      canViewMembersList: true,
      canManageInvitations: true,
      canAccessAnalytics: true,
      canExportData: true,
      canViewAuditLogs: false,
      canUseAIEnrichment: true,
      canConfigureAI: false,
      canManageBilling: false,
      canViewUsage: true,
    };
  }
  
  if (isMember) {
    return {
      canCreateDesigners: true,
      canEditDesigners: true,
      canDeleteDesigners: false,
      canViewDesigners: true,
      canExportDesigners: true,
      canImportDesigners: true,
      canBulkEditDesigners: false,
      canCreateLists: true,
      canEditLists: true,
      canDeleteLists: false,
      canViewLists: true,
      canShareLists: true,
      canPublishLists: false,
      canCreateJobs: true,
      canEditJobs: true,
      canDeleteJobs: false,
      canViewJobs: true,
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
      canExportData: true,
      canViewAuditLogs: false,
      canUseAIEnrichment: true,
      canConfigureAI: false,
      canManageBilling: false,
      canViewUsage: false,
    };
  }
  
  if (isViewer) {
    return {
      canCreateDesigners: false,
      canEditDesigners: false,
      canDeleteDesigners: false,
      canViewDesigners: true,
      canExportDesigners: false,
      canImportDesigners: false,
      canBulkEditDesigners: false,
      canCreateLists: false,
      canEditLists: false,
      canDeleteLists: false,
      canViewLists: true,
      canShareLists: false,
      canPublishLists: false,
      canCreateJobs: false,
      canEditJobs: false,
      canDeleteJobs: false,
      canViewJobs: true,
      canManageJobCandidates: false,
      canAccessAIMatching: false,
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
      canUseAIEnrichment: false,
      canConfigureAI: false,
      canManageBilling: false,
      canViewUsage: false,
    };
  }
  
  // Fallback - no permissions
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
  };
}

// Get user's workspace membership and permissions
export async function getUserWorkspaceContext(userId: number, workspaceId: number): Promise<PermissionContext | null> {
  const membership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.userId, userId),
      eq(workspaceMembers.workspaceId, workspaceId)
    ),
  });

  if (!membership) {
    return null;
  }

  const role = membership.role as WorkspaceRole;
  
  return {
    userId,
    workspaceId,
    role,
    isOwner: role === 'owner',
    isAdmin: role === 'admin',
    isMember: role === 'member',
    isViewer: role === 'viewer',
  };
}

// Middleware to require specific permission
export function requirePermission(permission: keyof WorkspacePermissions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = req.user as any;
    const workspaceId = parseInt(req.params.workspaceId) || parseInt(req.body.workspaceId);
    
    if (!workspaceId) {
      return res.status(400).json({ error: "Workspace ID required" });
    }

    const context = await getUserWorkspaceContext(user.id, workspaceId);
    
    if (!context) {
      return res.status(403).json({ error: "Not a member of this workspace" });
    }

    const permissions = calculatePermissions(context.role);
    
    if (!permissions[permission]) {
      return res.status(403).json({ 
        error: `Insufficient permissions: ${permission} required`,
        requiredPermission: permission,
        userRole: context.role
      });
    }

    // Add context to request for use in handlers
    (req as any).workspaceContext = context;
    (req as any).permissions = permissions;
    
    next();
  };
}

// Middleware to require workspace membership (any role)
export function requireWorkspaceMembership() {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = req.user as any;
    const workspaceId = parseInt(req.params.workspaceId) || parseInt(req.body.workspaceId);
    
    if (!workspaceId) {
      return res.status(400).json({ error: "Workspace ID required" });
    }

    const context = await getUserWorkspaceContext(user.id, workspaceId);
    
    if (!context) {
      return res.status(403).json({ error: "Not a member of this workspace" });
    }

    const permissions = calculatePermissions(context.role);
    
    // Add context to request for use in handlers
    (req as any).workspaceContext = context;
    (req as any).permissions = permissions;
    
    next();
  };
}

// Middleware to require specific role
export function requireRole(...roles: WorkspaceRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = req.user as any;
    const workspaceId = parseInt(req.params.workspaceId) || parseInt(req.body.workspaceId);
    
    if (!workspaceId) {
      return res.status(400).json({ error: "Workspace ID required" });
    }

    const context = await getUserWorkspaceContext(user.id, workspaceId);
    
    if (!context) {
      return res.status(403).json({ error: "Not a member of this workspace" });
    }

    if (!roles.includes(context.role)) {
      return res.status(403).json({ 
        error: `Insufficient role: ${roles.join(' or ')} required`,
        requiredRoles: roles,
        userRole: context.role
      });
    }

    const permissions = calculatePermissions(context.role);
    
    // Add context to request for use in handlers
    (req as any).workspaceContext = context;
    (req as any).permissions = permissions;
    
    next();
  };
}

// Get user's default workspace context
export async function getUserDefaultWorkspace(userId: number): Promise<PermissionContext | null> {
  const membership = await db.query.workspaceMembers.findFirst({
    where: eq(workspaceMembers.userId, userId),
    with: {
      workspace: true,
    },
  });

  if (!membership) {
    return null;
  }

  return getUserWorkspaceContext(userId, membership.workspaceId);
}

// Check if user can perform action on resource
export async function canUserAccessResource(
  userId: number, 
  workspaceId: number, 
  permission: keyof WorkspacePermissions
): Promise<boolean> {
  const context = await getUserWorkspaceContext(userId, workspaceId);
  
  if (!context) {
    return false;
  }

  const permissions = calculatePermissions(context.role);
  return permissions[permission];
}

// Audit log for permission-based actions
export interface AuditLogEntry {
  userId: number;
  workspaceId: number;
  action: string;
  resource: string;
  resourceId?: number;
  metadata?: any;
  timestamp: Date;
}

export async function logPermissionAction(entry: Omit<AuditLogEntry, 'timestamp'>) {
  // In a real implementation, this would write to an audit log table
  console.log('[AUDIT]', {
    ...entry,
    timestamp: new Date().toISOString(),
  });
}