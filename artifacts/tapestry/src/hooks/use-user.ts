import { useAuth, useClerk } from '@clerk/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { SelectUser } from "@db/schema";
import { getAuthHeaders } from '../lib/queryClient';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

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
    // Redirect-based sign-in is the primary path. The Clerk modal relies on
    // cross-origin iframes / partitioned storage, which silently no-ops in
    // browsers like Dia. A full-page redirect to the in-app /auth route works
    // consistently across Chrome, Safari, Firefox, Arc, Edge, and Dia.
    const here = window.location.pathname + window.location.search + window.location.hash;
    const base = import.meta.env.BASE_URL || '/';
    const target = `${base}auth?redirect_url=${encodeURIComponent(here || '/')}`;

    if (!isLoaded) {
      // Clerk hasn't initialized yet (e.g. blocked FAPI). Log a breadcrumb so
      // we can see how often this happens in production, and surface the
      // degraded path to the user instead of failing silently.
      // eslint-disable-next-line no-console
      console.warn('[auth] Clerk not loaded at sign-in click; redirecting to /auth');
      toast({
        title: 'Opening sign in…',
        description: "Taking you to the sign-in page.",
      });
    }

    window.location.href = target;
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
