import { StyleSheet, View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { elevation, useColors } from "@/hooks/useColors";
import { LiquidGlass } from "./LiquidGlass";

type Props = ViewProps & {
  /** When true (default) the chrome is sticky-positioned at the top of the screen. */
  sticky?: boolean;
  /** Reports the measured layout height. Useful for sizing scroll-content padding. */
  onMeasureHeight?: (height: number) => void;
};

/**
 * A sticky, status-bar-aware top chrome surface.
 *
 * On the iOS skin this renders as a Liquid Glass blur over the content.
 * On the Android skin it renders as a Material 3 top app bar — opaque
 * surface tint, no blur, hairline divider — so it reads as a different
 * platform without changing the consuming screen's layout.
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
  const isAndroidSkin = colors.skin === "android";

  const measuredOnLayout = (e: any) => {
    onMeasureHeight?.(e.nativeEvent.layout.height);
    onLayout?.(e);
  };

  if (isAndroidSkin) {
    return (
      <View
        style={[
          styles.base,
          sticky ? styles.sticky : null,
          {
            paddingTop: insets.top + 12,
            paddingBottom: 16,
            backgroundColor: colors.material.surfaceContainer,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.material.outlineVariant,
            ...elevation(1),
          },
          style,
        ]}
        onLayout={measuredOnLayout}
        {...rest}
      >
        {children}
      </View>
    );
  }

  return (
    <LiquidGlass
      tintColor={colors.glassTint}
      style={[
        styles.base,
        sticky ? styles.sticky : null,
        { paddingTop: insets.top + 8 },
        style,
      ]}
      onLayout={measuredOnLayout}
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
