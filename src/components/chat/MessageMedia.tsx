import { useState } from "react";
import {
  Download,
  ExternalLink,
  File,
  FileArchive,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  MapPin,
  Play,
  RotateCcw,
} from "lucide-react";
import type { MediaItem, Message } from "@/lib/types";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMediaUrl } from "./useMediaUrl";
import { useLinkPreview } from "./useLinkPreview";

export function mediaItemsOf(m: Message): MediaItem[] {
  if (m.album?.length) return m.album;
  if (m.type === "image" && m.imageUrl) return [{ type: "image", url: m.imageUrl }];
  if (m.type === "video" && m.videoUrl) return [{ type: "video", url: m.videoUrl, duration: m.duration }];
  return [];
}

/** Anneau de progression WIPP (jaune sur voile sombre). */
export function ProgressRing({ value, size = 44 }: { value: number; size?: number }) {
  const r = size / 2 - 3;
  const c = 2 * Math.PI * r;
  const v = Math.max(0.04, Math.min(1, value));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={3} className="stroke-paper/25" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={3}
        strokeLinecap="round"
        className="stroke-accent transition-[stroke-dashoffset] duration-300"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - v)}
      />
    </svg>
  );
}

/** Voile d’état : préparation, envoi, téléchargement, échec + Réessayer. */
function StateVeil({
  phase,
  progress,
  onRetry,
}: {
  phase: "busy" | "failed" | null;
  progress: number;
  onRetry?: () => void;
}) {
  if (phase === "busy")
    return (
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ink/40" aria-label="Chargement">
        <ProgressRing value={progress} />
        <span className="text-[11px] font-semibold tabular-nums text-paper">{Math.round(progress * 100)} %</span>
      </span>
    );
  if (phase === "failed")
    return (
      <button
        type="button"
        aria-label="Réessayer"
        className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ink/60 text-paper"
        onClick={(e) => {
          e.stopPropagation();
          onRetry?.();
        }}
      >
        <span className="receipt-fail">!</span>
        <RotateCcw className="size-6" />
        <span className="text-[12px] font-semibold">Réessayer</span>
      </button>
    );
  return null;
}

function Tile({ item, className }: { item: MediaItem; className?: string }) {
  return (
    <span className={cn("relative block overflow-hidden bg-navy", className)}>
      {item.url ? (
        item.type === "video" ? (
          <>
            <video src={`${item.url}#t=0.1`} muted playsInline preload="metadata" className="size-full object-cover" />
            <span className="absolute inset-0 m-auto flex size-12 items-center justify-center rounded-full bg-ink/55 backdrop-blur">
              <Play className="size-5 translate-x-px fill-paper text-paper" />
            </span>
          </>
        ) : (
          <img src={item.url} alt="" draggable={false} className="size-full object-cover" />
        )
      ) : (
        <span className="absolute inset-0 animate-pulse bg-surface-2" />
      )}
      {item.type === "video" && item.duration ? (
        <span className="absolute bottom-1.5 left-1.5 rounded-full bg-ink/60 px-1.5 text-[11px] tabular-nums text-paper">
          {formatDuration(item.duration)}
        </span>
      ) : null}
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
  onOpen: (index: number, items: MediaItem[]) => void;
  onRetry?: () => void;
}) {
  const dl = useMediaUrl(message);
  const local = mediaItemsOf(message);
  const kind = message.type === "video" ? "video" : "image";
  const items: MediaItem[] = local.length ? local : [{ type: kind, url: dl.url ?? "", duration: message.duration }];
  const shown = items.slice(0, 4);
  const extra = items.length - 4;
  const uploading = mine && message.status === "sending";
  const phase =
    mine && message.status === "failed"
      ? "failed"
      : uploading || dl.state === "downloading"
        ? "busy"
        : !mine && dl.state === "failed"
          ? "failed"
          : null;
  const progress = uploading ? (message.progress ?? 0.05) : dl.progress;
  const open = (i: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (items[i]?.url) onOpen(i, items);
  };
  return (
    <div className="w-[min(72vw,270px)]">
      <div className="relative overflow-hidden rounded-2xl">
        {items.length === 1 ? (
          <button type="button" className="block w-full" aria-label="Ouvrir" onClick={open(0)}>
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
                onClick={open(i)}
              >
                <Tile
                  item={it}
                  className={cn("w-full", items.length === 2 ? "aspect-[3/4]" : items.length === 3 && i === 0 ? "h-full" : "aspect-square")}
                />
                {i === 3 && extra > 0 ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-ink/55 text-[22px] font-bold text-paper">+{extra}</span>
                ) : null}
              </button>
            ))}
          </div>
        )}
        <StateVeil phase={phase} progress={progress} onRetry={mine ? onRetry : () => void dl.start()} />
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
  if (!bytes) return "";
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

/** Carte Document : icône selon le type, format · taille, barre de progression. */
export function FileCard({ message, mine, onRetry }: { message: Message; mine: boolean; onRetry?: () => void }) {
  const dl = useMediaUrl(message, { auto: false });
  const f = message.file;
  if (!f) return null;
  const ext = extOf(f.name);
  const Icon = iconFor(f.mime, ext);
  const uploading = mine && message.status === "sending";
  const downloading = dl.state === "downloading";
  const failed = (mine && message.status === "failed") || (!mine && dl.state === "failed");
  const progress = uploading ? (message.progress ?? 0.05) : dl.progress;
  const size = formatSize(f.size);
  const status = uploading
    ? `Envoi… ${Math.round(progress * 100)} %`
    : downloading
      ? `Téléchargement… ${Math.round(progress * 100)} %`
      : failed
        ? "Échec — touche pour réessayer"
        : [ext, size].filter(Boolean).join(" · ");

  async function openFile(e: React.MouseEvent) {
    e.stopPropagation();
    if (failed) {
      if (mine) onRetry?.();
      else void dl.start();
      return;
    }
    const url = dl.url ?? (await dl.start());
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = f!.name;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.click();
  }

  return (
    <button
      type="button"
      onClick={openFile}
      aria-label={`${f.name}, ${status}`}
      className={cn(
        "relative flex w-[min(72vw,260px)] items-center gap-3 overflow-hidden rounded-2xl px-3 py-2.5 text-left",
        mine ? "bg-bubble-me text-bubble-me-fg" : "bg-bubble-them text-fg",
      )}
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
        <Icon className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold">{f.name}</span>
        <span className={cn("block text-[12px]", failed ? "text-danger" : "opacity-70")}>{status}</span>
      </span>
      <span className="flex size-9 shrink-0 items-center justify-center">
        {failed ? <RotateCcw className="size-5 text-danger" /> : <Download className="size-5" />}
      </span>
      {uploading || downloading ? (
        <span className="absolute inset-x-3 bottom-1 h-1 overflow-hidden rounded-full bg-paper/15">
          <span className="block h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${Math.max(4, progress * 100)}%` }} />
        </span>
      ) : null}
    </button>
  );
}

/** GIF : démarre seul, se rejoue au toucher, taille raisonnable. */
export function GifMessage({ message }: { message: Message }) {
  const dl = useMediaUrl(message);
  const [run, setRun] = useState(0);
  return (
    <button
      type="button"
      aria-label="Rejouer le GIF"
      className="relative block w-[min(60vw,220px)] overflow-hidden rounded-2xl"
      onClick={(e) => {
        e.stopPropagation();
        if (dl.state === "failed") void dl.start();
        else setRun((r) => r + 1);
      }}
    >
      {dl.url ? (
        <img key={run} src={dl.url} alt="GIF" draggable={false} className="max-h-60 w-full object-cover" />
      ) : (
        <span className="block aspect-square w-full animate-pulse bg-surface-2" />
      )}
      <span className="absolute left-1.5 top-1.5 rounded-md bg-ink/60 px-1.5 text-[10px] font-bold text-paper">GIF</span>
      <StateVeil phase={dl.state === "downloading" ? "busy" : dl.state === "failed" ? "failed" : null} progress={dl.progress} />
    </button>
  );
}

/** Carte position : aperçu carte, coordonnées ou adresse, bouton Ouvrir la carte. */
export function LocationCard({ message, mine }: { message: Message; mine: boolean }) {
  const g = message.geo;
  if (!g) return null;
  const d = 0.004;
  const bbox = `${g.lon - d},${g.lat - d},${g.lon + d},${g.lat + d}`;
  const mapUrl = `https://www.openstreetmap.org/?mlat=${g.lat}&mlon=${g.lon}#map=16/${g.lat}/${g.lon}`;
  return (
    <div className={cn("w-[min(72vw,260px)] overflow-hidden rounded-2xl", mine ? "bg-bubble-me text-bubble-me-fg" : "bg-bubble-them text-fg")}>
      <div className="relative h-32 w-full bg-navy">
        <iframe
          title="Aperçu de la position"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${g.lat},${g.lon}`}
          className="pointer-events-none size-full border-0 opacity-90"
          loading="lazy"
        />
      </div>
      <div className="flex items-center gap-2 px-3 py-2">
        <MapPin className="size-5 shrink-0 text-accent" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold">{message.geoLive ? "Position en direct" : message.text || "Position partagée"}</span>
          <span className="block text-[12px] tabular-nums opacity-70">
            {g.lat.toFixed(5)}, {g.lon.toFixed(5)}
          </span>
        </span>
      </div>
      <a
        href={mapUrl}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex h-11 items-center justify-center gap-1.5 border-t border-paper/10 text-[13px] font-semibold text-accent"
      >
        Ouvrir la carte <ExternalLink className="size-3.5" />
      </a>
    </div>
  );
}

/** Aperçu de lien intégré au style WIPP, sous le texte du message. */
export function LinkPreview({ card }: { card: NonNullable<Message["linkCard"]> }) {
  let domain = card.url;
  try {
    domain = new URL(card.url).hostname.replace(/^www\./, "");
  } catch {
    /* garde l’URL brute */
  }
  return (
    <a
      href={card.url}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="mt-1.5 block overflow-hidden rounded-xl bg-ink/25 ring-1 ring-paper/10"
    >
      {card.image ? <img src={card.image} alt="" className="h-28 w-full object-cover" draggable={false} /> : null}
      <span className="block px-2.5 py-2">
        <span className="block text-[11px] uppercase tracking-wide opacity-60">{domain}</span>
        {card.title ? <span className="line-clamp-2 block text-[13px] font-semibold">{card.title}</span> : null}
        {card.description ? <span className="line-clamp-2 block text-[12px] opacity-75">{card.description}</span> : null}
      </span>
    </a>
  );
}

/** Aperçu automatique si le texte contient une URL. */
export function AutoLinkPreview({ text, preset }: { text?: string; preset?: Message["linkCard"] }) {
  const card = useLinkPreview(text, preset);
  return card ? <LinkPreview card={card} /> : null;
}
