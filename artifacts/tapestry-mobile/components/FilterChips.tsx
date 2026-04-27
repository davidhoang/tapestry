import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";

export type FilterChip = {
  key: string;
  label: string;
  icon?: keyof typeof Feather.glyphMap;
};

type Props = {
  chips: FilterChip[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  onClearAll?: () => void;
  emptyLabel?: string;
};

/** Horizontal-scrolling pill row for multi-select filters. */
export function FilterChips({ chips, selected, onToggle, onClearAll, emptyLabel }: Props) {
  const colors = useColors();

  if (chips.length === 0 && emptyLabel) {
    return (
      <Text style={{ color: colors.textMuted, fontFamily: fonts.serifRegular, fontSize: 13 }}>
        {emptyLabel}
      </Text>
    );
  }

  const handlePress = (key: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    onToggle(key);
  };

  const showClear = onClearAll && selected.size > 0;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      {showClear ? (
        <Pressable
          onPress={() => {
            if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
            onClearAll?.();
          }}
          style={({ pressed }) => [
            styles.chip,
            {
              backgroundColor: colors.surfaceWarm,
              borderColor: colors.border,
              borderRadius: colors.radius,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather name="x" size={12} color={colors.textSecondary} />
          <Text style={[styles.text, { color: colors.textSecondary }]}>Clear</Text>
        </Pressable>
      ) : null}
      {chips.map((chip) => {
        const isSelected = selected.has(chip.key);
        return (
          <Pressable
            key={chip.key}
            onPress={() => handlePress(chip.key)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: isSelected ? colors.primary : colors.surfaceWarm,
                borderColor: isSelected ? colors.primary : colors.border,
                borderRadius: colors.radius,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            {chip.icon ? (
              <Feather
                name={chip.icon}
                size={12}
                color={isSelected ? colors.primaryForeground : colors.textSecondary}
              />
            ) : null}
            <Text
              style={[
                styles.text,
                { color: isSelected ? colors.primaryForeground : colors.textSecondary },
              ]}
            >
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
      <View style={{ width: 8 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6, paddingHorizontal: 20 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: { fontFamily: fonts.serifSemiBold, fontSize: 12, letterSpacing: 0.3 },
});
