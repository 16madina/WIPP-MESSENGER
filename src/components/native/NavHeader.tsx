import { motion, useTransform, type MotionValue } from "framer-motion";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { Pressable } from "./Pressable";

type BarProps = {
  title: ReactNode;
  scrollY: MotionValue<number>;
  large?: boolean;
  onBack?: (() => void) | undefined;
  right?: ReactNode | undefined;
};

/** Barre de navigation compacte (titre 17 semibold) : apparaît quand le grand titre disparaît. */
export function NavBar({ title, scrollY, large = true, onBack, right }: BarProps) {
  const compactOpacity = useTransform(scrollY, [30, 50], [0, 1]);
  const barBg = useTransform(scrollY, [0, 20], [0, 1]);
  return (
    <div className="sticky top-0 z-20" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <motion.div style={{ opacity: large ? barBg : 1 }} className="glass absolute inset-0 border-b border-wipp-sep" />
      <div className="relative flex h-11 items-center justify-between px-1">
        <div className="flex min-w-16 items-center">
          {onBack && (
            <Pressable onClick={onBack} className="flex items-center text-wipp-accent" aria-label="Retour">
              <ChevronLeft size={30} strokeWidth={2.4} />
            </Pressable>
          )}
        </div>
        <motion.div style={{ opacity: large ? compactOpacity : 1 }} className="type-nav text-wipp-fg">
          {title}
        </motion.div>
        <div className="flex min-w-16 justify-end pr-1">{right}</div>
      </div>
    </div>
  );
}

/** Grand titre iOS (34 bold) qui grossit légèrement quand on tire. */
export function LargeTitle({ title, scrollY, pull }: { title: string; scrollY: MotionValue<number>; pull: MotionValue<number> }) {
  const scale = useTransform(pull, [0, 140], [1, 1.08]);
  const opacity = useTransform(scrollY, [0, 40], [1, 0]);
  return (
    <motion.h1 style={{ scale, opacity, originX: 0 }} className="px-4 pb-2 font-display type-large-title text-wipp-fg">
      {title}
    </motion.h1>
  );
}
