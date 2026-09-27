/**
 * Client media pipeline (wipp-media-v1).
 * Uploads ciphertext only. The file key, name and MIME travel inside encryptText.
 */
import {
  CHUNK_PLAIN_MAX,
  describeMedia,
  encryptChunk,
  newFileKey,
  type MediaEnvelope,
} from "@/lib/messaging/media-crypto";
import {
  completeServerAttachment,
  createServerAttachment,
  putServerChunk,
} from "@/lib/messaging/client";
import { sendViaServer } from "@/lib/messaging/sync";
import type { KeyBundle } from "@/lib/crypto";

function b64(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

export async function uploadCipherFile(input: {
  chatId: string;
  bytes: Uint8Array;
  kind: MediaEnvelope["kind"];
  viewOnce?: boolean;
  name?: string;
  mime?: string;
  durationMs?: number;
  identity?: KeyBundle | null;
  peerPublicJwk?: JsonWebKey | null;
  clientId: string;
  vault?: boolean;
  onProgress?: (fraction: number) => void;
}) {
  const serverChatId = input.chatId.replace(/^srv:/, "");
  const chunkCount = Math.max(1, Math.ceil(input.bytes.byteLength / CHUNK_PLAIN_MAX));
  const created = await createServerAttachment(serverChatId, {
    chunkCount,
    byteSize: input.bytes.byteLength,
    viewOnce: input.viewOnce,
  });
  const fileKey = newFileKey();
  const metas: { i: number; iv: string; sha256: string }[] = [];
  for (let i = 0; i < chunkCount; i++) {
    const slice = input.bytes.subarray(i * CHUNK_PLAIN_MAX, Math.min(input.bytes.byteLength, (i + 1) * CHUNK_PLAIN_MAX));
    const chunk = encryptChunk(fileKey, created.id, i, slice);
    metas.push({ i, iv: chunk.iv, sha256: chunk.sha256 });
    await putServerChunk(created.id, i, b64(chunk.ciphertext), chunk.sha256);
    input.onProgress?.((i + 1) / (chunkCount + 1));
  }
  const inner = describeMedia({
    id: created.id,
    fileKey: b64(fileKey).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
    kind: input.kind,
    name: input.name,
    mime: input.mime,
    viewOnce: input.viewOnce,
    durationMs: input.durationMs,
    chunks: metas,
  });
  const message = await sendViaServer(input.chatId, inner, input.clientId, {
    identity: input.identity,
    peerPublicJwk: input.peerPublicJwk,
    vault: input.vault,
  });
  if (message?.id) await completeServerAttachment(created.id, message.id);
  else await completeServerAttachment(created.id);
  input.onProgress?.(1);
  return { attachmentId: created.id, message };
}

function unb64(s: string) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Télécharge puis déchiffre une pièce jointe ; renvoie une URL locale. */
export async function downloadCipherFile(input: {
  attachmentId: string;
  fileKey: string;
  chunks: { i: number; iv: string; sha256: string }[];
  mime?: string;
  onProgress?: (fraction: number) => void;
}) {
  const { fetchServerChunk } = await import("@/lib/messaging/client");
  const { decryptChunk } = await import("@/lib/messaging/media-crypto");
  const key = unb64(input.fileKey);
  const parts: Uint8Array[] = [];
  const sorted = [...input.chunks].sort((a, b) => a.i - b.i);
  for (let n = 0; n < sorted.length; n++) {
    const meta = sorted[n];
    const row = await fetchServerChunk(input.attachmentId, meta.i);
    const plain = decryptChunk(key, input.attachmentId, { index: meta.i, iv: meta.iv, sha256: meta.sha256, ciphertext: unb64(row.ciphertext) });
    parts.push(plain);
    input.onProgress?.((n + 1) / sorted.length);
  }
  const blob = new Blob(parts as BlobPart[], { type: input.mime || "application/octet-stream" });
  return URL.createObjectURL(blob);
}
