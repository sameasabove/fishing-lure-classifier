/**
 * Authentication Context - Manages user authentication state
 */

import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../config/supabase';
import { getCurrentUser, signIn, signUp, signOut } from '../services/supabaseService';
import { initializeSubscriptions } from '../services/subscriptionService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        const msg = error.message || '';
        const stale =
          msg.includes('Refresh Token') ||
          msg.includes('refresh_token') ||
          msg.includes('Invalid JWT');
        if (stale) {
          console.warn('[Auth] Clearing stale session:', msg);
          await supabase.auth.signOut({ scope: 'local' });
        } else {
          console.warn('[Auth] getSession error:', msg);
        }
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      setSession(session);
      const user = session?.user ?? null;
      setUser(user);

      // Initialize RevenueCat if user is already logged in
      if (user) {
        try {
          console.log('[Auth] Initializing RevenueCat for existing user:', user.id);
          await initializeSubscriptions(user.id);
        } catch (error) {
          console.warn('[Auth] RevenueCat initialization failed:', error);
          // Don't block app if RevenueCat fails
        }
      }

      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Auth state changed:', event);
        setSession(session);
        const newUser = session?.user ?? null;
        setUser(newUser);
        
        // Initialize RevenueCat when user logs in
        if (newUser && event === 'SIGNED_IN') {
          try {
            console.log('[Auth] Initializing RevenueCat for user:', newUser.id);
            await initializeSubscriptions(newUser.id);
          } catch (error) {
            console.warn('[Auth] RevenueCat initialization failed:', error);
            // Don't block app if RevenueCat fails
          }
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    loading,
    // Do not toggle global `loading` on sign-in/sign-up — App.js replaces the
    // auth stack with a spinner when loading, which unmounts Login/Signup and
    // wipes email, password, and error messages on failed attempts.
    signIn: async (email, password) => signIn(email, password),
    signUp: async (email, password, fullName) => signUp(email, password, fullName),
    signOut: async () => {
      setLoading(true);
      try {
        const result = await signOut();
        setUser(null);
        setSession(null);
        return result;
      } finally {
        setLoading(false);
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;

