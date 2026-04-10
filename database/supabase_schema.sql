-- Fishing Lure App - Supabase Database Schema
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/wisqqrerjbfbdiorlxtn/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies: Users can only read/update their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- LURE_ANALYSES TABLE (stores all lure analysis results)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.lure_analyses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Lure identification
  lure_type TEXT NOT NULL,
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  
  -- Image information
  image_url TEXT,
  image_name TEXT,
  image_path TEXT,  -- For backward compatibility with local files
  
  -- Analysis metadata
  analysis_method TEXT DEFAULT 'ChatGPT Vision API',
  analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- ChatGPT analysis results (JSON)
  chatgpt_analysis JSONB,
  
  -- Detailed lure information (JSON)
  lure_details JSONB,
  
  -- Cost tracking
  api_cost_usd DECIMAL(10, 6),
  tokens_used INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS lure_analyses_user_id_idx ON public.lure_analyses(user_id);
CREATE INDEX IF NOT EXISTS lure_analyses_created_at_idx ON public.lure_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS lure_analyses_lure_type_idx ON public.lure_analyses(lure_type);

-- Enable Row Level Security
ALTER TABLE public.lure_analyses ENABLE ROW LEVEL SECURITY;

-- Lure analyses policies: Users can only access their own lures
CREATE POLICY "Users can view their own lure analyses"
  ON public.lure_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lure analyses"
  ON public.lure_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lure analyses"
  ON public.lure_analyses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lure analyses"
  ON public.lure_analyses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- STORAGE BUCKET FOR LURE IMAGES
-- ============================================================================
-- Create storage bucket for lure images
INSERT INTO storage.buckets (id, name, public)
VALUES ('lure-images', 'lure-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: Users can upload/view their own images
CREATE POLICY "Users can upload their own lure images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'lure-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view lure images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'lure-images');

CREATE POLICY "Users can update their own lure images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'lure-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own lure images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'lure-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for lure_analyses
CREATE TRIGGER update_lure_analyses_updated_at
  BEFORE UPDATE ON public.lure_analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS FOR EASIER QUERYING
-- ============================================================================

-- View to get lure analyses with user information
-- Note: This view does NOT use SECURITY DEFINER to ensure RLS is properly enforced
CREATE OR REPLACE VIEW public.lure_analyses_with_user 
WITH (security_invoker=true) AS
SELECT 
  la.*,
  p.email as user_email,
  p.full_name as user_name
FROM public.lure_analyses la
LEFT JOIN public.profiles p ON la.user_id = p.id;

-- ============================================================================
-- SAMPLE QUERIES (FOR REFERENCE)
-- ============================================================================

-- Get all lures for current user:
-- SELECT * FROM lure_analyses WHERE user_id = auth.uid() ORDER BY created_at DESC;

-- Get lures by type for current user:
-- SELECT * FROM lure_analyses WHERE user_id = auth.uid() AND lure_type = 'Spinnerbait';

-- Get user's tackle box summary:
-- SELECT lure_type, COUNT(*) as count, AVG(confidence) as avg_confidence
-- FROM lure_analyses
-- WHERE user_id = auth.uid()
-- GROUP BY lure_type;

-- ============================================================================
-- DONE!
-- ============================================================================
-- Your database is now set up!
-- You can now:
-- 1. Create users with Supabase Auth
-- 2. Store lure analyses in the cloud
-- 3. Upload lure images to Supabase Storage
-- 4. Access data from multiple devices
-- ============================================================================

