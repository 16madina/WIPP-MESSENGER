import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Open (or reuse) a 1:1 chat. Chat/member creation is server-only (RLS denies inserts). */
export const openDm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ peerUsername: z.string().min(1).max(64) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: myId } = await (context.supabase as any).rpc("wipp_my_profile_id");
    const me = myId ? { id: myId as string } : null;
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
      const sharedIds = (shared ?? []).map((r) => r.chat_id);
      const { data: personal } = sharedIds.length
        ? await supabaseAdmin.from("wipp_chats").select("id").in("id", sharedIds).is("business_card_id" as never, null)
        : { data: [] as { id: string }[] };
      const personalIds = new Set((personal ?? []).map((r) => r.id));
      for (const row of (shared ?? []).filter((r) => personalIds.has(r.chat_id))) {
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

async function myProfileId(supabase: unknown) {
  const { data } = await (supabase as any).rpc("wipp_my_profile_id");
  if (!data) throw new Error("Profil introuvable");
  return data as string;
}

/** Ouvre (ou reprend) la conversation professionnelle avec une boutique publiée. Une seule conversation par client et par carte. */
export const openBusinessChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ publicId: z.string().min(3).max(80) }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await myProfileId(context.supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: card } = await supabaseAdmin
      .from("wipp_business_cards")
      .select("id, owner_profile_id")
      .eq("public_id", data.publicId)
      .eq("is_published", true)
      .maybeSingle();
    if (!card) throw new Error("Boutique introuvable");
    if (card.owner_profile_id === me) throw new Error("C'est ta propre boutique");
    const { data: existing } = await (supabaseAdmin as any)
      .from("wipp_chats")
      .select("id, wipp_chat_members!inner(profile_id)")
      .eq("business_card_id", card.id)
      .eq("wipp_chat_members.profile_id", me);
    if (existing?.length) return { chatId: existing[0].id as string };
    const chatId = `c_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin.from("wipp_chats").insert({
      id: chatId, created_at: now, realtime_key: crypto.randomUUID(),
      business_card_id: card.id, business_owner_id: card.owner_profile_id,
    } as never);
    if (error) throw new Error(error.message);
    const { error: e2 } = await supabaseAdmin.from("wipp_chat_members").insert([
      { chat_id: chatId, profile_id: me, joined_at: now },
      { chat_id: chatId, profile_id: card.owner_profile_id, joined_at: now },
    ] as never);
    if (e2) throw new Error(e2.message);
    return { chatId };
  });

export type BusinessChatContext = {
  chatId: string; publicId: string; name: string; category: string; city: string; logoUrl: string | null; ownerIsMe: boolean;
};

/** Contexte professionnel des conversations dont je suis membre (aucune donnée privée du propriétaire). */
export const listBusinessChatContexts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BusinessChatContext[]> => {
    const me = await myProfileId(context.supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: mine } = await supabaseAdmin.from("wipp_chat_members").select("chat_id").eq("profile_id", me);
    const ids = (mine ?? []).map((r) => r.chat_id);
    if (!ids.length) return [];
    const { data: chats } = await (supabaseAdmin as any)
      .from("wipp_chats")
      .select("id, business_owner_id, wipp_business_cards(public_id, name, category, city, logo_url)")
      .in("id", ids)
      .not("business_card_id", "is", null);
    const rows = ((chats ?? []) as any[]).filter((c) => c.wipp_business_cards);
    const paths = rows.map((c) => c.wipp_business_cards.logo_url).filter(Boolean);
    const { data: signed } = paths.length
      ? await supabaseAdmin.storage.from("wipp-business-cards").createSignedUrls(paths, 3600)
      : { data: [] };
    const byPath = new Map((signed ?? []).map((x) => [x.path, x.signedUrl]));
    return rows.map((c) => ({
      chatId: c.id,
      publicId: c.wipp_business_cards.public_id,
      name: c.wipp_business_cards.name,
      category: c.wipp_business_cards.category,
      city: c.wipp_business_cards.city,
      logoUrl: c.wipp_business_cards.logo_url ? byPath.get(c.wipp_business_cards.logo_url) ?? null : null,
      ownerIsMe: c.business_owner_id === me,
    }));
  });
