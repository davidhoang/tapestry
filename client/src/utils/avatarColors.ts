const COLOR_PAIRS: Array<{ bg: string; text: string }> = [
  { bg: "#D4E4F7", text: "#1A3A5C" },
  { bg: "#D4EDD9", text: "#1A4A24" },
  { bg: "#F5DDE4", text: "#5C1A2A" },
  { bg: "#EDE3F5", text: "#3A1A5C" },
  { bg: "#FFF0CC", text: "#5C3A00" },
  { bg: "#D4F0F0", text: "#0A3A3A" },
  { bg: "#F5E8D4", text: "#5C3A10" },
  { bg: "#E8D4F5", text: "#2A0A5C" },
  { bg: "#D4F5E0", text: "#0A4A24" },
  { bg: "#F5D4D4", text: "#5C0A0A" },
  { bg: "#D4E8F5", text: "#0A2A5C" },
  { bg: "#F5F0D4", text: "#4A3A00" },
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function getAvatarColors(name: string): { bg: string; text: string } {
  const index = hashString(name) % COLOR_PAIRS.length;
  return COLOR_PAIRS[index];
}
