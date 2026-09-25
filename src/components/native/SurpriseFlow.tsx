import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createPortal } from "react-dom";
import { Camera, ChevronRight, Clock3, Contact, FileText, Gift, Heart, Image, MapPin, Moon, PartyPopper, Plane, Sparkles, Sticker, Sun, WandSparkles, X } from "lucide-react";
import { Pressable } from "./Pressable";
import { Sheet } from "./Sheet";
import { type SurpriseMessage } from "./SurpriseCard";
import { layout, motion as m } from "@/theme/theme";
import { haptic } from "@/lib/haptics";

type Stage = "closed" | "share" | "compose";
type SurpriseKind = "scratch" | "gift" | "confetti" | "countdown";
const content = [
  { label: "Galerie", icon: Image }, { label: "Caméra", icon: Camera }, { label: "Stickers", icon: Sticker },
  { label: "Document", icon: FileText }, { label: "Localisation", icon: MapPin }, { label: "Contact", icon: Contact },
];
const options = [
  { id: "scratch", title: "Message à gratter", icon: Sparkles, mark: "✦" },
  { id: "gift", title: "Message cadeau", icon: Gift, mark: "✧" },
  { id: "confetti", title: "Confetti", icon: PartyPopper, mark: "✳" },
  { id: "countdown", title: "Compte à rebours", icon: Clock3, mark: "03" },
] as const;
const animations = [
  { name: "Amour", icon: Heart, mark: "♥" },
  { name: "Beauté", icon: Sparkles, mark: "✦" },
  { name: "Bonne journée", icon: Sun, mark: "☼" },
  { name: "Bonne nuit", icon: Moon, mark: "☾" },
  { name: "Voyage", icon: Plane, mark: "✈" },
  { name: "Amitié", icon: Heart, mark: "♡" },
] as const;

/** Parcours local de composition ; seuls les messages à gratter sont simulés dans la conversation. */
export function SurpriseFlow({ onSend, onUnavailable }: { onSend: (message: SurpriseMessage) => void; onUnavailable: (label: string) => void }) {
  const reducedMotion = useReducedMotion();
  const [stage, setStage] = useState<Stage>("closed");
  const [secret, setSecret] = useState("");
  const [kind, setKind] = useState<SurpriseKind>("scratch");
  const [animation, setAnimation] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const close = () => { setDrawerOpen(false); setStage("closed"); };
  const send = () => {
    if (!secret.trim()) return;
    if (kind !== "scratch") { onUnavailable(options.find(option => option.id === kind)?.title ?? "Surprise"); return; }
    onSend({ id: `surprise-${Date.now()}`, text: secret.trim(), design: "heart", mine: true, time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) });
    haptic("success");
    setSecret("");
    close();
  };
  return <>
    <Pressable aria-label="Ouvrir le menu Partager" onClick={() => { haptic("light"); setStage("share"); }} className="text-wipp-muted"><span className="flex h-8 w-8 items-center justify-center rounded-full border border-wipp-muted/60 text-[25px] font-light leading-none">+</span></Pressable>
    <Sheet open={stage !== "closed"} onClose={close} detent={stage === "share" ? "half" : "full"}>
      {stage === "share" && (
      <div className="px-4 pb-4 text-wipp-fg">
        <h2 className="mb-4 text-center type-nav">Partager</h2>
        <div className="grid grid-cols-3 gap-2">
          {content.map(({ label, icon: Icon }) => <Pressable key={label} onClick={() => onUnavailable(label)} className="flex h-[72px] flex-col items-center justify-center gap-1 rounded-[14px] border border-wipp-glass-border bg-wipp-surface text-wipp-fg"><Icon size={22} strokeWidth={1.6} /><span className="type-caption">{label}</span></Pressable>)}
        </div>
        <Pressable aria-label="Surprise ✨" onClick={() => { haptic("light"); setStage("compose"); }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-[14px] border border-wipp-surprise-line bg-wipp-surprise-ink py-3 text-wipp-surprise-gold shadow-glow"><Gift size={23} /><span className="type-headline">Surprise</span><Sparkles size={17} /></Pressable>
      </div>)}
      {stage === "compose" && (
      <div className="no-scrollbar h-[calc(100%-24px)] overflow-y-auto px-4 pb-8 text-wipp-fg">
        <div className="flex items-center justify-between"><span className="w-11" /><span className="type-nav">Surprise</span><Pressable aria-label="Fermer" onClick={close}><X size={20} /></Pressable></div>
        <h2 className="mt-3 mb-4 type-title2">Crée ta surprise <Sparkles size={20} className="inline text-wipp-surprise-gold" /></h2>
        <div className="rounded-[12px] border border-wipp-glass-border bg-wipp-surface p-3">
          <textarea aria-label="Écris ton message" value={secret} maxLength={layout.surpriseMessageLimit} onChange={e => setSecret(e.target.value)} placeholder="Écris ton message…" className="h-[76px] w-full resize-none bg-transparent type-body text-wipp-fg outline-none placeholder:text-wipp-muted" />
          <div className="text-right type-caption2 text-wipp-muted">{secret.length}/{layout.surpriseMessageLimit}</div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5" role="group" aria-label="Type de surprise">
          {options.map(({ id, title, icon: Icon, mark }) => <Pressable key={id} aria-pressed={kind === id} onClick={() => { setKind(id); haptic("light"); }} className={`relative flex h-[116px] flex-col items-start justify-end overflow-hidden rounded-[8px] border p-3 text-left transition-colors ${kind === id ? "border-wipp-surprise-choice-border bg-wipp-surprise-choice-raised" : "border-wipp-glass-border bg-wipp-surprise-choice"}`}>
            <span aria-hidden className="pointer-events-none absolute -right-2 -top-7 text-[94px] font-light leading-none text-wipp-fg/10">{mark}</span>
            <span className="mb-auto flex h-9 w-9 items-center justify-center rounded-full border border-wipp-fg/20 bg-wipp-fg/10 text-wipp-fg"><Icon size={19} strokeWidth={1.7} /></span>
            <span className="relative type-footnote font-semibold leading-tight text-wipp-fg">{title}</span>
            {kind === id && <motion.span layoutId="surprise-choice" transition={m.spring} className="absolute inset-x-3 bottom-0 h-[2px] bg-wipp-fg/80" />}
          </Pressable>)}
        </div>
        <Pressable onClick={() => { setDrawerOpen(true); haptic("light"); }} className="mt-4 flex w-full items-center gap-3 rounded-[8px] border border-wipp-glass-border bg-wipp-surface px-3 text-left text-wipp-fg">
          <WandSparkles size={20} className="text-wipp-surprise-gold" /><span className="flex-1 type-subhead">{animation ?? "Ajouter une animation"}</span><ChevronRight size={19} className="text-wipp-muted" />
        </Pressable>
        {animation && <motion.div key={animation} initial={{ opacity: 0, scale: 0.75, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={m.spring} className="mt-4 flex items-center justify-center gap-3 rounded-[8px] border border-wipp-surprise-line bg-wipp-surprise-ink py-4 text-wipp-surprise-gold"><motion.span animate={reducedMotion ? undefined : { scale: [1, 1.22, 1], rotate: [0, 8, 0] }} transition={reducedMotion ? undefined : { duration: 2, repeat: Infinity, ease: "easeInOut" }} className="text-[35px]">{animations.find(item => item.name === animation)?.mark}</motion.span><span className="type-headline">{animation}</span></motion.div>}
        <Pressable onClick={send} disabled={!secret.trim()} className="mt-5 w-full rounded-full bg-wipp-surprise-gold py-3 type-headline text-wipp-surprise-ink disabled:opacity-40">Envoyer la surprise</Pressable>
      </div>)}
    </Sheet>
    {typeof document !== "undefined" && createPortal(<AnimatePresence>{drawerOpen && stage === "compose" && <div className="fixed inset-0 z-[90]">
      <motion.div className="absolute inset-0 bg-wipp-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawerOpen(false)} />
      <motion.aside role="dialog" aria-modal="true" aria-label="Animations" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={m.sheet} className="glass-menu absolute inset-y-0 right-0 w-[min(340px,90vw)] overflow-y-auto border-l border-wipp-glass-border px-4 pt-[calc(env(safe-area-inset-top)+28px)] pb-[calc(env(safe-area-inset-bottom)+24px)] text-wipp-fg">
        <div className="mb-6 flex items-center justify-between"><h3 className="type-title2">Animations</h3><Pressable aria-label="Fermer les animations" onClick={() => setDrawerOpen(false)}><X size={21} /></Pressable></div>
        <div className="grid grid-cols-2 gap-3">{animations.map(({ name, icon: Icon, mark }) => <Pressable key={name} aria-pressed={animation === name} onClick={() => { setAnimation(name); setDrawerOpen(false); haptic("light"); }} className={`relative flex h-[120px] flex-col items-center justify-center gap-2 overflow-hidden rounded-[8px] border text-wipp-fg ${animation === name ? "border-wipp-surprise-gold bg-wipp-surprise-choice-raised" : "border-wipp-glass-border bg-wipp-surprise-choice"}`}><span className="absolute -right-3 -top-6 text-[82px] leading-none text-wipp-fg/10">{mark}</span><Icon size={28} strokeWidth={1.4} /><span className="relative type-footnote font-semibold">{name}</span></Pressable>)}</div>
        {animation && <Pressable onClick={() => { setAnimation(null); setDrawerOpen(false); }} className="mt-5 w-full text-center type-subhead text-wipp-muted">Retirer l’animation</Pressable>}
      </motion.aside>
    </div>}</AnimatePresence>, document.body)}
  </>;
}