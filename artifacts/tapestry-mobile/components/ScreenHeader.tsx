import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { type } from "@/constants/typography";

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
};

export function ScreenHeader({ eyebrow, title, subtitle }: Props) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      {eyebrow ? (
        <Text style={[type.caption, { color: colors.primary }]}>{eyebrow}</Text>
      ) : null}
      <Text style={[type.h1, { color: colors.foreground }]}>{title}</Text>
      {subtitle ? (
        <Text style={[type.body, { color: colors.textSecondary }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
});
