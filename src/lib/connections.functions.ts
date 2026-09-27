import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Demandes de connexion / contacts WIPP.
// L'identité vient TOUJOURS de la session : le client n'envoie jamais son propre id.
// Les écritures passent par des fonctions SQL transactionnelles réservées au serveur.

async function myId(supabase: any): Promise<string> {
  const { data } = await supabase.rpc("wipp_my_profile_id");
  if (!data) throw new Error("Profil introuvable");
  return data as string;
}

export const sendConnectionRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ recipientUsername: z.string().min(1).max(64), via: z.enum(["request", "qr", "touch"]).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const me = await myId(context.supabase);
    const { data: peer } = await context.supabase
      .from("wipp_profiles")
      .select("id")
      .eq("username", data.recipientUsername)
      .maybeSingle();
    if (!peer) return { status: "not_found" as string };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: res, error } = await (supabaseAdmin as any).rpc("wipp_send_connection_request", {
      _me: me,
      _recipient: peer.id,
      _via: data.via ?? "request",
    });
    if (error) {
      console.error("sendConnectionRequest", error.code);
      return { status: "error" };
    }
    return res as { status: string; id?: string };
  });

export const respondConnectionRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), action: z.enum(["accept", "decline", "ignore"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const me = await myId(context.supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: res, error } = await (supabaseAdmin as any).rpc("wipp_respond_connection_request", {
      _me: me,
      _id: data.id,
      _action: data.action,
    });
    if (error) {
      console.error("respondConnectionRequest", error.code);
      return { status: "error" };
    }
    return res as { status: string };
  });
