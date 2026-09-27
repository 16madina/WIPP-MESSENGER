import { useEffect, useRef, useState } from "react";
import { Play, Plus, Send, X } from "lucide-react";
import type { MediaItem } from "@/lib/types";
import { readImageFile, readVideoFile } from "@/components/gallery";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

async function toItems(files: File[]): Promise<MediaItem[]> {
  const out: MediaItem[] = [];
  for (const f of files) {
    try {
      if (f.type.startsWith("video/")) {
        const clip = await readVideoFile(f);
        out.push({ type: "video", url: clip.url, duration: Math.max(1, Math.round(clip.durationMs / 1000)) });
      } else if (f.type.startsWith("image/")) {
        out.push({ type: "image", url: await readImageFile(f) });
      }
    } catch {
      /* fichier illisible ou vidéo trop longue */
    }
  }
  return out;
}

/** Aperçu plein écran avant envoi : retirer, ajouter, légende, Voir une fois. */
export function MediaComposer({
  files,
  onClose,
  onSend,
}: {
  files: File[];
  onClose: () => void;
  onSend: (items: MediaItem[], caption: string, viewOnce: boolean) => void;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [caption, setCaption] = useState("");
  const [once, setOnce] = useState(false);
  const addRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    void toItems(files).then((it) => alive && setItems(it));
    return () => {
      alive = false;
    };
  }, [files]);

  const shown = items[Math.min(current, items.length - 1)];

  function remove(i: number) {
    const next = items.filter((_, k) => k !== i);
    if (!next.length) return onClose();
    setItems(next);
    setCurrent((c) => Math.min(c, next.length - 1));
  }

  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-ink text-paper" role="dialog" aria-label="Aperçu avant envoi">
      <div className="flex items-center justify-between px-3 pt-[max(env(safe-area-inset-top),12px)]">
        <button type="button" aria-label="Fermer" className="press flex size-11 items-center justify-center rounded-full bg-paper/10" onClick={onClose}>
          <X className="size-5" />
        </button>
        <button
          type="button"
          aria-pressed={once}
          aria-label="Voir une fois"
          className={cn(
            "press flex h-11 items-center gap-2 rounded-full px-3 text-[13px] font-semibold",
            once ? "bg-accent text-accent-fg" : "bg-paper/10 text-paper",
          )}
          onClick={() => setOnce((v) => !v)}
        >
          <span className={cn("flex size-6 items-center justify-center rounded-full text-[12px] font-bold ring-1", once ? "ring-accent-fg" : "ring-paper/60")}>1</span>
          Voir une fois
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center p-3">
        {!shown ? (
          <span className="size-8 animate-spin rounded-full border-2 border-paper/30 border-t-accent" />
        ) : shown.type === "video" ? (
          <video key={shown.url} src={shown.url} controls playsInline className="max-h-full w-full rounded-2xl bg-black object-contain" />
        ) : (
          <img key={shown.url} src={shown.url} alt="" className="max-h-full w-full rounded-2xl object-contain" draggable={false} />
        )}
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 pb-2">
        {items.map((it, i) => (
          <div key={it.url} className="relative shrink-0">
            <button
              type="button"
              aria-label={`Média ${i + 1}`}
              className={cn("block size-16 overflow-hidden rounded-xl ring-2", i === current ? "ring-accent" : "ring-transparent")}
              onClick={() => setCurrent(i)}
            >
              {it.type === "video" ? (
                <span className="relative block size-full">
                  <video src={it.url} muted playsInline preload="metadata" className="size-full object-cover" />
                  <Play className="absolute inset-0 m-auto size-5 fill-paper" />
                </span>
              ) : (
                <img src={it.url} alt="" className="size-full object-cover" draggable={false} />
              )}
            </button>
            <button
              type="button"
              aria-label="Retirer"
              className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full bg-ink ring-1 ring-paper/40"
              onClick={() => remove(i)}
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          aria-label="Ajouter des photos"
          className="press flex size-16 shrink-0 items-center justify-center rounded-xl bg-paper/10 ring-1 ring-paper/20"
          onClick={() => addRef.current?.click()}
        >
          <Plus className="size-6" />
        </button>
      </div>

      <div className="flex items-end gap-2 px-3 pb-[max(env(safe-area-inset-bottom),12px)] pt-1">
        <textarea
          rows={1}
          value={caption}
          maxLength={1000}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Ajouter une légende…"
          className="max-h-28 min-h-11 flex-1 resize-none rounded-3xl bg-paper/10 px-4 py-3 text-[15px] outline-none placeholder:text-paper/50"
        />
        <button
          type="button"
          aria-label="Envoyer"
          disabled={!items.length}
          className="press flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg disabled:opacity-40"
          onClick={() => onSend(items, caption.trim(), once)}
        >
          <Send className="size-5" />
        </button>
      </div>
      {shown?.type === "video" && shown.duration ? (
        <span className="sr-only">Durée {formatDuration(shown.duration)}</span>
      ) : null}
      <input
        ref={addRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          const more = Array.from(e.target.files ?? []);
          e.target.value = "";
          void toItems(more).then((it) => setItems((prev) => [...prev, ...it]));
        }}
      />
    </div>
  );
}
