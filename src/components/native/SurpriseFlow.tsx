import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, ChevronLeft, Clock3, Contact, FileText, Gift, Image, LockKeyhole, MapPin, PackageOpen, PartyPopper, Sparkles, Sticker, X } from "lucide-react";
import { Pressable } from "./Pressable";
import { Sheet } from "./Sheet";
import { SurpriseCard, type SurpriseDesign, type SurpriseMessage } from "./SurpriseCard";
import { layout, motion as m } from "@/theme/theme";
import { haptic } from "@/lib/haptics";

type Stage = "closed" | "share" | "choices" | "compose";
const content = [
  { label: "Galerie", icon: Image }, { label: "Caméra", icon: Camera }, { label: "Stickers", icon: Sticker },
  { label: "Document", icon: FileText }, { label: "Localisation", icon: MapPin }, { label: "Contact", icon: Contact },
];
const options = [
  { title: "Message à gratter", detail: "Écris quelque chose que l’autre personne devra découvrir.", icon: Sparkles, enabled: true },
  { title: "Message cadeau", detail: "Cache un message dans un cadeau.", icon: Gift, enabled: false },
  { title: "Message verrouillé", detail: "Un message secret à déverrouiller.", icon: LockKeyhole, enabled: false },
  { title: "Message confettis", detail: "Fais plaisir avec une pluie de confettis.", icon: PartyPopper, enabled: false },
  { title: "Message compte à rebours", detail: "Un message qui se dévoile dans…", icon: Clock3, enabled: false },
];
const designs: { id: SurpriseDesign; mark: string; label: string }[] = [
  { id: "heart", mark: "♥", label: "Cœur" }, { id: "stars", mark: "✦", label: "Étoiles" },
  { id: "crown", mark: "♛", label: "Couronne" }, { id: "neon", mark: "♡", label: "Néon" },
];

/** Parcours local en trois étapes, prêt à accueillir d'autres surprises sans les envoyer au serveur. */
export function SurpriseFlow({ onSend, onUnavailable }: { onSend: (message: SurpriseMessage) => void; onUnavailable: (label: string) => void }) {
  const [stage, setStage] = useState<Stage>("closed");
  const [secret, setSecret] = useState("");
  const [design, setDesign] = useState<SurpriseDesign>("heart");
  const close = () => setStage("closed");
  const send = () => {
    if (!secret.trim()) return;
    onSend({ id: `surprise-${Date.now()}`, text: secret.trim(), design, mine: true, time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) });
    haptic("success");
    setSecret("");
    close();
  };
  return <>
    <Pressable aria-label="Ouvrir le menu Partager" onClick={() => { haptic("light"); setStage("share"); }} className="text-wipp-muted"><span className="flex h-8 w-8 items-center justify-center rounded-full border border-wipp-muted/60 text-[25px] font-light leading-none">+</span></Pressable>
    <Sheet open={stage === "share"} onClose={close} detent="half">
      <div className="px-4 pb-4 text-wipp-fg">
        <h2 className="mb-4 text-center type-nav">Partager</h2>
        <div className="grid grid-cols-3 gap-2">
          {content.map(({ label, icon: Icon }) => <Pressable key={label} onClick={() => onUnavailable(label)} className="flex h-[72px] flex-col items-center justify-center gap-1 rounded-[14px] border border-wipp-glass-border bg-wipp-surface text-wipp-fg"><Icon size={22} strokeWidth={1.6} /><span className="type-caption">{label}</span></Pressable>)}
        </div>
        <Pressable onClick={() => { haptic("light"); setStage("choices"); }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-[14px] border border-wipp-surprise-line bg-wipp-surprise-ink py-3 text-wipp-surprise-gold shadow-glow"><Gift size={23} /><span className="type-headline">Surprise ✨</span></Pressable>
      </div>
    </Sheet>
    <Sheet open={stage === "choices"} onClose={close} detent="full">
      <div className="no-scrollbar h-[calc(100%-24px)] overflow-y-auto px-4 pb-6 text-wipp-fg">
        <div className="mb-3 flex items-center justify-between"><span className="w-11" /><h2 className="type-nav">Message à gratter</h2><Pressable aria-label="Fermer" onClick={close}><X size={20} /></Pressable></div>
        <div className="mb-5 border-b border-wipp-surprise-line/40 pb-4 text-center"><div className="text-[35px] text-wipp-surprise-gold">✦</div><h3 className="type-title2">Envoyer une surprise</h3><p className="type-footnote text-wipp-muted">Rends tes conversations plus fun !</p></div>
        <div className="flex flex-col gap-2">
          {options.map(({ title, detail, icon: Icon, enabled }, i) => <Pressable key={title} onClick={() => enabled ? (haptic("light"), setStage("compose")) : onUnavailable(title)} className={`flex w-full items-center gap-3 rounded-[14px] border p-3 text-left ${i === 0 ? "border-wipp-surprise-gold bg-wipp-surprise-ink shadow-glow" : "border-wipp-glass-border bg-wipp-surface"}`}>
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border ${i === 0 ? "border-wipp-surprise-line text-wipp-surprise-gold" : "border-wipp-glass-border text-wipp-muted"}`}><Icon size={22} /></span>
            <span className="min-w-0"><span className="block type-subhead font-semibold text-wipp-fg">{title}</span><span className="block type-footnote text-wipp-muted">{detail}</span></span>
          </Pressable>)}
        </div>
      </div>
    </Sheet>
    <Sheet open={stage === "compose"} onClose={close} detent="full">
      <div className="no-scrollbar h-[calc(100%-24px)] overflow-y-auto px-4 pb-8 text-wipp-fg">
        <div className="flex items-center justify-between"><Pressable aria-label="Retour aux surprises" onClick={() => setStage("choices")}><ChevronLeft size={23} /></Pressable><span className="type-nav">Message à gratter</span><Pressable aria-label="Fermer" onClick={close}><X size={20} /></Pressable></div>
        <h2 className="mt-4 type-title2">Crée ta surprise ✨</h2><p className="mb-4 type-footnote text-wipp-muted">Écris ton message secret...</p>
        <div className="rounded-[12px] border border-wipp-glass-border bg-wipp-surface p-3">
          <textarea aria-label="Écris ton message secret" value={secret} maxLength={layout.surpriseMessageLimit} onChange={e => setSecret(e.target.value)} placeholder="Écris ton message secret…" className="h-[72px] w-full resize-none bg-transparent type-subhead text-wipp-fg outline-none placeholder:text-wipp-muted" />
          <div className="text-right type-caption2 text-wipp-muted">{secret.length}/{layout.surpriseMessageLimit}</div>
        </div>
        <h3 className="mb-2 mt-5 type-footnote font-semibold">Choisis un design</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {designs.map(item => <Pressable key={item.id} aria-label={item.label} aria-pressed={design === item.id} onClick={() => { setDesign(item.id); haptic("light"); }} className={`flex h-12 min-w-12 items-center justify-center rounded-[9px] border bg-wipp-surprise-ink text-[28px] text-wipp-surprise-gold ${design === item.id ? "border-wipp-surprise-gold shadow-glow" : "border-wipp-glass-border"}`}>{item.mark}</Pressable>)}
        </div>
        <h3 className="mb-2 mt-3 type-footnote font-semibold">Aperçu de la carte</h3>
        <div className="py-1"><SurpriseCard preview /></div>
        <Pressable onClick={send} disabled={!secret.trim()} className="mt-4 w-full rounded-full bg-wipp-surprise-gold py-3 type-headline text-wipp-surprise-ink disabled:opacity-40">Envoyer la surprise</Pressable>
      </div>
    </Sheet>
  </>;
}