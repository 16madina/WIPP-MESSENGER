import { motion, useTransform, type MotionValue } from "framer-motion";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { Pressable } from "./Pressable";

type Props = {
  title: string;
  scrollY: MotionValue<number>;
  large?: boolean;
  onBack?: (() => void) | undefined;
  right?: ReactNode | undefined;
};

/** En-tête à grand titre qui se réduit en titre compact au défilement. */
export function NavHeader({ title, scrollY, large = true, onBack, right }: Props) {
  const compactOpacity = useTransform(scrollY, large ? [30, 50] : [0, 1], [0, 1]);
  const barBg = useTransform(scrollY, [0, 20], [0, 1]);
  const largeScale = useTransform(scrollY, [-120, 0], [1.12, 1]);
  const largeOpacity = useTransform(scrollY, [0, 40], [1, 0]);

  return (
    <>
      <div className="sticky top-0 z-20" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <motion.div
          style={{ opacity: large ? barBg : 1 }}
          className="glass absolute inset-0 border-b border-wipp-sep"
        />
        <div className="relative flex h-11 items-center justify-between px-2">
          <div className="flex min-w-16 items-center">
            {onBack && (
              <Pressable onClick={onBack} className="flex items-center text-wipp-accent" aria-label="Retour">
                <ChevronLeft size={28} strokeWidth={2.4} />
              </Pressable>
            )}
          </div>
          <motion.span
            style={{ opacity: large ? compactOpacity : 1 }}
            className="font-display text-[17px] font-semibold text-wipp-fg"
          >
            {title}
          </motion.span>
          <div className="flex min-w-16 justify-end gap-1 pr-2">{right}</div>
        </div>
      </div>
      {large && (
        <motion.h1
          style={{ scale: largeScale, opacity: largeOpacity, originX: 0 }}
          className="px-4 pb-2 pt-1 font-display text-[34px] font-bold tracking-tight text-wipp-fg"
        >
          {title}
        </motion.h1>
      )}
    </>
  );
}
