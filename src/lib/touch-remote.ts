// Client WIPP Touch réel (Migration D). Lectures via RLS (on ne voit que ses invitations),
// écritures uniquement via src/lib/touch.functions.ts (identité = session).
import { supabase } from "@/integrations/supabase/client";
import type { PublicCard } from "@/lib/providers";
import {
  cancelTouchInvite, createTouchInvite, listTouchCandidates, reportTouchCandidate,
  requestTouchConnection, respondTouchInvite,
} from "@/lib/touch.functions";

const safe = async <T,>(p: Promise<T>, fb: T) => { try { return await p; } catch { return fb; } };
async function h() {
  const t = (await supabase.auth.getSession()).data.session?.access_token;
  return t ? { authorization: `Bearer ${t}` } : {};
}
// Les fonctions serveur attendent le jeton de session dans l'en-tête (même schéma que connections.ts).
const withAuth = async <T,>(fn: (o: any) => Promise<T>, data?: unknown) => fn({ data, headers: await h() } as never);

export async function hasSession() {
  return Boolean((await supabase.auth.getSession()).data.session);
}
export const createTouch = (): Promise<{ status: string; id?: string; token?: string; expiresAt?: string }> => safe(withAuth(createTouchInvite), { status: "error" });
export const cancelTouch = (id: string) => safe(withAuth(cancelTouchInvite, { id }), { status: "error" });
export const requestTouch = (id: string, profileId: string) => safe(withAuth(requestTouchConnection, { id, profileId }), { status: "error" });
export const respondTouch = (id: string, action: "accept" | "decline") => safe(withAuth(respondTouchInvite, { id, action }), { status: "error" });
/** Entrée NATIVE (BLE/NFC). En web : uniquement le bouton DEV « canal debug ». */
export const reportTouch = (token: string, channel: "ble" | "nfc" | "debug", rssi: number[] = []) =>
  safe(withAuth(reportTouchCandidate, { token, channel, rssi }), { status: "error" });

export async function touchCandidates(id: string): Promise<{ status: string; cards: PublicCard[] }> {
  const r = await safe(withAuth(listTouchCandidates, { id }), { status: "error" } as { status: string; cards?: never[] });
  return {
    status: r.status,
    cards: ((r as { cards?: { id: string; username: string; display_name: string; avatar_url: string | null }[] }).cards ?? [])
      .map((c) => ({ id: c.id, username: c.username, displayName: c.display_name, avatar: c.avatar_url ?? undefined })),
  };
}

export async function touchStatus(id: string): Promise<{ status: string; expiresAt: string } | null> {
  const { data } = await (supabase as any).from("wipp_touch_invites").select("status,expires_at").eq("id", id).maybeSingle();
  return data ? { status: data.status, expiresAt: data.expires_at } : null;
}

export type IncomingTouch = {
  id: string; status: string; expiresAt: string;
  sender: { id: string; username: string; displayName: string; avatarUrl: string | null } | null;
};

async function myId() {
  const { data } = await supabase.rpc("wipp_my_profile_id" as never);
  return (data as string | null) ?? null;
}

/** Une invitation Touch reçue (B). Expéditeur illisible (bloqué) → sender null. */
export async function getIncomingTouch(id: string): Promise<IncomingTouch | "not_found"> {
  const me = await myId();
  if (!me) return "not_found";
  const { data: r } = await (supabase as any).from("wipp_touch_invites")
    .select("id,status,expires_at,sender_id,receiver_id").eq("id", id).eq("receiver_id", me).maybeSingle();
  if (!r) return "not_found";
  const { data: p } = await (supabase as any).from("wipp_public_profiles")
    .select("id,username,display_name,avatar_url").eq("id", r.sender_id).maybeSingle();
  return {
    id: r.id, status: r.status, expiresAt: r.expires_at,
    sender: p ? { id: p.id, username: p.username, displayName: p.display_name, avatarUrl: p.avatar_url } : null,
  };
}

/** Invitations Touch en attente pour moi (B n'a pas besoin d'être sur l'écran Touch). */
export async function pendingIncomingTouch(): Promise<string[]> {
  if (!(await hasSession())) return [];
  const me = await myId();
  if (!me) return [];
  const { data } = await (supabase as any).from("wipp_touch_invites").select("id")
    .eq("receiver_id", me).eq("status", "pending").gt("expires_at", new Date().toISOString());
  return (data ?? []).map((r: { id: string }) => r.id);
}
