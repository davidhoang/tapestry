import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { SkillChip } from "@/components/SkillChip";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { useColors } from "@/hooks/useColors";
import { useDefaultWorkspace } from "@/hooks/useWorkspace";
import { type } from "@/constants/typography";
import type { DesignerDetails } from "@/lib/api";

export default function DesignerScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id;
  const authFetch = useAuthFetch();
  const { workspace } = useDefaultWorkspace();

  const query = useQuery({
    queryKey: ["mobile", "designer", id, workspace?.id],
    enabled: !!id && !!workspace?.id,
    queryFn: () =>
      authFetch<DesignerDetails>(`/api/mobile/designers/${id}`, {
        query: { workspaceId: workspace!.id },
      }),
  });

  useEffect(() => {
    navigation.setOptions({ title: query.data?.name ?? "" });
  }, [navigation, query.data?.name]);

  const designer = query.data;

  if (query.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (query.isError || !designer) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="alert-circle"
          title="Couldn't load designer"
          description={
            query.error instanceof Error
              ? query.error.message
              : "Try again in a moment."
          }
        />
      </View>
    );
  }

  const subtitle = [designer.title, designer.company].filter(Boolean).join(" · ");

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: insets.bottom + 32,
        gap: 24,
      }}
    >
      <View style={styles.hero}>
        <Avatar name={designer.name} photoUrl={designer.photoUrl} size={96} />
        <Text
          style={[type.display, { color: colors.foreground, marginTop: 16, textAlign: "center" }]}
        >
          {designer.name}
        </Text>
        {subtitle ? (
          <Text
            style={[
              type.body,
              { color: colors.textSecondary, marginTop: 4, textAlign: "center" },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
        {designer.location ? (
          <View style={styles.metaRow}>
            <Feather name="map-pin" size={13} color={colors.textMuted} />
            <Text style={[type.small, { color: colors.textMuted }]}>
              {designer.location}
            </Text>
          </View>
        ) : null}
      </View>

      {designer.description ? (
        <Section title="About" colors={colors}>
          <Text style={[type.bodyLarge, { color: colors.foreground, lineHeight: 28 }]}>
            {designer.description}
          </Text>
        </Section>
      ) : null}

      {designer.skills && designer.skills.length > 0 ? (
        <Section title="Skills" colors={colors}>
          <View style={styles.chipRow}>
            {designer.skills.map((skill) => (
              <SkillChip key={skill} label={skill} />
            ))}
          </View>
        </Section>
      ) : null}

      <Section title="Contact" colors={colors}>
        <View style={{ gap: 8 }}>
          {designer.email ? (
            <ContactRow
              icon="mail"
              label={designer.email}
              onPress={() => Linking.openURL(`mailto:${designer.email}`)}
              colors={colors}
            />
          ) : null}
          {designer.linkedIn ? (
            <ContactRow
              icon="linkedin"
              label="LinkedIn"
              onPress={() => Linking.openURL(designer.linkedIn!)}
              colors={colors}
            />
          ) : null}
          {designer.website ? (
            <ContactRow
              icon="globe"
              label={designer.website.replace(/^https?:\/\//, "")}
              onPress={() => Linking.openURL(designer.website!)}
              colors={colors}
            />
          ) : null}
          {!designer.email && !designer.linkedIn && !designer.website ? (
            <Text style={[type.small, { color: colors.textMuted }]}>
              No contact info on file yet.
            </Text>
          ) : null}
        </View>
      </Section>
    </ScrollView>
  );
}

function Section({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={[type.caption, { color: colors.primary }]}>{title}</Text>
      <View
        style={[
          styles.sectionBody,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function ContactRow({
  icon,
  label,
  onPress,
  colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.contactRow,
        { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Feather name={icon} size={16} color={colors.primary} />
      <Text style={[type.body, { color: colors.foreground, flex: 1 }]} numberOfLines={1}>
        {label}
      </Text>
      <Feather name="external-link" size={14} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  hero: { alignItems: "center", paddingTop: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  sectionBody: { padding: 16, borderWidth: StyleSheet.hairlineWidth },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
