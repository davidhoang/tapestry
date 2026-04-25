import { useAuth } from "@clerk/clerk-expo";
import { useCallback } from "react";

import { apiFetch } from "@/lib/api";

/**
 * Returns an authenticated fetch helper that injects the current Clerk
 * session token as a Bearer header on every request.
 */
export function useAuthFetch() {
  const { getToken } = useAuth();

  return useCallback(
    async <T,>(
      path: string,
      options: Parameters<typeof apiFetch>[1] = {},
    ): Promise<T> => {
      const token = await getToken();
      return apiFetch<T>(path, { ...options, token });
    },
    [getToken],
  );
}
