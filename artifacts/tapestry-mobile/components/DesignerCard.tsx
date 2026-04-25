import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar } from "@/components/Avatar";
import { SkillChip } from "@/components/SkillChip";
import { useColors } from "@/hooks/useColors";
import { type } from "@/constants/typography";
import type { Designer } from "@/lib/api";

type Props = {
  designer: Pick<
    Designer,
    "name" | "title" | "company" | "location" | "photoUrl" | "skills"
  >;
  onPress?: () => void;
};

export function DesignerCard({ designer, onPress }: Props) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.top}>
        <Avatar name={designer.name} photoUrl={designer.photoUrl} size={56} />
        <View style={styles.headerText}>
          <Text style={[type.h3, { color: colors.foreground }]} numberOfLines={1}>
            {designer.name}
          </Text>
          {designer.title || designer.company ? (
            <Text
              style={[type.small, { color: colors.textSecondary, marginTop: 2 }]}
              numberOfLines={1}
            >
              {[designer.title, designer.company].filter(Boolean).join(" · ")}
            </Text>
          ) : null}
          {designer.location ? (
            <View style={styles.location}>
              <Feather name="map-pin" size={11} color={colors.textMuted} />
              <Text style={[type.small, { color: colors.textMuted }]} numberOfLines={1}>
                {designer.location}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {designer.skills && designer.skills.length > 0 ? (
        <View style={styles.skills}>
          {designer.skills.slice(0, 4).map((skill) => (
            <SkillChip key={skill} label={skill} />
          ))}
          {designer.skills.length > 4 ? (
            <Text style={[type.small, { color: colors.textMuted, alignSelf: "center" }]}>
              +{designer.skills.length - 4}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  top: { flexDirection: "row", gap: 14, alignItems: "center" },
  headerText: { flex: 1, minWidth: 0 },
  location: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  skills: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
});
