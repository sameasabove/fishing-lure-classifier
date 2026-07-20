/**
 * Native social sign-in (Apple / Google) → Supabase session via ID token.
 */
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { supabase } from '../config/supabase';
import { CONFIG } from '../core/config';

let googleConfigured = false;

const getGoogleSignin = () => {
  // Lazy require — native module is omitted from builds until Google OAuth is configured.
  // eslint-disable-next-line global-require
  return require('@react-native-google-signin/google-signin').GoogleSignin;
};

const ensureGoogleConfigured = () => {
  if (googleConfigured) return;
  const webClientId = CONFIG.googleAuth?.webClientId;
  const iosClientId = CONFIG.googleAuth?.iosClientId;
  if (!webClientId) {
    throw new Error(
      'Google Sign-In is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env / EAS.'
    );
  }
  getGoogleSignin().configure({
    webClientId,
    iosClientId: iosClientId || undefined,
    offlineAccess: false,
  });
  googleConfigured = true;
};

const sha256 = async (input) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);

/**
 * Sign in with Apple (iOS only).
 */
export const signInWithApple = async () => {
  if (Platform.OS !== 'ios') {
    throw new Error('Sign in with Apple is only available on iPhone and iPad.');
  }

  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    throw new Error('Sign in with Apple is not available on this device.');
  }

  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await sha256(rawNonce);

  let credential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (e) {
    if (e?.code === 'ERR_REQUEST_CANCELED') {
      throw new Error('Sign in cancelled.');
    }
    throw e;
  }

  if (!credential.identityToken) {
    throw new Error('Apple Sign-In did not return an identity token.');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });

  if (error) throw new Error(error.message || 'Apple Sign-In failed');

  // Apple only returns name on first authorize — store when present
  const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (fullName && data.user) {
    await supabase.auth.updateUser({ data: { full_name: fullName } }).catch(() => {});
  }

  return { success: true, user: data.user, session: data.session };
};

/**
 * Sign in with Google (iOS + Android).
 */
export const signInWithGoogle = async () => {
  ensureGoogleConfigured();
  const GoogleSignin = getGoogleSignin();

  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  const response = await GoogleSignin.signIn();

  if (response?.type === 'cancelled') {
    throw new Error('Sign in cancelled.');
  }

  let idToken = response?.data?.idToken || response?.idToken || null;
  if (!idToken) {
    try {
      const tokens = await GoogleSignin.getTokens();
      idToken = tokens?.idToken || null;
    } catch (_) {
      idToken = null;
    }
  }

  if (!idToken) {
    throw new Error('Google Sign-In did not return an ID token.');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });

  if (error) throw new Error(error.message || 'Google Sign-In failed');
  return { success: true, user: data.user, session: data.session };
};

export const isAppleSignInAvailable = async () => {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
};

export const isGoogleSignInConfigured = () =>
  Boolean(CONFIG.googleAuth?.webClientId);
