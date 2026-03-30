
-- Add result_summary column to search_history
ALTER TABLE public.search_history ADD COLUMN IF NOT EXISTS result_summary text;

-- Add indexes for fast ORDER BY queries
CREATE INDEX IF NOT EXISTS idx_search_history_user_created ON public.search_history (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_diagnostics_user_created ON public.ai_diagnostics (user_id, created_at DESC);
