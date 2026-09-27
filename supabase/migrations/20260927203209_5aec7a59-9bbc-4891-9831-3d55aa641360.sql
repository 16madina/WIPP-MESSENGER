CREATE TABLE public.wipp_qr_tokens (
  token_hash text PRIMARY KEY CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  profile_id text NOT NULL REFERENCES public.wipp_profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  used_by text REFERENCES public.wipp_profiles(id) ON DELETE SET NULL,
  revoked_at timestamptz
);
CREATE INDEX wipp_qr_tokens_profile_idx ON public.wipp_qr_tokens(profile_id) WHERE used_at IS NULL AND revoked_at IS NULL;
REVOKE ALL ON public.wipp_qr_tokens FROM anon, authenticated;
GRANT ALL ON public.wipp_qr_tokens TO service_role;
ALTER TABLE public.wipp_qr_tokens ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.wipp_groups (
  chat_id text PRIMARY KEY REFERENCES public.wipp_chats(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  owner_id text NOT NULL REFERENCES public.wipp_profiles(id),
  invites_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.wipp_groups FROM anon, authenticated;
GRANT SELECT ON public.wipp_groups TO authenticated;
GRANT ALL ON public.wipp_groups TO service_role;
ALTER TABLE public.wipp_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY groups_read_members ON public.wipp_groups FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.wipp_chat_members m WHERE m.chat_id = wipp_groups.chat_id AND m.profile_id = public.wipp_my_profile_id()));

CREATE TABLE public.wipp_group_bans (
  chat_id text NOT NULL REFERENCES public.wipp_chats(id) ON DELETE CASCADE,
  profile_id text NOT NULL REFERENCES public.wipp_profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (chat_id, profile_id)
);
REVOKE ALL ON public.wipp_group_bans FROM anon, authenticated;
GRANT ALL ON public.wipp_group_bans TO service_role;
ALTER TABLE public.wipp_group_bans ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.wipp_group_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id text NOT NULL REFERENCES public.wipp_chats(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  created_by text NOT NULL REFERENCES public.wipp_profiles(id),
  expires_at timestamptz,
  max_uses integer CHECK (max_uses IS NULL OR max_uses > 0),
  uses integer NOT NULL DEFAULT 0,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.wipp_group_invites FROM anon, authenticated;
GRANT SELECT (id, chat_id, created_by, expires_at, max_uses, uses, revoked_at, created_at) ON public.wipp_group_invites TO authenticated;
GRANT ALL ON public.wipp_group_invites TO service_role;
ALTER TABLE public.wipp_group_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY group_invites_read_owner ON public.wipp_group_invites FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.wipp_groups g WHERE g.chat_id = wipp_group_invites.chat_id AND g.owner_id = public.wipp_my_profile_id()));

-- ===== QR temporaires =====
CREATE OR REPLACE FUNCTION public.wipp_issue_qr_token(_me text, _hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE exp timestamptz := now() + interval '75 seconds';
BEGIN
  IF _me IS NULL OR _hash !~ '^[0-9a-f]{64}$' THEN RETURN jsonb_build_object('status','invalid'); END IF;
  PERFORM pg_advisory_xact_lock(hashtext('wipp_qr:'||_me));
  UPDATE wipp_qr_tokens SET revoked_at = now() WHERE profile_id=_me AND used_at IS NULL AND revoked_at IS NULL;
  DELETE FROM wipp_qr_tokens WHERE profile_id=_me AND expires_at < now() - interval '1 day';
  INSERT INTO wipp_qr_tokens(token_hash, profile_id, expires_at) VALUES (_hash, _me, exp);
  RETURN jsonb_build_object('status','issued','expires_at',exp,'ttl_ms',75000);
END $$;

CREATE OR REPLACE FUNCTION public.wipp_redeem_qr_token(_me text, _hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, wipp_private AS $$
DECLARE r record; p record;
BEGIN
  IF _me IS NULL OR _hash !~ '^[0-9a-f]{64}$' THEN RETURN jsonb_build_object('status','invalid'); END IF;
  SELECT * INTO r FROM wipp_qr_tokens WHERE token_hash=_hash FOR UPDATE;
  IF NOT FOUND OR r.revoked_at IS NOT NULL THEN RETURN jsonb_build_object('status','invalid'); END IF;
  IF r.used_at IS NOT NULL THEN RETURN jsonb_build_object('status','used'); END IF;
  IF r.expires_at <= now() THEN RETURN jsonb_build_object('status','expired'); END IF;
  IF r.profile_id = _me THEN RETURN jsonb_build_object('status','self'); END IF;
  -- Blocage : réponse générique, le jeton n'est pas consommé.
  IF wipp_private.wipp_is_blocked_between(_me, r.profile_id) THEN RETURN jsonb_build_object('status','invalid'); END IF;
  UPDATE wipp_qr_tokens SET used_at=now(), used_by=_me WHERE token_hash=_hash;
  SELECT id, username, display_name, avatar_url, bio INTO p FROM wipp_profiles WHERE id=r.profile_id;
  RETURN jsonb_build_object('status','ok','profile', jsonb_build_object('id',p.id,'username',p.username,
    'display_name',p.display_name,'avatar_url',p.avatar_url,'bio',p.bio),
    'connected', EXISTS (SELECT 1 FROM wipp_connections WHERE user_a=LEAST(_me,p.id) AND user_b=GREATEST(_me,p.id)));
END $$;

-- ===== Groupes =====
CREATE OR REPLACE FUNCTION public.wipp_create_group(_me text, _name text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cid text := 'g_' || replace(gen_random_uuid()::text,'-','');
BEGIN
  IF _me IS NULL OR coalesce(btrim(_name),'') = '' THEN RETURN jsonb_build_object('status','invalid'); END IF;
  INSERT INTO wipp_chats(id) VALUES (cid);
  INSERT INTO wipp_chat_members(chat_id, profile_id) VALUES (cid, _me);
  INSERT INTO wipp_groups(chat_id, name, owner_id) VALUES (cid, left(btrim(_name),80), _me);
  RETURN jsonb_build_object('status','created','chat_id',cid);
END $$;

CREATE OR REPLACE FUNCTION public.wipp_create_group_invite(_me text, _chat text, _hash text, _expires_at timestamptz, _max_uses int)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE iid uuid;
BEGIN
  IF _hash !~ '^[0-9a-f]{64}$' THEN RETURN jsonb_build_object('status','invalid'); END IF;
  IF NOT EXISTS (SELECT 1 FROM wipp_groups WHERE chat_id=_chat AND owner_id=_me) THEN RETURN jsonb_build_object('status','forbidden'); END IF;
  INSERT INTO wipp_group_invites(chat_id, token_hash, created_by, expires_at, max_uses)
    VALUES (_chat, _hash, _me, _expires_at, _max_uses) RETURNING id INTO iid;
  RETURN jsonb_build_object('status','created','id',iid);
END $$;

CREATE OR REPLACE FUNCTION public.wipp_revoke_group_invite(_me text, _id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE wipp_group_invites i SET revoked_at=now() FROM wipp_groups g
   WHERE i.id=_id AND g.chat_id=i.chat_id AND g.owner_id=_me AND i.revoked_at IS NULL;
  RETURN jsonb_build_object('status', CASE WHEN FOUND THEN 'revoked' ELSE 'not_found' END);
END $$;

CREATE OR REPLACE FUNCTION public.wipp_group_invite_check(_me text, _hash text, _join boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, wipp_private AS $$
DECLARE i record; g record; n int; member boolean;
BEGIN
  IF _me IS NULL OR _hash !~ '^[0-9a-f]{64}$' THEN RETURN jsonb_build_object('status','invalid'); END IF;
  IF _join THEN SELECT * INTO i FROM wipp_group_invites WHERE token_hash=_hash FOR UPDATE;
  ELSE SELECT * INTO i FROM wipp_group_invites WHERE token_hash=_hash; END IF;
  IF NOT FOUND THEN RETURN jsonb_build_object('status','invalid'); END IF;
  SELECT * INTO g FROM wipp_groups WHERE chat_id=i.chat_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('status','invalid'); END IF;
  IF i.revoked_at IS NOT NULL THEN RETURN jsonb_build_object('status','revoked'); END IF;
  IF i.expires_at IS NOT NULL AND i.expires_at <= now() THEN RETURN jsonb_build_object('status','expired'); END IF;
  member := EXISTS (SELECT 1 FROM wipp_chat_members WHERE chat_id=i.chat_id AND profile_id=_me);
  IF NOT member THEN
    IF NOT g.invites_enabled THEN RETURN jsonb_build_object('status','closed'); END IF;
    IF EXISTS (SELECT 1 FROM wipp_group_bans WHERE chat_id=i.chat_id AND profile_id=_me) THEN RETURN jsonb_build_object('status','refused'); END IF;
    IF wipp_private.wipp_is_blocked_between(_me, g.owner_id) THEN RETURN jsonb_build_object('status','refused'); END IF;
    IF i.max_uses IS NOT NULL AND i.uses >= i.max_uses THEN RETURN jsonb_build_object('status','full'); END IF;
  END IF;
  SELECT count(*) INTO n FROM wipp_chat_members WHERE chat_id=i.chat_id;
  IF _join AND NOT member THEN
    INSERT INTO wipp_chat_members(chat_id, profile_id) VALUES (i.chat_id, _me) ON CONFLICT DO NOTHING;
    UPDATE wipp_group_invites SET uses = uses + 1 WHERE id=i.id;
    n := n + 1;
    RETURN jsonb_build_object('status','joined','chat_id',i.chat_id,'name',g.name,'members',n);
  END IF;
  RETURN jsonb_build_object('status', CASE WHEN member THEN 'already_member' ELSE 'ok' END,
    'chat_id', i.chat_id, 'name', g.name, 'members', n);
END $$;

REVOKE ALL ON FUNCTION public.wipp_issue_qr_token(text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.wipp_redeem_qr_token(text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.wipp_create_group(text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.wipp_create_group_invite(text,text,text,timestamptz,int) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.wipp_revoke_group_invite(text,uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.wipp_group_invite_check(text,text,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wipp_issue_qr_token(text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.wipp_redeem_qr_token(text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.wipp_create_group(text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.wipp_create_group_invite(text,text,text,timestamptz,int) TO service_role;
GRANT EXECUTE ON FUNCTION public.wipp_revoke_group_invite(text,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.wipp_group_invite_check(text,text,boolean) TO service_role;