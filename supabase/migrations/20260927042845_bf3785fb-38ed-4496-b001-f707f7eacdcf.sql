CREATE POLICY "push_insert_own" ON public.wipp_push_tokens FOR INSERT TO authenticated
  WITH CHECK (profile_id IN (SELECT id FROM public.wipp_profiles WHERE auth_user_id = auth.uid()));
CREATE POLICY "push_update_own" ON public.wipp_push_tokens FOR UPDATE TO authenticated
  USING (profile_id IN (SELECT id FROM public.wipp_profiles WHERE auth_user_id = auth.uid()))
  WITH CHECK (profile_id IN (SELECT id FROM public.wipp_profiles WHERE auth_user_id = auth.uid()));
CREATE POLICY "push_delete_own" ON public.wipp_push_tokens FOR DELETE TO authenticated
  USING (profile_id IN (SELECT id FROM public.wipp_profiles WHERE auth_user_id = auth.uid()));