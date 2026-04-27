import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { fonts } from "@/constants/typography";
import { elevation, useColors } from "@/hooks/useColors";

type Props = {
  icon?: keyof typeof Feather.glyphMap;
  label?: string;
  onPress: () => void;
  /** Pin the FAB to the bottom-right corner. Default: true. */
  pinned?: boolean;
  bottomOffset?: number;
};

/**
 * Material 3 Floating Action Button — extended variant when `label` is
 * provided, otherwise circular. Renders nothing on the iOS skin so the
 * same screen can include `<FAB />` unconditionally.
 */
export function FAB({
  icon = "plus",
  label,
  onPress,
  pinned = true,
  bottomOffset = 96,
}: Props) {
  const colors = useColors();
  if (colors.skin !== "android") return null;

  const isExtended = !!label;
  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    onPress();
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        pinned ? styles.pinned : styles.inline,
        pinned ? { bottom: bottomOffset } : null,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label ?? "Action"}
        onPress={handlePress}
        android_ripple={{ color: colors.material.rippleOnPrimary, borderless: false }}
        style={({ pressed }) => [
          styles.fab,
          isExtended ? styles.fabExtended : styles.fabCircular,
          {
            backgroundColor: colors.material.primaryContainer,
            ...elevation(3),
            opacity: pressed ? 0.94 : 1,
          },
        ]}
      >
        <Feather
          name={icon}
          size={22}
          color={colors.material.onPrimaryContainer}
        />
        {isExtended ? (
          <Text
            style={{
              fontFamily: fonts.sansMedium,
              fontSize: 14,
              letterSpacing: 0.1,
              color: colors.material.onPrimaryContainer,
              marginLeft: 10,
            }}
          >
            {label}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pinned: {
    position: "absolute",
    right: 16,
    zIndex: 20,
  },
  inline: {},
  fab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  fabCircular: {
    width: 56,
    height: 56,
    borderRadius: 16,
  },
  fabExtended: {
    height: 56,
    paddingHorizontal: 20,
    borderRadius: 16,
    minWidth: 80,
  },
});
