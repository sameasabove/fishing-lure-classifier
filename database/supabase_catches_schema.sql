-- Add Catches Support to Supabase
-- Run this in Supabase SQL Editor to add catches feature

-- ============================================================================
-- CATCHES TABLE (stores catch photos for each lure)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.catches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lure_analysis_id UUID REFERENCES public.lure_analyses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Catch information
  fish_species TEXT,
  weight TEXT,
  length TEXT,
  location TEXT,
  notes TEXT,
  
  -- Image
  image_url TEXT,
  image_path TEXT,
  
  -- Timestamps
  catch_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS catches_lure_analysis_id_idx ON public.catches(lure_analysis_id);
CREATE INDEX IF NOT EXISTS catches_user_id_idx ON public.catches(user_id);
CREATE INDEX IF NOT EXISTS catches_catch_date_idx ON public.catches(catch_date DESC);

-- Enable Row Level Security
ALTER TABLE public.catches ENABLE ROW LEVEL SECURITY;

-- Catches policies: Users can only access their own catches
CREATE POLICY "Users can view their own catches"
  ON public.catches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own catches"
  ON public.catches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own catches"
  ON public.catches FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own catches"
  ON public.catches FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_catches_updated_at
  BEFORE UPDATE ON public.catches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Done! Now catches can be stored in the cloud for each lure.

