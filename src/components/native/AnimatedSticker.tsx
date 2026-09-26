import { motion, useReducedMotion } from "framer-motion";
import { findElleSticker } from "@/lib/stickers";
import { motion as timings } from "@/theme/theme";

const gestures: Record<string, { rotate?: number[]; scale?: number[]; x?: number[]; y?: number[] }> = {
  wink: { rotate: [0, -4, 2, 0], scale: [0.85, 1.05, 1, 1] },
  bounce: { y: [22, -12, 4, 0], scale: [0.75, 1.12, 0.95, 1] },
  heart: { scale: [0.8, 1.1, 0.96, 1.06, 1] },
  laugh: { rotate: [0, -5, 5, -4, 2, 0], y: [12, 0, -7, 0, -4, 0] },
  ponder: { rotate: [0, -5, 4, 0], x: [0, -3, 3, 0] },
  shock: { scale: [0.65, 1.18, 0.94, 1], y: [18, -7, 3, 0] },
  pop: { scale: [0.65, 1.15, 0.95, 1] },
  wave: { rotate: [-5, 5, -4, 3, 0], x: [-18, 5, 0, 0, 0] },
  sleep: { rotate: [0, -4, -4, 0], y: [0, 6, 6, 0] },
  morning: { y: [12, -7, 0], scale: [0.9, 1.04, 1] },
  ring: { rotate: [0, -8, 8, -8, 8, 0] },
  kiss: { scale: [0.75, 1.14, 0.98, 1] },
  applause: { rotate: [-5, 5, -5, 5, 0], scale: [0.85, 1.06, 1, 1, 1] },
  shrug: { y: [0, -8, 0], rotate: [0, 4, 0] },
  bump: { x: [-16, 7, 0], scale: [0.8, 1.14, 1] },
};

/** Une image découpée reste intacte ; les mouvements et les éclats sont superposés sans déformer le dessin. */
export function AnimatedSticker({ id, size = "message" }: { id: string; size?: "picker" | "message" }) {
  const sticker = findElleSticker(id);
  const reduced = useReducedMotion();
  if (!sticker) return null;
  const isPicker = size === "picker";
  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center ${isPicker ? "h-[100px] w-full" : "h-[180px] w-[180px]"}`}>
      <motion.img src={sticker.image} alt={sticker.label} draggable={false} className="relative z-10 h-full w-full object-contain" initial={reduced ? false : { opacity: 0, scale: 0.85 }} animate={reduced ? { opacity: 1, scale: 1 } : { ...gestures[sticker.motion], opacity: 1 }} transition={{ duration: isPicker ? timings.stickerPickerSeconds : timings.stickerMessageSeconds, times: undefined, ease: "easeInOut" }} />
      {!reduced && <motion.span aria-hidden="true" className="pointer-events-none absolute right-1 top-1 z-20 type-title2 font-bold text-wipp-accent" initial={{ opacity: 0, y: 8, scale: 0.4 }} animate={{ opacity: [0, 1, 0], y: [8, -12, -34], scale: [0.4, 1.15, 0.6] }} transition={{ delay: isPicker ? 0.15 : 0.4, duration: timings.stickerAccentSeconds }}>{sticker.accent}</motion.span>}
    </span>
  );
}