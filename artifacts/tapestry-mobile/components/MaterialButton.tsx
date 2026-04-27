import * as Haptics from "expo-haptics";
import { Platform, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";

import { fonts } from "@/constants/typography";
import { elevation, useColors } from "@/hooks/useColors";

type Variant = "filled" | "tonal" | "text";

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Material 3-styled button used in the Android skin. Filled = primary
 * action with elevation; tonal = soft container background; text = label
 * only with a ripple on press.
 *
 * Safe to use on both skins — the visual treatment is consistent enough
 * that an Android-skin screen can rely on it for any primary CTA without
 * forking layouts.
 */
export function MaterialButton({
  label,
  onPress,
  variant = "filled",
  disabled,
  haptic = true,
  style,
}: Props) {
  const colors = useColors();
  const isAndroid = colors.skin === "android";

  const bg =
    variant === "filled"
      ? isAndroid
        ? colors.primary
        : colors.primary
      : variant === "tonal"
        ? isAndroid
          ? colors.material.primaryContainer
          : colors.muted
        : "transparent";

  const fg =
    variant === "filled"
      ? colors.primaryForeground
      : variant === "tonal"
        ? isAndroid
          ? colors.material.onPrimaryContainer
          : colors.textPrimary
        : colors.primary;

  const handlePress = () => {
    if (haptic && Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={handlePress}
      android_ripple={{
        color: variant === "filled" ? colors.material.rippleOnPrimary : colors.material.rippleBase,
      }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          borderRadius: isAndroid ? 100 : colors.radius,
          opacity: disabled ? 0.5 : pressed ? 0.92 : 1,
          ...(variant === "filled" && isAndroid ? elevation(1) : null),
        },
        style,
      ]}
    >
      <Text
        style={{
          color: fg,
          fontFamily: isAndroid ? fonts.sansMedium : fonts.serifSemiBold,
          fontSize: isAndroid ? 14 : 15,
          letterSpacing: isAndroid ? 0.1 : 0.2,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
