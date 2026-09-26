/**
 * Gestes dédiés des stickers, même méthode que « Stop ! » : le PNG reste intact,
 * une partie est isolée par clip-path (texte, tête, haut ou image entière) puis amplifiée,
 * et un éclair coloré est posé en couche séparée. Chaque sticker a son réglage.
 */
export type GestureMove = "lunge" | "pop" | "bob" | "sway" | "shake" | "run" | "ring" | "drop" | "pulse";
export type GesturePart = "full" | "text" | "head" | "top";

export type StickerGesture = {
  move: GestureMove;
  part: GesturePart;
  /** Grossissement maximal de la partie isolée. */
  peak: number;
  /** Couleur de l'éclair d'impact. */
  color: string;
  /** Position de l'éclair en % [gauche, haut]. */
  flashAt: readonly [number, number];
};

const clips: Record<GesturePart, string> = {
  full: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
  text: "polygon(0% 60%, 100% 60%, 100% 100%, 0% 100%)",
  head: "polygon(0% 0%, 100% 0%, 100% 48%, 0% 48%)",
  top: "polygon(0% 0%, 100% 0%, 100% 32%, 0% 32%)",
};

const origins: Record<GesturePart, string> = {
  full: "50% 60%",
  text: "50% 82%",
  head: "50% 42%",
  top: "50% 12%",
};

export const gestureClip = (part: GesturePart) => clips[part];
export const gestureOrigin = (part: GesturePart) => origins[part];

const gold = "rgba(255,225,74,.85)";
const pink = "rgba(255,110,150,.85)";
const red = "rgba(255,70,70,.85)";
const blue = "rgba(120,160,255,.8)";
const green = "rgba(120,230,140,.8)";
const orange = "rgba(255,160,60,.85)";

const g = (move: GestureMove, part: GesturePart, peak: number, color: string, flashAt: readonly [number, number] = [50, 62]): StickerGesture =>
  ({ move, part, peak, color, flashAt });

/** Un geste par sticker, réglé selon ce que le personnage fait. */
const table: Record<string, StickerGesture> = {
  // Pour elle
  "wippe-moi": g("pop", "text", 1.3, gold),
  "ca-wipp": g("pop", "full", 1.35, gold),
  "merci": g("pulse", "full", 1.22, pink),
  "on-se-capte": g("bob", "head", 1.15, gold),
  "mdr": g("bob", "head", 1.2, gold),
  "hmm": g("sway", "head", 1.1, blue),
  "no-way": g("lunge", "full", 1.5, red),
  "valide": g("pop", "text", 1.35, green),
  "j-arrive": g("run", "full", 1.15, gold),
  "bonne-nuit": g("sway", "head", 1.08, blue, [50, 30]),
  "bon-matin": g("drop", "top", 1.2, gold, [50, 22]),
  "appelle-moi": g("ring", "head", 1.15, gold, [50, 35]),
  "bisous": g("pulse", "full", 1.25, pink),
  "bravo": g("pop", "full", 1.3, gold),
  "laisse-tomber": g("shake", "head", 1.12, blue),
  "connecte": g("lunge", "full", 1.4, gold),
  // WIPP officiels
  "wipp-parfait": g("pop", "text", 1.3, gold),
  "wipp-tes-un-boss": g("drop", "top", 1.25, gold, [50, 20]),
  "wipp-mood": g("bob", "head", 1.12, gold),
  "wipp-merci": g("pulse", "full", 1.22, pink),
  "wipp-je-recharge": g("pulse", "full", 1.15, green),
  "wipp-aie-aie-aie": g("bob", "head", 1.2, orange),
  "wipp-pas-mon-probleme": g("shake", "head", 1.12, blue),
  "wipp-bonne-journee": g("drop", "top", 1.2, gold, [50, 22]),
  "wipp-gros-bisous": g("pulse", "full", 1.28, pink),
  "wipp-dors-bien": g("sway", "head", 1.08, blue, [50, 30]),
  "wipp-bonne-musique": g("bob", "head", 1.18, gold),
  "wipp-pour-toi": g("pulse", "full", 1.22, pink),
  "wipp-bravo": g("pop", "full", 1.3, gold),
  "wipp-cest-chaud": g("lunge", "full", 1.45, orange),
  "wipp-on-apprend": g("pop", "head", 1.15, gold, [50, 30]),
  "wipp-jadore": g("pulse", "full", 1.25, pink),
  "wipp-allons-y": g("run", "full", 1.15, gold),
  "wipp-nope": g("shake", "full", 1.12, red),
  "wipp-a-plus-tard": g("run", "full", 1.12, blue),
  "wipp-on-joue": g("pop", "full", 1.25, gold),
  "wipp-on-va-loin": g("run", "full", 1.18, gold),
  "wipp-see-you-soon": g("run", "full", 1.15, blue),
  "wipp-objectif": g("pop", "full", 1.3, gold),
  "wipp-toujours-a-ton-service": g("bob", "head", 1.12, gold),
  "wipp-bon-appetit": g("pop", "text", 1.25, orange),
  "wipp-alerte": g("ring", "full", 1.2, red),
  "wipp-confidentiel": g("pop", "full", 1.2, blue),
  "wipp-ca-va-aller": g("pulse", "full", 1.18, pink),
  "wipp-histoire-de-ouf": g("bob", "head", 1.2, gold),
  "wipp-prends-soin-de-toi": g("pulse", "full", 1.2, pink),
  // Mood série 1
  "mood-va-la-bas": g("run", "full", 1.2, gold),
  "mood-stop": g("lunge", "full", 1.6, red),
  "mood-hahaha": g("bob", "head", 1.22, gold),
  "mood-pas-aujourdhui": g("sway", "head", 1.1, blue),
  "mood-le-boss": g("drop", "top", 1.25, gold, [50, 20]),
  "mood-trop-tot": g("sway", "head", 1.08, blue, [50, 30]),
  "mood-ca-marche": g("pop", "full", 1.28, green),
  "mood-valide": g("pop", "text", 1.35, green),
  "mood-bisousss": g("pulse", "full", 1.25, pink),
  "mood-nimporte-quoi": g("shake", "head", 1.15, orange),
  "mood-bien-joue": g("pop", "full", 1.25, gold),
  "mood-ecoute-bien": g("ring", "head", 1.15, gold, [50, 35]),
  "mood-laisse-moi": g("shake", "full", 1.15, red),
  "mood-cool": g("bob", "head", 1.12, blue),
  "mood-vraiment": g("pop", "head", 1.2, orange, [50, 30]),
  "mood-oh-non": g("lunge", "full", 1.4, blue),
  "mood-yesss": g("pop", "full", 1.35, gold),
  "mood-dodo": g("sway", "head", 1.08, blue, [50, 30]),
  "mood-tchip": g("shake", "head", 1.12, orange),
  "mood-focus": g("drop", "top", 1.22, gold, [50, 20]),
  // Mood série 2
  "mood2-toi-la": g("lunge", "full", 1.45, gold),
  "mood2-cours": g("run", "full", 1.2, orange),
  "mood2-hahaha": g("bob", "head", 1.22, gold),
  "mood2-pas-mon-probleme": g("shake", "head", 1.12, blue),
  "mood2-nananana": g("bob", "head", 1.2, gold),
  "mood2-hum": g("sway", "head", 1.1, blue),
  "mood2-mdr": g("bob", "head", 1.22, gold),
  "mood2-je-suis-ko": g("sway", "full", 1.1, blue),
  "mood2-bye-bye": g("run", "full", 1.15, pink),
  "mood2-je-vais-taper": g("lunge", "full", 1.5, red),
  "mood2-tu-parles-trop": g("ring", "head", 1.15, orange, [50, 35]),
  "mood2-oh-mon-dieu": g("lunge", "full", 1.45, orange),
  "mood2-je-te-vois": g("pop", "head", 1.2, gold, [50, 30]),
  "mood2-argent-dabord": g("pulse", "full", 1.2, green),
  "mood2-degage": g("lunge", "full", 1.45, red),
  "mood2-cest-bon-hein": g("pulse", "full", 1.18, orange),
  "mood2-trop-mange": g("sway", "full", 1.08, blue),
  "mood2-wesh": g("pop", "head", 1.2, gold, [50, 30]),
  "mood2-ecoutez-moi-bien": g("ring", "full", 1.2, gold),
  "mood2-je-ne-sais-pas": g("shake", "head", 1.12, blue),
};

const fallback: StickerGesture = g("pop", "text", 1.25, gold);

export function gestureFor(id: string): StickerGesture {
  return table[id] ?? fallback;
}
