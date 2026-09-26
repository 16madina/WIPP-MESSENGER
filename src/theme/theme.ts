/**
 * WIPP — design system unique (source de vérité).
 * Couleurs, polices, typographie, rayons, ombres, flou, mise en page, animations, vibrations.
 * Portable tel quel vers React Native / Expo (valeurs brutes, pas de CSS).
 */

export type ThemeMode = "light" | "dark";

const palette = {
  yellow: "#FFE14A", // jaune WIPP (points « lu »)
  yellowDeep: "#E6B800",
  red: "#FF453A",
  green: "#30D158",
  blue: "#0A84FF",
  indigo: "#5E5CE6",
  orange: "#FF9F0A",
  grey: "#8E8E93",
};

export const colors = {
  dark: {
    background: "#0B1224",
    surface: "#141D33",
    surfaceElevated: "#1D2946",
    foreground: "#F5F6F8",
    muted: "#8B93AC",
    separator: "rgba(255,255,255,0.08)",
    glass: "rgba(24,32,56,0.55)",
    glassStrong: "rgba(32,42,72,0.72)",
    glassBorder: "rgba(255,255,255,0.10)",
    glassHighlight: "rgba(255,255,255,0.22)",
    backdrop: "rgba(0,0,0,0.35)",
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
    actionPin: palette.yellowDeep,
    actionUnread: palette.blue,
    actionMute: palette.indigo,
    actionArchive: palette.orange,
    actionDelete: palette.red,
    switchOff: "rgba(120,120,128,0.36)",
    switchKnob: "#FFFFFF",
    segmentTrack: "rgba(118,118,128,0.24)",
    segmentThumb: "#636366",
    skeleton: "rgba(255,255,255,0.06)",
    skeletonHighlight: "rgba(255,255,255,0.10)",
    surpriseInk: "#0A0B10",
    surprisePaper: "#F8F4E8",
    surpriseGold: "#F5C94F",
    surpriseGoldDeep: "#A87520",
    surpriseLine: "rgba(245,201,79,0.5)",
    surpriseChoice: "#303746",
    surpriseChoiceRaised: "#485160",
    surpriseChoiceBorder: "rgba(235,239,248,0.26)",
    sharePanel: "#171C21",
    shareTile: "#191B1B",
    shareTileHighlight: "#29271C",
    shareTileBorder: "rgba(215,189,112,0.22)",
    shareSubtitle: "#B3B9C4",
    surprisePanel: "#10171B",
    surpriseTile: "#171B1B",
    surpriseTileTop: "#29271D",
    surpriseSecondary: "#AEB7CD",
    surpriseBright: "#FFE34F",
    surpriseGlow: "rgba(255,214,46,0.45)",
  },
  light: {
    background: "#F4F4F7",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    foreground: "#0B0C10",
    muted: "#6B6F7B",
    separator: "rgba(0,0,0,0.08)",
    glass: "rgba(255,255,255,0.62)",
    glassStrong: "rgba(255,255,255,0.78)",
    glassBorder: "rgba(0,0,0,0.06)",
    glassHighlight: "rgba(255,255,255,0.9)",
    backdrop: "rgba(0,0,0,0.18)",
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
    actionPin: palette.yellowDeep,
    actionUnread: palette.blue,
    actionMute: palette.indigo,
    actionArchive: palette.orange,
    actionDelete: palette.red,
    switchOff: "rgba(120,120,128,0.16)",
    switchKnob: "#FFFFFF",
    segmentTrack: "rgba(118,118,128,0.12)",
    segmentThumb: "#FFFFFF",
    skeleton: "rgba(0,0,0,0.06)",
    skeletonHighlight: "rgba(255,255,255,0.7)",
    surpriseInk: "#0A0B10",
    surprisePaper: "#F8F4E8",
    surpriseGold: "#D59B25",
    surpriseGoldDeep: "#87570E",
    surpriseLine: "rgba(213,155,37,0.5)",
    surpriseChoice: "#E3E5EA",
    surpriseChoiceRaised: "#C9CDD6",
    surpriseChoiceBorder: "rgba(48,55,70,0.38)",
    sharePanel: "#171C21",
    shareTile: "#191B1B",
    shareTileHighlight: "#29271C",
    shareTileBorder: "rgba(215,189,112,0.22)",
    shareSubtitle: "#B3B9C4",
    surprisePanel: "#10171B",
    surpriseTile: "#171B1B",
    surpriseTileTop: "#29271D",
    surpriseSecondary: "#AEB7CD",
    surpriseBright: "#FFE34F",
    surpriseGlow: "rgba(255,214,46,0.45)",
  },
} as const;

/** Police native du téléphone (SF Pro sur iOS, Roboto sur Android). */
const systemStack = `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", Roboto, "Helvetica Neue", system-ui, sans-serif`;
export const fonts = {
  display: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Roboto, system-ui, sans-serif`,
  body: systemStack,
};

/** Échelle typographique iOS (taille, graisse, interligne, approche en px). */
export const typography = {
  largeTitle: { size: 34, weight: 700, lineHeight: 41, tracking: 0.37 },
  title2: { size: 22, weight: 700, lineHeight: 28, tracking: -0.26 },
  nav: { size: 17, weight: 600, lineHeight: 22, tracking: -0.43 },
  headline: { size: 17, weight: 600, lineHeight: 22, tracking: -0.43 },
  body: { size: 17, weight: 400, lineHeight: 22, tracking: -0.43 },
  subhead: { size: 15, weight: 400, lineHeight: 20, tracking: -0.23 },
  footnote: { size: 13, weight: 400, lineHeight: 18, tracking: -0.08 },
  caption: { size: 13, weight: 400, lineHeight: 18, tracking: -0.08 },
  caption2: { size: 11, weight: 400, lineHeight: 13, tracking: 0.06 },
  tab: { size: 10, weight: 500, lineHeight: 12, tracking: 0.1 },
} as const;

export const radii = { sm: 10, md: 14, lg: 20, xl: 28, bubble: 18, bubbleTight: 5, menu: 14, tabBar: 32, sheet: 12, full: 9999 };

export const shadows = {
  card: "0 8px 30px -12px rgba(0,0,0,0.45)",
  sheet: "0 -12px 40px -8px rgba(0,0,0,0.5)",
  glow: "0 0 22px -6px rgba(255,225,74,0.55)",
  bar: "0 10px 30px -8px rgba(0,0,0,0.45)",
  lift: "0 18px 40px -10px rgba(0,0,0,0.55)",
};

export const blur = { glass: 24, bar: 30, menu: 40, backdrop: 14, banner: 30, saturate: 1.8 };

export const layout = {
  tabBarHeight: 64,
  tabBarMargin: 12,
  centerButton: 58,
  centerLift: 16,
  navBarHeight: 44,
  largeTitleHeight: 52,
  searchBarHeight: 52,
  edgeSwipeWidth: 24,
  minTouch: 44,
  swipeActionWidth: 74,
  menuWidth: 250,
  menuItemHeight: 44,
  reactionBarHeight: 48,
  inputBarHeight: 56,
  surpriseCardWidth: 260,
  surpriseCardHeight: 216,
  surpriseScratchRadius: 28,
  surpriseRevealRatio: 0.68,
  surpriseMessageLimit: 300,
  surpriseChoiceHeight: 116,
  surpriseComposeInset: 44,
  surpriseArtworkHeight: 86,
  surpriseOptionHeight: 146,
  surpriseAnimationDrawerWidth: 340,
  surpriseAnimationTileHeight: 132,
  shareTileHeight: 120,
};

export const motion = {
  spring: { type: "spring" as const, stiffness: 420, damping: 38, mass: 0.9 },
  push: { type: "spring" as const, stiffness: 360, damping: 36, mass: 1 },
  sheet: { type: "spring" as const, stiffness: 380, damping: 36 },
  tabBounce: { type: "spring" as const, stiffness: 700, damping: 14 },
  swipe: { type: "spring" as const, stiffness: 520, damping: 42 },
  rubber: { type: "spring" as const, stiffness: 400, damping: 40 },
  lift: { type: "spring" as const, stiffness: 480, damping: 30 },
  message: { type: "spring" as const, stiffness: 460, damping: 32 },
  toggle: { type: "spring" as const, stiffness: 600, damping: 36 },
  tabFade: 0.12,
  pressScale: 0.97,
  liftScale: 1.03,
  swipeBackThreshold: 110,
  swipeBackVelocity: 500,
  swipeOpenThreshold: 50,
  swipeFullRatio: 0.62,
  replyThreshold: 64,
  longPressMs: 420,
  reactionStagger: 0.035,
  sheetHalfRatio: 0.52,
  sheetShareRatio: 0.66,
  recedeScale: 0.94,
  recedeRadius: 12,
  bannerMs: 4000,
  rubberMax: 140,
  rubberCoef: 0.55,
  pullRefreshThreshold: 80,
  pullRevealThreshold: 30,
  refreshHold: 56,
  refreshMs: 1200,
  skeletonMs: 900,
  shimmerSeconds: 1.4,
  surpriseRevealPauseMs: 450,
  surpriseAnimationMs: 2600,
};

/** Vibrations courtes (ms) — navigator.vibrate sur le web, Haptics sur Expo. */
export const haptics: Record<"light" | "medium" | "success" | "warning", number | number[]> = {
  light: 8,
  medium: 14,
  success: [10, 40, 10],
  warning: [20, 60, 20],
};

export const theme = { colors, fonts, typography, radii, shadows, blur, layout, motion, haptics };

/** Convertit le thème en variables CSS pour le web. */
export function themeToCssVars(mode: ThemeMode): string {
  const c = colors[mode];
  const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
  const vars = Object.entries(c).map(([k, v]) => `--wipp-${kebab(k)}:${v};`);
  for (const [k, t] of Object.entries(typography)) {
    const n = kebab(k);
    vars.push(`--wipp-t-${n}-size:${t.size}px;--wipp-t-${n}-weight:${t.weight};--wipp-t-${n}-lh:${t.lineHeight}px;--wipp-t-${n}-ls:${t.tracking}px;`);
  }
  vars.push(
    `--wipp-blur:${blur.glass}px;`,
    `--wipp-blur-bar:${blur.bar}px;`,
    `--wipp-blur-menu:${blur.menu}px;`,
    `--wipp-blur-backdrop:${blur.backdrop}px;`,
    `--wipp-saturate:${blur.saturate};`,
    `--wipp-shadow-bar:${shadows.bar};`,
    `--wipp-shadow-lift:${shadows.lift};`,
    `--wipp-shadow-glow:${shadows.glow};`,
    `--wipp-shimmer-duration:${motion.shimmerSeconds}s;`,
    `--wipp-font-display:${fonts.display};`,
    `--wipp-font-body:${fonts.body};`,
  );
  return vars.join("");
}
