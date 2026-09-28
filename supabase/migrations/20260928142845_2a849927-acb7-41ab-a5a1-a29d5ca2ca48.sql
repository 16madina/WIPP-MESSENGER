DROP POLICY IF EXISTS "Business card owners can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Business card owners can read images" ON storage.objects;
DROP POLICY IF EXISTS "Business card owners can update images" ON storage.objects;
DROP POLICY IF EXISTS "Business card owners can delete images" ON storage.objects;
CREATE POLICY "Business card owners can upload images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'wipp-business-cards' AND (storage.foldername(name))[1] = public.wipp_my_profile_id());
CREATE POLICY "Business card owners can read images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'wipp-business-cards' AND (storage.foldername(name))[1] = public.wipp_my_profile_id());
CREATE POLICY "Business card owners can update images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'wipp-business-cards' AND (storage.foldername(name))[1] = public.wipp_my_profile_id()) WITH CHECK (bucket_id = 'wipp-business-cards' AND (storage.foldername(name))[1] = public.wipp_my_profile_id());
CREATE POLICY "Business card owners can delete images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'wipp-business-cards' AND (storage.foldername(name))[1] = public.wipp_my_profile_id());