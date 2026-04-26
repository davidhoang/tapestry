import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import {
  Platform,
  StyleSheet,
  View,
  useColorScheme,
  type ViewProps,
} from "react-native";

const NATIVE_GLASS =
  Platform.OS === "ios" &&
  typeof isLiquidGlassAvailable === "function" &&
  isLiquidGlassAvailable();

type LiquidGlassProps = ViewProps & {
  /** Blur intensity for the BlurView fallback (0–100). Ignored when iOS 26 Liquid Glass is active. */
  intensity?: number;
  /** Optional translucent overlay, e.g. a warm cream tint to match the brand. */
  tintColor?: string;
  /** Whether to draw a subtle highlight rim along the edge for the glass-edge feel. */
  rim?: boolean;
};

/**
 * A translucent, frosted surface used for navigation chrome.
 *
 * Resolves to the native iOS 26+ Liquid Glass material when available;
 * otherwise falls back to expo-blur's BlurView with an optional warm tint.
 *
 * The wrapping View applies `overflow: "hidden"` so any `borderRadius`
 * passed via `style` clips the blur layer cleanly.
 */
export function LiquidGlass({
  intensity = 70,
  tintColor,
  rim = true,
  style,
  children,
  ...rest
}: LiquidGlassProps) {
  const isDark = useColorScheme() === "dark";
  const flat = StyleSheet.flatten(style) as { borderRadius?: number } | undefined;
  const radius = flat?.borderRadius ?? 0;

  if (NATIVE_GLASS) {
    return (
      <GlassView
        glassEffectStyle="regular"
        tintColor={tintColor}
        style={[{ overflow: "hidden" }, style]}
        {...rest}
      >
        {children}
        {rim ? <Rim radius={radius} isDark={isDark} /> : null}
      </GlassView>
    );
  }

  return (
    <View style={[{ overflow: "hidden" }, style]} {...rest}>
      <BlurView
        intensity={intensity}
        tint={isDark ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />
      {tintColor ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: tintColor }]} />
      ) : null}
      {children}
      {rim ? <Rim radius={radius} isDark={isDark} /> : null}
    </View>
  );
}

function Rim({ radius, isDark }: { radius: number; isDark: boolean }) {
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          pointerEvents: "none",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: isDark
            ? "rgba(255,255,255,0.10)"
            : "rgba(255,255,255,0.5)",
          borderRadius: radius,
        },
      ]}
    />
  );
}
