import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../core/config';

export const supabase = createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

export const SUPABASE_CONFIG = CONFIG.supabase;

export default supabase;
