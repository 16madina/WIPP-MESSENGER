import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { findImageSticker } from "@/lib/stickers";
import { STICKER_FX_EVENT, type StickerFx, type StickerFxDetail } from "@/lib/sticker-fx";
import { haptic } from "@/lib/haptics";
import { motion as timings } from "@/theme/theme";

const glyph: Record<StickerFx, string[]> = {
  hearts: ["♥", "💛", "♥", "❤️"], confetti: ["🎉", "✦", "🎊", "★"], crown: ["👑"], zzz: ["Z", "z", "Z"],
  sparkle: ["✦", "✧", "✦"], tears: ["💧", "💧"], rings: ["◯"], sun: ["☀"], shake: [], none: [],
};

type Burst = StickerFxDetail & { key: number };

/** Couches d'effets hors du PNG : débordent dans le chat (effect) ou prennent tout l'écran (moment). */
export function StickerFxLayer() {
  const [bursts, setBursts] = useState<Burst[]>([]);

  useEffect(() => {
    const onFx = (e: Event) => {
      const detail = (e as CustomEvent<StickerFxDetail>).detail;
      if (detail.level === "sticker" || detail.fx === "none") {
        if (detail.level !== "moment") return;
      }
      const key = Date.now() + Math.random();
      if (detail.fx === "shake") {
        document.documentElement.classList.remove("fx-shake");
        void document.documentElement.offsetWidth;
        document.documentElement.classList.add("fx-shake");
        haptic("warning");
      }
      if (detail.level === "moment") haptic("success");
      setBursts((b) => [...b, { ...detail, key }]);
      const ms = detail.level === "moment" ? timings.stickerMomentMs : timings.stickerFxMs;
      window.setTimeout(() => setBursts((b) => b.filter((x) => x.key !== key)), ms);
    };
    window.addEventListener(STICKER_FX_EVENT, onFx);
    return () => window.removeEventListener(STICKER_FX_EVENT, onFx);
  }, []);

  if (typeof document === "undefined" || bursts.length === 0) return null;
  return createPortal(
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[110] overflow-hidden">
      {bursts.map((b) => {
        const chars = glyph[b.fx].length ? glyph[b.fx] : ["✦"];
        const count = b.level === "moment" ? 26 : b.fx === "crown" ? 1 : 14;
        const sticker = b.level === "moment" ? findImageSticker(b.stickerId) : undefined;
        return (
          <div key={b.key} className={b.level === "moment" ? "fx-moment absolute inset-0" : "absolute inset-0"} style={{ animationDuration: `${timings.stickerMomentMs}ms` }}>
            {sticker && (
              <img src={sticker.image} alt="" className={`cast-go cast-${sticker.motion} absolute left-1/2 top-1/2 h-[min(70vw,360px)] w-[min(70vw,360px)] -translate-x-1/2 -translate-y-1/2 object-contain`} style={{ animationDuration: `${timings.stickerCastMs}ms` }} />
            )}
            {Array.from({ length: count }).map((_, i) => (
              <span
                key={i}
                className={`fx-particle fx-${b.fx === "crown" ? "crown" : b.fx === "confetti" ? "fall" : "rise"} absolute type-title1 text-wipp-accent`}
                style={{
                  left: b.fx === "crown" ? "50%" : `${(i * 37) % 100}%`,
                  top: b.fx === "confetti" || b.fx === "crown" ? "-8%" : "auto",
                  bottom: b.fx === "confetti" || b.fx === "crown" ? "auto" : "10%",
                  animationDelay: `${(i % 7) * 90}ms`,
                  animationDuration: `${timings.stickerFxMs}ms`,
                }}
              >
                {chars[i % chars.length]}
              </span>
            ))}
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
