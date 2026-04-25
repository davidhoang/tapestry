import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DesignerCard } from "@/components/DesignerCard";
import { EmptyState } from "@/components/EmptyState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { useColors } from "@/hooks/useColors";
import { useDefaultWorkspace } from "@/hooks/useWorkspace";
import { type, fonts } from "@/constants/typography";
import type { Designer } from "@/lib/api";

type DesignersResponse = {
  designers: Designer[];
  total: number;
  hasMore: boolean;
  offset: number;
};

const TAB_BAR_HEIGHT = Platform.OS === "web" ? 84 : 88;

export default function DesignersScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const authFetch = useAuthFetch();
  const { workspace } = useDefaultWorkspace();
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: ["mobile", "designers", workspace?.id, search],
    enabled: !!workspace?.id,
    queryFn: () =>
      authFetch<DesignersResponse>("/api/mobile/designers", {
        query: {
          workspaceId: workspace!.id,
          query: search || undefined,
          limit: 50,
        },
      }),
  });

  const designers = query.data?.designers ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: insets.top, backgroundColor: colors.background }}>
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
              {
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
              placeholder="Search by name, title, or company"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                { color: colors.foreground, fontFamily: fonts.serifRegular },
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
        </View>
      </View>

      <FlatList
        data={designers}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 24,
          gap: 12,
        }}
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
          ) : search ? (
            <EmptyState
              icon="search"
              title="No matches"
              description={`Nothing in your workspace matches "${search}".`}
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
        scrollEnabled={!!designers.length}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchWrap: { paddingHorizontal: 20, paddingBottom: 8 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 6 },
  center: { padding: 48, alignItems: "center" },
});
