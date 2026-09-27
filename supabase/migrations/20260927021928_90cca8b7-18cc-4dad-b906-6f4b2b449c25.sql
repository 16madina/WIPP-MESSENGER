ALTER PUBLICATION supabase_realtime ADD TABLE public.wipp_messages, public.wipp_reactions, public.wipp_receipts, public.wipp_message_hides;
ALTER TABLE public.wipp_reactions REPLICA IDENTITY FULL;
ALTER TABLE public.wipp_receipts REPLICA IDENTITY FULL;

CREATE OR REPLACE FUNCTION public.wipp_messages_guard()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public', 'wipp_private'
AS $function$
BEGIN
  IF NEW.deleted_at IS NOT NULL THEN NEW.body := ''; NEW.pinned_at := NULL; END IF;
  IF auth.role() = 'service_role' OR auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF OLD.deleted_at IS NOT NULL THEN RAISE EXCEPTION 'Message supprimé'; END IF;
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.chat_id IS DISTINCT FROM OLD.chat_id
     OR NEW.sender_id IS DISTINCT FROM OLD.sender_id OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.reply_to IS DISTINCT FROM OLD.reply_to OR NEW.client_id IS DISTINCT FROM OLD.client_id THEN
    RAISE EXCEPTION 'Champ non modifiable';
  END IF;
  IF OLD.sender_id <> wipp_private.wipp_me() AND (NEW.body IS DISTINCT FROM OLD.body
      OR NEW.edited_at IS DISTINCT FROM OLD.edited_at OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at) THEN
    RAISE EXCEPTION 'Seul l''auteur peut modifier ou supprimer ce message';
  END IF;
  IF NEW.pinned_at IS DISTINCT FROM OLD.pinned_at THEN NEW.pinned_by := wipp_private.wipp_me(); END IF;
  RETURN NEW;
END $function$;