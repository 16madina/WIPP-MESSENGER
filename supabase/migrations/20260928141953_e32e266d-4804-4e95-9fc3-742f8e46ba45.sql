CREATE POLICY "Business card owners can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'wipp-business-cards'
  AND EXISTS (
    SELECT 1 FROM public.wipp_profiles p
    WHERE p.auth_user_id = auth.uid()
      AND p.id = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Business card owners can read images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'wipp-business-cards'
  AND EXISTS (
    SELECT 1 FROM public.wipp_profiles p
    WHERE p.auth_user_id = auth.uid()
      AND p.id = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Business card owners can update images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'wipp-business-cards'
  AND EXISTS (
    SELECT 1 FROM public.wipp_profiles p
    WHERE p.auth_user_id = auth.uid()
      AND p.id = (storage.foldername(name))[1]
  )
)
WITH CHECK (
  bucket_id = 'wipp-business-cards'
  AND EXISTS (
    SELECT 1 FROM public.wipp_profiles p
    WHERE p.auth_user_id = auth.uid()
      AND p.id = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Business card owners can delete images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'wipp-business-cards'
  AND EXISTS (
    SELECT 1 FROM public.wipp_profiles p
    WHERE p.auth_user_id = auth.uid()
      AND p.id = (storage.foldername(name))[1]
  )
);