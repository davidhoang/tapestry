import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TapestryLogo } from "@/components/TapestryLogo";
import { useColors } from "@/hooks/useColors";
import { setInterests, setOnboarded } from "@/lib/preferences";
import { fonts, type } from "@/constants/typography";

const INTEREST_OPTIONS = [
  "Brand identity",
  "Product design",
  "UX research",
  "UI design",
  "Illustration",
  "Motion",
  "Type design",
  "Creative direction",
  "Editorial",
  "3D",
  "Packaging",
  "Web design",
  "Mobile design",
  "Strategy",
];

const MIN_PICKS = 2;
const MAX_PICKS = 6;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const toggle = (label: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else if (next.size < MAX_PICKS) next.add(label);
      return next;
    });
  };

  const finish = async (skipped: boolean) => {
    setSaving(true);
    try {
      if (!skipped) await setInterests(Array.from(selected));
      await setOnboarded(true);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      router.replace("/");
    } finally {
      setSaving(false);
    }
  };

  const canContinue = selected.size >= MIN_PICKS && !saving;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 16 }]}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <TapestryLogo size="md" />
        </View>
        <Text style={[type.caption, { color: colors.primary }]}>Welcome to Tapestry</Text>
        <Text style={[type.display, { color: colors.foreground, marginTop: 6 }]}>
          What kind of work pulls you in?
        </Text>
        <Text style={[type.body, { color: colors.textSecondary, marginTop: 8 }]}>
          Pick {MIN_PICKS}–{MAX_PICKS} interests so your “For you” feed has signal from day one.
        </Text>

        <View style={styles.grid}>
          {INTEREST_OPTIONS.map((label) => {
            const isSelected = selected.has(label);
            return (
              <Pressable
                key={label}
                onPress={() => toggle(label)}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderRadius: colors.radius,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                {isSelected ? (
                  <Feather name="check" size={14} color={colors.primaryForeground} />
                ) : null}
                <Text
                  style={{
                    fontFamily: fonts.serifSemiBold,
                    fontSize: 14,
                    color: isSelected ? colors.primaryForeground : colors.foreground,
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: colors.background }]}>
        <Text style={[type.small, { color: colors.textMuted, textAlign: "center" }]}>
          {selected.size}/{MAX_PICKS} selected
        </Text>
        <Pressable
          onPress={() => finish(false)}
          disabled={!canContinue}
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: canContinue ? colors.primary : colors.muted,
              borderRadius: colors.radius,
              opacity: pressed && canContinue ? 0.9 : 1,
            },
          ]}
        >
          {saving ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text
              style={[
                type.button,
                {
                  color: canContinue ? colors.primaryForeground : colors.textMuted,
                },
              ]}
            >
              Continue
            </Text>
          )}
        </Pressable>
        <Pressable onPress={() => finish(true)} disabled={saving} style={styles.skip}>
          <Text style={[type.small, { color: colors.textMuted }]}>Skip for now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 24,
    marginBottom: 32,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  footer: { paddingHorizontal: 24, paddingTop: 8, gap: 8 },
  cta: { paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  skip: { paddingVertical: 8, alignItems: "center" },
});
