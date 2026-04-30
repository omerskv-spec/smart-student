'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const token = await fbUser.getIdToken(true);
          const res = await fetch('/api/user', {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          });
          if (res.ok) {
            const data = await res.json();
            router.replace(data?.onboarding_complete ? '/chat' : '/onboarding');
            return;
          }
        } catch (e) {
          console.error('auth check error:', e);
        }
      }
      setChecking(false);
    });
    return () => unsub();
  }, [router]);

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken(true);
      const res = await fetch('/api/user', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        router.replace(data?.onboarding_complete ? '/chat' : '/onboarding');
      } else {
        router.replace('/onboarding');
      }
    } catch (err: unknown) {
      console.error('sign in error:', err);
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('popup-closed')) {
        setError('החלון נסגר. נסה שוב.');
      } else if (msg.includes('popup-blocked')) {
        setError('הדפדפן חסם את החלון. אפשר popups לאתר זה.');
      } else {
        setError('שגיאה בהתחברות. נסה שוב.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F4EF]">
        <div className="w-6 h-6 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F4EF] p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] flex items-center justify-center text-white text-xl mx-auto mb-4">
            ✦
          </div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">Smart Student</h1>
          <p className="text-[#6B6B6B] mt-1 text-sm">עוזר הלימודים החכם שלך</p>
        </div>
        <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm">
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-[rgba(0,0,0,0.14)] rounded-xl hover:bg-[#F5F4EF] transition-all text-sm font-medium text-[#1A1A1A] disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            המשך עם Google
          </button>
        </div>
        <p className="text-center text-xs text-[#9B9B9B] mt-4">
          מאובטח דרך Google · הנתונים שלך פרטיים
        </p>
      </div>
    </div>
  );
}
