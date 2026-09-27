/**
 * Terminologie officielle WIPP :
 * - Wippmoji  = emoji WIPP
 * - Wippie    = personnage WIPP
 * - WippPop   = animation qui sort de son emplacement et traverse le chat (à venir)
 * - WIPP Moment = Surprise / cadeau interactif
 *
 * Ce module expose un modèle unique pour tout élément du panneau Stickers,
 * et le point de déclenchement WippPop (aucune animation livrée pour l’instant).
 */
import { WIPP_STICKERS, type StickerDef } from "./stickers";

export type WippCategory = "wippmoji" | "wippie" | "sticker";

export type WippItem = {
  id: string;
  name: string;
  category: WippCategory;
  staticAsset: string;
  animatedAsset?: string;
  /** Asset WippPop optionnel : ajouté plus tard, pack par pack. */
  wippPopAsset?: string;
};

/** Assets WippPop enregistrés (vide pour l’instant). */
const WIPP_POP_ASSETS: Record<string, string> = {};

function categoryOf(s: StickerDef): WippCategory {
  if (s.pack === "moji" || s.pack === "general") return "wippmoji";
  if (s.pack === "elle" || s.pack === "lui" || s.pack === "fun" || s.pack === "fun2") return "wippie";
  return "sticker";
}

export function toWippItem(s: StickerDef): WippItem {
  return {
    id: s.id,
    name: s.labelFr,
    category: categoryOf(s),
    staticAsset: s.src,
    animatedAsset: s.anim,
    wippPopAsset: WIPP_POP_ASSETS[s.id],
  };
}

export const WIPP_ITEMS: WippItem[] = WIPP_STICKERS.map(toWippItem);

export function wippItemById(id?: string): WippItem | undefined {
  return id ? WIPP_ITEMS.find((i) => i.id === id) : undefined;
}

export type WippPopEvent = { item: WippItem; messageId: string; trigger: "send" | "arrive" | "tap" };

const WIPP_POP_EVENT = "wipp:pop";

/** Point de déclenchement WippPop. Ne fait rien tant qu’aucun asset n’existe. */
export function triggerWippPop(itemId: string | undefined, messageId: string, trigger: WippPopEvent["trigger"]) {
  const item = wippItemById(itemId);
  if (!item?.wippPopAsset || typeof window === "undefined") return false;
  window.dispatchEvent(new CustomEvent<WippPopEvent>(WIPP_POP_EVENT, { detail: { item, messageId, trigger } }));
  return true;
}

export function onWippPop(listener: (e: WippPopEvent) => void) {
  const handler = (e: Event) => listener((e as CustomEvent<WippPopEvent>).detail);
  window.addEventListener(WIPP_POP_EVENT, handler);
  return () => window.removeEventListener(WIPP_POP_EVENT, handler);
}
