import { useAuth } from "@clerk/clerk-expo";
import { useCallback, useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

import {
  getPushOptedIn,
  getStoredPushToken,
  setPushOptedIn,
  setStoredPushToken,
} from "@/lib/preferences";
import { useAuthFetch } from "@/hooks/useAuthFetch";

/**
 * Tracks the user's push opt-in status and push token. The actual permission
 * prompt only fires when `enable()` is called from a UI affordance, never
 * implicitly. The token is registered with the API server so future
 * notification-triggering events (new recommendations, new list adds) can
 * deliver to the device.
 */
export function usePushNotifications() {
  const { isSignedIn } = useAuth();
  const authFetch = useAuthFetch();
  const [optedIn, setOpted] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Hydrate from local prefs on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [pref, stored] = await Promise.all([getPushOptedIn(), getStoredPushToken()]);
      if (cancelled) return;
      setOpted(pref);
      setToken(stored);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = useCallback(async (): Promise<{ ok: boolean; reason?: string }> => {
    if (Platform.OS === "web") return { ok: false, reason: "Push isn't supported on web yet." };
    if (!Device.isDevice) {
      return { ok: false, reason: "Push notifications require a physical device." };
    }
    setBusy(true);
    try {
      const existing = await Notifications.getPermissionsAsync();
      let status = existing.status;
      if (status !== "granted") {
        const next = await Notifications.requestPermissionsAsync();
        status = next.status;
      }
      if (status !== "granted") {
        return { ok: false, reason: "Permission was declined." };
      }

      const tokenResponse = await Notifications.getDevicePushTokenAsync();
      const value = tokenResponse?.data ?? null;
      if (!value) return { ok: false, reason: "Couldn't fetch a device token." };

      await setStoredPushToken(value);
      await setPushOptedIn(true);
      setOpted(true);
      setToken(value);

      // Best-effort registration with the API server. Failure here shouldn't
      // block the user from opting in locally — they can retry later.
      if (isSignedIn) {
        try {
          await authFetch("/api/mobile/devices/register", {
            method: "POST",
            body: JSON.stringify({
              token: value,
              platform: Platform.OS,
            }),
          });
        } catch {
          /* swallow — user can retry from profile */
        }
      }
      return { ok: true };
    } finally {
      setBusy(false);
    }
  }, [isSignedIn, authFetch]);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      const stored = await getStoredPushToken();
      await setPushOptedIn(false);
      await setStoredPushToken(null);
      setOpted(false);
      setToken(null);
      if (stored && isSignedIn) {
        try {
          await authFetch("/api/mobile/devices/register", {
            method: "DELETE",
            body: JSON.stringify({ token: stored }),
          });
        } catch {
          /* ignore */
        }
      }
    } finally {
      setBusy(false);
    }
  }, [isSignedIn, authFetch]);

  return { optedIn, token, enable, disable, busy };
}
