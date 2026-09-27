import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// QR temporaires et invitations de groupe (Migration C).
// Le jeton brut (32 octets aléatoires) n'est renvoyé qu'à sa création et n'est jamais
// stocké ni journalisé : la base ne reçoit que son SHA-256. L'identité vient de la session.

const TOKEN = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

async function myId(supabase: any): Promise<string> {
  const { data } = await supabase.rpc("wipp_my_profile_id");
  if (!data) throw new Error("Profil introuvable");
  return data as string;
}

function newToken(): string {
  const b = crypto.getRandomValues(new Uint8Array(32));
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256Hex(t: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return Array.from(new Uint8Array(d), (x) => x.toString(16).padStart(2, "0")).join("");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

async function call(fn: string, args: Record<string, unknown>) {
  const { data, error } = await (await admin()).rpc(fn, args);
  if (error) {
    console.error(fn, error.code); // jamais le jeton
    return { status: "error" } as Record<string, any>;
  }
  return data as Record<string, any>;
}

export const issueTempQr = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const me = await myId(context.supabase);
    const token = newToken();
    const res = await call("wipp_issue_qr_token", { _me: me, _hash: await sha256Hex(token) });
    if (res.status !== "issued") return { status: res.status as string };
    return { status: "issued", token, ttlMs: Number(res.ttl_ms) };
  });

export const redeemTempQr = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ token: z.string().max(80) }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await myId(context.supabase);
    if (!TOKEN.safeParse(data.token).success) return { status: "invalid" };
    return call("wipp_redeem_qr_token", { _me: me, _hash: await sha256Hex(data.token) }) as Promise<{
      status: string;
      profile?: { id: string; username: string; display_name: string; avatar_url: string | null; bio: string };
      connected?: boolean;
    }>;
  });

export const createGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ name: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await myId(context.supabase);
    return call("wipp_create_group", { _me: me, _name: data.name }) as Promise<{ status: string; chat_id?: string }>;
  });

export const createGroupInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      chatId: z.string().min(1).max(80),
      expiresInSec: z.number().int().min(60).max(60 * 60 * 24 * 30).nullable().optional(),
      maxUses: z.number().int().min(1).max(10000).nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const me = await myId(context.supabase);
    const token = newToken();
    const res = await call("wipp_create_group_invite", {
      _me: me,
      _chat: data.chatId,
      _hash: await sha256Hex(token),
      _expires_at: data.expiresInSec ? new Date(Date.now() + data.expiresInSec * 1000).toISOString() : null,
      _max_uses: data.maxUses ?? null,
    });
    if (res.status !== "created") return { status: res.status as string };
    return { status: "created", id: res.id as string, token };
  });

export const revokeGroupInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await myId(context.supabase);
    return call("wipp_revoke_group_invite", { _me: me, _id: data.id }) as Promise<{ status: string }>;
  });

export const groupInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ token: z.string().max(80), join: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await myId(context.supabase);
    if (!TOKEN.safeParse(data.token).success) return { status: "invalid" };
    return call("wipp_group_invite_check", {
      _me: me,
      _hash: await sha256Hex(data.token),
      _join: data.join,
    }) as Promise<{ status: string; chat_id?: string; name?: string; members?: number }>;
  });
