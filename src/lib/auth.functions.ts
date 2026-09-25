// WIPP — connexion / inscription par username (sans numéro).
// Migration douce : un profil sans compte Auth est vérifié via l'ancien password_hash,
// puis un compte Auth est créé avec le même mot de passe et le hash est vidé.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  action: z.enum(["signup", "signin"]),
  username: z.string().trim().toLowerCase().transform((u) => u.replace(/^@/, "")).pipe(z.string().regex(/^[a-z0-9._]{3,24}$/)),
  password: z.string().min(8).max(128),
  displayName: z.string().max(40).optional(),
});

type Result = { ok: true; accessToken: string; refreshToken: string } | { ok: false; error: string };
const GENERIC = "Nom d'utilisateur ou mot de passe incorrect";

export const authUsername = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => {
    const r = Input.safeParse(d);
    if (!r.success) throw new Error("Nom d'utilisateur (3 à 24 : lettres, chiffres, . _) ou mot de passe (8 min.) invalide");
    return r.data;
  })
  .handler(async ({ data }): Promise<Result> => {
    const { createClient } = await import("@supabase/supabase-js");
    const { supabaseAdmin: admin } = await import("@/integrations/supabase/client.server");
    const { verifyLegacyHash } = await import("./legacy-hash.server");
    const url = process.env["SUPABASE_URL"]!;
    const anonKey = process.env["SUPABASE_ANON_KEY"] ?? process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const anon = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { username, password } = data;
    const email = `${username}@users.wipp.app`;

    const signIn = async (): Promise<Result> => {
      const { data: s, error } = await anon.auth.signInWithPassword({ email, password });
      if (error || !s.session) return { ok: false, error: GENERIC };
      return { ok: true, accessToken: s.session.access_token, refreshToken: s.session.refresh_token };
    };
    const createAuthUser = () =>
      admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { username } });

    const { data: profile } = await admin.from("wipp_profiles")
      .select("id, password_hash, auth_user_id").eq("username", username).maybeSingle();

    if (data.action === "signup") {
      if (profile) return { ok: false, error: "Ce nom d'utilisateur est déjà pris" };
      const { data: c, error } = await createAuthUser();
      if (error || !c.user) return { ok: false, error: "Création du compte impossible" };
      const id = "u_" + crypto.randomUUID().replace(/-/g, "").slice(0, 24);
      const { error: pErr } = await admin.from("wipp_profiles").insert({
        id, username, display_name: data.displayName?.trim() || username, password_hash: "", auth_user_id: c.user.id,
      });
      if (pErr) { await admin.auth.admin.deleteUser(c.user.id); return { ok: false, error: "Création du profil impossible" }; }
      return signIn();
    }

    if (!profile) return { ok: false, error: GENERIC };
    if (profile.auth_user_id) return signIn();
    if (!profile.password_hash || !(await verifyLegacyHash(password, profile.password_hash))) return { ok: false, error: GENERIC };
    const { data: c, error } = await createAuthUser();
    if (error || !c.user) return { ok: false, error: "Migration du compte impossible" };
    const { error: uErr } = await admin.from("wipp_profiles")
      .update({ auth_user_id: c.user.id, password_hash: "" }).eq("id", profile.id);
    if (uErr) { await admin.auth.admin.deleteUser(c.user.id); return { ok: false, error: "Migration du compte impossible" }; }
    return signIn();
  });
