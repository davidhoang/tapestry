import { StyleSheet, Text } from "react-native";

import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";

type Props = {
  size?: "sm" | "md" | "lg";
  color?: string;
};

export function TapestryLogo({ size = "md", color }: Props) {
  const colors = useColors();
  const tone = color ?? colors.foreground;

  const sizes = { sm: 18, md: 24, lg: 36 } as const;

  return (
    <Text style={[styles.word, { fontSize: sizes[size], color: tone }]}>
      Tapestry
    </Text>
  );
}

const styles = StyleSheet.create({
  word: {
    fontFamily: fonts.serifBold,
    letterSpacing: -0.4,
  },
});
