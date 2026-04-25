import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DesignerCard } from "@/components/DesignerCard";
import { EmptyState } from "@/components/EmptyState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TapestryLogo } from "@/components/TapestryLogo";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { useColors } from "@/hooks/useColors";
import { useDefaultWorkspace } from "@/hooks/useWorkspace";
import { type } from "@/constants/typography";
import type { Designer } from "@/lib/api";

type RecommendationsResponse = {
  workspace: { id: number; name: string; slug: string };
  recommendations: Designer[];
  total: number;
};

const TAB_BAR_HEIGHT = Platform.OS === "web" ? 84 : 88;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const authFetch = useAuthFetch();
  const { workspace } = useDefaultWorkspace();

  const query = useQuery({
    queryKey: ["mobile", "recommendations"],
    queryFn: () =>
      authFetch<RecommendationsResponse>("/api/mobile/recommendations"),
  });

  const data = query.data;
  const designers = data?.recommendations ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + 8,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TapestryLogo size="md" />
        {workspace ? (
          <Text style={[type.caption, { color: colors.textMuted }]}>
            {workspace.name}
          </Text>
        ) : null}
      </View>

      <FlatList
        data={designers}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 24,
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
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  center: { padding: 48, alignItems: "center" },
});
