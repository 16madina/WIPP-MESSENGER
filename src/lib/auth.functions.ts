// WIPP — inscription par numéro vérifié par SMS (Firebase) ; secret interne généré côté serveur.
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
const Username = z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,20}$/);
const Country = z.string().regex(/^[A-Z]{2}$/);

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

export const usernameAvailable = createServerFn({ method: "POST" })
  .inputValidator(parse(z.object({ username: Username }), "Pseudo invalide"))
  .handler(async ({ data }) => {
    const { admin } = await ctx();
    const { data: existing, error } = await admin.from("wipp_profiles").select("id").ilike("username", data.username).limit(1);
    if (error) throw new Error("Vérification indisponible");
    return !existing?.length;
  });

export const signupPhone = createServerFn({ method: "POST" })
  .inputValidator(parse(z.object({ idToken: z.string().min(20), firstName: Name, lastName: Name, username: Username, country: Country, avatar: z.string().max(60000).refine((v) => /^\/avatars\/[a-z0-9-]+\.jpg$/.test(v) || /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(v)).optional() }), "Informations du profil invalides"))
  .handler(async ({ data }): Promise<Result> => {
    const { verifyFirebasePhone } = await import("./firebase-verify.server");
    let v: { uid: string; phone: string };
    try { v = await verifyFirebasePhone(data.idToken); } catch { return { ok: false, error: "Code SMS expiré, recommencez" }; }
    const { admin, signIn } = await ctx();
    const { data: existing, error: checkError } = await admin.from("wipp_profiles").select("id").eq("phone_e164", v.phone).maybeSingle();
    if (checkError) return { ok: false, error: "Vérification du numéro indisponible" };
    if (existing) return { ok: false, error: "Un compte existe déjà avec ce numéro. Connectez-vous." };
    const { data: taken, error: usernameError } = await admin.from("wipp_profiles").select("id").ilike("username", data.username).limit(1);
    if (usernameError) return { ok: false, error: "Vérification du pseudo indisponible" };
    if (taken?.length) return { ok: false, error: "Ce pseudo est déjà utilisé." };
    const id = "u_" + crypto.randomUUID().replace(/-/g, "").slice(0, 24);
    const email = `${id}@users.wipp.app`;
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const password = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    const { data: c, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { country: data.country } });
    if (error || !c.user) return { ok: false, error: "Création du compte impossible" };
    const { error: pErr } = await admin.from("wipp_profiles").insert({
      id, username: data.username, display_name: `${data.firstName} ${data.lastName}`, password_hash: "",
      phone_e164: v.phone, firebase_uid: v.uid, auth_user_id: c.user.id, avatar_url: data.avatar ?? null,
    });
    if (pErr) { await admin.auth.admin.deleteUser(c.user.id); return { ok: false, error: pErr.code === "23505" ? "Ce pseudo ou ce numéro est déjà utilisé." : "Création du profil impossible" }; }
    return signIn(email, password);
  });

export const signinPhone = createServerFn({ method: "POST" })
  .inputValidator(parse(z.object({ phone: Phone, password: z.string().min(4).max(128) }), GENERIC))
  .handler(async ({ data }): Promise<Result> => {
    const { admin, signIn, emailOf } = await ctx();
    const { data: p } = await admin.from("wipp_profiles").select("id, password_hash, auth_user_id").eq("phone_e164", data.phone).maybeSingle();
    if (!p) return { ok: false, error: GENERIC };
    // TEMPORAIRE (en attendant les SMS) : code admin fixe stocké en secret serveur.
    const adminPhone = process.env["WIPP_ADMIN_PHONE"], adminCode = process.env["WIPP_ADMIN_CODE"];
    if (adminPhone && adminCode && data.phone === adminPhone && p.auth_user_id) {
      if (data.password !== adminCode) return { ok: false, error: GENERIC };
      const email = await emailOf(p.auth_user_id);
      if (!email) return { ok: false, error: GENERIC };
      const password = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, "0")).join("");
      const { error } = await admin.auth.admin.updateUserById(p.auth_user_id, { password });
      if (error) return { ok: false, error: "Connexion impossible" };
      return signIn(email, password);
    }
    if (data.password.length < 8) return { ok: false, error: GENERIC };
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
