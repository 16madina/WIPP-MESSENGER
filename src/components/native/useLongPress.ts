import { useRef, type MouseEvent, type PointerEvent } from "react";
import { motion } from "@/theme/theme";
import { haptic } from "@/lib/haptics";

/** Appui long natif : déclenche après motion.longPressMs sans mouvement, bloque le clic qui suit. */
export function useLongPress(onLong: (el: HTMLElement) => void) {
  const timer = useRef<number | undefined>(undefined);
  const start = useRef({ x: 0, y: 0 });
  const fired = useRef(false);
  const clear = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = undefined;
  };
  return {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      fired.current = false;
      start.current = { x: e.clientX, y: e.clientY };
      const el = e.currentTarget;
      clear();
      timer.current = window.setTimeout(() => {
        fired.current = true;
        haptic("medium");
        onLong(el);
      }, motion.longPressMs);
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 8) clear();
    },
    onPointerUp: clear,
    onPointerCancel: clear,
    onPointerLeave: clear,
    onContextMenu: (e: MouseEvent) => e.preventDefault(),
    onClickCapture: (e: MouseEvent) => {
      if (fired.current) {
        e.preventDefault();
        e.stopPropagation();
        fired.current = false;
      }
    },
  };
}
