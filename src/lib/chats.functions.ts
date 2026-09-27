import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Open (or reuse) a 1:1 chat. Chat/member creation is server-only (RLS denies inserts). */
export const openDm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ peerUsername: z.string().min(1).max(64) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: me } = await context.supabase
      .from("wipp_profiles")
      .select("id")
      .eq("auth_user_id", context.userId)
      .maybeSingle();
    if (!me) throw new Error("Profil introuvable");
    const { data: peer } = await context.supabase
      .from("wipp_profiles")
      .select("id")
      .eq("username", data.peerUsername)
      .maybeSingle();
    if (!peer || peer.id === me.id) throw new Error("Contact introuvable");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: mine } = await supabaseAdmin
      .from("wipp_chat_members")
      .select("chat_id")
      .eq("profile_id", me.id);
    const ids = (mine ?? []).map((r) => r.chat_id);
    if (ids.length) {
      const { data: shared } = await supabaseAdmin
        .from("wipp_chat_members")
        .select("chat_id")
        .eq("profile_id", peer.id)
        .in("chat_id", ids);
      for (const row of shared ?? []) {
        const { count } = await supabaseAdmin
          .from("wipp_chat_members")
          .select("profile_id", { count: "exact", head: true })
          .eq("chat_id", row.chat_id);
        if (count === 2) return { chatId: row.chat_id };
      }
    }
    const chatId = `c_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from("wipp_chats")
      .insert({ id: chatId, created_at: now, realtime_key: crypto.randomUUID() } as never);
    if (error) throw new Error(error.message);
    const { error: e2 } = await supabaseAdmin.from("wipp_chat_members").insert([
      { chat_id: chatId, profile_id: me.id, joined_at: now },
      { chat_id: chatId, profile_id: peer.id, joined_at: now },
    ] as never);
    if (e2) throw new Error(e2.message);
    return { chatId };
  });
