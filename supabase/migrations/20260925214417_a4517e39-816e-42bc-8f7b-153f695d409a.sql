-- 1. Liaison profils <-> auth.users
ALTER TABLE public.wipp_profiles ADD COLUMN auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Fonctions d'aide
CREATE OR REPLACE FUNCTION public.wipp_me() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.wipp_profiles WHERE auth_user_id = auth.uid() LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.wipp_is_member(_chat_id text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.wipp_chat_members WHERE chat_id = _chat_id AND profile_id = public.wipp_me()) $$;

CREATE OR REPLACE FUNCTION public.wipp_is_blocked_between(_a text, _b text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.wipp_blocks WHERE (blocker_id = _a AND blocked_id = _b) OR (blocker_id = _b AND blocked_id = _a)) $$;

CREATE OR REPLACE FUNCTION public.wipp_is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.wipp_profiles WHERE auth_user_id = auth.uid() AND role = 'admin') $$;

CREATE OR REPLACE FUNCTION public.wipp_message_chat(_message_id text) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT chat_id FROM public.wipp_messages WHERE id = _message_id $$;

CREATE OR REPLACE FUNCTION public.wipp_chat_has_block(_chat_id text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.wipp_chat_members m WHERE m.chat_id = _chat_id AND m.profile_id <> public.wipp_me()
    AND public.wipp_is_blocked_between(public.wipp_me(), m.profile_id)) $$;

REVOKE EXECUTE ON FUNCTION public.wipp_me(), public.wipp_is_member(text), public.wipp_is_blocked_between(text,text),
  public.wipp_is_admin(), public.wipp_message_chat(text), public.wipp_chat_has_block(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wipp_me(), public.wipp_is_member(text), public.wipp_is_blocked_between(text,text),
  public.wipp_is_admin(), public.wipp_message_chat(text), public.wipp_chat_has_block(text) TO authenticated, service_role;

-- 3. RLS partout + droits de base
DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'wipp\_%' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

-- wipp_profiles : colonnes publiques uniquement
GRANT SELECT (id, username, display_name, avatar_url, bio, e2e_public_jwk, created_at, role, auth_user_id) ON public.wipp_profiles TO authenticated;
GRANT UPDATE (display_name, avatar_url, bio, e2e_public_jwk) ON public.wipp_profiles TO authenticated;
CREATE POLICY "profiles_read" ON public.wipp_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.wipp_profiles FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid()) WITH CHECK (auth_user_id = auth.uid());

-- wipp_devices
GRANT SELECT, DELETE ON public.wipp_devices TO authenticated;
CREATE POLICY "devices_read_own" ON public.wipp_devices FOR SELECT TO authenticated USING (profile_id = public.wipp_me());
CREATE POLICY "devices_delete_own" ON public.wipp_devices FOR DELETE TO authenticated USING (profile_id = public.wipp_me());

-- wipp_chats
GRANT SELECT (id, created_at, disappear_after_ms) ON public.wipp_chats TO authenticated;
GRANT UPDATE (disappear_after_ms) ON public.wipp_chats TO authenticated;
CREATE POLICY "chats_read_member" ON public.wipp_chats FOR SELECT TO authenticated USING (public.wipp_is_member(id));
CREATE POLICY "chats_update_member" ON public.wipp_chats FOR UPDATE TO authenticated USING (public.wipp_is_member(id)) WITH CHECK (public.wipp_is_member(id));

-- wipp_chat_members
GRANT SELECT ON public.wipp_chat_members TO authenticated;
GRANT UPDATE (pinned_at, archived_at, muted_until, manually_unread_at) ON public.wipp_chat_members TO authenticated;
CREATE POLICY "members_read" ON public.wipp_chat_members FOR SELECT TO authenticated USING (public.wipp_is_member(chat_id));
CREATE POLICY "members_update_own" ON public.wipp_chat_members FOR UPDATE TO authenticated
  USING (profile_id = public.wipp_me()) WITH CHECK (profile_id = public.wipp_me());

-- wipp_messages
GRANT SELECT, INSERT ON public.wipp_messages TO authenticated;
GRANT UPDATE (body, edited_at, deleted_at, pinned_at, pinned_by) ON public.wipp_messages TO authenticated;
CREATE POLICY "messages_read" ON public.wipp_messages FOR SELECT TO authenticated USING (
  public.wipp_is_member(chat_id) AND (expires_at IS NULL OR expires_at > now())
  AND NOT EXISTS (SELECT 1 FROM public.wipp_message_hides h WHERE h.message_id = id AND h.profile_id = public.wipp_me()));
CREATE POLICY "messages_insert" ON public.wipp_messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = public.wipp_me() AND public.wipp_is_member(chat_id) AND NOT public.wipp_chat_has_block(chat_id));
CREATE POLICY "messages_update" ON public.wipp_messages FOR UPDATE TO authenticated
  USING (public.wipp_is_member(chat_id)) WITH CHECK (public.wipp_is_member(chat_id));

CREATE OR REPLACE FUNCTION public.wipp_messages_guard() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.role() = 'service_role' OR auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF OLD.deleted_at IS NOT NULL THEN RAISE EXCEPTION 'Message supprimé'; END IF;
  IF OLD.sender_id <> public.wipp_me() AND (NEW.body IS DISTINCT FROM OLD.body
      OR NEW.edited_at IS DISTINCT FROM OLD.edited_at OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at) THEN
    RAISE EXCEPTION 'Seul l''auteur peut modifier ou supprimer ce message';
  END IF;
  IF NEW.pinned_at IS DISTINCT FROM OLD.pinned_at THEN NEW.pinned_by := public.wipp_me(); END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER wipp_messages_guard BEFORE UPDATE ON public.wipp_messages FOR EACH ROW EXECUTE FUNCTION public.wipp_messages_guard();

-- wipp_receipts
GRANT SELECT, INSERT ON public.wipp_receipts TO authenticated;
GRANT UPDATE (delivered_at, read_at) ON public.wipp_receipts TO authenticated;
CREATE POLICY "receipts_read" ON public.wipp_receipts FOR SELECT TO authenticated USING (public.wipp_is_member(public.wipp_message_chat(message_id)));
CREATE POLICY "receipts_insert_own" ON public.wipp_receipts FOR INSERT TO authenticated
  WITH CHECK (profile_id = public.wipp_me() AND public.wipp_is_member(public.wipp_message_chat(message_id)));
CREATE POLICY "receipts_update_own" ON public.wipp_receipts FOR UPDATE TO authenticated
  USING (profile_id = public.wipp_me()) WITH CHECK (profile_id = public.wipp_me());

-- wipp_reactions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wipp_reactions TO authenticated;
CREATE POLICY "reactions_read" ON public.wipp_reactions FOR SELECT TO authenticated USING (public.wipp_is_member(public.wipp_message_chat(message_id)));
CREATE POLICY "reactions_insert_own" ON public.wipp_reactions FOR INSERT TO authenticated
  WITH CHECK (profile_id = public.wipp_me() AND public.wipp_is_member(public.wipp_message_chat(message_id)));
CREATE POLICY "reactions_update_own" ON public.wipp_reactions FOR UPDATE TO authenticated
  USING (profile_id = public.wipp_me()) WITH CHECK (profile_id = public.wipp_me());
CREATE POLICY "reactions_delete_own" ON public.wipp_reactions FOR DELETE TO authenticated USING (profile_id = public.wipp_me());

-- wipp_message_hides
GRANT SELECT, INSERT, DELETE ON public.wipp_message_hides TO authenticated;
CREATE POLICY "hides_read_own" ON public.wipp_message_hides FOR SELECT TO authenticated USING (profile_id = public.wipp_me());
CREATE POLICY "hides_insert_own" ON public.wipp_message_hides FOR INSERT TO authenticated
  WITH CHECK (profile_id = public.wipp_me() AND public.wipp_is_member(public.wipp_message_chat(message_id)));
CREATE POLICY "hides_delete_own" ON public.wipp_message_hides FOR DELETE TO authenticated USING (profile_id = public.wipp_me());

-- wipp_attachments (métadonnées seulement)
GRANT SELECT ON public.wipp_attachments TO authenticated;
CREATE POLICY "attachments_read" ON public.wipp_attachments FOR SELECT TO authenticated USING (public.wipp_is_member(chat_id));

-- wipp_blocks
GRANT SELECT, INSERT, DELETE ON public.wipp_blocks TO authenticated;
CREATE POLICY "blocks_read_own" ON public.wipp_blocks FOR SELECT TO authenticated USING (blocker_id = public.wipp_me());
CREATE POLICY "blocks_insert_own" ON public.wipp_blocks FOR INSERT TO authenticated
  WITH CHECK (blocker_id = public.wipp_me() AND blocked_id <> blocker_id);
CREATE POLICY "blocks_delete_own" ON public.wipp_blocks FOR DELETE TO authenticated USING (blocker_id = public.wipp_me());

-- wipp_call_invites
GRANT SELECT ON public.wipp_call_invites TO authenticated;
CREATE POLICY "calls_read_party" ON public.wipp_call_invites FOR SELECT TO authenticated
  USING (caller_id = public.wipp_me() OR callee_id = public.wipp_me());

-- wipp_push_tokens
GRANT SELECT ON public.wipp_push_tokens TO authenticated;
CREATE POLICY "push_read_own" ON public.wipp_push_tokens FOR SELECT TO authenticated USING (profile_id = public.wipp_me());

-- wipp_touch_invites
GRANT SELECT ON public.wipp_touch_invites TO authenticated;
CREATE POLICY "touch_invites_read_party" ON public.wipp_touch_invites FOR SELECT TO authenticated
  USING (sender_id = public.wipp_me() OR receiver_id = public.wipp_me());

-- wipp_touch_config : lecture seule
GRANT SELECT ON public.wipp_touch_config TO authenticated;
CREATE POLICY "touch_config_read" ON public.wipp_touch_config FOR SELECT TO authenticated USING (true);

-- Tables serveur uniquement (aucune politique) : wipp_sessions, wipp_link_codes, wipp_attachment_chunks,
-- wipp_touch_candidates, wipp_moderation_flags, wipp_moderation_access, wipp_moderation_keys, _migrations
ALTER TABLE public._migrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public._migrations FROM anon, authenticated;