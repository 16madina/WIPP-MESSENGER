ALTER TABLE public.wipp_chats
  ADD COLUMN IF NOT EXISTS business_card_id uuid REFERENCES public.wipp_business_cards(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS business_owner_id text REFERENCES public.wipp_profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS wipp_chats_business_card_idx ON public.wipp_chats(business_card_id);

CREATE OR REPLACE FUNCTION public.wipp_chats_business_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role'
     AND coalesce(auth.role(), '') <> 'service_role'
     AND (NEW.business_card_id IS DISTINCT FROM OLD.business_card_id
          OR NEW.business_owner_id IS DISTINCT FROM OLD.business_owner_id) THEN
    RAISE EXCEPTION 'business context is read-only';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS wipp_chats_business_guard ON public.wipp_chats;
CREATE TRIGGER wipp_chats_business_guard BEFORE UPDATE ON public.wipp_chats
FOR EACH ROW EXECUTE FUNCTION public.wipp_chats_business_guard();