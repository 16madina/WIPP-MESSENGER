import { useEffect, useRef, useState } from "react";
import { haptic } from "@/lib/haptics";
import { playSound } from "@/lib/sticker-fx";
import { useWgoStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const HEAD = "/stickers/aniwipp/stop-head.png";
const SLIDE = "/stickers/aniwipp/stop-body.png";
const HAND = "/stickers/aniwipp/stop-hand.png";
const WORD = "/stickers/aniwipp/stop-text.png";

/** Layered Stop. Pixels are the original artwork, only moved. */
export function AniStop({
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
  const reduce = useWgoStore((s) => s.a11y.reduceMotion);

  useEffect(() => {
    if (!cue || reduce) return;
    const soundOn = useWgoStore.getState().a11y?.stickerSound !== false;
    const whoosh = window.setTimeout(() => {
      if (soundOn) playSound("whoosh");
    }, 1700);
    const hit = window.setTimeout(() => {
      if (soundOn) playSound("pop");
      haptic("success");
    }, 2080);
    return () => {
      window.clearTimeout(whoosh);
      window.clearTimeout(hit);
    };
  }, [cue, playKey, reduce]);
  if (reduce) {
    return <img src="/stickers/aniwipp/stop-full.png" alt="" className={cn("object-contain", className)} draggable={false} />;
  }

  return (
    <div key={playKey} className={cn("ani-stop", loop && "is-loop", className)} aria-hidden>
      <img src={HEAD} alt="" draggable={false} className="ani-piece ani-head" />
      <img src={SLIDE} alt="" draggable={false} className="ani-piece ani-slide" />
      <img src={HAND} alt="" draggable={false} className="ani-piece ani-hand" />
      <img src={WORD} alt="" draggable={false} className="ani-piece ani-word" />
      <span className="ani-flash" />
      <span className="ani-flash ani-flash-2" />
    </div>
  );
}
