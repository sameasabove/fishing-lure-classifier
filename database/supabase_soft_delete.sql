-- Add soft delete support to lure_analyses
-- This prevents users from gaming the quota system by deleting lures
-- Run this in Supabase SQL Editor

-- Add deleted_at column
ALTER TABLE public.lure_analyses 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for soft delete queries
CREATE INDEX IF NOT EXISTS lure_analyses_deleted_at_idx 
  ON public.lure_analyses(deleted_at);

-- Update the quota checking function to count ALL records (even soft-deleted)
CREATE OR REPLACE FUNCTION public.get_monthly_scan_count(check_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  scan_count INTEGER;
  start_of_month TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate start of current month
  start_of_month := date_trunc('month', NOW());
  
  -- Count ALL scans this month (including soft-deleted ones)
  -- This prevents users from gaming the system by deleting lures
  SELECT COUNT(*) INTO scan_count
  FROM public.lure_analyses
  WHERE user_id = check_user_id
    AND created_at >= start_of_month;
    -- Note: NO filter on deleted_at - we count everything!
  
  RETURN scan_count;
END;
$$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ Soft delete enabled!';
  RAISE NOTICE 'Deleted lures still count toward quota to prevent abuse';
END $$;

