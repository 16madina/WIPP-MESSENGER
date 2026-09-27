ALTER TABLE public.wipp_touch_invites
  ADD CONSTRAINT wipp_touch_invites_status_check
  CHECK (status IN ('active','pending','accepted','declined','expired','cancelled'));
ALTER TABLE public.wipp_touch_candidates ALTER COLUMN id SET DEFAULT ('tc_' || replace(gen_random_uuid()::text,'-',''));
CREATE INDEX IF NOT EXISTS wipp_touch_invites_receiver_pending ON public.wipp_touch_invites(receiver_id) WHERE status='pending';
CREATE INDEX IF NOT EXISTS wipp_touch_invites_sender_active ON public.wipp_touch_invites(sender_id) WHERE status IN ('active','pending');

-- A crée son Touch : l'ancien est annulé, le nouveau vit 60 s. _hash = SHA-256 du jeton diffusé.
CREATE OR REPLACE FUNCTION public.wipp_touch_create(_me text, _hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE iid text := 't_' || replace(gen_random_uuid()::text,'-',''); exp timestamptz := now() + interval '60 seconds';
BEGIN
  IF _me IS NULL OR _hash !~ '^[0-9a-f]{64}$' THEN RETURN jsonb_build_object('status','invalid'); END IF;
  PERFORM pg_advisory_xact_lock(hashtext('wipp_touch:'||_me));
  UPDATE wipp_touch_invites SET status='cancelled', resolved_at=now() WHERE sender_id=_me AND status='active';
  INSERT INTO wipp_touch_invites(id, code, sender_id, status, expires_at, arbitration)
    VALUES (iid, _hash, _me, 'active', exp, 'waiting_shock');
  RETURN jsonb_build_object('status','created','id',iid,'expires_at',exp);
END $$;

-- B (natif) a capté le jeton de A : il se déclare candidat. Réponse générique en cas de refus.
CREATE OR REPLACE FUNCTION public.wipp_touch_report(_me text, _hash text, _rssi jsonb, _channel text, _platform text, _foreground boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','wipp_private' AS $$
DECLARE i record; n int; med double precision;
BEGIN
  IF _me IS NULL OR _hash !~ '^[0-9a-f]{64}$' THEN RETURN jsonb_build_object('status','invalid'); END IF;
  SELECT * INTO i FROM wipp_touch_invites WHERE code=_hash;
  IF NOT FOUND OR i.status <> 'active' OR i.expires_at <= now() OR i.sender_id=_me
     OR wipp_private.wipp_is_blocked_between(_me, i.sender_id) THEN
    RETURN jsonb_build_object('status','invalid');
  END IF;
  SELECT count(*) INTO n FROM wipp_touch_candidates WHERE invite_id=i.id;
  IF n >= 10 THEN RETURN jsonb_build_object('status','invalid'); END IF;
  SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY v::double precision) INTO med
    FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(_rssi)='array' THEN _rssi ELSE '[]'::jsonb END) v;
  INSERT INTO wipp_touch_candidates(invite_id, profile_id, rssi_samples, median_rssi, detected_at, platform, foreground, channel)
    VALUES (i.id, _me, COALESCE(_rssi,'[]'::jsonb), med, now(), left(_platform,20), COALESCE(_foreground,false), left(COALESCE(_channel,'ble'),10))
    ON CONFLICT (invite_id, profile_id) DO UPDATE SET rssi_samples=EXCLUDED.rssi_samples, median_rssi=EXCLUDED.median_rssi, detected_at=now();
  RETURN jsonb_build_object('status','ok');
END $$;

-- A lit les personnes détectées (profil public minimal, hors blocages).
CREATE OR REPLACE FUNCTION public.wipp_touch_candidates_for(_me text, _id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','wipp_private' AS $$
DECLARE i record;
BEGIN
  SELECT * INTO i FROM wipp_touch_invites WHERE id=_id AND sender_id=_me;
  IF NOT FOUND THEN RETURN jsonb_build_object('status','invalid'); END IF;
  IF i.status='active' AND i.expires_at <= now() THEN RETURN jsonb_build_object('status','expired','cards','[]'::jsonb); END IF;
  RETURN jsonb_build_object('status', i.status, 'cards', COALESCE((
    SELECT jsonb_agg(jsonb_build_object('id',p.id,'username',p.username,'display_name',p.display_name,'avatar_url',p.avatar_url) ORDER BY c.median_rssi DESC NULLS LAST)
    FROM wipp_touch_candidates c JOIN wipp_profiles p ON p.id=c.profile_id
    WHERE c.invite_id=i.id AND NOT wipp_private.wipp_is_blocked_between(_me, p.id)), '[]'::jsonb));
END $$;

-- A choisit « Se connecter » sur un candidat détecté : la demande part vers B (60 s pour répondre).
CREATE OR REPLACE FUNCTION public.wipp_touch_request(_me text, _id text, _profile text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','wipp_private' AS $$
DECLARE i record; exp timestamptz := now() + interval '60 seconds';
BEGIN
  SELECT * INTO i FROM wipp_touch_invites WHERE id=_id AND sender_id=_me FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('status','invalid'); END IF;
  IF i.status <> 'active' THEN RETURN jsonb_build_object('status','already_handled'); END IF;
  IF i.expires_at <= now() THEN
    UPDATE wipp_touch_invites SET status='expired', resolved_at=now() WHERE id=_id;
    RETURN jsonb_build_object('status','expired');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM wipp_touch_candidates WHERE invite_id=_id AND profile_id=_profile)
     OR wipp_private.wipp_is_blocked_between(_me, _profile) THEN RETURN jsonb_build_object('status','invalid'); END IF;
  IF EXISTS (SELECT 1 FROM wipp_connections WHERE user_a=LEAST(_me,_profile) AND user_b=GREATEST(_me,_profile)) THEN
    UPDATE wipp_touch_invites SET status='cancelled', resolved_at=now() WHERE id=_id;
    RETURN jsonb_build_object('status','already_connected');
  END IF;
  UPDATE wipp_touch_invites SET status='pending', receiver_id=_profile, matched_profile_id=_profile,
    arbitration='matched', expires_at=exp WHERE id=_id;
  RETURN jsonb_build_object('status','sent','expires_at',exp);
END $$;

-- B accepte ou refuse. Seul le destinataire peut répondre ; une seule connexion possible.
CREATE OR REPLACE FUNCTION public.wipp_touch_respond(_me text, _id text, _action text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','wipp_private' AS $$
DECLARE i record;
BEGIN
  IF _action NOT IN ('accept','decline') THEN RETURN jsonb_build_object('status','invalid'); END IF;
  SELECT * INTO i FROM wipp_touch_invites WHERE id=_id AND receiver_id=_me FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('status','not_found'); END IF;
  IF i.status <> 'pending' THEN RETURN jsonb_build_object('status', CASE WHEN i.status='expired' THEN 'expired' ELSE 'already_handled' END); END IF;
  IF i.expires_at <= now() THEN
    UPDATE wipp_touch_invites SET status='expired', resolved_at=now() WHERE id=_id;
    RETURN jsonb_build_object('status','expired');
  END IF;
  IF _action='accept' AND wipp_private.wipp_is_blocked_between(i.sender_id, _me) THEN RETURN jsonb_build_object('status','blocked'); END IF;
  UPDATE wipp_touch_invites SET status = CASE _action WHEN 'accept' THEN 'accepted' ELSE 'declined' END, resolved_at=now() WHERE id=_id;
  IF _action='accept' THEN
    INSERT INTO wipp_connections(user_a,user_b,via) VALUES (LEAST(i.sender_id,_me), GREATEST(i.sender_id,_me), 'touch') ON CONFLICT DO NOTHING;
  END IF;
  RETURN jsonb_build_object('status', CASE _action WHEN 'accept' THEN 'accepted' ELSE 'declined' END);
END $$;

CREATE OR REPLACE FUNCTION public.wipp_touch_cancel(_me text, _id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE wipp_touch_invites SET status='cancelled', resolved_at=now()
   WHERE id=_id AND sender_id=_me AND status IN ('active','pending');
  RETURN jsonb_build_object('status', CASE WHEN FOUND THEN 'cancelled' ELSE 'not_found' END);
END $$;

REVOKE ALL ON FUNCTION public.wipp_touch_create(text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.wipp_touch_report(text,text,jsonb,text,text,boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.wipp_touch_candidates_for(text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.wipp_touch_request(text,text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.wipp_touch_respond(text,text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.wipp_touch_cancel(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wipp_touch_create(text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.wipp_touch_report(text,text,jsonb,text,text,boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.wipp_touch_candidates_for(text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.wipp_touch_request(text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.wipp_touch_respond(text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.wipp_touch_cancel(text,text) TO service_role;