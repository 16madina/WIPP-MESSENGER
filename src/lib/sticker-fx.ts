import { motion as timings } from "@/theme/theme";

/** Trois niveaux : le geste reste dans l'image, déborde dans le chat, ou devient un WIPP Moment plein écran. */
export type StickerLevel = "sticker" | "effect" | "moment";
export type StickerFx = "none" | "hearts" | "confetti" | "crown" | "shake" | "zzz" | "sparkle" | "tears" | "rings" | "sun";
export type StickerFxDetail = { fx: StickerFx; level: StickerLevel; stickerId: string; accent: string };

export const STICKER_FX_EVENT = "wipp-sticker-fx";

const byMotion: Record<string, { fx: StickerFx; level: StickerLevel }> = {
  wink: { fx: "sparkle", level: "sticker" },
  bounce: { fx: "sparkle", level: "sticker" },
  heart: { fx: "hearts", level: "effect" },
  kiss: { fx: "hearts", level: "effect" },
  laugh: { fx: "tears", level: "sticker" },
  ponder: { fx: "none", level: "sticker" },
  shock: { fx: "shake", level: "effect" },
  pop: { fx: "sparkle", level: "sticker" },
  wave: { fx: "none", level: "sticker" },
  sleep: { fx: "zzz", level: "sticker" },
  morning: { fx: "sun", level: "sticker" },
  ring: { fx: "rings", level: "sticker" },
  applause: { fx: "confetti", level: "effect" },
  shrug: { fx: "none", level: "sticker" },
  bump: { fx: "rings", level: "sticker" },
};

/** Stickers qui méritent le plein écran à la réception. */
const moments = new Set(["bravo", "13-bravo", "bisous", "09-gros-bisous"]);

export function fxFor(sticker: { id: string; motion: string; accent: string }): StickerFxDetail {
  const base = byMotion[sticker.motion] ?? { fx: "none", level: "sticker" };
  const crown = sticker.accent === "👑" ? { fx: "crown" as const, level: "effect" as const } : null;
  const picked = crown ?? base;
  return { ...picked, level: moments.has(sticker.id) ? "moment" : picked.level, stickerId: sticker.id, accent: sticker.accent };
}

export function emitStickerFx(detail: StickerFxDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<StickerFxDetail>(STICKER_FX_EVENT, { detail }));
}

export function soundAllowed() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  return window.localStorage.getItem("wipp:sound") !== "off";
}

let ctx: AudioContext | null = null;
const tones: Record<string, number[]> = {
  sparkle: [880, 1320], hearts: [523, 659, 784], confetti: [523, 659, 784, 1046], crown: [392, 523, 784],
  shake: [180, 140], zzz: [220, 196], tears: [660, 740, 660], rings: [740, 740], sun: [440, 554, 659], none: [600],
};

/** Petit son synthétisé (oscillateurs), jamais un fichier ; coupé en mode silencieux ou mouvement réduit. */
export function playStickerSound(fx: StickerFx) {
  if (!soundAllowed()) return;
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx ??= new Ctor();
    const now = ctx.currentTime;
    (tones[fx] ?? [600]).forEach((freq, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = fx === "shake" ? "square" : "sine";
      osc.frequency.value = freq;
      const t = now + i * 0.09;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(timings.stickerSoundVolume, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  } catch {
    /* audio indisponible : silence */
  }
}
