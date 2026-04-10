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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
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
    signIn: async (email, password) => {
      setLoading(true);
      try {
        const result = await signIn(email, password);
        return result;
      } finally {
        setLoading(false);
      }
    },
    signUp: async (email, password, fullName) => {
      setLoading(true);
      try {
        const result = await signUp(email, password, fullName);
        return result;
      } finally {
        setLoading(false);
      }
    },
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

