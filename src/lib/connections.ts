// Demandes de connexion RÉELLES (backend). Lecture via RLS (on ne voit que ses demandes),
// écritures via les fonctions serveur de connections.functions.ts.
import { supabase } from "@/integrations/supabase/client";

export type RealRequest = {
  id: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  sender: { id: string; username: string; displayName: string; avatarUrl: string | null };
};

async function auth() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { authorization: `Bearer ${token}` } : null;
}

export async function hasServerSession() {
  return Boolean(await auth());
}

export async function listIncomingRequests(): Promise<RealRequest[]> {
  if (!(await auth())) return [];
  const { data: me } = await supabase.rpc("wipp_my_profile_id" as never);
  if (!me) return [];
  const { data: reqs } = await (supabase as any)
    .from("wipp_connection_requests")
    .select("id,status,created_at,expires_at,sender_id")
    .eq("recipient_id", me)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (!reqs?.length) return [];
  const ids = reqs.map((r: any) => r.sender_id);
  const { data: profs } = await (supabase as any)
    .from("wipp_public_profiles")
    .select("id,username,display_name,avatar_url")
    .in("id", ids);
  const byId = new Map((profs ?? []).map((p: any) => [p.id, p]));
  // Un expéditeur bloqué n'est plus lisible : sa demande n'est pas affichée.
  return reqs
    .filter((r: any) => byId.has(r.sender_id))
    .map((r: any) => {
      const p: any = byId.get(r.sender_id);
      return {
        id: r.id, status: r.status, createdAt: r.created_at, expiresAt: r.expires_at,
        sender: { id: p.id, username: p.username, displayName: p.display_name, avatarUrl: p.avatar_url },
      };
    });
}

export async function getRequest(id: string): Promise<RealRequest | "not_found"> {
  const { data: r } = await (supabase as any)
    .from("wipp_connection_requests")
    .select("id,status,created_at,expires_at,sender_id")
    .eq("id", id)
    .maybeSingle();
  if (!r) return "not_found";
  const { data: p } = await (supabase as any)
    .from("wipp_public_profiles").select("id,username,display_name,avatar_url").eq("id", r.sender_id).maybeSingle();
  if (!p) return "not_found";
  return {
    id: r.id, status: r.status, createdAt: r.created_at, expiresAt: r.expires_at,
    sender: { id: p.id, username: p.username, displayName: p.display_name, avatarUrl: p.avatar_url },
  };
}

export async function sendRequest(username: string): Promise<string> {
  const headers = await auth();
  if (!headers) return "no_session";
  const { sendConnectionRequest } = await import("@/lib/connections.functions");
  const res = await sendConnectionRequest({ data: { recipientUsername: username.replace(/^@/, "") }, headers } as never);
  return (res as { status: string }).status;
}

export async function respondRequest(id: string, action: "accept" | "decline" | "ignore"): Promise<string> {
  const headers = await auth();
  if (!headers) return "no_session";
  const { respondConnectionRequest } = await import("@/lib/connections.functions");
  const res = await respondConnectionRequest({ data: { id, action }, headers } as never);
  return (res as { status: string }).status;
}

export async function blockProfile(profileId: string): Promise<boolean> {
  const { data: me } = await supabase.rpc("wipp_my_profile_id" as never);
  if (!me) return false;
  const { error } = await (supabase as any).from("wipp_blocks").insert({
    id: "blk_" + crypto.randomUUID().replace(/-/g, "").slice(0, 20),
    blocker_id: me, blocked_id: profileId, reason: "request",
  });
  return !error;
}

export const STATUS_FR: Record<string, string> = {
  sent: "Demande envoyée",
  already_pending: "Demande déjà en attente",
  already_connected: "Vous êtes déjà connectés",
  accepted_existing: "Vous êtes maintenant connectés",
  not_found: "Profil introuvable",
  rate_limited: "Trop de demandes aujourd'hui, réessaie demain",
  paused: "Demandes en pause avec cette personne",
  invalid: "Demande impossible",
  no_session: "Connecte-toi avec un vrai compte",
  error: "Une erreur est survenue",
};
