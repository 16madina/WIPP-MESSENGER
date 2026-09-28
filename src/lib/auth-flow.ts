// WIPP — flux d'authentification : SMS Firebase puis session Supabase.
// Garde en mémoire l'objet de confirmation Firebase (non sérialisable)
// entre l'écran d'inscription/connexion et l'écran du code.
import type { ConfirmationResult } from "firebase/auth";
import { confirmSmsCode, sendSmsCode, toE164 } from "./firebase-phone";

export type AuthMode = "signup" | "reset" | "signin";

type Pending = {
  confirmation: ConfirmationResult | null;
  phone: string;
  mode: AuthMode;
  password?: string;
};

let pending: Pending | null = null;
let verifiedSignup: { idToken: string; phone: string } | null = null;
export function setVerifiedSignup(value: { idToken: string; phone: string }) { verifiedSignup = value; }
export function getVerifiedSignup() { return verifiedSignup; }

export const RECAPTCHA_ID = "wipp-recaptcha";

/** Envoie le code SMS. Renvoie null ou un message d'erreur en français. */
export async function startPhoneCode(
  rawPhone: string,
  mode: AuthMode,
  password?: string,
): Promise<string | null> {
  const phone = toE164(rawPhone);
  if (!phone) return "Numéro invalide. Vérifie l'indicatif et le numéro.";
  try {
    const confirmation = await sendSmsCode(phone, RECAPTCHA_ID);
    pending = { confirmation, phone, mode, password };
    return null;
  } catch (err) {
    console.warn("[wipp] sms send failed", err);
    // Connexion : on laisse passer vers l'écran du code (le serveur décide seul).
    if (mode === "signin") { pending = { confirmation: null, phone, mode }; return null; }
    return "Envoi du SMS impossible. Réessaie dans un instant.";
  }
}

export function pendingPhone(): string | null {
  return pending?.phone ?? null;
}

export function pendingPassword(): string | undefined {
  return pending?.password;
}

export function pendingHasSms(): boolean {
  return Boolean(pending?.confirmation);
}

export function pendingMode(): AuthMode | null {
  return pending?.mode ?? null;
}

/** Valide le code SMS. Renvoie le jeton Firebase ou un message d'erreur. */
export async function verifyPhoneCode(
  code: string,
): Promise<{ idToken: string; phone: string } | { error: string }> {
  if (!pending) return { error: "Code expiré. Renvoie un nouveau code." };
  if (!pending.confirmation) {
    return { error: "Code incorrect ou expiré." };
  }
  try {
    const idToken = await confirmSmsCode(pending.confirmation, code);
    return { idToken, phone: pending.phone };
  } catch {
    return { error: "Code incorrect ou expiré." };
  }
}

export function clearPending() {
  pending = null;
  verifiedSignup = null;
}
