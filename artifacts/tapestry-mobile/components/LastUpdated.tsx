import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";

type Props = {
  /** Epoch ms (Date.now()) of the last successful fetch. Null hides the row. */
  updatedAt: number | null | undefined;
  /** Use this label instead of "Updated" — e.g. "Cached" when offline. */
  label?: string;
  align?: "left" | "center" | "right";
};

function formatRelative(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 5_000) return "just now";
  if (diff < 60_000) return `${Math.round(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  return `${Math.round(diff / 86_400_000)}d ago`;
}

/** Tiny "Updated 12s ago" footer that ticks once a minute. */
export function LastUpdated({ updatedAt, label = "Updated", align = "center" }: Props) {
  const colors = useColors();
  const [, force] = useState(0);

  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!updatedAt) return null;

  return (
    <View style={[styles.row, { justifyContent: alignToFlex(align) }]}>
      <Text style={[styles.text, { color: colors.textMuted }]}>
        {label} {formatRelative(updatedAt)}
      </Text>
    </View>
  );
}

function alignToFlex(a: "left" | "center" | "right") {
  return a === "left" ? "flex-start" : a === "right" ? "flex-end" : "center";
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", paddingTop: 8, paddingBottom: 4 },
  text: {
    fontFamily: fonts.serifRegular,
    fontSize: 11,
    letterSpacing: 0.4,
  },
});
