import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Pressable } from "./Pressable";
import { motion as m } from "@/theme/theme";

export type Tab = { key: string; label: string; icon: LucideIcon; badge?: number };

/** Barre d'onglets en verre flouté, en bas de l'écran. */
export function TabBar({ tabs, active, onChange }: { tabs: Tab[]; active: string; onChange: (k: string) => void }) {
  return (
    <nav
      className="glass absolute inset-x-0 bottom-0 z-30 border-t border-wipp-glass-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex" style={{ height: "var(--tabbar-h)" }}>
        {tabs.map((t) => {
          const on = t.key === active;
          const Icon = t.icon;
          return (
            <Pressable
              key={t.key}
              onClick={() => onChange(t.key)}
              className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 ${on ? "text-wipp-accent" : "text-wipp-muted"}`}
              aria-label={t.label}
            >
              {on && (
                <motion.span layoutId="tab-pill" transition={m.spring} className="absolute top-1.5 h-8 w-14 rounded-full bg-wipp-accent/15" />
              )}
              <span className="relative">
                <Icon size={24} strokeWidth={on ? 2.4 : 1.9} />
                {!!t.badge && (
                  <span className="absolute -right-2.5 -top-1.5 min-w-[18px] rounded-full bg-wipp-accent px-1 text-center text-[11px] font-bold leading-[18px] text-wipp-accent-fg">
                    {t.badge}
                  </span>
                )}
              </span>
              <span className="relative text-[10px] font-semibold">{t.label}</span>
            </Pressable>
          );
        })}
      </div>
    </nav>
  );
}
