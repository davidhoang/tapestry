import { isAndroidSkin } from "@/lib/platform-skin";

export const fonts = {
  serifRegular: "CrimsonText_400Regular",
  serifSemiBold: "CrimsonText_600SemiBold",
  serifBold: "CrimsonText_700Bold",
  serifItalic: "CrimsonText_400Regular_Italic",
  // Material 3 — Roboto family. These names match @expo-google-fonts/roboto.
  sansRegular: "Roboto_400Regular",
  sansMedium: "Roboto_500Medium",
  sansBold: "Roboto_700Bold",
  sansItalic: "Roboto_400Regular_Italic",
};

/**
 * Build a typography scale for the requested skin.
 *
 * - iOS skin: Crimson Text serif with tight tracking — feels editorial.
 * - Android skin: Roboto sans with a Material 3 type scale — feels mechanical.
 *
 * The shape is identical so screens don't need to know which skin is active.
 */
function buildType(skin: "ios" | "android") {
  if (skin === "android") {
    return {
      // Material 3 Display Small / Headline Medium / etc.
      display: { fontFamily: fonts.sansRegular, fontSize: 36, lineHeight: 44, letterSpacing: 0 },
      h1: { fontFamily: fonts.sansMedium, fontSize: 28, lineHeight: 36, letterSpacing: 0 },
      h2: { fontFamily: fonts.sansMedium, fontSize: 22, lineHeight: 28, letterSpacing: 0 },
      h3: { fontFamily: fonts.sansMedium, fontSize: 18, lineHeight: 24, letterSpacing: 0.15 },
      bodyLarge: { fontFamily: fonts.sansRegular, fontSize: 16, lineHeight: 24, letterSpacing: 0.5 },
      body: { fontFamily: fonts.sansRegular, fontSize: 14, lineHeight: 20, letterSpacing: 0.25 },
      small: { fontFamily: fonts.sansRegular, fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
      caption: {
        fontFamily: fonts.sansMedium,
        fontSize: 11,
        lineHeight: 16,
        letterSpacing: 0.5,
        // Material doesn't all-caps labels by default
        textTransform: "none" as const,
      },
      label: { fontFamily: fonts.sansMedium, fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },
      button: { fontFamily: fonts.sansMedium, fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },
    };
  }
  return {
    display: { fontFamily: fonts.serifBold, fontSize: 32, lineHeight: 38, letterSpacing: -0.5 },
    h1: { fontFamily: fonts.serifBold, fontSize: 28, lineHeight: 34, letterSpacing: -0.4 },
    h2: { fontFamily: fonts.serifSemiBold, fontSize: 22, lineHeight: 28, letterSpacing: -0.2 },
    h3: { fontFamily: fonts.serifSemiBold, fontSize: 18, lineHeight: 24 },
    bodyLarge: { fontFamily: fonts.serifRegular, fontSize: 17, lineHeight: 26 },
    body: { fontFamily: fonts.serifRegular, fontSize: 16, lineHeight: 24 },
    small: { fontFamily: fonts.serifRegular, fontSize: 14, lineHeight: 20 },
    caption: {
      fontFamily: fonts.serifSemiBold,
      fontSize: 11,
      lineHeight: 14,
      letterSpacing: 1.2,
      textTransform: "uppercase" as const,
    },
    label: { fontFamily: fonts.serifSemiBold, fontSize: 13, lineHeight: 18 },
    button: { fontFamily: fonts.serifSemiBold, fontSize: 15, lineHeight: 20 },
  };
}

// Resolved at module load. The platform skin is decided once from the URL,
// so all consumers that import { type } get the right scale even when they
// destructure on first render.
export const type = buildType(isAndroidSkin() ? "android" : "ios");

/**
 * Default text family for the active skin. Used as a fallback for any
 * `<Text>` that doesn't explicitly set a fontFamily.
 */
export const defaultTextFontFamily = isAndroidSkin()
  ? fonts.sansRegular
  : fonts.serifRegular;
