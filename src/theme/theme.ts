/**
 * WIPP — design system unique (source de vérité).
 * Couleurs, polices, rayons, ombres, flou, animations. Clair et sombre.
 * Portable tel quel vers React Native / Expo (valeurs brutes, pas de CSS).
 * Palette provisoire : à ajuster avec les captures.
 */

export type ThemeMode = "light" | "dark";

const palette = {
  yellow: "#FFE14A", // jaune WIPP (points « lu »)
  yellowDeep: "#E6B800",
  red: "#FF453A",
  green: "#30D158",
  grey: "#8E8E93",
};

export const colors = {
  dark: {
    background: "#05070A",
    surface: "#11151C",
    surfaceElevated: "#1B1E27",
    foreground: "#F5F6F8",
    muted: "#8B8F9C",
    separator: "rgba(255,255,255,0.08)",
    glass: "rgba(18,20,27,0.62)",
    glassBorder: "rgba(255,255,255,0.10)",
    accent: palette.yellow,
    accentForeground: "#0A0A0A",
    bubbleMine: palette.yellow,
    bubbleMineText: "#0A0A0A",
    bubbleOther: "#1E212B",
    bubbleOtherText: "#F5F6F8",
    danger: palette.red,
    success: palette.green,
    statusGrey: palette.grey,
    statusRead: palette.yellow,
  },
  light: {
    background: "#F4F4F7",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    foreground: "#0B0C10",
    muted: "#6B6F7B",
    separator: "rgba(0,0,0,0.08)",
    glass: "rgba(255,255,255,0.68)",
    glassBorder: "rgba(0,0,0,0.06)",
    accent: palette.yellowDeep,
    accentForeground: "#0A0A0A",
    bubbleMine: palette.yellow,
    bubbleMineText: "#0A0A0A",
    bubbleOther: "#FFFFFF",
    bubbleOtherText: "#0B0C10",
    danger: palette.red,
    success: palette.green,
    statusGrey: palette.grey,
    statusRead: palette.yellowDeep,
  },
} as const;

export const fonts = {
  display: "'Sora', system-ui, sans-serif",
  body: "'Manrope', system-ui, sans-serif",
  googleHref:
    "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap",
  size: { caption: 12, footnote: 13, body: 16, headline: 17, title: 22, largeTitle: 34 },
};

export const radii = { sm: 10, md: 14, lg: 20, xl: 28, bubble: 20, full: 9999 };

export const shadows = {
  card: "0 8px 30px -12px rgba(0,0,0,0.45)",
  sheet: "0 -12px 40px -8px rgba(0,0,0,0.5)",
  glow: "0 0 24px -4px rgba(255,214,10,0.55)",
};

export const blur = { glass: 24, sheetBackdrop: 8 };

export const layout = {
  tabBarHeight: 80,
  navBarHeight: 44,
  largeTitleHeight: 52,
  edgeSwipeWidth: 24,
};

export const motion = {
  spring: { type: "spring" as const, stiffness: 420, damping: 38, mass: 0.9 },
  push: { type: "spring" as const, stiffness: 360, damping: 36, mass: 1 },
  sheet: { type: "spring" as const, stiffness: 380, damping: 34 },
  pressScale: 0.97,
  swipeBackThreshold: 110,
  swipeBackVelocity: 500,
};

export const theme = { colors, fonts, radii, shadows, blur, layout, motion };

/** Convertit le thème en variables CSS pour le web. */
export function themeToCssVars(mode: ThemeMode): string {
  const c = colors[mode];
  const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
  const vars = Object.entries(c).map(([k, v]) => `--wipp-${kebab(k)}:${v};`);
  vars.push(`--wipp-blur:${blur.glass}px;`, `--wipp-font-display:${fonts.display};`, `--wipp-font-body:${fonts.body};`);
  return vars.join("");
}
