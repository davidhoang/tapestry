import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { LastUpdated } from "@/components/LastUpdated";
import { PortfolioGallery } from "@/components/PortfolioGallery";
import { SkeletonDesignerDetail } from "@/components/Skeleton";
import { SkillChip } from "@/components/SkillChip";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { useColors } from "@/hooks/useColors";
import { useDefaultWorkspace } from "@/hooks/useWorkspace";
import { type } from "@/constants/typography";
import {
  saveDesignerToContactsWithAlert,
  shareDesigner,
} from "@/lib/designer-actions";
import { addRecentDesigner } from "@/lib/preferences";
import type { DesignerDetails, PortfolioResponse } from "@/lib/api";

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

  const portfolioQuery = useQuery({
    queryKey: ["mobile", "portfolio", id, workspace?.id],
    enabled: !!id && !!workspace?.id,
    queryFn: () =>
      authFetch<PortfolioResponse>(`/api/mobile/designers/${id}/portfolio`, {
        query: { workspaceId: workspace!.id },
      }),
  });

  const designer = query.data;

  // Header title + share button.
  useEffect(() => {
    navigation.setOptions({
      title: designer?.name ?? "",
      headerRight: () =>
        designer ? (
          <Pressable
            onPress={() => shareDesigner(designer)}
            hitSlop={12}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, paddingHorizontal: 8 })}
          >
            <Feather name="share" size={20} color={colors.primary} />
          </Pressable>
        ) : null,
    });
  }, [navigation, designer, colors.primary]);

  // Add to recently-viewed cache once data lands.
  useEffect(() => {
    if (designer) {
      addRecentDesigner({
        id: designer.id,
        name: designer.name,
        title: designer.title,
        company: designer.company,
        photoUrl: designer.photoUrl,
      }).catch(() => {});
    }
  }, [designer]);

  if (query.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <SkeletonDesignerDetail />
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
          action={{ label: "Try again", icon: "refresh-cw", onPress: () => query.refetch() }}
        />
      </View>
    );
  }

  const subtitle = [designer.title, designer.company].filter(Boolean).join(" · ");
  const portfolio = portfolioQuery.data;
  const hasPortfolio =
    !!portfolio &&
    (portfolio.projects.length > 0 || portfolio.media.length > 0 || !!portfolio.portfolio);

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

        <LastUpdated
          updatedAt={
            designer.updatedAt
              ? new Date(designer.updatedAt).getTime()
              : designer.createdAt
                ? new Date(designer.createdAt).getTime()
                : null
          }
        />

        <View style={styles.heroActions}>
          <ActionButton
            icon="share"
            label="Share"
            onPress={() => shareDesigner(designer)}
            colors={colors}
          />
          <ActionButton
            icon="user-plus"
            label="Add to contacts"
            onPress={() => saveDesignerToContactsWithAlert(designer)}
            colors={colors}
          />
        </View>
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

      <Section title="Work" colors={colors}>
        {portfolioQuery.isLoading ? (
          <Text style={[type.small, { color: colors.textMuted }]}>Loading portfolio…</Text>
        ) : portfolioQuery.isError ? (
          <Text style={[type.small, { color: colors.textMuted }]}>
            Couldn't load portfolio. Pull to refresh later.
          </Text>
        ) : hasPortfolio && portfolio ? (
          <PortfolioGallery projects={portfolio.projects} media={portfolio.media} />
        ) : (
          <Text style={[type.small, { color: colors.textMuted }]}>
            No portfolio pieces published yet.
          </Text>
        )}
      </Section>

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
          {designer.phoneNumber ? (
            <ContactRow
              icon="phone"
              label={designer.phoneNumber}
              onPress={() => Linking.openURL(`tel:${designer.phoneNumber}`)}
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
          {!designer.email && !designer.linkedIn && !designer.website && !designer.phoneNumber ? (
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

function ActionButton({
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
        styles.actionBtn,
        {
          borderColor: colors.border,
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Feather name={icon} size={14} color={colors.primary} />
      <Text style={[type.label, { color: colors.foreground }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  hero: { alignItems: "center", paddingTop: 8 },
  heroActions: { flexDirection: "row", gap: 8, marginTop: 18 },
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
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
