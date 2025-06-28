import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import type { InsertDesigner, SelectDesigner } from "@db/schema";

export function useDesigners() {
  const [location] = useLocation();
  
  // Extract workspace slug from URL path - don't use fallback, get from actual URL
  const pathParts = location.split('/');
  const workspaceSlug = pathParts[1]; // This will be undefined if not in workspace URL
  

  
  return useQuery<SelectDesigner[]>({
    queryKey: ["/api/designers", workspaceSlug],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      
      // Always try to add workspace header if we have a workspace slug from URL
      if (workspaceSlug && workspaceSlug.length > 0) {
        headers['x-workspace-slug'] = workspaceSlug;
      }
      
      const response = await fetch("/api/designers", {
        headers,
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch designers: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!workspaceSlug && workspaceSlug.length > 0, // Only enable query if we have a valid workspace slug
  });
}

export function useDesignerBySlug(slug: string) {
  const [location] = useLocation();
  
  // Extract workspace slug from URL path
  const pathParts = location.split('/');
  const workspaceSlug = pathParts[1];
  
  return useQuery<SelectDesigner>({
    queryKey: ["/api/designers/slug", slug, workspaceSlug],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      
      if (workspaceSlug && workspaceSlug.length > 0) {
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
    enabled: !!slug && !!workspaceSlug && workspaceSlug.length > 0,
  });
}

export function useCreateDesigner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/designers", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/designers"] });
    },
  });
}

export function useUpdateDesigner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formData }: { id: number; formData: FormData }) => {
      const response = await fetch(`/api/designers/${id}`, {
        method: "PUT",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/designers"] });
    },
  });
}

export function useDeleteDesigners() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (designerIds: number[]) => {
      const response = await fetch("/api/designers/batch", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: designerIds }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/designers"] });
    },
  });
}