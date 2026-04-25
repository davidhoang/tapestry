import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";

type Props = {
  size?: "sm" | "md" | "lg";
  color?: string;
};

export function TapestryLogo({ size = "md", color }: Props) {
  const colors = useColors();
  const tone = color ?? colors.foreground;

  const sizes = {
    sm: { word: 18, dot: 4 },
    md: { word: 24, dot: 6 },
    lg: { word: 36, dot: 8 },
  } as const;
  const s = sizes[size];

  return (
    <View style={styles.row}>
      <Text style={[styles.word, { fontSize: s.word, color: tone }]}>
        Tapestry
      </Text>
      <View
        style={[
          styles.dot,
          {
            width: s.dot,
            height: s.dot,
            borderRadius: s.dot / 2,
            backgroundColor: colors.primary,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  word: {
    fontFamily: fonts.serifBold,
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  dot: { marginBottom: 8 },
});
