// WIPP — vérification du numéro par SMS via Firebase (navigateur uniquement).
// Le numéro ne sert qu'à vérifier l'identité ; il reste privé.
import type { ConfirmationResult } from "firebase/auth";

const config = {
  apiKey: import.meta.env["VITE_FIREBASE_API_KEY"] as string | undefined,
  authDomain: import.meta.env["VITE_FIREBASE_AUTH_DOMAIN"] as string | undefined,
  projectId: import.meta.env["VITE_FIREBASE_PROJECT_ID"] as string | undefined,
  appId: import.meta.env["VITE_FIREBASE_APP_ID"] as string | undefined,
};

export const firebaseConfigured = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);

/** Normalise un numéro saisi en E.164 (+indicatif…). null si invalide. */
export function toE164(raw: string): string | null {
  let p = raw.replace(/[\s().-]/g, "");
  if (p.startsWith("00")) p = "+" + p.slice(2);
  return /^\+[1-9]\d{6,14}$/.test(p) ? p : null;
}

async function auth() {
  const { initializeApp, getApps } = await import("firebase/app");
  const { getAuth } = await import("firebase/auth");
  const app = getApps()[0] ?? initializeApp(config as Record<string, string>);
  const a = getAuth(app);
  a.languageCode = "fr";
  return a;
}

/** Envoie le code SMS. containerId = élément vide pour le reCAPTCHA invisible. */
export async function sendSmsCode(phone: string, containerId: string): Promise<ConfirmationResult> {
  if (!firebaseConfigured) throw new Error("La vérification SMS n'est pas encore configurée.");
  const { RecaptchaVerifier, signInWithPhoneNumber } = await import("firebase/auth");
  const a = await auth();
  const w = window as unknown as { __wippRecaptcha?: InstanceType<typeof RecaptchaVerifier> };
  w.__wippRecaptcha?.clear();
  w.__wippRecaptcha = new RecaptchaVerifier(a, containerId, { size: "invisible" });
  return signInWithPhoneNumber(a, phone, w.__wippRecaptcha);
}

/** Valide le code reçu et renvoie le jeton Firebase à vérifier côté serveur. */
export async function confirmSmsCode(c: ConfirmationResult, code: string): Promise<string> {
  const cred = await c.confirm(code);
  const token = await cred.user.getIdToken();
  const { signOut } = await import("firebase/auth");
  await signOut(await auth()); // la session reste celle de Supabase
  return token;
}
