import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { SelectDesigner } from "@db/schema";

export function useDesigners() {
  const [location] = useLocation();
  
  // Extract workspace slug from URL path - don't use fallback, get from actual URL
  const pathParts = location.split('/');
  const workspaceSlug = pathParts[1]; // This will be undefined if not in workspace URL
  
  console.log('useDesigners - location:', location, 'workspaceSlug:', workspaceSlug);
  
  return useQuery<SelectDesigner[]>({
    queryKey: ["/api/designers", workspaceSlug, Date.now()], // Add timestamp to force cache busting
    queryFn: async () => {
      const headers: Record<string, string> = {};
      
      // Only add workspace header if we have a workspace slug from URL
      if (workspaceSlug) {
        headers['x-workspace-slug'] = workspaceSlug;
        console.log('useDesigners - sending header x-workspace-slug:', workspaceSlug);
      } else {
        console.log('useDesigners - no workspaceSlug, not sending header');
      }
      
      const response = await fetch("/api/designers", {
        headers,
        cache: 'no-cache', // Force no cache
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch designers: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!workspaceSlug, // Only enable query if we have a workspace slug
    staleTime: 0, // Make data immediately stale
    gcTime: 0, // Don't cache
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