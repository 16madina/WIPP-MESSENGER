CREATE OR REPLACE FUNCTION wipp_private.wipp_is_member(_chat_id text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, wipp_private AS $$
  SELECT EXISTS (SELECT 1 FROM public.wipp_chat_members WHERE chat_id = _chat_id AND profile_id = wipp_private.wipp_me()) $$;
CREATE OR REPLACE FUNCTION wipp_private.wipp_chat_has_block(_chat_id text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, wipp_private AS $$
  SELECT EXISTS (SELECT 1 FROM public.wipp_chat_members m WHERE m.chat_id = _chat_id AND m.profile_id <> wipp_private.wipp_me()
    AND wipp_private.wipp_is_blocked_between(wipp_private.wipp_me(), m.profile_id)) $$;