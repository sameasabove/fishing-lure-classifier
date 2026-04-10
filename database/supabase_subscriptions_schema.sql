-- ============================================================================
-- USER SUBSCRIPTIONS TABLE
-- ============================================================================
-- Tracks subscription status for users
-- Synced from RevenueCat via mobile app
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Subscription status
  is_pro BOOLEAN DEFAULT false NOT NULL,
  subscription_type TEXT, -- 'monthly', 'yearly', 'lifetime'
  product_identifier TEXT, -- RevenueCat product ID
  
  -- Expiration (NULL for lifetime)
  expires_at TIMESTAMP WITH TIME ZONE,
  will_renew BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS user_subscriptions_user_id_idx 
  ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_is_pro_idx 
  ON public.user_subscriptions(is_pro);

-- Enable Row Level Security
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert/update their own subscription (for syncing from app)
CREATE POLICY "Users can manage own subscription"
  ON public.user_subscriptions FOR ALL
  USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTION: Check if user is PRO
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_user_pro(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  subscription RECORD;
  is_active BOOLEAN;
BEGIN
  -- Get user subscription
  SELECT * INTO subscription
  FROM public.user_subscriptions
  WHERE user_id = check_user_id;
  
  -- No subscription found
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Not a PRO user
  IF NOT subscription.is_pro THEN
    RETURN false;
  END IF;
  
  -- Lifetime subscription (no expiration)
  IF subscription.expires_at IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check if subscription is still valid
  IF subscription.expires_at > NOW() THEN
    RETURN true;
  END IF;
  
  -- Expired
  RETURN false;
END;
$$;

-- ============================================================================
-- HELPER FUNCTION: Get monthly scan count for user
-- ============================================================================

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
  
  -- Count scans this month
  SELECT COUNT(*) INTO scan_count
  FROM public.lure_analyses
  WHERE user_id = check_user_id
    AND created_at >= start_of_month;
  
  RETURN scan_count;
END;
$$;

-- ============================================================================
-- HELPER FUNCTION: Check if user can scan
-- ============================================================================

CREATE OR REPLACE FUNCTION public.can_user_scan(check_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  is_pro_user BOOLEAN;
  scan_count INTEGER;
  free_tier_limit INTEGER := 10;
  remaining INTEGER;
BEGIN
  -- Check if PRO user
  is_pro_user := public.is_user_pro(check_user_id);
  
  IF is_pro_user THEN
    RETURN jsonb_build_object(
      'canScan', true,
      'isPro', true,
      'reason', 'pro',
      'unlimited', true
    );
  END IF;
  
  -- Free user - check quota
  scan_count := public.get_monthly_scan_count(check_user_id);
  remaining := free_tier_limit - scan_count;
  
  IF remaining > 0 THEN
    RETURN jsonb_build_object(
      'canScan', true,
      'isPro', false,
      'reason', 'free_quota',
      'used', scan_count,
      'remaining', remaining,
      'limit', free_tier_limit
    );
  ELSE
    RETURN jsonb_build_object(
      'canScan', false,
      'isPro', false,
      'reason', 'quota_exceeded',
      'used', scan_count,
      'limit', free_tier_limit
    );
  END IF;
END;
$$;

-- ============================================================================
-- VIEW: Subscription stats for analytics
-- ============================================================================

CREATE OR REPLACE VIEW public.subscription_stats AS
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

-- ============================================================================
-- SAMPLE QUERIES (FOR REFERENCE)
-- ============================================================================

-- Check if a user is PRO:
-- SELECT public.is_user_pro('user-uuid-here');

-- Get monthly scan count for user:
-- SELECT public.get_monthly_scan_count('user-uuid-here');

-- Check if user can scan:
-- SELECT public.can_user_scan('user-uuid-here');

-- Get all PRO users:
-- SELECT * FROM user_subscriptions WHERE is_pro = true;

-- Get subscription stats:
-- SELECT * FROM subscription_stats;

-- Find expiring subscriptions (next 7 days):
-- SELECT * FROM user_subscriptions 
-- WHERE expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
--   AND will_renew = false;

-- ============================================================================
-- DONE!
-- ============================================================================
-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ User subscriptions table created!';
  RAISE NOTICE 'Helper functions: is_user_pro(), get_monthly_scan_count(), can_user_scan()';
  RAISE NOTICE 'View: subscription_stats';
END $$;

