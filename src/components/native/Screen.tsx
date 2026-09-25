import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { useRef, useState, type ReactNode } from "react";
import { NavBar, LargeTitle } from "./NavHeader";
import { ActivityIndicator } from "./ActivityIndicator";
import { useElastic, useTabReselect } from "./useElastic";
import { motion as m } from "@/theme/theme";
import { haptic } from "@/lib/haptics";

type Props = {
  title: string;
  large?: boolean;
  onBack?: (() => void) | undefined;
  right?: ReactNode | undefined;
  bottomInset?: boolean;
  children: ReactNode;
  footer?: ReactNode | undefined;
  tabKey?: string;
  onRefresh?: () => Promise<void>;
  onPullReveal?: () => void;
  onScrollTop?: (y: number) => void;
};

/** Écran défilant natif : grand titre, élastique, tirer pour rafraîchir, retour en haut via l'onglet. */
export function Screen({ title, large = true, onBack, right, bottomInset = true, children, footer, tabKey, onRefresh, onPullReveal, onScrollTop }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: ref });
  const [refreshing, setRefreshing] = useState(false);
  const { y, settle } = useElastic(ref, {
    onRelease: (pull) => {
      if (onRefresh && pull >= m.pullRefreshThreshold && !refreshing) {
        haptic("medium");
        setRefreshing(true);
        onPullReveal?.();
        void onRefresh().finally(() => {
          setRefreshing(false);
          settle();
        });
        return m.refreshHold;
      }
      if (pull >= m.pullRevealThreshold) onPullReveal?.();
      return undefined;
    },
  });
  useTabReselect(tabKey, ref);
  useMotionValueEvent(scrollY, "change", (v) => onScrollTop?.(v));
  const progress = useTransform(y, [10, m.pullRefreshThreshold], [0, 1]);

  return (
    <div className="flex h-full flex-col bg-wipp-bg">
      <div ref={ref} className="no-scrollbar relative flex-1 overflow-y-auto">
        <NavBar title={title} scrollY={scrollY} large={large} onBack={onBack} right={right} />
        <motion.div style={{ y }} className="relative">
          {onRefresh && (
            <motion.div style={{ opacity: progress }} className="absolute inset-x-0 -top-12 flex h-12 items-center justify-center">
              <ActivityIndicator spinning={refreshing} progress={progress} />
            </motion.div>
          )}
          {large && <LargeTitle title={title} scrollY={scrollY} pull={y} />}
          <div style={{ paddingBottom: bottomInset ? "calc(var(--tabbar-space) + env(safe-area-inset-bottom))" : 16 }}>{children}</div>
        </motion.div>
      </div>
      {footer}
    </div>
  );
}
