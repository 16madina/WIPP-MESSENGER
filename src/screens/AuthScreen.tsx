import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import type { ConfirmationResult } from "firebase/auth";
import { supabase } from "@/integrations/supabase/client";
import { signinPhone, signupPhone, resetPasswordPhone, devSignin, devLoginAvailable } from "@/lib/auth.functions";
import { confirmSmsCode, firebaseConfigured, sendSmsCode, toE164 } from "@/lib/firebase-phone";
import { WippLogo } from "@/components/native/WippLogo";
import { Pressable } from "@/components/native/Pressable";
import { motion as m } from "@/theme/theme";

type Mode = "signin" | "signup" | "reset";
type Step = "form" | "code";

/** Connexion (numéro + mot de passe), inscription et mot de passe oublié (code SMS). */
export function AuthScreen() {
  const signin = useServerFn(signinPhone);
  const signup = useServerFn(signupPhone);
  const reset = useServerFn(resetPasswordPhone);
  const [mode, setMode] = useState<Mode>("signin");
  const [step, setStep] = useState<Step>("form");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [demo, setDemo] = useState(false);
  useState(() => { devLoginAvailable().then(setDemo).catch(() => {}); });
  const [error, setError] = useState<string | null>(null);
  const confirmation = useRef<ConfirmationResult | null>(null);

  const go = (next: Mode) => { setMode(next); setStep("form"); setCode(""); setError(null); };

  const finish = async (r: { ok: true; accessToken: string; refreshToken: string } | { ok: false; error: string }) => {
    if (!r.ok) return setError(r.error);
    await supabase.auth.setSession({ access_token: r.accessToken, refresh_token: r.refreshToken });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const e164 = toE164(phone);
    if (!e164) return setError("Numéro invalide : indiquez l'indicatif, ex. +33 6 12 34 56 78");
    if (password.length < 8) return setError("Mot de passe : 8 caractères minimum");
    if (mode === "signup" && (!firstName.trim() || !lastName.trim())) return setError("Indiquez votre prénom et votre nom");
    setBusy(true);
    try {
      if (mode === "signin") return await finish(await signin({ data: { phone: e164, password } }));
      if (step === "form") {
        confirmation.current = await sendSmsCode(e164, "wipp-recaptcha");
        setStep("code");
        return;
      }
      if (!confirmation.current) return;
      const idToken = await confirmSmsCode(confirmation.current, code.trim());
      await finish(mode === "signup"
        ? await signup({ data: { idToken, firstName, lastName, password } })
        : await reset({ data: { idToken, password } }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(msg.includes("invalid-verification-code") ? "Code incorrect"
        : msg.includes("too-many-requests") ? "Trop de tentatives, réessayez plus tard"
        : msg.includes("invalid-phone-number") ? "Numéro invalide"
        : msg || "Erreur, réessayez");
    } finally { setBusy(false); }
  };

  const field = "w-full rounded-[14px] border border-wipp-glass-border bg-wipp-surface px-4 py-3.5 text-wipp-fg outline-none placeholder:text-wipp-muted focus:border-wipp-accent";
  const title = mode === "signin" ? "Connexion" : mode === "signup" ? "Créer un compte" : "Mot de passe oublié";
  const cta = mode === "signin" ? "Se connecter" : step === "form" ? "Recevoir le code par SMS" : mode === "signup" ? "Créer mon compte" : "Changer le mot de passe";

  return (
    <div className="flex h-full flex-col justify-center overflow-y-auto px-6" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mb-10 flex justify-center"><WippLogo /></div>
      <motion.form key={mode + step} onSubmit={submit} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={m.spring} className="space-y-3">
        <h1 className="font-display text-[28px] font-bold text-wipp-fg">{title}</h1>
        <p className="pb-2 text-[14px] text-wipp-muted">
          {step === "code" ? `Entrez le code reçu par SMS au ${toE164(phone)}.` : "Votre numéro reste privé : il sert uniquement à vérifier votre compte."}
        </p>
        {step === "form" ? (
          <>
            {mode === "signup" && (
              <div className="flex gap-3">
                <input className={field} placeholder="Prénom" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                <input className={field} placeholder="Nom" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            )}
            <input className={field} type="tel" inputMode="tel" placeholder="+33 6 12 34 56 78" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input className={field} type="password" placeholder={mode === "reset" ? "Nouveau mot de passe (8 min.)" : "Mot de passe (8 caractères min.)"} autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
          </>
        ) : (
          <input className={`${field} text-center text-[22px] tracking-[0.4em]`} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
        )}
        {mode !== "signin" && !firebaseConfigured && <p className="text-[13px] text-wipp-muted">La vérification SMS n'est pas encore configurée.</p>}
        {error && <p className="text-[14px] text-wipp-danger">{error}</p>}
        <Pressable type="submit" disabled={busy || (step === "code" && code.length < 6)} className="w-full rounded-[14px] bg-wipp-accent py-3.5 font-bold text-wipp-accent-fg disabled:opacity-60">
          {busy ? "Patientez…" : cta}
        </Pressable>
        {step === "code" && <Pressable type="button" onClick={() => { setStep("form"); setCode(""); }} className="w-full py-2 text-[14px] text-wipp-muted">Modifier le numéro</Pressable>}
        {step === "form" && mode === "signin" && <Pressable type="button" onClick={() => go("reset")} className="w-full py-1 text-[14px] text-wipp-muted">Mot de passe oublié ?</Pressable>}
        <Pressable type="button" onClick={() => go(mode === "signin" ? "signup" : "signin")} className="w-full py-2 text-[14px] text-wipp-muted">
          {mode === "signin" ? "Nouveau sur WIPP ? Créer un compte" : "Déjà un compte ? Se connecter"}
        </Pressable>
        <div id="wipp-recaptcha" />
        {import.meta.env.DEV && (
          <Pressable
            type="button"
            disabled={busy}
            onClick={async () => { setBusy(true); setError(null); try { await finish(await devSignin()); } finally { setBusy(false); } }}
            className="w-full rounded-[14px] border border-wipp-glass-border py-3 text-[14px] font-semibold text-wipp-muted disabled:opacity-60"
          >
            Entrer sans numéro (mode démo)
          </Pressable>
        )}
      </motion.form>
    </div>
  );
}
