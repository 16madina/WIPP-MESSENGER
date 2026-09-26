import type { CSSProperties } from "react";
import { motion as timings } from "@/theme/theme";

/**
 * Prototype de geste interne : le même PNG est empilé trois fois. La base reste stable,
 * la main et le texte sont isolés par clip-path puis amplifiés ; l'impact rouge est une couche à part.
 */
export function StopGesture({ src, label, ms = timings.stickerGestureMs }: { src: string; label: string; ms?: number }) {
  const style = { "--gst-ms": `${ms}ms` } as CSSProperties;
  const layer = "pointer-events-none absolute inset-0 h-full w-full object-contain";
  return (
    <span className="relative block h-full w-full" style={style}>
      <img src={src} alt={label} draggable={false} className={`${layer} gst-base`} />
      <img src={src} alt="" aria-hidden draggable={false} className={`${layer} gst-text`} />
      <img src={src} alt="" aria-hidden draggable={false} className={`${layer} gst-hand`} />
      <span aria-hidden className="gst-flash pointer-events-none absolute" />
    </span>
  );
}
