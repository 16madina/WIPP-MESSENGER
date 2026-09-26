import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { STICKER_FX_EVENT, type StickerFx } from "@/lib/sticker-fx";
import { haptic } from "@/lib/haptics";
import { motion as timings } from "@/theme/theme";

type Burst = { fx: StickerFx; key: number };

/** Effets des stickers en couches séparées, repris du dépôt : cœurs et confettis
    qui montent, halos, couronne, notes… et les WIPP Moments plein écran. */
export function StickerFxLayer() {
  const [bursts, setBursts] = useState<Burst[]>([]);

  useEffect(() => {
    const onFx = (e: Event) => {
      const fx = (e as CustomEvent<StickerFx>).detail;
      if (!fx) return;
      if (fx === "shake") {
        document.documentElement.classList.remove("cast-chat-shake");
        void document.documentElement.offsetWidth;
        document.documentElement.classList.add("cast-chat-shake");
        haptic("warning");
        return;
      }
      const isMoment = fx.startsWith("moment-");
      if (isMoment) haptic("success");
      const key = Date.now() + Math.random();
      setBursts((b) => [...b, { fx, key }]);
      const ms = isMoment ? timings.stickerMomentMs : timings.stickerFxMs;
      window.setTimeout(() => setBursts((b) => b.filter((x) => x.key !== key)), ms);
    };
    window.addEventListener(STICKER_FX_EVENT, onFx);
    return () => window.removeEventListener(STICKER_FX_EVENT, onFx);
  }, []);

  if (typeof document === "undefined" || bursts.length === 0) return null;
  return createPortal(
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[110] overflow-hidden">
      {bursts.map((b) => {
        if (b.fx === "hearts") {
          return (
            <div key={b.key} className="absolute inset-0">
              {Array.from({ length: 7 }).map((_, i) => (
                <span key={i} className="cast-heart" style={{ left: `${12 + ((i * 13) % 76)}%`, animationDelay: `${i * 110}ms` }}>♥</span>
              ))}
            </div>
          );
        }
        if (b.fx === "confetti") {
          return (
            <div key={b.key} className="absolute inset-0">
              {Array.from({ length: 16 }).map((_, i) => (
                <span key={i} className="cast-bit" style={{ left: `${(i * 23) % 100}%`, bottom: "12%", animationDelay: `${(i % 6) * 90}ms` }} />
              ))}
            </div>
          );
        }
        const isMoment = b.fx.startsWith("moment-");
        const cls = isMoment
          ? b.fx === "moment-alert" ? "cast-fx-moment-alert"
          : b.fx === "moment-wipp" ? "cast-fx-moment-wipp"
          : b.fx === "moment-love" ? "cast-fx-heartwave"
          : "cast-fx-rays" // moment-bravo
          : `cast-fx-${b.fx}`;
        return (
          <div
            key={b.key}
            className={`absolute ${isMoment ? "inset-0" : "inset-x-0 bottom-[15%] top-[15%]"} ${cls}`}
            style={isMoment ? { animationDuration: `${timings.stickerMomentMs}ms` } : undefined}
          />
        );
      })}
    </div>,
    document.body,
  );
}
