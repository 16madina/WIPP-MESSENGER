import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// WIPP Touch (Migration D). Le téléphone ne diffuse qu'un jeton temporaire opaque (60 s) ;
// la base ne stocke que son SHA-256. L'identité vient TOUJOURS de la session.

const TOKEN = z.string().regex(/^[A-Za-z0-9_-]{22}$/);
const ID = z.string().regex(/^t_[0-9a-f]{32}$/);

async function myId(supabase: any): Promise<string> {
  const { data } = await supabase.rpc("wipp_my_profile_id");
  if (!data) throw new Error("Profil introuvable");
  return data as string;
}
async function sha256Hex(t: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return Array.from(new Uint8Array(d), (x) => x.toString(16).padStart(2, "0")).join("");
}
async function call(fn: string, args: Record<string, unknown>) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await (supabaseAdmin as any).rpc(fn, args);
  if (error) {
    console.error(fn, error.code); // jamais le jeton
    return { status: "error" } as Record<string, any>;
  }
  return data as Record<string, any>;
}

export type TouchCard = { id: string; username: string; display_name: string; avatar_url: string | null };

/** A ouvre Touch : jeton à diffuser par BLE/NFC (natif), valable 60 s. */
export const createTouchInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const me = await myId(context.supabase);
    const b = crypto.getRandomValues(new Uint8Array(16));
    const token = btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const res = await call("wipp_touch_create", { _me: me, _hash: await sha256Hex(token) });
    if (res.status !== "created") return { status: res.status as string };
    return { status: "created", id: res.id as string, token, expiresAt: res.expires_at as string };
  });

/** B (natif) signale avoir capté le jeton de A. */
export const reportTouchCandidate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      token: z.string().max(40),
      rssi: z.array(z.number().min(-127).max(20)).max(50).default([]),
      channel: z.enum(["ble", "nfc", "debug"]).default("ble"),
      platform: z.string().max(20).optional(),
      foreground: z.boolean().default(true),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const me = await myId(context.supabase);
    if (!TOKEN.safeParse(data.token).success) return { status: "invalid" };
    return call("wipp_touch_report", {
      _me: me, _hash: await sha256Hex(data.token), _rssi: data.rssi,
      _channel: data.channel, _platform: data.platform ?? null, _foreground: data.foreground,
    }) as Promise<{ status: string }>;
  });

export const listTouchCandidates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: ID }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await myId(context.supabase);
    return call("wipp_touch_candidates_for", { _me: me, _id: data.id }) as Promise<{ status: string; cards?: TouchCard[] }>;
  });

export const requestTouchConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: ID, profileId: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await myId(context.supabase);
    return call("wipp_touch_request", { _me: me, _id: data.id, _profile: data.profileId }) as Promise<{ status: string; expires_at?: string }>;
  });

export const respondTouchInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: ID, action: z.enum(["accept", "decline"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await myId(context.supabase);
    return call("wipp_touch_respond", { _me: me, _id: data.id, _action: data.action }) as Promise<{ status: string }>;
  });

export const cancelTouchInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: ID }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await myId(context.supabase);
    return call("wipp_touch_cancel", { _me: me, _id: data.id }) as Promise<{ status: string }>;
  });
