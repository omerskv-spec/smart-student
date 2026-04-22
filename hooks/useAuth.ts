'use client';
import { useState, useEffect, useCallback } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
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
      const token = await firebaseUser.getIdToken();
      const res = await fetch('/api/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setState(prev => ({ ...prev, user: data as User, loading: false }));
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setState(prev => ({ ...prev, error: 'שגיאה בטעינת הפרופיל', loading: false }));
    }
  }, []);

  useEffect(() => {
    // Handle redirect result on app load (after Google redirects back)
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          // Auth state change will fire, fetchUserProfile will be called
          console.log('Redirect sign-in success:', result.user.email);
        }
      })
      .catch((err) => {
        console.error('getRedirectResult error:', err);
        setState(prev => ({ ...prev, loading: false }));
      });
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
      await signInWithRedirect(auth, googleProvider);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.error('signInWithRedirect error:', error);
      setState(prev => ({ ...prev, error: 'שגיאה בהתחברות עם Google', loading: false }));
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
