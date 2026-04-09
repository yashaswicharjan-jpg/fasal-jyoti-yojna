
-- Farm fields for multi-field portfolio
CREATE TABLE public.farm_fields (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  field_name text NOT NULL,
  crop_name text,
  area_acres numeric(8,2),
  latitude double precision,
  longitude double precision,
  soil_type text,
  irrigation_type text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.farm_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fields" ON public.farm_fields FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fields" ON public.farm_fields FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fields" ON public.farm_fields FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own fields" ON public.farm_fields FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_farm_fields_updated BEFORE UPDATE ON public.farm_fields
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Produce listings (farmer storefront)
CREATE TABLE public.produce_listings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  crop_name text NOT NULL,
  quantity_kg numeric(10,2) NOT NULL,
  price_per_kg numeric(10,2) NOT NULL,
  harvest_date date,
  description text,
  image_url text,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','sold_out','expired')),
  location text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.produce_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can browse listings" ON public.produce_listings FOR SELECT USING (true);
CREATE POLICY "Users can insert own listings" ON public.produce_listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own listings" ON public.produce_listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own listings" ON public.produce_listings FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_produce_listings_updated BEFORE UPDATE ON public.produce_listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Orders
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id uuid NOT NULL,
  listing_id uuid NOT NULL REFERENCES public.produce_listings(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL,
  quantity_kg numeric(10,2) NOT NULL,
  total_price numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'placed' CHECK (status IN ('placed','confirmed','pickup_scheduled','in_transit','delivered','cancelled')),
  delivery_address text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view own orders" ON public.orders FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Sellers can view orders on their listings" ON public.orders FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Buyers can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Sellers can update order status" ON public.orders FOR UPDATE USING (auth.uid() = seller_id);

CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
