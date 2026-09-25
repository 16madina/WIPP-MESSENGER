import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import type { ReactNode } from "react";
import { motion as m } from "@/theme/theme";

/** Feuille modale montant du bas en spring, fermeture par glissement vers le bas. */
export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const onDragEnd = (_: unknown, i: PanInfo) => {
    if (i.offset.y > 120 || i.velocity.y > 600) onClose();
  };
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="bd"
            className="absolute inset-0 z-50 bg-wipp-bg/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            className="absolute inset-x-0 bottom-0 z-50 rounded-t-[28px] border-t border-wipp-glass-border bg-wipp-elevated"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={m.sheet}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 1 }}
            onDragEnd={onDragEnd}
          >
            <div className="mx-auto mb-3 mt-2.5 h-1.5 w-10 rounded-full bg-wipp-muted/40" />
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
