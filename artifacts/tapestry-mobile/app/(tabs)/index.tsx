import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/Avatar";
import { DesignerCard } from "@/components/DesignerCard";
import { EmptyState } from "@/components/EmptyState";
import { GlassChrome } from "@/components/GlassChrome";
import { LastUpdated } from "@/components/LastUpdated";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SkeletonDesignerCard } from "@/components/Skeleton";
import { TapestryLogo } from "@/components/TapestryLogo";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { useColors } from "@/hooks/useColors";
import { useDefaultWorkspace } from "@/hooks/useWorkspace";
import { usePullRefresh } from "@/hooks/usePullRefresh";
import { fonts, type } from "@/constants/typography";
import { TAB_BAR_OFFSET } from "@/constants/chrome";
import { getInterests, getRecentDesigners, type RecentDesigner } from "@/lib/preferences";
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
  const [recents, setRecents] = useState<RecentDesigner[]>([]);
  const [interests, setInterestsState] = useState<string[]>([]);

  const query = useQuery({
    queryKey: ["mobile", "recommendations"],
    queryFn: () =>
      authFetch<RecommendationsResponse>("/api/mobile/recommendations"),
  });

  const onRefresh = usePullRefresh(async () => {
    const [a] = await Promise.all([
      query.refetch(),
      getRecentDesigners().then(setRecents),
    ]);
    return a;
  });

  // Hydrate recent + interests on mount.
  useEffect(() => {
    getRecentDesigners().then(setRecents);
    getInterests().then(setInterestsState);
  }, []);

  const data = query.data;
  const designers = data?.recommendations ?? [];

  // Light client-side reordering: bubble designers whose skills overlap with
  // the user's onboarding interests to the top of the recommendations list.
  // This gives the picker immediate, visible payoff without backend changes.
  const orderedDesigners = useMemo(() => {
    if (interests.length === 0 || designers.length === 0) return designers;
    const lower = new Set(interests.map((i) => i.toLowerCase()));
    return [...designers].sort((a, b) => score(b) - score(a));
    function score(d: Designer): number {
      let s = 0;
      for (const skill of d.skills ?? []) {
        if (lower.has(skill.toLowerCase())) s += 2;
      }
      const hay = `${d.title ?? ""} ${d.description ?? ""}`.toLowerCase();
      for (const i of lower) if (hay.includes(i)) s += 1;
      return s;
    }
  }, [designers, interests]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={orderedDesigners}
        keyExtractor={(item) => String(item.id)}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: chromeHeight + 8,
          paddingBottom: insets.bottom + TAB_BAR_OFFSET + 24,
          gap: 12,
        }}
        ListHeaderComponent={
          <View style={{ gap: 16 }}>
            {recents.length > 0 ? (
              <View style={{ marginBottom: 4 }}>
                <Text style={[type.caption, { color: colors.primary, marginBottom: 8 }]}>
                  Recently viewed
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 14, paddingRight: 8 }}
                >
                  {recents.map((r) => (
                    <Pressable
                      key={r.id}
                      onPress={() => router.push(`/designer/${r.id}`)}
                      style={({ pressed }) => [styles.recentTile, { opacity: pressed ? 0.8 : 1 }]}
                    >
                      <Avatar name={r.name} photoUrl={r.photoUrl} size={56} />
                      <Text
                        style={{
                          marginTop: 6,
                          fontFamily: fonts.serifSemiBold,
                          fontSize: 12,
                          color: colors.foreground,
                          textAlign: "center",
                          width: 72,
                        }}
                        numberOfLines={1}
                      >
                        {r.name.split(" ")[0]}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}
            <ScreenHeader
              eyebrow="For you"
              title="Recommended designers"
              subtitle={
                data?.total
                  ? `${data.total} ${data.total === 1 ? "designer" : "designers"} from your workspace`
                  : "Curated picks pulled from your workspace"
              }
            />
          </View>
        }
        renderItem={({ item }) => (
          <DesignerCard
            designer={item}
            onPress={() => router.push(`/designer/${item.id}`)}
          />
        )}
        ListFooterComponent={
          query.dataUpdatedAt && orderedDesigners.length > 0 ? (
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
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonDesignerCard key={i} />
              ))}
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
              action={{ label: "Try again", icon: "refresh-cw", onPress: () => query.refetch() }}
            />
          ) : (
            <EmptyState
              icon="users"
              title="No designers yet"
              description="Add designers to your workspace from the web app and they'll appear here."
              action={{
                label: "Browse directory",
                icon: "search",
                onPress: () => router.push("/designers"),
              }}
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
  recentTile: { alignItems: "center", width: 72 },
});
