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
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/Avatar";
import { GlassChrome } from "@/components/GlassChrome";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useColors } from "@/hooks/useColors";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useWorkspaces } from "@/hooks/useWorkspace";
import { fonts, type } from "@/constants/typography";
import { TAB_BAR_OFFSET } from "@/constants/chrome";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { signOut } = useAuth();
  const { user } = useUser();
  const workspaces = useWorkspaces();
  const push = usePushNotifications();
  const [chromeHeight, setChromeHeight] = useState(0);

  const displayName =
    user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? "Member";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  const handleTogglePush = async (next: boolean) => {
    if (next) {
      const result = await push.enable();
      if (!result.ok && result.reason) {
        Alert.alert("Couldn't enable notifications", result.reason);
      }
    } else {
      await push.disable();
    }
  };

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
            Notifications
          </Text>
          <View
            style={[
              styles.row,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
                paddingVertical: 12,
              },
            ]}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.surfaceWarm, borderColor: colors.border },
              ]}
            >
              <Feather name="bell" size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[type.body, { color: colors.foreground }]}>
                Push notifications
              </Text>
              <Text style={[type.small, { color: colors.textMuted, marginTop: 2 }]}>
                Get a ping when new designers are recommended for you.
              </Text>
            </View>
            <Switch
              value={push.optedIn}
              onValueChange={handleTogglePush}
              disabled={push.busy}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={Platform.OS === "android" ? colors.card : undefined}
            />
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

        <Text
          style={{
            fontFamily: fonts.serifRegular,
            fontSize: 11,
            color: colors.textMuted,
            textAlign: "center",
            marginTop: 24,
          }}
        >
          Tapestry follows your system appearance for light & dark mode.
        </Text>
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
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
