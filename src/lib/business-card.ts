import { supabase } from "@/integrations/supabase/client";
import type { BusinessCardView } from "./business-card.functions";

export type SavedBusinessCard = NonNullable<BusinessCardView>;
export async function authHeaders() { const token = (await supabase.auth.getSession()).data.session?.access_token; return token ? { authorization: `Bearer ${token}` } : undefined; }
export async function uploadBusinessImage(profileId: string, file: File, role: "cover" | "logo" | "photo") {
  if (!file.type.startsWith("image/")) throw new Error("Choisis une image");
  if (file.size > 8 * 1024 * 1024) throw new Error("L’image dépasse 8 Mo");
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${profileId}/${role}-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("wipp-business-cards").upload(path, file, { contentType: file.type });
  if (error) throw new Error(error.message);
  const { data } = await supabase.storage.from("wipp-business-cards").createSignedUrl(path, 3600);
  return { path, url: data?.signedUrl ?? URL.createObjectURL(file) };
}
export function cardLink(publicId: string) { return `https://wippapp.com/b/${publicId}`; }