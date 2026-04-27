import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { GlassChrome } from "@/components/GlassChrome";
import { LastUpdated } from "@/components/LastUpdated";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SkeletonListRow } from "@/components/Skeleton";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { useColors } from "@/hooks/useColors";
import { useDefaultWorkspace } from "@/hooks/useWorkspace";
import { usePullRefresh } from "@/hooks/usePullRefresh";
import { type } from "@/constants/typography";
import { TAB_BAR_OFFSET } from "@/constants/chrome";
import type { ListSummary } from "@/lib/api";

type ListsResponse = { lists: ListSummary[] };

export default function ListsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const authFetch = useAuthFetch();
  const { workspace } = useDefaultWorkspace();
  const [chromeHeight, setChromeHeight] = useState(0);

  const query = useQuery({
    queryKey: ["mobile", "lists", workspace?.id],
    enabled: !!workspace?.id,
    queryFn: () =>
      authFetch<ListsResponse>("/api/mobile/lists", {
        query: { workspaceId: workspace!.id },
      }),
  });

  const onRefresh = usePullRefresh(() => query.refetch());

  const lists = query.data?.lists ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={lists}
        keyExtractor={(item) => String(item.id)}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: chromeHeight + 8,
          paddingBottom: insets.bottom + TAB_BAR_OFFSET + 24,
          gap: 12,
        }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/list/${item.id}`)}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.icon,
                { backgroundColor: colors.surfaceWarm, borderColor: colors.border },
              ]}
            >
              <Feather name="bookmark" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[type.h3, { color: colors.foreground }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text
                style={[type.small, { color: colors.textSecondary, marginTop: 2 }]}
                numberOfLines={1}
              >
                {item.designerCount}{" "}
                {item.designerCount === 1 ? "designer" : "designers"}
                {item.description ? ` · ${item.description}` : ""}
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.textMuted} />
          </Pressable>
        )}
        ListFooterComponent={
          query.dataUpdatedAt && lists.length > 0 ? (
            <LastUpdated updatedAt={query.dataUpdatedAt} />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            progressViewOffset={chromeHeight}
          />
        }
        ListEmptyComponent={
          query.isLoading ? (
            <View style={{ gap: 12 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonListRow key={i} />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="bookmark"
              title="No lists yet"
              description="Create lists from the web app to organize designers into curated collections."
              action={{
                label: "Browse designers",
                icon: "users",
                onPress: () => router.push("/designers"),
              }}
            />
          )
        }
        scrollEnabled={!!lists.length}
      />

      <GlassChrome onMeasureHeight={setChromeHeight}>
        <ScreenHeader
          eyebrow="Collections"
          title="Lists"
          subtitle="Curated groups of designers"
        />
      </GlassChrome>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
});
