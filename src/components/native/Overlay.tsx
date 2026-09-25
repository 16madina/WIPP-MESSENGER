import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { layout, motion as m } from "@/theme/theme";
import { haptic } from "@/lib/haptics";

export type MenuAction = { key: string; label: string; icon: LucideIcon; danger?: boolean; onSelect: () => void };
export type MenuRequest = {
  anchor: HTMLElement;
  preview: ReactNode;
  actions: MenuAction[];
  reactions?: { emojis: string[]; onReact: (emoji: string) => void };
};
type Banner = { id: number; title: string; body?: string | undefined };
type Ctx = {
  openMenu: (r: MenuRequest) => void;
  notify: (title: string, body?: string) => void;
  sheetOpen: boolean;
  setSheetOpen: (v: boolean) => void;
};

const OverlayCtx = createContext<Ctx | null>(null);
export const useOverlay = () => {
  const c = useContext(OverlayCtx);
  if (!c) throw new Error("useOverlay hors OverlayProvider");
  return c;
};

let bid = 0;

/** Couches globales : menu contextuel iOS, bannières internes, recul de l'écran sous une feuille. */
export function OverlayProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState<(MenuRequest & { rect: DOMRect; host: DOMRect }) | null>(null);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);

  const openMenu = useCallback((r: MenuRequest) => {
    const host = hostRef.current?.getBoundingClientRect();
    if (!host) return;
    setMenu({ ...r, rect: r.anchor.getBoundingClientRect(), host });
  }, []);
  const notify = useCallback((title: string, body?: string) => {
    haptic("light");
    setBanner({ id: ++bid, title, body });
  }, []);

  useEffect(() => {
    if (!banner) return;
    const t = window.setTimeout(() => setBanner(null), m.bannerMs);
    return () => window.clearTimeout(t);
  }, [banner]);

  return (
    <OverlayCtx.Provider value={{ openMenu, notify, sheetOpen, setSheetOpen }}>
      {children}
      <div ref={hostRef} className="pointer-events-none absolute inset-0 z-[70]">
        <AnimatePresence>{menu && <ContextMenu key="menu" req={menu} onClose={() => setMenu(null)} />}</AnimatePresence>
        <AnimatePresence>
          {banner && (
            <motion.div
              key={banner.id}
              className="glass-menu pointer-events-auto absolute inset-x-2 top-2 flex items-center gap-3 rounded-[22px] px-4 py-3"
              style={{ marginTop: "env(safe-area-inset-top)" }}
              initial={{ y: -120, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -120, opacity: 0 }}
              transition={m.sheet}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 1, bottom: 0.08 }}
              onDragEnd={(_: unknown, i: PanInfo) => {
                if (i.offset.y < -24 || i.velocity.y < -300) setBanner(null);
              }}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-wipp-accent type-headline text-wipp-accent-fg">w</span>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between type-headline text-wipp-fg">
                  <span className="truncate">{banner.title}</span>
                  <span className="type-caption text-wipp-muted">maintenant</span>
                </div>
                {banner.body && <div className="truncate type-subhead text-wipp-fg/80">{banner.body}</div>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </OverlayCtx.Provider>
  );
}

function ContextMenu({ req, onClose }: { req: MenuRequest & { rect: DOMRect; host: DOMRect }; onClose: () => void }) {
  const { rect, host, actions, reactions } = req;
  const top = rect.top - host.top;
  const left = rect.left - host.left;
  const menuH = actions.length * layout.menuItemHeight;
  const gap = 10;
  const reactH = reactions ? layout.reactionBarHeight + gap : 0;
  const safeTop = 54;
  const bottomLimit = host.height - 24;
  let dy = 0;
  if (top + rect.height + gap + menuH > bottomLimit) dy = bottomLimit - (top + rect.height + gap + menuH);
  if (top + dy - reactH < safeTop) dy = safeTop - (top - reactH);
  const rightSide = left + rect.width / 2 > host.width / 2;
  const menuLeft = rightSide ? Math.max(12, left + rect.width - layout.menuWidth) : Math.min(left, host.width - layout.menuWidth - 12);

  const select = (a: MenuAction) => {
    onClose();
    window.setTimeout(a.onSelect, 120);
  };

  return (
    <motion.div className="pointer-events-auto absolute inset-0" initial={{ opacity: 1 }} exit={{ opacity: 1 }}>
      <motion.div
        className="backdrop-dim absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.div
        className="absolute overflow-hidden rounded-[18px] shadow-lift"
        style={{ top, left, width: rect.width, height: rect.height }}
        initial={{ y: 0, scale: 1 }}
        animate={{ y: dy, scale: m.liftScale }}
        exit={{ y: 0, scale: 1, opacity: 0 }}
        transition={m.lift}
        onClick={onClose}
      >
        {req.preview}
      </motion.div>
      {reactions && (
        <motion.div
          className="glass-menu absolute flex items-center gap-0.5 rounded-full px-1.5"
          style={{ top: top + dy - reactH, left: rightSide ? undefined : Math.max(12, left), right: rightSide ? Math.max(12, host.width - left - rect.width) : undefined, height: layout.reactionBarHeight, originX: rightSide ? 1 : 0, originY: 1 }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={m.lift}
        >
          {reactions.emojis.map((e, i) => (
            <motion.button
              key={e}
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full text-[26px]"
              initial={{ scale: 0, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ ...m.tabBounce, delay: i * m.reactionStagger }}
              whileTap={{ scale: 1.3 }}
              onClick={() => {
                haptic("light");
                onClose();
                reactions.onReact(e);
              }}
            >
              {e}
            </motion.button>
          ))}
        </motion.div>
      )}
      <motion.div
        className="glass-menu absolute overflow-hidden rounded-[14px]"
        style={{ top: top + rect.height + gap + dy, left: menuLeft, width: layout.menuWidth, originX: rightSide ? 1 : 0, originY: 0 }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.6 }}
        transition={m.lift}
      >
        {actions.map((a) => (
          <motion.button
            key={a.key}
            type="button"
            whileTap={{ scale: 0.98, opacity: 0.6 }}
            onClick={() => select(a)}
            className={`flex w-full items-center justify-between border-b border-wipp-sep px-4 type-body last:border-0 ${a.danger ? "text-wipp-danger" : "text-wipp-fg"}`}
            style={{ height: layout.menuItemHeight }}
          >
            {a.label}
            <a.icon size={19} />
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
}

/** Enveloppe l'écran principal : recule (scale 0.94, coins arrondis, assombri) quand une feuille est ouverte. */
export function Recede({ children }: { children: ReactNode }) {
  const { sheetOpen } = useOverlay();
  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      style={{ borderRadius: sheetOpen ? m.recedeRadius : 0 }}
      animate={{ scale: sheetOpen ? m.recedeScale : 1, y: sheetOpen ? 8 : 0 }}
      transition={m.sheet}
    >
      {children}
      <motion.div
        className="pointer-events-none absolute inset-0 z-[45] bg-wipp-backdrop"
        animate={{ opacity: sheetOpen ? 1 : 0 }}
        initial={false}
        transition={{ duration: 0.25 }}
      />
    </motion.div>
  );
}
