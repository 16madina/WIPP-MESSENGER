CREATE SCHEMA IF NOT EXISTS wipp_private;
REVOKE ALL ON SCHEMA wipp_private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA wipp_private TO authenticated, service_role;
ALTER FUNCTION public.wipp_me() SET SCHEMA wipp_private;
ALTER FUNCTION public.wipp_is_member(text) SET SCHEMA wipp_private;
ALTER FUNCTION public.wipp_is_blocked_between(text,text) SET SCHEMA wipp_private;
ALTER FUNCTION public.wipp_is_admin() SET SCHEMA wipp_private;
ALTER FUNCTION public.wipp_message_chat(text) SET SCHEMA wipp_private;
ALTER FUNCTION public.wipp_chat_has_block(text) SET SCHEMA wipp_private;
ALTER FUNCTION wipp_private.wipp_is_member(text) SET search_path = public, wipp_private;
ALTER FUNCTION wipp_private.wipp_chat_has_block(text) SET search_path = public, wipp_private;
CREATE OR REPLACE FUNCTION public.wipp_messages_guard() RETURNS trigger LANGUAGE plpgsql SET search_path = public, wipp_private AS $$
BEGIN
  IF auth.role() = 'service_role' OR auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF OLD.deleted_at IS NOT NULL THEN RAISE EXCEPTION 'Message supprimé'; END IF;
  IF OLD.sender_id <> wipp_private.wipp_me() AND (NEW.body IS DISTINCT FROM OLD.body
      OR NEW.edited_at IS DISTINCT FROM OLD.edited_at OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at) THEN
    RAISE EXCEPTION 'Seul l''auteur peut modifier ou supprimer ce message';
  END IF;
  IF NEW.pinned_at IS DISTINCT FROM OLD.pinned_at THEN NEW.pinned_by := wipp_private.wipp_me(); END IF;
  RETURN NEW;
END $$;