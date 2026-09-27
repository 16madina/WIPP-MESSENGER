REVOKE SELECT (auth_user_id, password_hash, phone_e164, firebase_uid) ON public.wipp_profiles FROM authenticated, anon;
REVOKE INSERT, DELETE, TRUNCATE ON public.wipp_profiles FROM authenticated, anon;
DROP POLICY IF EXISTS profiles_read ON public.wipp_profiles;
CREATE POLICY profiles_read_public_unless_blocked ON public.wipp_profiles
  FOR SELECT TO authenticated
  USING (
    wipp_private.wipp_me() IS NOT NULL
    AND (id = wipp_private.wipp_me()
         OR NOT wipp_private.wipp_is_blocked_between(wipp_private.wipp_me(), id))
  );