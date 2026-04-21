'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { GRADES, TRACKS, SUBJECTS } from '@/lib/constants';

export default function OnboardingPage() {
  const { user, firebaseUser } = useAuth();
  const router = useRouter();
  const [grade, setGrade] = useState('');
  const [track, setTrack] = useState('כללי');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.onboarding_complete) router.push('/chat');
  }, [user, router]);

  const toggleSubject = (id: string) => {
    setSubjects(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (!grade || subjects.length === 0 || !firebaseUser) return;
    setSaving(true);
    setError('');
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ grade, track, subjects, onboarding_complete: true }),
      });
      if (!res.ok) throw new Error('שגיאה בשמירה');
      router.push('/chat');
    } catch {
      setError('שגיאה בשמירת הפרופיל. נסה שוב.');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F4EF] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-white text-base mx-auto mb-3">✦</div>
          <h1 className="text-xl font-semibold text-[#1A1A1A]">בוא נכיר</h1>
          <p className="text-[#6B6B6B] mt-1 text-sm">כדי שאוכל לעזור לך הכי טוב</p>
        </div>

        <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm space-y-6">
          <div>
            <label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wider block mb-3">כיתה *</label>
            <div className="flex gap-2 flex-wrap">
              {GRADES.map(g => (
                <button key={g} onClick={() => setGrade(g)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                    grade === g
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                      : 'bg-white text-[#6B6B6B] border-[rgba(0,0,0,0.12)] hover:border-[rgba(0,0,0,0.25)]'
                  }`}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wider block mb-3">מגמה</label>
            <div className="flex gap-2 flex-wrap">
              {TRACKS.map(t => (
                <button key={t} onClick={() => setTrack(t)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                    track === t
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                      : 'bg-white text-[#6B6B6B] border-[rgba(0,0,0,0.12)] hover:border-[rgba(0,0,0,0.25)]'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wider block mb-3">מקצועות *</label>
            <div className="grid grid-cols-2 gap-2">
              {SUBJECTS.map(s => (
                <button key={s.id} onClick={() => toggleSubject(s.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all border text-right ${
                    subjects.includes(s.id)
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                      : 'bg-white text-[#1A1A1A] border-[rgba(0,0,0,0.12)] hover:border-[rgba(0,0,0,0.25)]'
                  }`}>
                  <span>{s.emoji}</span>
                  <span>{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-xl border border-red-100">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={!grade || subjects.length === 0 || saving}
            className="w-full py-3 bg-[#1A1A1A] hover:bg-[#2A2A2A] disabled:bg-[rgba(0,0,0,0.1)] disabled:text-[#9B9B9B] text-white text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : 'בואו נתחיל'}
          </button>
        </div>
      </div>
    </div>
  );
}
