CREATE OR REPLACE FUNCTION public.wipp_profiles_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.role() = 'service_role' OR auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.username IS DISTINCT FROM OLD.username
     OR NEW.role IS DISTINCT FROM OLD.role
     OR NEW.password_hash IS DISTINCT FROM OLD.password_hash
     OR NEW.firebase_uid IS DISTINCT FROM OLD.firebase_uid
     OR NEW.phone_e164 IS DISTINCT FROM OLD.phone_e164
     OR NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Champ non modifiable';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER wipp_profiles_guard BEFORE UPDATE ON public.wipp_profiles
FOR EACH ROW EXECUTE FUNCTION public.wipp_profiles_guard();