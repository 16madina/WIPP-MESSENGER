CREATE TABLE public.wipp_business_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_profile_id text NOT NULL REFERENCES public.wipp_profiles(id) ON DELETE CASCADE,
  public_id text NOT NULL UNIQUE DEFAULT ('biz_' || replace(gen_random_uuid()::text, '-', '')),
  name text NOT NULL,
  category text NOT NULL,
  description text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  address text,
  show_address boolean NOT NULL DEFAULT false,
  hours text,
  business_phone text,
  website text,
  cover_url text,
  logo_url text,
  photo_urls text[] NOT NULL DEFAULT '{}'::text[],
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_profile_id)
);

GRANT SELECT ON public.wipp_business_cards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wipp_business_cards TO authenticated;
GRANT ALL ON public.wipp_business_cards TO service_role;

ALTER TABLE public.wipp_business_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published business cards are public"
ON public.wipp_business_cards
FOR SELECT
TO anon, authenticated
USING (is_published = true);

CREATE POLICY "Owners can read their business card"
ON public.wipp_business_cards
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.wipp_profiles p
  WHERE p.id = owner_profile_id AND p.auth_user_id = auth.uid()
));

CREATE POLICY "Owners can create their business card"
ON public.wipp_business_cards
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.wipp_profiles p
  WHERE p.id = owner_profile_id AND p.auth_user_id = auth.uid()
));

CREATE POLICY "Owners can update their business card"
ON public.wipp_business_cards
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.wipp_profiles p
  WHERE p.id = owner_profile_id AND p.auth_user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.wipp_profiles p
  WHERE p.id = owner_profile_id AND p.auth_user_id = auth.uid()
));

CREATE POLICY "Owners can delete their business card"
ON public.wipp_business_cards
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.wipp_profiles p
  WHERE p.id = owner_profile_id AND p.auth_user_id = auth.uid()
));

CREATE OR REPLACE FUNCTION public.wipp_business_cards_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$$;

CREATE TRIGGER wipp_business_cards_updated_at
BEFORE UPDATE ON public.wipp_business_cards
FOR EACH ROW EXECUTE FUNCTION public.wipp_business_cards_updated_at();