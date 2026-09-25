import { scrypt, pbkdf2, timingSafeEqual } from "node:crypto";

const scryptP = (pw: string, s: string | Buffer, n: number) =>
  new Promise<Buffer>((res, rej) => scrypt(pw, s, n, (e, k) => (e ? rej(e) : res(k))));
const pbkdf2P = (pw: string, s: string | Buffer, it: number, n: number) =>
  new Promise<Buffer>((res, rej) => pbkdf2(pw, s, it, n, "sha256", (e, k) => (e ? rej(e) : res(k))));

/** Ancien format WiPP "sel_hex(32):hash_hex(64)" : scrypt en priorité, puis PBKDF2-SHA256. */
export async function verifyLegacyHash(pw: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const want = Buffer.from(hashHex, "hex");
  const eq = (k: Buffer) => k.length === want.length && timingSafeEqual(k, want);
  for (const s of [saltHex, Buffer.from(saltHex, "hex")]) {
    if (eq(await scryptP(pw, s, want.length))) return true;
    for (const it of [100000, 210000, 310000]) if (eq(await pbkdf2P(pw, s, it, want.length))) return true;
  }
  return false;
}
