import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { type } from "@/constants/typography";

type Action = {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Feather.glyphMap;
};

type Props = {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  description?: string;
  action?: Action;
  /** Secondary action shown below the primary button. */
  secondaryAction?: Action;
};

export function EmptyState({ icon = "inbox", title, description, action, secondaryAction }: Props) {
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
      {action ? (
        <Pressable
          onPress={action.onPress}
          style={({ pressed }) => [
            styles.primary,
            {
              backgroundColor: colors.primary,
              borderRadius: colors.radius,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          {action.icon ? (
            <Feather name={action.icon} size={16} color={colors.primaryForeground} />
          ) : null}
          <Text style={[type.button, { color: colors.primaryForeground }]}>{action.label}</Text>
        </Pressable>
      ) : null}
      {secondaryAction ? (
        <Pressable
          onPress={secondaryAction.onPress}
          style={({ pressed }) => [styles.secondary, { opacity: pressed ? 0.7 : 1 }]}
        >
          {secondaryAction.icon ? (
            <Feather name={secondaryAction.icon} size={14} color={colors.textSecondary} />
          ) : null}
          <Text style={[type.small, { color: colors.textSecondary }]}>
            {secondaryAction.label}
          </Text>
        </Pressable>
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
  primary: {
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  secondary: {
    marginTop: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
