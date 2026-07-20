import { formatAuthError } from '../authErrors';

describe('formatAuthError', () => {
  it('maps invalid credentials', () => {
    expect(formatAuthError({ message: 'Invalid login credentials' })).toMatch(/email or password/i);
  });

  it('maps email not confirmed', () => {
    expect(formatAuthError({ message: 'Email not confirmed' })).toMatch(/confirm your email/i);
  });

  it('maps already registered', () => {
    expect(formatAuthError({ message: 'User already registered' })).toMatch(/already exists/i);
  });

  it('maps network errors', () => {
    expect(formatAuthError({ message: 'Network request failed' })).toMatch(/network/i);
  });

  it('falls back to message or default', () => {
    expect(formatAuthError({ message: 'Weird custom error' })).toBe('Weird custom error');
    expect(formatAuthError({})).toMatch(/something went wrong/i);
  });
});
