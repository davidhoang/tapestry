import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";

import type { Workspace } from "@/lib/api";

import { useAuthFetch } from "./useAuthFetch";

type WorkspacesResponse = { workspaces: Workspace[] };

export function useWorkspaces() {
  const { isSignedIn } = useAuth();
  const authFetch = useAuthFetch();

  return useQuery({
    queryKey: ["mobile", "workspaces"],
    queryFn: () => authFetch<WorkspacesResponse>("/api/mobile/workspaces"),
    enabled: !!isSignedIn,
    select: (data) => data.workspaces,
  });
}

export function useDefaultWorkspace() {
  const { data, ...rest } = useWorkspaces();
  const workspace = data?.find((w) => w.isDefault) ?? data?.[0] ?? null;
  return { workspace, ...rest };
}
