import {
  CrimsonText_400Regular,
  CrimsonText_400Regular_Italic,
  CrimsonText_600SemiBold,
  CrimsonText_700Bold,
  useFonts,
} from "@expo-google-fonts/crimson-text";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { hasOnboarded } from "@/lib/preferences";
import { tokenCache } from "@/lib/token-cache";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for a minute, but hold it for a day so the
      // persister has something to rehydrate from on cold start.
      staleTime: 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 2,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "tapestry:react-query-cache:v1",
  // Throttle writes so we don't thrash AsyncStorage on rapid query updates.
  throttleTime: 1500,
});

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

function AuthGate() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const queryClient = useQueryClient();
  const segments = useSegments();
  const router = useRouter();
  const lastUserRef = React.useRef<string | null | undefined>(undefined);
  const [onboardChecked, setOnboardChecked] = React.useState(false);
  const [needsOnboarding, setNeedsOnboarding] = React.useState(false);
  const [userChangeHandled, setUserChangeHandled] = React.useState(false);

  // Drop cached queries when the signed-in user changes (sign-in / sign-out
  // / account switch) so one user's data never appears under another's
  // session. We also block route rendering until this completes the first
  // time, otherwise persisted "mobile/*" queries could flash on cold start.
  useEffect(() => {
    if (!isLoaded) return;
    if (lastUserRef.current === undefined) {
      lastUserRef.current = userId ?? null;
      // On cold start, if there is no signed-in user the persisted cache
      // could still belong to whoever signed in last — clear it before
      // we let any screen mount.
      if (!userId) {
        queryClient.clear();
      }
      setUserChangeHandled(true);
      return;
    }
    if (lastUserRef.current !== (userId ?? null)) {
      queryClient.clear();
      lastUserRef.current = userId ?? null;
    }
  }, [isLoaded, userId, queryClient]);

  // Re-check onboarding flag when sign-in state changes.
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setNeedsOnboarding(false);
      setOnboardChecked(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const done = await hasOnboarded();
      if (!cancelled) {
        setNeedsOnboarding(!done);
        setOnboardChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, userId]);

  useEffect(() => {
    if (!isLoaded || !onboardChecked) return;
    const top = segments[0];
    const inSignIn = top === "sign-in";
    const inOnboarding = top === "onboarding";

    if (!isSignedIn && !inSignIn) {
      router.replace("/sign-in");
    } else if (isSignedIn && inSignIn) {
      router.replace(needsOnboarding ? "/onboarding" : "/");
    } else if (isSignedIn && needsOnboarding && !inOnboarding) {
      router.replace("/onboarding");
    } else if (isSignedIn && !needsOnboarding && inOnboarding) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, segments, router, onboardChecked, needsOnboarding]);

  // Hold all routes back until auth + onboarding + cache reconciliation
  // have completed at least once. This prevents a flash of stale, persisted
  // protected data before AuthGate can redirect the user appropriately.
  const ready = isLoaded && onboardChecked && userChangeHandled;
  if (!ready) {
    return <View style={styles.splash} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
      <Stack.Screen
        name="designer/[id]"
        options={{ headerShown: true, headerBackTitle: "Back", title: "" }}
      />
      <Stack.Screen
        name="list/[id]"
        options={{ headerShown: true, headerBackTitle: "Back", title: "" }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: "#fafaf9" },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    CrimsonText_400Regular,
    CrimsonText_400Regular_Italic,
    CrimsonText_600SemiBold,
    CrimsonText_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  if (!publishableKey) {
    throw new Error(
      "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Add it to your secrets so the mobile app can sign in.",
    );
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
              persister,
              maxAge: 24 * 60 * 60 * 1000,
              buster: "v1",
              dehydrateOptions: {
                shouldDehydrateQuery: (query) => {
                  // Persist all "mobile/*" queries so the directory + lists
                  // load instantly from cache on next launch.
                  const key = query.queryKey?.[0];
                  return typeof key === "string" && key === "mobile";
                },
              },
            }}
          >
            <GestureHandlerRootView>
              <KeyboardProvider>
                <AuthGate />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </PersistQueryClientProvider>
        </ClerkProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
