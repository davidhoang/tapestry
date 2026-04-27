import { useColorScheme } from "react-native";

import colors from "@/constants/colors";
import { usePlatformSkin } from "@/lib/platform-skin";

/**
 * Returns the design tokens for the current color scheme + platform skin.
 *
 * iOS skin keeps the warm, slightly-translucent Tapestry palette.
 * Android skin layers Material 3 tones (surface containers, primary
 * container, outline, ripple, elevation tints) on top so M3 components
 * (FAB, top app bar, filled tonal button, bottom nav) can render
 * authentically without redefining every screen.
 *
 * The Material tokens are also provided for the iOS skin so cross-skin
 * components can reference them safely — they just aren't used.
 */
export function useColors() {
  const scheme = useColorScheme();
  const skin = usePlatformSkin();
  const palette = scheme === "dark" ? colors.dark : colors.light;
  return {
    ...palette,
    radius: skin === "android" ? 12 : colors.radius,
    skin,
  };
}

/**
 * Material 3 elevation shadow recipes. Returns React Native shadow / elevation
 * props for a given level. Use this only when `skin === "android"`.
 */
export function elevation(level: 0 | 1 | 2 | 3 | 4 | 5) {
  if (level === 0) {
    return { elevation: 0, shadowOpacity: 0 } as const;
  }
  const presets = {
    1: { offset: 1, radius: 3, opacity: 0.10 },
    2: { offset: 2, radius: 6, opacity: 0.12 },
    3: { offset: 4, radius: 10, opacity: 0.14 },
    4: { offset: 6, radius: 14, opacity: 0.16 },
    5: { offset: 8, radius: 18, opacity: 0.18 },
  } as const;
  const p = presets[level];
  return {
    elevation: level * 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: p.offset },
    shadowOpacity: p.opacity,
    shadowRadius: p.radius,
  } as const;
}
