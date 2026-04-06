
-- Add missing columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS preferred_theme text DEFAULT 'light';

-- Add missing columns to farms
ALTER TABLE public.farms
  ADD COLUMN IF NOT EXISTS irrigation_type text,
  ADD COLUMN IF NOT EXISTS farming_type text,
  ADD COLUMN IF NOT EXISTS secondary_crops text[],
  ADD COLUMN IF NOT EXISTS farm_description text;

-- Trigger to keep updated_at current
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_farms_updated ON public.farms;
CREATE TRIGGER trg_farms_updated
  BEFORE UPDATE ON public.farms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
