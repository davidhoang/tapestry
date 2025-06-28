import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { SelectDesigner } from "@db/schema";

export function useDesigners() {
  const [location] = useLocation();
  
  // Extract workspace slug from URL path - don't use fallback, get from actual URL
  const pathParts = location.split('/');
  const workspaceSlug = pathParts[1]; // This will be undefined if not in workspace URL
  
  console.log('useDesigners - current location:', location);
  console.log('useDesigners - extracted workspaceSlug:', workspaceSlug);
  
  return useQuery<SelectDesigner[]>({
    queryKey: ["/api/designers", workspaceSlug],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      
      // Only add workspace header if we have a workspace slug from URL
      if (workspaceSlug) {
        headers['x-workspace-slug'] = workspaceSlug;
        console.log('useDesigners - sending header:', workspaceSlug);
      } else {
        console.log('useDesigners - no workspace slug found, no header sent');
      }
      
      const response = await fetch("/api/designers", {
        headers,
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch designers: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!workspaceSlug, // Only enable query if we have a workspace slug
  });
}

export function useDesigner(id: number) {
  return useQuery<SelectDesigner>({
    queryKey: [`/api/designers/${id}`],
    enabled: !!id && id > 0,
  });
}

export function useDesignerBySlug(slug: string) {
  const [location] = useLocation();
  
  // Extract workspace slug from URL path - don't use fallback, get from actual URL
  const pathParts = location.split('/');
  const workspaceSlug = pathParts[1]; // This will be undefined if not in workspace URL
  
  return useQuery<SelectDesigner>({
    queryKey: [`/api/designers/slug/${slug}`, workspaceSlug],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      
      // Only add workspace header if we have a workspace slug from URL
      if (workspaceSlug) {
        headers['x-workspace-slug'] = workspaceSlug;
      }
      
      const response = await fetch(`/api/designers/slug/${slug}`, {
        headers,
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch designer: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!slug && slug.length > 0 && !!workspaceSlug,
  });
}