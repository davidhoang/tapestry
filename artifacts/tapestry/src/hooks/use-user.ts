import { useAuth, useClerk } from '@clerk/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { SelectUser } from "@db/schema";
import { getAuthHeaders } from '../lib/queryClient';
import { useState, useEffect } from 'react';

export function useUser() {
  const { isSignedIn, isLoaded } = useAuth();
  const { signOut, openSignIn, openSignUp } = useClerk();
  const queryClient = useQueryClient();

  // Safety net: if Clerk hasn't loaded within 10 seconds, treat user as
  // logged out so the site doesn't hang forever.
  const [clerkTimedOut, setClerkTimedOut] = useState(false);
  useEffect(() => {
    if (isLoaded) return;
    const timer = setTimeout(() => setClerkTimedOut(true), 10000);
    return () => clearTimeout(timer);
  }, [isLoaded]);

  const effectivelyLoaded = isLoaded || clerkTimedOut;

  const { data: user, isLoading: isUserLoading } = useQuery<SelectUser | null>({
    queryKey: ['user'],
    queryFn: async () => {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/user', {
        credentials: 'include',
        headers: authHeaders,
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!isSignedIn,
    staleTime: Infinity,
    retry: false,
  });

  const isLoading = !effectivelyLoaded || (!!isSignedIn && isUserLoading);

  const login = async (_userData?: any) => {
    if (!isLoaded) {
      window.location.href = 'https://accounts.tapestry.design/sign-in';
      return { ok: true as const };
    }
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
