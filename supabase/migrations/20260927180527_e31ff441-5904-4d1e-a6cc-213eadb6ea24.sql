CREATE TABLE public.wipp_connection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id text NOT NULL REFERENCES public.wipp_profiles(id) ON DELETE CASCADE,
  recipient_id text NOT NULL REFERENCES public.wipp_profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','ignored','expired')),
  via text NOT NULL DEFAULT 'request' CHECK (via IN ('request','qr','touch')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '14 days',
  CHECK (sender_id <> recipient_id)
);
CREATE UNIQUE INDEX wipp_conn_req_one_pending_per_pair ON public.wipp_connection_requests
  (LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id)) WHERE status = 'pending';
CREATE INDEX wipp_conn_req_recipient ON public.wipp_connection_requests (recipient_id, status);
CREATE INDEX wipp_conn_req_sender ON public.wipp_connection_requests (sender_id, created_at);

CREATE TABLE public.wipp_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a text NOT NULL REFERENCES public.wipp_profiles(id) ON DELETE CASCADE,
  user_b text NOT NULL REFERENCES public.wipp_profiles(id) ON DELETE CASCADE,
  via text NOT NULL DEFAULT 'request' CHECK (via IN ('request','qr','touch')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_a < user_b),
  UNIQUE (user_a, user_b)
);
CREATE INDEX wipp_connections_b ON public.wipp_connections (user_b);

GRANT SELECT ON public.wipp_connection_requests TO authenticated;
GRANT SELECT, DELETE ON public.wipp_connections TO authenticated;
GRANT ALL ON public.wipp_connection_requests, public.wipp_connections TO service_role;

ALTER TABLE public.wipp_connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wipp_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY conn_req_read_own ON public.wipp_connection_requests FOR SELECT TO authenticated
  USING (sender_id = wipp_private.wipp_me() OR recipient_id = wipp_private.wipp_me());
CREATE POLICY connections_read_own ON public.wipp_connections FOR SELECT TO authenticated
  USING (user_a = wipp_private.wipp_me() OR user_b = wipp_private.wipp_me());
CREATE POLICY connections_delete_own ON public.wipp_connections FOR DELETE TO authenticated
  USING (user_a = wipp_private.wipp_me() OR user_b = wipp_private.wipp_me());

-- Server-only transactional operations (callable by service_role only).
CREATE OR REPLACE FUNCTION public.wipp_send_connection_request(_me text, _recipient text, _via text DEFAULT 'request')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, wipp_private AS $$
DECLARE r record; a text; b text; n int;
BEGIN
  IF _me IS NULL OR _recipient IS NULL OR _me = _recipient THEN RETURN jsonb_build_object('status','invalid'); END IF;
  IF NOT EXISTS (SELECT 1 FROM wipp_profiles WHERE id = _recipient) THEN RETURN jsonb_build_object('status','not_found'); END IF;
  IF wipp_private.wipp_is_blocked_between(_me, _recipient) THEN RETURN jsonb_build_object('status','not_found'); END IF;
  a := LEAST(_me,_recipient); b := GREATEST(_me,_recipient);
  PERFORM pg_advisory_xact_lock(hashtext('wipp_conn:'||a||':'||b));
  IF EXISTS (SELECT 1 FROM wipp_connections WHERE user_a=a AND user_b=b) THEN RETURN jsonb_build_object('status','already_connected'); END IF;
  UPDATE wipp_connection_requests SET status='expired', responded_at=now()
    WHERE status='pending' AND expires_at <= now() AND LEAST(sender_id,recipient_id)=a AND GREATEST(sender_id,recipient_id)=b;
  SELECT * INTO r FROM wipp_connection_requests WHERE status='pending' AND LEAST(sender_id,recipient_id)=a AND GREATEST(sender_id,recipient_id)=b;
  IF FOUND THEN
    IF r.sender_id = _me THEN RETURN jsonb_build_object('status','already_pending','id',r.id); END IF;
    UPDATE wipp_connection_requests SET status='accepted', responded_at=now() WHERE id=r.id;
    INSERT INTO wipp_connections(user_a,user_b,via) VALUES (a,b,r.via) ON CONFLICT DO NOTHING;
    RETURN jsonb_build_object('status','accepted_existing','id',r.id);
  END IF;
  SELECT count(*) INTO n FROM wipp_connection_requests WHERE sender_id=_me AND created_at > now()-interval '24 hours';
  IF n >= 20 THEN RETURN jsonb_build_object('status','rate_limited'); END IF;
  SELECT count(*) INTO n FROM wipp_connection_requests WHERE sender_id=_me AND recipient_id=_recipient AND status='declined' AND responded_at > now()-interval '30 days';
  IF n >= 3 THEN RETURN jsonb_build_object('status','paused'); END IF;
  INSERT INTO wipp_connection_requests(sender_id,recipient_id,via) VALUES (_me,_recipient,COALESCE(_via,'request')) RETURNING id INTO r;
  RETURN jsonb_build_object('status','sent','id',r.id);
END $$;

CREATE OR REPLACE FUNCTION public.wipp_respond_connection_request(_me text, _id uuid, _action text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, wipp_private AS $$
DECLARE r record;
BEGIN
  IF _action NOT IN ('accept','decline','ignore') THEN RETURN jsonb_build_object('status','invalid'); END IF;
  SELECT * INTO r FROM wipp_connection_requests WHERE id=_id AND recipient_id=_me FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('status','not_found'); END IF;
  IF r.status <> 'pending' THEN RETURN jsonb_build_object('status','already_handled'); END IF;
  IF r.expires_at <= now() THEN
    UPDATE wipp_connection_requests SET status='expired', responded_at=now() WHERE id=_id;
    RETURN jsonb_build_object('status','expired');
  END IF;
  IF _action='accept' AND wipp_private.wipp_is_blocked_between(r.sender_id, r.recipient_id) THEN RETURN jsonb_build_object('status','blocked'); END IF;
  UPDATE wipp_connection_requests SET status = CASE _action WHEN 'accept' THEN 'accepted' WHEN 'decline' THEN 'declined' ELSE 'ignored' END,
    responded_at=now() WHERE id=_id;
  IF _action='accept' THEN
    INSERT INTO wipp_connections(user_a,user_b,via) VALUES (LEAST(r.sender_id,r.recipient_id), GREATEST(r.sender_id,r.recipient_id), r.via) ON CONFLICT DO NOTHING;
  END IF;
  RETURN jsonb_build_object('status', CASE _action WHEN 'accept' THEN 'accepted' WHEN 'decline' THEN 'declined' ELSE 'ignored' END);
END $$;

REVOKE ALL ON FUNCTION public.wipp_send_connection_request(text,text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.wipp_respond_connection_request(text,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wipp_send_connection_request(text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.wipp_respond_connection_request(text,uuid,text) TO service_role;