import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Pressable } from "./Pressable";
import { motion as m } from "@/theme/theme";

export type Tab = { key: string; label: string; icon: LucideIcon; badge?: string | number; center?: boolean };

/** Barre d'onglets flottante en verre flouté, avec bouton central WIPP Touch. */
export function TabBar({ tabs, active, onChange }: { tabs: Tab[]; active: string; onChange: (k: string) => void }) {
  return (
    <nav className="absolute inset-x-0 bottom-0 z-30 px-1" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 6px)" }}>
      <div className="glass flex items-end rounded-[34px] border border-wipp-glass-border" style={{ height: "var(--tabbar-h)" }}>
        {tabs.map((t) => {
          const on = t.key === active;
          const Icon = t.icon;
          if (t.center)
            return (
              <Pressable key={t.key} onClick={() => onChange(t.key)} aria-label={t.label} className="relative flex flex-1 flex-col items-center">
                <motion.span
                  className="-mt-8 flex h-[70px] w-[70px] items-center justify-center rounded-full border-[3px] border-wipp-accent bg-wipp-bg text-wipp-accent"
                  animate={{ boxShadow: ["0 0 14px -4px var(--wipp-accent)", "0 0 26px -2px var(--wipp-accent)", "0 0 14px -4px var(--wipp-accent)"] }}
                  transition={{ duration: 2.4, repeat: Infinity }}
                >
                  <Icon size={34} strokeWidth={1.8} />
                </motion.span>
                <span className="mb-1.5 mt-0.5 font-display text-[12px] font-extrabold tracking-[0.12em] text-wipp-accent">{t.label}</span>
              </Pressable>
            );
          return (
            <Pressable
              key={t.key}
              onClick={() => onChange(t.key)}
              className={`relative flex h-full flex-1 flex-col items-center justify-center gap-1 ${on ? "text-wipp-accent" : "text-wipp-muted"}`}
              aria-label={t.label}
            >
              <span className="relative">
                {on && <motion.span layoutId="tab-glow" transition={m.spring} className="absolute -inset-2 rounded-full bg-wipp-accent/10" />}
                <Icon size={26} strokeWidth={on ? 2.4 : 1.8} className="relative" />
                {t.badge !== undefined && (
                  <span className="absolute -right-3.5 -top-2 min-w-[20px] rounded-full bg-wipp-accent px-1.5 text-center text-[11px] font-bold leading-[20px] text-wipp-accent-fg">
                    {t.badge}
                  </span>
                )}
              </span>
              <span className="relative text-[12px] font-semibold">{t.label}</span>
            </Pressable>
          );
        })}
      </div>
    </nav>
  );
}
