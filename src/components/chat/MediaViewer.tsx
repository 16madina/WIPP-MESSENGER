import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { MediaItem } from "@/lib/types";

/** Visionneuse sombre plein écran. Pincer ou toucher deux fois pour zoomer. */
export function MediaViewer({
  items,
  start = 0,
  title,
  onClose,
}: {
  items: MediaItem[];
  start?: number;
  title?: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(start);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; scale: number } | null>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const lastTap = useRef(0);
  const item = items[index];

  function reset() {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }
  function go(d: number) {
    reset();
    setIndex((i) => Math.max(0, Math.min(items.length - 1, i + d)));
  }
  function distance() {
    const [a, b] = [...pointers.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  return (
    <div className="fixed inset-0 z-[96] flex flex-col bg-ink text-paper" role="dialog" aria-label="Visionneuse">
      <div className="flex items-center justify-between px-3 pt-[max(env(safe-area-inset-top),12px)]">
        <button type="button" aria-label="Fermer" className="press flex size-11 items-center justify-center rounded-full bg-paper/10" onClick={onClose}>
          <X className="size-5" />
        </button>
        <p className="text-[13px] font-medium text-paper/70">
          {title ?? (items.length > 1 ? `${index + 1} / ${items.length}` : "")}
        </p>
        <span className="size-11" />
      </div>
      <div
        className="relative flex min-h-0 flex-1 touch-none items-center justify-center overflow-hidden"
        onPointerDown={(e) => {
          if (item?.type !== "image") return;
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pointers.current.size === 2) pinch.current = { dist: distance(), scale };
          else drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
        }}
        onPointerMove={(e) => {
          if (!pointers.current.has(e.pointerId)) return;
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pinch.current && pointers.current.size === 2) {
            setScale(Math.max(1, Math.min(4, (pinch.current.scale * distance()) / pinch.current.dist)));
          } else if (drag.current && scale > 1) {
            setPan({ x: drag.current.px + e.clientX - drag.current.x, y: drag.current.py + e.clientY - drag.current.y });
          }
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          pointers.current.delete(e.pointerId);
          if (pointers.current.size < 2) pinch.current = null;
          if (!d || pointers.current.size) return;
          drag.current = null;
          const dx = e.clientX - d.x;
          if (scale === 1 && Math.abs(dx) > 60) return go(dx < 0 ? 1 : -1);
          if (Math.abs(dx) < 6 && Math.abs(e.clientY - d.y) < 6) {
            const now = Date.now();
            if (now - lastTap.current < 300) (scale > 1 ? reset() : setScale(2.5));
            lastTap.current = now;
          }
          if (scale <= 1) setPan({ x: 0, y: 0 });
        }}
        onPointerCancel={(e) => pointers.current.delete(e.pointerId)}
      >
        {item?.type === "video" ? (
          <video key={item.url} src={item.url} controls autoPlay playsInline className="max-h-full w-full bg-black object-contain" />
        ) : item ? (
          <img
            key={item.url}
            src={item.url}
            alt=""
            draggable={false}
            className="max-h-full w-full select-none object-contain transition-transform duration-100"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
          />
        ) : null}
        {items.length > 1 && index > 0 ? (
          <button type="button" aria-label="Précédent" className="absolute left-2 flex size-11 items-center justify-center rounded-full bg-paper/10" onClick={() => go(-1)}>
            <ChevronLeft className="size-5" />
          </button>
        ) : null}
        {items.length > 1 && index < items.length - 1 ? (
          <button type="button" aria-label="Suivant" className="absolute right-2 flex size-11 items-center justify-center rounded-full bg-paper/10" onClick={() => go(1)}>
            <ChevronRight className="size-5" />
          </button>
        ) : null}
      </div>
      <div className="h-[max(env(safe-area-inset-bottom),16px)]" />
    </div>
  );
}
