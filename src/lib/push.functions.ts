import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// WIPP — notifications push (Firebase Cloud Messaging v1).
// Le corps des messages est chiffré de bout en bout : la notification
// ne transporte jamais le texte, seulement « Nouveau message ».

async function myProfileId(supabase: any, userId: string): Promise<string> {
  void userId; // l'identité vient uniquement de la session
  const { data } = await supabase.rpc("wipp_my_profile_id");
  if (!data) throw new Error("Profil introuvable");
  return data as string;
}

/** Enregistre (ou rafraîchit) le jeton push de cet appareil. */
export const savePushToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ token: z.string().min(10).max(4096), platform: z.string().max(20).default("web") }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const profileId = await myProfileId(context.supabase, context.userId);
    const now = new Date().toISOString();
    const { error } = await context.supabase.from("wipp_push_tokens").upsert(
      {
        id: `pt_${crypto.randomUUID()}`,
        token: data.token,
        profile_id: profileId,
        platform: data.platform,
        kind: "fcm",
        updated_at: now,
      },
      { onConflict: "token" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Supprime le jeton de cet appareil (désactivation des notifications). */
export const removePushToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ token: z.string().min(10).max(4096) }).parse(d))
  .handler(async ({ data, context }) => {
    const profileId = await myProfileId(context.supabase, context.userId);
    await context.supabase.from("wipp_push_tokens").delete().eq("token", data.token).eq("profile_id", profileId);
    return { ok: true };
  });

// ---- Envoi FCM v1 avec la clé de compte de service (secret serveur) ----

type ServiceAccount = { client_email: string; private_key: string; project_id?: string };

let cachedToken: { value: string; expiresAt: number } | null = null;

function readServiceAccount(): ServiceAccount | null {
  const raw = process.env["FIREBASE_SERVICE_ACCOUNT"];
  if (!raw) return null;
  try {
    const sa = JSON.parse(raw) as ServiceAccount;
    return sa.client_email && sa.private_key ? sa : null;
  } catch {
    return null;
  }
}

async function googleAccessToken(sa: ServiceAccount): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const { createSign } = await import("node:crypto");
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const sign = createSign("RSA-SHA256");
  sign.update(unsigned);
  const jwt = `${unsigned}.${sign.sign(sa.private_key, "base64url")}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  if (!res.ok) throw new Error(`Google OAuth [${res.status}]: ${await res.text()}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

async function sendFcm(accessToken: string, projectId: string, token: string, title: string, body: string, path: string) {
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body },
        data: { path },
        webpush: { notification: { icon: "/favicon.svg" } },
      },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    // Jeton périmé : 404 UNREGISTERED / 400 → à supprimer par l'appelant.
    const stale = res.status === 404 || res.status === 400;
    const err = new Error(`FCM [${res.status}]: ${text}`) as Error & { stale?: boolean };
    err.stale = stale;
    throw err;
  }
}

/**
 * Appelée par l'expéditeur juste après l'envoi d'un message.
 * Notifie les autres membres de la conversation (sauf sourdine active).
 * Ne renvoie jamais d'erreur à l'expéditeur : l'échec d'une notification
 * ne doit pas faire échouer l'envoi du message.
 */
export const notifyNewMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ chatId: z.string().min(1).max(128) }).parse(d))
  .handler(async ({ data, context }) => {
    try {
      const sa = readServiceAccount();
      if (!sa) return { ok: false, reason: "not-configured" };
      const me = await myProfileId(context.supabase, context.userId);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      // Vérifie que l'appelant est bien membre de la conversation.
      const { data: membership } = await supabaseAdmin
        .from("wipp_chat_members")
        .select("profile_id")
        .eq("chat_id", data.chatId)
        .eq("profile_id", me)
        .maybeSingle();
      if (!membership) return { ok: false, reason: "not-a-member" };

      const { data: members } = await supabaseAdmin
        .from("wipp_chat_members")
        .select("profile_id, muted_until, muted_forever")
        .eq("chat_id", data.chatId);
      const now = Date.now();
      const recipientIds = (members ?? [])
        .filter((m: any) => m.profile_id !== me)
        .filter((m: any) => !m.muted_forever && (!m.muted_until || new Date(m.muted_until).getTime() < now))
        .map((m: any) => m.profile_id as string);
      if (!recipientIds.length) return { ok: true, sent: 0 };

      const { data: tokens } = await supabaseAdmin
        .from("wipp_push_tokens")
        .select("id, token")
        .in("profile_id", recipientIds);
      if (!tokens?.length) return { ok: true, sent: 0 };

      const { data: sender } = await supabaseAdmin
        .from("wipp_profiles")
        .select("first_name")
        .eq("id", me)
        .maybeSingle();
      const title = (sender as any)?.first_name || "WIPP";

      const accessToken = await googleAccessToken(sa);
      const projectId = sa.project_id || "wipp-61124";
      let sent = 0;
      for (const t of tokens as any[]) {
        try {
          await sendFcm(accessToken, projectId, t.token, title, "Nouveau message", "/");
          sent++;
        } catch (e: any) {
          if (e?.stale) await supabaseAdmin.from("wipp_push_tokens").delete().eq("id", t.id);
        }
      }
      return { ok: true, sent };
    } catch {
      return { ok: false, reason: "error" };
    }
  });
