'use client';
import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { User } from '@/types';

async function fetchUser(fbUser: FirebaseUser): Promise<User | null> {
  try {
    const token = await fbUser.getIdToken(true);
    const res = await fetch('/api/user', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('fetchUser status:', res.status);
      return null;
    }
    return await res.json() as User;
  } catch (err) {
    console.error('fetchUser error:', err);
    return null;
  }
}

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async (fbUser: FirebaseUser) => {
    const data = await fetchUser(fbUser);
    setFirebaseUser(fbUser);
    setUser(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        await loadUser(fbUser);
      } else {
        setFirebaseUser(null);
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsub();
  }, [loadUser]);

  return {
    firebaseUser,
    user,
    loading,
    isAuthenticated: !!firebaseUser && !loading,
  };
}
