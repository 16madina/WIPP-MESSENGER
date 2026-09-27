import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createPortal } from "react-dom";
import { ArrowLeft, Camera, ChevronRight, Clock3, Eye, FileText, Gift, Images, MapPin, PartyPopper, Smile, Sparkles, UserRound, WandSparkles, X } from "lucide-react";
import shareGift from "@/assets/share-gift.png";
import scratchArt from "@/assets/surprise-scratch.png";
import hourglassArt from "@/assets/surprise-hourglass.png";
import giftArt from "@/assets/surprise-gift.png";
import confettiArt from "@/assets/surprise-confetti.png";
import { Pressable } from "./Pressable";
import { Sheet } from "./Sheet";
import { SurpriseReveal } from "./SurpriseReveal";
import { amourAnimations, countdownChoices, defaultDesign, defaultOptions, designPicker, findAnimation, surpriseAnimationCategories, surpriseDesigns, type Surprise, type SurpriseOptions, type SurpriseType } from "@/lib/surprise";
import { SurpriseAssistant } from "./SurpriseAssistant";
import { layout, motion as m } from "@/theme/theme";
import { haptic } from "@/lib/haptics";
import { chats } from "@/data/mock";

type Stage = "closed" | "share" | "compose" | "contacts";
type SurpriseKind = SurpriseType;
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

/** Parcours local de composition ; seuls les messages à gratter sont simulés dans la conversation. */
export function SurpriseFlow({ onSend, onShareContent, onOpenStickers, onUnavailable, autoOpen = false }: { onSend: (surprise: Surprise) => void; onShareContent: (text: string) => void; onOpenStickers: () => void; onUnavailable: (label: string) => void; autoOpen?: boolean }) {
  const reducedMotion = useReducedMotion();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const documentRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("closed");
  const [secret, setSecret] = useState("");
  const [kind, setKind] = useState<SurpriseKind>("scratch");
  const [design, setDesign] = useState<string | null>(defaultDesign("scratch"));
  const [surpriseOptions, setSurpriseOptions] = useState<SurpriseOptions>(defaultOptions("scratch"));
  const [animation, setAnimation] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<"animation" | "card" | null>(null);
  const [animationCategory, setAnimationCategory] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewRun, setPreviewRun] = useState(0);
  useEffect(() => { if (autoOpen) setStage("share"); }, [autoOpen]);
  const close = () => { setShowPreview(false); setDrawer(null); setAnimationCategory(null); setStage("closed"); };
  const selectedOption = options.find(option => option.id === kind) ?? options[0];
  const selectedAnimation = findAnimation(animation);
  const picker = designPicker[kind];
  const PickerIcon = picker.icon;
  const chooseKind = (id: SurpriseKind) => { if (id !== kind) { setKind(id); setDesign(defaultDesign(id)); setSurpriseOptions(defaultOptions(id)); } haptic("light"); };
  const draft = (id: string): Surprise => ({ id, message: secret.trim() || "Ton message secret", surpriseType: kind, designId: design, animationId: animation, surpriseOptions, mine: true, time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) });
  const chooseContent = (label: string) => {
    if (label === "Galerie") galleryRef.current?.click();
    else if (label === "Caméra") cameraRef.current?.click();
    else if (label === "Document") documentRef.current?.click();
    else if (label === "Stickers") { close(); window.setTimeout(onOpenStickers, 0); }
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
    onSend(draft(`surprise-${Date.now()}`));
    haptic("success");
    setSecret("");
    close();
  };
  return <>
    {!autoOpen && <Pressable aria-label="Ouvrir le menu Partager" onClick={() => { haptic("light"); setStage("share"); }} className="text-wipp-muted"><span className="flex h-8 w-8 items-center justify-center rounded-full border border-wipp-muted/60 text-[25px] font-light leading-none">+</span></Pressable>}
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
        {stage === "contacts" && <div className="px-4 text-wipp-fg">
          <div className="mb-4 flex items-center justify-between"><h2 className="type-title2">Contact</h2><Pressable aria-label="Retour au partage" onClick={() => setStage("share")}><X size={22} /></Pressable></div>
          <div className="max-h-[310px] overflow-y-auto">{chats.map(chat => <Pressable key={chat.id} onClick={() => { onShareContent(`👤 ${chat.name}`); close(); }} className="flex w-full items-center border-b border-wipp-glass-border py-2 text-left type-body">{chat.name}</Pressable>)}</div>
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
              <Pressable onClick={() => { setAnimationCategory(null); setDrawer("animation"); haptic("light"); }} className="surprise-action flex items-center gap-2 rounded-[10px] px-2.5 text-left text-wipp-fg"><WandSparkles size={23} className="shrink-0 text-wipp-surprise-bright" /><span className="min-w-0 flex-1 text-[12px] font-semibold leading-tight">Ajouter une animation</span><ChevronRight size={17} className="shrink-0 text-wipp-surprise-bright" /></Pressable>
             <Pressable onClick={() => { setDrawer("card"); haptic("light"); }} className="surprise-action flex items-center gap-2 rounded-[10px] px-2.5 text-left text-wipp-fg"><PickerIcon size={23} className="shrink-0 text-wipp-surprise-bright" /><span className="min-w-0 flex-1 text-[12px] font-semibold leading-tight">{picker.label}</span><ChevronRight size={17} className="shrink-0 text-wipp-surprise-bright" /></Pressable>
           </div>
           <div className="mt-2.5 px-0.5"><h3 className="text-[18px] font-bold leading-6">Choisis le type de surprise</h3><p className="text-[12px] text-wipp-surprise-secondary">Comment veux-tu révéler ton message ?</p></div>
           <div className="mt-2 grid grid-cols-2 gap-2" role="group" aria-label="Type de surprise">
             {options.map(({ id, title, description, icon: Icon, art }) => <Pressable key={id} aria-pressed={kind === id} onClick={() => chooseKind(id)} className={`surprise-option relative flex flex-col overflow-hidden rounded-[12px] px-2.5 pb-2.5 pt-1 text-left text-wipp-fg ${kind === id ? "surprise-option-active" : ""}`} style={{ height: layout.surpriseOptionHeight }}>
               <span className="absolute left-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-wipp-surprise-bright text-wipp-surprise-bright"><Icon size={16} strokeWidth={1.8} /></span>
               <img src={art} alt="" width={768} height={768} loading="lazy" className="mx-auto w-[90%] shrink-0 object-contain" style={{ height: layout.surpriseArtworkHeight }} />
               <span className="block text-[13px] font-semibold leading-4">{title}</span>
               <span className="mt-0.5 line-clamp-2 text-[11px] leading-[14px] text-wipp-surprise-secondary">{description}</span>
             </Pressable>)}
           </div>
            {selectedAnimation && <motion.div key={animation} initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }} transition={m.spring} className="mt-2 flex items-center justify-center gap-2 text-wipp-surprise-bright"><img src={selectedAnimation.art} alt="" width={512} height={512} className="h-8 w-8 rounded-full object-cover" /><span className="text-[12px]">Animation : {selectedAnimation.label}</span></motion.div>}
         </div>
          <div className="shrink-0 space-y-2 px-3.5 pt-1 pb-1">
            <Pressable onClick={() => { setPreviewRun(run => run + 1); setShowPreview(true); haptic("light"); }} className="surprise-action flex w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold text-wipp-surprise-bright"><Eye size={19} />Aperçu</Pressable>
            <Pressable onClick={send} disabled={!secret.trim()} className="surprise-send flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-[16px] font-bold text-wipp-surprise-ink">Envoyer la surprise <Sparkles size={19} /></Pressable>
          </div>
      </div>)}
    </Sheet>
     {typeof document !== "undefined" && createPortal(<AnimatePresence>{drawer && stage === "compose" && <div className="fixed inset-0 z-[90]">
       <motion.div className="absolute inset-0 bg-wipp-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(null)} />
       <motion.aside role="dialog" aria-modal="true" aria-label={drawer === "card" ? picker.label : "Animations"} initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={m.sheet} className="glass-menu absolute inset-y-0 right-0 w-[min(340px,90vw)] overflow-y-auto border-l border-wipp-glass-border px-4 pt-[calc(env(safe-area-inset-top)+28px)] pb-[calc(env(safe-area-inset-bottom)+24px)] text-wipp-fg">
          <div className="mb-6 flex items-center justify-between"><div className="flex min-w-0 items-center gap-2">{drawer === "animation" && animationCategory === "amour" && <Pressable aria-label="Retour aux catégories" onClick={() => setAnimationCategory(null)} className="flex h-11 w-11 shrink-0 items-center justify-center"><ArrowLeft size={22} /></Pressable>}<h3 className="type-title2">{drawer === "card" ? picker.label : animationCategory === "amour" ? "Amour" : "Ajouter une animation"}</h3></div><Pressable aria-label="Fermer le tiroir" onClick={() => setDrawer(null)}><X size={21} /></Pressable></div>
          {drawer === "card" ? <div className="space-y-4">
            {surpriseDesigns[kind].length > 0 ? <div className="grid grid-cols-2 gap-3">{surpriseDesigns[kind].map(card => <Pressable key={card.id} aria-pressed={design === card.id} onClick={() => { setDesign(card.id); setDrawer(null); haptic("light"); }} className={`surprise-option flex h-[110px] flex-col items-center justify-center rounded-[8px] text-wipp-fg ${design === card.id ? "surprise-option-active" : ""}`}>{card.art ? <img src={card.art} alt="" className="h-16 w-16 object-contain" /> : <span className="text-[34px] text-wipp-surprise-bright">{card.mark}</span>}<span className="type-footnote">{card.label}</span></Pressable>)}</div>
              : <p className="type-subhead text-wipp-muted">Les styles arrivent bientôt.</p>}
            {kind === "countdown" && <div><h4 className="mb-2 type-headline">Durée</h4><div className="grid grid-cols-2 gap-3">{countdownChoices.map(choice => <Pressable key={choice.seconds} aria-pressed={surpriseOptions.countdown?.seconds === choice.seconds} onClick={() => { setSurpriseOptions({ countdown: { seconds: choice.seconds } }); haptic("light"); }} className={`surprise-option flex h-14 items-center justify-center rounded-[8px] type-footnote font-semibold text-wipp-fg ${surpriseOptions.countdown?.seconds === choice.seconds ? "surprise-option-active" : ""}`}>{choice.label}</Pressable>)}</div></div>}
           </div> : <><div className="grid grid-cols-2 gap-3">{(animationCategory === "amour" ? amourAnimations : surpriseAnimationCategories).map(({ id, label: name, art }) => <Pressable key={id} aria-pressed={animation === id} onClick={() => { if (id === "amour" && animationCategory === null) { setAnimationCategory("amour"); haptic("light"); return; } setAnimation(id); setDrawer(null); setAnimationCategory(null); haptic("light"); }} className={`relative flex flex-col items-center justify-center overflow-hidden rounded-[8px] border text-wipp-fg ${animation === id ? "border-wipp-surprise-gold bg-wipp-surprise-choice-raised" : "border-wipp-glass-border bg-wipp-surprise-choice"}`} style={{ height: layout.surpriseAnimationTileHeight }}><img src={art} alt="" width={512} height={512} className="h-[78%] w-full object-contain" /><span className="relative type-footnote font-semibold">{name}</span>{id === "amour" && animationCategory === null && <ChevronRight size={16} className="absolute right-2 top-2 text-wipp-surprise-bright" />}</Pressable>)}</div>
         {animation && <Pressable onClick={() => { setAnimation(null); setDrawer(null); }} className="mt-5 w-full text-center type-subhead text-wipp-muted">Retirer l’animation</Pressable>}</>}
      </motion.aside>
    </div>}</AnimatePresence>, document.body)}
      {typeof document !== "undefined" && createPortal(<AnimatePresence>{showPreview && stage === "compose" && <div className="fixed inset-0 z-[100] flex items-center justify-center px-5" role="presentation">
        <motion.div className="absolute inset-0 bg-wipp-backdrop backdrop-blur-[var(--wipp-blur-backdrop)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPreview(false)} />
        <motion.div role="dialog" aria-modal="true" aria-label="Aperçu de la surprise" initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} transition={m.spring} className="relative w-full max-w-[360px] overflow-hidden rounded-[20px] border border-wipp-surprise-line bg-wipp-surprise-panel px-4 pb-5 pt-3 text-center text-wipp-fg shadow-lift">
          <div className="flex items-center justify-between"><span className="text-[13px] font-semibold text-wipp-surprise-secondary">Aperçu · {selectedOption.title}</span><Pressable aria-label="Fermer l’aperçu" onClick={() => setShowPreview(false)} className="flex h-11 w-11 items-center justify-center rounded-full text-wipp-fg"><X size={22} /></Pressable></div>
          <div className="mb-4 mt-1 flex items-center justify-center gap-2 text-[21px] font-bold">Surprise <Sparkles size={21} className="text-wipp-surprise-bright" /></div>
          {selectedAnimation && <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={m.spring} className="mb-3 flex items-center justify-center gap-2 text-[13px] text-wipp-surprise-bright"><img src={selectedAnimation.art} alt="" width={512} height={512} className="h-11 w-11 rounded-full object-cover" />Animation après la révélation : {selectedAnimation.label}</motion.div>}
          <SurpriseReveal key={previewRun} demo surprise={draft(`preview-${previewRun}`)} />
          <Pressable onClick={() => setShowPreview(false)} className="surprise-action mt-5 w-full rounded-full text-[15px] font-semibold text-wipp-surprise-bright">Retour à ma surprise</Pressable>
        </motion.div>
      </div>}</AnimatePresence>, document.body)}
  </>;
}