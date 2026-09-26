import { useEffect, useRef, useState } from "react";
import { STICKER_PLAY_S, findImageSticker, type StickerDef } from "@/lib/stickers";
import { playStickerCue } from "@/lib/sticker-fx";

/**
 * Lecteur de stickers, repris du dépôt 16madina/wipp :
 * - sticker filmé (elle, lui, fun, fun2) : la vidéo MP4 est jouée telle quelle une fois
 *   (3,05 s), le fond vert est retiré image par image sur canvas, l'image fixe sert
 *   d'affiche et de secours ; les stickers « loopSoft » bouclent doucement ;
 * - sticker image (sig, moji, scene) : le PNG reste intact, le geste est la classe
 *   CSS cast-<motion> du dépôt, les effets et le son partent via playStickerCue.
 * La lecture démarre quand le sticker devient visible ; le toucher la relance.
 */

function keyGreen(data: ImageData) {
  const p = data.data;
  for (let i = 0; i < p.length; i += 4) {
    const r = p[i] ?? 0;
    const g = p[i + 1] ?? 0;
    const b = p[i + 2] ?? 0;
    const maxRB = Math.max(r, b);
    const greenLead = g - maxRB;
    if (g > 48 && greenLead > 14 && g > (r + b) * 0.42) {
      const spill = Math.min(1, greenLead / 36);
      p[i + 3] = Math.round((p[i + 3] ?? 0) * Math.max(0, 1 - spill * 1.35));
    } else if (g > r && g > b && greenLead > 6) {
      p[i + 1] = maxRB + Math.round(greenLead * 0.25);
    }
  }
}

function StickerClip({ row, size, autoPlay }: { row: StickerDef; size: number; autoPlay: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const played = useRef(false);
  const raf = useRef(0);

  function paint() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    if (video.readyState < 2) return;
    ctx.drawImage(video, 0, 0, w, h);
    const frame = ctx.getImageData(0, 0, w, h);
    keyGreen(frame);
    ctx.putImageData(frame, 0, 0);
  }

  function tick() {
    paint();
    const video = videoRef.current;
    if (video && !video.paused && !video.ended) {
      raf.current = requestAnimationFrame(tick);
    }
  }

  function playOnce() {
    const video = videoRef.current;
    if (!video) return;
    video.loop = Boolean(row.loopSoft);
    video.playbackRate = row.loopSoft ? 0.92 : 1;
    video.currentTime = 0;
    void video.play().then(() => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(tick);
    }).catch(() => { /* lecture refusée : l'affiche reste */ });
  }

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    const posterImg = new Image();
    posterImg.onload = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx || played.current) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(posterImg, 0, 0, canvas.width, canvas.height);
    };
    posterImg.src = row.image;

    const onTime = () => {
      if (row.loopSoft) return;
      if (video.currentTime >= STICKER_PLAY_S) {
        video.pause();
        paint();
      }
    };
    const onEnded = () => {
      if (!row.loopSoft) {
        video.pause();
        paint();
      }
    };
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("ended", onEnded);
    video.addEventListener("seeked", paint);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || played.current || !autoPlay) return;
        played.current = true;
        playOnce();
      },
      { threshold: 0.45 },
    );
    io.observe(canvas);

    return () => {
      io.disconnect();
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("seeked", paint);
      cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, row.id, autoPlay]);

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={row.label}
      className="relative block shrink-0"
      style={{ width: size, height: size }}
      onClick={(e) => { e.stopPropagation(); playOnce(); }}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); playOnce(); } }}
    >
      <video
        ref={videoRef}
        src={row.video}
        poster={row.image}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        className="pointer-events-none absolute h-px w-px opacity-0"
      />
      <canvas ref={canvasRef} aria-hidden="true" className="size-full" style={{ width: size, height: size }} />
    </span>
  );
}

const playedMoments = new Set<string>();

function CastSticker({ row, size, autoPlay, onceKey }: { row: StickerDef; size: number; autoPlay: boolean; onceKey?: string }) {
  const [play, setPlay] = useState(0);
  const box = useRef<HTMLSpanElement>(null);
  const seen = useRef(false);
  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  function go(fromTap: boolean) {
    setPlay((n) => n + 1);
    if (reduce || size < 110) return;
    if (row.moment && onceKey && !fromTap) {
      if (playedMoments.has(onceKey)) return;
      playedMoments.add(onceKey);
    }
    playStickerCue(row, true);
  }

  useEffect(() => {
    const el = box.current;
    if (!el || reduce || !autoPlay) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || seen.current) return;
        seen.current = true;
        go(false);
      },
      { threshold: 0.55 },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row.id, reduce, onceKey, autoPlay]);

  const replay = size >= 110;

  return (
    <span
      ref={box}
      role={replay ? "button" : undefined}
      tabIndex={replay ? 0 : undefined}
      aria-label={row.label}
      className="relative inline-block shrink-0"
      style={{ width: size, height: size }}
      onClick={replay ? (e) => { e.stopPropagation(); go(true); } : undefined}
      onKeyDown={(e) => { if (replay && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); go(true); } }}
    >
      <img
        key={play}
        src={row.image}
        alt=""
        draggable={false}
        className={`size-full object-contain ${!reduce && play > 0 ? `cast-go cast-${row.motion}` : ""}`}
        style={{ width: size, height: size }}
      />
    </span>
  );
}

export function AnimatedSticker({ id, size = "message", fresh = false }: { id: string; size?: "picker" | "message"; fresh?: boolean }) {
  const row = findImageSticker(id);
  if (!row) return null;
  const pixels = size === "picker" ? 100 : 180;
  // Dans le sélecteur : image fixe, jamais de lecture automatique.
  if (size === "picker") {
    return (
      <span className="relative inline-flex h-[100px] w-full items-center justify-center">
        <img src={row.image} alt={row.label} draggable={false} className="h-full w-full object-contain" />
      </span>
    );
  }
  if (row.video) return <StickerClip row={row} size={pixels} autoPlay={fresh} />;
  if (row.motion) return <CastSticker row={row} size={pixels} autoPlay={fresh} onceKey={id} />;
  return <img src={row.image} alt={row.label} width={pixels} height={pixels} draggable={false} className="shrink-0 object-contain" />;
}
