import { motion } from "framer-motion";
import { motion as m } from "@/theme/theme";
import { haptic } from "@/lib/haptics";

/** Interrupteur iOS (51×31). */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => {
        haptic("light");
        onChange(!checked);
      }}
      className="relative flex items-center justify-center"
    >
      <span className="relative block h-[31px] w-[51px] rounded-full bg-wipp-switch-off">
        <motion.span className="absolute inset-0 rounded-full bg-wipp-success" initial={false} animate={{ opacity: checked ? 1 : 0 }} transition={{ duration: 0.2 }} />
        <motion.span
          className="absolute left-[2px] top-[2px] h-[27px] w-[27px] rounded-full bg-wipp-knob shadow-[0_3px_8px_rgba(0,0,0,0.15),0_3px_1px_rgba(0,0,0,0.06)]"
          initial={false}
          animate={{ x: checked ? 20 : 0 }}
          transition={m.toggle}
        />
      </span>
    </button>
  );
}

/** Contrôle segmenté iOS. */
export function Segmented<T extends string>({ id, options, value, onChange }: { id: string; options: { key: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex h-9 rounded-[9px] bg-wipp-seg-track p-[2px]">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => {
            haptic("light");
            onChange(o.key);
          }}
          className="relative min-h-0 flex-1 type-footnote font-semibold text-wipp-fg"
        >
          {value === o.key && (
            <motion.span layoutId={`seg-${id}`} transition={m.toggle} className="absolute inset-0 rounded-[7px] bg-wipp-seg-thumb shadow-[0_3px_8px_rgba(0,0,0,0.12)]" />
          )}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/** Squelette animé (shimmer) pour une ligne de liste. */
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <span className="shimmer h-[52px] w-[52px] shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <span className="shimmer block h-3.5 w-2/5 rounded-full" />
        <span className="shimmer block h-3 w-4/5 rounded-full" />
      </div>
    </div>
  );
}
