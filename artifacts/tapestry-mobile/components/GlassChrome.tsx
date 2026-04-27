import { StyleSheet, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { LiquidGlass } from "./LiquidGlass";

type Props = ViewProps & {
  /** When true (default) the chrome is sticky-positioned at the top of the screen. */
  sticky?: boolean;
  /** Reports the measured layout height. Useful for sizing scroll-content padding. */
  onMeasureHeight?: (height: number) => void;
};

/**
 * A sticky, status-bar-aware Liquid Glass surface for the top of a screen.
 *
 * Place a `<GlassChrome>` at the top of a screen as a sibling to a scrollable
 * list (FlatList/ScrollView). The chrome floats above the content via absolute
 * positioning; the consumer should pass `paddingTop = measuredHeight + gap`
 * to the list's `contentContainerStyle` so the first item isn't hidden.
 */
export function GlassChrome({
  sticky = true,
  style,
  children,
  onMeasureHeight,
  onLayout,
  ...rest
}: Props) {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  return (
    <LiquidGlass
      tintColor={colors.glassTint}
      style={[
        styles.base,
        sticky ? styles.sticky : null,
        { paddingTop: insets.top + 8 },
        style,
      ]}
      onLayout={(e) => {
        onMeasureHeight?.(e.nativeEvent.layout.height);
        onLayout?.(e);
      }}
      {...rest}
    >
      {children}
    </LiquidGlass>
  );
}

const styles = StyleSheet.create({
  base: { paddingBottom: 14 },
  sticky: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
