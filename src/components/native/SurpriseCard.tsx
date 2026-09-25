import { useEffect, useRef, useState, type PointerEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkle } from "lucide-react";
import artwork from "@/assets/surprise-card.jpg";
import { layout, motion as m } from "@/theme/theme";
import { haptic } from "@/lib/haptics";

export type SurpriseDesign = "heart" | "stars" | "crown" | "neon";
export type SurpriseMessage = { id: string; text: string; design: SurpriseDesign; time: string; mine: boolean };

const motifs: Record<SurpriseDesign, string> = { heart: "♥", stars: "✦", crown: "♛", neon: "♡" };
const revealedKey = (id: string) => `wipp:surprise:revealed:${id}`;

/** La surface est réellement effacée au doigt ; l'état de découverte reste sur cet appareil. */
export function SurpriseCard({ message, preview = false }: { message?: SurpriseMessage; preview?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const image = useRef<HTMLImageElement | null>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const strokes = useRef(0);
  const [revealed, setRevealed] = useState(false);
  const [started, setStarted] = useState(false);
  const [sparks, setSparks] = useState<{ id: number; x: number; y: number; dx: number; dy: number }[]>([]);

  useEffect(() => {
    setStarted(false);
    setRevealed(!preview && !!message && localStorage.getItem(revealedKey(message.id)) === "1");
  }, [message?.id, preview]);

  useEffect(() => {
    if (revealed || !message || preview) return;
    const c = canvas.current;
    const ctx = c?.getContext("2d", { willReadFrequently: true });
    if (!c || !ctx) return;
    const paint = (img: HTMLImageElement) => {
      image.current = img;
      const size = 2;
      c.width = layout.surpriseCardWidth * size;
      c.height = layout.surpriseCardHeight * size;
      ctx.setTransform(size, 0, 0, size, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, layout.surpriseCardWidth, layout.surpriseCardHeight);
    };
    const img = new Image();
    img.src = artwork;
    if (img.complete) paint(img);
    else img.onload = () => paint(img);
    return () => { img.onload = null; };
  }, [message?.id, preview, revealed]);

  const finish = () => {
    if (!message) return;
    localStorage.setItem(revealedKey(message.id), "1");
    haptic("success");
    setRevealed(true);
    setSparks(Array.from({ length: 15 }, (_, i) => ({ id: Date.now() + i, x: 130, y: 108, dx: Math.cos(i * 2.4) * 95, dy: Math.sin(i * 2.4) * 90 })));
    window.setTimeout(() => setSparks([]), 700);
  };

  const scratch = (e: PointerEvent<HTMLCanvasElement>) => {
    const c = canvas.current;
    const ctx = c?.getContext("2d", { willReadFrequently: true });
    if (!c || !ctx || !drawing.current) return;
    const box = c.getBoundingClientRect();
    const x = (e.clientX - box.left) * layout.surpriseCardWidth / box.width;
    const y = (e.clientY - box.top) * layout.surpriseCardHeight / box.height;
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = layout.surpriseScratchRadius * 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(last.current?.x ?? x, last.current?.y ?? y);
    ctx.lineTo(x, y);
    ctx.stroke();
    last.current = { x, y };
    setStarted(true);
    strokes.current++;
    if (strokes.current % 5 === 0) {
      const id = Date.now();
      setSparks((s) => [...s.slice(-12), { id, x, y, dx: Math.random() * 30 - 15, dy: Math.random() * -25 - 5 }]);
      window.setTimeout(() => setSparks((s) => s.filter((v) => v.id !== id)), 580);
    }
    if (strokes.current % 8 === 0) {
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      let erased = 0, samples = 0;
      for (let py = 0; py < c.height; py += 12) for (let px = 0; px < c.width; px += 12) {
        samples++;
        if (data[(py * c.width + px) * 4 + 3] < 64) erased++;
      }
      if (erased / samples >= m.surpriseRevealRatio) finish();
    }
  };

  return (
    <div className="relative isolate mx-auto aspect-[260/216] w-full max-w-[260px] overflow-hidden rounded-[17px] border border-wipp-surprise-line bg-wipp-surprise-ink shadow-glow" aria-label={revealed ? "Surprise découverte" : "Carte à gratter"}>
      <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-wipp-surprise-paper px-5 text-center text-wipp-surprise-ink">
        <span className="pointer-events-none absolute -left-5 -top-4 rotate-[-15deg] text-[100px] text-wipp-surprise-gold/50">✦</span>
        <span className="pointer-events-none absolute -bottom-8 -right-3 text-[112px] text-wipp-surprise-gold/50">✦</span>
        <span className="relative text-[30px] text-wipp-surprise-gold-deep">{motifs[message?.design ?? "heart"]}</span>
        <span className="relative break-words font-semibold italic text-[16px] leading-6">{preview ? "Ton message secret" : message?.text}</span>
        <span className="relative mt-3 text-[18px] font-black text-wipp-surprise-ink">ẅ</span>
      </div>
      <AnimatePresence>
        {!revealed && <motion.div className="absolute inset-0" exit={{ opacity: 0, scale: 1.08 }} transition={{ duration: 0.55 }}>
          {preview ? <img src={artwork} width={1024} height={1024} alt="" className="h-full w-full object-cover" /> : <canvas ref={canvas} className="absolute inset-0 h-full w-full touch-none" onPointerDown={(e) => { drawing.current = true; e.currentTarget.setPointerCapture(e.pointerId); scratch(e); }} onPointerMove={scratch} onPointerUp={() => { drawing.current = false; last.current = null; }} onPointerCancel={() => { drawing.current = false; last.current = null; }} />}
          <div className={`pointer-events-none absolute inset-x-0 bottom-3 flex flex-col items-center text-center text-wipp-surprise-paper transition-opacity ${started ? "opacity-0" : "opacity-100"}`}>
            <span className="font-semibold italic text-[14px]">Un message t’attend</span>
            <span className="mt-0.5 text-[10px]">Gratte pour le découvrir</span>
            <span className="mt-1 text-[19px] font-black">ẅ</span>
          </div>
          {!preview && !started && <span aria-hidden className="surprise-sweep pointer-events-none absolute left-1/2 top-[44%] text-[25px] text-wipp-surprise-paper">☝</span>}
        </motion.div>}
      </AnimatePresence>
      {sparks.map((spark) => <span key={spark.id} className="surprise-spark pointer-events-none absolute z-10 text-wipp-surprise-gold" style={{ left: `${spark.x / layout.surpriseCardWidth * 100}%`, top: `${spark.y / layout.surpriseCardHeight * 100}%`, ["--dx" as string]: `${spark.dx}px`, ["--dy" as string]: `${spark.dy}px` }}><Sparkle size={9} fill="currentColor" /></span>)}
    </div>
  );
}