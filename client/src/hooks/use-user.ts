import { useAuth, useClerk } from '@clerk/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { SelectUser } from "@db/schema";

export function useUser() {
  const { isSignedIn, isLoaded } = useAuth();
  const { signOut, openSignIn, openSignUp } = useClerk();
  const queryClient = useQueryClient();

  const { data: user, isLoading: isUserLoading } = useQuery<SelectUser | null>({
    queryKey: ['user'],
    queryFn: async () => {
      const res = await fetch('/api/user', { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!isSignedIn,
    staleTime: Infinity,
    retry: false,
  });

  const isLoading = !isLoaded || (!!isSignedIn && isUserLoading);

  const login = async (_userData?: any) => {
    openSignIn();
    return { ok: true as const };
  };

  const logout = async () => {
    await signOut();
    queryClient.clear();
    return { ok: true as const };
  };

  const register = async (_userData?: any) => {
    openSignUp();
    return { ok: true as const };
  };

  return {
    user: isSignedIn ? (user ?? null) : null,
    isLoading,
    error: null,
    login,
    logout,
    register,
  };
}
