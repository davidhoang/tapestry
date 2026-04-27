import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DesignerCard } from "@/components/DesignerCard";
import { EmptyState } from "@/components/EmptyState";
import { LastUpdated } from "@/components/LastUpdated";
import { SkeletonDesignerCard } from "@/components/Skeleton";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { useColors } from "@/hooks/useColors";
import { useDefaultWorkspace } from "@/hooks/useWorkspace";
import { usePullRefresh } from "@/hooks/usePullRefresh";
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

  const onRefresh = usePullRefresh(() => query.refetch());

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
        ListFooterComponent={
          query.dataUpdatedAt && designers.length > 0 ? (
            <LastUpdated updatedAt={query.dataUpdatedAt} />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.primary}
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
              title="Couldn't load this list"
              description={
                query.error instanceof Error
                  ? query.error.message
                  : "Pull to refresh and try again."
              }
              action={{ label: "Try again", icon: "refresh-cw", onPress: () => query.refetch() }}
            />
          ) : (
            <EmptyState
              icon="bookmark"
              title="No designers in this list"
              description="Open the directory to find designers to add from the web app."
              action={{
                label: "Browse directory",
                icon: "users",
                onPress: () => router.push("/designers"),
              }}
            />
          )
        }
        scrollEnabled={!!designers.length}
      />
    </View>
  );
}

const styles = StyleSheet.create({});
