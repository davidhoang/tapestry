import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { Platform } from "react-native";

/**
 * Wraps a refetch handler so that pull-to-refresh fires a soft haptic
 * the moment the user triggers a refresh — same trick iOS Mail uses.
 */
export function usePullRefresh(refetch: () => Promise<unknown> | void) {
  return useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    await refetch();
  }, [refetch]);
}
