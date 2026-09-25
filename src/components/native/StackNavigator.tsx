import { AnimatePresence, motion, useDragControls, type PanInfo } from "framer-motion";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { layout, motion as m } from "@/theme/theme";

type Page = { id: number; node: ReactNode };
type Nav = { push: (node: ReactNode) => void; pop: () => void; depth: number };

const NavCtx = createContext<Nav | null>(null);
export const useStack = () => {
  const c = useContext(NavCtx);
  if (!c) throw new Error("useStack hors StackNavigator");
  return c;
};

let seq = 0;

/** Pile de navigation native : push/pop en spring et retour par balayage depuis le bord gauche. */
export function StackNavigator({ root }: { root: ReactNode }) {
  const [pages, setPages] = useState<Page[]>([]);
  const push = useCallback((node: ReactNode) => setPages((p) => [...p, { id: ++seq, node }]), []);
  const pop = useCallback(() => setPages((p) => p.slice(0, -1)), []);

  return (
    <NavCtx.Provider value={{ push, pop, depth: pages.length }}>
      <div className="relative h-full w-full overflow-hidden">
        <motion.div
          className="absolute inset-0"
          animate={{ x: pages.length ? "-28%" : 0, filter: pages.length ? "brightness(0.7)" : "brightness(1)" }}
          transition={m.push}
        >
          {root}
        </motion.div>
        <AnimatePresence initial={false}>
          {pages.map((p, i) => (
            <StackPage key={p.id} top={i === pages.length - 1} covered={i < pages.length - 1} onPop={pop}>
              {p.node}
            </StackPage>
          ))}
        </AnimatePresence>
      </div>
    </NavCtx.Provider>
  );
}

function StackPage({ children, top, covered, onPop }: { children: ReactNode; top: boolean; covered: boolean; onPop: () => void }) {
  const controls = useDragControls();
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > m.swipeBackThreshold || info.velocity.x > m.swipeBackVelocity) onPop();
  };
  return (
    <motion.div
      className="absolute inset-0 z-40 bg-wipp-bg shadow-2xl"
      initial={{ x: "100%" }}
      animate={{ x: covered ? "-28%" : 0 }}
      exit={{ x: "100%" }}
      transition={m.push}
      drag={top ? "x" : false}
      dragListener={false}
      dragControls={controls}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0, right: 1 }}
      dragMomentum={false}
      onDragEnd={onDragEnd}
    >
      {children}
      {top && (
        <div
          className="absolute inset-y-0 left-0 z-50 touch-none"
          style={{ width: layout.edgeSwipeWidth }}
          onPointerDown={(e) => controls.start(e)}
        />
      )}
    </motion.div>
  );
}
