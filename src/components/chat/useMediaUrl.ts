import { useCallback, useEffect, useState } from "react";
import type { Message } from "@/lib/types";

type DlState = "idle" | "downloading" | "ready" | "failed";
const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

function localUrl(m: Message) {
  return m.imageUrl || m.videoUrl || m.audioUrl || m.gifUrl || m.file?.url || undefined;
}

/**
 * Donne l'URL affichable d'un média. Pour un média reçu d'un vrai compte,
 * télécharge et déchiffre sur l'appareil, avec progression et réessai.
 */
export function useMediaUrl(m: Message, opts: { auto?: boolean } = {}) {
  const auto = opts.auto ?? true;
  const remote = Boolean(m.attachmentId && m.mediaKey && m.mediaChunks?.length);
  const initial = localUrl(m) || (m.attachmentId ? cache.get(m.attachmentId) : undefined);
  const [url, setUrl] = useState<string | undefined>(initial);
  const [state, setState] = useState<DlState>(initial ? "ready" : "idle");
  const [progress, setProgress] = useState(0);

  const start = useCallback(async () => {
    if (!m.attachmentId || !m.mediaKey || !m.mediaChunks?.length) return undefined;
    const known = cache.get(m.attachmentId);
    if (known) {
      setUrl(known);
      setState("ready");
      return known;
    }
    const { localBlobs } = await import("@/lib/messaging/send-media");
    const mine = localBlobs.get(m.attachmentId);
    if (mine) {
      cache.set(m.attachmentId, mine);
      setUrl(mine);
      setState("ready");
      return mine;
    }
    setState("downloading");
    setProgress(0);
    try {
      let job = inflight.get(m.attachmentId);
      if (!job) {
        const { downloadCipherFile } = await import("@/lib/messaging/media-upload");
        job = downloadCipherFile({
          attachmentId: m.attachmentId,
          fileKey: m.mediaKey,
          chunks: m.mediaChunks,
          mime: m.mediaMime || m.file?.mime,
          onProgress: setProgress,
        });
        inflight.set(m.attachmentId, job);
      }
      const out = await job;
      inflight.delete(m.attachmentId);
      cache.set(m.attachmentId, out);
      setUrl(out);
      setState("ready");
      return out;
    } catch (err) {
      inflight.delete(m.attachmentId);
      console.warn("[wipp] media download failed", err);
      setState("failed");
      return undefined;
    }
  }, [m.attachmentId, m.mediaKey, m.mediaChunks, m.mediaMime, m.file?.mime]);

  useEffect(() => {
    const direct = localUrl(m);
    if (direct) {
      setUrl(direct);
      setState("ready");
      return;
    }
    if (remote && auto && !m.viewOnce && state === "idle") void start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remote, auto, m.viewOnce, localUrl(m)]);

  return { url, state, progress, start, remote };
}
