import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { SelectList } from "@db/schema";

export function useLists() {
  const [location] = useLocation();
  const pathParts = location.split("/");
  const workspaceSlug = pathParts[1];

  const headers: Record<string, string> = {};
  if (workspaceSlug && workspaceSlug.length > 0) {
    headers["x-workspace-slug"] = workspaceSlug;
  }

  return useQuery<SelectList[]>({
    queryKey: ["/api/lists", workspaceSlug],
    queryFn: async () => {
      const response = await fetch("/api/lists", {
        headers,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch lists");
      return response.json();
    },
    enabled: !!workspaceSlug && workspaceSlug.length > 0,
  });
}

export function useCreateList() {
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const pathParts = location.split("/");
  const workspaceSlug = pathParts[1];

  return useMutation({
    mutationFn: async (data: { 
      name: string; 
      description?: string; 
      designerIds?: number[];
    }) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (workspaceSlug && workspaceSlug.length > 0) {
        headers["x-workspace-slug"] = workspaceSlug;
      }

      const response = await fetch("/api/lists", {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const list = await response.json();

      // If there are designers to add, add them to the list
      if (data.designerIds?.length) {
        await Promise.all(
          data.designerIds.map((designerId) =>
            fetch(`/api/lists/${list.id}/designers`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ designerId }),
              credentials: "include",
            })
          )
        );
      }

      return list;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists", workspaceSlug] });
    },
  });
}

export function useUpdateList() {
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const pathParts = location.split("/");
  const workspaceSlug = pathParts[1];

  return useMutation({
    mutationFn: async (data: { id: number; name: string; description?: string }) => {
      const response = await fetch(`/api/lists/${data.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists", workspaceSlug] });
    },
  });
}

export function useDeleteList() {
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const pathParts = location.split("/");
  const workspaceSlug = pathParts[1];

  return useMutation({
    mutationFn: async (listId: number) => {
      const response = await fetch(`/api/lists/${listId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists", workspaceSlug] });
    },
  });
}

export function useAddDesignersToList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listId,
      designerId,
      notes,
    }: {
      listId: number;
      designerId: number;
      notes?: string;
    }) => {
      const response = await fetch(`/api/lists/${listId}/designers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ designerId, notes }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists"] });
    },
  });
}