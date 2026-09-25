import { animate, motion, useMotionValue, useMotionValueEvent, useTransform, type PanInfo } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { layout, motion as m } from "@/theme/theme";
import { haptic } from "@/lib/haptics";

export type SwipeAction = { key: string; label: string; icon: LucideIcon; bg: string; onPress: () => void };

/**
 * Ligne balayable iOS. leading = balayage vers la droite (1re = principale),
 * trailing = balayage vers la gauche (dernière = principale). Balayage complet = action principale.
 */
export function SwipeRow({ leading, trailing, children }: { leading: SwipeAction[]; trailing: SwipeAction[]; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const W = layout.swipeActionWidth;
  const lw = leading.length * W;
  const tw = trailing.length * W;
  const [side, setSide] = useState<"none" | "left" | "right">("none");
  const armed = useRef(false);

  const width = () => ref.current?.offsetWidth ?? 390;
  useMotionValueEvent(x, "change", (v) => {
    setSide(v > 1 ? "left" : v < -1 ? "right" : "none");
    const full = Math.abs(v) > width() * m.swipeFullRatio;
    if (full !== armed.current) {
      armed.current = full;
      if (full) haptic("medium");
    }
  });

  const leadOpacity = useTransform(x, [0, 1], [0, 1]);
  const trailOpacity = useTransform(x, [-1, 0], [1, 0]);
  const leadScale = useTransform(x, [0, lw], [0.4, 1]);
  const trailScale = useTransform(x, [-tw, 0], [1, 0.4]);
  const othersL = useTransform(x, [width() * m.swipeFullRatio - 20, width() * m.swipeFullRatio], [1, 0]);
  const othersT = useTransform(x, [-width() * m.swipeFullRatio, -width() * m.swipeFullRatio + 20], [0, 1]);

  const close = () => animate(x, 0, m.swipe);
  const run = (a: SwipeAction, dismiss = false) => {
    haptic("light");
    if (dismiss) animate(x, x.get() < 0 ? -width() : width(), m.swipe).then(() => { a.onPress(); x.set(0); });
    else { close(); a.onPress(); }
  };

  const onDragEnd = (_: unknown, i: PanInfo) => {
    const v = x.get();
    const full = width() * m.swipeFullRatio;
    if (v < -full && trailing.length) return run(trailing[trailing.length - 1]!, true);
    if (v > full && leading.length) return run(leading[0]!);
    if (trailing.length && (v < -m.swipeOpenThreshold || i.velocity.x < -500) && v < 0) return animate(x, -tw, m.swipe);
    if (leading.length && (v > m.swipeOpenThreshold || i.velocity.x > 500) && v > 0) return animate(x, lw, m.swipe);
    close();
  };

  const renderAction = (a: SwipeAction, scale: typeof leadScale, dim: typeof othersL | null) => (
    <button key={a.key} type="button" onClick={() => run(a)} className="flex h-full flex-col items-center justify-center gap-1 text-wipp-knob" style={{ width: W }}>
      <motion.span style={{ scale, opacity: dim ?? 1 }} className="flex flex-col items-center gap-1">
        <a.icon size={22} />
        <span className="type-caption2 font-medium">{a.label}</span>
      </motion.span>
    </button>
  );

  return (
    <div ref={ref} className="relative overflow-hidden">
      {leading.length > 0 && (
        <motion.div style={{ opacity: leadOpacity }} className={`absolute inset-0 flex ${leading[0]!.bg} ${side === "left" ? "" : "pointer-events-none"}`}>
          {leading.map((a, i) => (
            <div key={a.key} className={`${a.bg} h-full`}>{renderAction(a, leadScale, i === 0 ? null : othersL)}</div>
          ))}
        </motion.div>
      )}
      {trailing.length > 0 && (
        <motion.div style={{ opacity: trailOpacity }} className={`absolute inset-0 flex justify-end ${trailing[trailing.length - 1]!.bg} ${side === "right" ? "" : "pointer-events-none"}`}>
          {trailing.map((a, i) => (
            <div key={a.key} className={`${a.bg} h-full`}>{renderAction(a, trailScale, i === trailing.length - 1 ? null : othersT)}</div>
          ))}
        </motion.div>
      )}
      <motion.div
        style={{ x }}
        drag="x"
        dragDirectionLock
        dragMomentum={false}
        dragElastic={0.9}
        dragConstraints={{ left: trailing.length ? -width() : 0, right: leading.length ? width() : 0 }}
        onDragEnd={onDragEnd}
        onClickCapture={(e) => {
          if (Math.abs(x.get()) > 2) {
            e.stopPropagation();
            e.preventDefault();
            close();
          }
        }}
        className="relative bg-wipp-bg"
      >
        {children}
      </motion.div>
    </div>
  );
}
