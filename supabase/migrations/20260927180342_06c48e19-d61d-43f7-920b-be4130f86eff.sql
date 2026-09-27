CREATE OR REPLACE FUNCTION public.wipp_my_profile_id()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, wipp_private
AS $$ SELECT wipp_private.wipp_me() $$;
REVOKE ALL ON FUNCTION public.wipp_my_profile_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wipp_my_profile_id() TO authenticated, service_role;

CREATE OR REPLACE VIEW public.wipp_public_profiles
WITH (security_invoker = on, security_barrier = true) AS
SELECT id, username, display_name, avatar_url, bio, e2e_public_jwk, role
FROM public.wipp_profiles;
REVOKE ALL ON public.wipp_public_profiles FROM PUBLIC, anon;
GRANT SELECT ON public.wipp_public_profiles TO authenticated;
GRANT ALL ON public.wipp_public_profiles TO service_role;