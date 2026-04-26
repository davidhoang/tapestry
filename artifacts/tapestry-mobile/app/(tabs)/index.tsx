import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DesignerCard } from "@/components/DesignerCard";
import { EmptyState } from "@/components/EmptyState";
import { GlassChrome } from "@/components/GlassChrome";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TapestryLogo } from "@/components/TapestryLogo";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { useColors } from "@/hooks/useColors";
import { useDefaultWorkspace } from "@/hooks/useWorkspace";
import { type } from "@/constants/typography";
import { TAB_BAR_OFFSET } from "@/constants/chrome";
import type { Designer } from "@/lib/api";

type RecommendationsResponse = {
  workspace: { id: number; name: string; slug: string };
  recommendations: Designer[];
  total: number;
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const authFetch = useAuthFetch();
  const { workspace } = useDefaultWorkspace();
  const [chromeHeight, setChromeHeight] = useState(0);

  const query = useQuery({
    queryKey: ["mobile", "recommendations"],
    queryFn: () =>
      authFetch<RecommendationsResponse>("/api/mobile/recommendations"),
  });

  const data = query.data;
  const designers = data?.recommendations ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={designers}
        keyExtractor={(item) => String(item.id)}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: chromeHeight + 8,
          paddingBottom: insets.bottom + TAB_BAR_OFFSET + 24,
          gap: 12,
        }}
        ListHeaderComponent={
          <ScreenHeader
            eyebrow="For you"
            title="Recommended designers"
            subtitle={
              data?.total
                ? `${data.total} ${data.total === 1 ? "designer" : "designers"} from your workspace`
                : "Curated picks pulled from your workspace"
            }
          />
        }
        renderItem={({ item }) => (
          <DesignerCard
            designer={item}
            onPress={() => router.push(`/designer/${item.id}`)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
            tintColor={colors.primary}
            progressViewOffset={chromeHeight}
          />
        }
        ListEmptyComponent={
          query.isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : query.isError ? (
            <EmptyState
              icon="alert-circle"
              title="Couldn't load recommendations"
              description={
                query.error instanceof Error
                  ? query.error.message
                  : "Pull to refresh and try again."
              }
            />
          ) : (
            <EmptyState
              icon="users"
              title="No designers yet"
              description="Add designers to your workspace from the web app and they'll appear here."
            />
          )
        }
        scrollEnabled={!!designers.length}
      />

      <GlassChrome onMeasureHeight={setChromeHeight}>
        <View style={styles.topBar}>
          <TapestryLogo size="md" />
          {workspace ? (
            <Text style={[type.caption, { color: colors.textMuted }]}>
              {workspace.name}
            </Text>
          ) : null}
        </View>
      </GlassChrome>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  center: { padding: 48, alignItems: "center" },
});
