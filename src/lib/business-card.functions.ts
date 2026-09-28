import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const cardInput = z.object({
  name: z.string().trim().min(2).max(80), category: z.string().trim().min(2).max(60), description: z.string().trim().max(500),
  country: z.string().trim().min(2).max(80), city: z.string().trim().min(2).max(80), address: z.string().trim().max(180).nullable(),
  showAddress: z.boolean(), hours: z.string().trim().max(240).nullable(), businessPhone: z.string().trim().max(40).nullable(),
  website: z.string().trim().max(200).nullable(), coverPath: z.string().trim().max(400).nullable(), logoPath: z.string().trim().max(400).nullable(),
  photoPaths: z.array(z.string().trim().max(400)).max(8),
});
type CardRow = Database["public"]["Tables"]["wipp_business_cards"]["Row"];

async function present(row: CardRow) {
  const paths = [row.cover_url, row.logo_url, ...row.photo_urls].filter((x): x is string => Boolean(x));
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = paths.length ? await supabaseAdmin.storage.from("wipp-business-cards").createSignedUrls(paths, 3600) : { data: [] };
  const byPath = new Map((data ?? []).map((x) => [x.path, x.signedUrl]));
  return { id: row.id, publicId: row.public_id, ownerProfileId: row.owner_profile_id, name: row.name, category: row.category,
    description: row.description, country: row.country, city: row.city, address: row.show_address ? row.address : null,
    showAddress: row.show_address, hours: row.hours, businessPhone: row.business_phone, website: row.website,
    coverPath: row.cover_url, logoPath: row.logo_url, photoPaths: row.photo_urls, isPublished: row.is_published,
    coverUrl: row.cover_url ? byPath.get(row.cover_url) ?? null : null, logoUrl: row.logo_url ? byPath.get(row.logo_url) ?? null : null,
    photoUrls: row.photo_urls.map((p) => byPath.get(p)).filter((x): x is string => Boolean(x)) };
}
function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, { auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => { const headers = new Headers(init?.headers); if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization"); headers.set("apikey", key); return fetch(input, { ...init, headers }); } } });
}
export const getMyBusinessCard = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data: profileId, error: profileError } = await context.supabase.rpc("wipp_my_profile_id");
  if (profileError || !profileId) throw new Error("Profil WIPP introuvable");
  const { data, error } = await context.supabase.from("wipp_business_cards").select("*").eq("owner_profile_id", profileId).maybeSingle();
  if (error) throw new Error(error.message);
  return { profileId: String(profileId), card: data ? await present(data) : null };
});
export const saveMyBusinessCard = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data) => cardInput.parse(data)).handler(async ({ data, context }) => {
  const { data: profileId, error: profileError } = await context.supabase.rpc("wipp_my_profile_id");
  if (profileError || !profileId) throw new Error("Profil WIPP introuvable");
  const prefix = `${profileId}/`; const media = [data.coverPath, data.logoPath, ...data.photoPaths].filter((x): x is string => Boolean(x));
  if (media.some((path) => !path.startsWith(prefix))) throw new Error("Image non autorisée");
  const row = { owner_profile_id: String(profileId), name: data.name, category: data.category, description: data.description, country: data.country,
    city: data.city, address: data.address || null, show_address: data.showAddress && Boolean(data.address), hours: data.hours || null,
    business_phone: data.businessPhone || null, website: data.website || null, cover_url: data.coverPath, logo_url: data.logoPath,
    photo_urls: data.photoPaths, is_published: true };
  const { data: saved, error } = await context.supabase.from("wipp_business_cards").upsert(row, { onConflict: "owner_profile_id" }).select("*").single();
  if (error) throw new Error(error.message);
  return present(saved);
});
export const listPublicBusinessCards = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient().from("wipp_business_cards").select("*").eq("is_published", true).order("updated_at", { ascending: false }).limit(100);
  if (error) throw new Error(error.message);
  return Promise.all((data ?? []).map(present));
});
export const getPublicBusinessCard = createServerFn({ method: "GET" }).inputValidator((data) => z.object({ publicId: z.string().min(3).max(80) }).parse(data)).handler(async ({ data }) => {
  const { data: card, error } = await publicClient().from("wipp_business_cards").select("*").eq("public_id", data.publicId).eq("is_published", true).maybeSingle();
  if (error) throw new Error(error.message);
  return card ? present(card) : null;
});
export type BusinessCardView = Awaited<ReturnType<typeof getPublicBusinessCard>>;