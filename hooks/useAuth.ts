'use client';
import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, getRedirectResult, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { User } from '@/types';

interface AuthState {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  error: string | null;
}

async function fetchOrCreateUser(firebaseUser: FirebaseUser): Promise<User | null> {
  try {
    const token = await firebaseUser.getIdToken(true);
    const res = await fetch('/api/user', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('fetchOrCreateUser failed:', res.status, await res.text());
      return null;
    }
    return await res.json() as User;
  } catch (err) {
    console.error('fetchOrCreateUser error:', err);
    return null;
  }
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    firebaseUser: null,
    user: null,
    loading: true,
    error: null,
  });

  const loadUser = useCallback(async (fbUser: FirebaseUser) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    const user = await fetchOrCreateUser(fbUser);
    setState({ firebaseUser: fbUser, user, loading: false, error: null });
  }, []);

  useEffect(() => {
    // Handle redirect result first
    getRedirectResult(auth)
      .then(result => {
        if (result?.user) {
          loadUser(result.user);
        }
      })
      .catch(err => {
        console.error('getRedirectResult error:', err);
        setState(prev => ({ ...prev, loading: false, error: err.message }));
      });

    // Then subscribe to auth state changes
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        await loadUser(fbUser);
      } else {
        setState({ firebaseUser: null, user: null, loading: false, error: null });
      }
    });

    return () => unsub();
  }, [loadUser]);

  return {
    firebaseUser: state.firebaseUser,
    user: state.user,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.firebaseUser && !state.loading,
    needsOnboarding: state.user ? !state.user.onboarding_complete : false,
  };
}
