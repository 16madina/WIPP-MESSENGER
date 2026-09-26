import { useEffect, useRef, useState } from "react";
import { findImageSticker } from "@/lib/stickers";
import { emitStickerFx, fxFor, playStickerSound } from "@/lib/sticker-fx";
import { motion as timings } from "@/theme/theme";
import { ChromaSticker } from "./ChromaSticker";
import { GestureSticker } from "./GestureSticker";
import { StopGesture } from "./StopGesture";

/**
 * Le PNG reste intact dans une <img object-contain>. Le geste est une classe CSS (cast-go cast-<motion>) ;
 * les effets (cœurs, confettis, couronne, secousse) sont des couches séparées déclenchées par wipp-sticker-fx.
 * Toucher le sticker relance la classe et l'effet.
 */
export function AnimatedSticker({ id, size = "message", fresh = false }: { id: string; size?: "picker" | "message"; fresh?: boolean }) {
  const sticker = findImageSticker(id);
  const [run, setRun] = useState(0);
  const fired = useRef(false);
  const isPicker = size === "picker";
  const filmed = id === "mood-va-la-bas";

  const fire = () => {
    if (!sticker) return;
    const detail = fxFor(sticker);
    emitStickerFx(detail);
    playStickerSound(detail.fx);
  };

  useEffect(() => {
    if (!fresh || fired.current || isPicker || filmed) return;
    fired.current = true;
    fire();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fresh, isPicker, filmed]);

  if (!sticker) return null;
  const replay = () => {
    if (isPicker) return;
    setRun((n) => n + 1);
    if (!filmed) {
      const detail = fxFor(sticker);
      emitStickerFx(detail);
      playStickerSound(detail.fx);
    }
  };

  return (
    <span onClick={replay} className={`relative inline-flex shrink-0 items-center justify-center ${isPicker ? "h-[100px] w-full" : "h-[180px] w-[180px]"}`}>
      {filmed ? <ChromaSticker key={run} src="/stickers/fun/va-la-bas.mp4" fallback={sticker.image} label={sticker.label} size={size} /> : id === "mood-stop" ? <StopGesture key={run} src={sticker.image} label={sticker.label} ms={isPicker ? timings.stickerGestureMs : undefined} /> : <GestureSticker
        key={run}
        id={id}
        src={sticker.image}
        label={sticker.label}
        ms={isPicker ? timings.stickerPickerSeconds * 1000 : timings.stickerGestureMs}
      />}
    </span>
  );
}
