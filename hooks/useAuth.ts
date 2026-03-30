'use client';

import { useState, useEffect, useCallback } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

interface AuthState {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    firebaseUser: null,
    user: null,
    loading: true,
    error: null,
  });

  const fetchUserProfile = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', firebaseUser.uid)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setState(prev => ({ ...prev, user: data as User, loading: false }));
      } else {
        // New user - create profile
        const newUser: Partial<User> = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          name: firebaseUser.displayName,
          avatar_url: firebaseUser.photoURL,
          onboarding_complete: false,
        };
        
        const { data: created, error: createError } = await supabase
          .from('users')
          .insert(newUser)
          .select()
          .single();

        if (createError) throw createError;
        setState(prev => ({ ...prev, user: created as User, loading: false }));
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setState(prev => ({ ...prev, error: 'שגיאה בטעינת הפרופיל', loading: false }));
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setState(prev => ({ ...prev, firebaseUser, loading: true }));
        await fetchUserProfile(firebaseUser);
      } else {
        setState({ firebaseUser: null, user: null, loading: false, error: null });
      }
    });

    return unsubscribe;
  }, [fetchUserProfile]);

  const signIn = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (error.code !== 'auth/popup-closed-by-user') {
        setState(prev => ({ ...prev, error: 'שגיאה בהתחברות עם Google', loading: false }));
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    }
  }, []);

  const signOutUser = useCallback(async () => {
    try {
      await signOut(auth);
    } catch {
      setState(prev => ({ ...prev, error: 'שגיאה בהתנתקות' }));
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (state.firebaseUser) {
      await fetchUserProfile(state.firebaseUser);
    }
  }, [state.firebaseUser, fetchUserProfile]);

  return {
    ...state,
    signIn,
    signOut: signOutUser,
    refreshUser,
    isAuthenticated: !!state.firebaseUser && !state.loading,
    needsOnboarding: state.user ? !state.user.onboarding_complete : false,
  };
}
