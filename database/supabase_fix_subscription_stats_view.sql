-- ============================================================================
-- FIX: subscription_stats view security issue
-- ============================================================================
-- This fixes the SECURITY DEFINER warning from Supabase
-- Run this in Supabase SQL Editor

-- SOLUTION: Convert the view to a function with SECURITY INVOKER
-- This ensures it runs with the querying user's permissions, not the definer's

-- Drop the existing view
DROP VIEW IF EXISTS public.subscription_stats CASCADE;

-- Create a function instead (more secure, respects RLS properly)
CREATE OR REPLACE FUNCTION public.get_subscription_stats()
RETURNS TABLE (
  total_users BIGINT,
  pro_users BIGINT,
  free_users BIGINT,
  monthly_subscribers BIGINT,
  yearly_subscribers BIGINT,
  lifetime_subscribers BIGINT,
  pro_conversion_rate NUMERIC
)
LANGUAGE sql
SECURITY INVOKER  -- This is key: runs with caller's permissions, not definer's
SET search_path = ''  -- Security: prevents SQL injection via search_path manipulation
STABLE
AS $$
  SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE is_pro) as pro_users,
    COUNT(*) FILTER (WHERE NOT is_pro) as free_users,
    COUNT(*) FILTER (WHERE subscription_type = 'monthly') as monthly_subscribers,
    COUNT(*) FILTER (WHERE subscription_type = 'yearly') as yearly_subscribers,
    COUNT(*) FILTER (WHERE subscription_type = 'lifetime') as lifetime_subscribers,
    ROUND(
      (COUNT(*) FILTER (WHERE is_pro)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as pro_conversion_rate
  FROM public.user_subscriptions;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_subscription_stats() TO authenticated;

-- IMPORTANT: The view is NOT being recreated to avoid the SECURITY DEFINER warning
-- The view will be permanently removed. Use the function instead.
-- 
-- To query stats:
--   - In SQL: SELECT * FROM get_subscription_stats();
--   - In backend: client.rpc('get_subscription_stats').execute()
-- 
-- The backend code has been updated to use the function via RPC.

