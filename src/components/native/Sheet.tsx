import { AnimatePresence, animate, motion, useMotionValue, type PanInfo } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion as m } from "@/theme/theme";
import { haptic } from "@/lib/haptics";
import { useOverlay } from "./Overlay";

export type Detent = "half" | "full";

/** Feuille modale iOS : deux hauteurs (moitié / plein écran) avec accroche en spring. */
export function Sheet({ open, onClose, children, detent = "half" }: { open: boolean; onClose: () => void; children: ReactNode; detent?: Detent }) {
  const { setSheetOpen } = useOverlay();
  useEffect(() => {
    setSheetOpen(open);
  }, [open, setSheetOpen]);
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]">
          <motion.div key="bd" className="absolute inset-0 bg-wipp-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <SheetPanel key="sheet" onClose={onClose} initial={detent}>
            {children}
          </SheetPanel>
        </div>
      )}
    </AnimatePresence>, document.body
  );
}

function SheetPanel({ onClose, initial, children }: { onClose: () => void; initial: Detent; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const y = useMotionValue(2000);
  const current = useRef<Detent>(initial);
  const offsetFor = (d: Detent) => {
    const H = ref.current?.offsetHeight ?? 0;
    return d === "full" ? 0 : H * (1 - m.sheetHalfRatio);
  };
  useLayoutEffect(() => {
    y.set(ref.current?.offsetHeight ?? 800);
    animate(y, offsetFor(initial), m.sheet);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (current.current !== initial) {
      current.current = initial;
      animate(y, offsetFor(initial), m.sheet);
    }
  }, [initial, y]);

  const onDragEnd = (_: unknown, i: PanInfo) => {
    const H = ref.current?.offsetHeight ?? 0;
    const half = offsetFor("half");
    const projected = y.get() + i.velocity.y * 0.18;
    if (projected > half + (H - half) * 0.4) {
      onClose();
      return;
    }
    const next: Detent = projected < half / 2 ? "full" : "half";
    if (next !== current.current) haptic("light");
    current.current = next;
    animate(y, offsetFor(next), { ...m.sheet, velocity: i.velocity.y });
  };

  return (
    <motion.div
      ref={ref}
      className="absolute inset-x-0 bottom-0 z-50 rounded-t-[12px] border-t border-wipp-glass-border bg-wipp-elevated"
      style={{ y, top: "calc(env(safe-area-inset-top) + 44px)", paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)" }}
      exit={{ y: "100%" }}
      transition={m.sheet}
      drag="y"
      dragMomentum={false}
      dragConstraints={{ top: 0, bottom: 2000 }}
      dragElastic={{ top: 0.12, bottom: 0 }}
      onDragEnd={onDragEnd}
    >
      <div className="mx-auto mb-3 mt-2 h-[5px] w-9 rounded-full bg-wipp-muted/40" />
      {children}
    </motion.div>
  );
}
