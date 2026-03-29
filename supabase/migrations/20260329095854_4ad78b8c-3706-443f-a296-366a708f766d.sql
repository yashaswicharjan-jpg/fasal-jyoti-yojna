-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 1. PROFILES TABLE
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text NOT NULL,
  phone_number text UNIQUE,
  location_village text,
  state text,
  preferred_language text DEFAULT 'Hindi',
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. FARMS TABLE
CREATE TABLE public.farms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  land_size_acres numeric(6,2),
  soil_type_manual text,
  gps_coordinates point,
  primary_crop text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. AI DIAGNOSTICS TABLE
CREATE TABLE public.ai_diagnostics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  image_url text,
  detection_type text CHECK (detection_type IN ('soil', 'disease')),
  result_title text,
  treatment_plan text,
  organic_options text,
  created_at timestamptz DEFAULT now()
);

-- 4. COMMUNITY POSTS TABLE
CREATE TABLE public.community_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  media_url text,
  category text CHECK (category IN ('question', 'success_story')),
  upvotes_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 5. COMMENTS TABLE
CREATE TABLE public.comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  comment_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 6. SEARCH HISTORY TABLE
CREATE TABLE public.search_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  query text,
  feature text,
  created_at timestamptz DEFAULT now()
);

-- ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- FARMS POLICIES
CREATE POLICY "Users can view own farms" ON public.farms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own farms" ON public.farms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own farms" ON public.farms FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own farms" ON public.farms FOR DELETE USING (auth.uid() = user_id);

-- AI DIAGNOSTICS POLICIES
CREATE POLICY "Users can view own diagnostics" ON public.ai_diagnostics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own diagnostics" ON public.ai_diagnostics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own diagnostics" ON public.ai_diagnostics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own diagnostics" ON public.ai_diagnostics FOR DELETE USING (auth.uid() = user_id);

-- COMMUNITY POSTS
CREATE POLICY "Anyone can read posts" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Users can insert own posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.community_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.community_posts FOR DELETE USING (auth.uid() = user_id);

-- COMMENTS
CREATE POLICY "Anyone can read comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can insert own comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- SEARCH HISTORY
CREATE POLICY "Users can view own history" ON public.search_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON public.search_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own history" ON public.search_history FOR DELETE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, preferred_language)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'किसान'), 'Hindi');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_farms_updated_at BEFORE UPDATE ON public.farms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for farm images
INSERT INTO storage.buckets (id, name, public) VALUES ('farm-images', 'farm-images', true);

CREATE POLICY "Anyone can view farm images" ON storage.objects FOR SELECT USING (bucket_id = 'farm-images');
CREATE POLICY "Authenticated users can upload farm images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'farm-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own farm images" ON storage.objects FOR UPDATE USING (bucket_id = 'farm-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own farm images" ON storage.objects FOR DELETE USING (bucket_id = 'farm-images' AND auth.uid()::text = (storage.foldername(name))[1]);