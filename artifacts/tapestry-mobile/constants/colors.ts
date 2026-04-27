/**
 * Tapestry brand tokens — synced from the web artifact's
 * `artifacts/tapestry/src/index.css` :root variables so both apps
 * feel like the same product.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: "#1A1612",
    tint: "#C8944B",

    // Core surfaces
    background: "#fafaf9",
    foreground: "#1A1612",

    // Cards / elevated surfaces — warm cream
    card: "#FBF8F3",
    cardForeground: "#1A1612",

    // Primary action color — Tapestry warm gold
    primary: "#C8944B",
    primaryForeground: "#FBF8F3",
    primaryDark: "#8B5A2B",
    primaryLight: "#E6B87D",

    // Secondary / muted warm surfaces
    secondary: "#F5F2ED",
    secondaryForeground: "#1A1612",

    // Muted / subdued elements
    muted: "#F5F2ED",
    mutedForeground: "#8C7B62",

    // Accent highlights
    accent: "#F5F2ED",
    accentForeground: "#5C4F3A",

    // Destructive
    destructive: "#B23A2E",
    destructiveForeground: "#FBF8F3",

    // Borders
    border: "#E8DFD0",
    input: "#E8DFD0",

    // Text hierarchy
    textPrimary: "#1A1612",
    textSecondary: "#5C4F3A",
    textMuted: "#8C7B62",

    // Surface variants
    surface: "#FBF8F3",
    surfaceWarm: "#F5F2ED",

    // Glass chrome tint (rgba) — used by GlassChrome / tab bar fallback
    glassTint: "rgba(251,248,243,0.35)",
    glassTintFallback: "rgba(251,248,243,0.5)",
    glassBorder: "rgba(255,255,255,0.55)",

    // Skeleton shimmer base
    skeletonBase: "#EEE7D9",
    skeletonHighlight: "#F7F1E5",
  },

  dark: {
    text: "#F5EFE3",
    tint: "#E6B87D",

    // Core surfaces — deep warm charcoal, never pure black
    background: "#141210",
    foreground: "#F5EFE3",

    // Cards — slightly elevated warm tone
    card: "#1F1B16",
    cardForeground: "#F5EFE3",

    // Primary action — softer gold so it doesn't blow out on dark
    primary: "#E6B87D",
    primaryForeground: "#1A1612",
    primaryDark: "#C8944B",
    primaryLight: "#F0CFA0",

    // Secondary surfaces
    secondary: "#28231D",
    secondaryForeground: "#F5EFE3",

    // Muted
    muted: "#28231D",
    mutedForeground: "#9C8E78",

    // Accent
    accent: "#28231D",
    accentForeground: "#D6C9B0",

    // Destructive — slightly desaturated for dark
    destructive: "#D86A5C",
    destructiveForeground: "#1A1612",

    // Borders — barely visible warm hairline
    border: "#33291D",
    input: "#33291D",

    // Text hierarchy
    textPrimary: "#F5EFE3",
    textSecondary: "#C9B996",
    textMuted: "#8B7E68",

    // Surface variants
    surface: "#1F1B16",
    surfaceWarm: "#28231D",

    // Glass chrome — darker translucent base
    glassTint: "rgba(20,18,16,0.45)",
    glassTintFallback: "rgba(20,18,16,0.55)",
    glassBorder: "rgba(255,255,255,0.10)",

    // Skeleton shimmer base
    skeletonBase: "#28231D",
    skeletonHighlight: "#33291D",
  },

  // 4px = 0.25rem (matches theme.json radius: 0.25). Tapestry's web tailwind
  // also uses small radii (1–2px). Mobile uses slightly larger for touch UI.
  radius: 4,
};

export default colors;
