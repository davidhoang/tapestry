import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Building2, Crown, Shield, Edit3, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Workspace {
  id: number;
  name: string;
  slug: string;
  role: string;
  isOwner: boolean;
}

interface WorkspaceSwitcherProps {
  className?: string;
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'owner':
      return <Crown className="w-3 h-3 text-yellow-600" />;
    case 'admin':
      return <Shield className="w-3 h-3 text-red-600" />;
    case 'editor':
      return <Edit3 className="w-3 h-3 text-blue-600" />;
    case 'member':
      return <Users className="w-3 h-3 text-gray-600" />;
    default:
      return <Building2 className="w-3 h-3 text-gray-400" />;
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'owner':
      return 'Owner';
    case 'admin':
      return 'Admin';
    case 'editor':
      return 'Editor';
    case 'member':
      return 'Member';
    default:
      return 'Member';
  }
};

export default function WorkspaceSwitcher({ className = '' }: WorkspaceSwitcherProps) {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Get current workspace from URL
  const currentPath = window.location.pathname;
  const currentWorkspaceSlug = currentPath.split('/')[2];

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ['/api/workspaces'],
    queryFn: async () => {
      const response = await fetch('/api/workspaces');
      if (!response.ok) throw new Error('Failed to fetch workspaces');
      return response.json();
    },
    enabled: !!user,
  });

  const currentWorkspace = workspaces.find((w: Workspace) => w.slug === currentWorkspaceSlug) || workspaces[0];

  const handleWorkspaceSwitch = async (workspace: Workspace) => {
    if (workspace.slug === currentWorkspaceSlug) {
      setIsOpen(false);
      return;
    }

    try {
      // Clear all cached data to prevent cross-workspace contamination
      queryClient.clear();
      
      // Navigate to the new workspace
      setLocation(`/w/${workspace.slug}/directory`);
      
      // Show success toast
      const workspaceName = workspace.isOwner ? 'My Workspace' : workspace.name;
      toast({
        title: 'Workspace switched',
        description: `Now viewing ${workspaceName}`,
      });
      
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch workspace:', error);
      toast({
        title: 'Error',
        description: 'Failed to switch workspace. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading || !currentWorkspace) {
    return (
      <Button variant="ghost" size="sm" disabled className={className}>
        <span className="hidden sm:inline">Loading...</span>
        <ChevronDown className="w-3 h-3 ml-2 opacity-50" />
      </Button>
    );
  }

  const displayName = currentWorkspace.isOwner ? 'My Workspace' : currentWorkspace.name;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={`${className} justify-between min-w-[140px]`}>
          <div className="flex items-center">
            <span className="hidden sm:inline font-medium truncate max-w-[120px]">
              {displayName}
            </span>
          </div>
          <ChevronDown className="w-3 h-3 ml-2 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-[280px]">
        
        {workspaces.map((workspace: Workspace) => {
          const isCurrentWorkspace = workspace.slug === currentWorkspaceSlug;
          const workspaceName = workspace.isOwner ? 'My Workspace' : workspace.name;
          
          return (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => handleWorkspaceSwitch(workspace)}
              className={`cursor-pointer p-3 ${isCurrentWorkspace ? 'bg-accent' : ''}`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">
                      {workspaceName}
                    </span>
                    {workspace.slug !== workspace.name && (
                      <span className="text-xs text-gray-500">
                        /{workspace.slug}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {isCurrentWorkspace && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  )}
                  <span className="text-xs text-gray-500">
                    {getRoleLabel(workspace.role)}
                  </span>
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}