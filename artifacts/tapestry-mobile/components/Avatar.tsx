import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";

type Props = {
  name: string;
  photoUrl?: string | null;
  size?: number;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]?.slice(0, 2).toUpperCase() ?? "?";
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

export function Avatar({ name, photoUrl, size = 48 }: Props) {
  const colors = useColors();

  if (photoUrl) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.surfaceWarm,
        }}
        contentFit="cover"
        transition={150}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.surfaceWarm,
          borderColor: colors.border,
        },
      ]}
    >
      <Text
        style={{
          fontFamily: fonts.serifSemiBold,
          fontSize: size * 0.36,
          color: colors.primary,
        }}
      >
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
});
