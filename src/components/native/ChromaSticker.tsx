import { useEffect, useRef, useState } from "react";
import { motion as timings } from "@/theme/theme";

/** Lit un film à fond vert sans toucher à ses poses, son texte ou sa chronologie. */
export function ChromaSticker({ src, fallback, label, size }: { src: string; fallback: string; label: string; size: "picker" | "message" }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const side = size === "picker" ? timings.stickerVideoPickerPixels : timings.stickerVideoMessagePixels;

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!video || !canvas || !context) return;
    let frame = 0;
    let last = 0;
    let stopped = false;
    const interval = 1000 / timings.stickerVideoFps;

    const draw = (now: number) => {
      if (stopped) return;
      frame = requestAnimationFrame(draw);
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || now - last < interval) return;
      last = now;
      try {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const image = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = image.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Fond vert dominant ; conserver le jaune, la peau et les autres couleurs du personnage.
          const dominance = g - Math.max(r, b);
          const alpha = Math.max(0, Math.min(1, (timings.stickerKeyGreenStrong - dominance) / (timings.stickerKeyGreenStrong - timings.stickerKeyGreenStart)));
          data[i + 3] = Math.round(data[i + 3] * alpha);
          if (alpha > 0 && alpha < 1) data[i + 1] = Math.round(g * alpha + Math.max(r, b) * (1 - alpha));
        }
        context.putImageData(image, 0, 0);
        setReady(true);
      } catch {
        setFailed(true);
        stopped = true;
        cancelAnimationFrame(frame);
      }
    };
    const start = () => { if (!frame && !stopped) frame = requestAnimationFrame(draw); };
    video.addEventListener("playing", start);
    if (!video.paused) start();
    void video.play().catch(() => setFailed(true));
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      video.removeEventListener("playing", start);
      video.pause();
    };
  }, [src, side]);

  return (
    <span className="relative block h-full w-full" aria-label={label} role="img">
      {(!ready || failed) && <img src={fallback} alt="" draggable={false} className="absolute inset-0 h-full w-full object-contain" />}
      {!failed && <>
        <video ref={videoRef} src={src} muted loop playsInline preload="auto" onError={() => setFailed(true)} aria-hidden="true" className="pointer-events-none absolute h-px w-px opacity-0" />
        <canvas ref={canvasRef} width={side} height={side} aria-hidden="true" className={`h-full w-full object-contain ${ready ? "" : "invisible"}`} />
      </>}
    </span>
  );
}