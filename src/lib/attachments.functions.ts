import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Pièces jointes chiffrées : le serveur ne stocke que des morceaux chiffrés.
 * Les tables refusent l'écriture côté navigateur, donc tout passe ici après
 * vérification : appelant connecté ET membre de la conversation.
 */
const MAX_BYTES = 25 * 1024 * 1024;
const MAX_CHUNKS = 64;

type Ctx = { supabase: any; userId: string };

async function myProfileId(ctx: Ctx) {
  const { data } = await ctx.supabase.from("wipp_profiles").select("id").eq("auth_user_id", ctx.userId).maybeSingle();
  if (!data) throw new Error("Profil introuvable");
  return data.id as string;
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

async function assertMember(db: any, chatId: string, profileId: string) {
  const { data } = await db
    .from("wipp_chat_members")
    .select("chat_id")
    .eq("chat_id", chatId)
    .eq("profile_id", profileId)
    .maybeSingle();
  if (!data) throw new Error("Accès refusé");
}

async function loadAttachment(db: any, id: string) {
  const { data } = await db.from("wipp_attachments").select("*").eq("id", id).maybeSingle();
  if (!data) throw new Error("Pièce jointe introuvable");
  return data as {
    id: string;
    chat_id: string;
    owner_id: string;
    state: string;
    view_once: boolean;
    chunk_count: number;
    claimed_by: string | null;
  };
}

export const createAttachment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        chatId: z.string().min(1).max(80),
        chunkCount: z.number().int().min(1).max(MAX_CHUNKS),
        byteSize: z.number().int().min(1).max(MAX_BYTES),
        viewOnce: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const me = await myProfileId(context as Ctx);
    const db = await admin();
    await assertMember(db, data.chatId, me);
    const id = `a_${crypto.randomUUID()}`;
    const { error } = await db.from("wipp_attachments").insert({
      id,
      chat_id: data.chatId,
      owner_id: me,
      state: "uploading",
      view_once: Boolean(data.viewOnce),
      chunk_count: data.chunkCount,
      byte_size: data.byteSize,
    });
    if (error) throw new Error(error.message);
    return { id, state: "uploading" };
  });

export const putAttachmentChunk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        attachmentId: z.string().min(1).max(80),
        index: z.number().int().min(0).max(MAX_CHUNKS - 1),
        ciphertext: z.string().min(1).max(8 * 1024 * 1024),
        sha256: z.string().min(16).max(128),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const me = await myProfileId(context as Ctx);
    const db = await admin();
    const att = await loadAttachment(db, data.attachmentId);
    if (att.owner_id !== me || att.state !== "uploading" || data.index >= att.chunk_count) throw new Error("Refusé");
    const { error } = await db.from("wipp_attachment_chunks").upsert({
      attachment_id: att.id,
      chunk_index: data.index,
      ciphertext_b64: data.ciphertext,
      sha256: data.sha256,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const completeAttachment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ attachmentId: z.string().min(1).max(80), messageId: z.string().max(80).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const me = await myProfileId(context as Ctx);
    const db = await admin();
    const att = await loadAttachment(db, data.attachmentId);
    if (att.owner_id !== me) throw new Error("Refusé");
    const { count } = await db
      .from("wipp_attachment_chunks")
      .select("chunk_index", { count: "exact", head: true })
      .eq("attachment_id", att.id);
    if ((count ?? 0) < att.chunk_count) throw new Error("Envoi incomplet");
    await db.from("wipp_attachments").update({ state: "ready", message_id: data.messageId ?? null }).eq("id", att.id);
    return { ok: true, state: "ready" };
  });

export const fetchAttachmentChunk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ attachmentId: z.string().min(1).max(80), index: z.number().int().min(0).max(MAX_CHUNKS - 1) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const me = await myProfileId(context as Ctx);
    const db = await admin();
    const att = await loadAttachment(db, data.attachmentId);
    await assertMember(db, att.chat_id, me);
    if (att.state === "consumed") throw new Error("Déjà ouvert");
    if (att.state !== "ready") throw new Error("Pas encore prêt");
    if (att.view_once && att.owner_id !== me && att.claimed_by && att.claimed_by !== me) throw new Error("Refusé");
    const { data: row } = await db
      .from("wipp_attachment_chunks")
      .select("ciphertext_b64, sha256, chunk_index")
      .eq("attachment_id", att.id)
      .eq("chunk_index", data.index)
      .maybeSingle();
    if (!row) throw new Error("Morceau introuvable");
    return { ciphertext: row.ciphertext_b64 as string, sha256: row.sha256 as string, index: row.chunk_index as number };
  });

/** Voir une fois : après ouverture par le destinataire, les morceaux sont effacés. */
export const consumeAttachment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ attachmentId: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await myProfileId(context as Ctx);
    const db = await admin();
    const att = await loadAttachment(db, data.attachmentId);
    await assertMember(db, att.chat_id, me);
    if (!att.view_once || att.owner_id === me) return { ok: true, state: att.state };
    await db.from("wipp_attachment_chunks").delete().eq("attachment_id", att.id);
    await db
      .from("wipp_attachments")
      .update({ state: "consumed", consumed_at: new Date().toISOString(), claimed_by: me, claimed_at: new Date().toISOString() })
      .eq("id", att.id);
    return { ok: true, state: "consumed" };
  });
