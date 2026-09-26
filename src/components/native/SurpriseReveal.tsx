import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createPortal } from "react-dom";
import { Sparkles } from "lucide-react";
import hourglassArt from "@/assets/surprise-hourglass.png";
import giftArt from "@/assets/surprise-gift.png";
import confettiArt from "@/assets/surprise-confetti.png";
import { SurpriseCard } from "./SurpriseCard";
import { Pressable } from "./Pressable";
import { findAnimation, type Surprise } from "@/lib/surprise";
import { motion as m } from "@/theme/theme";
import { haptic } from "@/lib/haptics";

const revealedKey = (id: string) => `wipp:surprise:revealed:${id}`;
const playedKey = (id: string) => `wipp:surprise:animation-played:${id}`;
const format = (s: number) => s >= 3600 ? `${Math.floor(s / 3600)}:${String(Math.floor(s % 3600 / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/**
 * Orchestration commune : mécanisme de révélation propre au type, puis
 * REVEAL_COMPLETE → courte pause → animation choisie (si animationId).
 */
export function SurpriseReveal({ surprise, demo = false }: { surprise: Surprise; demo?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const started = useRef(false);
  const timer = useRef<number | null>(null);
  useEffect(() => { setRevealed(!demo && localStorage.getItem(revealedKey(surprise.id)) === "1"); }, [demo, surprise.id]);
  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);
  const onRevealComplete = () => {
    if (!demo) localStorage.setItem(revealedKey(surprise.id), "1");
    setRevealed(true);
    if (!surprise.animationId || started.current || (!demo && localStorage.getItem(playedKey(surprise.id)) === "1")) return;
    started.current = true;
    if (!demo) localStorage.setItem(playedKey(surprise.id), "1");
    timer.current = window.setTimeout(() => { timer.current = null; setPlaying(true); }, m.surpriseRevealPauseMs);
  };
  const replay = () => { if (playing || timer.current !== null) return; haptic("light"); setPlaying(true); };
  const finishAnimation = useCallback(() => setPlaying(false), []);
  return <div className="flex flex-col items-center">
    {surprise.surpriseType === "scratch"
      ? <SurpriseCard demo={demo} message={{ id: surprise.id, text: surprise.message, design: surprise.designId ?? "heart", time: surprise.time, mine: surprise.mine }} onRevealComplete={onRevealComplete} />
      : <Mechanism surprise={surprise} demo={demo} onRevealComplete={onRevealComplete} />}
    {surprise.animationId && revealed && <Pressable aria-label="Rejouer l’animation" title="Rejouer l’animation" onClick={replay} disabled={playing || timer.current !== null} className="mt-1 flex min-h-11 min-w-11 items-center justify-center text-wipp-surprise-gold"><Sparkles size={19} /></Pressable>}
    <AnimationOverlay animationId={playing ? surprise.animationId : null} onDone={finishAnimation} />
  </div>;
}

function Mechanism({ surprise, demo, onRevealComplete }: { surprise: Surprise; demo: boolean; onRevealComplete: () => void }) {
  const reduced = useReducedMotion();
  const total = surprise.surpriseOptions.countdown?.seconds ?? 10;
  const [revealed, setRevealed] = useState(false);
  const [left, setLeft] = useState(total);
  useEffect(() => { if (!demo && localStorage.getItem(revealedKey(surprise.id)) === "1") setRevealed(true); }, [surprise.id, demo]);
  const reveal = () => { if (revealed) return; haptic("success"); setRevealed(true); onRevealComplete(); };
  useEffect(() => {
    if (surprise.surpriseType !== "countdown" || revealed) return;
    if (left <= 0) { reveal(); return; }
    const t = window.setTimeout(() => setLeft(v => v - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left, revealed, surprise.surpriseType]);
  const art = surprise.surpriseType === "countdown" ? hourglassArt : surprise.surpriseType === "gift" ? giftArt : confettiArt;
  const hint = surprise.surpriseType === "gift" ? "Touche le cadeau pour l’ouvrir" : "Touche pour révéler";
  return (
    <div className="surprise-option relative mx-auto flex aspect-[260/216] w-[260px] max-w-full flex-col items-center justify-center overflow-hidden rounded-[17px] px-5 text-center text-wipp-fg" aria-label={revealed ? "Surprise découverte" : "Surprise"}>
      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.button key="closed" type="button" disabled={surprise.surpriseType === "countdown"} onClick={() => { haptic("light"); reveal(); }} exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.12 }} transition={{ duration: 0.4 }} className="flex h-full w-full flex-col items-center justify-center gap-2">
            <img src={art} alt="" width={768} height={768} className="h-24 w-24 object-contain" />
            {surprise.surpriseType === "countdown"
              ? <span className="text-[30px] font-bold tabular-nums text-wipp-surprise-bright">{format(Math.max(left, 0))}</span>
              : <span className="text-[13px] font-semibold text-wipp-surprise-bright">{hint}</span>}
            <span className="text-[11px] text-wipp-surprise-secondary">Un message t’attend</span>
          </motion.button>
        ) : (
          <motion.div key="open" initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={m.spring} className="flex flex-col items-center gap-2">
            <span className="break-words text-[16px] font-semibold italic leading-6">{surprise.message}</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-wipp-surprise-secondary"><Sparkles size={11} /> Surprise découverte</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Calque transparent au-dessus de l'écran ; l'animation WIPP définitive se branchera ici par id. */
function AnimationOverlay({ animationId, onDone }: { animationId: string | null; onDone: () => void }) {
  const reduced = useReducedMotion();
  const item = findAnimation(animationId);
  useEffect(() => {
    if (!item) return;
    haptic("light");
    const t = window.setTimeout(onDone, m.surpriseAnimationMs);
    return () => window.clearTimeout(t);
  }, [item?.id, onDone]);
  if (typeof document === "undefined") return null;
  return createPortal(<AnimatePresence>{item && (
    <motion.div key={item.id} className="pointer-events-none fixed inset-0 z-[120] flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: m.surpriseAnimationExitMs / 1000 } }} aria-live="polite" aria-label={`Animation ${item.label}`}>
      <motion.img src={item.art} alt="" width={768} height={768} className="h-[min(72vw,420px)] w-[min(72vw,420px)] object-contain drop-shadow-[0_10px_28px_rgba(255,60,90,0.4)]" initial={reduced ? { opacity: 0 } : { scale: 0.35, opacity: 0, y: 36 }} animate={reduced ? { opacity: [0, 1, 1, 0] } : { scale: [0.35, 1.08, 1, 1, 0.94], opacity: [0, 1, 1, 1, 0], y: [36, 0, -10, 8, -18] }} transition={{ duration: m.surpriseAnimationMs / 1000, times: reduced ? [0, 0.08, 0.86, 1] : [0, 0.14, 0.34, 0.82, 1], ease: "easeOut" }} />
    </motion.div>
  )}</AnimatePresence>, document.body);
}
