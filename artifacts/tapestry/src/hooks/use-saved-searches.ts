import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { SelectSavedSearch } from "@db/schema";

export function useSavedSearches() {
  const [location] = useLocation();
  const pathParts = location.split("/");
  const workspaceSlug = pathParts[1];

  return useQuery<SelectSavedSearch[]>({
    queryKey: ["/api/saved-searches", workspaceSlug],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (workspaceSlug && workspaceSlug.length > 0) {
        headers["x-workspace-slug"] = workspaceSlug;
      }

      const response = await fetch("/api/saved-searches", {
        headers,
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch saved searches: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!workspaceSlug && workspaceSlug.length > 0,
  });
}

export function useCreateSavedSearch() {
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const pathParts = location.split("/");
  const workspaceSlug = pathParts[1];

  return useMutation({
    mutationFn: async (data: { 
      name: string; 
      searchType: string; 
      searchValue: string;
    }) => {
      return apiRequest("/api/saved-searches", {
        method: "POST",
        body: data,
        workspaceSlug,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-searches", workspaceSlug] });
    },
  });
}

export function useDeleteSavedSearch() {
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const pathParts = location.split("/");
  const workspaceSlug = pathParts[1];

  return useMutation({
    mutationFn: async (searchId: number) => {
      return apiRequest(`/api/saved-searches/${searchId}`, {
        method: "DELETE",
        workspaceSlug,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-searches", workspaceSlug] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-searches", workspaceSlug] });
    },
  });
}
