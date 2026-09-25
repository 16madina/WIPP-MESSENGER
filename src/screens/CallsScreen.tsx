import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Lock, MoreHorizontal, Phone, PhoneMissed, Plus, Search, Users, Video } from "lucide-react";
import { Avatar } from "@/components/native/Avatar";
import { Pressable } from "@/components/native/Pressable";
import { WippLogo } from "@/components/native/WippLogo";
import { callLog, stories, type CallEntry } from "@/data/mock";
import { motion as m } from "@/theme/theme";

const filters = [
  { key: "all", label: "Tous" },
  { key: "audio", label: "Appels", icon: Phone },
  { key: "video", label: "Vidéo", icon: Video },
] as const;

function CallMeta({ c }: { c: CallEntry }) {
  const map = {
    out: { icon: <ArrowUpRight size={18} className="text-wipp-accent" />, label: "Appel sortant" },
    in: { icon: <ArrowDownLeft size={18} className="text-wipp-success" />, label: "Appel entrant" },
    missed: { icon: <PhoneMissed size={16} className="text-wipp-danger" />, label: "Appel manqué" },
    video: { icon: <Video size={18} className="fill-wipp-accent text-wipp-accent" />, label: "Appel vidéo" },
    group: { icon: <Users size={17} className="text-wipp-fg" />, label: "Appel de groupe" },
  }[c.type];
  return (
    <div className="mt-0.5 flex items-center gap-2 text-[15px] text-wipp-muted">
      {map.icon}
      <span className="truncate">
        <span className={c.type === "missed" ? "text-wipp-danger" : ""}>{map.label}</span> · {c.time}
      </span>
    </div>
  );
}

export function CallsScreen() {
  const [filter, setFilter] = useState<(typeof filters)[number]["key"]>("all");
  const list = callLog.filter((c) => filter === "all" || (filter === "video" ? c.video : !c.video));

  return (
    <div className="no-scrollbar h-full overflow-y-auto bg-wipp-bg" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <header className="flex items-center justify-between px-4 pb-3 pt-4">
        <WippLogo />
        <div className="flex items-center gap-5 text-wipp-fg">
          <Pressable aria-label="Rechercher"><Search size={26} /></Pressable>
          <Pressable aria-label="Ajouter"><Plus size={28} /></Pressable>
          <Avatar name="Madina" size={42} presence="online" />
        </div>
      </header>

      <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-4">
        {stories.map((s) => (
          <Pressable key={s.name} className="flex w-[70px] shrink-0 flex-col items-center gap-1.5">
            <Avatar
              name={s.name}
              size={68}
              ring
              presence={s.badge ? undefined : "online"}
              badge={s.badge === "add" ? <Plus size={16} strokeWidth={3} /> : s.badge === "call" ? <Phone size={12} className="fill-current" /> : s.badge === "video" ? <Video size={13} className="fill-current" /> : undefined}
            />
            <span className="w-full truncate text-center text-[13px] text-wipp-muted">{s.name}</span>
          </Pressable>
        ))}
      </div>

      <div className="flex gap-2 px-4 pb-3">
        {filters.map((f) => {
          const on = filter === f.key;
          const Icon = "icon" in f ? f.icon : null;
          return (
            <Pressable key={f.key} onClick={() => setFilter(f.key)} className={`relative flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-wipp-glass-border text-[15px] font-semibold ${on ? "text-wipp-accent-fg" : "bg-wipp-surface text-wipp-fg"}`}>
              {on && <motion.span layoutId="call-filter" transition={m.spring} className="absolute inset-0 rounded-full bg-wipp-accent" />}
              {Icon && <Icon size={18} className="relative fill-current" />}
              <span className="relative">{f.label}</span>
            </Pressable>
          );
        })}
      </div>

      <ul style={{ paddingBottom: "calc(var(--tabbar-h) + env(safe-area-inset-bottom) + 40px)" }}>
        {list.map((c) => (
          <li key={c.id} className="flex items-center gap-3 pl-4 pr-2">
            <Avatar name={c.name} size={56} presence={c.presence} />
            <div className="flex min-w-0 flex-1 items-center gap-2 border-b border-wipp-sep py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[17px] font-semibold text-wipp-fg">
                  {c.name}
                  {c.locked && <Lock size={15} className="text-wipp-muted" />}
                </div>
                <CallMeta c={c} />
              </div>
              <Pressable aria-label={c.video ? "Appel vidéo" : "Appeler"} className="flex h-11 w-11 items-center justify-center rounded-full border border-wipp-glass-border bg-wipp-surface text-wipp-fg">
                {c.video ? <Video size={20} className="fill-current" /> : <Phone size={19} className="fill-current" />}
              </Pressable>
              <Pressable aria-label="Plus" className="p-2 text-wipp-muted"><MoreHorizontal size={22} /></Pressable>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
