export const fonts = {
  serifRegular: "CrimsonText_400Regular",
  serifSemiBold: "CrimsonText_600SemiBold",
  serifBold: "CrimsonText_700Bold",
  serifItalic: "CrimsonText_400Regular_Italic",
  sansRegular: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
  sansSemiBold: "Inter_600SemiBold",
  sansBold: "Inter_700Bold",
};

export const type = {
  display: { fontFamily: fonts.serifBold, fontSize: 32, lineHeight: 38, letterSpacing: -0.5 },
  h1: { fontFamily: fonts.serifBold, fontSize: 28, lineHeight: 34, letterSpacing: -0.4 },
  h2: { fontFamily: fonts.serifSemiBold, fontSize: 22, lineHeight: 28, letterSpacing: -0.2 },
  h3: { fontFamily: fonts.serifSemiBold, fontSize: 18, lineHeight: 24 },
  bodyLarge: { fontFamily: fonts.serifRegular, fontSize: 17, lineHeight: 26 },
  body: { fontFamily: fonts.serifRegular, fontSize: 16, lineHeight: 24 },
  small: { fontFamily: fonts.serifRegular, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.sansMedium, fontSize: 12, lineHeight: 16, letterSpacing: 0.4, textTransform: "uppercase" as const },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 13, lineHeight: 18 },
  button: { fontFamily: fonts.sansSemiBold, fontSize: 15, lineHeight: 20 },
};
