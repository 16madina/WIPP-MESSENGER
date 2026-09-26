import type { CSSProperties } from "react";
import { gestureClip, gestureFor, gestureOrigin } from "@/lib/sticker-gestures";
import { motion as timings } from "@/theme/theme";

/**
 * Moteur commun des gestes, même structure que « Stop ! » : le même PNG est empilé.
 * La base reste stable, la partie isolée par clip-path (texte, tête, haut ou image entière)
 * est amplifiée selon le geste du sticker, et l'éclair coloré est une couche à part.
 */
export function GestureSticker({ id, src, label, ms = timings.stickerGestureMs }: { id: string; src: string; label: string; ms?: number }) {
  const gesture = gestureFor(id);
  const style = {
    "--gst-ms": `${ms}ms`,
    "--gj-peak": gesture.peak,
    "--gj-color": gesture.color,
    "--gj-move": `gj-${gesture.move}`,
  } as CSSProperties;
  const layer = "pointer-events-none absolute inset-0 h-full w-full object-contain";
  return (
    <span className="relative block h-full w-full" style={style}>
      <img src={src} alt={label} draggable={false} className={`${layer} gj-base`} />
      <img
        src={src}
        alt=""
        aria-hidden
        draggable={false}
        className={`${layer} gj-part`}
        style={{ clipPath: gestureClip(gesture.part), transformOrigin: gestureOrigin(gesture.part) }}
      />
      <span aria-hidden className="gj-flash pointer-events-none absolute" style={{ left: `${gesture.flashAt[0]}%`, top: `${gesture.flashAt[1]}%` }} />
    </span>
  );
}
