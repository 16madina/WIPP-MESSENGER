import { useEffect, useRef, useState } from "react";
import { findImageSticker } from "@/lib/stickers";
import { emitStickerFx, fxFor, playStickerSound } from "@/lib/sticker-fx";
import { motion as timings } from "@/theme/theme";
import { ChromaSticker } from "./ChromaSticker";
import { GestureSticker } from "./GestureSticker";

/**
 * Deux rendus selon le pack :
 * - sticker filmé (elle, lui, fun, fun2) : la vidéo MP4 est jouée telle quelle,
 *   le fond vert est retiré image par image sur canvas, l'image fixe sert de secours ;
 * - sticker image (sig, moji, scene) : le PNG reste intact, le geste est une couche
 *   CSS amplifiée, les effets (cœurs, confettis…) sont déclenchés par wipp-sticker-fx.
 * Toucher le sticker relance la lecture.
 */
export function AnimatedSticker({ id, size = "message", fresh = false }: { id: string; size?: "picker" | "message"; fresh?: boolean }) {
  const sticker = findImageSticker(id);
  const [run, setRun] = useState(0);
  const fired = useRef(false);
  const isPicker = size === "picker";
  const filmed = Boolean(sticker?.video);

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
    if (!filmed) fire();
  };

  return (
    <span onClick={replay} className={`relative inline-flex shrink-0 items-center justify-center ${isPicker ? "h-[100px] w-full" : "h-[180px] w-[180px]"}`}>
      {filmed ? (
        <ChromaSticker key={run} src={sticker.video!} fallback={sticker.image} label={sticker.label} size={size} />
      ) : (
        <GestureSticker
          key={run}
          id={id}
          src={sticker.image}
          label={sticker.label}
          ms={isPicker ? timings.stickerPickerSeconds * 1000 : timings.stickerGestureMs}
        />
      )}
    </span>
  );
}
