import { useEffect, useState } from "react";
import type { Message } from "@/lib/types";

type Card = NonNullable<Message["linkCard"]>;
const cache = new Map<string, Card | null>();
const URL_RE = /https?:\/\/[^\s<>"']+/i;

export function firstUrl(text?: string) {
  const m = text ? URL_RE.exec(text) : null;
  return m ? m[0].replace(/[),.;!?]+$/, "") : undefined;
}

/** Aperçu de lien calculé sur l'appareil qui affiche le message. */
export function useLinkPreview(text?: string, preset?: Card) {
  const url = preset ? undefined : firstUrl(text);
  const [card, setCard] = useState<Card | undefined>(preset ?? (url ? (cache.get(url) ?? undefined) : undefined));
  useEffect(() => {
    if (!url || cache.has(url)) {
      if (url) setCard(cache.get(url) ?? undefined);
      return;
    }
    let alive = true;
    void import("@/lib/links.functions")
      .then(({ unfurlLink }) => unfurlLink({ data: { url } }))
      .then((res) => {
        const c = res.ok && (res.card.title || res.card.description) ? res.card : null;
        cache.set(url, c);
        if (alive) setCard(c ?? undefined);
      })
      .catch(() => cache.set(url, null));
    return () => {
      alive = false;
    };
  }, [url]);
  return card;
}
