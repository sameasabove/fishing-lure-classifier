/**
 * Map Supabase / network auth errors to clear user-facing copy.
 */
export const formatAuthError = (error, fallback = 'Something went wrong. Please try again.') => {
  const raw = error?.message != null ? String(error.message) : '';
  const msg = raw.trim();
  const lower = msg.toLowerCase();

  if (!msg) {
    return fallback;
  }

  if (lower.includes('invalid login credentials')) {
    return "That email or password doesn't match our records. Double-check and try again, or use Forgot password.";
  }
  if (lower.includes('email not confirmed')) {
    return 'Please confirm your email before signing in. Check your inbox for the verification link.';
  }
  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return 'An account with this email already exists. Sign in instead, or use Forgot password.';
  }
  if (lower.includes('password should be at least') || lower.includes('password is too short')) {
    return 'Password must be at least 6 characters.';
  }
  if (
    lower.includes('network') ||
    lower.includes('fetch') ||
    lower.includes('failed to fetch') ||
    lower.includes('timeout')
  ) {
    return 'Network error. Check your connection and try again.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many attempts. Wait a moment and try again.';
  }

  return msg || fallback;
};
