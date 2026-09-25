import { motion } from "framer-motion";
import { useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { Pressable } from "./Pressable";
import { layout, motion as m } from "@/theme/theme";
import { haptic } from "@/lib/haptics";

export type Tab = { key: string; label: string; icon: LucideIcon; badge?: string | number; center?: boolean };

/** Pilule en verre flottante façon iOS récent, bouton central WIPP Touch surélevé. */
export function TabBar({ tabs, active, onChange }: { tabs: Tab[]; active: string; onChange: (k: string) => void }) {
  const bumps = useRef<Record<string, number>>({});
  const press = (k: string) => {
    haptic("light");
    if (k === active) {
      window.dispatchEvent(new CustomEvent("wipp:tab-reselect", { detail: k }));
      return;
    }
    bumps.current[k] = (bumps.current[k] ?? 0) + 1;
    onChange(k);
  };
  const M = layout.tabBarMargin;

  return (
    <nav className="absolute z-30" style={{ left: M, right: M, bottom: `calc(env(safe-area-inset-bottom) + ${M}px)` }}>
      <div className="glass-bar flex items-center rounded-[32px] px-1" style={{ height: layout.tabBarHeight }}>
        {tabs.map((t) => {
          const on = t.key === active;
          const Icon = t.icon;
          if (t.center)
            return (
              <Pressable key={t.key} onClick={() => press(t.key)} aria-label={t.label} scale={0.92} className="relative flex h-full flex-1 flex-col items-center justify-end pb-1.5">
                <span
                  className="flex items-center justify-center rounded-full border-[2.5px] border-wipp-accent bg-wipp-bg text-wipp-accent shadow-glow"
                  style={{ width: layout.centerButton, height: layout.centerButton, marginTop: -layout.centerLift * 2, marginBottom: 2 }}
                >
                  <Icon size={28} strokeWidth={1.9} />
                </span>
                <span className="type-tab font-bold tracking-[0.12em] text-wipp-accent">{t.label}</span>
              </Pressable>
            );
          return (
            <Pressable
              key={t.key}
              onClick={() => press(t.key)}
              className={`relative flex h-full flex-1 flex-col items-center justify-center gap-1 ${on ? "text-wipp-accent" : "text-wipp-muted"}`}
              aria-label={t.label}
            >
              <motion.span
                key={on ? `on-${bumps.current[t.key] ?? 0}` : "off"}
                className="relative"
                initial={on ? { scale: 0.72, y: 2 } : false}
                animate={{ scale: 1, y: 0 }}
                transition={m.tabBounce}
              >
                <Icon size={25} strokeWidth={on ? 2.3 : 1.8} />
                {t.badge !== undefined && (
                  <span className="absolute -right-3 -top-1.5 min-w-[18px] rounded-full bg-wipp-accent px-1 text-center text-[11px] font-bold leading-[18px] text-wipp-accent-fg">
                    {t.badge}
                  </span>
                )}
              </motion.span>
              <span className="type-tab">{t.label}</span>
            </Pressable>
          );
        })}
      </div>
    </nav>
  );
}
