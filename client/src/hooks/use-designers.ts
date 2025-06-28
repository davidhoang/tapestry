import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { SelectDesigner } from "@db/schema";

export function useDesigners() {
  const [location] = useLocation();
  
  // Extract workspace slug from URL path
  const workspaceSlug = location.split('/')[1] || "david-v-hoang";
  
  return useQuery<SelectDesigner[]>({
    queryKey: ["/api/designers", workspaceSlug],
    queryFn: async () => {
      const response = await fetch("/api/designers", {
        headers: {
          'x-workspace-slug': workspaceSlug,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch designers: ${response.statusText}`);
      }
      return response.json();
    },
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
  
  // Extract workspace slug from URL path
  const workspaceSlug = location.split('/')[1] || "david-v-hoang";
  
  return useQuery<SelectDesigner>({
    queryKey: [`/api/designers/slug/${slug}`, workspaceSlug],
    queryFn: async () => {
      const response = await fetch(`/api/designers/slug/${slug}`, {
        headers: {
          'x-workspace-slug': workspaceSlug,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch designer: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!slug && slug.length > 0,
  });
}