import { supabase } from "@/integrations/supabase/client";
import * as S from "./supa";
import type { WippChatSummary, WippMessage, WippProfile, WippSessionPayload } from "./types";

const TOKEN_KEY = "wipp-server-token";
const PROFILE_KEY = "wipp-server-profile";

export function getStoredToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY) ?? (S.cachedProfile() ? "supabase" : null);
}

export function getStoredProfile(): WippProfile | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WippProfile;
  } catch {
    return null;
  }
}

function persistSession(session: WippSessionPayload | null) {
  if (typeof localStorage === "undefined") return;
  if (!session) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
    return;
  }
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(PROFILE_KEY, JSON.stringify(session.profile));
}

async function api<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("content-type") && init.body) {
    headers.set("content-type", "application/json");
  }
  if (init.auth !== false) {
    const token = getStoredToken();
    if (token) headers.set("authorization", `Bearer ${token}`);
  }
  const res = await fetch(`/api/wipp/${path.replace(/^\//, "")}`, {
    ...init,
    headers,
  });
  const data = (await res.json().catch(() => ({}))) as T & {
    error?: string;
    message?: string;
  };
  if (!res.ok) {
    throw new Error(data.message || data.error || `HTTP ${res.status}`);
  }
  return data;
}

export async function healthCheck() {
  return api<{ ok: boolean; service: string }>("/health", { auth: false });
}

export async function registerAccount(input: {
  username: string;
  password: string;
  displayName: string;
}) {
  const session = await api<WippSessionPayload>("/register", {
    method: "POST",
    auth: false,
    body: JSON.stringify(input),
  });
  persistSession(session);
  return session;
}

export async function loginAccount(input: { username: string; password: string }) {
  const session = await api<WippSessionPayload>("/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify(input),
  });
  persistSession(session);
  return session;
}

export async function logoutAccount() {
  try {
    await api("/logout", { method: "POST" });
  } finally {
    persistSession(null);
  }
}

export async function fetchMe() {
  return S.loadMe();
}

export async function publishMyE2eKey(publicJwk: JsonWebKey) {
  return S.publishKey(publicJwk);
}

export async function searchUsers(q: string) {
  return S.searchProfiles(q);
}

export async function openServerChat(peerUsername: string) {
  const { openDm } = await import("@/lib/chats.functions");
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const { chatId } = await openDm({
    data: { peerUsername },
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  } as never);
  const chat = (await S.listChats()).find((c) => c.id === chatId);
  if (!chat) throw new Error("Conversation introuvable");
  return chat;
}

export async function fetchServerChats() {
  return S.listChats();
}

export async function fetchServerMessages(chatId: string, _after?: number) {
  return S.listMessages(chatId);
}

export async function postServerMessage(
  chatId: string,
  body: string,
  clientId: string,
  opts?: { replyTo?: string | null; vault?: boolean },
) {
  return S.insertMessage(chatId, body, clientId, opts?.replyTo);
}

export async function editServerMessage(_chatId: string, messageId: string, body: string) {
  return S.updateMessage(messageId, { body, edited_at: new Date().toISOString() });
}

export async function hideServerMessage(_chatId: string, messageId: string) {
  return S.hideMessage(messageId);
}

export async function tombstoneServerMessage(_chatId: string, messageId: string) {
  return S.updateMessage(messageId, { deleted_at: new Date().toISOString(), body: "" });
}

export async function reactServerMessage(_chatId: string, messageId: string, emoji: string) {
  return S.toggleReaction(messageId, emoji);
}

export async function pinServerMessage(_chatId: string, messageId: string, pinned: boolean) {
  return S.updateMessage(messageId, { pinned_at: pinned ? new Date().toISOString() : null });
}

export async function postReceipts(_chatId: string, messageIds: string[], kind: "delivered" | "read") {
  return S.upsertReceipts(messageIds, kind);
}

export async function postChatPrefs(
  chatId: string,
  patch: {
    pinned?: boolean;
    archived?: boolean;
    mute?: "off" | "1h" | "8h" | "1w" | "always";
    manuallyUnread?: boolean;
  },
) {
  return S.updatePrefs(chatId, patch);
}

export async function postFocus(chatId: string, active: boolean) {
  S.setFocus(chatId, active);
}

export async function postTyping(chatId: string, active: boolean) {
  S.sendTyping(chatId, active);
}

export async function createWebLinkCode(origin?: string) {
  return api<{
    code: string;
    token: string;
    expiresAt: number;
    status: string;
    qrUrl: string;
  }>("/link/create", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ origin: origin ?? window.location.origin }),
  });
}

export async function pollWebLinkStatus(token: string) {
  return api<{
    status: "pending" | "claimed" | "expired";
    profile?: WippProfile;
    session?: WippSessionPayload;
  }>(`/link/status?token=${encodeURIComponent(token)}`, { auth: false });
}

export async function claimWebLinkCode(code: string) {
  return api<{ ok: boolean; code: string; profile: WippProfile }>("/link/claim", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

/** Real Supabase session → WIPP profile. Throws when signed out. */
export async function ensureServerSession(_opts: {
  username: string;
  displayName: string;
  password?: string;
}) {
  return S.loadMe();
}

export type CallInvite = {
  id: string;
  kind: "audio" | "video";
  roomName: string;
  status: string;
  createdAt: number;
  expiresAt: number;
  caller: { id: string; username: string; displayName: string; avatarUrl?: string | null };
  callee: { id: string; username: string; displayName: string; avatarUrl?: string | null };
};

export async function registerDevicePush(input: {
  token: string;
  platform?: string;
  kind?: string;
}) {
  return api<{ ok: boolean }>("/devices/push", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function inviteCall(input: {
  peerUsername?: string;
  peerId?: string;
  kind: "audio" | "video";
}) {
  return api<{ invite: CallInvite }>("/calls/invite", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchIncomingCalls() {
  return api<{ invites: CallInvite[] }>("/calls/incoming");
}

export async function fetchCallStatus(callId: string) {
  return api<{ invite: CallInvite }>(`/calls/${encodeURIComponent(callId)}/status`);
}

export async function answerCall(callId: string, accept: boolean) {
  return api<{ invite: CallInvite }>(`/calls/${encodeURIComponent(callId)}/answer`, {
    method: "POST",
    body: JSON.stringify({ accept }),
  });
}

export async function hangupCall(callId: string) {
  return api<{ invite: CallInvite }>(`/calls/${encodeURIComponent(callId)}/hangup`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function postBlock(target: { username?: string; profileId?: string }) {
  return api<{ ok: boolean; blockedId: string }>("/blocks", { method: "POST", body: JSON.stringify(target) });
}

export async function postUnblock(target: { username?: string; profileId?: string }) {
  return api<{ ok: boolean }>("/blocks/remove", { method: "POST", body: JSON.stringify(target) });
}

export async function postDisappear(chatId: string, ms: number) {
  const { error } = await supabase
    .from("wipp_chats")
    .update({ disappear_after_ms: ms || null } as never)
    .eq("id", chatId);
  if (error) throw error;
  return { ok: true, disappearAfterMs: ms || null };
}

export async function createServerAttachment(chatId: string, input: { chunkCount: number; byteSize: number; viewOnce?: boolean }) {
  const { createAttachment } = await import("@/lib/attachments.functions");
  return createAttachment({ data: { chatId, ...input } });
}

export async function putServerChunk(attachmentId: string, index: number, ciphertext: string, sha256: string) {
  const { putAttachmentChunk } = await import("@/lib/attachments.functions");
  return putAttachmentChunk({ data: { attachmentId, index, ciphertext, sha256 } });
}

export async function completeServerAttachment(attachmentId: string, messageId?: string) {
  const { completeAttachment } = await import("@/lib/attachments.functions");
  return completeAttachment({ data: { attachmentId, messageId } });
}

export async function fetchServerChunk(attachmentId: string, index: number) {
  const { fetchAttachmentChunk } = await import("@/lib/attachments.functions");
  return fetchAttachmentChunk({ data: { attachmentId, index } });
}

export async function consumeServerAttachment(attachmentId: string) {
  const { consumeAttachment } = await import("@/lib/attachments.functions");
  return consumeAttachment({ data: { attachmentId } });
}

export async function fetchModerationPublicKey() {
  return api<{ publicJwk: JsonWebKey }>("/moderation/key");
}

export async function postReport(input: { chatId: string; messageId: string; reason: string; sealedPayload: string }) {
  return api<{ id: string; status: string }>(`/reports`, { method: "POST", body: JSON.stringify(input) });
}

