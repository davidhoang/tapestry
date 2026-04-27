import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DesignerCard } from "@/components/DesignerCard";
import { EmptyState } from "@/components/EmptyState";
import { FAB } from "@/components/FAB";
import { FilterChips, type FilterChip } from "@/components/FilterChips";
import { GlassChrome } from "@/components/GlassChrome";
import { LastUpdated } from "@/components/LastUpdated";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SkeletonDesignerCard } from "@/components/Skeleton";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { useColors } from "@/hooks/useColors";
import { useDefaultWorkspace } from "@/hooks/useWorkspace";
import { usePullRefresh } from "@/hooks/usePullRefresh";
import { fonts } from "@/constants/typography";
import { TAB_BAR_OFFSET } from "@/constants/chrome";
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
} from "@/lib/preferences";
import type { Designer } from "@/lib/api";

type DesignersResponse = {
  designers: Designer[];
  total: number;
  hasMore: boolean;
  offset: number;
};

const AVAILABILITY_KEY = "__available";

export default function DesignersScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const authFetch = useAuthFetch();
  const { workspace } = useDefaultWorkspace();
  const [search, setSearch] = useState("");
  const [chromeHeight, setChromeHeight] = useState(0);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  const query = useQuery({
    queryKey: ["mobile", "designers", workspace?.id, search],
    enabled: !!workspace?.id,
    queryFn: () =>
      authFetch<DesignersResponse>("/api/mobile/designers", {
        query: {
          workspaceId: workspace!.id,
          query: search || undefined,
          limit: 100,
        },
      }),
  });

  const onRefresh = usePullRefresh(() => query.refetch());

  // Hydrate recent searches.
  useEffect(() => {
    getRecentSearches().then(setRecentSearches);
  }, []);

  // Persist a search term once the user has stopped typing for 700ms.
  useEffect(() => {
    if (!search.trim()) return;
    const id = setTimeout(() => {
      addRecentSearch(search).then(() => getRecentSearches().then(setRecentSearches));
    }, 700);
    return () => clearTimeout(id);
  }, [search]);

  const designers = query.data?.designers ?? [];

  // Build filter chips from the current dataset (skills + locations + availability).
  const { skillChips, locationChips, availabilityChips } = useMemo(() => {
    const skillCount = new Map<string, number>();
    const locationSet = new Set<string>();
    let anyAvailable = false;
    for (const d of designers) {
      for (const s of d.skills ?? []) {
        if (typeof s === "string" && s.trim()) {
          skillCount.set(s, (skillCount.get(s) ?? 0) + 1);
        }
      }
      if (d.location) locationSet.add(d.location);
      if (d.available) anyAvailable = true;
    }
    const sortedSkills = Array.from(skillCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([key]): FilterChip => ({ key: `skill:${key}`, label: key }));
    const sortedLocations = Array.from(locationSet)
      .sort()
      .slice(0, 8)
      .map((loc): FilterChip => ({ key: `loc:${loc}`, label: loc, icon: "map-pin" }));
    const availability: FilterChip[] = anyAvailable
      ? [{ key: AVAILABILITY_KEY, label: "Available", icon: "check-circle" }]
      : [];
    return { skillChips: sortedSkills, locationChips: sortedLocations, availabilityChips: availability };
  }, [designers]);

  // Apply chip filters client-side.
  const visibleDesigners = useMemo(() => {
    if (activeFilters.size === 0) return designers;
    const skillFilters = new Set<string>();
    const locFilters = new Set<string>();
    let availabilityRequired = false;
    for (const f of activeFilters) {
      if (f === AVAILABILITY_KEY) availabilityRequired = true;
      else if (f.startsWith("skill:")) skillFilters.add(f.slice(6));
      else if (f.startsWith("loc:")) locFilters.add(f.slice(4));
    }
    return designers.filter((d) => {
      if (availabilityRequired && !d.available) return false;
      if (locFilters.size > 0 && (!d.location || !locFilters.has(d.location))) return false;
      if (skillFilters.size > 0) {
        const set = new Set(d.skills ?? []);
        for (const required of skillFilters) {
          if (!set.has(required)) return false;
        }
      }
      return true;
    });
  }, [designers, activeFilters]);

  const allChips = [...availabilityChips, ...skillChips, ...locationChips];

  const toggleFilter = (key: string) =>
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const clearFilters = () => setActiveFilters(new Set());

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={visibleDesigners}
        keyExtractor={(item) => String(item.id)}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: chromeHeight + 8,
          paddingBottom: insets.bottom + TAB_BAR_OFFSET + 24,
          gap: 12,
        }}
        renderItem={({ item }) => (
          <DesignerCard
            designer={item}
            onPress={() => router.push(`/designer/${item.id}`)}
          />
        )}
        ListFooterComponent={
          query.dataUpdatedAt && visibleDesigners.length > 0 ? (
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
          query.isLoading && designers.length === 0 ? (
            <View style={{ gap: 12 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonDesignerCard key={i} />
              ))}
            </View>
          ) : search ? (
            <EmptyState
              icon="search"
              title="No matches"
              description={`Nothing in your workspace matches "${search}".`}
              action={{ label: "Clear search", icon: "x", onPress: () => setSearch("") }}
            />
          ) : activeFilters.size > 0 ? (
            <EmptyState
              icon="filter"
              title="No designers match these filters"
              description="Loosen a filter to see more of your directory."
              action={{ label: "Clear filters", icon: "x", onPress: clearFilters }}
            />
          ) : (
            <EmptyState
              icon="users"
              title="No designers yet"
              description="Add designers from the web app to start building your directory."
            />
          )
        }
        keyboardShouldPersistTaps="handled"
        scrollEnabled={visibleDesigners.length > 0 || query.isLoading}
      />

      <GlassChrome onMeasureHeight={setChromeHeight}>
        <ScreenHeader
          eyebrow="Directory"
          title="All designers"
          subtitle={
            query.data
              ? `${query.data.total} in ${workspace?.name ?? "your workspace"}`
              : "Search the design talent in your workspace"
          }
        />

        <View style={styles.searchWrap}>
          <View
            style={[
              styles.searchBox,
              colors.skin === "android"
                ? {
                    backgroundColor: colors.material.surfaceContainerHigh,
                    borderColor: "transparent",
                    borderRadius: 28,
                    paddingHorizontal: 16,
                  }
                : {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                  },
            ]}
          >
            <Feather name="search" size={16} color={colors.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Search by name, title, or company"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  fontFamily: colors.skin === "android" ? fonts.sansRegular : fonts.serifRegular,
                },
              ]}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {search ? (
              <Feather
                name="x"
                size={16}
                color={colors.textMuted}
                onPress={() => setSearch("")}
              />
            ) : null}
          </View>

          {isFocused && !search && recentSearches.length > 0 ? (
            <View style={styles.recentRow}>
              <Text
                style={{
                  fontFamily: colors.skin === "android" ? fonts.sansMedium : fonts.serifSemiBold,
                  fontSize: 11,
                  color: colors.textMuted,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  marginRight: 4,
                }}
              >
                Recent
              </Text>
              {recentSearches.map((term) => (
                <Pressable
                  key={term}
                  onPress={() => setSearch(term)}
                  android_ripple={
                    colors.skin === "android"
                      ? { color: colors.material.rippleBase }
                      : undefined
                  }
                  style={({ pressed }) => [
                    styles.recentChip,
                    colors.skin === "android"
                      ? {
                          backgroundColor: colors.material.surfaceContainerHigh,
                          borderColor: "transparent",
                          borderRadius: 16,
                          opacity: pressed && Platform.OS === "ios" ? 0.7 : 1,
                        }
                      : {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                          borderRadius: colors.radius,
                          opacity: pressed ? 0.7 : 1,
                        },
                  ]}
                >
                  <Feather name="clock" size={11} color={colors.textMuted} />
                  <Text
                    style={{
                      fontFamily:
                        colors.skin === "android" ? fonts.sansRegular : fonts.serifRegular,
                      fontSize: 12,
                      color: colors.textSecondary,
                    }}
                  >
                    {term}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                onPress={async () => {
                  await clearRecentSearches();
                  setRecentSearches([]);
                }}
                hitSlop={6}
              >
                <Text
                  style={{
                    fontFamily:
                      colors.skin === "android" ? fonts.sansMedium : fonts.serifSemiBold,
                    fontSize: 11,
                    color: colors.textMuted,
                  }}
                >
                  Clear
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        {allChips.length > 0 ? (
          <View style={styles.chipsWrap}>
            <FilterChips
              chips={allChips}
              selected={activeFilters}
              onToggle={toggleFilter}
              onClearAll={clearFilters}
            />
          </View>
        ) : null}
      </GlassChrome>

      {/* Renders nothing on iOS skin. On Android skin shows a Material 3
          extended FAB pinned above the bottom nav. */}
      <FAB
        icon="search"
        label="Find designer"
        bottomOffset={insets.bottom + TAB_BAR_OFFSET + 16}
        onPress={() => {
          // Focus the search box; we just clear it so the user notices it.
          setSearch("");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchWrap: { paddingHorizontal: 20, paddingTop: 4 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 6 },
  recentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
    marginTop: 10,
  },
  recentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipsWrap: { marginTop: 10 },
});
