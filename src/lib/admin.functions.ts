// WIPP — espace admin : chaque appel re-vérifie la session et le rôle admin côté serveur.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Tok = z.object({ token: z.string().min(20) });

async function requireAdmin(token: string) {
  const { supabaseAdmin: admin } = await import("@/integrations/supabase/client.server");
  const { data: u } = await admin.auth.getUser(token);
  if (!u.user) throw new Error("Non connecté");
  const { data: p } = await admin.from("wipp_profiles").select("id, role").eq("auth_user_id", u.user.id).maybeSingle();
  if (p?.role !== "admin") throw new Error("Accès refusé");
  return { admin, meId: p.id as string };
}

export const adminCheck = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Tok.parse(d))
  .handler(async ({ data }) => {
    try { await requireAdmin(data.token); return true; } catch { return false; }
  });

export const adminStats = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Tok.parse(d))
  .handler(async ({ data }) => {
    const { admin } = await requireAdmin(data.token);
    const since = new Date(Date.now() - 7 * 864e5).toISOString();
    const count = async (t: string, f?: (q: any) => any) => {
      let q: any = admin.from(t as never).select("*", { count: "exact", head: true });
      if (f) q = f(q);
      return (await q).count ?? 0;
    };
    const [users, users7, messages, messages7, chats, connections, flags] = await Promise.all([
      count("wipp_profiles"), count("wipp_profiles", (q) => q.gte("created_at", since)),
      count("wipp_messages"), count("wipp_messages", (q) => q.gte("created_at", since)),
      count("wipp_chats"), count("wipp_connections"),
      count("wipp_moderation_flags", (q) => q.eq("status", "open")),
    ]);
    return { users, users7, messages, messages7, chats, connections, flags };
  });

export const adminUsers = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Tok.extend({ q: z.string().max(40).optional() }).parse(d))
  .handler(async ({ data }) => {
    const { admin } = await requireAdmin(data.token);
    let q = admin.from("wipp_profiles").select("id, username, display_name, avatar_url, role, created_at").order("created_at", { ascending: false }).limit(100);
    const s = data.q?.trim().replace(/[%_,()]/g, "");
    if (s) q = q.or(`username.ilike.%${s}%,display_name.ilike.%${s}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error("Liste indisponible");
    return rows ?? [];
  });

export const adminFlags = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Tok.parse(d))
  .handler(async ({ data }) => {
    const { admin } = await requireAdmin(data.token);
    const { data: rows, error } = await admin.from("wipp_moderation_flags")
      .select("id, target_type, target_id, reason, status, created_at").order("created_at", { ascending: false }).limit(100);
    if (error) throw new Error("Signalements indisponibles");
    return rows ?? [];
  });

export const adminResolveFlag = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Tok.extend({ id: z.string().min(1), status: z.enum(["dismissed", "actioned"]) }).parse(d))
  .handler(async ({ data }) => {
    const { admin, meId } = await requireAdmin(data.token);
    const { error } = await admin.from("wipp_moderation_flags").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error("Mise à jour impossible");
    await admin.from("wipp_moderation_access").insert({ id: "ma_" + crypto.randomUUID().replace(/-/g, ""), flag_id: data.id, actor_id: meId, action: data.status });
    return true;
  });
