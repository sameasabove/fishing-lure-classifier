/**
 * Map Supabase / network auth errors to clear user-facing copy.
 * Also classifies errors for UI actions (resend confirmation, sign up, etc.).
 */
export const classifyAuthError = (error) => {
  const raw = error?.message != null ? String(error.message) : '';
  const msg = raw.trim();
  const lower = msg.toLowerCase();

  if (!msg) {
    return { code: 'unknown', message: 'Something went wrong. Please try again.' };
  }

  if (lower.includes('invalid login credentials')) {
    return {
      code: 'invalid_credentials',
      message:
        "That email or password doesn't match. Try again, create an account, or reset your password.",
    };
  }
  if (lower.includes('email not confirmed')) {
    return {
      code: 'email_not_confirmed',
      message:
        'Please confirm your email before signing in. Check inbox and spam, then tap the confirmation link.',
    };
  }
  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return {
      code: 'already_registered',
      message: 'An account with this email already exists. Sign in instead, or use Forgot password.',
    };
  }
  if (lower.includes('password should be at least') || lower.includes('password is too short')) {
    return {
      code: 'weak_password',
      message: 'Password must be at least 6 characters.',
    };
  }
  if (
    lower.includes('network') ||
    lower.includes('fetch') ||
    lower.includes('failed to fetch') ||
    lower.includes('timeout')
  ) {
    return {
      code: 'network',
      message: 'Network error. Check your connection and try again.',
    };
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return {
      code: 'rate_limit',
      message: 'Too many attempts. Wait a moment and try again.',
    };
  }
  if (lower.includes('sign in cancelled') || lower.includes('cancelled')) {
    return { code: 'cancelled', message: 'Sign in cancelled.' };
  }
  if (lower.includes('not configured')) {
    return { code: 'not_configured', message: msg };
  }

  return { code: 'unknown', message: msg };
};

export const formatAuthError = (error, fallback = 'Something went wrong. Please try again.') => {
  const { message } = classifyAuthError(error);
  return message || fallback;
};
