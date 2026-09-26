import { useState } from "react";
import { Smile, X } from "lucide-react";
import { haptic } from "@/lib/haptics";
import { layout } from "@/theme/theme";
import { Pressable } from "./Pressable";
import { Sheet } from "./Sheet";
import { AnimatedSticker } from "./AnimatedSticker";
import { allImageStickers, elleStickers } from "@/lib/stickers";

/** Catalogue de démonstration : les images WIPP seront ajoutées collection par collection. */
const collections = [
  { id: "tout", label: "Tout", stickers: allImageStickers },
  { id: "general", label: "Général", stickers: ["❤️", "✨", "😂", "🥰", "👏", "🎉", "🌸", "💛", "😍", "😘", "👍", "🔥", "🙏", "💐", "🎁", "😎", "🤩", "😊", "💖", "🌟"] },
  { id: "pour-elle", label: "Pour elle", stickers: elleStickers },
  { id: "pour-lui", label: "Pour lui", stickers: [] },
  { id: "amusant", label: "Amusant", stickers: [] },
  { id: "drole", label: "Drôle", stickers: [] },
] as const;

export function StickerPicker({ open, onClose, onSend, onSendImage }: { open: boolean; onClose: () => void; onSend: (sticker: string) => void; onSendImage: (id: string) => void }) {
  const [active, setActive] = useState<string>("tout");
  const collection = collections.find((item) => item.id === active) ?? collections[0];
  return (
    <Sheet open={open} onClose={onClose} detent="full">
      <div className="flex h-full min-h-0 flex-col text-wipp-fg">
        <div className="flex shrink-0 items-center justify-between px-5 pb-2">
          <h2 className="type-title2">Stickers</h2>
          <Pressable aria-label="Fermer les stickers" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full bg-wipp-fg/10"><X size={21} /></Pressable>
        </div>
        <div role="tablist" aria-label="Collections de stickers" className="no-scrollbar flex shrink-0 gap-1 overflow-x-auto border-b border-wipp-sep px-3">
          {collections.map((item) => (
            <Pressable key={item.id} role="tab" id={`sticker-tab-${item.id}`} aria-controls="sticker-panel" aria-selected={active === item.id} onClick={() => { setActive(item.id); haptic("light"); }} className={`relative shrink-0 px-3 type-footnote font-semibold ${active === item.id ? "text-wipp-accent" : "text-wipp-muted"}`}>
              {item.label}
              {active === item.id && <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-wipp-accent" />}
            </Pressable>
          ))}
        </div>
        <div role="tabpanel" id="sticker-panel" aria-labelledby={`sticker-tab-${collection.id}`} className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {collection.id === "pour-elle" || collection.id === "tout" ? (
            <div className="grid grid-cols-2 gap-2 pb-4">
              {collection.stickers.map((sticker) => (
                <Pressable key={sticker.id} aria-label={`Envoyer ${sticker.label}`} onClick={() => { onSendImage(sticker.id); haptic("light"); onClose(); }} className="flex min-w-0 flex-col items-center justify-center rounded-[8px] bg-wipp-surface px-1 pb-2">
                  <AnimatedSticker id={sticker.id} size="picker" />
                  <span className="type-footnote font-semibold text-wipp-fg">{sticker.label}</span>
                </Pressable>
              ))}
            </div>
          ) : collection.id === "general" ? (
            <div className="grid grid-cols-4 gap-2">
              {collection.stickers.map((sticker, index) => (
                <Pressable key={`${sticker}-${index}`} aria-label={`Envoyer ${sticker}`} onClick={() => { onSend(sticker); haptic("light"); onClose(); }} className="flex items-center justify-center rounded-[8px] bg-wipp-surface text-[36px]" style={{ height: layout.stickerTileSize }}>
                  {sticker}
                </Pressable>
              ))}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-wipp-muted"><Smile size={38} strokeWidth={1.4} /><p className="type-subhead">Les stickers WIPP arrivent bientôt.</p></div>
          )}
        </div>
      </div>
    </Sheet>
  );
}