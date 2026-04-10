-- ============================================================================
-- FIX: subscription_stats view security issue - STEP BY STEP
-- ============================================================================
-- Run each section separately if you want to be cautious

-- STEP 1: Check what exists first (safe, read-only)
SELECT 
  schemaname, 
  viewname, 
  definition 
FROM pg_views 
WHERE viewname = 'subscription_stats';

-- STEP 2: Drop the existing view (safe - we're recreating it)
DROP VIEW IF EXISTS public.subscription_stats CASCADE;

-- STEP 3: Create the secure function (this fixes the security issue)
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
SECURITY INVOKER  -- Key: runs with caller's permissions, respects RLS
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

-- STEP 4: Grant permissions
GRANT EXECUTE ON FUNCTION public.get_subscription_stats() TO authenticated;

-- STEP 5: Create the view (for backward compatibility with your backend)
CREATE VIEW public.subscription_stats AS
SELECT * FROM public.get_subscription_stats();

-- STEP 6: Grant permissions on the view
GRANT SELECT ON public.subscription_stats TO authenticated;

-- STEP 7: Test it works (safe, read-only)
SELECT * FROM public.subscription_stats;
SELECT * FROM public.get_subscription_stats();

