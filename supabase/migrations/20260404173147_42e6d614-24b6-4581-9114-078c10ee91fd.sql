
-- Add new columns to community_posts
ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS location_tag text,
  ADD COLUMN IF NOT EXISTS comments_count integer default 0;

-- Add likes_count to comments
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS likes_count integer default 0;

-- Post likes table
CREATE TABLE IF NOT EXISTS public.post_likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.community_posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

-- Comment likes table
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id uuid default gen_random_uuid() primary key,
  comment_id uuid references public.comments(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(comment_id, user_id)
);

-- RLS for post_likes
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read post likes" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users insert own post likes" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own post likes" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS for comment_likes
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read comment likes" ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "Users insert own comment likes" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own comment likes" ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);

-- toggle_post_like function
CREATE OR REPLACE FUNCTION public.toggle_post_like(p_post_id uuid, p_user_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  existing_id uuid;
  new_count integer;
BEGIN
  SELECT id INTO existing_id FROM public.post_likes WHERE post_id = p_post_id AND user_id = p_user_id;
  IF existing_id IS NOT NULL THEN
    DELETE FROM public.post_likes WHERE id = existing_id;
    UPDATE public.community_posts SET upvotes_count = greatest(0, upvotes_count - 1) WHERE id = p_post_id RETURNING upvotes_count INTO new_count;
    RETURN json_build_object('liked', false, 'count', new_count);
  ELSE
    INSERT INTO public.post_likes (post_id, user_id) VALUES (p_post_id, p_user_id);
    UPDATE public.community_posts SET upvotes_count = upvotes_count + 1 WHERE id = p_post_id RETURNING upvotes_count INTO new_count;
    RETURN json_build_object('liked', true, 'count', new_count);
  END IF;
END;
$$;

-- add_comment function
CREATE OR REPLACE FUNCTION public.add_comment(p_post_id uuid, p_user_id uuid, p_comment text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_comment_id uuid;
BEGIN
  INSERT INTO public.comments (post_id, user_id, comment_text) VALUES (p_post_id, p_user_id, p_comment) RETURNING id INTO new_comment_id;
  UPDATE public.community_posts SET comments_count = comments_count + 1 WHERE id = p_post_id;
  RETURN new_comment_id;
END;
$$;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON public.community_posts (user_id, created_at desc);
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON public.comments (post_id, created_at asc);
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON public.post_likes (post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON public.post_likes (user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
