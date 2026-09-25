import { useState } from "react";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { authUsername } from "@/lib/auth.functions";
import { WippLogo } from "@/components/native/WippLogo";
import { Pressable } from "@/components/native/Pressable";
import { motion as m } from "@/theme/theme";

/** Connexion / inscription par nom d'utilisateur, sans numéro. */
export function AuthScreen() {
  const call = useServerFn(authUsername);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const r = await call({ data: { action: mode, username, password } });
      if (!r.ok) return setError(r.error);
      await supabase.auth.setSession({ access_token: r.accessToken, refresh_token: r.refreshToken });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur, réessayez");
    } finally { setBusy(false); }
  };

  const field = "w-full rounded-[14px] border border-wipp-glass-border bg-wipp-surface px-4 py-3.5 text-wipp-fg outline-none placeholder:text-wipp-muted focus:border-wipp-accent";

  return (
    <div className="flex h-full flex-col justify-center px-6" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mb-10 flex justify-center"><WippLogo /></div>
      <motion.form key={mode} onSubmit={submit} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={m.spring} className="space-y-3">
        <h1 className="font-display text-[28px] font-bold text-wipp-fg">{mode === "signin" ? "Connexion" : "Créer un compte"}</h1>
        <p className="pb-2 text-[14px] text-wipp-muted">Pas de numéro de téléphone. Juste un nom d'utilisateur.</p>
        <input className={field} placeholder="@nom_utilisateur" autoCapitalize="none" autoCorrect="off" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input className={field} type="password" placeholder="Mot de passe (8 caractères min.)" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-[14px] text-wipp-danger">{error}</p>}
        <Pressable type="submit" disabled={busy} className="w-full rounded-[14px] bg-wipp-accent py-3.5 font-bold text-wipp-accent-fg disabled:opacity-60">
          {busy ? "Patientez…" : mode === "signin" ? "Se connecter" : "Créer mon compte"}
        </Pressable>
        <Pressable type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }} className="w-full py-2 text-[14px] text-wipp-muted">
          {mode === "signin" ? "Nouveau sur WIPP ? Créer un compte" : "Déjà un compte ? Se connecter"}
        </Pressable>
      </motion.form>
    </div>
  );
}
