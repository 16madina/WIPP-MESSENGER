/**
 * Format strict des QR WIPP. Rien d'autre n'est interprété comme un utilisateur.
 *  - permanent : https://wippapp.com/@<username>
 *  - temporaire : https://wippapp.com/t/<jeton opaque>
 */
export const QR_HOST = "wippapp.com";

export type QrParse =
  | { kind: "profile"; username: string }
  | { kind: "temp"; token: string }
  | { kind: "invalid" };

export function profileQr(username: string) {
  return `https://${QR_HOST}/@${username}`;
}
export function tempQr(token: string) {
  return `https://${QR_HOST}/t/${token}`;
}

export function parseWippQr(raw: string): QrParse {
  let url: URL;
  try { url = new URL(raw.trim()); } catch { return { kind: "invalid" }; }
  const host = url.hostname.replace(/^www\./, "");
  if (url.protocol !== "https:" || host !== QR_HOST) return { kind: "invalid" };
  const p = url.pathname;
  const prof = /^\/@([a-z0-9._]{2,30})$/i.exec(p);
  if (prof) return { kind: "profile", username: prof[1].toLowerCase() };
  const tmp = /^\/t\/([A-Za-z0-9_-]{16,64})$/.exec(p);
  if (tmp) return { kind: "temp", token: tmp[1] };
  return { kind: "invalid" };
}

/* ---- QR temporaire (SIMULATED : registre local tant que le serveur n'a pas l'endpoint) ---- */
export type TempState = "active" | "used" | "expired" | "invalid";
export const TEMP_QR_MS = 75_000;
const KEY = "wipp-temp-qr";
type Rec = { token: string; username: string; expiresAt: number; used: boolean };

function load(): Rec[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]") as Rec[]; } catch { return []; }
}
function save(r: Rec[]) {
  localStorage.setItem(KEY, JSON.stringify(r.filter((x) => x.expiresAt > Date.now() - 600_000)));
}

export function issueTempToken(username: string): Rec {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  const token = btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const rec = { token, username, expiresAt: Date.now() + TEMP_QR_MS, used: false };
  // L'ancien jeton du même profil est invalidé.
  save([...load().filter((x) => x.username !== username), rec]);
  return rec;
}

export function redeemTempToken(token: string): { state: TempState; username?: string } {
  const all = load();
  const rec = all.find((x) => x.token === token);
  if (!rec) return { state: "invalid" };
  if (rec.used) return { state: "used" };
  if (rec.expiresAt < Date.now()) return { state: "expired" };
  rec.used = true;
  save(all);
  return { state: "active", username: rec.username };
}
