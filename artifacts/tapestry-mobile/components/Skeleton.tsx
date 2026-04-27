import { useEffect } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";

type Props = {
  width?: ViewStyle["width"];
  height?: ViewStyle["height"];
  radius?: number;
  style?: ViewStyle | ViewStyle[];
};

/**
 * A subtle pulsing block used while content is loading. The colour palette
 * pulls from `useColors()` so it adapts to dark mode automatically.
 */
export function Skeleton({ width = "100%", height = 14, radius, style }: Props) {
  const colors = useColors();
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    return () => cancelAnimation(opacity);
  }, [opacity]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        styles.base,
        {
          width: width as ViewStyle["width"],
          height: height as ViewStyle["height"],
          borderRadius: radius ?? colors.radius,
          backgroundColor: colors.skeletonBase,
        },
        animated,
        style as ViewStyle,
      ]}
    />
  );
}

/** Mirrors `<DesignerCard />` proportions so swap-in doesn't shift layout. */
export function SkeletonDesignerCard() {
  const colors = useColors();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
      ]}
    >
      <View style={styles.row}>
        <Skeleton width={56} height={56} radius={28} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width="65%" height={16} />
          <Skeleton width="45%" height={12} />
          <Skeleton width="35%" height={11} />
        </View>
      </View>
      <View style={styles.chips}>
        <Skeleton width={64} height={20} />
        <Skeleton width={84} height={20} />
        <Skeleton width={52} height={20} />
      </View>
    </View>
  );
}

/** Mirrors the list row used on the Lists tab. */
export function SkeletonListRow() {
  const colors = useColors();
  return (
    <View
      style={[
        styles.row,
        styles.listRow,
        { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
      ]}
    >
      <Skeleton width={40} height={40} radius={20} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width="50%" height={16} />
        <Skeleton width="70%" height={12} />
      </View>
    </View>
  );
}

/** Hero placeholder for the designer detail screen. */
export function SkeletonDesignerDetail() {
  const colors = useColors();
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 24 }}>
      <View style={{ alignItems: "center", paddingTop: 8, gap: 12 }}>
        <Skeleton width={96} height={96} radius={48} />
        <Skeleton width="60%" height={26} />
        <Skeleton width="40%" height={14} />
      </View>
      <View
        style={[
          styles.section,
          { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
        ]}
      >
        <Skeleton width="100%" height={14} />
        <Skeleton width="90%" height={14} style={{ marginTop: 8 }} />
        <Skeleton width="70%" height={14} style={{ marginTop: 8 }} />
      </View>
      <View style={styles.chips}>
        <Skeleton width={70} height={24} />
        <Skeleton width={90} height={24} />
        <Skeleton width={60} height={24} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: "hidden" },
  card: {
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  row: { flexDirection: "row", gap: 14, alignItems: "center" },
  listRow: { padding: 14, borderWidth: StyleSheet.hairlineWidth },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  section: { padding: 16, borderWidth: StyleSheet.hairlineWidth },
});
