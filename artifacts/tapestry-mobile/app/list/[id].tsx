import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DesignerCard } from "@/components/DesignerCard";
import { EmptyState } from "@/components/EmptyState";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { useColors } from "@/hooks/useColors";
import { useDefaultWorkspace } from "@/hooks/useWorkspace";
import type { Designer } from "@/lib/api";

type ListDetailsResponse = {
  list: { id: number; name: string };
  designers: Array<Designer & { addedToListAt: string; listNotes: string | null }>;
  total: number;
};

export default function ListDetailScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id;
  const authFetch = useAuthFetch();
  const { workspace } = useDefaultWorkspace();

  const query = useQuery({
    queryKey: ["mobile", "list", id, workspace?.id],
    enabled: !!id && !!workspace?.id,
    queryFn: () =>
      authFetch<ListDetailsResponse>(`/api/mobile/lists/${id}/designers`, {
        query: { workspaceId: workspace!.id },
      }),
  });

  useEffect(() => {
    navigation.setOptions({ title: query.data?.list?.name ?? "" });
  }, [navigation, query.data?.list?.name]);

  const designers = query.data?.designers ?? [];

  return (
    <View style={[{ flex: 1, backgroundColor: colors.background }]}>
      <FlatList
        data={designers}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: insets.bottom + 24,
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
          ) : query.isError ? (
            <EmptyState
              icon="alert-circle"
              title="Couldn't load this list"
              description={
                query.error instanceof Error
                  ? query.error.message
                  : "Pull to refresh and try again."
              }
            />
          ) : (
            <EmptyState
              icon="bookmark"
              title="No designers in this list"
              description="Add designers from the directory to populate this list."
            />
          )
        }
        scrollEnabled={!!designers.length}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { padding: 48, alignItems: "center" },
});
