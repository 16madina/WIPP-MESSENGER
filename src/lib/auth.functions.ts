// WIPP — inscription / connexion : prénom, nom, numéro vérifié par SMS (Firebase), mot de passe.
// Le numéro reste privé (jamais affiché, pas de recherche par numéro).
// Compte Supabase Auth avec e-mail interne invisible <profileId>@users.wipp.app.
// Migration douce : un ancien profil (numéro + password_hash) est relié au premier login.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type Result = { ok: true; accessToken: string; refreshToken: string } | { ok: false; error: string };
const GENERIC = "Numéro ou mot de passe incorrect";
const Phone = z.string().regex(/^\+[1-9]\d{6,14}$/);
const Password = z.string().min(8).max(128);
const Name = z.string().trim().min(1).max(40);

async function ctx() {
  const { createClient } = await import("@supabase/supabase-js");
  const { supabaseAdmin: admin } = await import("@/integrations/supabase/client.server");
  const anonKey = process.env["SUPABASE_ANON_KEY"] ?? process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const anon = createClient(process.env["SUPABASE_URL"]!, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const signIn = async (email: string, password: string): Promise<Result> => {
    const { data: s, error } = await anon.auth.signInWithPassword({ email, password });
    if (error || !s.session) return { ok: false, error: GENERIC };
    return { ok: true, accessToken: s.session.access_token, refreshToken: s.session.refresh_token };
  };
  const emailOf = async (authUserId: string) => (await admin.auth.admin.getUserById(authUserId)).data.user?.email ?? null;
  return { admin, signIn, emailOf };
}

const parse = <T,>(schema: z.ZodType<T>, msg: string) => (d: unknown) => {
  const r = schema.safeParse(d);
  if (!r.success) throw new Error(msg);
  return r.data;
};

export const signupPhone = createServerFn({ method: "POST" })
  .inputValidator(parse(z.object({ idToken: z.string().min(20), firstName: Name, lastName: Name, password: Password }), "Prénom, nom ou mot de passe (8 caractères min.) invalide"))
  .handler(async ({ data }): Promise<Result> => {
    const { verifyFirebasePhone } = await import("./firebase-verify.server");
    let v: { uid: string; phone: string };
    try { v = await verifyFirebasePhone(data.idToken); } catch { return { ok: false, error: "Code SMS expiré, recommencez" }; }
    const { admin, signIn } = await ctx();
    const { data: existing } = await admin.from("wipp_profiles").select("id").eq("phone_e164", v.phone).maybeSingle();
    if (existing) return { ok: false, error: "Un compte existe déjà avec ce numéro. Connectez-vous." };
    const id = "u_" + crypto.randomUUID().replace(/-/g, "").slice(0, 24);
    const email = `${id}@users.wipp.app`;
    const { data: c, error } = await admin.auth.admin.createUser({ email, password: data.password, email_confirm: true });
    if (error || !c.user) return { ok: false, error: "Création du compte impossible" };
    const { error: pErr } = await admin.from("wipp_profiles").insert({
      id, username: id, display_name: `${data.firstName} ${data.lastName}`, password_hash: "",
      phone_e164: v.phone, firebase_uid: v.uid, auth_user_id: c.user.id,
    });
    if (pErr) { await admin.auth.admin.deleteUser(c.user.id); return { ok: false, error: "Création du profil impossible" }; }
    return signIn(email, data.password);
  });

export const signinPhone = createServerFn({ method: "POST" })
  .inputValidator(parse(z.object({ phone: Phone, password: Password }), GENERIC))
  .handler(async ({ data }): Promise<Result> => {
    const { admin, signIn, emailOf } = await ctx();
    const { data: p } = await admin.from("wipp_profiles").select("id, password_hash, auth_user_id").eq("phone_e164", data.phone).maybeSingle();
    if (!p) return { ok: false, error: GENERIC };
    if (p.auth_user_id) {
      const email = await emailOf(p.auth_user_id);
      return email ? signIn(email, data.password) : { ok: false, error: GENERIC };
    }
    const { verifyLegacyHash } = await import("./legacy-hash.server");
    if (!p.password_hash || !(await verifyLegacyHash(data.password, p.password_hash))) return { ok: false, error: GENERIC };
    const email = `${p.id}@users.wipp.app`;
    const { data: c, error } = await admin.auth.admin.createUser({ email, password: data.password, email_confirm: true });
    if (error || !c.user) return { ok: false, error: "Migration du compte impossible" };
    const { error: uErr } = await admin.from("wipp_profiles").update({ auth_user_id: c.user.id, password_hash: "" }).eq("id", p.id);
    if (uErr) { await admin.auth.admin.deleteUser(c.user.id); return { ok: false, error: "Migration du compte impossible" }; }
    return signIn(email, data.password);
  });

/** TEMPORAIRE : indique si le mode démo est activé côté serveur. */
export const devLoginAvailable = createServerFn({ method: "GET" }).handler(async () => !!process.env["WIPP_DEV_LOGIN"]);

/** TEMPORAIRE (développement) : connexion sans SMS à un compte démo. À retirer avant publication. */
export const devSignin = createServerFn({ method: "POST" }).handler(async (): Promise<Result> => {
  if (!process.env["WIPP_DEV_LOGIN"]) return { ok: false, error: "Mode démo désactivé" };
  const { admin, signIn } = await ctx();
  const id = "u_demo";
  const email = `${id}@users.wipp.app`;
  const password = "wipp-demo-" + (process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "").slice(0, 8);
  const { data: p } = await admin.from("wipp_profiles").select("id, auth_user_id").eq("id", id).maybeSingle();
  if (!p) {
    const { data: c, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !c.user) return { ok: false, error: "Création du compte démo impossible" };
    const { error: pErr } = await admin.from("wipp_profiles").insert({ id, username: id, display_name: "Compte démo", password_hash: "", auth_user_id: c.user.id });
    if (pErr) return { ok: false, error: "Création du profil démo impossible" };
  }
  return signIn(email, password);
});

/**
 * REMOVE BEFORE PRODUCTION — connexion DEV aux comptes de test wipp_test_a / wipp_test_b.
 * Aucun mot de passe dans le navigateur : un mot de passe aléatoire est posé côté serveur à
 * chaque appel puis oublié. Refusé si WIPP_DEV_LOGIN absent ou sur les domaines publiés.
 */
const TEST_ACCOUNTS = { a: "wipp_test_a", b: "wipp_test_b" } as const;
export const devSigninTest = createServerFn({ method: "POST" })
  .inputValidator(parse(z.object({ who: z.enum(["a", "b"]) }), "Compte inconnu"))
  .handler(async ({ data }): Promise<Result> => {
    if (!process.env["WIPP_DEV_LOGIN"]) return { ok: false, error: "Mode test désactivé" };
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const host = (getRequestHeader("x-forwarded-host") ?? getRequestHeader("host") ?? "").toLowerCase();
    if (/(^|\.)wippapp\.com$|wipp-connect-chat\.lovable\.app$/.test(host.split(":")[0])) return { ok: false, error: "Indisponible" };
    const { admin, signIn, emailOf } = await ctx();
    const { data: p } = await admin.from("wipp_profiles").select("auth_user_id").eq("username", TEST_ACCOUNTS[data.who]).maybeSingle();
    if (!p?.auth_user_id) return { ok: false, error: "Compte de test absent" };
    const email = await emailOf(p.auth_user_id);
    if (!email) return { ok: false, error: "Compte de test absent" };
    const b = crypto.getRandomValues(new Uint8Array(24));
    const password = btoa(String.fromCharCode(...b));
    const { error } = await admin.auth.admin.updateUserById(p.auth_user_id, { password });
    if (error) return { ok: false, error: "Connexion impossible" };
    return signIn(email, password);
  });


/** Mot de passe oublié : le numéro est re-vérifié par SMS, puis nouveau mot de passe. */
export const resetPasswordPhone = createServerFn({ method: "POST" })
  .inputValidator(parse(z.object({ idToken: z.string().min(20), password: Password }), "Mot de passe (8 caractères min.) invalide"))
  .handler(async ({ data }): Promise<Result> => {
    const { verifyFirebasePhone } = await import("./firebase-verify.server");
    let v: { uid: string; phone: string };
    try { v = await verifyFirebasePhone(data.idToken); } catch { return { ok: false, error: "Code SMS expiré, recommencez" }; }
    const { admin, signIn } = await ctx();
    const { data: p } = await admin.from("wipp_profiles").select("id, auth_user_id").eq("phone_e164", v.phone).maybeSingle();
    if (!p) return { ok: false, error: "Aucun compte avec ce numéro" };
    let authId = p.auth_user_id;
    const email = authId ? (await admin.auth.admin.getUserById(authId)).data.user?.email ?? `${p.id}@users.wipp.app` : `${p.id}@users.wipp.app`;
    if (authId) {
      const { error } = await admin.auth.admin.updateUserById(authId, { password: data.password });
      if (error) return { ok: false, error: "Changement impossible" };
    } else {
      const { data: c, error } = await admin.auth.admin.createUser({ email, password: data.password, email_confirm: true });
      if (error || !c.user) return { ok: false, error: "Changement impossible" };
      authId = c.user.id;
    }
    await admin.from("wipp_profiles").update({ auth_user_id: authId, password_hash: "", firebase_uid: v.uid }).eq("id", p.id);
    return signIn(email, data.password);
  });
