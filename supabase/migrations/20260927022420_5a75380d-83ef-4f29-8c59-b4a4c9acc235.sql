ALTER TABLE public.wipp_chat_members ADD COLUMN IF NOT EXISTS muted_forever boolean NOT NULL DEFAULT false;

UPDATE public.wipp_chat_members SET muted_forever = true, muted_until = NULL WHERE muted_until >= '9999-01-01';

CREATE OR REPLACE FUNCTION public.wipp_chat_members_mute_guard()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.muted_forever THEN NEW.muted_until := NULL; END IF;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS wipp_chat_members_mute_guard ON public.wipp_chat_members;
CREATE TRIGGER wipp_chat_members_mute_guard BEFORE INSERT OR UPDATE ON public.wipp_chat_members
FOR EACH ROW EXECUTE FUNCTION public.wipp_chat_members_mute_guard();

CREATE OR REPLACE FUNCTION public.wipp_is_muted(_chat_id text, _profile_id text)
 RETURNS boolean LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.wipp_chat_members
    WHERE chat_id = _chat_id AND profile_id = _profile_id
      AND (muted_forever OR (muted_until IS NOT NULL AND muted_until > now())))
$function$;
REVOKE EXECUTE ON FUNCTION public.wipp_is_muted(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wipp_is_muted(text, text) TO service_role;