// WIPP — ouvre la session Supabase reçue du serveur et charge le vrai profil.
import { supabase } from "@/integrations/supabase/client";
import { useWgoStore } from "@/lib/store";

export async function enterWithSession(accessToken: string, refreshToken: string, phone: string) {
  await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  const { data: u } = await supabase.auth.getUser();
  let displayName = "";
  let username = "";
  if (u.user) {
    const id = (await supabase.rpc("wipp_my_profile_id" as never)).data ?? "";
    const { data: p } = await supabase
      .from("wipp_public_profiles")
      .select("display_name,username")
      .eq("id", id)
      .maybeSingle();
    displayName = p?.display_name ?? "";
    username = p?.username ?? "";
  }
  const [firstName, ...rest] = displayName.split(" ");
  useWgoStore.getState().completeSetup({
    firstName: firstName ?? "",
    lastName: rest.join(" "),
    displayName,
    ...(username ? { username } : {}),
    phone,
  });
}
