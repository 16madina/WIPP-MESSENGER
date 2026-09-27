import { useEffect, useRef } from "react";
import { playSound } from "@/lib/sticker-fx";
import { useWgoStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const SRC = "/stickers/aniwipp/bisou-green.mp4";
const POSTER = "/stickers/aniwipp/bisou-poster.png";

/** Cut the green screen out of every frame so the chat shows through. */
function keyScreen(data: ImageData) {
  const p = data.data;
  for (let i = 0; i < p.length; i += 4) {
    const r = p[i];
    const g = p[i + 1];
    const b = p[i + 2];
    const maxRB = r > b ? r : b;
    const lead = g - maxRB;
    if (g > 70 && lead > 28 && g > r + 22 && g > b + 22) {
      p[i + 3] = 0;
    } else if (lead > 8 && g > 36) {
      const t = Math.min(1, (lead - 6) / 34);
      p[i + 3] = (p[i + 3] * (1 - t)) | 0;
      p[i + 1] = (maxRB + lead * 0.18) | 0;
    }
  }
}

/** Kiss clip painted with a transparent background, never a black plate. */
export function AniClip({
  loop = false,
  cue = false,
  playKey = 0,
  className,
}: {
  loop?: boolean;
  cue?: boolean;
  playKey?: number;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useWgoStore((s) => s.a11y.reduceMotion);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || reduce) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    let alive = true;
    let raf = 0;

    function paint() {
      if (!alive || !video || !canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        keyScreen(frame);
        ctx.putImageData(frame, 0, 0);
      }
      if (!video.paused && !video.ended) raf = requestAnimationFrame(paint);
    }

    function start() {
      if (!alive || !video) return;
      video.loop = loop;
      video.currentTime = 0;
      void video.play().then(() => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(paint);
      }).catch(() => {});
    }

    if (video.readyState >= 2) start();
    else video.addEventListener("loadeddata", start, { once: true });

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      video.pause();
    };
  }, [playKey, loop, reduce]);

  useEffect(() => {
    if (!cue || reduce) return;
    const soundOn = useWgoStore.getState().a11y?.stickerSound !== false;
    const kiss = window.setTimeout(() => {
      if (soundOn) playSound("mwah");
    }, 2100);
    return () => window.clearTimeout(kiss);
  }, [cue, playKey, reduce]);

  if (reduce) {
    return <img src={POSTER} alt="" className={cn("object-contain", className)} draggable={false} />;
  }

  return (
    <div key={playKey} className={cn("ani-clip", className)} aria-hidden>
      <video ref={videoRef} src={SRC} muted playsInline preload="auto" className="ani-clip-src" />
      <canvas ref={canvasRef} width={405} height={720} />
    </div>
  );
}
