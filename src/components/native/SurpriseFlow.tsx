import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createPortal } from "react-dom";
import { Camera, ChevronRight, Clock3, FileText, Gift, Heart, Images, MapPin, Moon, PartyPopper, Plane, Smile, Sparkles, Sun, UserRound, WandSparkles, X } from "lucide-react";
import shareGift from "@/assets/share-gift.png";
import scratchArt from "@/assets/surprise-scratch.png";
import hourglassArt from "@/assets/surprise-hourglass.png";
import giftArt from "@/assets/surprise-gift.png";
import confettiArt from "@/assets/surprise-confetti.png";
import { Pressable } from "./Pressable";
import { Sheet } from "./Sheet";
import { type SurpriseDesign, type SurpriseMessage } from "./SurpriseCard";
import { SurpriseAssistant } from "./SurpriseAssistant";
import { layout, motion as m } from "@/theme/theme";
import { haptic } from "@/lib/haptics";
import { chats } from "@/data/mock";

type Stage = "closed" | "share" | "compose" | "stickers" | "contacts";
type SurpriseKind = "scratch" | "gift" | "confetti" | "countdown";
const content = [
  { label: "Galerie", icon: Images }, { label: "Caméra", icon: Camera }, { label: "Stickers", icon: Smile },
  { label: "Document", icon: FileText }, { label: "Localisation", icon: MapPin }, { label: "Contact", icon: UserRound },
];
const options = [
  { id: "scratch", title: "Message à gratter", description: "Cache ton message. Il devra le gratter pour le découvrir.", icon: Sparkles, art: scratchArt },
  { id: "countdown", title: "Compte à rebours", description: "Ton message se dévoile après un certain temps.", icon: Clock3, art: hourglassArt },
  { id: "gift", title: "Message cadeau", description: "Un joli paquet à ouvrir pour découvrir ton message.", icon: Gift, art: giftArt },
  { id: "confetti", title: "Confettis", description: "Ton message s’affiche avec une animation spéciale.", icon: PartyPopper, art: confettiArt },
] as const;
const cards: { design: SurpriseDesign; label: string; mark: string }[] = [
  { design: "heart", label: "Cœur", mark: "♥" }, { design: "stars", label: "Étoiles", mark: "✦" },
  { design: "crown", label: "Couronne", mark: "♛" }, { design: "neon", label: "Néon", mark: "♡" },
];
const animations = [
  { name: "Amour", icon: Heart, mark: "♥" },
  { name: "Beauté", icon: Sparkles, mark: "✦" },
  { name: "Bonne journée", icon: Sun, mark: "☼" },
  { name: "Bonne nuit", icon: Moon, mark: "☾" },
  { name: "Voyage", icon: Plane, mark: "✈" },
  { name: "Amitié", icon: Heart, mark: "♡" },
] as const;

/** Parcours local de composition ; seuls les messages à gratter sont simulés dans la conversation. */
export function SurpriseFlow({ onSend, onShareContent, onUnavailable }: { onSend: (message: SurpriseMessage) => void; onShareContent: (text: string) => void; onUnavailable: (label: string) => void }) {
  const reducedMotion = useReducedMotion();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const documentRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("closed");
  const [secret, setSecret] = useState("");
  const [kind, setKind] = useState<SurpriseKind>("scratch");
  const [design, setDesign] = useState<SurpriseDesign>("heart");
  const [animation, setAnimation] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<"animation" | "card" | null>(null);
  const close = () => { setDrawer(null); setStage("closed"); };
  const chooseContent = (label: string) => {
    if (label === "Galerie") galleryRef.current?.click();
    else if (label === "Caméra") cameraRef.current?.click();
    else if (label === "Document") documentRef.current?.click();
    else if (label === "Stickers") setStage("stickers");
    else if (label === "Contact") setStage("contacts");
    else if (label === "Localisation") {
      if (!navigator.geolocation) { onUnavailable("Localisation"); return; }
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => { onShareContent(`📍 Ma position : https://maps.google.com/?q=${coords.latitude.toFixed(5)},${coords.longitude.toFixed(5)}`); close(); },
        () => onUnavailable("Localisation non autorisée"),
        { timeout: 10000, enableHighAccuracy: false },
      );
    }
  };
  const fileChosen = (label: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) { onShareContent(`${label === "Document" ? "📎" : "🖼️"} ${file.name}`); close(); }
    event.target.value = "";
  };
  const send = () => {
    if (!secret.trim()) return;
    if (kind !== "scratch") { onUnavailable(options.find(option => option.id === kind)?.title ?? "Surprise"); return; }
    onSend({ id: `surprise-${Date.now()}`, text: secret.trim(), design, mine: true, time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) });
    haptic("success");
    setSecret("");
    close();
  };
  return <>
    <Pressable aria-label="Ouvrir le menu Partager" onClick={() => { haptic("light"); setStage("share"); }} className="text-wipp-muted"><span className="flex h-8 w-8 items-center justify-center rounded-full border border-wipp-muted/60 text-[25px] font-light leading-none">+</span></Pressable>
    <input ref={galleryRef} type="file" accept="image/*,video/*" className="hidden" aria-label="Choisir dans la galerie" onChange={fileChosen("Galerie")} />
    <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" aria-label="Prendre une photo" onChange={fileChosen("Caméra")} />
    <input ref={documentRef} type="file" className="hidden" aria-label="Choisir un document" onChange={fileChosen("Document")} />
    <Sheet open={stage !== "closed"} onClose={close} detent={stage === "share" ? "share" : "full"} appearance={stage === "compose" ? "surprise" : "default"}>
      {stage === "share" && (
       <div className="flex h-full flex-col overflow-y-auto px-4 pb-3 text-wipp-fg">
         <div className="mb-3 flex items-start justify-between">
           <div className="min-w-0"><h2 className="text-[27px] font-bold leading-tight">Partager</h2><p className="mt-1 text-[13px] leading-5 text-wipp-share-subtitle">Envoyez du contenu ou créez une surprise.</p></div>
           <Pressable aria-label="Fermer le menu Partager" onClick={close} className="ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-wipp-fg/10 text-wipp-fg"><X size={23} /></Pressable>
        </div>
         <div className="grid grid-cols-3 gap-2">
           {content.map(({ label, icon: Icon }) => <Pressable key={label} onClick={() => chooseContent(label)} className="share-tile flex min-h-0 flex-col items-center justify-center gap-1 rounded-[14px] text-wipp-fg" style={{ height: layout.shareTileHeight }}><Icon className="share-gold-icon text-wipp-surprise-gold" size={34} strokeWidth={1.8} fill={label === "Localisation" || label === "Contact" ? "currentColor" : "none"} /><span className="text-[12px] font-semibold">{label}</span></Pressable>)}
         </div>
         <Pressable aria-label="Surprise ✨" onClick={() => { haptic("light"); setStage("compose"); }} className="share-surprise mt-4 flex min-h-[105px] w-full items-center rounded-[20px] px-2 text-left text-wipp-surprise-gold">
           <img src={shareGift} width={768} height={768} alt="" className="-ml-1 h-[100px] w-[100px] shrink-0 object-contain" />
           <span className="min-w-0 flex-1"><span className="flex items-center gap-1 text-[21px] font-bold leading-6">Surprise <Sparkles size={18} /></span><span className="mt-1 block text-[11px] leading-4 text-wipp-share-subtitle">Transforme tes messages en expériences.</span></span>
           <ChevronRight size={25} className="shrink-0" />
         </Pressable>
      </div>)}
       {(stage === "stickers" || stage === "contacts") && <div className="px-4 text-wipp-fg">
         <div className="mb-4 flex items-center justify-between"><h2 className="type-title2">{stage === "stickers" ? "Stickers" : "Contact"}</h2><Pressable aria-label="Retour au partage" onClick={() => setStage("share")}><X size={22} /></Pressable></div>
         {stage === "stickers" ? <div className="grid grid-cols-4 gap-2">{["❤️", "✨", "😂", "🥰", "👏", "🎉", "🌸", "💛"].map(sticker => <Pressable key={sticker} aria-label={`Envoyer ${sticker}`} onClick={() => { onShareContent(sticker); close(); }} className="share-tile flex h-16 items-center justify-center rounded-[12px] text-[32px]">{sticker}</Pressable>)}</div> : <div className="max-h-[310px] overflow-y-auto">{chats.map(chat => <Pressable key={chat.id} onClick={() => { onShareContent(`👤 ${chat.name}`); close(); }} className="flex w-full items-center border-b border-wipp-glass-border py-2 text-left type-body">{chat.name}</Pressable>)}</div>}
       </div>}
      {stage === "compose" && (
       <div className="flex h-[calc(100%-24px)] flex-col text-wipp-fg">
         <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 pb-3">
           <div className="relative flex min-h-[62px] flex-col items-center justify-center text-center">
             <Pressable aria-label="Fermer Surprise" onClick={close} className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full border border-wipp-glass-border bg-wipp-fg/10"><X size={22} /></Pressable>
             <h2 className="flex items-center gap-2 text-[22px] font-bold"><Gift size={25} className="text-wipp-surprise-bright" fill="currentColor" />Surprise <Sparkles size={22} className="text-wipp-surprise-bright" /></h2>
             <p className="text-[12px] text-wipp-surprise-secondary">Transforme tes messages en expériences.</p>
           </div>
           <div className="surprise-input-glow relative mt-1 rounded-[12px] border border-wipp-surprise-bright bg-wipp-surprise-panel px-3 pt-3 pb-2">
             <div className="flex gap-1"><textarea aria-label="Écris ton message" value={secret} maxLength={layout.surpriseMessageLimit} onChange={e => setSecret(e.target.value)} placeholder="Écris ton message..." className="h-[60px] min-w-0 flex-1 resize-none bg-transparent text-[16px] leading-6 text-wipp-fg outline-none placeholder:text-wipp-surprise-secondary" /><SurpriseAssistant compact onText={setSecret} /></div>
             <div className="text-right text-[11px] text-wipp-surprise-secondary">{secret.length}/{layout.surpriseMessageLimit}</div>
           </div>
           <div className="mt-2 grid grid-cols-2 gap-2">
             <Pressable onClick={() => { setDrawer("animation"); haptic("light"); }} className="surprise-action flex items-center gap-2 rounded-[10px] px-2.5 text-left text-wipp-fg"><WandSparkles size={23} className="shrink-0 text-wipp-surprise-bright" /><span className="min-w-0 flex-1 text-[12px] font-semibold leading-tight">{animation ?? "Ajouter une animation"}</span><ChevronRight size={17} className="shrink-0 text-wipp-surprise-bright" /></Pressable>
             <Pressable onClick={() => { setDrawer("card"); haptic("light"); }} className="surprise-action flex items-center gap-2 rounded-[10px] px-2.5 text-left text-wipp-fg"><Images size={23} className="shrink-0 text-wipp-surprise-bright" /><span className="min-w-0 flex-1 text-[12px] font-semibold leading-tight">Choisir la carte</span><ChevronRight size={17} className="shrink-0 text-wipp-surprise-bright" /></Pressable>
           </div>
           <div className="mt-2.5 px-0.5"><h3 className="text-[18px] font-bold leading-6">Choisis le type de surprise</h3><p className="text-[12px] text-wipp-surprise-secondary">Comment veux-tu révéler ton message ?</p></div>
           <div className="mt-2 grid grid-cols-2 gap-2" role="group" aria-label="Type de surprise">
             {options.map(({ id, title, description, icon: Icon, art }) => <Pressable key={id} aria-pressed={kind === id} onClick={() => { setKind(id); haptic("light"); }} className={`surprise-option relative flex flex-col overflow-hidden rounded-[12px] px-2.5 pb-2.5 pt-1 text-left text-wipp-fg ${kind === id ? "surprise-option-active" : ""}`} style={{ height: layout.surpriseOptionHeight }}>
               <span className="absolute left-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-wipp-surprise-bright text-wipp-surprise-bright"><Icon size={16} strokeWidth={1.8} /></span>
               <img src={art} alt="" width={768} height={768} loading="lazy" className="mx-auto h-[86px] w-[90%] shrink-0 object-contain" />
               <span className="block text-[13px] font-semibold leading-4">{title}</span>
               <span className="mt-0.5 line-clamp-2 text-[11px] leading-[14px] text-wipp-surprise-secondary">{description}</span>
             </Pressable>)}
           </div>
           {animation && <motion.div key={animation} initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }} transition={m.spring} className="mt-2 flex items-center justify-center gap-2 text-wipp-surprise-bright"><motion.span animate={reducedMotion ? { scale: 1 } : { scale: [1, 1.22, 1] }} transition={reducedMotion ? { duration: 0 } : { duration: 2, repeat: Infinity }} className="text-[24px]">{animations.find(item => item.name === animation)?.mark}</motion.span><span className="text-[12px]">{animation}</span></motion.div>}
         </div>
         <div className="shrink-0 px-3.5 pt-1 pb-1"><Pressable onClick={send} disabled={!secret.trim()} className="surprise-send flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-[16px] font-bold text-wipp-surprise-ink disabled:opacity-50">Envoyer la surprise <Sparkles size={19} /></Pressable></div>
      </div>)}
    </Sheet>
     {typeof document !== "undefined" && createPortal(<AnimatePresence>{drawer && stage === "compose" && <div className="fixed inset-0 z-[90]">
       <motion.div className="absolute inset-0 bg-wipp-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(null)} />
       <motion.aside role="dialog" aria-modal="true" aria-label={drawer === "card" ? "Choisir la carte" : "Animations"} initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={m.sheet} className="glass-menu absolute inset-y-0 right-0 w-[min(340px,90vw)] overflow-y-auto border-l border-wipp-glass-border px-4 pt-[calc(env(safe-area-inset-top)+28px)] pb-[calc(env(safe-area-inset-bottom)+24px)] text-wipp-fg">
         <div className="mb-6 flex items-center justify-between"><h3 className="type-title2">{drawer === "card" ? "Choisir la carte" : "Animations"}</h3><Pressable aria-label="Fermer le tiroir" onClick={() => setDrawer(null)}><X size={21} /></Pressable></div>
         {drawer === "card" ? <div className="grid grid-cols-2 gap-3">{cards.map(card => <Pressable key={card.design} aria-pressed={design === card.design} onClick={() => { setDesign(card.design); setDrawer(null); haptic("light"); }} className={`surprise-option flex h-[110px] flex-col items-center justify-center rounded-[8px] text-wipp-fg ${design === card.design ? "surprise-option-active" : ""}`}><span className="text-[34px] text-wipp-surprise-bright">{card.mark}</span><span className="type-footnote">{card.label}</span></Pressable>)}</div> : <><div className="grid grid-cols-2 gap-3">{animations.map(({ name, icon: Icon, mark }) => <Pressable key={name} aria-pressed={animation === name} onClick={() => { setAnimation(name); setDrawer(null); haptic("light"); }} className={`relative flex h-[120px] flex-col items-center justify-center gap-2 overflow-hidden rounded-[8px] border text-wipp-fg ${animation === name ? "border-wipp-surprise-gold bg-wipp-surprise-choice-raised" : "border-wipp-glass-border bg-wipp-surprise-choice"}`}><span className="absolute -right-3 -top-6 text-[82px] leading-none text-wipp-fg/10">{mark}</span><Icon size={28} strokeWidth={1.4} /><span className="relative type-footnote font-semibold">{name}</span></Pressable>)}</div>
         {animation && <Pressable onClick={() => { setAnimation(null); setDrawer(null); }} className="mt-5 w-full text-center type-subhead text-wipp-muted">Retirer l’animation</Pressable>}</>}
      </motion.aside>
    </div>}</AnimatePresence>, document.body)}
  </>;
}