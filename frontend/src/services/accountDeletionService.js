import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases from 'react-native-purchases';
import { supabase } from '../config/supabase';
import { deleteAccountOnBackend } from './backendService';

/**
 * Deletes the remote account (Flask → Supabase admin), then clears RevenueCat,
 * local Supabase session, and AsyncStorage. Call only after the user confirms.
 */
export async function performAccountDeletion() {
  await deleteAccountOnBackend();

  try {
    await Purchases.logOut();
  } catch (e) {
    if (__DEV__) {
      console.warn('[AccountDeletion] RevenueCat logOut:', e?.message || e);
    }
  }

  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error && __DEV__) {
    console.warn('[AccountDeletion] Supabase signOut:', error.message);
  }

  try {
    await AsyncStorage.clear();
  } catch (e) {
    if (__DEV__) {
      console.warn('[AccountDeletion] AsyncStorage.clear:', e?.message || e);
    }
  }
}
