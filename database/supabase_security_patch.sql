-- ============================================================================
-- Supabase Security Patch
-- ============================================================================
-- This patch fixes the security warnings from Supabase's database linter
-- Run this in your Supabase SQL Editor to fix:
--   1. Function Search Path Mutable warnings
--   2. SECURITY DEFINER function vulnerabilities
--
-- After running this, you still need to enable "Leaked Password Protection"
-- in your Supabase Dashboard → Authentication → Password Policies
-- ============================================================================

-- Fix 1: Update handle_new_user function with secure search_path
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

-- Fix 2: Update update_updated_at_column function with secure search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this query to verify the functions are now secure:
--
-- SELECT 
--   routine_name,
--   routine_schema,
--   security_type
-- FROM information_schema.routines
-- WHERE routine_schema = 'public'
--   AND routine_type = 'FUNCTION'
--   AND routine_name IN ('handle_new_user', 'update_updated_at_column');
--
-- ============================================================================
-- NEXT STEP: Enable Leaked Password Protection
-- ============================================================================
-- 1. Go to Supabase Dashboard
-- 2. Navigate to Authentication → Password Policies (or Settings)
-- 3. Enable "Leaked Password Protection"
-- 4. Save changes
--
-- This will check passwords against HaveIBeenPwned.org to prevent users
-- from using compromised passwords.
-- ============================================================================

-- Fix 3: Update view to use security_invoker (not security_definer)
-- This ensures RLS policies are properly enforced for the querying user
DROP VIEW IF EXISTS public.lure_analyses_with_user;

CREATE VIEW public.lure_analyses_with_user 
WITH (security_invoker=true) AS
SELECT 
  la.*,
  p.email as user_email,
  p.full_name as user_name
FROM public.lure_analyses la
LEFT JOIN public.profiles p ON la.user_id = p.id;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ Security patch applied successfully!';
  RAISE NOTICE '  - Fixed 2 functions (search_path security)';
  RAISE NOTICE '  - Fixed 1 view (security_invoker)';
  RAISE NOTICE 'Next step: Enable Leaked Password Protection in Dashboard (Pro plan)';
END $$;

