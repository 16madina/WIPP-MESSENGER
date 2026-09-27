/**
 * Envoi réel des médias dans les conversations entre vrais comptes.
 * Le fichier est chiffré sur le téléphone (clé unique par fichier), seuls les
 * morceaux chiffrés partent au serveur, et la clé voyage dans le message
 * chiffré de bout en bout. Sans clé publique du contact, on refuse l'envoi
 * plutôt que d'exposer la clé du fichier.
 */
import { useWgoStore } from "@/lib/store";
import type { Message } from "@/lib/types";

export type MediaJob = {
  chatId: string;
  messageId: string;
  blobUrl: string;
  kind: "image" | "video" | "voice" | "file" | "gif";
  name?: string;
  mime?: string;
  viewOnce?: boolean;
  durationMs?: number;
  caption?: string;
};

const jobs = new Map<string, MediaJob>();
/** URL locales déjà connues (expéditeur) : pas besoin de retélécharger. */
export const localBlobs = new Map<string, string>();

function patch(chatId: string, id: string, p: Partial<Message>) {
  useWgoStore.setState((st) => ({
    messages: {
      ...st.messages,
      [chatId]: (st.messages[chatId] ?? []).map((m) => (m.id === id ? { ...m, ...p } : m)),
    },
  }));
}

function peerKey(chatId: string) {
  const st = useWgoStore.getState();
  const peerId = st.chats.find((c) => c.id === chatId)?.participantIds.find((id) => id !== "me");
  if (!peerId) return null;
  return st.peerPublicKeys[peerId] || (peerId.startsWith("srvuser:") ? st.peerPublicKeys[peerId.slice(8)] : undefined) || null;
}

export function isMediaJob(messageId: string) {
  return jobs.has(messageId);
}

export async function uploadMedia(job: MediaJob) {
  jobs.set(job.messageId, job);
  patch(job.chatId, job.messageId, { status: "sending", mediaState: "preparing", progress: 0 });
  try {
    const st = useWgoStore.getState();
    const peer = peerKey(job.chatId);
    if (!st.identity || !peer) throw new Error("no-e2e");
    const bytes = new Uint8Array(await (await fetch(job.blobUrl)).arrayBuffer());
    patch(job.chatId, job.messageId, { mediaState: "uploading", progress: 0.02 });
    const { uploadCipherFile } = await import("./media-upload");
    const { isPrivateChat } = await import("@/lib/private-vault");
    const res = await uploadCipherFile({
      chatId: job.chatId,
      bytes,
      kind: job.kind,
      viewOnce: job.viewOnce,
      name: job.name,
      mime: job.mime,
      durationMs: job.durationMs,
      caption: job.caption,
      size: bytes.byteLength,
      identity: st.identity,
      peerPublicJwk: peer,
      clientId: job.messageId,
      vault: isPrivateChat(job.chatId),
      onProgress: (f) => patch(job.chatId, job.messageId, { progress: f }),
    });
    localBlobs.set(res.attachmentId, job.blobUrl);
    jobs.delete(job.messageId);
    patch(job.chatId, job.messageId, { status: "sent", mediaState: "sent", progress: 1, attachmentId: res.attachmentId });
  } catch (err) {
    console.warn("[wipp] media upload failed", err);
    patch(job.chatId, job.messageId, { status: "failed", mediaState: "failed" });
  }
}

/** Réessayer : renvoie les mêmes octets, rien n'est perdu. */
export function retryMedia(messageId: string) {
  const job = jobs.get(messageId);
  if (!job) return false;
  void uploadMedia(job);
  return true;
}
