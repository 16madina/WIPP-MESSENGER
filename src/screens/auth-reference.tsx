import { useEffect, useRef, useState } from "react";
import { ImagePlus, Pencil } from "lucide-react";
import { Btn } from "@/components/ui";
import { useWgoStore } from "@/lib/store";
import { toE164 } from "@/lib/firebase-phone";
import { RECAPTCHA_ID, clearPending, getVerifiedSignup, pendingHasSms, pendingMode, pendingPhone, setVerifiedSignup, startPhoneCode, verifyPhoneCode } from "@/lib/auth-flow";
import { signinOtp, signupPhone, usernameAvailable } from "@/lib/auth.functions";
import { enterWithSession } from "@/lib/enter-session";
import { supabase } from "@/integrations/supabase/client";
import welcomeImage from "@/assets/wipp-auth-welcome.png.asset.json";
import phoneImage from "@/assets/wipp-auth-phone.png.asset.json";
import smsImage from "@/assets/wipp-auth-sms-clean.png";
import profileImage from "@/assets/wipp-auth-profile-no-password.png";
import { COUNTRIES } from "./auth-chrome";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { CountryList } from "@/components/country-list";

/** The supplied artwork includes the logo, photograph and copy; live controls sit over it. */
function Artwork({ src }: { src: string }) {
  return <img src={src} alt="" draggable={false} className="pointer-events-none absolute inset-0 size-full object-fill" />;
}

export function WelcomeScreen() {
  const replace = useWgoStore((s) => s.replace);
  const push = useWgoStore((s) => s.push);
  return (
    <main className="relative size-full overflow-hidden bg-wipp-bg text-wipp-fg" aria-label="Bienvenue sur WIPP">
      <Artwork src={welcomeImage.url} />
      <Btn aria-label="Créer un compte" onClick={() => push({ name: "phone-entry" })} className="absolute! top-[70.7%] left-[5%] h-[7%]! w-[90%] rounded-full! bg-transparent! text-transparent!" />
      <Btn aria-label="J’ai déjà un compte" onClick={() => replace({ name: "login" })} className="absolute! top-[79.3%] left-[5%] h-[7%]! w-[90%] rounded-full! bg-transparent! text-transparent!" />
      <Btn aria-label="Conditions d’utilisation" onClick={() => push({ name: "legal", doc: "terms" })} className="absolute! top-[88%] left-[48%] h-[3.5%]! min-h-0! w-[35%] bg-transparent! p-0! opacity-0" />
      <Btn aria-label="Politique de confidentialité" onClick={() => push({ name: "legal", doc: "privacy" })} className="absolute! top-[91%] left-[32%] h-[3.5%]! min-h-0! w-[43%] bg-transparent! p-0! opacity-0" />
    </main>
  );
}

export function PhoneEntryScreen() {
  const pop = useWgoStore((s) => s.pop);
  const push = useWgoStore((s) => s.push);
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [phone, setPhone] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function continueWithPhone() {
    const normalized = toE164(`${country.dial}${phone.replace(/\D/g, "").replace(/^0+/, "")}`);
    if (!normalized) {
      setError("Entre un numéro de téléphone valide.");
      return;
    }
    setBusy(true);
    const smsError = await startPhoneCode(normalized, "signup");
    setBusy(false);
    if (smsError) { setError(smsError); return; }
    useWgoStore.setState((state) => ({ pendingSignup: { ...state.pendingSignup, phone: normalized, country: country.id } }));
    setError("");
    push({ name: "sms-reference" });
  }

  return (
    <main className="relative size-full overflow-hidden bg-wipp-bg text-wipp-fg" aria-label="Ton numéro de téléphone">
      <Artwork src={phoneImage.url} />
      <div id={RECAPTCHA_ID} className="absolute bottom-0 left-0" />
      <Btn aria-label="Retour" onClick={pop} className="absolute! top-[11.5%] left-[4%] h-[6%]! w-[12%] bg-transparent! p-0! text-transparent!" />
      <Btn
        aria-label={`Pays : ${country.fr} (${country.dial})`}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
        className="absolute! top-[59%] left-[10%] h-[5.5%]! w-[80%] justify-start rounded-lg! bg-wipp-auth-input! px-3! text-wipp-fg!"
      >
        <img src={country.flag} alt="" className="h-4 w-6 shrink-0 object-cover" /><span className="truncate">{country.fr}</span><span className="ml-auto shrink-0 text-wipp-muted">{country.dial} ▾</span>
      </Btn>
      {menuOpen ? (
        <div className="absolute top-[65%] left-[10%] z-20 flex max-h-[33%] w-[80%] flex-col overflow-hidden rounded-lg border border-wipp-glass-border bg-wipp-share-panel shadow-lift">
          <CountryList onPick={(item) => { setCountry(item); setMenuOpen(false); setError(""); }} />
        </div>
      ) : null}
      <input
        aria-label="Numéro de téléphone"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        maxLength={25}
        value={phone}
        onChange={(event) => { setPhone(event.target.value); setError(""); }}
        className="absolute top-[69.1%] left-[10.6%] h-[6%] w-[78.8%] rounded-lg bg-wipp-auth-input px-4 text-[18px] text-wipp-fg outline-none placeholder:text-wipp-muted"
        placeholder="(514) 123-4567"
      />
      {error ? <p role="alert" className="absolute top-[83%] left-[10%] rounded bg-wipp-share-panel px-2 text-[12px] text-wipp-danger">{error}</p> : null}
       <Btn aria-label="Continuer" disabled={busy} onClick={() => void continueWithPhone()} className="absolute! top-[87.1%] left-[5%] h-[6.6%]! w-[90%] rounded-full! bg-transparent! text-transparent!" />
    </main>
  );
}

export function SmsReferenceScreen() {
  const pop = useWgoStore((s) => s.pop);
  const push = useWgoStore((s) => s.push);
  const pending = useWgoStore((s) => s.pendingSignup);
  const phone = pendingPhone() ?? pending.phone ?? "";
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(45);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);

  const signin = pendingMode() === "signin";
  const [noAccount, setNoAccount] = useState<{ idToken: string; phone: string } | null>(null);

  async function validate() {
    if (code.length !== 6 || busy) return;
    setBusy(true); setError(""); setNoAccount(null);
    if (signin) {
      let payload: { idToken: string } | { phone: string; code: string } = { phone, code };
      let verified: { idToken: string; phone: string } | null = null;
      if (pendingHasSms()) {
        const result = await verifyPhoneCode(code);
        if ("error" in result) { setBusy(false); setError(result.error); return; }
        verified = result;
        payload = { idToken: result.idToken };
      }
      const res = await signinOtp({ data: payload });
      if (res.ok) { await enterWithSession(res.accessToken, res.refreshToken, phone); clearPending(); setBusy(false); return; }
      setBusy(false);
      setError(res.error);
      if ("noAccount" in res && verified) setNoAccount(verified);
      return;
    }
    const result = await verifyPhoneCode(code);
    setBusy(false);
    if ("error" in result) { setError(result.error); return; }
    if (result.phone !== pending.phone) { setError("Vérification impossible. Recommence."); return; }
    setVerifiedSignup(result);
    push({ name: "profile-reference" });
  }

  async function resend() {
    setBusy(true); setError("");
    const result = await startPhoneCode(phone, signin ? "signin" : "signup");
    setBusy(false);
    if (result) { setError(result); return; }
    setCode(""); setSeconds(45);
  }

  return <main className="relative size-full overflow-hidden bg-wipp-bg text-wipp-fg" aria-label="Vérifie ton numéro">
    <Artwork src={smsImage.url} />
    <div id={RECAPTCHA_ID} className="absolute bottom-0 left-0" />
    <Btn aria-label="Retour" onClick={pop} className="absolute! top-[8%] left-[4%] h-[6%]! w-[12%] bg-transparent! opacity-0" />
    <div className="absolute top-[40%] left-[8%] flex h-[5.5%] max-w-[80%] items-center gap-2 rounded-lg bg-wipp-auth-input px-3 text-[14px] font-semibold text-wipp-fg">
       {COUNTRIES.find((item) => item.id === pending.country)?.flag ? <img src={COUNTRIES.find((item) => item.id === pending.country)?.flag} alt="" className="h-4 w-6 object-cover" /> : null}<span>{phone}</span>
      <Btn variant="ghost" aria-label="Modifier mon numéro" onClick={pop} className="h-11! min-h-0! px-1! text-wipp-accent!"><Pencil className="size-4" /></Btn>
    </div>
    <input ref={input} type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={6} value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }} aria-label="Code SMS" className="absolute top-[60.1%] left-[7%] h-[8.5%] w-[86%] opacity-0" />
    <Btn aria-label="Saisir le code SMS" onClick={() => input.current?.focus()} className="absolute! top-[60%] left-[7%] h-[9%]! w-[86%] bg-transparent! p-0!">
      <span className="flex size-full items-stretch justify-between">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className="flex w-[13.5%] items-center justify-center rounded-xl text-[28px] font-semibold text-wipp-fg">
            {code[i] ?? ""}
          </span>
        ))}
      </span>
    </Btn>
    {error ? <p role="alert" className="absolute top-[70%] left-[8%] flex items-center gap-2 bg-wipp-share-panel px-2 text-[12px] text-wipp-danger">{error}{noAccount ? <Btn variant="ghost" onClick={() => { useWgoStore.setState((s) => ({ pendingSignup: { ...s.pendingSignup, phone: noAccount.phone } })); setVerifiedSignup(noAccount); push({ name: "profile-reference" }); }} className="h-11! min-h-0! px-2! text-wipp-accent!">Créer un compte</Btn> : null}</p> : null}
    <Btn aria-label="Renvoyer le code" disabled={seconds > 0 || busy} onClick={() => void resend()} className="absolute! top-[73%] left-[19%] h-[5%]! w-[62%] bg-transparent! p-0! text-[13px]! text-wipp-accent!">
      {seconds > 0 ? `Renvoyer le code dans 00:${String(seconds).padStart(2, "0")}` : "Renvoyer le code"}
    </Btn>
    <Btn aria-label="Continuer" disabled={busy || code.length !== 6} onClick={() => void validate()} className="absolute! top-[79.2%] left-[5%] h-[6.7%]! w-[90%] rounded-full! bg-transparent! text-transparent!" />
    <Btn aria-label="Modifier mon numéro" onClick={pop} className="absolute! top-[88%] left-[22%] h-[5%]! w-[56%] bg-transparent! opacity-0" />
  </main>;
}

export function ProfileReferenceScreen() {
  const pop = useWgoStore((s) => s.pop);
  const push = useWgoStore((s) => s.push);
  const completeSetup = useWgoStore((s) => s.completeSetup);
  const country = useWgoStore((s) => s.pendingSignup.country ?? "CA");
  const phone = useWgoStore((s) => s.pendingSignup.phone ?? "");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("/avatars/deena.jpg");
  const [availability, setAvailability] = useState<"available" | "taken" | "checking" | null>(null);
  const [checkedUsername, setCheckedUsername] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const countryLabel = COUNTRIES.find((item) => item.id === country);
  useEffect(() => {
    if (!/^[a-z0-9_]{3,20}$/.test(username)) { return; }
    let cancelled = false;
    setAvailability("checking");
    const timer = window.setTimeout(() => {
      void usernameAvailable({ data: { username } }).then((available) => {
        if (!cancelled) { setCheckedUsername(username); setAvailability(available ? "available" : "taken"); }
      }).catch(() => { if (!cancelled) setAvailability(null); });
    }, 450);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [username]);

  async function uploadPhoto(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5_000_000) { setError("Choisis une image de moins de 5 Mo."); return; }
    const url = URL.createObjectURL(file);
    try {
      const img = new Image(); img.src = url; await img.decode();
      const canvas = document.createElement("canvas"); canvas.width = 192; canvas.height = 192;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("image");
      const side = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 192, 192);
      const result = canvas.toDataURL("image/jpeg", 0.7);
      if (result.length > 60000) throw new Error("image");
      setAvatar(result); setError("");
    } catch { setError("Photo impossible à lire."); } finally { URL.revokeObjectURL(url); }
  }

  async function finish() {
    const verified = getVerifiedSignup();
    if (!verified || verified.phone !== phone) { setError("Code SMS expiré. Recommence la vérification."); return; }
    if (!firstName.trim() || !lastName.trim() || !/^[a-z0-9_]{3,20}$/.test(username)) { setError("Renseigne ton prénom, ton nom et un pseudo valide."); return; }
    if (availability !== "available" || checkedUsername !== username) { setError("Vérifie la disponibilité du pseudo."); return; }
    setBusy(true); setError("");
    try {
       const result = await signupPhone({ data: { idToken: verified.idToken, firstName: firstName.trim(), lastName: lastName.trim(), username, country, avatar } });
      if (!result.ok) { setError(result.error); return; }
      const session = await supabase.auth.setSession({ access_token: result.accessToken, refresh_token: result.refreshToken });
      if (session.error) { setError("Compte créé, mais connexion impossible. Réessaie."); return; }
      clearPending();
      completeSetup({ firstName: firstName.trim(), lastName: lastName.trim(), displayName: `${firstName.trim()} ${lastName.trim()}`, username, avatar, country, phone }, true);
      push({ name: "signup-celebration", username });
    } catch { setError("Inscription impossible. Réessaie."); } finally { setBusy(false); }
  }

  return <main className="relative size-full overflow-y-auto bg-wipp-bg text-wipp-fg" aria-label="Complète ton profil">
    <div className="relative min-h-[100%]" style={{ aspectRatio: "941 / 1672" }}>
       <Artwork src={profileImage} />
      <Btn aria-label="Retour" onClick={pop} className="absolute! top-[8%] left-[4%] h-[5%]! w-[12%] bg-transparent! opacity-0" />
      <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => { void uploadPhoto(e.target.files?.[0]); e.target.value = ""; }} />
      <div className="absolute top-[38.5%] left-[10.5%] size-[19%] max-h-[9.5%] overflow-hidden rounded-full"><img src={avatar} alt="Photo de profil choisie" className="size-full object-cover" /></div>
      <Btn aria-label="Choisir une photo" onClick={() => fileInput.current?.click()} className="absolute! top-[38%] left-[33%] h-[11%]! w-[14%] flex-col! bg-transparent! opacity-0"><ImagePlus /></Btn>
      <div className="absolute top-[39%] left-[48%] flex gap-1.5">
        {["/avatars/deena.jpg", "/avatars/maya.jpg", "/avatars/aisha.jpg"].map((src) => <Btn key={src} aria-label={`Choisir l’avatar ${src.split("/").at(-1)?.split(".")[0]}`} onClick={() => setAvatar(src)} className="h-11! w-11! min-h-0! rounded-full! bg-transparent! p-0! opacity-0" />)}
      </div>
      <input aria-label="Prénom" autoComplete="given-name" maxLength={40} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Prénom" className="absolute top-[53.8%] left-[10.5%] h-[4.4%] w-[37%] bg-wipp-auth-input px-2 text-[15px] text-wipp-fg outline-none placeholder:text-wipp-muted" />
      <input aria-label="Nom" autoComplete="family-name" maxLength={40} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nom" className="absolute top-[53.8%] left-[52%] h-[4.4%] w-[37%] bg-wipp-auth-input px-2 text-[15px] text-wipp-fg outline-none placeholder:text-wipp-muted" />
      <input aria-label="Ton WIPP" autoComplete="username" maxLength={20} value={username} onChange={(e) => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")); setAvailability(null); }} placeholder="@pseudo" className="absolute top-[61.6%] left-[10%] h-[4.3%] w-[60%] bg-wipp-auth-input px-2 text-[15px] text-wipp-fg outline-none placeholder:text-wipp-muted" />
      <span aria-live="polite" className={`absolute top-[62.7%] right-[10%] text-[11px] ${availability === "taken" ? "text-wipp-danger" : "text-wipp-success"}`}>{checkedUsername === username && availability === "available" ? "✓ Disponible" : checkedUsername === username && availability === "taken" ? "Déjà utilisé" : ""}</span>
       <div className="absolute top-[72.1%] left-[11%] flex w-[78%] items-center gap-2 truncate bg-wipp-auth-input text-[14px] text-wipp-fg">{countryLabel ? <img src={countryLabel.flag} alt="" className="h-4 w-6 object-cover" /> : null}{countryLabel?.fr ?? country} ({countryLabel?.dial ?? ""})</div>
      {error ? <p role="alert" className="absolute top-[88%] left-[8%] z-10 max-w-[84%] rounded bg-wipp-share-panel p-2 text-[12px] text-wipp-danger">{error}</p> : null}
      <Btn aria-label="Continuer" disabled={busy} onClick={() => void finish()} className="absolute! top-[89.4%] left-[6%] h-[6.1%]! w-[88%] rounded-full! bg-transparent! text-transparent!" />
    </div>
  </main>;
}