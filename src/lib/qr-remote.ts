// Appels client vers les fonctions serveur QR (Migration C).
// Le jeton n'est jamais journalisé, ni mis dans l'URL, ni conservé après résolution.
import { supabase } from "@/integrations/supabase/client";

export type RemoteProfile = { id: string; username: string; displayName: string; avatarUrl: string | null; bio: string };

async function headers() {
  const { data } = await supabase.auth.getSession();
  const t = data.session?.access_token;
  return t ? { authorization: `Bearer ${t}` } : null;
}

export const isServerToken = (t: string) => /^[A-Za-z0-9_-]{43}$/.test(t);

export async function issueTemp(): Promise<{ token: string; expiresAt: number } | { error: string }> {
  const h = await headers();
  if (!h) return { error: "no_session" };
  const { issueTempQr } = await import("@/lib/qr.functions");
  const r = (await issueTempQr({ headers: h } as never)) as { status: string; token?: string; ttlMs?: number };
  if (r.status !== "issued" || !r.token) return { error: r.status };
  return { token: r.token, expiresAt: Date.now() + (r.ttlMs ?? 75_000) };
}

export async function redeemTemp(token: string): Promise<{ status: string; profile?: RemoteProfile; connected?: boolean }> {
  const h = await headers();
  if (!h) return { status: "no_session" };
  const { redeemTempQr } = await import("@/lib/qr.functions");
  const r = (await redeemTempQr({ data: { token }, headers: h } as never)) as any;
  if (r.status !== "ok" || !r.profile) return { status: r.status };
  const p = r.profile;
  return {
    status: "ok",
    connected: Boolean(r.connected),
    profile: { id: p.id, username: p.username, displayName: p.display_name, avatarUrl: p.avatar_url, bio: p.bio ?? "" },
  };
}

export async function groupInviteCall(token: string, join: boolean) {
  const h = await headers();
  if (!h) return { status: "no_session" } as { status: string; name?: string; members?: number; chat_id?: string };
  const { groupInvite } = await import("@/lib/qr.functions");
  return (await groupInvite({ data: { token, join }, headers: h } as never)) as {
    status: string; name?: string; members?: number; chat_id?: string;
  };
}

export const GROUP_FR: Record<string, string> = {
  ok: "Invitation valide",
  joined: "Tu as rejoint le groupe",
  already_member: "Tu es déjà membre de ce groupe",
  revoked: "Invitation révoquée",
  expired: "Invitation expirée",
  full: "Invitation complète",
  refused: "Tu ne peux pas rejoindre ce groupe",
  closed: "Ce groupe n'accepte pas d'invitation",
  invalid: "Groupe introuvable",
  no_session: "Connecte-toi avec un vrai compte",
  error: "Impossible de vérifier le QR",
};
