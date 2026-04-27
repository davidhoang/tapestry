import { useMemo } from "react";
import { Platform } from "react-native";

export type PlatformSkin = "ios" | "android";

/**
 * Reads the requested platform skin once at module load.
 *
 * On web (Expo web preview embedded in the canvas) the skin is driven by a
 * `?platform=android` query param so the same artifact can be embedded twice
 * with different visual languages. On native we fall back to the actual OS.
 */
function detectInitialSkin(): PlatformSkin {
  if (Platform.OS === "web") {
    try {
      // window may not exist during SSR-like prerender
      if (typeof window !== "undefined" && window.location?.search) {
        const params = new URLSearchParams(window.location.search);
        const v = params.get("platform");
        if (v === "android") return "android";
        if (v === "ios") return "ios";
      }
    } catch {
      // fall through
    }
    return "ios";
  }
  return Platform.OS === "android" ? "android" : "ios";
}

let cachedSkin: PlatformSkin | null = null;

export function getPlatformSkin(): PlatformSkin {
  if (cachedSkin == null) {
    cachedSkin = detectInitialSkin();
  }
  return cachedSkin;
}

export function isAndroidSkin(): boolean {
  return getPlatformSkin() === "android";
}

/**
 * Hook form so components can re-render if we ever support runtime swapping.
 * Today the value is fixed for the session but using a hook keeps the call
 * sites clean and future-proof.
 */
export function usePlatformSkin(): PlatformSkin {
  return useMemo(() => getPlatformSkin(), []);
}
