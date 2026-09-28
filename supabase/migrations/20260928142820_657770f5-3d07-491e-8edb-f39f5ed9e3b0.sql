DROP POLICY IF EXISTS "Owners can read their business card" ON public.wipp_business_cards;
DROP POLICY IF EXISTS "Owners can create their business card" ON public.wipp_business_cards;
DROP POLICY IF EXISTS "Owners can update their business card" ON public.wipp_business_cards;
DROP POLICY IF EXISTS "Owners can delete their business card" ON public.wipp_business_cards;
CREATE POLICY "Owners can read their business card" ON public.wipp_business_cards FOR SELECT TO authenticated USING (owner_profile_id = public.wipp_my_profile_id());
CREATE POLICY "Owners can create their business card" ON public.wipp_business_cards FOR INSERT TO authenticated WITH CHECK (owner_profile_id = public.wipp_my_profile_id());
CREATE POLICY "Owners can update their business card" ON public.wipp_business_cards FOR UPDATE TO authenticated USING (owner_profile_id = public.wipp_my_profile_id()) WITH CHECK (owner_profile_id = public.wipp_my_profile_id());
CREATE POLICY "Owners can delete their business card" ON public.wipp_business_cards FOR DELETE TO authenticated USING (owner_profile_id = public.wipp_my_profile_id());