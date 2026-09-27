import { useState } from "react";
import { Download, File, FileArchive, FileAudio, FileImage, FileSpreadsheet, FileText, FileVideo, Play, RotateCcw, RotateCw } from "lucide-react";
import type { MediaItem, Message } from "@/lib/types";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

export function mediaItemsOf(m: Message): MediaItem[] {
  if (m.album?.length) return m.album;
  if (m.type === "image" && m.imageUrl) return [{ type: "image", url: m.imageUrl }];
  if (m.type === "video" && m.videoUrl) return [{ type: "video", url: m.videoUrl, duration: m.duration }];
  return [];
}

/** Superposition d’envoi / d’échec sur un média. */
function SendState({ status, onRetry }: { status: Message["status"]; onRetry?: () => void }) {
  if (status === "sending")
    return (
      <span className="absolute inset-0 flex items-center justify-center bg-ink/35" aria-label="Envoi en cours">
        <span className="size-9 animate-spin rounded-full border-[3px] border-paper/30 border-t-accent" />
      </span>
    );
  if (status === "failed")
    return (
      <button
        type="button"
        aria-label="Réessayer l’envoi"
        className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ink/55 text-paper"
        onClick={(e) => {
          e.stopPropagation();
          onRetry?.();
        }}
      >
        <RotateCcw className="size-7" />
        <span className="text-[12px] font-semibold">Réessayer</span>
      </button>
    );
  return null;
}

function Tile({ item, className }: { item: MediaItem; className?: string }) {
  return (
    <span className={cn("relative block overflow-hidden bg-navy", className)}>
      {item.type === "video" ? (
        <>
          <video src={`${item.url}#t=0.1`} muted playsInline preload="metadata" className="size-full object-cover" />
          <span className="absolute inset-0 m-auto flex size-12 items-center justify-center rounded-full bg-ink/55 backdrop-blur">
            <Play className="size-5 translate-x-px fill-paper text-paper" />
          </span>
          {item.duration ? (
            <span className="absolute bottom-1.5 left-1.5 rounded-full bg-ink/60 px-1.5 text-[11px] tabular-nums text-paper">
              {formatDuration(item.duration)}
            </span>
          ) : null}
        </>
      ) : (
        <img src={item.url} alt="" draggable={false} className="size-full object-cover" />
      )}
    </span>
  );
}

/** Carte média : 1 → grande carte ; plusieurs → mosaïque. Pas de bulle autour. */
export function MediaCard({
  message,
  mine,
  onOpen,
  onRetry,
}: {
  message: Message;
  mine: boolean;
  onOpen: (index: number) => void;
  onRetry?: () => void;
}) {
  const items = mediaItemsOf(message);
  const shown = items.slice(0, 4);
  const extra = items.length - 4;
  return (
    <div className="w-[min(72vw,270px)]">
      <div className="relative overflow-hidden rounded-2xl">
        {items.length === 1 ? (
          <button type="button" className="block w-full" aria-label="Ouvrir" onClick={(e) => { e.stopPropagation(); onOpen(0); }}>
            <Tile item={items[0]} className="aspect-[4/5] max-h-80 w-full" />
          </button>
        ) : (
          <div className={cn("grid gap-0.5", items.length === 2 ? "grid-cols-2" : "grid-cols-2 grid-rows-2")}>
            {shown.map((it, i) => (
              <button
                key={it.url + i}
                type="button"
                aria-label={`Ouvrir le média ${i + 1}`}
                className={cn("relative block", items.length === 3 && i === 0 && "row-span-2")}
                onClick={(e) => { e.stopPropagation(); onOpen(i); }}
              >
                <Tile item={it} className={cn("w-full", items.length === 2 ? "aspect-[3/4]" : items.length === 3 && i === 0 ? "h-full" : "aspect-square")} />
                {i === 3 && extra > 0 ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-ink/55 text-[22px] font-bold text-paper">+{extra}</span>
                ) : null}
              </button>
            ))}
          </div>
        )}
        {mine ? <SendState status={message.status} onRetry={onRetry} /> : null}
      </div>
      {message.text ? (
        <p className={cn("mt-1 rounded-2xl px-3 py-2 text-[15px] leading-snug", mine ? "bg-bubble-me text-bubble-me-fg" : "bg-bubble-them text-fg")}>
          {message.text}
        </p>
      ) : null}
    </div>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`;
}

function extOf(name: string) {
  const m = /\.([a-z0-9]+)$/i.exec(name);
  return m ? m[1].toUpperCase() : "FICHIER";
}

function iconFor(mime: string, ext: string) {
  if (mime.startsWith("image/")) return FileImage;
  if (mime.startsWith("video/")) return FileVideo;
  if (mime.startsWith("audio/")) return FileAudio;
  if (/ZIP|RAR|7Z|TAR|GZ/.test(ext)) return FileArchive;
  if (/XLS|XLSX|CSV|NUMBERS/.test(ext)) return FileSpreadsheet;
  if (/PDF|DOC|DOCX|TXT|RTF|PAGES|MD/.test(ext)) return FileText;
  return File;
}

/** Carte Document : icône selon le type, nom, format · taille, ouverture. */
export function FileCard({ message, mine, onRetry }: { message: Message; mine: boolean; onRetry?: () => void }) {
  const f = message.file;
  if (!f) return null;
  const ext = extOf(f.name);
  const Icon = iconFor(f.mime, ext);
  const busy = message.status === "sending" && mine;
  const failed = message.status === "failed" && mine;
  return (
    <div className={cn("flex w-[min(72vw,260px)] items-center gap-3 rounded-2xl px-3 py-2.5", mine ? "bg-bubble-me text-bubble-me-fg" : "bg-bubble-them text-fg")}>
      <span className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
        <Icon className="size-6" />
        {busy ? <span className="absolute inset-0 animate-spin rounded-xl border-2 border-transparent border-t-accent" /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold">{f.name}</span>
        <span className="block text-[12px] opacity-70">
          {busy ? "Envoi…" : failed ? "Échec de l’envoi" : `${ext} · ${formatSize(f.size)}`}
        </span>
      </span>
      {failed ? (
        <button type="button" aria-label="Réessayer" className="flex size-11 items-center justify-center" onClick={(e) => { e.stopPropagation(); onRetry?.(); }}>
          <RotateCw className="size-5" />
        </button>
      ) : (
        <a
          href={f.url}
          download={f.name}
          target="_blank"
          rel="noreferrer"
          aria-label="Ouvrir ou télécharger"
          className="flex size-11 shrink-0 items-center justify-center rounded-full"
          onClick={(e) => e.stopPropagation()}
        >
          <Download className="size-5" />
        </a>
      )}
    </div>
  );
}

/** GIF : démarre seul, se rejoue au toucher, taille raisonnable. */
export function GifMessage({ url }: { url: string }) {
  const [run, setRun] = useState(0);
  return (
    <button
      type="button"
      aria-label="Rejouer le GIF"
      className="relative block w-[min(60vw,220px)] overflow-hidden rounded-2xl"
      onClick={(e) => {
        e.stopPropagation();
        setRun((r) => r + 1);
      }}
    >
      <img key={run} src={url} alt="GIF" draggable={false} className="max-h-60 w-full object-cover" />
      <span className="absolute left-1.5 top-1.5 rounded-md bg-ink/60 px-1.5 text-[10px] font-bold text-paper">GIF</span>
    </button>
  );
}
