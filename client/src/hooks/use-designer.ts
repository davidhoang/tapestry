import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import type { InsertDesigner, SelectDesigner } from "@db/schema";

interface PaginatedDesignersResponse {
  designers: SelectDesigner[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

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

export function usePaginatedDesigners(search?: string, limit: number = 50) {
  const [location] = useLocation();
  
  const pathParts = location.split('/');
  const workspaceSlug = pathParts[1];

  return useInfiniteQuery<PaginatedDesignersResponse>({
    queryKey: ["/api/designers", "paginated", workspaceSlug, search, limit],
    queryFn: async ({ pageParam = 1 }) => {
      const headers: Record<string, string> = {};
      
      if (workspaceSlug && workspaceSlug.length > 0) {
        headers['x-workspace-slug'] = workspaceSlug;
      }
      
      const params = new URLSearchParams({
        page: String(pageParam),
        limit: String(limit),
      });
      
      if (search) {
        params.set('search', search);
      }
      
      const response = await fetch(`/api/designers?${params.toString()}`, {
        headers,
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch designers: ${response.statusText}`);
      }
      return response.json();
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasMore) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !!workspaceSlug && workspaceSlug.length > 0,
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
      queryClient.invalidateQueries({ queryKey: ["/api/lists"] });
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/designers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/designers/slug"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lists"] });
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/designers", data.id, "portfolios"] });
      }
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
      queryClient.invalidateQueries({ queryKey: ["/api/designers/slug"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lists"] });
    },
  });
}

export function useSimilarDesigners(designerId: number | undefined) {
  const [location] = useLocation();
  
  // Extract workspace slug from URL path
  const pathParts = location.split('/');
  const workspaceSlug = pathParts[1];
  
  return useQuery<SelectDesigner[]>({
    queryKey: ["/api/designers", designerId, "similar", workspaceSlug],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      
      if (workspaceSlug && workspaceSlug.length > 0) {
        headers['x-workspace-slug'] = workspaceSlug;
      }
      
      const response = await fetch(`/api/designers/${designerId}/similar`, {
        headers,
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch similar designers: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!designerId && !!workspaceSlug && workspaceSlug.length > 0,
  });
}