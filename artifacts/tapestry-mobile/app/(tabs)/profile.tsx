import { useAuth, useUser } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/Avatar";
import { GlassChrome } from "@/components/GlassChrome";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useColors } from "@/hooks/useColors";
import { useWorkspaces } from "@/hooks/useWorkspace";
import { type } from "@/constants/typography";
import { TAB_BAR_OFFSET } from "@/constants/chrome";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { signOut } = useAuth();
  const { user } = useUser();
  const workspaces = useWorkspaces();
  const [chromeHeight, setChromeHeight] = useState(0);

  const displayName =
    user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? "Member";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          if (Platform.OS !== "web") {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          await signOut();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{
          paddingTop: chromeHeight + 8,
          paddingBottom: insets.bottom + TAB_BAR_OFFSET + 24,
        }}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Avatar name={displayName} photoUrl={user?.imageUrl} size={64} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[type.h2, { color: colors.foreground }]} numberOfLines={1}>
              {displayName}
            </Text>
            {email ? (
              <Text
                style={[type.body, { color: colors.textSecondary, marginTop: 2 }]}
                numberOfLines={1}
              >
                {email}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[type.caption, { color: colors.primary, marginBottom: 8 }]}>
            Workspaces
          </Text>
          {workspaces.data?.length ? (
            workspaces.data.map((ws) => (
              <View
                key={ws.id}
                style={[
                  styles.row,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: ws.isDefault ? colors.primary : colors.border },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[type.body, { color: colors.foreground }]}>
                    {ws.name}
                  </Text>
                  <Text style={[type.small, { color: colors.textMuted }]}>
                    {ws.role}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={[type.small, { color: colors.textMuted, paddingHorizontal: 4 }]}>
              Loading workspaces…
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => [
              styles.signOut,
              {
                borderColor: colors.border,
                borderRadius: colors.radius,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Feather name="log-out" size={18} color={colors.destructive} />
            <Text style={[type.button, { color: colors.destructive }]}>Sign out</Text>
          </Pressable>
        </View>
      </ScrollView>

      <GlassChrome onMeasureHeight={setChromeHeight}>
        <ScreenHeader eyebrow="Account" title="Profile" />
      </GlassChrome>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
    marginHorizontal: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  section: { paddingHorizontal: 20, marginTop: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
