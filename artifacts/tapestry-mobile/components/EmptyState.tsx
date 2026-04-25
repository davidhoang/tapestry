import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { type } from "@/constants/typography";

type Props = {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  description?: string;
};

export function EmptyState({ icon = "inbox", title, description }: Props) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: colors.surfaceWarm,
            borderColor: colors.border,
            borderRadius: 999,
          },
        ]}
      >
        <Feather name={icon} size={28} color={colors.primary} />
      </View>
      <Text style={[type.h3, { color: colors.foreground, marginTop: 16 }]}>{title}</Text>
      {description ? (
        <Text
          style={[
            type.body,
            { color: colors.textSecondary, marginTop: 8, textAlign: "center", maxWidth: 280 },
          ]}
        >
          {description}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", padding: 32, gap: 0 },
  iconWrap: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
});
