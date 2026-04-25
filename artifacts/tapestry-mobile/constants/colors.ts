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
  },

  // 4px = 0.25rem (matches theme.json radius: 0.25). Tapestry's web tailwind
  // also uses small radii (1–2px). Mobile uses slightly larger for touch UI.
  radius: 4,
};

export default colors;
