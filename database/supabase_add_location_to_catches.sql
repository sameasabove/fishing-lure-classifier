-- Add location (latitude/longitude) support to catches table
-- Run this in Supabase SQL Editor

-- ============================================================================
-- ADD LOCATION COLUMNS TO CATCHES TABLE
-- ============================================================================

-- Add latitude and longitude columns to catches table
ALTER TABLE public.catches
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Create index for location-based queries (useful for map views)
CREATE INDEX IF NOT EXISTS catches_location_idx ON public.catches(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.catches.latitude IS 'Latitude coordinate of catch location (GPS)';
COMMENT ON COLUMN public.catches.longitude IS 'Longitude coordinate of catch location (GPS)';

-- Done! Now catches can store GPS coordinates for map visualization.
