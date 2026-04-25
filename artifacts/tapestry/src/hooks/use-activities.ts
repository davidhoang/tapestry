import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

export interface WorkspaceActivity {
  id: number;
  workspaceId: number;
  userId: number;
  activityType: string;
  entityType: string | null;
  entityId: number | null;
  entityName: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  user: {
    id: number;
    email: string;
    username: string | null;
    profilePhotoUrl: string | null;
  };
}

export interface ActivitiesResponse {
  activities: WorkspaceActivity[];
  nextCursor: number | null;
  hasMore: boolean;
}

export function useActivities(workspaceSlug?: string, limit: number = 20, cursor: number | null = null) {
  const [location] = useLocation();
  const pathParts = location.split("/");
  const slug = workspaceSlug || pathParts[1];

  const headers: Record<string, string> = {};
  if (slug && slug.length > 0) {
    headers["x-workspace-slug"] = slug;
  }

  return useQuery<ActivitiesResponse>({
    queryKey: ["/api/activities", slug, limit, cursor],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      if (cursor !== null) {
        params.set("cursor", String(cursor));
      }
      
      const response = await fetch(`/api/activities?${params.toString()}`, {
        headers,
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch activities");
      }
      return response.json();
    },
    enabled: !!slug && slug.length > 0,
    retry: 2,
    retryDelay: 1000,
  });
}
