import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { useMemo } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { fonts, type } from "@/constants/typography";
import type { PortfolioMediaItem, PortfolioProject } from "@/lib/api";

type Props = {
  projects: PortfolioProject[];
  media: PortfolioMediaItem[];
};

const GAP = 8;
const SCREEN = Dimensions.get("window").width;
const SIDE_PAD = 20 + 16; // section horizontal padding + section body padding
const TILE_WIDTH = (SCREEN - SIDE_PAD * 2 - GAP) / 2;

/**
 * Two-column responsive grid of a designer's published work. Each tile
 * shows the cover image (or first piece of media for that project) and
 * opens the project URL in an in-app browser when tapped.
 */
export function PortfolioGallery({ projects, media }: Props) {
  const colors = useColors();

  const projectThumbnail = useMemo(() => {
    const map = new Map<number, string>();
    for (const m of media) {
      if (m.projectId && m.fileType === "image" && !map.has(m.projectId)) {
        map.set(m.projectId, m.fileUrl);
      }
    }
    return map;
  }, [media]);

  // Standalone media (not tied to a project) shown after the project tiles.
  const standaloneMedia = useMemo(
    () => media.filter((m) => !m.projectId && m.fileType === "image"),
    [media],
  );

  if (projects.length === 0 && standaloneMedia.length === 0) {
    return (
      <Text style={[type.small, { color: colors.textMuted }]}>
        No portfolio pieces published yet.
      </Text>
    );
  }

  const openProject = (project: PortfolioProject) => {
    if (project.projectUrl) WebBrowser.openBrowserAsync(project.projectUrl).catch(() => {});
  };

  return (
    <View style={styles.grid}>
      {projects.map((project) => {
        const thumb = project.coverImageUrl ?? projectThumbnail.get(project.id) ?? null;
        return (
          <Pressable
            key={`p-${project.id}`}
            onPress={() => openProject(project)}
            disabled={!project.projectUrl}
            style={({ pressed }) => [styles.tile, { opacity: pressed ? 0.85 : 1 }]}
          >
            <View
              style={[
                styles.tileImage,
                { backgroundColor: colors.surfaceWarm, borderRadius: colors.radius, borderColor: colors.border },
              ]}
            >
              {thumb ? (
                <Image
                  source={{ uri: thumb }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={150}
                  cachePolicy="memory-disk"
                  recyclingKey={String(project.id)}
                />
              ) : (
                <View style={styles.tilePlaceholder}>
                  <Feather name="image" size={20} color={colors.textMuted} />
                </View>
              )}
              {project.isFeatured ? (
                <View style={[styles.featured, { backgroundColor: colors.primary }]}>
                  <Feather name="star" size={9} color={colors.primaryForeground} />
                </View>
              ) : null}
            </View>
            <Text
              numberOfLines={1}
              style={{ color: colors.foreground, fontFamily: fonts.serifSemiBold, fontSize: 13, marginTop: 6 }}
            >
              {project.title}
            </Text>
            {project.category ? (
              <Text
                numberOfLines={1}
                style={{ color: colors.textMuted, fontFamily: fonts.serifRegular, fontSize: 11 }}
              >
                {project.category}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
      {standaloneMedia.map((m) => (
        <View key={`m-${m.id}`} style={styles.tile}>
          <View
            style={[
              styles.tileImage,
              { backgroundColor: colors.surfaceWarm, borderRadius: colors.radius, borderColor: colors.border },
            ]}
          >
            <Image
              source={{ uri: m.fileUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={150}
              cachePolicy="memory-disk"
              recyclingKey={String(m.id)}
            />
          </View>
          {m.caption ? (
            <Text
              numberOfLines={1}
              style={{ color: colors.textMuted, fontFamily: fonts.serifRegular, fontSize: 11, marginTop: 6 }}
            >
              {m.caption}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  tile: { width: TILE_WIDTH },
  tileImage: {
    width: "100%",
    aspectRatio: 4 / 3,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  tilePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  featured: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
});
