import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Aperçu de lien : lit uniquement les balises titre/description/image d'une
 * page publique. Protections : http(s) seulement, pas d'adresses locales ou
 * privées, délai court, lecture limitée à 300 Ko.
 */
const PRIVATE_HOST =
  /^(localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?|\[?f[cd][0-9a-f]{2}:|metadata\.google\.internal)/i;

function pick(html: string, ...names: string[]) {
  for (const n of names) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${n}["'][^>]*content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${n}["']`,
      "i",
    );
    const m = re.exec(html);
    const v = m?.[1] ?? m?.[2];
    if (v) return decode(v).trim();
  }
  return undefined;
}

function decode(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export const unfurlLink = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ url: z.string().url().max(2000) }).parse(d))
  .handler(async ({ data }) => {
    const url = new URL(data.url);
    if (!/^https?:$/.test(url.protocol) || PRIVATE_HOST.test(url.hostname) || /^\d+$/.test(url.hostname)) {
      return { ok: false as const };
    }
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(url.toString(), {
        signal: ctrl.signal,
        redirect: "follow",
        headers: { "user-agent": "WIPPLinkPreview/1.0", accept: "text/html" },
      });
      clearTimeout(timer);
      if (!res.ok || !(res.headers.get("content-type") ?? "").includes("text/html") || !res.body) return { ok: false as const };
      const reader = res.body.getReader();
      let html = "";
      const dec = new TextDecoder();
      while (html.length < 300_000) {
        const { done, value } = await reader.read();
        if (done) break;
        html += dec.decode(value, { stream: true });
        if (/<\/head>/i.test(html)) break;
      }
      void reader.cancel().catch(() => {});
      const title = pick(html, "og:title", "twitter:title") ?? /<title[^>]*>([^<]{1,300})<\/title>/i.exec(html)?.[1]?.trim();
      const description = pick(html, "og:description", "twitter:description", "description");
      let image = pick(html, "og:image", "twitter:image");
      if (image) {
        try {
          image = new URL(image, url).toString();
          if (!image.startsWith("https://")) image = undefined;
        } catch {
          image = undefined;
        }
      }
      return {
        ok: true as const,
        card: {
          url: url.toString(),
          title: title ? decode(title).slice(0, 160) : undefined,
          description: description?.slice(0, 220),
          image,
        },
      };
    } catch {
      return { ok: false as const };
    }
  });
