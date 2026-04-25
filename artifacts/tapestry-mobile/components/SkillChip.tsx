import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";

export function SkillChip({ label }: { label: string }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: colors.surfaceWarm,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      <Text style={[styles.text, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: { fontFamily: fonts.serifSemiBold, fontSize: 13, letterSpacing: 0.3 },
});
