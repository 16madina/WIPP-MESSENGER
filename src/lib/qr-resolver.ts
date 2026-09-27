/**
 * WippQRResolver : QR brut → type → validation → destination.
 * Un QR externe ou arbitraire n'est JAMAIS traité comme une identité WIPP.
 * Types : profile (/@user), temporary (/t/<jeton>), group (/g/<jeton>), business (/b/<handle>).
 */
import { QR_HOST, redeemTempToken } from "@/lib/qr-payload";
import { useWgoStore } from "@/lib/store";

export type QrKind = "profile" | "temporary" | "group" | "business";

export type QrDestination =
  | { ok: true; kind: "profile"; userId: string }
  | { ok: true; kind: "group"; token: string }
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

/** Résolution locale (SIMULATED) — à remplacer par un appel serveur (BACKEND). */
export function resolveWippQr(raw: string): QrDestination {
  const id = identifyQr(raw);
  if (!id) return { ok: false, error: QR_ERRORS.notWipp };
  const st = useWgoStore.getState();
  const findUser = (u: string) =>
    Object.values(st.users).find((x) => x.username?.toLowerCase() === u);

  if (id.kind === "profile" || id.kind === "temporary") {
    let username = id.value;
    if (id.kind === "temporary") {
      const r = redeemTempToken(id.value);
      if (r.state === "expired") return { ok: false, error: QR_ERRORS.expired };
      if (r.state === "used") return { ok: false, error: QR_ERRORS.used };
      if (r.state !== "active" || !r.username) return { ok: false, error: QR_ERRORS.unverifiable };
      username = r.username;
    }
    const u = findUser(username);
    return u ? { ok: true, kind: "profile", userId: u.id } : { ok: false, error: QR_ERRORS.userMissing };
  }
  if (id.kind === "group") {
    const chat = Object.values(st.chats ?? {}).find(
      (c) => (c as { inviteToken?: string }).inviteToken === id.value,
    );
    return chat ? { ok: true, kind: "group", token: id.value } : { ok: false, error: QR_ERRORS.groupMissing };
  }
  const shop = st.shops.find((s) => s.handle?.toLowerCase() === id.value);
  return shop ? { ok: true, kind: "business", shopId: shop.id } : { ok: false, error: QR_ERRORS.shopMissing };
}
