-- Add favorite column to lure_analyses table
-- Run this in Supabase SQL Editor

ALTER TABLE public.lure_analyses 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Create index for favorites
CREATE INDEX IF NOT EXISTS lure_analyses_is_favorite_idx 
  ON public.lure_analyses(is_favorite);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ Added is_favorite column to lure_analyses table!';
END $$;

