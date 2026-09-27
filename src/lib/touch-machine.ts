/**
 * Machine à états WIPP Touch (unique source de vérité, indépendante de l'écran).
 * Le téléphone B n'a pas besoin d'être sur l'écran Touch : la demande lui arrive
 * par le canal de notification/serveur (natif + BACKEND), pas par cet écran.
 */
import type { PublicCard, TouchState } from "@/lib/providers";

export type TouchEvent =
  | { type: "START" }
  | { type: "FOUND"; cards: PublicCard[] }
  | { type: "PICK"; card: PublicCard }
  | { type: "CONNECT" }
  | { type: "SENT" }
  | { type: "ACCEPTED" }
  | { type: "DECLINED" }
  | { type: "EXPIRED" }
  | { type: "FAIL"; reason?: string }
  | { type: "RESET" };

export type TouchCtx = { state: TouchState; cards: PublicCard[]; peer: PublicCard | null; reason?: string };

export const initialTouch: TouchCtx = { state: "ready", cards: [], peer: null };

export function touchReducer(c: TouchCtx, e: TouchEvent): TouchCtx {
  switch (e.type) {
    case "RESET":
      return initialTouch;
    case "START":
      return c.state === "ready" || isEnd(c.state) ? { ...initialTouch, state: "searching" } : c;
    case "FOUND":
      if (c.state !== "searching") return c;
      if (e.cards.length === 0) return { ...c, state: "failed", reason: "none" };
      if (e.cards.length > 1) return { ...c, state: "multiple_devices", cards: e.cards };
      return { ...c, state: "detected", peer: e.cards[0], cards: e.cards };
    case "PICK":
      return c.state === "multiple_devices" ? { ...c, state: "detected", peer: e.card } : c;
    case "CONNECT":
      return c.state === "detected" ? { ...c, state: "confirming" } : c;
    case "SENT":
      return c.state === "confirming" ? { ...c, state: "request_sent" } : c;
    case "ACCEPTED":
      return c.state === "request_sent" ? { ...c, state: "accepted" } : c;
    case "DECLINED":
      return c.state === "request_sent" ? { ...c, state: "declined" } : c;
    case "EXPIRED":
      return c.state === "request_sent" || c.state === "detected" ? { ...c, state: "expired" } : c;
    case "FAIL":
      return { ...c, state: "failed", reason: e.reason ?? "error" };
  }
}

export function isEnd(s: TouchState) {
  return s === "accepted" || s === "declined" || s === "expired" || s === "failed";
}

/** Délai de réponse de B avant expiration de la demande. */
export const TOUCH_REQUEST_TTL_MS = 60_000;
