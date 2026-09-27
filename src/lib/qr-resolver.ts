/**
 * WippQRResolver : QR brut → type → validation → destination.
 * Un QR externe ou arbitraire n'est JAMAIS traité comme une identité WIPP.
 * Types : profile (/@user), temporary (/t/<jeton>), group (/g/<jeton>), business (/b/<handle>).
 */
import { QR_HOST } from "@/lib/qr-payload";
import { useWgoStore } from "@/lib/store";
import { GROUP_FR, groupInviteCall, isServerToken, redeemTemp, type RemoteProfile } from "@/lib/qr-remote";

export type QrKind = "profile" | "temporary" | "group" | "business";

export type QrDestination =
  | { ok: true; kind: "profile"; userId: string }
  | { ok: true; kind: "remote-profile"; profile: RemoteProfile; connected: boolean }
  | { ok: true; kind: "group"; token: string }
  | { ok: true; kind: "remote-group"; token: string; name: string; members: number; member: boolean }
  | { ok: true; kind: "business"; shopId: string }
  | { ok: false; error: string };

export const QR_ERRORS = {
  notWipp: "Ce QR n'est pas un QR WIPP",
  expired: "QR expiré",
  used: "QR déjà utilisé",
  userMissing: "Utilisateur introuvable",
  groupMissing: "Groupe introuvable",
  shopMissing: "Carte introuvable",
  unverifiable: "Impossible de vérifier le QR",
} as const;

export const groupQr = (token: string) => `https://${QR_HOST}/g/${token}`;
export const businessQr = (handle: string) => `https://${QR_HOST}/b/${handle}`;

export function identifyQr(raw: string): { kind: QrKind; value: string } | null {
  let url: URL;
  try { url = new URL(raw.trim()); } catch { return null; }
  if (url.protocol !== "https:" || url.hostname.replace(/^www\./, "") !== QR_HOST) return null;
  const p = url.pathname;
  let m = /^\/@([a-z0-9._]{2,30})$/i.exec(p);
  if (m) return { kind: "profile", value: m[1].toLowerCase() };
  m = /^\/t\/([A-Za-z0-9_-]{16,64})$/.exec(p);
  if (m) return { kind: "temporary", value: m[1] };
  m = /^\/g\/([A-Za-z0-9_-]{4,64})$/.exec(p);
  if (m) return { kind: "group", value: m[1] };
  m = /^\/b\/([a-z0-9._-]{2,40})$/i.exec(p);
  if (m) return { kind: "business", value: m[1].toLowerCase() };
  return null;
}

/**
 * Résolution : QR temporaire et invitation de groupe vérifiés par le serveur ;
 * profil permanent, groupes de démonstration et cartes boutique en local.
 * Le jeton n'est plus propagé après résolution (sauf invitation de groupe, gardée en mémoire
 * jusqu'au clic « Rejoindre »).
 */
export async function resolveWippQr(raw: string): Promise<QrDestination> {
  const id = identifyQr(raw);
  if (!id) return { ok: false, error: QR_ERRORS.notWipp };
  const st = useWgoStore.getState();

  if (id.kind === "temporary") {
    if (!isServerToken(id.value)) return { ok: false, error: QR_ERRORS.unverifiable };
    try {
      const r = await redeemTemp(id.value);
      if (r.status === "ok" && r.profile) return { ok: true, kind: "remote-profile", profile: r.profile, connected: Boolean(r.connected) };
      if (r.status === "expired") return { ok: false, error: QR_ERRORS.expired };
      if (r.status === "used") return { ok: false, error: QR_ERRORS.used };
      if (r.status === "self") return { ok: false, error: "C'est ton propre QR" };
      if (r.status === "no_session") return { ok: false, error: "Connecte-toi avec un vrai compte" };
      return { ok: false, error: QR_ERRORS.unverifiable };
    } catch {
      return { ok: false, error: QR_ERRORS.unverifiable };
    }
  }
  if (id.kind === "profile") {
    const u = Object.values(st.users).find((x) => x.username?.toLowerCase() === id.value);
    return u ? { ok: true, kind: "profile", userId: u.id } : { ok: false, error: QR_ERRORS.userMissing };
  }
  if (id.kind === "group") {
    if (isServerToken(id.value)) {
      try {
        const r = await groupInviteCall(id.value, false);
        if (r.status === "ok" || r.status === "already_member")
          return { ok: true, kind: "remote-group", token: id.value, name: r.name ?? "", members: r.members ?? 0, member: r.status === "already_member" };
        return { ok: false, error: GROUP_FR[r.status] ?? QR_ERRORS.unverifiable };
      } catch {
        return { ok: false, error: QR_ERRORS.unverifiable };
      }
    }
    const chat = Object.values(st.chats ?? {}).find(
      (c) => (c as { inviteToken?: string }).inviteToken === id.value,
    );
    return chat ? { ok: true, kind: "group", token: id.value } : { ok: false, error: QR_ERRORS.groupMissing };
  }
  const shop = st.shops.find((s) => s.handle?.toLowerCase() === id.value);
  return shop ? { ok: true, kind: "business", shopId: shop.id } : { ok: false, error: QR_ERRORS.shopMissing };
}
